# Cross-Spec Patterns

Distilled lessons from individual spec learnings. Each pattern is a reusable rule that applies across specs in this project. Loaded as context by content-generating skills.

<!-- Append-only: never delete, rewrite, reorder, or renumber existing pattern headings. -->
<!-- Entries are appended when a correction has a generalizable pattern. -->
<!-- Every new pattern must include **Source spec** pointing back to the spec learnings.md entry. -->
<!-- On dedup, add a new Example to the existing pattern instead of creating a duplicate. -->
<!-- Cap: 5 examples per pattern. Oldest replaced when at capacity. -->
<!-- Validate before claiming success:
python3 "${CLAUDE_SKILL_DIR}/scripts/validate-patterns-append-only.py" "$(pwd)" --base <base-ref>
-->

<!-- Example format:

## P-1: Async integrations need timeout and retry requirements
- **Pattern**: When designing async integrations (webhooks, queues, external APIs), always require explicit timeout, retry policy, and circuit breaker requirements.
- **When violated**: AI generates happy-path-only designs that fail silently under network issues.
- **Source spec**: `.kiro/specs/features/2026-05-15-payment-gateway/learnings.md#l-3-timeout-and-retry-policy`
- **Example 1** (payment-gateway, design-hld, 2026-05-15): AI designed webhook dispatch with no timeout. Human corrected: "Use exponential backoff with jitter — we've been burned by thundering herd before."
- **Example 2** (messaging-service, design-lld, 2026-05-22): AI proposed fire-and-forget delivery. Human corrected: "Need DLQ and retry — downstream providers can fail silently."

-->
