#!/usr/bin/env node
// kiro-gate — deterministic checks over spec.json. Pure Node, zero deps.
//
// Subcommands:
//   validate <feature|path>     Validate spec.json against the known invariants.
//                               Exit 0 = valid, 2 = invalid (findings on stderr).
//
// This replaces prose "make sure spec.json is well-formed / approvals graph is sane" with a
// single deterministic verdict. It does NOT judge content quality — only structural invariants
// that have one correct answer.
import { resolveSpecDir, readSpecJson, fail } from './common.mjs';

const PHASES = new Set([
  'initialized', 'requirements-generated', 'hld-generated',
  'lld-generated', 'design-generated', 'tasks-generated',
  'linked', // satellite/peer link spec (multi-repo-linkage.md) — no lifecycle phases run on it
]);
const SPEC_TYPES = new Set(['feature', 'bugfix', 'tech-debt', 'chore']);
const WORKFLOWS = new Set(['requirements-first', 'design-first']);
// Who makes the git commits during impl / impl-fast (asked at spec-init; absent ⇒ 'per-task').
const COMMIT_POLICIES = new Set(['per-task', 'leave-uncommitted']);
const KNOWN_APPROVAL_KEYS = new Set([
  'requirements', 'design', 'design_hld', 'design_lld', 'tasks', 'bugfix_analysis',
]);
// Multi-repo linkage (multi-repo-linkage.md)
const KINDS = new Set(['linked-spec']);
const ROLES = new Set(['satellite', 'peer']);
const REPO_WEIGHTS = new Set(['light', 'heavy']);

// Pure function: returns an array of finding strings (empty = valid). Exported for tests.
export function validateSpec(spec) {
  const f = [];
  if (typeof spec !== 'object' || spec === null) return ['spec.json is not an object'];

  if (!spec.feature_name || typeof spec.feature_name !== 'string') {
    f.push('feature_name is required and must be a non-empty string');
  }
  if ('spec_type' in spec && !SPEC_TYPES.has(spec.spec_type)) {
    f.push(`spec_type "${spec.spec_type}" is not one of feature|bugfix|tech-debt|chore`);
  }
  if ('workflow' in spec && !WORKFLOWS.has(spec.workflow)) {
    f.push(`workflow "${spec.workflow}" is not one of requirements-first|design-first`);
  }
  if ('phase' in spec && !PHASES.has(spec.phase)) {
    f.push(`phase "${spec.phase}" is not a known lifecycle phase`);
  }
  if ('commit_policy' in spec && !COMMIT_POLICIES.has(spec.commit_policy)) {
    f.push(`commit_policy "${spec.commit_policy}" is not one of per-task|leave-uncommitted`);
  }
  if ('task_granularity' in spec && spec.task_granularity !== 'milestone') {
    f.push(`task_granularity "${spec.task_granularity}" must be "milestone" when present`);
  }

  // multi-repo linkage fields (multi-repo-linkage.md)
  if ('kind' in spec && !KINDS.has(spec.kind)) {
    f.push(`kind "${spec.kind}" is not a known spec kind (linked-spec)`);
  }
  if ('role' in spec && !ROLES.has(spec.role)) {
    f.push(`role "${spec.role}" is not one of satellite|peer`);
  }
  // cross-field coherence: kind/role/phase must agree for a linked spec
  const isLinked = spec.kind === 'linked-spec';
  if (isLinked && !ROLES.has(spec.role)) {
    f.push('kind "linked-spec" requires role: satellite|peer');
  }
  if (isLinked && 'phase' in spec && spec.phase !== 'linked') {
    f.push(`kind "linked-spec" must have phase "linked" (got "${spec.phase}")`);
  }
  if (!isLinked && 'role' in spec) {
    f.push('role is only valid on a linked-spec (set kind: "linked-spec")');
  }
  if ('affected_repos' in spec) {
    if (!Array.isArray(spec.affected_repos)) {
      f.push('affected_repos must be an array');
    } else {
      spec.affected_repos.forEach((r, i) => {
        if (typeof r !== 'object' || r === null || typeof r.repo !== 'string' || !r.repo) {
          f.push(`affected_repos[${i}] must have a non-empty string "repo"`);
        } else if (!REPO_WEIGHTS.has(r.weight)) {
          f.push(`affected_repos[${i}].weight "${r.weight}" is not one of light|heavy`);
        }
      });
    }
  }

  // approvals graph
  const ap = spec.approvals;
  if (typeof ap !== 'object' || ap === null) {
    f.push('approvals is required and must be an object');
  } else {
    for (const [k, v] of Object.entries(ap)) {
      if (!KNOWN_APPROVAL_KEYS.has(k)) {
        f.push(`approvals.${k} is not a known phase key`);
        continue;
      }
      if (typeof v !== 'object' || v === null
        || typeof v.generated !== 'boolean' || typeof v.approved !== 'boolean') {
        f.push(`approvals.${k} must be { generated: boolean, approved: boolean }`);
        continue;
      }
      // An approved phase that was never generated is incoherent.
      if (v.approved && !v.generated) {
        f.push(`approvals.${k} is approved but not generated (incoherent state)`);
      }
    }
    // Approvals keys should not name a disabled artifact (drift between artifacts + approvals).
    const art = spec.artifacts;
    if (art && typeof art === 'object') {
      const artFlag = (key) => {
        if (key === 'design') return art.design_hld || art.design_lld || art.design;
        return art[key];
      };
      for (const k of Object.keys(ap)) {
        if (k in art || k === 'design') {
          if (artFlag(k) === false) {
            f.push(`approvals.${k} is present but artifacts marks it disabled (prune or enable)`);
          }
        }
      }
    }
  }

  // artifacts values must be boolean
  if ('artifacts' in spec) {
    if (typeof spec.artifacts !== 'object' || spec.artifacts === null) {
      f.push('artifacts must be an object of boolean flags');
    } else {
      for (const [k, v] of Object.entries(spec.artifacts)) {
        if (typeof v !== 'boolean') f.push(`artifacts.${k} must be a boolean`);
      }
    }
  }
  // required lifecycle gates must be boolean when present
  if ('required_gates' in spec) {
    if (typeof spec.required_gates !== 'object' || spec.required_gates === null || Array.isArray(spec.required_gates)) {
      f.push('required_gates must be an object of boolean flags');
    } else {
      for (const [k, v] of Object.entries(spec.required_gates)) {
        if (typeof v !== 'boolean') f.push(`required_gates.${k} must be a boolean`);
      }
    }
  }
  return f;
}

function main(argv) {
  const [cmd, feature] = argv;
  if (cmd !== 'validate') {
    fail('usage: kiro-gate.mjs validate <feature|path-to-spec-dir-or-spec.json>', 64);
  }
  if (!feature) fail('validate: missing <feature> argument', 64);
  let dir;
  try { dir = resolveSpecDir(feature); }
  catch (e) { fail(`validate: ${e.message}`, 66); }
  if (!dir) fail(`validate: could not resolve a spec dir for "${feature}"`, 66);
  let spec;
  try {
    spec = readSpecJson(dir);
  } catch (e) {
    fail(`validate: ${dir}/spec.json is not valid JSON: ${e.message}`, 65);
  }
  const findings = validateSpec(spec);
  if (findings.length === 0) {
    process.stdout.write(JSON.stringify({ ok: true, dir }) + '\n');
    process.exit(0);
  }
  process.stderr.write(`spec.json invalid (${dir}):\n` + findings.map((x) => `  - ${x}`).join('\n') + '\n');
  process.exit(2);
}

const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) main(process.argv.slice(2));
