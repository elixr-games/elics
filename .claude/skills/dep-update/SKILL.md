---
name: dep-update
description: Review, merge, and release dependency update PRs. Merges green dependabot PRs, closes stale/failing ones, runs full verification, and publishes a patch release.
disable-model-invocation: true
allowed-tools: >
  Read,
  Edit,
  Write,
  Glob,
  Grep,
  Bash(gh pr *),
  Bash(gh release *),
  Bash(gh run *),
  Bash(git pull *),
  Bash(git add *),
  Bash(git commit *),
  Bash(git push *),
  Bash(git tag *),
  Bash(git log *),
  Bash(git status *),
  Bash(git diff *),
  Bash(npm install *),
  Bash(npm run typecheck *),
  Bash(npm run lint *),
  Bash(npm run build *),
  Bash(npm test *),
  Bash(npm ci *)
---

# Dependency Update & Patch Release

Merge open dependency-update PRs and cut a patch release.

## Step 1: List open PRs

```bash
gh pr list --repo elixr-games/elics --state open --json number,title,reviews,statusCheckRollup,mergeable --jq '.[] | {number, title, checks: [.statusCheckRollup[] | {name: .name, conclusion: .conclusion}], reviews: [.reviews[] | {author: .author.login, state: .state}]}'
```

## Step 2: Triage each PR

For each open PR, decide:

- **Merge** if ALL CI checks pass (conclusion: SUCCESS). Merge with `gh pr merge <number> --repo elixr-games/elics --merge`.
- **Close** if CI is failing and the PR is a dependency bump (dependabot will re-open with a newer version). Close with `gh pr close <number> --repo elixr-games/elics --comment "<reason>"`.
- **Close** if the PR is outdated (the dependency was already upgraded past the PR's target version in the current codebase). Check `package.json` and `package-lock.json` to confirm.
- **Skip with merge conflict** PRs that can't merge cleanly. Close them with a comment noting the conflict; dependabot will re-open.

Merge PRs one at a time. If a merge fails due to conflicts, close that PR and move on.

## Step 3: Pull and install

```bash
git pull --rebase
npm install
```

## Step 4: Full verification

Run all checks. ALL must pass before proceeding:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

If anything fails, investigate and fix before continuing. Do NOT release with failures.

## Step 5: Patch release

Only proceed if PRs were actually merged in Step 2. If no PRs were merged (all closed or skipped), stop here.

1. Bump the patch version in `package.json` (e.g., 3.4.1 -> 3.4.2)
2. Commit and push:

```bash
git add package.json package-lock.json
# Include any other changed files (workflow files, etc.)
git commit -m "<version>\n\nDependency updates:\n- <list bumped packages>"
git push origin main
```

3. Tag and release:

```bash
git tag v<version>
git push origin v<version>
gh release create v<version> --repo elixr-games/elics --title "v<version>" --notes "<bullet list of merged PRs>"
```

No changelog entry needed for patch releases.

## Step 6: Verify release

```bash
gh run list --repo elixr-games/elics --workflow release.yml --limit 1
```

Report the release workflow status.

## Output

Summarize what was done:

- How many PRs merged, closed, skipped
- Which packages were updated
- The new version number
- Release workflow status
