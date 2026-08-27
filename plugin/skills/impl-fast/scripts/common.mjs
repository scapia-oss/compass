// Shared helpers for the kiro gate scripts. Pure Node, zero deps.
// These run inside a CONSUMING repo against its .kiro/specs tree.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const SPEC_CATEGORIES = ['features', 'bugs', 'tech-debt', 'chores'];
// spec-init/spec-quick both name categorized spec dirs `YYYY-MM-DD-<slug>` — the date is baked into
// the directory name itself, not a separate path segment. A caller almost always has only the slug
// (what the user typed as <feature-name>), never the date, so resolution must search for it.
const DATED_DIR_RE = /^\d{4}-\d{2}-\d{2}-/;

// Resolve a feature name (or an explicit path) to its spec directory.
// Search order mirrors the impl skill: categorized dirs first, then legacy flat.
// Honors a `spec_path` field inside spec.json when present.
export function resolveSpecDir(featureOrPath, cwd = process.cwd()) {
  // Explicit path to a spec dir or spec.json.
  if (featureOrPath.includes('/') || featureOrPath.endsWith('.json')) {
    const p = path.resolve(cwd, featureOrPath);
    const dir = p.endsWith('spec.json') ? path.dirname(p) : p;
    if (existsSync(path.join(dir, 'spec.json'))) return dir;
  }
  const specsRoot = path.join(cwd, '.kiro', 'specs');
  const candidates = [
    ...SPEC_CATEGORIES.map((c) => path.join(specsRoot, c, featureOrPath)),
    path.join(specsRoot, featureOrPath),
  ];
  for (const dir of candidates) {
    const sj = path.join(dir, 'spec.json');
    if (existsSync(sj)) {
      // Prefer an explicit spec_path if it points somewhere real.
      try {
        const meta = JSON.parse(readFileSync(sj, 'utf8'));
        if (meta.spec_path) {
          const viaField = path.join(specsRoot, meta.spec_path);
          if (existsSync(path.join(viaField, 'spec.json'))) return viaField;
        }
      } catch { /* fall through to the directory we found */ }
      return dir;
    }
  }
  // Fall back to a dated-slug search: the exact-name join above only matches when the caller passes
  // the full `YYYY-MM-DD-<slug>` name. Search each category dir for an entry whose name is a dated
  // dir ending in `-<featureOrPath>` (case-sensitive, exact suffix — not a substring match).
  const suffix = `-${featureOrPath}`;
  const matches = [];
  for (const category of SPEC_CATEGORIES) {
    const categoryDir = path.join(specsRoot, category);
    let entries;
    try { entries = readdirSync(categoryDir, { withFileTypes: true }); }
    catch { continue; } // category dir doesn't exist — not an error, just nothing to find here
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!DATED_DIR_RE.test(entry.name) || !entry.name.endsWith(suffix)) continue;
      const dir = path.join(categoryDir, entry.name);
      if (existsSync(path.join(dir, 'spec.json'))) matches.push(dir);
    }
  }
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // Ambiguous — same slug dated on different days. Never silently pick one; let the caller see why.
    throw new Error(
      `ambiguous: "${featureOrPath}" matches ${matches.length} dated spec dirs: ${matches.join(', ')}`,
    );
  }
  return null;
}

export function readSpecJson(specDir) {
  return JSON.parse(readFileSync(path.join(specDir, 'spec.json'), 'utf8'));
}

// Parse tasks.md into a flat list of task entries.
// Recognizes:  - [ ] 1. ...   - [-] 2.3 (P) ...   - [x] 1.1 ...   - [~] 3. ... (descoped)
// marker: ' ' pending | '-' inprogress | 'x' done | '~' descoped
// Returns { tasks: [{ id, marker, isMajor, line, raw }], malformed: [{ line, raw }] }
export function parseTasks(md) {
  const tasks = [];
  const malformed = [];
  const lines = md.split('\n');
  // A checkbox bullet that starts a task. Anything that looks like a task bullet
  // but doesn't match the strict marker set is reported as malformed.
  const strict = /^(\s*)- \[([ x\-~])\]\s+(\d+(?:\.\d+)?)\.?\s/;
  const loose = /^\s*- \[(.*?)\]\s+\d/;
  lines.forEach((raw, i) => {
    const m = raw.match(strict);
    if (m) {
      const id = m[3];
      tasks.push({
        id,
        marker: m[2], // ' ' | '-' | 'x'
        isMajor: !id.includes('.'),
        line: i + 1,
        raw,
      });
      return;
    }
    // Looks like a task checkbox but the marker is not one of [ ]/[-]/[x].
    if (loose.test(raw) && !strict.test(raw)) {
      malformed.push({ line: i + 1, raw });
    }
  });
  return { tasks, malformed };
}

export const STATE_TO_MARKER = { pending: ' ', inprogress: '-', done: 'x', descoped: '~' };
export const MARKER_TO_STATE = { ' ': 'pending', '-': 'inprogress', x: 'done', '~': 'descoped' };

export function fail(msg, code = 1) {
  process.stderr.write(msg.endsWith('\n') ? msg : msg + '\n');
  process.exit(code);
}
