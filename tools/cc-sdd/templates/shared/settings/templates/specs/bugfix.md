# Bugfix Analysis Template

---
**Purpose**: Capture the defect, the expected correction, and the behaviors that must remain unchanged (regression guardrails).

**Approach**:
- Write in plain, simple English. Follow the document-style rule.
- Use EARS-style notation for each behavior category
- The "Unchanged Behavior" section is critical — it defines the regression test boundary
- Every item in Unchanged Behavior becomes a regression test in the task list
---

## Current Behavior (Defect)
Document what is currently broken. For each defect, use the EARS format:

- WHEN [condition/trigger] THEN the system [incorrect behavior observed]

**Example**:
- WHEN a user submits a form with special characters in the name field THEN the system crashes with an unhandled exception instead of displaying the name

**Guidance**: Be specific. Name the trigger and the wrong result. Include error messages, stack traces, or screenshots if available. Each entry should describe one defect.

## Expected Behavior (Correct)
Document what should happen after the fix. For each correction, use the EARS format:

- WHEN [same condition/trigger] THEN the system SHALL [correct behavior expected]

**Example**:
- WHEN a user submits a form with special characters in the name field THEN the system SHALL accept the input and display the name with special characters preserved

**Guidance**: Match each broken behavior with the expected result. Use "SHALL" for required behavior. Be precise about output, state change, or user experience.

## Unchanged Behavior (Regression Prevention)
Document existing correct behaviors that must NOT change as a result of the fix. This section is the most important — it defines what the fix must NOT break.

- WHEN [condition] THEN the system SHALL continue to [existing correct behavior that must be preserved]

**Example**:
- WHEN a user submits a form with a normal ASCII name THEN the system SHALL continue to accept the input and display the name correctly
- WHEN a user submits an empty name field THEN the system SHALL continue to show the "Name is required" validation error

**Guidance**: Think about nearby behavior that uses the same code. What else uses this function or module? Which user flows pass through it? Which tests already cover it? Every item here becomes a regression test.

**Why this matters**: Bugfixes often break nearby behavior. This section says exactly what must still work.
