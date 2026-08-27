# Retrospective Framework (kiro)

The analysis contract for `/kiro:retrospective`. One real session produces **two** artifacts with two
audiences and two purposes — do not merge them:

1. **`feedback-<ts>.md`** — the **engineer/adoption lens**. Answers "did cc-sdd work *for* me? where did it
   help, where did it fight me, would I run it again?" Built from a short, blunt **developer-journey
   interview** plus the session's own evidence. Audience: the engineer/team + the module owner. Governed by
   **Part A** below. Every file is **one comparable row**: same eight criteria, same tag vocabulary, same
   fields, every time — so the question "is this system helping engineers or not?" is answered by stacking
   rows, not by re-reading essays.
2. **`skill-improvements-<ts>.md`** — the **framework-maintainer lens**. Answers "given that feedback plus
   the session evidence, which skill/architecture changes are *actually justified*?" A triage-filtered,
   adversarial improvement backlog. Audience: someone who edits skill source. Governed by **Part B** below.

The bridge between them is the triage filter in Part B §B4: **feedback → skill-change is NOT 1:1.**
feedback.md is symptom-level (the engineer's words); skill-improvements.md is the diagnosis, and most DX
complaints must be routed to something *other* than a skill edit.

## Governing rules (non-negotiable — a retro that breaks these is worthless)
- **Evidence or it didn't happen.** Every claim of friction MUST quote BOTH sides:
  1. the **agent action** that caused it — the command, the file, the claim, the gate verdict; and
  2. an **observed signal** that it went wrong — *either* the human's words **verbatim** (never paraphrased;
     the raw log in §A3.5 exists precisely so the original words stay available) *or* the exact machine
     output (error text, test failure, a gate's NO-GO, a downstream skill's finding).

  A human signal is the strongest available and is preferred when one exists — but requiring one would make
  every machine-caught and latent finding unreportable, including the most serious class this framework
  tracks (a gate that asserted coverage it did not have, caught by the *next* skill with no human involved).
  No evidence of either kind → don't assert it.
- **Anchored to the cc-sdd journey.** Every friction finding names a real moment from THIS session — a
  specific stage (`discovery`/`spec-*`/`impl`/`validate-*`/`debug`), a gate (`kiro-gate`, `git-guard`, RED
  witness, review verdict, validate GO/NO-GO), and the spec artifact involved (`requirements.md` §,
  `design-hld.md`/`design-lld.md`, `tasks.md` T-n). No abstract findings.
  Interview questions are anchored too, with one deliberate exception: the fixed-core questions Q2/Q3 in
  §A3 are open by design and ask the *engineer* to name the moment. That is not an ungrounded question — it
  is the fix for an agent guessing the wrong axis. See the carve-out in §A3.
- **Adversarial, not sycophantic.** The job is to find what FAILED. Unsupported praise belongs nowhere.
  Evidence-backed positives are allowed only where the framework asks for them (feedback.md's symmetric
  journey read; Part B §B3 *What to preserve*) and even there each must cite the moment.
- **Never invent skill text.** If you don't have the skill's exact wording in context, describe the observed
  behavior precisely and the step it came from so the maintainer can locate the text; mark it
  `(behavior-inferred, exact text not in context)`. Never fabricate a quote from a SKILL.md.
- **Separate witnessed from inferred.** Tag each finding `witnessed` (you can point to the turn) or
  `inferred` (reconstruction). They are weighted differently.
- **Specific over general.** "spec-design asked too many questions" is useless. "spec-design Step 3 asked 6
  clarifying questions, 2 already answered in requirements.md §2.1" is actionable.
- **Read-only except the two report files.** Do NOT edit skills, specs, or steering. Propose changes in
  skill-improvements.md; the maintainer applies them.

---

## Canonical vocabulary (the single source of truth — copy these tokens exactly)

Every other section of this framework, and every `feedback.md` written from it, draws its tokens from
here. **Copy them character-for-character.** Do not renumber, re-word, Title-Case, pluralize, abbreviate,
or translate them, and do not invent a parallel set — the whole point of this section is that N sessions
across N repos produce rows that stack. A file that spells a criterion differently is not a variant, it is
an unusable row.

> Why this section exists, stated plainly so it doesn't get "tidied" away: across ten real `feedback.md`
> files, the *same* field was written four different ways (`[1, 3, 5, 6]`, `[Entry & clarity, …]`,
> `[entry-and-clarity, …]`, and omitted entirely — one file discarded the criteria set and invented its
> own). Every file was individually good; the set was collectively unaggregatable. Comparing sessions had
> to be done by hand. Fixed tokens are what make it a measurement instead of a read.

### V1. Criteria keys (exactly eight, always all eight)
```
entry-clarity         first contact — did I know what to run and where to start?
control-trust         authorship — in control, or did it run away from me?
artifact-quality      were the documents it produced any good? (precise, complete, right call)
effort-friction       cognitive load, ceremony, rework, duplicate questions, interruptions
payoff-value          concrete wins beyond what I'd have produced solo
confidence-outcome    result matched intent — would I defend it?
learning-capture      durable knowledge created or reused (learnings.md, patterns.md, decisions.md)
residue-reuse         would I run it again — THE adoption signal
```

Two of these are tracked separately rather than folded into `payoff-value`, and both for the same reason:
they are distinct, separately-fixable mechanisms, and buried inside "payoff" they are invisible to the
maintainer who would fix them.

- **`learning-capture`** — cross-session memory. In practice one of the highest-rated moments engineers
  report (a prior session's `patterns.md` entry surfacing unprompted in a new session), and also where a
  distinct failure lives: a fact that *was* recorded and *wasn't* consulted.
- **`artifact-quality`** — the specs, designs and tasks are this system's primary output, so "were the
  documents good?" needs its own row. It is **not** `entry-clarity` (that is *did I know what to run*) and
  not `confidence-outcome` (that is *do I trust the end result*). It covers precision, completeness, and
  whether the design made the right call: a first draft that was plausible but subtly wrong, an
  unusually-complete rationale section, an interface spec precise enough to implement without re-asking.

**Boundary rule — `control-trust` vs `confidence-outcome`** (they both sound like "trust", and content
filed inconsistently across these two is exactly the drift this vocabulary exists to stop):
- `control-trust` is about the **process**: did I steer it, did it act without asking, were my overrides
  respected, did it do something I didn't sanction?
- `confidence-outcome` is about the **result**: do I believe the finished thing is correct, would I defend
  it in review, did the verification convince me?
- "I trusted the output enough to act on it without re-checking" → `confidence-outcome`.
  "It edited a file when I only asked for analysis" → `control-trust`.

### V2. Failure-mode tags (one axis only: *why did it fail?*)
Every friction entry carries **exactly one** of these, alongside its
`{criterion, stage, gate, skill, artifact}` anchor. The anchor already records *where* it happened; this
tag records *why*, and nothing else. Keeping the set to one axis is what makes counting it meaningful — a
set whose members answer different questions (some naming a place, some a cause, some a subject, some
who's to blame) produces a tally that cannot be reasoned about.

| Tag | The failure |
|---|---|
| `CONTEXT-NOT-CARRIED` | The fact existed — in an approved artifact, in steering, in `learnings.md`/`patterns.md`, in an earlier phase — and did not reach the place that needed it. |
| `POLICY-NOT-CHECKED` | A repo/project rule existed (`CLAUDE.md`, an available project command, a branch convention) and wasn't consulted before acting. |
| `BROKEN-POINTER` | A skill referenced a command, path, template field, or artifact that didn't resolve in this session. |
| `CEREMONY-MISFIT` | Process weight didn't match the change's risk or size — too heavy for a trivial edit, or too light for a risky one. |
| `FALSE-CONFIDENCE` | A gate or claim asserted checked / covered / saturated / GO when it wasn't. |
| `FALSE-ALARM` | The opposite direction: a gate/review blocked, rejected, or flagged something that was actually fine. A wrong block costs real work and erodes trust in every future verdict, so it is tracked as its own mode — not lumped in with a missed catch. |
| `WRONG-QUESTION` | A question was asked, but framed narrower than the real ambiguity — the engineer answered with an unprompted reframe. |
| `ASKED-INSTEAD-OF-CHECKING` | Asked the engineer for something the session could have determined itself (a deeper search, reading a file, running one command). |
| `UNVERIFIED-ASSUMPTION` | Proceeded on an assumption a cheap external check (official docs, one command) would have settled. |
| `ENVIRONMENT` | Cause sits outside kiro — a down index, a flaky runner, a timeout. Real cost; **not** a skill defect. Tagged separately so it never inflates the skill-defect count. |
| `NEW:<proposed-name>` | Genuinely novel. **Requires** a one-line description of the failure AND a proposed tag name, and MUST be surfaced in Part B §B7 as a candidate addition. |

**There is deliberately no `OTHER`.** A catch-all bucket silently flattens exactly the novel failures this
system exists to surface, which contradicts the governing rule that a learning must never be missed.
`NEW:<proposed-name>` forces the novel case to arrive named and described so the maintainer can fold it
into V2 — the list grows on purpose, through review, never by improvisation mid-session.

### V3. Closed enums
```
reuse_intent      yes | yes-if-fixed | only-if-required | no
                  # yes-if-fixed MUST name the thing that needs fixing
net_sentiment     helped-a-lot | helped | neutral | slowed-me | fought-me
sentiment         positive | negative | neutral | not-asked      # per criterion
evidence_source   asked | inferred | not-assessed                # per criterion
answer_type       selected-option | free-text-override | mixed   # per raw-log answer
blind_spot_reason no-anchor-in-session | no-question-budget | engineer-declined | no-transcript-access
recurrence        one-off | sometimes | every-time | not-asked
```
### V4. Plain-English labels — what a human reads

The tokens in V1–V3 exist for **one** reason: so N sessions produce rows that stack. That makes them stable,
and stability is the opposite of readability — `CEREMONY-MISFIT` and `residue-reuse` are precise identifiers
and poor English. A real file put **30 distinct machine tokens** in front of its reader, 17 of them in the
human-facing Scorecard alone. The reader's job is not to learn a vocabulary.

So there are two surfaces, and they do not share wording:

| Surface | Uses |
|---|---|
| **Frontmatter** — `criteria:`, `frictions:`, `blind_spots:` … | the V1/V2/V3 **tokens**, exactly. Never a label. |
| **Everything a human reads** — `Read this first`, Scorecard, `F-n` titles, blind spots | the **labels** below. A token may appear only in parentheses after its label, never alone. |

Translate; do not rename. The token is the identity and must never change to read better — that orphans every
prior file. The label is free to be as plain as needed because nothing depends on it.

**Criteria (V1):**

| Token | Label a human reads |
|---|---|
| `entry-clarity` | Knowing what to run |
| `control-trust` | Staying in control |
| `artifact-quality` | Quality of the documents it wrote |
| `effort-friction` | Effort and wasted time |
| `payoff-value` | What it caught |
| `confidence-outcome` | Confidence in the result |
| `learning-capture` | Learning that carried over |
| `residue-reuse` | Would use it again |

**Failure modes (V2):**

| Token | Label a human reads |
|---|---|
| `CONTEXT-NOT-CARRIED` | Known information didn't reach where it was needed |
| `POLICY-NOT-CHECKED` | A project rule existed and wasn't checked |
| `BROKEN-POINTER` | Pointed at something that doesn't exist |
| `CEREMONY-MISFIT` | Process weight didn't match the change |
| `FALSE-CONFIDENCE` | Claimed something was checked when it wasn't |
| `FALSE-ALARM` | Blocked something that was actually fine |
| `WRONG-QUESTION` | Asked a question narrower than the real problem |
| `ASKED-INSTEAD-OF-CHECKING` | Asked you instead of working it out |
| `UNVERIFIED-ASSUMPTION` | Assumed instead of verifying |
| `ENVIRONMENT` | Outside kiro's control |

**Values that surface (V3):** `asked` → "engineer said" · `inferred` → "agent's read" ·
`not-assessed` → "not looked at" · `positive`/`negative`/`neutral` → "good"/"bad"/"mixed" ·
`yes-if-fixed` → "yes, once <thing> is fixed" · `only-if-required` → "only if told to" ·
`latent: true` → "nothing broke this time" · `one-off`/`sometimes`/`every-time` as written.

**Never shown to a human at all** — frontmatter only, because they describe the record rather than the
session: `schema_version`, `answer_type`, `also_criteria`, `evidence_basis`, `id`, `§` section references.
A reader who has to learn what `answer_type: free-text-override` means is being handed the instrument's
internals instead of its findings.

---

`sentiment` and the friction tags are **independent fields, never merged into one verdict.** An engineer
rating a moment `positive` while the transcript shows real cost is the single most informative shape this
instrument captures — it is how you tell "cheap to absorb" from "actually fine" — and any enum that
collapses the two (a `mixed` value, a single `helped|friction` verdict) destroys it. Record both; let the
contradiction stand.

---

## Part A — feedback.md (developer-journey interview)

Audience: the engineer and the module owner. Its only credibility is honesty. The point is **actionable
adoption signal**: if engineers won't reuse it, the module fails no matter how clever the skills are.

### A1. The 360° developer-journey criteria
The eight criteria in **V1** span the arc of *using* cc-sdd. They are the report's fixed rows.

**All eight appear in every `feedback.md`, always.** What varies is how much evidence each one has — not
whether it shows up. A criterion the session didn't stress is recorded as
`evidence_source: not-assessed` with a `blind_spots` reason (§A6), never dropped.

This replaces the earlier "pick the ones the session stressed" rule, which silently deleted rows: an
omitted criterion and a healthy criterion looked identical on the page, so a maintainer could not tell "we
are strong here" from "we have never once looked here." In practice `confidence-outcome` went missing from
four of ten files and nobody could say which of the two it was.

| Key (from V1) | Journey stage | Captures |
|---|---|---|
| `entry-clarity` | first contact | Knowing what to run / where to start; did the workflow feel legible? |
| `control-trust` | steering | In-control vs ran-away; were my overrides respected; did it act unasked |
| `artifact-quality` | producing | Were the specs/designs/tasks precise, complete, and the right call — or plausible but subtly wrong? |
| `effort-friction` | working | Cognitive load, ceremony, rework, duplicate questions, interruptions |
| `payoff-value` | delivery | Did it lift quality/speed beyond solo work — concrete wins |
| `confidence-outcome` | acceptance | Result matched intent; would defend it |
| `learning-capture` | during & after | Durable knowledge created or reused — was a prior learning recalled? was a new one written at the right level? |
| `residue-reuse` | after | How they feel now; would rerun / recommend — **the adoption signal** |

### A2. Mine anchors BEFORE asking (deterministic prep)
Reconstruct this session's cc-sdd journey and collect concrete anchors — the raw material every question and
every feedback entry must cite:

| Stage / gate | Anchor to look for |
|---|---|
| discovery / spec-init / spec-quick | wrong routing, mis-scoped brief |
| requirements | EARS questions that duplicated known info, missing requirements |
| validate-gap / validate-design | a GO/NO-GO that felt wrong, findings ignored |
| design-hld / design-lld | re-runs, human corrections, architecture pushback |
| tasks | tasks too big/small, wrong ordering, missing context |
| impl (RED witness, review reject→retry, debug) | rejected tasks, retry loops, blocked implementer, self-report vs parent-witnessed |
| validate-impl | false GO, missed problem |
| gates: kiro-gate · git-guard · review verdict | fired wrongly, or should have fired and didn't |

Auto-fill each criterion from these anchors first. Only *ask* the engineer what the transcript cannot
reveal — feeling, intent, "what did you want instead", reuse intent.

### A3. The interview — fixed core, then anchored extras

Three rules decide everything about this section:

1. **Ask like a person, not a form.** Plain words. Short sentences. Under ~10 words per question. No
   preamble, no recap of what happened, no metaphors, no framework jargon. The engineer just finished their
   work and is doing you a favour — they should be able to read the question once and answer immediately.
2. **Ask bluntly.** A soft question gets a polite answer, and polite answers are useless. "Was there any
   friction?" reliably returns "fine, it worked" from someone who lost forty minutes. Ask what actually
   went wrong, directly, and make it easy to say something bad.
3. **The core is fixed.** The same questions run **every session, verbatim, in this order**, whatever the
   session did. That is the entire basis for comparing sessions — the moment the core varies, the corpus
   stops being a measurement and becomes N unrelated essays.

Ask **one at a time**. Total ceiling **≤6**. Target ~2 minutes.

**How to ask each one — this is not interchangeable.** Q1, Q4 and Q5 are closed questions with real options,
so they go through `AskUserQuestion` per `interaction-style.md`. **Q2 and Q3 are open questions and MUST be
asked as plain prose** — do not route them through `AskUserQuestion`, because that tool always renders
options and you would have to invent them.

Inventing options for an open question is not a cosmetic mistake; it changes the answer. A real session asked
Q3 with four guessed options and got *"all of the above"* — the engineer had to override the whole option set
to say that three of them applied, and the ranking they would have volunteered was never captured. The
options constrained the answer to the agent's guess at the axis, which is the `WRONG-QUESTION` failure mode
this framework already tracks. Q2 and Q3 exist precisely to let the engineer name the thing themselves.

If you ever do offer options for a "what wasted your time" style question, `multiSelect` MUST be `true` —
several things can waste time in one session, and a single-select forces a false choice.

**Budget allocation (it must add up to 6, so this is fixed arithmetic, not a suggestion):**

| Slot | Count | When |
|---|---|---|
| Core Q1–Q3 | 3 | Always |
| Sign-off Q5 | 1 | Always — asked **last**, after the draft exists |
| Q1 follow-up ("fix what?") | 1 | Only if Q1 answered `Yes, but fix <the thing> first` |
| Recurrence Q4 | 1 | Only if the session had ≥1 human correction |
| Anchored extras | fill to 6 | whatever the slots above leave: 0, 1 or 2 |

So the floor is 4 questions and the ceiling is 6. **Anchored extras are the only elastic slot** — every
other row is either always-on or condition-driven, so when conditions fire, extras give way. On a session
that had a correction *and* a `yes-if-fixed` answer, the arithmetic is 3 + 1 + 1 + 1 = 6 and there is **no**
anchored extra. Drop the extra; never drop Q4, the sign-off, or the follow-up.

The `yes-if-fixed` follow-up counts as a real question because it is: it is mandatory (a `yes-if-fixed`
without a named blocker is an incomplete answer, per Q1) and it costs the engineer another round-trip.
Leaving it out of the arithmetic is how a stated `≤6` cap silently becomes 7.

#### Core — always, verbatim, in order

**Q1 · `residue-reuse` · the adoption signal**
> Would you use this again for the same kind of work?

Options: `Yes` · `Yes, but fix <the thing> first` · `Only if I have to` · `No`
→ maps to `reuse_intent` (`yes` · `yes-if-fixed` · `only-if-required` · `no`). If they pick the second
option, ask what needs fixing — a `yes-if-fixed` with nothing named is an incomplete answer, and the named
thing goes straight into `reuse_blocker`.

**Q2 · `payoff-value` · the win**
> What did it catch that you would have missed on your own?

Free text. **"Nothing" is a valid, expected answer and gets recorded exactly as given.** Do not rephrase,
soften, or re-ask to fish for a positive. A truthful "nothing" is the most valuable negative signal this
instrument can collect.

**Q3 · `effort-friction` · the cost**
> What wasted your time?

Free text. "Nothing" accepted. Blunt on purpose: it presumes something did, which makes complaining the
easy path. Asking *whether* there was friction gets you "it was fine"; asking what wasted their time gets
you the actual moment.

#### Conditional — only if the session had ≥1 human correction

**Q4 · `control-trust` · recurrence**
> You had to correct it about <thing>. Does it do that often?

Options: `First time` · `Sometimes` · `Every time`
→ maps to `recurrence`. **Ask this whenever a correction occurred.** Otherwise recurrence gets *guessed by
the maintainer* in Part B §B2 when the engineer already knows, and `every-time` is the strongest severity
signal available anywhere in this framework. `<thing>` is a few plain words naming what they corrected — not
a recap of the exchange.

#### Sign-off — always, asked LAST, after the draft exists

**Q5 · verification · the engineer checks your work**
> Here's what I recorded. Anything wrong or missing?

Show, immediately above the question, a compact draft: the Scorecard rows plus one line per friction entry
(`F-n · tag · one-line title · cost`). Nothing else — not the prose, not the raw log.

Options: `Looks right` · `Something's wrong — <they say what>` · `Something's missing — <they say what>`

This is **the** answer to a structural problem the rest of this framework cannot solve on its own: the retro
is written by the same agent whose work it assesses, in the same session, and every other check here is that
agent checking itself. The engineer is the one party present with independent ground truth, and asking them
costs one question.

Handling the answer:
- A correction here is authoritative. It **overrides** your read — amend the scorecard, the friction entry,
  or the sentiment, and log the exchange as a `C-n` in the raw log like any other correction.
- If they name something missing, add it as a friction/win entry with whatever evidence chain you can
  assemble, and mark it `evidence_source: asked`.
- Record the outcome in `signoff:` (see §A5): `confirmed` · `amended` · `not-asked`.
- **Never argue the engineer out of a correction here.** Elsewhere in cc-sdd, pushing back on a request with
  evidence is correct behavior. Not here: this question exists precisely because your own account is the
  suspect one, so "actually the transcript shows…" defeats the purpose. Record what they say.
- `not-asked` is legitimate only when nobody is there to ask (a reconstructed or unattended run). It is not
  a shortcut for a session that felt fine.

#### Wording rules (these are what keep it answerable)
- **Plain words only.** Not "friction", "journey", "your experience of the workflow", "stage-gate",
  "ceremony", "adoption". Say *slow*, *wrong*, *annoying*, *wasted time*, *use it again*.
- **No metaphors or hypotheticals.** "One moment you'd delete from this session" and "if you could wave a
  wand" are riddles — the engineer has to decode them before answering. Ask the literal thing.
- **No compound questions.** One question, one answer. Never "what worked and what didn't?".
- **Never a bare rating.** No 1–5, no "how satisfied were you". A number with no example is unusable.
- **Never lead.** Not "the design review helped, right?" — that manufactures the answer you wanted.

#### Option-label rules (the options need the same discipline as the questions)
An option the engineer has to think about is as bad as a question they have to decode — they will pick the
first plausible one and the row becomes noise.
- **Five words max, plain English.** `Yes` beats `Yes, as-is`. `Every time` beats
  `Every time — I've stopped expecting better`.
- **No jargon or shorthand in a label.** Never `as-is`, `N/A`, `n/a`, `WAI`, `nit`, a §V2 tag name, or a
  criterion key. The labels are for a human; the enum tokens they map to are for the file.
- **Options must be obviously different from each other.** If two labels could describe the same feeling,
  merge them. Four near-synonyms is a worse instrument than two clear choices.
- **Order them consistently: best → worst.** Same direction every session, so a glance across files reads
  correctly.
- **Never hand-author an "Other" option** — `AskUserQuestion` supplies it, and 4 is the cap.
- Each label maps to exactly one §V3 enum token. State the mapping next to the options, not in the label.

#### Anchored extras — 1–2 (whatever the budget leaves), only where the transcript genuinely cannot answer

Construction rule:
> `criterion × a witnessed moment (stage · gate · artifact) → one short, plain question that pulls the concrete example.`

Same wording rules as above. Name the moment in a few words, then ask the short thing:
> It ran the tests twice on T-3. Did that slow you down?

> It picked `<X>` over `<Y>` in the design. What did you want instead?

- **End them open.** "What did you want instead?" — never offer two guesses at what they wanted. Twice in
  the real corpus a two-option question presumed the wrong axis and the engineer had to override it with
  free text to say what actually mattered; the options got in the way. When you don't know the axis, don't
  invent one.
- Max **one follow-up** per thread, and only if an answer opened something real.
- Skip these entirely if the transcript already answers it. Unused budget is a feature, not a quota.

**Carve-out — do not "fix" this later:** Q2 and Q3 are deliberately **unanchored**, which appears to
violate the governing "no ungrounded questions" rule. It doesn't. That rule exists to ban *bare ratings*
and abstract mood-taking. Q2/Q3 are **elicitation** — they ask the engineer to supply the anchor, which is
precisely what the anchored form gets wrong when the agent's guess at the axis is off. The real corpus is
direct evidence: the most actionable material came from engineers volunteering their own specifics, not
from agent-framed multiple choice.

#### Capture as you go (non-negotiable)
The instant each question resolves, copy the exact question text, the exact options shown, and the exact
answer in full into the running raw log for §A3.5 — **before** you paraphrase it anywhere. Synthesizing
first and transcribing later degrades the raw log into a second paraphrase, which is the whole failure it
exists to prevent.

### A3.5. Raw log — verbatim, unedited, no synthesis anywhere

The ground truth the rest of the file is built from. It is a **transcript, not an assessment** — the one
section that cannot be reasoned around, softened, or improved. Two parts, both mandatory.

**Absolute rules for this whole section:**
- **Verbatim means verbatim.** Typos, fragments, profanity, tangents, and half-sentences stay exactly as
  typed. Do not clean up grammar, do not translate, do not trim to the "relevant" part.
- **No synthesis leaks in here.** No criterion labels beyond the tag on the question line, no
  `Neutral read`, no interpretation, no "(engineer seemed frustrated)". Analysis belongs in §A5, which
  cites back into this log by number.
- Never fabricate an entry to fill a slot. If a part is empty, say so in the exact words given below.

#### Part 1 — Interview log
One block per question, in the order asked, including follow-ups as their own numbered pair.

```
### Raw log — interview

Q1 [core · residue-reuse]
asked:   <exact question text as fired>
options: <exact options shown, verbatim | none — free text>
answer:  <the engineer's answer IN FULL, verbatim>
answer_type: <selected-option | free-text-override | mixed>

Q2 [core · payoff-value]
...
```

- `answer` is the whole answer. If the engineer ignored the question and said something else, **that** is
  the answer — record all of it. Do not trim it back to what the question was asking; the mismatch is the
  most valuable thing on the line.
- `answer_type` is mechanical, not a judgement:
  `selected-option` = picked one of the options as offered · `free-text-override` = wrote their own instead
  of / on top of the options · `mixed` = picked one and added qualifying text.
  **`free-text-override` is the detector for the `WRONG-QUESTION` failure mode** — it means the options
  didn't contain the real answer. Every occurrence must be considered for a `WRONG-QUESTION` tag in §A5.
- If no interview happened at all, write exactly:
  `No interview questions were asked this session — every criterion below is transcript-derived.`

#### Part 2 — In-session corrections
Every turn where the human **redirected, rejected a tool call, overrode a recommendation, repeated
themselves, or expressed frustration** — paired with the agent action immediately before it. Not just the
retro interview: the whole session.

```
### Raw log — in-session corrections

C1
agent did:  <the action immediately preceding — exact command / file / claim>
human said: <verbatim, in full, exactly as typed>
stage:      <cc-sdd stage or "ad-hoc (no skill active)">

C2
...
```

- This is where the most diagnostic material in a session actually lives, and where it is most often lost.
  Real examples from the corpus that only ever survived as paraphrase: *"i asked you analyse the impact of
  the changes, i didnt ask you to make those changes"*, *"base if off pre-prod not master"*, *"r u idiot?"*,
  *"see, i am designing for shadow mode only today, just tell me what is missing for that"*. Each one names
  a failure more precisely than any summary of it, and each is direct evidence for exactly one V2 tag.
- **Do not sanitize frustration.** A blunt or angry correction is the strongest possible cost signal. Record
  it as typed; the `Neutral read` in §A5 can be measured about it.
- Include corrections that happened **outside** any kiro skill (plain ad-hoc turns). They still shaped the
  engineer's experience of the session, and §A5 can mark them not-skill-governed. Excluding them
  understates real cost.
- Every `C-n` here is a candidate friction entry in §A5, and every `C-n` referenced there must exist here.
- If there were genuinely none, write exactly: `No human corrections occurred this session.`
- If you **cannot know** — a reconstructed retro with no transcript access — write exactly:
  `Not captured — no transcript access for this session.` Do not write "none occurred": on a session that
  went through two NO-GO rounds, asserting zero corrections is almost certainly false, and a confident false
  zero is worse for the corpus than an honest gap (it reads as a clean session in every future tally).

Place this whole section **last in the file**, as `## Appendix — raw log`. It is the evidence, not the
report.

**Written first, read last.** These are two different orderings and both matter:

- **Write order** — the record is committed to disk *before* any analysis exists. That is what makes it
  provably prior to your reading of it.
- **Document order** — it lives at the *end* of the file, under `## Appendix — raw log`. A reader wants the
  verdict and the findings first, and the transcript only when they doubt one. 55 lines of transcript
  between the summary and the findings is a wall, and an earlier version put it there.

Two writes, in this order, always:

| Write | Contains | When |
|---|---|---|
| **1 — the record** | frontmatter stub + `## Appendix — raw log` with both subsections, holding every Q and C known *before* the draft existed | after §A3.5 Part 2 is collected, before any analysis |
| **2 — the reading** | the report sections inserted *above* the appendix — Read this first, Scorecard, What worked, What went wrong, what we could not measure, engineer asks — **plus** the Q5 exchange appended into the appendix's Interview subsection | after Q5 and after the §A7 block is printed |

Write 2 inserts above the appendix and appends to it. It may **not** alter a single character of the Q1–Q4
or C-n text already on disk. That is the whole guarantee: the record cannot be retro-fitted to the story.

**The Q5 exchange is append-only into write 2, and it must not be skipped.** Q5 cannot exist in write 1 —
it is asked *about* the draft, so it is chronologically later. So write 2 appends to the interview log the
verbatim Q5 question, options and answer, and if the engineer corrected anything, a new `C-n` recording it.
An amended sign-off that changed the scorecard but left no trace in the raw log is a broken record: the file
would show an amendment nobody can audit.

Appending later does **not** weaken the ordering guarantee. What write 1 protects is that the record of the
session — everything said before you formed a view — exists before your interpretation of it. Q5 is a
*response to* the interpretation and is honestly logged after it, with its own `C-n` timestamped by position.
What is forbidden is going back and editing Q1–Q4 or C1–C*n* once write 1 has landed.

The reason is not tidiness. Writing the whole file in one pass means the verbatim record is produced *at the
same moment* as the interpretation that depends on it — by which point you are recalling the exchange
through the lens of the story you are about to tell, and the "verbatim" log quietly becomes a second
paraphrase. That is the exact failure §A3.5 exists to prevent, reintroduced at the last step.

### A4. The evidence chain — required on every friction entry

A friction entry that records only *what happened* is unfixable three weeks later: the maintainer has the
symptom, not the cause, and has to re-read the whole session to act on it. So every friction entry carries
**three fields, in this order**, each one quoting a session artifact rather than summarizing it.

```
trigger:  <the agent action that caused it — the exact command, the file written, the claim made, the
           gate verdict. Quoted, not described. This is the thing a fix would change.>
signal:   <how it surfaced — the verbatim human correction (cite C-n), or the exact error / test-failure /
           gate output text. Quoted.>
cost:     <what resolution actually took, counted — N correction rounds, N repair rounds, a rebase +
           force-push, N repeated asks, a beta hot-fix. "none" if it cost nothing.>
```

**Why `cost` and not a severity rating.** Part B currently ranks the backlog by
`severity × frequency × confidence` — three agent judgements multiplied together, which is three chances to
be confidently wrong and no way to audit it. `cost` is *observed*: it is countable, it comes from the
transcript, it cannot be talked up by an eager retro-writer or talked down by a polite one, and it
**accumulates across sessions per failure mode**. Ten sessions of `cost` totals tell you which failure mode
is actually expensive. Ten sessions of `severity: high` tell you nothing.

#### Latent findings — a near-miss is not a non-finding
Some of the most important findings have **no realized cost**, because something downstream caught them or
because the damage simply hasn't landed yet. A design-critique loop that marked blast radius `saturated`
while missing a producer cost *nothing* — the next skill happened to re-derive it from scratch. That is not
a small finding; it is the most serious kind, and the framework must not discard it for lack of a receipt.

So a friction entry may set `latent: true`, and then:
- `trigger` — required as normal (the unearned claim, the missing check).
- `signal` — **what caught it, or how you know it was wrong.** For a near-miss this is the downstream skill
  / gate / later turn that found it, quoted. For a structural fragility with no incident at all, it is the
  artifact evidence that establishes the risk — quoted, not asserted.
- `cost: none` plus **`latent_cost:`** — one line on what it *would* have cost had nothing caught it, and
  **what did catch it**. Name the safety net explicitly: if the net was luck rather than design, say so,
  because that is the finding.

```
### F1 · HLD claimed a single shared sink; a 6th producer existed   [witnessed]
tag:         FALSE-CONFIDENCE
latent:      true
trigger:     spec-design-hld's critique loop recorded EL2 blast-radius as `saturated` in
             spec.json.critique_coverage[] — i.e. it believed it had verified callers
signal:      validate-design's independent repo-wide grep found `OfferPlatformManagerService
             .getOfferContext`, an un-routed 6th producer, in the first minutes of its own audit
cost:        none
latent_cost: a wrong "single sink" architecture shipped into tasks + impl. Caught only because the
             NEXT skill re-derived blast radius from scratch instead of trusting the carried
             ledger — a second look that is not guaranteed to happen, not a designed backstop
```

Do **not** use `latent: true` to smuggle in speculation. The bar is unchanged: quoted evidence that the
claim was actually wrong. "This could theoretically break" with nothing behind it is still dropped.

**Rules:**
- All three fields, always. A friction entry missing any one of them is not reportable — either find the
  evidence or drop the claim (governing rule: *evidence or it didn't happen*). A near-miss is **not** an
  exception to this: it has a trigger and a signal, and `cost: none` + `latent_cost` (see above).
- `trigger` names the **agent's** action, not the engineer's. "The engineer wanted X" is not a trigger.
- `signal` prefers the human's verbatim words when a human caught it, because that is the strongest
  evidence available. Machine signals (error text, a NO-GO verdict) are equally valid when the machine
  caught it first — quote them exactly.
- `cost: none` is a real and common value. A friction that cost nothing still gets recorded (it may cost
  more at volume) — but it must not be inflated to look actionable.
- Mark the whole entry `witnessed` or `inferred` per the governing rule. An `inferred` chain reconstructed
  from git artifacts is legitimate; passing it off as witnessed is not.

**Worked example** — the shape is not negotiable, so here is a real one, filled:

```
### F2 · PR opened against the wrong base branch          [witnessed]
tag:      POLICY-NOT-CHECKED
anchor:   post-impl · no gate fired · PR #1003
trigger:  ran `gh pr create --base master` directly; the project's own `commit-push-pr` command
          (step 4: "use pre-prod as base branch") was listed in the available commands and was
          never invoked
signal:   C4 — "base if off pre-prod not master"
          C5 — "you have taken the branch from master hence some CI check is failing please take
          the branch from pre-prod"
cost:     2 correction rounds + 1 rebase + force-push (retargeting the PR base alone did not fix
          it — the branch history was already rooted in master)
```

Note what makes this actionable without re-reading the session: the trigger names the exact command and the
exact rule that went unchecked, the signal proves a human paid for it twice, and the cost says why the first
fix was insufficient. That is the standard.

### A5. The feedback.md skeleton — fill this in, do not re-derive it

**This is a template to complete, not a description to interpret.** Copy the whole block below and fill the
`<…>` slots. Section headings, their order, and every field name are **fixed**. Do not add sections, rename
headings, reorder them, or "improve" the structure for this particular session.

That instruction is unusually rigid on purpose. Ten real files written from a *prose description* of these
same fields produced four different encodings of one field, one file that invented its own criteria set, and
one that moved everything under a nested `metadata:` key. Each author was making a locally reasonable
choice. The result was a corpus that could only be compared by hand. A model given a block to complete does
not drift; a model given a paragraph to satisfy does.

**The first body section is written for a human, not for the aggregator.** Everything else in this file is
an audit trail — machine-readable frontmatter, numbered findings, evidence chains. Useful, and unreadable at
a glance. So the file opens with a plain-language summary that a busy engineer or module owner can read in
thirty seconds and act on without decoding a single internal term. If someone has to ask what the file says,
the file has failed regardless of how correct its data is.

````markdown
---
type: kiro-feedback
schema_version: 2
date: <YYYY-MM-DD>
kiro_version: <e.g. 3.10.0 | unknown>
repo: <repo name>
branch: <git branch the work landed on | n/a>
feature: <spec/feature name(s) | n/a>
spec_path: <path under {{KIRO_DIR}}/specs/ | n/a>
workflow: <the actual stage path taken, e.g. spec-init -> spec-requirements -> impl-fast -> validate-impl>
shape: <the session's shape, e.g. requirements-first, HLD-only (no LLD), milestone task granularity>
outcome: <shipped | merged | in-flight | partial | blocked | abandoned> — <one clause of detail>
skills_used: [<skill>, ...]              # order of first use
evidence_basis:                           # the two halves are independent — see §A6
  transcript: <witnessed | reconstructed>  # witnessed = you were present; reconstructed = rebuilt from artifacts
  interview: <live | none>                  # live = you asked the engineer in this conversation
reuse_intent: <yes | yes-if-fixed | only-if-required | no>
reuse_blocker: <what must be fixed | none>       # REQUIRED and non-empty when reuse_intent is yes-if-fixed
net_sentiment: <helped-a-lot | helped | neutral | slowed-me | fought-me>
recurrence: <one-off | sometimes | every-time | not-asked>
signoff: <confirmed | amended | not-asked>   # Q5 — did the engineer check this file? see §A3
interview: { asked: <n>, answered: <n> }
# ALL EIGHT V1 keys, in V1 order, always present. One line each — flow style, so the reader reaches the
# prose sooner. sentiment: positive|negative|neutral|not-asked · evidence_source: asked|inferred|not-assessed
# Field names stay as V3 declares them; brevity never renames a field an aggregator reads.
criteria:
  - {key: entry-clarity,      sentiment: <…>, evidence_source: <…>}
  - {key: control-trust,      sentiment: <…>, evidence_source: <…>}
  - {key: artifact-quality,   sentiment: <…>, evidence_source: <…>}
  - {key: effort-friction,    sentiment: <…>, evidence_source: <…>}
  - {key: payoff-value,       sentiment: <…>, evidence_source: <…>}
  - {key: confidence-outcome, sentiment: <…>, evidence_source: <…>}
  - {key: learning-capture,   sentiment: <…>, evidence_source: <…>}
  - {key: residue-reuse,      sentiment: <…>, evidence_source: <…>}
# One row per F-n in the body, worst first. THE aggregation unit — tag and cost travel together.
# also: other criteria it hit ([] if none) · latent: true = nothing has gone wrong YET (§A4)
frictions:
  - {id: F1, tag: <V2 token>, criterion: <V1 key>, also_criteria: [], stage: <stage>, cost: <…>, latent: <…>}
blind_spots:                              # every criterion with evidence_source: not-assessed appears here
  - criterion: <V1 key>
    reason: <no-anchor-in-session | no-question-budget | engineer-declined | no-transcript-access>
engineer_asks: [<verbatim ask>, ...]      # what the engineer explicitly asked for, their words. [] if none
---

# Feedback — <feature | repo + date>

## Read this first
<For a human. Plain words. No F-n ids, no tag names, no criteria keys, no "latent" / "evidence_source".
≤15 lines total. Four fixed sub-answers, same shape every file. Nothing here that isn't evidenced below.>

**Did it help?** <one line: would they use it again, and the single best thing it did>

**What it cost:** <one line, or two: the friction that actually cost the engineer something, in plain words>

**Worth fixing — most serious first:**
1. <plain sentence. What went wrong and why it matters. No ids, no jargon.>
2. <…>
3. <…>
<Name at most three. If there are nine findings, three is still the answer — the rest are below.>

**Still unverified:** <what nobody has checked yet, and what it would take. Or: nothing.>

## Scorecard
<Human view of the frontmatter — so it uses §V4 **labels**, not tokens. All eight rows, always, in V1 order.
The problem/cost columns are a rollup of the `frictions:` rows whose `criterion` or `also_criteria` includes
that key; do not invent values the frontmatter doesn't carry. An earlier version of this table put 17 machine
tokens in front of the reader.>

| What | How it went | Who says so | What went wrong | What it cost |
|---|---|---|---|---|
| Knowing what to run | <good / bad / mixed / not asked> | <engineer said / agent's read / not looked at> | <plain label, or —> | <counted, or —> |
| Staying in control | <…> | <…> | <…> | <…> |
| Quality of the documents it wrote | <…> | <…> | <…> | <…> |
| Effort and wasted time | <…> | <…> | <…> | <…> |
| What it caught | <…> | <…> | <…> | <…> |
| Confidence in the result | <…> | <…> | <…> | <…> |
| Learning that carried over | <…> | <…> | <…> | <…> |
| Would use it again | <…> | <…> | <…> | <…> |

## What worked
- <evidence-backed win, plain words. Cite the moment; quote the engineer if they said it.> — `{criterion, stage, skill, artifact}`
- ...
<One bullet each. A win that needs a paragraph gets one extra line for the caveat — a reason it worked here
and might not elsewhere — and nothing more.>

## What went wrong
<ORDERED WORST FIRST. F1 is the most serious finding in the session, not the earliest one. Rank by the same
rule as §B6: a latent gate failure first, then realized cost, then everything else. A flat chronological list
makes a mid-build redesign and a `cost: none` nit look identical, which forces every reader to rank them
again from scratch — and the writer, who has the evidence, is better placed to do it once.>

### F<n> · <plain-English one-line title — what went wrong, no tag, no key>
<Then the machine fields. The title is what a human reads; these are for triage and the aggregator.>
tag:         <exactly one V2 token> — <its §V4 label>
criterion:   <V1 token> — <its §V4 label>   also: [<V1 token>, ...]
seen:        <witnessed | inferred>
anchor:      <stage · gate · artifact — or "ad-hoc · not skill-governed · n/a">
trigger:     <§A4 — the agent action, quoted>
signal:      <§A4 — verbatim human correction (cite C-n) or exact machine output>
cost:        <§A4 — counted, or none>
latent:      <true | false>
latent_cost: <§A4 — required when latent: true; what it would have cost + what caught it>
read:        <1 line. The honest observation — what this says about the workflow, not the session.
              Observe; don't editorialize; never "this proves kiro works". Omit if the title says it all.>

<Every F-n here has a matching row in the frontmatter's `frictions:` list, same id, same tag, same cost.
A friction that hit two criteria is ONE F-n with `also:` populated — never two entries, which would
double-count it in every tally.>

## What we could not measure
- <§V4 label for the criterion> — <the reason in plain words> <one line on what would be needed to assess it>
<Plain words: "the session never exercised this" rather than `no-anchor-in-session`. The enum token lives
in the frontmatter's `blind_spots:`. Also name any outcome nobody has verified, not just unmeasured
criteria — an untested requirement belongs here even when every criterion has evidence.>

## What the engineer asked for
- "<verbatim ask>" — <where it came up>
<Their words only. Requests, not diagnoses. If they asked for nothing, write: none.>

---

## Appendix — raw log

<Everything above is the report. This is the evidence it was built from: the verbatim record, kept so any
claim can be checked. It sits last because a reader wants the findings first and the transcript only when
they doubt one — but it is WRITTEN first (§A3.5), and nothing above may contradict it.>

### Interview
<§A3.5 Part 1, verbatim. Or the exact no-interview sentence.>

### In-session corrections
<§A3.5 Part 2, verbatim. Or: No human corrections occurred this session.>

````

**There is deliberately NO separate handoff-tags table.** The frontmatter `frictions:` list *is* the handoff
— it already carries `id`, `tag`, `criterion`, `also_criteria`, `stage`, `cost` and `latent` in machine-
readable form, and each `F-n` body block carries the anchor and the evidence chain. A summary table
restating those fields is a second source of truth for the same data, which is precisely the pattern this
framework bans elsewhere (§B4: *carry it straight through, do not re-derive*). Two copies drift; the one
that drifts is always the hand-maintained table. Part B reads the frontmatter.

**The `not-skill-governed` case.** Real friction often happens in plain ad-hoc turns with no kiro skill
active — a shallow search, an unrequested edit, a hand-rolled `git` sequence. Record it: it shaped the
engineer's session and excluding it understates real cost. Use exactly `skill: not-skill-governed` in the
`F-n` block's anchor line and keep a real `stage` (`ad-hoc`) plus whatever artifact was touched. This
satisfies the anchor requirement — Part B will route it to PROCESS or USER/ONE-OFF rather than SKILL-FIX,
which is the correct outcome, not a reason to drop it.

**`workflow` vs `shape`.** `workflow` is the literal stage path taken (`spec-init -> spec-requirements ->
impl-fast`). `shape` is the session's character (`requirements-first`, `HLD-only (no LLD)`, `milestone task
granularity`). Both are needed and they are not the same field: `shape` is what any `CEREMONY-MISFIT`
judgement is measured against — you cannot tell whether the ceremony fitted without knowing how much
ceremony was selected.

**Invariants that survive from v1 — do not let a tighter schema erode them:**
- **Symmetry is mandatory.** *What worked* and *What went wrong* both carry weight. A
  positives-only file is auto-rejected. If the interview came back uniformly positive but the transcript
  shows friction, both go in — that combination is signal, not a contradiction to resolve.
- **No fabricated ROI.** Never claim time or tokens saved without a baseline. Only *observed* counterfactuals
  (e.g. "an unguarded call would have broken the existing 18-test suite; grounding moved that discovery
  before the write").
- **Witnessed vs inferred stays tagged** on every finding, and `evidence_basis: reconstructed` at the top
  when the whole file was rebuilt from artifacts without transcript access.
- **Every friction entry needs a stage/skill anchor** — one without it cannot become a SKILL-FIX in Part B.
  Use `not-skill-governed` where that is the truth; never drop the finding for lack of a skill to blame.
- **`sentiment` and `friction` coexist.** A criterion may be `sentiment: positive` and still carry a tag and
  a cost. Do not reconcile them.
- **A near-miss is a finding.** `latent: true` + `cost: none` + `latent_cost` is a complete, reportable
  entry, and for the `FALSE-CONFIDENCE` class it is usually the most important one in the file. Never drop
  it because nothing broke this time.

**On the Scorecard being "the heatmap":** one session is one row, so a per-file heatmap would be a single
column with colours — an honest scorecard is worth more than a chart pretending to be one. The row is the
unit; a real heatmap reads across `{{KIRO_DIR}}/feedback/*.md` and is built by whatever aggregates them.
Fill the row correctly and the heatmap follows for free.

### A5.1. Length budget — a retro nobody runs measures nothing

**Evidence is unbounded. Commentary is capped at ≤60 lines.**

| Unbounded — grows with the session | Capped — the ≤60 lines |
|---|---|
| Both raw-log sections (§A3.5) | `Read this first` (≤15) |
| Every `F-n` evidence block in "What went wrong" | `Read this first` (≤15) · Scorecard · What worked · what we could not measure · engineer asks |

Budget the *interpretation*, never the evidence. Two categories grow with what actually happened and must
never be trimmed to hit a number: the verbatim record, and the `trigger`/`signal`/`cost` chains. A session
with nine real frictions needs nine chains — capping them would force dropping findings, which every other
rule here forbids.

This is the second time this budget was written too tightly. The first version capped the whole body and
collided with the raw log; the second capped everything after the raw log and collided with the evidence
chains — a real 9-friction file landed at 130 against a 100 cap, and the only compliant move would have been
to delete findings. The invariant to hold onto: **cap what a writer chooses to say, never what the session
produced.**

This is a hard requirement, not a style note, because the realistic failure of this whole framework is not a
badly-filled file — it is **no file at all**. A retro that feels expensive gets skipped, and a rigorous
instrument nobody runs measures strictly less than a sloppy one people use. For reference, the v1 files this
contract replaces ran 60–178 lines total while carrying *less* structured signal.

Per-element shape, so the unbounded sections stay tight without losing anything:

| Element | Budget |
|---|---|
| `Read this first` | ≤15 lines, and at most 3 items under "worth fixing". |
| `trigger` / `signal` | ≤2 lines each. Quote the operative part, not the whole command or stack trace. |
| `cost` / `latent_cost` | 1 line each. |
| `Neutral read` | 1 sentence. Not a paragraph. |
| Each correction (`C-n`) | 1 line for `agent did`, 1 line for `human said` (verbatim, but the human's words are usually short — do not pad the setup). |
| Journey-read block | Only where earned (see above), ≤4 anchor bullets per moment. |
| Raw-log answers · `F-n` count | **Never truncated, never capped.** Verbatim is verbatim, and nine real frictions get nine blocks. |

If you are over budget, the fix is **fewer blocks, not shorter evidence.** Cut a journey-read block that
restates the scorecard; never trim a quote, drop a friction entry, or compress two anchors into one to hit a
line count. The evidence is the point; the commentary is negotiable.

### A6. Blind spots — say what you could not measure

**Silent omission is banned.** All eight V1 criteria appear in the frontmatter and the Scorecard of every
file. A criterion the session gave you nothing on is marked `evidence_source: not-assessed` and gets a
`blind_spots` entry naming the reason — it never just disappears.

| Reason | Use when |
|---|---|
| `no-anchor-in-session` | The session never exercised this criterion; there was no real moment to read or ask about. |
| `no-question-budget` | There was an anchor, but the ≤6 question budget went to higher-value threads. |
| `engineer-declined` | You asked; they skipped it or declined to answer. |
| `no-transcript-access` | This retro is reconstructed — the work happened in an earlier session you cannot see. |

Why this is non-negotiable: on the page, a dropped criterion and a healthy criterion look identical. Across
ten real files `confidence-outcome` was simply absent four times, and there is now no way to know whether
the workflow is strong there or whether nobody has ever looked. One of those means "leave it alone"; the
other means "you are flying blind on whether engineers trust the output." A framework that cannot tell them
apart is measuring less than it appears to.

Also required:
- The body carries a **"What we could not measure"** section listing the same blind spots in
  plain language, with one line on what would be needed to assess each. The frontmatter is for the
  aggregator; this section is so a human reading one file knows where its silence is.
- **`evidence_basis` has two independent halves, because the common real case is a hybrid.** A retro run
  *after* the work, in a fresh session, typically has `transcript: reconstructed` (rebuilt from git + spec
  artifacts) but `interview: live` (the engineer is right here answering questions) — and in that case the
  interview answers are the *most* reliable content in the file, not the least. A single
  `same-session | reconstructed` flag mis-encodes this: it reads as "the whole thing is second-hand", so an
  aggregator excluding reconstructed rows would throw away live engineer answers. Record the halves
  separately and use `no-transcript-access` for criteria the missing transcript actually blocked.
  Reconstruction is legitimate — *invisible* reconstruction is not.
- **`witnessed` in a finding means "I saw it happen"**, not "I found it in a file". When
  `transcript: reconstructed`, findings derived from artifacts are `inferred` even though a git commit is
  hard evidence — the distinction being tracked is whether anyone observed the *session*, and quietly
  redefining `witnessed` to mean "visible in an artifact" collapses it. If artifact provenance matters for a
  specific finding, say so in the finding's own text (`inferred — from the commit diff + regression-manifest`).
- `schema_version: 2` is mandatory. It is what lets an aggregator handle the older v1 files (which have
  none of these fields) without discarding them or misreading them as v2 rows with everything missing.

### A7. Pre-write evidence check — print this before writing feedback.md

**Print the block below before the FINAL write (write 2 in §A3.5), filling each line with the evidence
itself — not a verdict.** A file written without this printed is not a valid retro. It runs after Q5,
because the sign-off is part of what it has to account for.

**Legitimate absences must be stateable, not faked.** An unattended run never fired Q1–Q3, and a
reconstructed retro cannot prove that no correction occurred. Those lines take `not-asked (<reason>)` and
`Not captured — no transcript access for this session.` respectively. Forcing an exact-evidence answer where
none can exist is what produces invented strings and false zeroes — the opposite of the point.

This is deliberately **not** a `PASS/FAIL` checklist, and that is the whole design. A self-administered
pass/fail is a self-reported status field, and this repo's own rule (invariant #9,
`kiro-verify-completion`'s fresh-evidence rule) is that a self-reported status field is never sufficient
proof — you gate on evidence, not on a claim. The agent most likely to type `PASS` next to "asked Q3
verbatim" is precisely the one that didn't. So every line below demands the artifact: a count, a quoted
string, an id list. Asserting is free; producing the thing is not.

```text
Pre-write evidence check
 1. Core questions, as fired — paste the exact strings:
      Q1: "<…>"   Q2: "<…>"   Q3: "<…>"
    (or, for an unattended run: not-asked (<reason>) — interview: none)
 2. Q4 recurrence — quote it + the option chosen, or: no correction occurred,
    or: Not captured — no transcript access for this session.
 3. Q5 sign-off — quote what the engineer said, or: not-asked (<why>)
 4. Raw log Part 1 — N blocks; answer_type values present: [<…>]
 5. Raw log Part 2 — N corrections logged (or the exact empty-case sentence used)
 6. Criteria rows present: [<list all 8 keys as written>]
 7. not-assessed criteria: [<keys>] → blind_spots reasons: [<reasons>]
 8. Friction ids: [F1, F2, …] with tags [<…>] and costs [<…>]
 9. latent: true ids: [<…>] → their latent_cost first clause: [<…>]
10. Body F-n ids [<…>] == frontmatter frictions ids [<…>]   (must match exactly)
11. Corrections accounted for: C-n → F-n mapping [<…>]; unmapped C-n: [<…>] + why
12. Journey-read quotes → their raw-log source: [Q-n/C-n, …]
13. helped entries: N   ·   got-in-the-way entries: N     (neither may be 0)
14. reuse_intent = <…> → reuse_blocker = "<…>"   (must be non-empty if yes-if-fixed)
15. evidence_basis: transcript=<…> interview=<…>
16. Considered but not reported: <one line, or: nothing omitted>
```

Line 11 is a real cross-check, not bookkeeping: if the corrections log has entries and none of them maps
to a friction entry, the retro recorded that a human corrected it and then declined to count it as
friction. That is the single most likely self-serving omission, and it is mechanically detectable.

Line 16 makes self-censorship visible. Anything you decided not to report is a decision — state it and let
a reader disagree, rather than leaving the omission invisible.

**What this gate is and isn't.** Every line above is a *completeness* check with a mechanically decidable
answer — did you ask the question, is the field populated, does the reference resolve. None of it asks
whether a judgement was correct. That boundary is deliberate and must hold: classifying a friction into a V2
tag, deciding whether a gate was right to fire, weighing a `Neutral read` — those are judgement and stay
with the model, unscripted. Per this repo's determinism bar, a wrong mechanical gate blocks valid work,
which is worse than no gate; so gate only what cannot be wrong.

It is also deliberately a **printed block, not a script.** There is no CLI to invoke and nothing to install.
A script here would need to parse a file that hasn't been written yet, and would fail closed on legitimate
shapes (a session with no interview, a reconstructed retro). Printing it costs one short block and converts
every skipped step from invisible to obvious.

**Where this still falls short, stated honestly.** Filling this block is a stronger obligation than ticking
boxes, but it is still the same agent reporting on itself, and a determined one could paste plausible
strings. The genuinely independent check in this framework is **Q5, the engineer's sign-off** — the one
verifier with ground truth who is not the author. Treat §A7 as the thing that catches carelessness and Q5
as the thing that catches self-serving accounts; neither substitutes for the other.

---

## Part B — skill-improvements.md (triage-filtered backlog)

Audience: the framework maintainer. Input: feedback.md + the full session evidence. Output: a ranked,
justified set of skill/architecture changes. **Be a strong architecture advocate — the default is NOT to
change a skill.**

### B0. Frontmatter
```yaml
---
type: kiro-skill-improvements
date: <YYYY-MM-DD>
kiro_version: <e.g. 3.9.0 | unknown>
repo: <repo name>
feature: <spec/feature name(s) | n/a>
workflow: <the actual stage path taken>
skills_used: [<skill>, ...]          # order of first use
outcome: <shipped | merged | in-flight | partial | blocked | abandoned>
human_corrections: <count | not-captured>   # matches feedback.md's raw-log Part 2 exactly
feedback_ref: feedback-<ts>.md       # the paired feedback file
top_improvements:                    # 3-5, mirrors the backlog, ranked as in B6
  - skill: <skill>
    change: <one line>
    tag: <§V2 tag>
    cost: <observed cost carried from feedback.md>
    repeats: <how many prior feedback files carry this tag>
---
```

**`human_corrections: not-captured` is a first-class value, not a stand-in for zero.** feedback.md is allowed
to record `Not captured — no transcript access for this session.`, and when it does, this field carries
`not-captured` through unchanged. Never resolve an unknown to `0`: a false zero reads as a clean session in
every later tally and is worse than an acknowledged gap. Any consumer that aggregates this field must
exclude `not-captured` rows rather than counting them as zero-correction sessions.

### B1. Session snapshot
Repo, feature/spec(s), kiro version, the stage path actually taken, final outcome, rough effort
(turns / re-work loops), and the headline: the 2–3 biggest skill problems this session.

### B2. Per-skill deep dive
For EACH kiro skill that ran this session:
- **Role & I/O**: what it was asked to do; what it produced.
- **What worked** (keep — cite why).
- **What failed — HARD examples**: the concrete moment(s), quotes from both sides, stage/gate/artifact anchor.
- **Which instruction caused it**: the specific step/wording, OR the missing instruction. Quote it if you
  have it; else `(behavior-inferred)` + enough detail to find it.
- **Proposed edit**: the exact change, **why** it fixes the observed failure, the **expected effect**.
- **Recurrence**: take it from the engineer's §A3 Q4 answer (`one-off | sometimes | every-time`) whenever
  that question was asked. Fall back to your own inference (`once | repeated (count)`) **only** when it
  wasn't, and say which you used. Do not overwrite an engineer's `every-time` with your own read of a single
  session — they have the history and you don't.
- **Confidence**: high | medium | low.

### B3. What to preserve
Explicit list of skill behaviors that worked, so a future edit doesn't regress them. Cite the moment.

### B4. Triage filter (the bridge — the discriminating output)
Route **every** feedback.md entry and **every** human correction into exactly ONE bucket. This is where you
refuse to overfit skills to noisy DX signal:

- **(SKILL-FIX)** — root cause is skill text / architecture / gate. → a B5 backlog item naming the exact
  skill + step.
- **(PROCESS / ONBOARDING)** — real friction, but the fix is docs / defaults / education / expectation-
  setting, not skill logic. Say what the non-skill fix is.
- **(USER / ONE-OFF / MODEL)** — user preference, misunderstanding, out-of-scope ask, or Claude-behavior
  not caused by any skill. → **explicitly rejected, with a one-line "why this is NOT a skill change."**
  This bucket is mandatory — an all-SKILL-FIX triage is a failed triage.
- **(LEARNING)** — a durable project learning, not a framework change. → route to spec `learnings.md` /
  global `{{KIRO_DIR}}/learnings/patterns.md` / `decisions.md` (if a choice between alternatives).

Present as a table:
`| item (anchor) | tag (§V2) | cost | source (feedback Q-n / C-n) | bucket | rationale |`

- **Carry the `tag` and `cost` straight from feedback.md's frontmatter `frictions:` rows** — do not
  re-derive, rename, or re-estimate them here. Part A observed them; Part B only routes them. Re-deriving is
  how the two files drift apart and stop being auditable against each other.
- **Check prior feedback files.** Glob `{{KIRO_DIR}}/feedback/*.md` and count how many previous sessions
  carry this same §V2 tag. A tag recurring across sessions is the strongest available evidence a finding is
  SKILL-FIX rather than USER/ONE-OFF — a single occurrence can be bad luck, the same failure mode three
  times is a design defect. Note the repeat count in `rationale` (e.g. `3rd session with
  CONTEXT-NOT-CARRIED`).
- **A `NEW:<proposed-name>` tag** from feedback.md is routed like any other finding, **and** must be listed
  in §B7 as a candidate addition to §V2 with its one-line description, so the vocabulary grows through
  maintainer review instead of drifting session-by-session.

### B5. Cross-skill, gates & handoffs
- **Handoffs**: did context carry between skills (requirements → design → tasks → impl)? Any later skill
  miss/contradict an earlier one?
- **Gates**: which fired (review, validate-*, kiro-gate, git-guard, RED witness)? Correct? False blocks or
  misses?
- **Steering & learnings**: was all of `{{KIRO_DIR}}/steering/` loaded and used? Prior learnings applied?
- **Subagents (impl)**: implementer/reviewer/debugger behavior; RED witness; self-report vs parent-witnessed.

### B6. Prioritized improvement backlog (the actionable output)
A ranked table — only SKILL-FIX items from B4 land here:

| # | Skill | Exact change | Why (evidence + anchor) | Observed cost | Latent? | Repeats | Expected impact | Confidence | Effort |
|---|-------|--------------|-------------------------|---------------|---------|---------|-----------------|------------|--------|

**Ranking, in order: latent-risk class → observed `cost` → cross-session repeats → confidence.**

Severity-as-a-label is demoted deliberately: it was an agent judgement, and ranking on three multiplied
judgements (`severity × frequency × confidence`) made the backlog unauditable — you could not tell whether
item 1 beat item 4 because of evidence or because of tone. `cost` comes from the transcript (correction
rounds, repair rounds, a rebase, a hot-fix) and `repeats` comes from counting tags across
`{{KIRO_DIR}}/feedback/*.md`. Both are checkable by someone who wasn't there.

**But cost alone must not rank the list, or it inverts priority on the worst class of defect.** A gate that
falsely reports coverage costs *nothing* on the session where something downstream happens to catch it — and
everything on the session where nothing does. Ranking purely on realized cost puts that dead last, beneath a
noisy two-round annoyance. So:
- A `latent: true` finding tagged `FALSE-CONFIDENCE` (or any finding whose `latent_cost` names luck rather
  than a designed backstop) ranks **above** realized-cost items. It is a defect in the safety net itself.
- Among the rest, realized `cost` leads, then repeats, then confidence.
- Never silently reorder to fit a preferred conclusion — if you promote a latent item above a costly one,
  the `Latent?` column plus its `latent_cost` is the justification, visible in the row.

Each row must still be concrete enough that a maintainer can open the named skill and edit it.

### B7. Open questions
- Anything the **maintainer** must verify (e.g. exact skill text you couldn't see).
- Any adoption-critical question feedback.md couldn't resolve, flagged for follow-up.
- **Every `NEW:<proposed-name>` tag** raised in feedback.md, with its one-line description — these are
  candidate §V2 vocabulary additions and only a maintainer may fold them in.
- **Any §A6 blind spot that keeps recurring** across sessions: a criterion repeatedly marked
  `not-assessed` means the instrument itself is blind there, which is a framework problem, not a session
  problem. Name it so the interview or anchor-mining can be adjusted.
