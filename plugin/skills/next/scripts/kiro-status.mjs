#!/usr/bin/env node
// kiro-status — deterministic lifecycle snapshot over .kiro/specs. Pure Node, zero deps.
//
// Subcommands:
//   summary [feature|path] [--json] [--compact]
//   next [feature|path] [--json] [--compact]
//   active [--json] [--compact]
//   list [--json]
//
// Read-only by design. This is the source of truth for terminal status, "what next?",
// and future statusline integrations.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { resolveSpecDir, readSpecJson, parseTasks, fail } from './common.mjs';

const KIRO = '.kiro';
const SPEC_CATEGORIES = ['features', 'bugs', 'tech-debt', 'chores'];
const CHECK = '✓';
const WARN = '!';
const OPEN = '○';
const SKIP = '⊘';
const ACTIVE = '…';

const COMMANDS = {
  requirements: 'spec-requirements',
  bugfix_analysis: 'spec-requirements',
  design_hld: 'spec-design-hld',
  design_lld: 'spec-design-lld',
  design: 'spec-design',
  validate_design: 'validate-design',
  tasks: 'spec-tasks',
  implementation: 'impl',
  validate_impl: 'validate-impl',
  retrospective: 'retrospective',
};

const LABELS = {
  requirements: 'REQ',
  bugfix_analysis: 'BUG',
  design_hld: 'HLD',
  design_lld: 'LLD',
  design: 'DESIGN',
  validate_design: 'DESIGN REVIEW',
  tasks: 'TASKS',
  implementation: 'IMPL',
  validate_impl: 'VALIDATE',
  retrospective: 'RETRO',
};

const APPROVAL_KEYS = {
  requirements: 'requirements',
  bugfix_analysis: 'requirements',
  design_hld: 'design_hld',
  design_lld: 'design_lld',
  design: 'design',
  tasks: 'tasks',
};

const FILES = {
  requirements: ['requirements.md'],
  bugfix_analysis: ['bugfix.md', 'requirements.md'],
  design_hld: ['design-hld.md'],
  design_lld: ['design-lld.md'],
  design: ['design.md'],
  validate_design: ['design-review.md'],
  tasks: ['tasks.md'],
  validate_impl: ['impl-validation.md'],
};

function artifactEnabled(spec, phase) {
  if (!spec.artifacts || typeof spec.artifacts !== 'object') return true;
  if (phase === 'validate_design') {
    return Boolean(spec.required_gates?.design_review)
      || Boolean(spec.artifacts.design_review)
      || Boolean(spec.artifacts.design_hld)
      || Boolean(spec.artifacts.design_lld)
      || Boolean(spec.artifacts.design);
  }
  if (phase === 'validate_impl') return Boolean(spec.required_gates?.impl_validation);
  if (phase === 'retrospective') return Boolean(spec.required_gates?.retrospective);
  if (phase === 'implementation') return Boolean(spec.artifacts.tasks);
  return spec.artifacts[phase] === true;
}

function phaseOrder(spec) {
  const type = spec.spec_type || 'feature';
  const workflow = spec.workflow || 'requirements-first';
  if (type === 'bugfix') {
    return ['bugfix_analysis', 'design_hld', 'validate_design', 'tasks', 'implementation', 'validate_impl', 'retrospective'];
  }
  if (workflow === 'design-first') {
    return ['design_hld', 'design_lld', 'requirements', 'validate_design', 'tasks', 'implementation', 'validate_impl', 'retrospective'];
  }
  return ['requirements', 'design_hld', 'design_lld', 'validate_design', 'tasks', 'implementation', 'validate_impl', 'retrospective'];
}

function hasAnyFile(dir, phase) {
  return (FILES[phase] || []).some((f) => existsSync(path.join(dir, f)));
}

function approval(spec, phase) {
  const key = APPROVAL_KEYS[phase];
  return key ? spec.approvals?.[key] : undefined;
}

function commandFired(spec, names) {
  const set = new Set(names);
  return Array.isArray(spec.commands_fired) && spec.commands_fired.some((c) => set.has(c.command));
}

function taskSummary(dir) {
  const file = path.join(dir, 'tasks.md');
  if (!existsSync(file)) return null;
  const parsed = parseTasks(readFileSync(file, 'utf8'));
  const counts = { pending: 0, inprogress: 0, done: 0, descoped: 0 };
  for (const t of parsed.tasks) {
    if (t.marker === ' ') counts.pending++;
    else if (t.marker === '-') counts.inprogress++;
    else if (t.marker === 'x') counts.done++;
    else if (t.marker === '~') counts.descoped++;
  }
  return {
    total: parsed.tasks.length,
    done: counts.done,
    descoped: counts.descoped,
    pending: counts.pending,
    inprogress: counts.inprogress,
    malformed: parsed.malformed.length,
    allDone: parsed.malformed.length === 0 && parsed.tasks.length > 0
      && counts.done + counts.descoped === parsed.tasks.length,
  };
}

function retroComplete(dir, spec) {
  if (commandFired(spec, ['kiro-retrospective', 'retrospective'])) return true;
  const feature = spec.feature_name || path.basename(dir);
  const feedback = path.join(process.cwd(), KIRO, 'feedback');
  try {
    return readdirSync(feedback).some((f) => f.startsWith('feedback-') && f.includes(feature));
  } catch {
    return false;
  }
}

function phaseState(dir, spec, phase, tasks) {
  if (!artifactEnabled(spec, phase)) return { phase, label: LABELS[phase], state: 'skipped', evidence: 'artifact disabled' };
  if (phase === 'implementation') {
    if (tasks?.allDone) return { phase, label: LABELS[phase], state: 'complete', evidence: 'tasks all done' };
    if (tasks && (tasks.done || tasks.inprogress || tasks.descoped)) return { phase, label: LABELS[phase], state: 'in-progress', evidence: 'tasks.md' };
    return { phase, label: LABELS[phase], state: 'pending', evidence: 'tasks.md pending' };
  }
  if (phase === 'validate_design') {
    const complete = hasAnyFile(dir, phase) || commandFired(spec, ['kiro-validate-design', 'validate-design']);
    return { phase, label: LABELS[phase], state: complete ? 'complete' : 'pending', evidence: complete ? 'design-review.md or commands_fired[]' : 'required gate' };
  }
  if (phase === 'validate_impl') {
    const complete = hasAnyFile(dir, phase) || commandFired(spec, ['kiro-validate-impl', 'validate-impl']);
    return { phase, label: LABELS[phase], state: complete ? 'complete' : 'pending', evidence: complete ? 'impl-validation.md or commands_fired[]' : 'required gate' };
  }
  if (phase === 'retrospective') {
    const complete = retroComplete(dir, spec);
    return { phase, label: LABELS[phase], state: complete ? 'complete' : 'pending', evidence: complete ? 'feedback file or commands_fired[]' : 'required gate' };
  }
  const ap = approval(spec, phase);
  if (ap?.approved) return { phase, label: LABELS[phase], state: 'complete', evidence: `approvals.${APPROVAL_KEYS[phase]}.approved` };
  if (ap?.generated || hasAnyFile(dir, phase)) return { phase, label: LABELS[phase], state: 'in-progress', evidence: `${(FILES[phase] || [])[0] || 'artifact'} exists/generated` };
  return { phase, label: LABELS[phase], state: 'pending', evidence: `${(FILES[phase] || [])[0] || phase} missing` };
}

function commandFor(phase, feature) {
  if (!phase || phase === 'complete') return 'none';
  const cmd = COMMANDS[phase];
  if (!cmd) return 'unknown';
  return `${cmd} ${feature}`;
}

function nextWork(phases, feature) {
  const idx = phases.findIndex((p) => p.state !== 'complete' && p.state !== 'skipped');
  if (idx === -1) return { phase: 'complete', command: 'none', reason: 'all enabled phases and required gates complete' };
  const current = phases[idx];
  const blocksHere = current.state === 'pending'
    || ['validate_design', 'implementation', 'validate_impl', 'retrospective'].includes(current.phase);
  if (blocksHere) {
    return { phase: current.phase, command: commandFor(current.phase, feature), reason: current.evidence };
  }
  const next = phases.slice(idx + 1).find((p) => p.state !== 'skipped');
  if (!next) return { phase: current.phase, command: commandFor(current.phase, feature), reason: current.evidence };
  return {
    phase: next.phase,
    command: commandFor(next.phase, feature),
    reason: `${current.label} is generated but not approved; the next command will surface the review/approval gate`,
  };
}

function findSpecDirs(cwd = process.cwd()) {
  const root = path.join(cwd, KIRO, 'specs');
  const dirs = [];
  const visit = (dir, depth) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const child = path.join(dir, e.name);
      if (existsSync(path.join(child, 'spec.json'))) dirs.push(child);
      else if (depth < 2) visit(child, depth + 1);
    }
  };
  for (const cat of SPEC_CATEGORIES) visit(path.join(root, cat), 0);
  visit(root, 0);
  return [...new Set(dirs)];
}

function analyze(dir) {
  const spec = readSpecJson(dir);
  const feature = spec.feature_name || path.basename(dir);
  const tasks = taskSummary(dir);
  if (spec.kind === 'linked-spec' && spec.role === 'satellite') {
    return {
      feature,
      dir,
      spec_type: spec.spec_type || 'linked-spec',
      workflow: spec.workflow || 'linked',
      mode: spec.implementation_mode || 'standard',
      linked: true,
      phases: [],
      tasks,
      next: {
        phase: 'linked',
        command: 'run spec-status in the parent repo',
        reason: 'satellite spec points at a parent source of truth',
      },
      last_command: lastCommand(spec),
      evidence: ['spec.json', 'spec-link.md'],
      complete: false,
    };
  }
  const phases = phaseOrder(spec).filter((p) => artifactEnabled(spec, p)).map((p) => phaseState(dir, spec, p, tasks));
  const next = nextWork(phases, feature);
  const complete = next.phase === 'complete';
  return {
    feature,
    dir,
    spec_type: spec.spec_type || 'feature',
    workflow: spec.workflow || 'requirements-first',
    mode: spec.implementation_mode || 'standard',
    linked: false,
    phases,
    tasks,
    next,
    last_command: lastCommand(spec),
    evidence: evidenceList(dir, spec),
    complete,
  };
}

function lastCommand(spec) {
  if (!Array.isArray(spec.commands_fired) || spec.commands_fired.length === 0) return null;
  const sorted = [...spec.commands_fired].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const last = sorted[sorted.length - 1];
  return { command: last.command, phase: last.phase, timestamp: last.timestamp };
}

function evidenceList(dir, spec) {
  const out = ['spec.json'];
  for (const f of ['requirements.md', 'bugfix.md', 'design.md', 'design-hld.md', 'design-lld.md', 'design-review.md', 'tasks.md', 'impl-validation.md']) {
    if (existsSync(path.join(dir, f))) out.push(f);
  }
  if (Array.isArray(spec.commands_fired) && spec.commands_fired.length) out.push('commands_fired[]');
  return out;
}

function symbol(state) {
  if (state === 'complete') return CHECK;
  if (state === 'in-progress') return ACTIVE;
  if (state === 'skipped') return SKIP;
  if (state === 'pending') return OPEN;
  return WARN;
}

function progressLine(phases) {
  return phases.map((p) => `[${p.label} ${symbol(p.state)}]`).join(' ');
}

function renderCard(summary, onlyNext = false) {
  const lines = [];
  lines.push(`Kiro: ${summary.feature}`);
  lines.push(`Type: ${summary.spec_type} | Workflow: ${summary.workflow} | Mode: ${summary.mode}`);
  lines.push(`Path: ${path.relative(process.cwd(), summary.dir) || '.'}`);
  if (summary.phases.length) lines.push(`Progress: ${progressLine(summary.phases)}`);
  if (summary.tasks) {
    lines.push(`Tasks: ${summary.tasks.done + summary.tasks.descoped}/${summary.tasks.total} complete (${summary.tasks.pending} pending, ${summary.tasks.inprogress} in progress${summary.tasks.malformed ? `, ${summary.tasks.malformed} malformed` : ''})`);
  }
  const pendingGates = summary.phases.filter((p) => ['validate_design', 'validate_impl', 'retrospective'].includes(p.phase) && p.state !== 'complete').map((p) => p.label.toLowerCase());
  if (pendingGates.length) lines.push(`Required gates pending: ${pendingGates.join(', ')}`);
  if (summary.last_command) lines.push(`Last command: ${summary.last_command.command} (${summary.last_command.timestamp})`);
  lines.push(`Next: ${summary.next.command}`);
  if (!onlyNext) lines.push(`Why: ${summary.next.reason}`);
  lines.push(`Evidence: ${summary.evidence.join(', ')}`);
  return lines.join('\n') + '\n';
}

function renderCompact(summary) {
  const completeCount = summary.phases.filter((p) => p.state === 'complete').length;
  const total = summary.phases.filter((p) => p.state !== 'skipped').length;
  return `Kiro: ${summary.feature} ${completeCount}/${total} next: ${summary.next.command}\n`;
}

function pickActive() {
  const candidates = findSpecDirs()
    .map((dir) => {
      try {
        const s = analyze(dir);
        const mt = statSync(path.join(dir, 'spec.json')).mtimeMs;
        return { ...s, mtime: mt };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      return b.mtime - a.mtime;
    });
  return candidates;
}

function resolveInput(input) {
  if (!input) {
    const active = pickActive();
    if (active.length === 0) fail(`No specs found under ${KIRO}/specs`, 66);
    return { summary: active[0], candidates: active };
  }
  let dir;
  try { dir = resolveSpecDir(input); }
  catch (e) { fail(`could not resolve spec "${input}": ${e.message}`, 66); }
  if (!dir) fail(`could not resolve spec "${input}"`, 66);
  return { summary: analyze(dir), candidates: null };
}

function main(argv) {
  const [cmd = 'summary', ...rest] = argv;
  const json = rest.includes('--json');
  const compact = rest.includes('--compact');
  const positional = rest.filter((a) => !a.startsWith('--'));

  if (cmd === 'list') {
    const summaries = pickActive();
    if (json) process.stdout.write(JSON.stringify(summaries, null, 2) + '\n');
    else {
      for (const s of summaries) process.stdout.write(renderCompact(s));
    }
    return;
  }
  if (!['summary', 'next', 'active'].includes(cmd)) {
    fail('usage: kiro-status.mjs <summary|next|active|list> [feature|path] [--json] [--compact]', 64);
  }

  const { summary, candidates } = resolveInput(cmd === 'active' ? undefined : positional[0]);
  if (!json && !compact && !positional[0] && candidates && candidates.length > 1) {
    const unfinished = candidates.filter((c) => !c.complete);
    if (unfinished.length > 1) {
      process.stdout.write('Multiple active specs found; showing the most recent unfinished one.\n');
      process.stdout.write(unfinished.slice(0, 5).map((s, i) => `${i + 1}. ${s.feature} - next: ${s.next.command}`).join('\n') + '\n\n');
    }
  }
  if (json) process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  else if (compact) process.stdout.write(renderCompact(summary));
  else process.stdout.write(renderCard(summary, cmd === 'next'));
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv.slice(2));
