#!/usr/bin/env bash
#
# sync-fork.sh — Pull latest from upstream (siteboon/claudecodeui),
# update the fork (ivan-bax/claudecodeui), and rebase the custom
# feat/teleport-auth branch on top.
#
# Usage:
#   ./scripts/sync-fork.sh          # from the repo root
#   ./scripts/sync-fork.sh --push   # also push rebased branch to fork
#
set -euo pipefail

UPSTREAM_REMOTE="origin"       # siteboon/claudecodeui
FORK_REMOTE="fork"             # ivan-bax/claudecodeui
BASE_BRANCH="main"
CUSTOM_BRANCH="feat/teleport-auth"

cd "$(git rev-parse --show-toplevel)"

echo "==> Fetching upstream ($UPSTREAM_REMOTE)..."
git fetch "$UPSTREAM_REMOTE"

echo "==> Fetching fork ($FORK_REMOTE)..."
git fetch "$FORK_REMOTE"

# Update local main from upstream
echo "==> Updating local $BASE_BRANCH from $UPSTREAM_REMOTE/$BASE_BRANCH..."
git checkout "$BASE_BRANCH"
git merge --ff-only "$UPSTREAM_REMOTE/$BASE_BRANCH"

# Push updated main to the fork
echo "==> Pushing $BASE_BRANCH to $FORK_REMOTE..."
git push "$FORK_REMOTE" "$BASE_BRANCH"

# Rebase custom branch on top of updated main
echo "==> Rebasing $CUSTOM_BRANCH onto $BASE_BRANCH..."
git checkout "$CUSTOM_BRANCH"
git rebase "$BASE_BRANCH"

if [[ "${1:-}" == "--push" ]]; then
  echo "==> Force-pushing $CUSTOM_BRANCH to $FORK_REMOTE..."
  git push "$FORK_REMOTE" "$CUSTOM_BRANCH" --force-with-lease
  echo "==> Done! Fork is up to date and $CUSTOM_BRANCH has been pushed."
else
  echo "==> Done! Fork main is up to date and $CUSTOM_BRANCH is rebased locally."
  echo "    Run with --push to also push $CUSTOM_BRANCH to the fork."
fi
