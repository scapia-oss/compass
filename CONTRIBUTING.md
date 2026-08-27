# Contributing

Thanks for your interest in Compass. This guide covers how the project is structured, how to make changes, and what to expect from the review process.

## Project structure

Compass is a Claude Code plugin built from source templates. The repository has two kinds of content:

- **Source** (`tools/cc-sdd/templates/`, `tools/cc-sdd/scripts/`, `tools/cc-sdd/test/`): the templates, builder, and tests that produce the plugin. This is what contributors edit.
- **Generated artifact** (`plugin/`): the built plugin that users install. This is produced by CI and published to the `release` branch. It is never committed to `main`.

## Branches

| Branch | Purpose | Who writes to it |
|--------|---------|-----------------|
| `main` | Source templates, builder, tests, docs | Contributors via pull requests |
| `release` | Generated plugin artifact + marketplace metadata | **CI only** — force-pushed on every merge to `main` |
| `gh-pages` | Published documentation site | Maintainers only |

**Do not open pull requests against `release`.** It is force-pushed by CI on every merge to `main`. Any manual commit there will be overwritten.

**Do not commit `plugin/` on `main`.** The `.gitignore` excludes it. If you see a `plugin/` directory locally after running a build, that is expected and should not be staged.

### Branch protection

- `main` requires a pull request with at least one approval and passing CI before merge.
- `release` is restricted to the CI bot (`github-actions[bot]`). No human pushes.
- `gh-pages` does not allow force pushes or deletion.

## Branch naming conventions

Use the following prefixes for your branches:

| Prefix | Use for | Example |
|--------|---------|---------|
| `feat/` | New features or capabilities | `feat/multi-repo-spec-link` |
| `fix/` | Bug fixes | `fix/empty-spec-dir-crash` |
| `docs/` | Documentation changes | `docs/improve-install-guide` |
| `refactor/` | Code improvements without behavior change | `refactor/simplify-builder-copy` |
| `test/` | Test additions or improvements | `test/add-steering-load-coverage` |
| `chore/` | Maintenance (deps, CI, tooling) | `chore/update-vitest` |

**Format:** `<prefix>/<short-kebab-description>`

- Keep it short and descriptive (3-5 words max after the prefix).
- Use lowercase and hyphens, no underscores or camelCase.
- No issue numbers in the branch name — reference issues in the PR description instead.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type: short description

Optional longer explanation.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

Keep the subject line under 72 characters. Use the body for context when the "why" isn't obvious from the subject.

## Making a change

### Setup

```bash
git clone https://github.com/scapia/compass.git
cd compass/tools/cc-sdd
npm ci
```

### Edit-build-test cycle

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-change
   ```

2. Edit source files under `tools/cc-sdd/templates/` (skills, rules, settings, hooks, scripts) or `tools/cc-sdd/scripts/` (the builder itself).

3. Run the full validation:
   ```bash
   npm run ci
   ```
   This installs dependencies, builds a transient `plugin/`, and runs all tests. The build is deterministic: given the same source, it produces the same output byte-for-byte.

4. If tests pass, commit your source changes and open a PR against `main`.

### What to include in a PR

- Source changes only. Do not include `plugin/`, `node_modules/`, `dist/`, or `coverage/`.
- If you changed a skill, rule, hook, or script: describe what user-visible behavior changed.
- If you changed the builder: describe what the generated output difference is.

## How the pipeline works

1. A contributor opens a PR against `main` with source changes.
2. CI runs: installs dependencies, builds a transient `plugin/` in memory, runs the test suite (including the parity test that verifies the build is deterministic).
3. Maintainer reviews and merges the PR (squash or rebase).
4. On merge to `main`, the release workflow rebuilds the plugin, stamps a version number, and force-pushes the result to the `release` branch as a standalone tree (marketplace metadata + `plugin/` only).
5. Users install from the `release` branch. They never need Node.js, npm, or a build step.

```
PR → main (source) → CI build → release (generated artifact) → users install
```

## Pull request guidelines

### Before opening

- [ ] Branch is up to date with `main`
- [ ] `npm run ci` passes locally (from `tools/cc-sdd/`)
- [ ] No `plugin/` directory committed
- [ ] PR has a clear title in conventional commit format

### PR labels

Labels are applied by maintainers during triage. Common labels:

| Label | Meaning |
|-------|---------|
| `bug` | Bug fix |
| `enhancement` | New feature or improvement |
| `documentation` | Docs-only change |
| `breaking` | Introduces a breaking change |
| `area: skills` | Changes to skill templates |
| `area: builder` | Changes to the build pipeline |
| `area: rules` | Changes to shared rules/settings |
| `area: hooks` | Changes to plugin hooks |
| `priority: critical` | Blocks users, needs immediate fix |
| `good first issue` | Good for newcomers |

### Review process

- PRs are reviewed for correctness, security, and alignment with the spec-driven development workflow.
- CI must pass. Failing CI blocks merge.
- The parity test catches source/generated drift automatically.
- PRs are merged via squash (preferred) or rebase. Merge commits are disabled.
- Branches are auto-deleted after merge.

## Reporting issues

- **Bugs**: use the [bug report template](https://github.com/scapia/compass/issues/new?template=bug_report.yml)
- **Features**: use the [feature request template](https://github.com/scapia/compass/issues/new?template=feature_request.yml)
- **Questions**: use the [question template](https://github.com/scapia/compass/issues/new?template=question.yml)
- **Security**: see [SECURITY.md](SECURITY.md) — do not report security issues in public issues

## Docs site (`gh-pages`)

The documentation site is published from the `gh-pages` branch. If your change affects user-facing behavior (new command, changed workflow, removed feature), mention it in the PR so a maintainer can update the docs.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).
