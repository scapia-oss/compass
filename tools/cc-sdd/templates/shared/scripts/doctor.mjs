#!/usr/bin/env node
// kiro-doctor — deterministic health checks for a CONSUMER's kiro plugin setup. Pure Node, zero deps.
// Run by the kiro-doctor skill via ${CLAUDE_SKILL_DIR}/scripts/doctor.mjs (cwd = the project root).
//
// SCOPE (deliberately narrow — see the skill's "What this can't check"):
//   * Repo wiring   — the real silent-breakage class (settings not seeded, no steering). Nothing in
//                     Claude Code surfaces this; this is the highest-value check.
//   * Environment   — node present (gate scripts + doctor), python3 present (no python → ALL hooks
//                     silently fail open), marker dir writable.
//   * Plugin layer  — BEST-EFFORT only: discovered by walking up from the skill dir. Reported, never
//                     fatal; we do NOT enumerate "exactly N skills / these hooks" (that would be a
//                     drift-prone second source of truth that emits false FAILs as the plugin grows).
// It CANNOT prove hooks actually fire at runtime (CC-internal) and is unreachable if NO skill loads.
//
// The kiro dir name is the rendered {{KIRO_DIR}} value; it is a LITERAL here (not the build token)
// because this script stat()s the path at runtime — a token in a stat'd path would break.
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
// Reuse the canonical spec.json validator instead of re-implementing it (single source of truth).
// kiro-gate.mjs + its common.mjs dep are bundled alongside doctor.mjs via the skill's shared-scripts.
// @ts-ignore — sibling .mjs, no type decls
import { validateSpec } from './kiro-gate.mjs';

const KIRO = '.kiro';
export const PASS = 'PASS', WARN = 'WARN', FAIL = 'FAIL', SKIP = 'SKIP';
const mk = (name, status, detail, fix) => ({ name, status, detail, fix });

const hasMd = (dir) => {
  try {
    return readdirSync(dir).some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
};
const countEntries = (dir) => {
  try {
    return readdirSync(dir).length;
  } catch {
    return 0;
  }
};

// ---- Environment ------------------------------------------------------------
const MIN_NODE_MAJOR = 18;

// Resolve the python the hooks would use, mirroring the hooks.json wrapper (python3 first, then a
// bare python). Returns the absolute path, or '' if neither is on PATH. Read-only; never throws.
function resolveHookPython() {
  for (const bin of ['python3', 'python']) {
    try {
      const p = execSync(`command -v ${bin}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (p) return p;
    } catch {
      /* not found — try the next */
    }
  }
  return '';
}

export function checkEnvironment(env = process.env) {
  const out = [];
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= MIN_NODE_MAJOR) {
    out.push(mk('node runtime', PASS, `node ${process.version} (gate scripts + doctor require node)`));
  } else {
    out.push(
      mk('node runtime', WARN, `node ${process.version} is older than v${MIN_NODE_MAJOR}`,
        `The bundled gate scripts use modern ESM (top-level await, readdir withFileTypes); upgrade node to >= ${MIN_NODE_MAJOR}.`),
    );
  }

  // Hooks (git-guard / session-init / feedback-capture) are pure stdlib Python 3 — no node, no pip.
  // Vanilla macOS ships python3 (not a bare `python`), which is why they were moved off node. If
  // NEITHER python3 nor python is on the hook shell's PATH, every hook silently fails open (no block,
  // no learning capture). A version-manager-resolved python (pyenv/asdf) may be invisible to the
  // non-interactive hook shell — same silent-death trap node had — so warn heuristically.
  const py = resolveHookPython();
  if (!py) {
    out.push(
      mk('python reachable for hooks', WARN, 'neither python3 nor python found on PATH',
        'Hooks (git-guard, feedback-capture, session-init) are Python 3 and fail open without it — ' +
        'the git-guard safety net and learning capture are OFF. Install python3 (system or Homebrew).'),
    );
  } else if (/[\\/](\.pyenv|\.asdf)[\\/]/.test(py)) {
    out.push(
      mk('python reachable for hooks', WARN, `python resolved via a version manager: ${py}`,
        'Hooks run in a non-interactive shell that may NOT load pyenv/asdf → hooks silently fail open. ' +
        'Install a system-level python3 (e.g. via Homebrew) or ensure your hook shell sources the version manager.'),
    );
  } else {
    out.push(mk('python reachable for hooks', PASS, `hook python: ${py}`));
  }

  const skillDir = env.CLAUDE_SKILL_DIR;
  if (skillDir && existsSync(skillDir)) {
    out.push(mk('CLAUDE_SKILL_DIR', PASS, skillDir));
  } else {
    out.push(
      mk('CLAUDE_SKILL_DIR', WARN, skillDir ? `set but missing: ${skillDir}` : 'not set',
        'Expected when run as a skill. If you ran the script directly this is fine; otherwise the plugin may not be loaded.'),
    );
  }

  const markerBase = env.CLAUDE_PLUGIN_DATA || os.tmpdir();
  const markerDir = path.join(markerBase, 'kiro-sess');
  try {
    mkdirSync(markerDir, { recursive: true });
    const probe = path.join(markerDir, '.doctor-probe');
    writeFileSync(probe, '');
    unlinkSync(probe);
    out.push(mk('session marker dir writable', PASS, markerDir));
  } catch (e) {
    out.push(
      mk('session marker dir writable', WARN, `${markerDir} not writable (${e && e.code})`,
        'The feedback-capture hook fails open (still emits) if it cannot read a marker, so learnings are not lost — but session-scoped gating is degraded. Check permissions on CLAUDE_PLUGIN_DATA / temp.'),
    );
  }
  return out;
}

// ---- Repo wiring ------------------------------------------------------------
export function checkRepo(cwd = process.cwd()) {
  const out = [];
  const kiro = path.join(cwd, KIRO);
  if (!existsSync(kiro)) {
    out.push(
      mk(`${KIRO}/ present`, FAIL, `no ${KIRO}/ in ${cwd}`,
        `Not a kiro repo (or wrong cwd). Run /kiro:steering or /kiro:spec-init to start.`),
    );
    return out; // nothing else under .kiro to check
  }
  out.push(mk(`${KIRO}/ present`, PASS, kiro));

  const steering = path.join(kiro, 'steering');
  if (hasMd(steering)) {
    out.push(mk('steering present', PASS, `${countEntries(steering)} file(s) in ${KIRO}/steering/`));
  } else {
    out.push(
      mk('steering present', WARN, `no *.md in ${KIRO}/steering/`,
        'Run /kiro:steering to bootstrap product/tech/structure project memory.'),
    );
  }

  // .kiro/settings/ is NO LONGER seeded — skills bundle their own rules, scripts, and templates and
  // resolve them from the plugin (${CLAUDE_SKILL_DIR}). A present .kiro/settings/ now means the user
  // has OPT-IN overrides; its absence is the normal, healthy default. Informational, never a failure.
  const settings = path.join(kiro, 'settings');
  if (existsSync(settings) && countEntries(settings) > 0) {
    out.push(mk('settings overrides', PASS, `${KIRO}/settings/ present — local overrides active (optional)`));
  } else {
    out.push(mk('settings overrides', PASS, 'none — using plugin defaults (skills are self-contained)'));
  }

  const specs = path.join(kiro, 'specs');
  out.push(mk('specs', existsSync(specs) ? PASS : WARN,
    existsSync(specs) ? `${countEntries(specs)} spec(s) in ${KIRO}/specs/` : `no ${KIRO}/specs/ yet`,
    existsSync(specs) ? undefined : 'Expected once you start a feature (/kiro:spec-init). Fine on a fresh repo.'));

  const patterns = path.join(kiro, 'learnings', 'patterns.md');
  out.push(mk('cross-spec learnings', existsSync(patterns) ? PASS : SKIP,
    existsSync(patterns) ? `${KIRO}/learnings/patterns.md present` : 'no cross-spec patterns yet (created on first generalizable learning)'));
  return out;
}

// Recursively collect relative file paths under `root` (depth-limited), or [] if root is absent.
function walkRel(root, max = 6) {
  const out = [];
  const rec = (dir, rel, depth) => {
    if (depth > max) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) rec(path.join(dir, e.name), r, depth + 1);
      else if (e.isFile()) out.push(r);
    }
  };
  rec(root, '', 0);
  return out;
}
const hashFile = (p) => {
  try {
    return createHash('sha1').update(readFileSync(p)).digest('hex');
  } catch {
    return null;
  }
};

// ---- Spec validity (reuse kiro-gate's validator) ----------------------------
export function checkSpecs(cwd = process.cwd()) {
  const specsRoot = path.join(cwd, KIRO, 'specs');
  if (!existsSync(specsRoot)) return [mk('spec.json validity', SKIP, `no ${KIRO}/specs/ yet`)];
  const jsons = walkRel(specsRoot).filter((r) => path.basename(r) === 'spec.json');
  if (!jsons.length) return [mk('spec.json validity', SKIP, 'no spec.json files found')];
  const bad = [];
  for (const rel of jsons) {
    let findings;
    try {
      findings = validateSpec(JSON.parse(readFileSync(path.join(specsRoot, rel), 'utf8')));
    } catch (e) {
      findings = [`unparseable JSON (${e && e.message})`];
    }
    if (findings.length) bad.push(`${path.dirname(rel)}: ${findings.join('; ')}`);
  }
  if (!bad.length) return [mk('spec.json validity', PASS, `${jsons.length} spec(s) valid`)];
  return [mk('spec.json validity', WARN, `${bad.length}/${jsons.length} invalid → ${bad.join(' | ')}`,
    'Fix the spec.json(s) above (re-run the relevant /kiro:spec-* phase, or correct phase/approvals/artifacts).')];
}

// ---- Settings-override freshness (optional) --------------------------------
// .kiro/settings/ is NOT seeded anymore; if present it holds the user's OVERRIDES of bundled
// defaults. An override can intentionally differ from — or unintentionally lag — the plugin's current
// template, so when overrides exist we compare and report (informational). No overrides → nothing to
// check. Only files the user actually overrides are compared (iterate the repo side, not the plugin).
export function checkSettingsFreshness(cwd = process.cwd(), pluginRoot = null) {
  const repoSettings = path.join(cwd, KIRO, 'settings');
  if (!existsSync(repoSettings) || countEntries(repoSettings) === 0) {
    return [mk('settings overrides up-to-date', SKIP, 'no local overrides (using plugin defaults)')];
  }
  if (!pluginRoot) return [mk('settings overrides up-to-date', SKIP, 'plugin root not discoverable; cannot compare overrides')];
  const pluginSettings = path.join(pluginRoot, 'settings');
  if (!existsSync(pluginSettings)) return [mk('settings overrides up-to-date', SKIP, 'plugin settings not present to compare')];
  const drifted = [];
  for (const rel of walkRel(repoSettings)) {
    const pf = path.join(pluginSettings, rel);
    if (existsSync(pf) && hashFile(path.join(repoSettings, rel)) !== hashFile(pf)) drifted.push(rel);
  }
  if (!drifted.length) return [mk('settings overrides up-to-date', PASS, 'local overrides match the installed plugin')];
  return [mk('settings overrides up-to-date', WARN, `${drifted.length} override(s) differ from the current plugin template`,
    `${KIRO}/settings/ overrides intentionally replace plugin defaults; if unintended, re-copy from the plugin. Differs: ${drifted.join(', ')}`)];
}

// ---- Plugin layer (best-effort) --------------------------------------------
// Walk up from the skill dir to find the plugin root (.claude-plugin/plugin.json). Heuristic and
// layout-dependent on purpose-kept NON-fatal: a miss SKIPs, never FAILs.
export function findPluginRoot(startDir) {
  if (!startDir) return null;
  let dir = startDir;
  for (let i = 0; i < 8 && dir; i++) {
    if (existsSync(path.join(dir, '.claude-plugin', 'plugin.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function checkPlugin(root) {
  if (!root) {
    return [mk('plugin install', SKIP, 'plugin root not discoverable from the skill dir (layout-dependent)',
      'Use /plugin to confirm the kiro plugin is installed/enabled and to see its version.')];
  }
  const out = [];
  let version = 'unknown';
  try {
    version = JSON.parse(readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version || 'unknown';
  } catch {
    /* ignore */
  }
  out.push(mk('plugin version', PASS, `kiro v${version} (compare with the marketplace for newer; a bundled doctor cannot self-detect staleness)`));

  // Hooks: report which are wired; never FAIL on a missing one (avoids hardcoding the exact set).
  const hooksPath = path.join(root, 'hooks', 'hooks.json');
  try {
    const hooks = JSON.parse(readFileSync(hooksPath, 'utf8')).hooks || {};
    const present = ['SessionStart', 'PreToolUse', 'UserPromptSubmit'].filter((h) => hooks[h]);
    out.push(mk('hooks wired', present.length ? PASS : WARN, `declared: ${present.join(', ') || 'none'}`,
      present.includes('UserPromptSubmit') ? undefined : 'feedback-capture (UserPromptSubmit) not declared — learning capture in the dead window is off.'));

    // Every hook command that references ${CLAUDE_PLUGIN_ROOT}/scripts/<file> must point at a real file.
    const cmds = JSON.stringify(hooks);
    const refs = [...cmds.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/([A-Za-z0-9._-]+)/g)].map((m) => m[1]);
    const dangling = [...new Set(refs)].filter((f) => !existsSync(path.join(root, 'scripts', f)));
    out.push(mk('hook commands resolve', dangling.length ? WARN : PASS,
      dangling.length ? `command(s) reference missing script(s): ${dangling.join(', ')}` : `all ${new Set(refs).size} hook script ref(s) resolve`,
      dangling.length ? 'A hook points at a script that is not installed; reinstall via /plugin.' : undefined));
  } catch {
    out.push(mk('hooks wired', WARN, `could not read ${hooksPath}`, 'Plugin may be partially installed; reinstall via /plugin.'));
  }

  // Bundled hook scripts present.
  const scriptsDir = path.join(root, 'scripts');
  const want = ['git-guard.py', 'feedback-capture.py', 'session-init.py'];
  const missing = want.filter((s) => !existsSync(path.join(scriptsDir, s)));
  out.push(mk('hook scripts present', missing.length ? WARN : PASS,
    missing.length ? `missing: ${missing.join(', ')}` : `all present (${want.join(', ')})`,
    missing.length ? 'Plugin install looks incomplete; reinstall via /plugin.' : undefined));
  return out;
}

// ---- Render -----------------------------------------------------------------
export function summarize(groups) {
  const all = groups.flatMap((g) => g.checks);
  return {
    fail: all.filter((c) => c.status === FAIL).length,
    warn: all.filter((c) => c.status === WARN).length,
  };
}

export function formatReport(groups) {
  const icon = { PASS: '✓', WARN: '!', FAIL: '✗', SKIP: '·' };
  const lines = ['# kiro-doctor report', ''];
  for (const g of groups) {
    lines.push(`## ${g.title}`);
    for (const c of g.checks) {
      lines.push(`  [${icon[c.status]}] ${c.status}  ${c.name} — ${c.detail}`);
      if (c.fix && (c.status === FAIL || c.status === WARN)) lines.push(`        fix: ${c.fix}`);
    }
    lines.push('');
  }
  const s = summarize(groups);
  lines.push(`Summary: ${s.fail} FAIL, ${s.warn} WARN. ${s.fail ? 'Action required.' : s.warn ? 'Usable; review warnings.' : 'All good.'}`);
  return lines.join('\n');
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  const cwd = process.cwd();
  const root = findPluginRoot(process.env.CLAUDE_SKILL_DIR);
  const groups = [
    { title: 'Environment', checks: checkEnvironment() },
    { title: `Repo wiring (${cwd})`, checks: [...checkRepo(cwd), ...checkSpecs(cwd), ...checkSettingsFreshness(cwd, root)] },
    { title: 'Plugin (best-effort)', checks: checkPlugin(root) },
  ];
  process.stdout.write(formatReport(groups) + '\n');
  process.exit(summarize(groups).fail > 0 ? 1 : 0);
}
