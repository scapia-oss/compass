import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// check-retro-session.py answers "is this the session that did the work?" so /kiro:retrospective can
// warn before producing a transcript-less report. Real branching logic, so it gets a real test —
// invoked exactly as the skill invokes it: repo path as argv, markers found via CLAUDE_PLUGIN_DATA.
//
// The signal is NOT "do spec files exist" — in the case this exists for, they always do. It is
// "was any spec artifact written AFTER this session started".
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '../templates/shared/scripts/check-retro-session.py');

const PYTHON = (() => {
  for (const bin of ['python3', 'python']) {
    if (!spawnSync(bin, ['--version']).error) return bin;
  }
  return 'python3';
})();

const HOUR = 3600;
const now = () => Date.now() / 1000;

function scenario(opts: { source?: string; markerCwd?: string; specWrittenAgoSec?: number; legacy?: boolean }) {
  const data = mkdtempSync(path.join(tmpdir(), 'rsg-data-'));
  const repo = mkdtempSync(path.join(tmpdir(), 'rsg-repo-'));
  const specs = path.join(repo, '.kiro', 'specs', 'feat');
  mkdirSync(specs, { recursive: true });

  // The spec artifact always EXISTS. Only its mtime varies — that is the whole point.
  const artifact = path.join(specs, 'requirements.md');
  writeFileSync(artifact, '# reqs');
  if (opts.specWrittenAgoSec !== undefined) {
    const t = now() - opts.specWrittenAgoSec;
    utimesSync(artifact, t, t);
  }

  const markerDir = path.join(data, 'kiro-sess');
  mkdirSync(markerDir, { recursive: true });
  if (opts.source !== undefined || opts.legacy) {
    const marker = path.join(markerDir, 'sess-a.start');
    // A legacy marker (pre-source) is an empty file — must read back as undeterminable, not as a guess.
    writeFileSync(marker, opts.legacy ? '' : JSON.stringify({ source: opts.source, cwd: opts.markerCwd ?? repo }));
    const started = now() - HOUR; // session started an hour ago
    utimesSync(marker, started, started);
  }

  const r = spawnSync(PYTHON, [SCRIPT, repo], { env: { ...process.env, CLAUDE_PLUGIN_DATA: data }, encoding: 'utf8' });
  return { verdict: (r.stdout ?? '').split('\n')[0].replace('RETRO_SESSION: ', '').trim(), out: r.stdout ?? '', status: r.status };
}

describe('check-retro-session distinguishes a fresh session from the one that did the work', () => {
  // THE case this gate exists for: same directory, spec files all present, fresh session, retro run
  // as one of the first commands. Presence proves nothing; the artifact predates session start.
  it('flags a fresh session even though the spec files are all there', () => {
    const { verdict, out } = scenario({ source: 'startup', specWrittenAgoSec: 48 * HOUR });
    expect(verdict).toBe('fresh');
    expect(out).toContain('claude -r');
    expect(out).toContain('reconstructed');
  });

  it('passes when a spec artifact was written after this session started', () => {
    expect(scenario({ source: 'startup', specWrittenAgoSec: 60 }).verdict).toBe('same');
  });

  // `claude -r` fires SessionStart again, so a resumed session gets a NEW marker with a CURRENT
  // mtime — every artifact predates it. Without reading `source` the gate would warn precisely the
  // person who resumed correctly, which is worse than not warning at all.
  it('never warns a resumed session, whose work necessarily predates the new marker', () => {
    expect(scenario({ source: 'resume', specWrittenAgoSec: 48 * HOUR }).verdict).toBe('same');
    expect(scenario({ source: 'compact', specWrittenAgoSec: 48 * HOUR }).verdict).toBe('same');
  });

  it('stays quiet rather than guessing when it cannot tell', () => {
    // No marker at all, a legacy marker with no source, an unrecognised source, and a marker that
    // belongs to a different repo — every one of these must be `unknown`, never `fresh`.
    expect(scenario({ specWrittenAgoSec: 48 * HOUR }).verdict).toBe('unknown');
    expect(scenario({ legacy: true, specWrittenAgoSec: 48 * HOUR }).verdict).toBe('unknown');
    expect(scenario({ source: 'something-new', specWrittenAgoSec: 48 * HOUR }).verdict).toBe('unknown');
    expect(scenario({ source: 'startup', markerCwd: '/some/other/repo', specWrittenAgoSec: 48 * HOUR }).verdict).toBe('unknown');
  });

  it('always exits 0 — guidance must never break the skill it advises', () => {
    for (const s of [
      scenario({ source: 'startup', specWrittenAgoSec: 48 * HOUR }),
      scenario({ legacy: true }),
      scenario({}),
    ]) {
      expect(s.status).toBe(0);
    }
  });
});
