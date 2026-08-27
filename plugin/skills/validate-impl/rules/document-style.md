# Plain Document Style

Use this rule for generated spec documents, reviews, and validation reports.

## Goal

Write so a teammate can read fast and act with confidence.

Use simple English. Keep the meaning. Remove the noise.

## Format First

Do not shorten by deleting useful facts. Shorten by changing the format.

- Use a diagram when structure, flow, or dependency order matters.
- Use a table when mapping many things.
- Use bullets for short lists.
- Use prose only for decisions, trade-offs, risks, and context.

After a diagram, do not narrate every arrow. Add only what the diagram does not show.

## Plain Words

Use direct words:

- "changes" instead of "delta"
- "affected files" instead of "blast radius"
- "rule we must keep" instead of "invariant"
- "later step" instead of "downstream"
- "owner" instead of "authoritative source"
- "trade-off" instead of "architectural consideration"

Use exact technical names when they matter: class names, APIs, tables, widgets, routes, events, and config keys.

If a rare technical term is required, define it once in plain words.

Do not use a vague word where a measurable one is meant. Replace `fast`, `robust`, `scalable`,
`secure`, `intuitive` with the concrete target (a number, a condition, a named behavior) — or drop
the adjective. Do not use empty verbs that say nothing: `handle`, `manage`, `wire up`, `support`.
Name the actual action and its observable result instead.

Aim the writing at a junior engineer or a new joiner: they should follow the sentence without a
glossary. Exact technical names are fine; fancy words are not.

## Sentence Framing

- Put one idea in one sentence.
- Use active voice.
- Name the actor when it matters.
- Prefer "The service validates the request" over "The request is validated."
- Avoid filler such as "it is important to note", "as mentioned above", and "in order to".
- Never start with preamble such as "I will now", "Let's", "As you can see", or "This document will".
- Do not end with filler such as "In summary" or a confidence-building conclusion.
- Avoid corporate or formal tone.
- Reader test: a person who does not know cc-sdd must be able to understand the line on its own.
  Terse is fine; cryptic is not.
- Do not use a heading, a section title, or a requirement id as if it were a sentence. A label is not
  a statement.

This is guidance, not a hard cap. Keep all important facts.

## Density Rules

Every line must carry information.

- Before writing a line, ask: if this line is removed, does meaning change? If not, cut it.
- Use one fact per bullet. If a bullet needs "and", split it when the ideas can stand alone.
- Do not add empty sections.
- When a template section does not apply, **remove it entirely.** Do not keep the heading with `N/A`,
  `None`, "not applicable", or a placeholder — an empty heading still costs the reader a stop.
- Do not add "Introduction" or "Conclusion" sections unless the template already requires them.
- If a section grows past about 6 bullets, add a subheading or table. Do not delete useful facts to hit a number.
- Keep section intros to 1-2 sentences unless a real decision needs more context.

## Keep The Document Current

State the design as it is now. The reader should never have to work out which version is the live one.

- When something changes, **replace** the old text. Do not leave the old version next to the new one,
  and do not narrate the change inside the document ("previously X, now Y", "corrected", "superseded",
  "earlier draft").
- The reason a choice was made, and any choice it replaced, belongs in `decisions.md` — recorded there
  as `replaced by D-<n>`, not re-argued in the design body. The design body may point to it in one
  line (`→ D-<n>`); it must not carry the history.
- This is a rule about the artifact, not about who edits it: whoever writes or regenerates the file
  leaves no obsolete, contradictory text behind.

No fact is lost by this rule — reasons and replaced options move to `decisions.md`; only the stale copy
inside the design body goes away.

## Evidence Rules

Make claims checkable.

- For current code behavior, cite `file:line` when a local file supports the claim.
- Prefer `path/Class#method` or `path:line` over a long explanation of code the reader can inspect.
- Do not cite when writing pure target behavior that has no current code evidence yet.
- When evidence is missing, say what still needs to be checked instead of guessing.

Example:

- Weak: "The best approach would be to add a middleware layer that checks tokens."
- Better: "Add token-check middleware in `auth/`. Current flow has no expiry check — `auth.ts:88`."

## Plan-Shaped Writing

When a document explains a change plan, use this shape when it fits:

1. Open with 1-2 sentences: what changes, why, and what is out of scope.
2. Current State: facts only, with file or contract evidence where relevant.
3. Approach: chosen strategy, plus one rejected alternative and why.
4. Steps: imperative, ordered by dependency, tied to files or locations when known.
5. Files touched: one line per file, with the job of that file.
6. Risks / open questions: end here when there are real risks or decisions.

Do not force this shape onto requirements that only need behavior statements. Use it for plans,
design notes, gap reports, validation reports, and quick-spec intent docs. Do not add plan-shaped
sections to `tasks.md`; task files must stay transactional.

## HLD Style

Make the HLD easy to review.

- Prefer C4-style context, container, and component diagrams.
- Use tables for scope, contracts, affected areas, alternatives, risks, and open questions.
- Keep file names and code snippets out unless they are needed to explain a major risk.
- Focus on shape, boundaries, flows, and decisions.
- State one rejected architecture option when it was a serious contender. Keep it to one line unless
  the trade-off is risky.

## LLD Style

Make the LLD easy to implement.

- Name real files, classes, APIs, tables, widgets, providers, routes, and config keys.
- Group file plans by backend, frontend, data, config, or repo when that is clearer than one large table.
- Add small shape-only code snippets for important changes.
- Do not include full business logic in snippets.
- Keep snippets close to the files or contracts they explain.
- Make steps and file plans concrete enough that an implementer can start without re-reading the HLD.

## Requirements Style

Make requirements observable.

- Describe what the user, operator, or system can see.
- Keep implementation choices out of requirements.
- Use simple requirement names.
- Keep acceptance criteria precise and testable.

## Review And Validation Style

Make reports easy to act on.

- Start with the decision or status.
- Put issues in priority order.
- For each issue, show: issue, impact, fix, evidence.
- Do not pad with praise or generic advice.
- Use plain severity names: Critical, Warning, Info.
