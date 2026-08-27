#!/usr/bin/env node
// kiro-tasks — deterministic tasks.md state. Pure Node, zero deps.
//
// Subcommands:
//   status <feature> [--assert-all-done] [--json]
//       Count checkbox states. With --assert-all-done, exit 2 if any task is not done or
//       descoped (or any malformed checkbox exists). Replaces eyeballing "are all tasks [x]".
//       A descoped task satisfies --assert-all-done — it was deliberately dropped, not
//       forgotten — and is reported separately in the JSON so it's never silently invisible.
//   set <feature> <id> <pending|inprogress|done|descoped> [--reason <text>]
//       Atomically flip the checkbox marker for task <id> (e.g. 1 or 1.2). Removes the
//       error class of the model hand-editing markdown markers (wrong box / bad marker).
//       `descoped` REQUIRES --reason: it also appends a dated entry to the spec's
//       decisions.md recording why, so dropping scope is one command instead of a manual
//       tasks.md edit plus a manual decisions.md edit plus remembering to do either.
//
// State decisions (which task / which state) stay with the caller; only the bookkeeping
// WRITE and the all-done assertion are made deterministic here.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { resolveSpecDir, parseTasks, STATE_TO_MARKER, fail } from './common.mjs';

export function summarize({ tasks, malformed }) {
  const counts = { pending: 0, inprogress: 0, done: 0, descoped: 0 };
  for (const t of tasks) {
    if (t.marker === ' ') counts.pending++;
    else if (t.marker === '-') counts.inprogress++;
    else if (t.marker === 'x') counts.done++;
    else if (t.marker === '~') counts.descoped++;
  }
  return {
    total: tasks.length,
    counts,
    malformed: malformed.length,
    // A descoped task is a deliberate, recorded decision (see cmdSet) — it counts toward
    // "done" for completeness purposes without being reported as done.
    allDone: malformed.length === 0 && tasks.length > 0
      && (counts.done + counts.descoped) === tasks.length,
  };
}

// Pure: returns the new file content with task <id>'s marker set, or throws if not found / ambiguous.
export function setMarker(md, id, marker) {
  const lines = md.split('\n');
  // Match the exact task id at a checkbox bullet. Escape dots so 1.1 doesn't match 111.
  // Character class must include every existing marker, including descoped ('~') — otherwise a
  // descoped task can never transition to any other state (the regex simply stops matching it).
  const idRe = id.replace(/\./g, '\\.');
  const re = new RegExp(`^(\\s*- \\[)[ x\\-~](\\]\\s+${idRe})(\\.?\\s)`);
  let hits = 0;
  const out = lines.map((line) => {
    if (re.test(line)) { hits++; return line.replace(re, `$1${marker}$2$3`); }
    return line;
  });
  if (hits === 0) throw new Error(`task id "${id}" not found in tasks.md`);
  if (hits > 1) throw new Error(`task id "${id}" matched ${hits} lines (ambiguous); refusing to edit`);
  return out.join('\n');
}

function readTasksMd(feature) {
  let dir;
  try { dir = resolveSpecDir(feature); }
  catch (e) { fail(e.message, 66); }
  if (!dir) fail(`could not resolve a spec dir for "${feature}"`, 66);
  const file = path.join(dir, 'tasks.md');
  let md;
  try { md = readFileSync(file, 'utf8'); }
  catch { fail(`tasks.md not found at ${file}`, 66); }
  return { dir, file, md };
}

// Append a dated "task descoped" entry to the spec's decisions.md, creating it from the
// standard stub header if it doesn't exist yet. NOT best-effort: `descoped` exists specifically
// to make dropping scope a recorded decision, not a silent removal — so this must succeed
// BEFORE the caller writes the tasks.md marker. Throws on failure; the caller must not flip the
// marker if this throws, or a task can end up marked descoped with no decision record at all.
function recordDescopeDecision(dir, id, reason) {
  const file = path.join(dir, 'decisions.md');
  if (!existsSync(file)) {
    writeFileSync(
      file,
      "# Decisions\n\nChoices made during this spec's lifecycle. Each entry records what was "
        + 'decided, why, and what alternatives were rejected.\n\n'
        + "<!-- Entries are appended automatically when the human chooses between approaches during any spec phase. -->\n",
    );
  }
  const entry =
    `\n## Task ${id} descoped\n- **Reason:** ${reason}\n`
    + `- **Recorded:** ${new Date().toISOString()} (\`kiro-tasks.mjs set ... ${id} descoped\`)\n`;
  appendFileSync(file, entry);
}

function cmdStatus(args) {
  const feature = args.find((a) => !a.startsWith('--'));
  if (!feature) fail('status: missing <feature>', 64);
  const assertAllDone = args.includes('--assert-all-done');
  const { md } = readTasksMd(feature);
  const parsed = parseTasks(md);
  const s = summarize(parsed);
  process.stdout.write(JSON.stringify(s) + '\n');
  if (parsed.malformed.length) {
    process.stderr.write(
      'malformed checkbox lines:\n' +
        parsed.malformed.map((m) => `  L${m.line}: ${m.raw.trim()}`).join('\n') + '\n',
    );
  }
  if (assertAllDone && !s.allDone) process.exit(2);
  process.exit(0);
}

function cmdSet(args) {
  const reasonIdx = args.indexOf('--reason');
  const reason = reasonIdx !== -1 ? args[reasonIdx + 1] : undefined;
  const positional = args.filter((a, i) => !a.startsWith('--') && (reasonIdx === -1 || i !== reasonIdx + 1));
  const [feature, id, state] = positional;
  if (!feature || !id || !state) {
    fail('usage: kiro-tasks.mjs set <feature> <id> <pending|inprogress|done|descoped> [--reason <text>]', 64);
  }
  const marker = STATE_TO_MARKER[state];
  if (!marker) fail(`set: state "${state}" must be one of pending|inprogress|done|descoped`, 64);
  if (state === 'descoped' && (!reason || !reason.trim())) {
    fail('set: descoped requires --reason "<why this was dropped>" — it is a recorded decision, not a silent removal', 64);
  }
  const { dir, file, md } = readTasksMd(feature);
  let next;
  try { next = setMarker(md, id, marker); }
  catch (e) { fail(`set: ${e.message}`, 65); }
  // Record the decision BEFORE flipping the marker — never the other way round. If this throws,
  // stop here: the task must not end up marked descoped with no decision record to show why.
  if (state === 'descoped') {
    try { recordDescopeDecision(dir, id, reason.trim()); }
    catch (e) { fail(`set: could not record the descope decision in decisions.md (${e.message}) — tasks.md was NOT changed`, 73); }
  }
  if (next !== md) writeFileSync(file, next);
  process.stdout.write(JSON.stringify({ ok: true, id, state, file }) + '\n');
  process.exit(0);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'status') return cmdStatus(rest);
  if (cmd === 'set') return cmdSet(rest);
  fail('usage: kiro-tasks.mjs <status|set> ...', 64);
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv.slice(2));
