# Interaction Style — how kiro asks the user a question

Applies to every turn where a kiro skill needs an answer from the developer. The goal is one
predictable input mechanism, so the same question never arrives as an arrow-key picker in one run
and a "type 1, 2, or 3" text prompt in the next.

## The default: closed questions use `AskUserQuestion`

**A closed question — one where you can name the plausible answers up front — MUST be asked with the
`AskUserQuestion` tool.** That covers spec-type selection, workflow/artifact picks, phase approval
gates ("proceed to design?"), scope and priority calls, disambiguating a generated name, and
re-confirming a decision. Never render a closed question as an ASCII menu ending in
`Type 1, 2, or 3:` and never as a bare `(yes/no)` / `(y/n)` line in chat.

Rules for the call:

1. **2–4 options, concrete and distinct.** The tool caps options at 4. Put your recommended option
   first and suffix its label with `(Recommended)` when you have a defensible default; say why in the
   `description`. The `description` field carries the sub-caption that a text menu would have put
   under the option name — use it, don't leave options bare.
2. **Never hand-author an "Other" option.** The harness appends one plus a free-text box, so the
   options scaffold the answer without confining it. If a legitimate fifth choice exists, ship the
   four that matter and let the rare one arrive through "Other" — mention it in the question text.
3. **One topic per question.** Don't stack a gauntlet into a single turn. Multiple *independent*
   questions may share one call only when the user can sensibly answer them together in one screen.
4. **If the schema isn't loaded**, call `ToolSearch` with `select:AskUserQuestion` first.
5. **Never silently skip the question.** Fall back to numbered text options in chat ONLY when the
   tool genuinely cannot be called (host doesn't provide it). That is a fallback, not a style choice.

## Question wording

These rules change expression only. They do not change whether a question is needed, whether it is
closed or open, how many questions a phase may ask, or when a critique loop exits.

- Start with the decision point, not a preamble. Do not write "I want to understand", "just to
  clarify", "before we proceed", or "quick question".
- If evidence triggered the question, show it first as `Basis: <file:line or verified fact>`.
- Ask the question in one sentence when possible.
- One topic per question. If the wording needs "and", split it unless the two choices are one
  inseparable decision.
- For closed questions, make each option name the decision and put the trade-off in the description.
- For open questions, ask for the missing decision, trace, or constraint. Do not ask "any concerns?",
  "thoughts?", or a yes/no trap.
- After the developer answers, restate only the decision and consequence. Do not replay the full
  answer unless the exact wording is being logged.
- If you push back, use this shape: `I would push back because <basis>. If we still choose this, I
  will record <risk/consequence>.`

Example:

- Weak: "I want to understand a little more about rollout. Do you want a flag, and should we add
  metrics and fallback behavior?"
- Better: "Basis: this changes checkout behavior, so rollback needs to be cheap. How should rollout
  work?"

## When plain prose is correct instead

Ask open-ended, in chat, with no tool, when the answer is genuinely open: (a) it's inherently
narrative ("what should change, and for whom?"), (b) listing options would bias the answer, or
(c) you'd be straining to fill 3–4 distinct plausible slots. Asking the engineer to trace a failure
mode, or to describe intent when the request is still too vague to act on, is open by design — do not
force those into a picker.

**The test is per question, never per step.** A step labelled "clarify" or "gather context" is not
blanket-prose: the moment one of its questions reduces to a choice among alternatives you can name,
that question is closed and goes through `AskUserQuestion`. This is the common failure — investigation
(triage, grounding, a codebase scan) surfaces the concrete alternatives, and *because* you now know
them the question has become closed. Reconciling a divergence you just found in the code, or choosing
where config/content comes from, is a closed question no matter which step you are in.

An open-ended question must still be specific. Banned: "any concerns?", yes/no traps, warmth
wrappers.

## Formatting still applies to *output*, not to questions

The plain-text / UPPERCASE / dash-line format rules in the skills govern **status output, banners,
summaries, and journey maps** — text the user reads. They do not govern how a question is asked; a
question goes through `AskUserQuestion`, whose rendering the harness owns.
