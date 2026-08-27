# Test Value Guidance

Write tests for behavior, contracts, and risk. Do not test the language or framework.

## Skip Low-Value Tests

Do not create tests only to prove:
- enum values exist
- constants hold their literal value
- DTOs have generated getters, setters, builders, or `equals/hashCode`
- generated code compiles
- annotations or framework wiring exist with no custom logic

These tests add cost and break during harmless refactors.

## Test When There Is Behavior

Write tests when the item does real work or protects a contract:
- enum parsing, mapping, fallback, display text, DB value, API value, or state rules
- constants that control branching, limits, external names, or compatibility
- DTO validation, serialization shape, custom constructors, defaults, or backward compatibility
- Spring wiring with custom conditions, profiles, security, transactions, or error handling

Rule: test enum behavior, not enum existence.
