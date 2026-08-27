#!/usr/bin/env node
// Build the `kiro` Claude Code plugin as a DERIVED ARTIFACT from the upstream-shaped source.
// Source layout (templates/agents/claude-code-skills/skills/kiro-*) is never restructured, so the
// fork stays cleanly mergeable with the upstream source. This script renders build-time tokens
// (KIRO_DIR, LANG_CODE), maps `kiro-<x>` -> `<x>` (so invocation is /kiro:<x>), resolves shared-rules
// into each skill's rules/, and writes plugin/ at the repo root.
//
// Usage: npm run build:plugin   (from tools/cc-sdd)

import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, '..');                 // tools/cc-sdd
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');     // repo root
const SKILLS_SRC = path.join(TOOL_ROOT, 'templates/agents/claude-code-skills/skills');
const SHARED_RULES = path.join(TOOL_ROOT, 'templates/shared/settings/rules');
const SHARED_SETTINGS = path.join(TOOL_ROOT, 'templates/shared/settings');
// Shared gate scripts bundled INTO each consuming skill's scripts/ dir (resolved like shared-rules).
// NOT under settings/, so they are never seeded into a repo — the plugin is the source of truth and
// a skill invokes them via ${CLAUDE_SKILL_DIR}/scripts/<file>, which is upgrade-stable.
const SHARED_SCRIPTS = path.join(TOOL_ROOT, 'templates/shared/scripts');
// Document scaffolds (spec/steering templates) bundled INTO each consuming skill's templates/ dir
// (resolved like shared-rules, preserving the specs/|steering/|steering-custom/ subpath). A skill
// reads them via ${CLAUDE_SKILL_DIR}/templates/<subpath> as the batteries-included default, with the
// repo's .kiro/settings/templates/<subpath> as an optional user override — so no seeding is required.
const SHARED_TEMPLATES = path.join(SHARED_SETTINGS, 'templates');
// Plugin-only source tree: files the kiro plugin ships but the npx multi-agent distribution does
// NOT (e.g. Claude Code plugin agents under agents/). Version-controlled here and reproduced on
// every build, so plugin/ stays a pure derived artifact — never hand-edit plugin/ directly.
const PLUGIN_EXTRAS = path.join(TOOL_ROOT, 'templates/plugin');
const DEFAULT_OUT = path.join(REPO_ROOT, 'plugin');

const PLUGIN_NAME = 'kiro';

// Build-time tokens only. Runtime placeholders (FEATURE_NAME, SPEC_PATH, TIMESTAMP, WORKFLOW,
// SPEC_TYPE, PROJECT_DESCRIPTION, NUMBER, ...) are intentionally left intact.
const DICT = { KIRO_DIR: '.kiro', LANG_CODE: 'en' };
const BUILD_TOKENS = Object.keys(DICT);

const render = (s) => s.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => (k in DICT ? DICT[k] : m));
// Convert standalone hyphen command refs to the plugin namespace: /kiro-impl -> /kiro:impl.
// The negative lookahead leaves SCRIPT FILE paths intact (e.g. {SCRIPTS}/kiro-gate.mjs must NOT
// become kiro:gate.mjs — the bundled file is hyphenated, and a colon path would not resolve).
const namespaceCommands = (s) =>
  s.replace(/\/kiro-(?![a-z0-9-]*\.(?:mjs|cjs|js|json))/g, `/${PLUGIN_NAME}:`);

// Hook command for a Python hook script. The hooks are pure stdlib Python 3 so they run on a
// vanilla macOS (which ships python3 but NOT a bare `python`). Detect python3 first, then a bare
// python, and if NEITHER exists FAIL OPEN (exit 0 — never block a session over a missing runtime):
// git-guard absent → the Bash call is allowed; session-init absent → no marker, so feedback-capture
// later fails open and over-fires (the safe direction); feedback-capture absent → silent. `exec`
// replaces the shell with python so the script's own exit code (e.g. git-guard's 2) propagates, and
// stdin (the hook JSON payload) is preserved. ${CLAUDE_PLUGIN_ROOT} is expanded by the runtime shell.
const pyHookCommand = (script) =>
  'if command -v python3 >/dev/null 2>&1; then PY=python3; ' +
  'elif command -v python >/dev/null 2>&1; then PY=python; else exit 0; fi; ' +
  `exec "$PY" "\${CLAUDE_PLUGIN_ROOT}/scripts/${script}"`;

const parseSharedList = (content, key) => {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const meta = fm[1].match(/^metadata:\s*$/m);
  if (!meta) return [];
  const keyRe = new RegExp(`^\\s+${key}:\\s*"?([^"]*)"?\\s*$`);
  for (const line of fm[1].slice(meta.index + meta[0].length).split('\n')) {
    if (/^\S/.test(line)) break;
    const m = line.match(keyRe);
    if (m) return m[1].trim() ? m[1].split(',').map((x) => x.trim()).filter(Boolean) : [];
  }
  return [];
};
const parseSharedRules = (content) => parseSharedList(content, 'shared-rules');
const parseSharedScripts = (content) => parseSharedList(content, 'shared-scripts');
const parseSharedTemplates = (content) => parseSharedList(content, 'shared-templates');

const renderCopyDir = async (src, dest, transform = render) => {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await renderCopyDir(s, d, transform);
    else await writeFile(d, transform(await readFile(s, 'utf8')));
  }
};

export const buildPlugin = async (OUT = DEFAULT_OUT) => {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, '.claude-plugin'), { recursive: true });

  const pkg = JSON.parse(await readFile(path.join(TOOL_ROOT, 'package.json'), 'utf8'));
  await writeFile(
    path.join(OUT, '.claude-plugin', 'plugin.json'),
    JSON.stringify(
      {
        name: PLUGIN_NAME,
        version: pkg.version,
        description: 'Kiro workflow for Compass spec-driven development in Claude Code.',
        author: { name: 'Compass Maintainers' },
        homepage: 'https://github.com/compass-sdd/compass',
      },
      null,
      2,
    ) + '\n',
  );

  const dirs = (await readdir(SKILLS_SRC, { withFileTypes: true })).filter((e) => e.isDirectory());
  const mapped = [];
  for (const e of dirs) {
    const src = path.join(SKILLS_SRC, e.name);
    const name = e.name.replace(/^kiro-/, '');
    const dest = path.join(OUT, 'skills', name);

    // Per-file transform: render build tokens, namespace command refs, and rewrite the
    // frontmatter `name:` to the de-prefixed skill name so it matches the plugin skill dir.
    const tx = (txt) => namespaceCommands(render(txt)).replace(`name: ${e.name}\n`, `name: ${name}\n`);
    await renderCopyDir(src, dest, tx);

    // Resolve shared-rules into the skill's own rules/ dir (plugin skills are self-contained).
    const skillMd = await readFile(path.join(src, 'SKILL.md'), 'utf8');
    for (const rule of parseSharedRules(skillMd)) {
      const rsrc = path.join(SHARED_RULES, rule);
      await mkdir(path.join(dest, 'rules'), { recursive: true });
      await writeFile(path.join(dest, 'rules', rule), namespaceCommands(render(await readFile(rsrc, 'utf8'))));
    }

    // Resolve shared-scripts into the skill's own scripts/ dir, so the skill can run them via
    // ${CLAUDE_SKILL_DIR}/scripts/<file> (the documented, upgrade-stable path) with zero seeding.
    for (const script of parseSharedScripts(skillMd)) {
      const ssrc = path.join(SHARED_SCRIPTS, script);
      await mkdir(path.join(dest, 'scripts'), { recursive: true });
      // Scripts are CODE — only render build tokens; do NOT namespaceCommands them. Namespacing
      // (/kiro- -> /kiro:) is for command refs in prose and would corrupt an import path or
      // identifier like `import ... from './kiro-gate.mjs'` into `'./kiro:gate.mjs'`.
      await writeFile(path.join(dest, 'scripts', script), render(await readFile(ssrc, 'utf8')));
    }

    // Resolve shared-templates into the skill's own templates/ dir, preserving the subpath
    // (e.g. specs/design-hld.md, or a whole dir like steering/). Built identically to the settings
    // copy below (render + namespace) so a skill's bundled default is byte-for-byte the same scaffold
    // a repo override would replace.
    for (const tpl of parseSharedTemplates(skillMd)) {
      const tsrc = path.join(SHARED_TEMPLATES, tpl);
      const tdest = path.join(dest, 'templates', tpl);
      if ((await stat(tsrc)).isDirectory()) {
        await renderCopyDir(tsrc, tdest, (s) => namespaceCommands(render(s)));
      } else {
        await mkdir(path.dirname(tdest), { recursive: true });
        await writeFile(tdest, namespaceCommands(render(await readFile(tsrc, 'utf8'))));
      }
    }
    mapped.push(name);
  }

  // Ship the COMPLETE shared settings (all rules + all templates) as a reference/override source —
  // a user who wants to customize can copy a file from here into their repo's .kiro/settings/. It is
  // NO LONGER seeded or read at runtime (skills bundle their own rules/scripts/templates); kept for
  // discoverability and the npx install path. (Candidate for pruning once npx no longer needs it.)
  await renderCopyDir(SHARED_SETTINGS, path.join(OUT, 'settings'), (s) => namespaceCommands(render(s)));

  // SessionStart hook: NO seeding. Skills are fully self-contained — each bundles its own rules,
  // scripts, and document templates (resolved via ${CLAUDE_SKILL_DIR}), with the repo's
  // .kiro/settings/* as an OPTIONAL user override. The plugin therefore copies NOTHING into a
  // consumer repo; the only SessionStart action is recording a session marker for feedback-capture.
  await mkdir(path.join(OUT, 'hooks'), { recursive: true });
  await writeFile(
    path.join(OUT, 'hooks', 'hooks.json'),
    JSON.stringify(
      {
        hooks: {
          SessionStart: [
            {
              hooks: [
                // session-init: record this session's start time (marker OUTSIDE the repo) so the
                // UserPromptSubmit feedback-capture hook can tell "SDD work happened this session"
                // from a plain chit-chat session. This is the ONLY SessionStart action — the plugin
                // never writes into the repo. Source: templates/plugin/scripts/session-init.py.
                {
                  type: 'command',
                  command: pyHookCommand('session-init.py'),
                },
              ],
            },
          ],
          // git-guard: makes the impl loop's destructive-git prohibitions physically impossible.
          // A denied Bash call (git add -A / reset --hard / checkout . / clean -f / restore .)
          // never runs. It is a HOOK (not a skill), so it can use ${CLAUDE_PLUGIN_ROOT} to reach
          // the bundled, never-seeded script. Source: templates/plugin/scripts/git-guard.py.
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command: pyHookCommand('git-guard.py'),
                },
              ],
            },
          ],
          // feedback-capture: closes the out-of-window learning-capture gap. Directional
          // corrections often arrive in the turn AFTER an autonomous skill run (/kiro:impl) has
          // returned — when no skill is in force, so no in-skill "Record Feedback" step can fire.
          // A UserPromptSubmit hook runs in exactly that dead window and injects a terse self-check
          // (its stdout is added to context on exit 0). Smart gate: emits only when SDD work happened
          // THIS session (a .kiro/ write at/after the session-init marker) — session-scoped, no time
          // window, fails OPEN on any uncertainty so a learning is never silently missed. Read-only
          // and ALWAYS exits 0 (exit 2 on UserPromptSubmit would erase the user's prompt). HOOK, so it
          // uses ${CLAUDE_PLUGIN_ROOT}. Source: templates/plugin/scripts/feedback-capture.py.
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: 'command',
                  command: pyHookCommand('feedback-capture.py'),
                },
              ],
            },
          ],
        },
      },
      null,
      2,
    ) + '\n',
  );

  // Plugin-only extras (Claude Code plugin agents, etc.). Sourced from templates/plugin/ and
  // rendered into OUT preserving structure (templates/plugin/agents/x.md -> OUT/agents/x.md).
  // The npx distribution (src/agents/registry.ts) never reads this tree, so these stay plugin-only.
  let extras = [];
  try {
    if ((await stat(PLUGIN_EXTRAS)).isDirectory()) {
      await renderCopyDir(PLUGIN_EXTRAS, OUT, (s) => namespaceCommands(render(s)));
    }
  } catch { /* no plugin extras tree */ }

  // Generate the kiro-implementer plugin agent from the SINGLE-SOURCE implementer protocol
  // (kiro-impl/templates/implementer-prompt.md), so the agent body never drifts from the template
  // the other distributions use. The agent runs the code-writing step on a cost-efficient model
  // (Sonnet); reviewer/debugger/orchestrator stay on the session model (Opus) by inheriting.
  const implBody = await readFile(
    path.join(SKILLS_SRC, 'kiro-impl', 'templates', 'implementer-prompt.md'),
    'utf8',
  );
  const IMPLEMENTER_FRONTMATTER =
    '---\n' +
    'name: kiro-implementer\n' +
    'description: TDD implementation subagent for one kiro task or milestone. Writes code and tests on a cost-efficient model (Sonnet). Dispatched by the kiro-impl skill; reviewer/debugger stay on the stronger model.\n' +
    'model: sonnet\n' +
    'tools: Read, Edit, MultiEdit, Write, Bash, Glob, Grep\n' +
    '---\n\n';
  await mkdir(path.join(OUT, 'agents'), { recursive: true });
  await writeFile(
    path.join(OUT, 'agents', 'kiro-implementer.md'),
    IMPLEMENTER_FRONTMATTER + namespaceCommands(render(implBody)),
  );

  try {
    extras = (await readdir(path.join(OUT, 'agents'))).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  } catch { /* no agents/ */ }

  // Validation: no build-time token should survive in the plugin output.
  const leftovers = [];
  const scan = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await scan(p);
      else {
        const t = await readFile(p, 'utf8');
        for (const tok of BUILD_TOKENS) if (t.includes(`{{${tok}}}`)) leftovers.push(`${p}: {{${tok}}}`);
      }
    }
  };
  await scan(OUT);
  if (leftovers.length) {
    console.error('Unrendered build tokens:\n' + leftovers.join('\n'));
    process.exit(1);
  }

  console.log(`Built plugin "${PLUGIN_NAME}" v${pkg.version} → ${path.relative(REPO_ROOT, OUT)}/`);
  console.log(`Skills (${mapped.length}): ${mapped.sort().join(', ')}`);
  if (extras.length) console.log(`Agents (${extras.length}): ${extras.sort().join(', ')}`);
  return { skills: mapped.sort(), agents: extras.sort() };
};

// Run only when invoked directly (not when imported by tests).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildPlugin().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
