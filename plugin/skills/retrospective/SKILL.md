---
name: retrospective
description: Run an end-of-session retrospective on a session that used the kiro skills and write TWO dated reports — (1) feedback-<ts>.md, a bounded buddy-style developer-journey interview capturing the engineer's real experience (did cc-sdd help or fight them, would they reuse it) anchored to this session's cc-sdd stage-gates and spec artifacts; and (2) skill-improvements-<ts>.md, a triage-filtered improvement backlog for the framework maintainer. Use at the end of a session that used /kiro:* skills, when asked to "retro this", "collect feedback", "review how the kiro skills did", or to generate a skill-improvement report.
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion
argument-hint: "[feature-name]"
disable-model-invocation: true
metadata:
  shared-rules: "retrospective-framework.md, interaction-style.md, command-tracking.md"
  shared-scripts: "check-retro-session.py, record-command-fired.py"
---

# kiro-retrospective Skill

Study THIS session end-to-end — every input you were given and every output you produced, in sequence,
including questions, clarifications, blockers, gate results, corrections, and retries — and produce **two**
evidence-backed reports:

1. **`feedback-<ts>.md`** — the engineer/adoption lens: a bounded, buddy-style developer-journey interview
   (what worked, what didn't, *where*, at which stage-gate) plus the honest neutral read. Answers "does this
   module work for devs?"
2. **`skill-improvements-<ts>.md`** — the maintainer lens: a triage-filtered backlog of the skill/
   architecture changes that are *actually justified* by that feedback + the session evidence.

Follow **`retrospective-framework.md`** (loaded as a rule) for the full contract:
- the **governing rules** — evidence-or-it-didn't-happen, journey-anchored, adversarial-not-sycophantic,
  never-invent-skill-text, witnessed-vs-inferred;
- the **canonical vocabulary** (§V1 eight criteria keys · §V2 failure-mode tags · §V3 closed enums) — copied
  character-for-character in the **frontmatter**, because these tokens are the only reason sessions can be
  compared at all — and **§V4 plain-English labels** everywhere a human reads, because the tokens are
  identifiers, not English. Frontmatter gets tokens; the Scorecard, `Read this first`, the `F-n` titles and
  the blind-spot lines get labels. Never make the reader learn `CEREMONY-MISFIT`.
- **Part A** — anchor-mining, the fixed-core **interview** (§A3), the **verbatim raw log** of both the Q&A
  and the in-session corrections (§A3.5), the **evidence chain** `trigger → signal → cost` (§A4), the
  fill-in **skeleton** (§A5) with its length budget (§A5.1), mandatory **blind spots** (§A6), and the printed
  **pre-write evidence check** (§A7);
- **Part B** — per-skill deep dive + the triage filter that keeps feedback → skill-change from being 1:1.

The point of the whole exercise: **one comparable row per session**, so that feedback by feedback we can
tell whether this system is actually helping engineers — measured the same way every time, not re-read and
re-interpreted from scratch.

## Procedure

### 0. Check you are in the session that did the work (deterministic gate)
```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/check-retro-session.py" "$(pwd)" 2>/dev/null || true
```
Reads the first line of output:

| Verdict | Do this |
|---|---|
| `same` | Proceed. Set `evidence_basis.transcript: witnessed`. |
| `unknown` | Proceed. The gate could not tell (no session marker, an older plugin, a pruned marker) — judge from whether you actually have this session's turns in context, and set `evidence_basis` accordingly. |
| `fresh` | **Print the script's warning verbatim and STOP.** Ask whether to resume the right session or continue here. |

On `fresh`, do not quietly carry on: a retro without the transcript loses the verbatim engineer quotes and
the whole in-session corrections log, which is the richest evidence a session produces. The warning tells
them how to resume the session that did the work (`claude -r`). If they choose to continue anyway, proceed
with `evidence_basis: {transcript: reconstructed, interview: live}`, use `no-transcript-access` blind-spot
reasons freely, and write the exact `Not captured — no transcript access for this session.` line in the
corrections log rather than claiming none occurred.

If the script is missing or `python3` is unavailable the command prints nothing — that is a
**silent pass**, so continue as `unknown`. This gate is guidance and must never block a retro.

**Cross-check the verdict against what you actually have.** The script reads file times, not your context,
so confirm it against the one thing only you can see — whether this session's turns are in front of you:

| Script says | You have the turns | You don't |
|---|---|---|
| `same` | proceed, `witnessed` | **distrust it.** A `git checkout`/`pull` at session start rewrites spec mtimes and looks like work. Treat as `reconstructed`. |
| `fresh` | **distrust it.** Two sessions open in one repo: the newest marker is the other one's. Say so and proceed as `witnessed`. | print the warning, stop, ask |

Neither signal is sufficient alone: file times cannot see your context, and your judgment cannot see when a
file was written. When they disagree, say which you trusted and why in the report — never silently pick one.

### 1. Gather metadata (deterministic)
```bash
# Timestamp for the filenames + reports.
date +%Y-%m-%d-%H%M%S
# Best-effort kiro plugin version (walk up from the skill dir to the plugin manifest).
d="${CLAUDE_SKILL_DIR}"; while [ -n "$d" ] && [ "$d" != "/" ]; do \
  if [ -f "$d/.claude-plugin/plugin.json" ]; then grep -m1 '"version"' "$d/.claude-plugin/plugin.json"; break; fi; \
  d=$(dirname "$d"); done
```
- If the version walk prints nothing, record `kiro_version: unknown` and note it.
- Identify the repo, the spec(s)/feature under `.kiro/specs/`, the skills used **this session** (you
  were present — list in order of first use), the stage path taken, and the outcome.
- **Record command fired**: when a spec dir is identified, read `rules/command-tracking.md`, then run:
  ```bash
  python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "<spec dir>" "kiro-retrospective" "retrospective"   # or `python`
  ```
  This marks the final lifecycle gate in `spec.json.commands_fired`. Skip only when no spec can be identified.


### 2. Mine journey anchors (Part A §A2)
Reconstruct the session's cc-sdd journey and collect the concrete anchors — for each stage/gate the session
passed through, the specific moment + spec artifact (`requirements.md` §, `design-hld.md`/`design-lld.md`,
`tasks.md` T-n, gate verdicts, RED witness, review reject→retry, human corrections). Every finding you write
MUST cite one of these anchors. Auto-fill all **eight** criteria (§V1) from the anchors first, and note which
the session actually stressed — that decides where the two optional anchored questions go.

### 3. Interview the engineer (Part A §A3) — fixed core first
**One question at a time, ≤6 total** (see §A3's budget table — the arithmetic is fixed). Ask them **exactly
as written in §A3** — plain, short, blunt. Do not reword them to sound softer or more contextual.

**Q1, Q4 and Q5 go through `AskUserQuestion`** (closed, real options). **Q2 and Q3 are asked as plain
prose** — never through `AskUserQuestion`, which would force you to invent options for an open question. A
real session did exactly that and got "all of the above", losing the ranking the engineer would have
volunteered. If options are ever offered for a time-wasted question, `multiSelect: true`.
1. **Q1–Q3 (core), verbatim, in order, every session** — reuse intent · what it caught that they'd have
   missed · what wasted their time. These three are the entire basis for comparing sessions; never skip,
   never substitute, never merge.
2. **Q4 (conditional)** — ask whenever the session had ≥1 human correction: does it do that often
   (`First time` / `Sometimes` / `Every time`). This is engineer-supplied `recurrence`; without it Part B is
   left guessing what the engineer already knows.
3. **1–2 anchored extras** — only where the transcript genuinely cannot answer. End them open ("what did
   you want instead?"), never with two guessed options.
   (Q5, the sign-off, comes later at step 7 — it needs the draft to exist.)
- **The instant each question resolves, log it verbatim** — exact question text, exact options shown, the
  answer in full, plus `answer_type` — into the running raw log for §A3.5, *before* writing any paraphrase
  of it. Real time, not reconstructed from memory afterwards.

### 4. Collect the in-session corrections (Part A §A3.5 Part 2)
Scan the whole session for every turn where the human redirected, rejected a tool call, overrode a
recommendation, repeated themselves, or showed frustration. Record each verbatim with the agent action
immediately preceding it. Do not sanitize wording. Include corrections that happened outside any kiro skill.
This is usually the richest evidence in the session and the easiest to lose.

### 5. Write the raw log to disk FIRST (Part A §A3.5)
- Create `.kiro/feedback/` if needed.
- Write `.kiro/feedback/feedback-<timestamp>[-<feature>].md` containing **only** the frontmatter stub
  plus `## Appendix — raw log` with its two subsections. Save it now, before any analysis exists.
- **Written first, read last.** The record goes to disk before any analysis (so it is provably prior to your
  reading of it) but lives at the *end* of the file (so a reader meets the findings, not 55 lines of
  transcript). Two orderings, both deliberate.
- Producing the verbatim record at the same moment as the interpretation lets the story you are about to tell
  colour what you "recall" being said, turning the raw log into a second paraphrase. Commit it first.

### 6. Build the evidence chains (Part A §A4)
For every friction you intend to report, assemble `trigger` → `signal` → `cost`, each quoting an artifact
(command, file, error text, gate verdict, or a `C-n` correction). A friction without all three is not
reportable — find the evidence or drop the claim.
**Near-misses count.** Where nothing broke because something downstream caught it, set `latent: true`,
`cost: none`, and a `latent_cost` naming what it would have cost *and what caught it* — if the catch was luck
rather than a designed backstop, that is the finding, and for `FALSE-CONFIDENCE` it usually outranks
everything with a realized cost.
**Account for every correction.** Each `C-n` from step 4 either becomes a friction entry or gets an explicit
reason why not. A logged correction with no friction entry and no reason is the most common self-serving
omission in a self-written retro.

### 7. Ask Q5 — the engineer checks your draft (Part A §A3 sign-off)
Show a compact draft — the Scorecard rows plus one line per friction (`F-n · tag · title · cost`), nothing
else — then ask: *"Here's what I recorded. Anything wrong or missing?"*
- A correction here **overrides your read.** Amend the scorecard/friction/sentiment and log the exchange as a
  new `C-n`. Do not argue back with transcript evidence: this question exists because your own account is the
  suspect one.
- Record the outcome in `signoff:` (`confirmed` | `amended` | `not-asked`). `not-asked` is only for a run
  with nobody there to ask.
- **The Q5 exchange goes into the raw log.** It could not be in the write at step 5 — it is asked *about*
  that draft — so step 9's write appends the verbatim Q5 question, options and answer to the interview log,
  plus a new `C-n` if the engineer corrected anything. An amendment that changed the scorecard but left no
  trace in the record is unauditable.
- This is the only genuinely independent check in the whole procedure — everything else is this agent
  checking itself.

### 8. Print the pre-write evidence check (Part A §A7)
Print the §A7 block filled with **the evidence itself** — quoted question strings, counts, id lists — not
`PASS`/`FAIL` verdicts. A self-reported status field is not proof (invariant #9,
`kiro-verify-completion`'s fresh-evidence rule); the artifact is. Fix anything the block exposes before the
final write, and include line 11 (corrections → friction mapping) and line 16 (what you chose not to report).
Where an answer genuinely cannot exist — an unattended run never fired Q1–Q3, a reconstructed retro cannot
prove no correction occurred — write `not-asked (<reason>)` or the exact `Not captured` sentence rather than
inventing a string.

### 9. Write the report above the appendix (Part A §A5)
- **Insert** the report sections between the frontmatter and the appendix, by **filling in the §A5
  skeleton**, in order: `Read this first` · Scorecard · What worked · What went wrong · What we could not
  measure · What the engineer asked for. Then **append the Q5 exchange** into the appendix's Interview
  subsection (plus its `C-n` if the engineer corrected something).
- **Do not alter one character** of the Q1–Q4 or `C-n` text already on disk. Write 2 inserts above and
  appends below; it never rewrites the record.
- Six sections, not nine. There is no separate journey-read section (a finding's observation goes on its
  `F-n` block's `read:` line, a win's on its bullet), no separate adoption verdict (that is `Read this
  first`'s "Did it help?"), and no handoff-tags table (the frontmatter `frictions:` list is the handoff).
- **`Read this first` is written for a human and is not optional.** Plain words, ≤15 lines, no `F-n` ids, no
  tag names, no criteria keys. Everything else in the file is an audit trail; this is the part someone
  actually reads. Order the `F-n` blocks **worst first** so the summary's top three match the file's top
  three.
- **Use §V4 labels on every human surface.** The Scorecard's columns and rows, the `F-n` titles, the `F-n` titles
  read headings and the blind-spot lines all read in plain English; the tokens stay in the frontmatter. A
  token may appear beside its label for traceability, never instead of it.
- Do **not** edit Q1–Q4 or any `C-n` written at step 5. Write 2 appends; it never revises the record.
- All eight §V1 criteria in both the frontmatter and the Scorecard; `schema_version: 2`; `blind_spots` for
  every `not-assessed` criterion; each friction carrying exactly one §V2 tag plus its evidence chain.
- **Say each thing once.** A finding's evidence lives in its `F-n` block, its one-line observation on that
  block's `read:` line; a confirmed win is one bullet under "What worked". Completeness is the Scorecard's
  job. Respect §A5.1: the raw log and the `F-n` chains are unbounded, commentary is ≤60 lines, and when over,
  cut commentary rather than trimming evidence.
- Do not invent, rename, reorder, or drop sections for this session's convenience.

### 10. Write skill-improvements.md (Part B)
- Create `.kiro/retrospective/` if needed.
- Write `.kiro/retrospective/skill-improvements-<timestamp>[-<feature>].md` with the
  `type: kiro-skill-improvements` frontmatter (set `feedback_ref` to the file written at steps 5/9), the
  per-skill deep dive, **What to preserve**, the **triage filter** (route every feedback entry + correction to
  SKILL-FIX / PROCESS / USER·ONE-OFF·MODEL-rejected-with-reason / LEARNING — the rejected bucket is
  mandatory), cross-skill/gates/handoffs, and the prioritized backlog (SKILL-FIX items only).
- Use `<feature>` in filenames only if the session centered on one spec; otherwise omit.

### 11. Report back
Print **`Read this first` verbatim** — it is already the plain-language summary, so do not re-summarize it in
different words. Then: both report paths, the **sign-off outcome** (`confirmed`/`amended`/`not-asked`, and
what the engineer changed if `amended`), any **blind spots** (so the engineer sees what was *not* measured),
and the **top 3–5 prioritized skill improvements** from Part B §B6. Flag any §B7 items the maintainer must
verify, including any `NEW:<proposed-name>` tag awaiting folding into §V2.

Keep the printed report as readable as the section it quotes. The scorecard and tag list are in the file for
anyone who wants them; dumping both into the terminal buries the three things that need attention.

## Constraints
- Read-only on the codebase except for writing the two report files. Do NOT edit skills, specs, or steering —
  propose changes in skill-improvements.md; the maintainer applies them.
- **The §A5 skeleton is a contract, not a suggestion.** Field names, section headings, and their order are
  fixed; the §V1/§V2/§V3 tokens are copied character-for-character. Improvising structure is what made an
  earlier corpus of ten files impossible to compare — a file that spells a criterion its own way is not a
  stylistic variant, it is an unusable row.
- **Keep the two lenses separate.** feedback.md is the engineer's experience (symptom-level, their words);
  skill-improvements.md is the maintainer's diagnosis (filtered). Do not turn feedback.md into a skill-edit
  list, and do not let skill-improvements.md accept every complaint as a skill change.
- **Honesty over polish.** An all-green feedback file or an all-SKILL-FIX triage is almost always a failed
  retro. If the session genuinely had little friction, say so briefly and still surface the smallest real
  frictions and what to preserve.
- **Minimal engineer burden.** ≤6 questions, one at a time, plain and blunt. Unused question budget is a
  feature — never pad to fill it.
