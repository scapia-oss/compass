import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The hooks are now pure-stdlib Python 3 scripts. We test them the way the harness invokes them:
// pipe a JSON payload on stdin, read stdout + exit code. This exercises the real CLI contract
// (stdin parsing, the session-scoped gate, the fail-open paths) end-to-end, not a JS reimplementation.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.resolve(__dirname, '../templates/plugin/scripts');
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FC_SOURCE = path.join(SCRIPTS, 'feedback-capture.py');
const SI_SOURCE = path.join(SCRIPTS, 'session-init.py');
const BUILT_HOOKS = path.join(REPO_ROOT, 'plugin/hooks/hooks.json');
const BUILT_FC = path.join(REPO_ROOT, 'plugin/scripts/feedback-capture.py');
const BUILT_SI = path.join(REPO_ROOT, 'plugin/scripts/session-init.py');

// Resolve the python the hooks use (python3 first, then a bare python) — matches the hooks.json wrapper.
const PYTHON = (() => {
  for (const bin of ['python3', 'python']) {
    const r = spawnSync(bin, ['--version']);
    if (!r.error) return bin;
  }
  return 'python3';
})();

function runHook(script: string, payload: unknown, env: Record<string, string>) {
  const r = spawnSync(PYTHON, [path.join(SCRIPTS, script)], {
    input: JSON.stringify(payload),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// Isolated, per-test marker base so CLAUDE_PLUGIN_DATA/kiro-sess never collides between tests.
function makeMarkerBase(): string {
  const base = mkdtempSync(path.join(tmpdir(), 'fc-marker-'));
  mkdirSync(path.join(base, 'kiro-sess'), { recursive: true });
  return base;
}
function writeStartMarker(base: string, sessionId: string, mtimeSec: number) {
  const f = path.join(base, 'kiro-sess', `${sessionId}.start`);
  writeFileSync(f, '');
  utimesSync(f, mtimeSec, mtimeSec);
  return f;
}
function makeRepo(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'fc-repo-'));
  mkdirSync(path.join(dir, '.kiro', 'specs', 'feat'), { recursive: true });
  mkdirSync(path.join(dir, '.kiro', 'settings'), { recursive: true });
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
const touch = (p: string, mtimeSec: number) => {
  writeFileSync(p, 'x');
  utimesSync(p, mtimeSec, mtimeSec);
};
// Emit == the hook printed the reminder (non-empty stdout); silent == empty stdout. Always exits 0.
const emitted = (script: string, payload: unknown, env: Record<string, string>) => {
  const r = runHook(script, payload, env);
  expect(r.status).toBe(0); // UserPromptSubmit must NEVER exit non-zero
  return r.stdout.trim().length > 0 ? r.stdout : '';
};

describe('feedback-capture session-scoped gate (via python subprocess)', () => {
  it('non-kiro repo → silent', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'fc-nokiro-'));
    const base = makeMarkerBase();
    try {
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: 'sess-1' }, { CLAUDE_PLUGIN_DATA: base })).toBe('');
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('kiro repo, SDD write AFTER session start → emit (armed)', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const sid = 'sess-arm';
    try {
      writeStartMarker(base, sid, 1000); // session started at t=1000
      touch(path.join(dir, '.kiro', 'specs', 'feat', 'requirements.md'), 2000); // written later
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: sid }, { CLAUDE_PLUGIN_DATA: base })).toMatch(/learnings\.md/);
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('kiro repo, no SDD write since session start → silent', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const sid = 'sess-quiet';
    try {
      touch(path.join(dir, '.kiro', 'specs', 'feat', 'requirements.md'), 1000); // old, pre-session
      writeStartMarker(base, sid, 2000); // session started AFTER the only spec file
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: sid }, { CLAUDE_PLUGIN_DATA: base })).toBe('');
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('same-second write counts (>= comparison, no granularity miss)', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const sid = 'sess-eq';
    try {
      writeStartMarker(base, sid, 1500);
      touch(path.join(dir, '.kiro', 'specs', 'feat', 'design-hld.md'), 1500); // exactly at start
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: sid }, { CLAUDE_PLUGIN_DATA: base })).not.toBe('');
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('ignores .kiro/settings writes (the SessionStart cp must not arm)', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const sid = 'sess-settings';
    try {
      writeStartMarker(base, sid, 1000);
      touch(path.join(dir, '.kiro', 'settings', 'rules.md'), 5000); // only settings changed
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: sid }, { CLAUDE_PLUGIN_DATA: base })).toBe('');
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('FAILS OPEN when the start marker is missing (resumed/pruned)', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    try {
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: 'sess-no-marker-xyz' }, { CLAUDE_PLUGIN_DATA: base })).not.toBe('');
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('FAILS OPEN when session id is absent', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    try {
      expect(emitted('feedback-capture.py', { cwd: dir, session_id: '' }, { CLAUDE_PLUGIN_DATA: base })).not.toBe('');
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe('session-init (via python subprocess)', () => {
  it('writes a start marker for a kiro repo + session id', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const sid = 'sess-write';
    try {
      const r = runHook('session-init.py', { cwd: dir, session_id: sid }, { CLAUDE_PLUGIN_DATA: base });
      expect(r.status).toBe(0);
      expect(existsSync(path.join(base, 'kiro-sess', `${sid}.start`))).toBe(true);
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('does NOT write a marker for a non-kiro repo', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'si-nokiro-'));
    const base = makeMarkerBase();
    try {
      runHook('session-init.py', { cwd: dir, session_id: 'sess-x' }, { CLAUDE_PLUGIN_DATA: base });
      expect(existsSync(path.join(base, 'kiro-sess', 'sess-x.start'))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('prunes markers older than 7 days, keeps fresh ones', () => {
    const { dir, cleanup } = makeRepo();
    const base = makeMarkerBase();
    const day = 86400;
    const nowSec = Math.floor(Date.now() / 1000);
    const oldF = path.join(base, 'kiro-sess', 'prune-old.start');
    const freshF = path.join(base, 'kiro-sess', 'prune-fresh.start');
    writeFileSync(oldF, '');
    writeFileSync(freshF, '');
    utimesSync(oldF, nowSec - 8 * day, nowSec - 8 * day); // 8 days old
    utimesSync(freshF, nowSec - 1 * day, nowSec - 1 * day); // 1 day old
    try {
      runHook('session-init.py', { cwd: dir, session_id: 'sess-prune' }, { CLAUDE_PLUGIN_DATA: base });
      expect(existsSync(oldF)).toBe(false);
      expect(existsSync(freshF)).toBe(true);
    } finally {
      cleanup();
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe('script safety invariants (source-level)', () => {
  for (const [name, src] of [['feedback-capture', readFileSync(FC_SOURCE, 'utf8')], ['session-init', readFileSync(SI_SOURCE, 'utf8')]] as const) {
    it(`${name}: never exits non-zero`, () => {
      const exits = src.match(/sys\.exit\((\d+)\)/g) ?? [];
      expect(exits.length).toBeGreaterThan(0);
      for (const e of exits) expect(e).toBe('sys.exit(0)');
    });
  }
  it('feedback-capture is read-only (no file/dir mutations)', () => {
    const src = readFileSync(FC_SOURCE, 'utf8');
    expect(src).not.toMatch(/os\.makedirs|os\.remove|os\.unlink|shutil\.|open\([^)]*["'][wax]/);
  });
});

describe('built plugin wiring (additive)', () => {
  const hooks = JSON.parse(readFileSync(BUILT_HOOKS, 'utf8')).hooks;

  it('keeps SessionStart + PreToolUse and adds UserPromptSubmit', () => {
    expect(hooks.SessionStart).toBeTruthy();
    expect(hooks.PreToolUse).toBeTruthy();
    expect(hooks.UserPromptSubmit).toBeTruthy();
  });

  it('SessionStart only records the session marker — it NEVER copies into the repo', () => {
    const cmds = hooks.SessionStart[0].hooks.map((h: any) => h.command);
    const joined = cmds.join(' ');
    // Skills are self-contained (rules/scripts/templates bundled), so the plugin seeds nothing.
    expect(joined).not.toContain('cp -Rn');
    expect(joined).not.toContain('.kiro/settings');
    // The sole SessionStart action is the session-init marker (outside the repo).
    expect(cmds).toHaveLength(1);
    expect(joined).toContain('${CLAUDE_PLUGIN_ROOT}/scripts/session-init.py');
  });

  it('hooks invoke python via a python3-then-python detect wrapper (fail open if absent)', () => {
    const all = JSON.stringify(hooks);
    expect(all).toContain('command -v python3');
    expect(all).toContain('command -v python');
    expect(all).not.toMatch(/node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts/); // no node-invoked hook scripts left
  });

  it('PreToolUse invokes git-guard.py; UserPromptSubmit invokes feedback-capture.py', () => {
    expect(JSON.stringify(hooks.PreToolUse)).toContain('${CLAUDE_PLUGIN_ROOT}/scripts/git-guard.py');
    expect(hooks.UserPromptSubmit[0].hooks[0].command as string).toContain('${CLAUDE_PLUGIN_ROOT}/scripts/feedback-capture.py');
  });

  it('both scripts shipped with build tokens rendered (no leftover {{}})', () => {
    for (const f of [BUILT_FC, BUILT_SI]) {
      expect(readFileSync(f, 'utf8'), `${f} has unrendered token`).not.toMatch(/\{\{/);
    }
    expect(readFileSync(BUILT_FC, 'utf8')).toContain('.kiro/learnings/patterns.md');
  });
});
