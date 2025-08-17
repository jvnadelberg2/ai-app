#!/usr/bin/env bash
set -euo pipefail
OWNER=${OWNER:-jvnadelberg2}
REPO=${REPO:-ai-app}
BRANCH=${BRANCH:-main}
gh api -X PATCH -H "Accept: application/vnd.github+json" \
  "/repos/$OWNER/$REPO/branches/$BRANCH/protection/required_status_checks" \
  --input .github/required-checks.json
gh api "/repos/$OWNER/$REPO/branches/$BRANCH/protection" --jq '.required_status_checks.contexts'

 