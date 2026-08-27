import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// SELF-CONTAINMENT INVARIANT
//
// cc-sdd's own logic — RULES and SCRIPTS — must always load from the installed
// plugin (a skill's own `rules/` and `scripts/` dir, i.e. ${CLAUDE_SKILL_DIR}),
// NEVER from the consumer repo's `.kiro/settings/`. The repo-path form
// `.kiro/settings/rules/<x>` (or the unrendered token `{{KIRO_DIR}}/settings/rules/<x>`)
// means a skill depends on the SessionStart seed copy — exactly the dependency
// we are removing. Templates are different: `.kiro/settings/templates/**` is the
// legitimate user-override location, so it is intentionally NOT forbidden here.
//
// This guard fails the build if any rule/script reference resolves to the repo,
// or if a rule/script referenced from a skill dir was not actually bundled.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, '..');
const PLUGIN = path.resolve(TOOL_ROOT, '../../plugin'); // the shipped marketplace artifact
const CC_SKILLS_SRC = path.join(TOOL_ROOT, 'templates/agents/claude-code-skills/skills');
const SHARED = path.join(TOOL_ROOT, 'templates/shared');

// The universe of rule and script filenames cc-sdd ships.
const RULE_UNIVERSE = readdirSync(path.join(SHARED, 'settings/rules')).filter((f) => f.endsWith('.md'));
const SCRIPT_UNIVERSE = readdirSync(path.join(SHARED, 'scripts'));

const TEXT_EXT = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.txt', '.yaml', '.yml']);

const walk = (dir: string): string[] => {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs));
    else if (TEXT_EXT.has(path.extname(e.name))) out.push(abs);
  }
  return out;
};

// A rule/script that resolves to the consumer repo. Matches both the rendered
// form (`.kiro/settings/rules/...`) and the unrendered source token
// (`{{KIRO_DIR}}/settings/rules/...`). `templates/` is deliberately excluded.
const REPO_LOGIC_PATH = /(?:\.kiro|\{\{KIRO_DIR\}\})\/settings\/(rules|scripts)\//g;

type Violation = { file: string; line: number; text: string };

const scanForRepoLogicPaths = (root: string): Violation[] => {
  const violations: Violation[] = [];
  for (const abs of walk(root)) {
    const lines = readFileSync(abs, 'utf8').split('\n');
    lines.forEach((text, i) => {
      REPO_LOGIC_PATH.lastIndex = 0;
      if (REPO_LOGIC_PATH.test(text)) {
        violations.push({ file: path.relative(root, abs), line: i + 1, text: text.trim() });
      }
    });
  }
  return violations;
};

const fmt = (vs: Violation[]) =>
  vs.map((v) => `  ${v.file}:${v.line}  ${v.text.slice(0, 120)}`).join('\n');

describe('plugin self-containment: rules & scripts never resolve to the consumer repo', () => {
  it('SHIPPED plugin/ has zero rule/script references via a .kiro/settings path', () => {
    const violations = scanForRepoLogicPaths(PLUGIN);
    expect(
      violations.length,
      `Found ${violations.length} rule/script reference(s) pointing at the consumer repo ` +
        `(.kiro/settings/rules|scripts/) in the shipped plugin/. These must load from the skill's ` +
        `own dir instead.\n${fmt(violations)}`,
    ).toBe(0);
  });

  it('SOURCE (claude-code-skills + shared) has zero rule/script references via a settings path', () => {
    const violations = [
      ...scanForRepoLogicPaths(CC_SKILLS_SRC),
      ...scanForRepoLogicPaths(SHARED),
    ];
    expect(
      violations.length,
      `Found ${violations.length} repo-path rule/script reference(s) in the maintained source. ` +
        `Reference rules from the skill dir ("rules/<x>.md from this skill's directory") and add ` +
        `them to shared-rules:; reference rules from inside another rule/template by bare name.\n${fmt(violations)}`,
    ).toBe(0);
  });
});

describe('plugin self-containment: every skill-dir rule/script reference is actually bundled', () => {
  const skillDirs = existsSync(path.join(PLUGIN, 'skills'))
    ? readdirSync(path.join(PLUGIN, 'skills'), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  // For each skill, find references written in the skill-dir form `rules/<name>.md`
  // or `scripts/<name>` (not part of a longer path), restricted to the known
  // rule/script universe, and assert the file is present in that skill's bundle.
  const ruleRef = /(?<![\w/.-])rules\/([a-z][a-z0-9-]*\.md)/g;
  const scriptRef = /(?<![\w/.-])scripts\/([a-z][a-z0-9._-]*)/g;

  it.each(skillDirs)('skill "%s": bundles every rule it references from its own dir', (skill) => {
    const skillMd = path.join(PLUGIN, 'skills', skill, 'SKILL.md');
    if (!existsSync(skillMd)) return;
    const content = readFileSync(skillMd, 'utf8');
    const missing: string[] = [];
    for (const m of content.matchAll(ruleRef)) {
      const name = m[1];
      if (!RULE_UNIVERSE.includes(name)) continue; // not one of our rules; skip
      const bundled = path.join(PLUGIN, 'skills', skill, 'rules', name);
      if (!existsSync(bundled)) missing.push(name);
    }
    expect(
      [...new Set(missing)],
      `skill "${skill}" references rules/<x> from its own dir but they were not bundled ` +
        `(add them to this skill's shared-rules: so the builder copies them in): ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it.each(skillDirs)('skill "%s": bundles every script it references from its own dir', (skill) => {
    const skillMd = path.join(PLUGIN, 'skills', skill, 'SKILL.md');
    if (!existsSync(skillMd)) return;
    const content = readFileSync(skillMd, 'utf8');
    const missing: string[] = [];
    for (const m of content.matchAll(scriptRef)) {
      const name = m[1];
      if (!SCRIPT_UNIVERSE.includes(name)) continue;
      const bundled = path.join(PLUGIN, 'skills', skill, 'scripts', name);
      if (!existsSync(bundled)) missing.push(name);
    }
    expect(
      [...new Set(missing)],
      `skill "${skill}" references scripts/<x> from its own dir but they were not bundled ` +
        `(add them to this skill's shared-scripts:): ${missing.join(', ')}`,
    ).toEqual([]);
  });

  // Rule->rule dependency: a bundled rule that points at a sibling rule (`rules/<x>.md`)
  // only resolves if that sibling is ALSO bundled in the same skill. e.g. architect-questioning.md
  // and architect-critique-loop.md reference codebase-grounding.md — every skill that bundles them
  // must therefore also bundle codebase-grounding.md (add it to the skill's shared-rules:).
  it.each(skillDirs)('skill "%s": bundles every sibling rule its bundled rules reference', (skill) => {
    const rulesDir = path.join(PLUGIN, 'skills', skill, 'rules');
    if (!existsSync(rulesDir)) return;
    const ruleFiles = readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
    const present = new Set(ruleFiles);
    const missing: string[] = [];
    for (const rf of ruleFiles) {
      const content = readFileSync(path.join(rulesDir, rf), 'utf8');
      for (const m of content.matchAll(ruleRef)) {
        const dep = m[1];
        if (!RULE_UNIVERSE.includes(dep)) continue;
        if (!present.has(dep)) missing.push(`${rf} -> ${dep}`);
      }
    }
    expect(
      [...new Set(missing)],
      `skill "${skill}" bundles rules that reference sibling rules which are NOT bundled ` +
        `(add the missing rule(s) to this skill's shared-rules:): ${[...new Set(missing)].join(', ')}`,
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TEMPLATE SELF-CONTAINMENT
//
// Document scaffolds (spec/steering templates) are batteries-included: each consuming skill BUNDLES
// its templates (shared-templates:) into plugin/skills/<x>/templates/<subpath>, read via
// ${CLAUDE_SKILL_DIR}/templates/<subpath>, with the repo's .kiro/settings/templates/<subpath> as an
// OPTIONAL override. So the plugin never needs to seed templates into a repo. These guards ensure:
//   (1) every declared shared-templates entry is actually bundled, and
//   (2) every skill-dir template the SKILL.md reads (templates/specs/<x>) was bundled, and
//   (3) the SessionStart hook copies nothing into the consumer repo.
// ---------------------------------------------------------------------------

// minimal frontmatter shared-templates list parser (file or dir entries)
const parseSharedTemplates = (content: string): string[] => {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const m = fm[1].match(/^\s+shared-templates:\s*"?([^"\n]*)"?\s*$/m);
  if (!m || !m[1].trim()) return [];
  return m[1].split(',').map((x) => x.trim()).filter(Boolean);
};

describe('template self-containment: scaffolds are bundled per skill, repo copy is only an override', () => {
  const skillDirs = existsSync(path.join(PLUGIN, 'skills'))
    ? readdirSync(path.join(PLUGIN, 'skills'), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  it.each(skillDirs)('skill "%s": every declared shared-templates entry is bundled', (skill) => {
    const skillMd = path.join(PLUGIN, 'skills', skill, 'SKILL.md');
    if (!existsSync(skillMd)) return;
    const declared = parseSharedTemplates(readFileSync(skillMd, 'utf8'));
    const missing = declared.filter((entry) => !existsSync(path.join(PLUGIN, 'skills', skill, 'templates', entry)));
    expect(
      missing,
      `skill "${skill}" declares shared-templates not bundled into its templates/ dir: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  // Any `templates/specs/<file>` the SKILL.md reads from its own dir must be bundled there.
  const tplRef = /(?<![\w/.-])templates\/specs\/([a-z][a-z0-9-]*\.(?:md|json))/g;
  it.each(skillDirs)('skill "%s": every templates/specs/<x> it reads is bundled', (skill) => {
    const skillMd = path.join(PLUGIN, 'skills', skill, 'SKILL.md');
    if (!existsSync(skillMd)) return;
    const content = readFileSync(skillMd, 'utf8');
    const missing: string[] = [];
    for (const m of content.matchAll(tplRef)) {
      const rel = path.join('specs', m[1]);
      if (!existsSync(path.join(PLUGIN, 'skills', skill, 'templates', rel))) missing.push(rel);
    }
    expect(
      [...new Set(missing)],
      `skill "${skill}" reads templates/specs/<x> from its own dir but it is not bundled ` +
        `(add it to this skill's shared-templates:): ${[...new Set(missing)].join(', ')}`,
    ).toEqual([]);
  });

  it('the SessionStart hook copies nothing into the consumer repo (no seed)', () => {
    const hooks = JSON.parse(readFileSync(path.join(PLUGIN, 'hooks', 'hooks.json'), 'utf8'));
    const sessionCmds = hooks.hooks.SessionStart.flatMap((g: any) => g.hooks.map((h: any) => h.command)).join(' ');
    expect(sessionCmds).not.toContain('cp ');
    expect(sessionCmds).not.toContain('.kiro/settings');
  });

  // The namespaceCommands transform (/kiro- -> /kiro:) must NOT corrupt a bundled SCRIPT FILENAME.
  // e.g. {SCRIPTS}/kiro-gate.mjs must stay hyphenated; `kiro:gate.mjs` would not resolve to the
  // bundled file and the determinism gate would silently fall back to prose forever.
  // PLUGIN AGENTS ARE NAMESPACED. A bundled agent declared `name: <x>` is callable at runtime ONLY
  // as `kiro:<x>` (the plugin name). A skill that dispatches it via a BARE `subagent_type: <x>` hits
  // "Agent type '<x>' not found" and burns a full failed dispatch before retrying (observed: a
  // 2m52s wasted kiro-implementer dispatch). A bare form is allowed only as the documented npx
  // user-level fallback, and only when the namespaced `kiro:<x>` form is on the SAME line so the
  // model has the correct name to try first. This guard fails if any shipped SKILL.md names a
  // bundled agent via subagent_type without the kiro: form alongside it.
  it('every subagent_type to a bundled agent carries the kiro: namespace (plugin runtime name)', () => {
    const agentsDir = path.join(PLUGIN, 'agents');
    const bundledAgents = existsSync(agentsDir)
      ? readdirSync(agentsDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
      : [];
    const offenders: string[] = [];
    const skillsRoot = path.join(PLUGIN, 'skills');
    const skills = existsSync(skillsRoot)
      ? readdirSync(skillsRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
      : [];
    for (const skill of skills) {
      const skillMd = path.join(skillsRoot, skill, 'SKILL.md');
      if (!existsSync(skillMd)) continue;
      readFileSync(skillMd, 'utf8').split('\n').forEach((line, i) => {
        for (const agent of bundledAgents) {
          const ref = new RegExp(`subagent_type["':=\\s]+\`?(kiro:)?${agent}\\b`, 'g');
          let m: RegExpExecArray | null;
          let bare = false;
          let namespaced = false;
          while ((m = ref.exec(line)) !== null) {
            if (m[1]) namespaced = true;
            else bare = true;
          }
          if (bare && !namespaced) {
            offenders.push(`skills/${skill}/SKILL.md:${i + 1}  subagent_type: ${agent} (should be kiro:${agent})`);
          }
        }
      });
    }
    expect(
      offenders,
      `Found subagent_type reference(s) to a bundled plugin agent missing the kiro: namespace ` +
        `(the runtime name is kiro:<agent>; a bare name fails at dispatch):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('no script filename was namespaced to a colon (kiro:<x>.mjs|js|json) anywhere in plugin/', () => {
    const offenders: string[] = [];
    for (const abs of walk(PLUGIN)) {
      readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
        if (/kiro:[a-z0-9-]+\.(?:mjs|cjs|js|json)/.test(line)) {
          offenders.push(`${path.relative(PLUGIN, abs)}:${i + 1}  ${line.trim().slice(0, 100)}`);
        }
      });
    }
    expect(
      offenders,
      `Found script filename(s) corrupted by command-namespacing (should stay kiro-<x>.<ext>):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
