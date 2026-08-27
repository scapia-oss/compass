import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// build-plugin.mjs exports buildPlugin(outDir) and only auto-runs when invoked directly,
// so importing it here is side-effect free.
import { buildPlugin } from '../scripts/build-plugin.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMITTED = path.resolve(__dirname, '../../../plugin');

const walkAbs = (dir: string): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkAbs(abs));
    else out.push(abs);
  }
  return out;
};
const relFiles = (root: string): string[] => walkAbs(root).map((p) => path.relative(root, p)).sort();

describe('plugin build parity', () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = mkdtempSync(path.join(tmpdir(), 'kiro-plugin-build-'));
    await buildPlugin(tmp);
  });

  afterAll(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  // The committed plugin/ directory is a DERIVED ARTIFACT of the source tree
  // (templates/agents/claude-code-skills + templates/shared + templates/plugin). It must always
  // equal a fresh `npm run build:plugin`. If this fails, someone hand-edited plugin/ instead of the
  // source — re-do the change in the source and run `npm run build:plugin`.
  it('committed plugin/ has the same file set as a fresh build', () => {
    expect(relFiles(tmp)).toEqual(relFiles(COMMITTED));
  });

  it('every committed plugin/ file is byte-identical to the fresh build', () => {
    for (const rel of relFiles(COMMITTED)) {
      const committed = readFileSync(path.join(COMMITTED, rel), 'utf8');
      const fresh = readFileSync(path.join(tmp, rel), 'utf8');
      expect(
        fresh === committed,
        `drift in plugin/${rel} — plugin/ is generated; edit the source and run \`npm run build:plugin\` instead of editing plugin/ directly`,
      ).toBe(true);
    }
  });

  it('ships the regression-verifier plugin agent (templates/plugin passthrough works)', () => {
    const rels = relFiles(tmp);
    expect(rels).toContain(path.join('agents', 'regression-verifier.md'));
  });

  it('generates the kiro-implementer agent on the cheaper model (cost split)', () => {
    const agent = readFileSync(path.join(tmp, 'agents', 'kiro-implementer.md'), 'utf8');
    // The implementer (code-writing) must run on Sonnet; reviewer/debugger inherit the session model.
    expect(/^model:\s*sonnet\s*$/m.test(agent)).toBe(true);
    expect(/^name:\s*kiro-implementer\s*$/m.test(agent)).toBe(true);
    // Body is the single-source implementer protocol, not an empty stub.
    expect(agent).toContain('# TDD Task Implementer');
  });
});
