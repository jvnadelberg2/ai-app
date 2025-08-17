#!/usr/bin/env bash
set -euo pipefail
REPO_SLUG="$(git config --get remote.origin.url | sed -E 's#.*github.com[:/](.+/.+)(\.git)?#\1#')"
BRANCH="${1:-main}"
gh api -X PATCH -H "Accept: application/vnd.github+json" "/repos/$REPO_SLUG/branches/$BRANCH/protection/required_status_checks" --input .github/required-checks.json
gh api "/repos/$REPO_SLUG/branches/$BRANCH/protection" --jq '.required_status_checks.contexts'
