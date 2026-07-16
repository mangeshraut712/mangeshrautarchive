#!/bin/bash
# Vercel Ignored Build Step — cancel wasteful builds (exit 0 = skip, 1 = build).
#
# Wire in the Vercel dashboard (Project → Settings → Git → Ignored Build Step):
#   bash scripts/deployment/vercel-ignore-build.sh
# Docs: https://vercel.com/docs/project-configuration/git-settings#ignored-build-step
#
# Exit codes follow Vercel’s convention: 0 cancels the build, non-zero proceeds.

set -euo pipefail

echo "Vercel build filter checks starting..."
echo "Author: ${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-}"
echo "Branch: ${VERCEL_GIT_COMMIT_REF:-}"
echo "Message: ${VERCEL_GIT_COMMIT_MESSAGE:-}"

# 1. Skip Dependabot builds (saves team build minutes)
author="${VERCEL_GIT_COMMIT_AUTHOR_LOGIN:-}"
if [[ "$author" == "dependabot[bot]" || "$author" == "dependabot" ]]; then
  echo "Ignored: Dependabot commit. Skipping build."
  exit 0
fi

# 2. Skip when the commit message requests it.
# Use portable substring match — do NOT quote the RHS of [[ =~ ]] (quoted patterns
# are treated as literals, so "\[skip ci\]" never matches real [skip ci] messages).
msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"
case "$msg" in
  *'[skip ci]'*|*'[ci skip]'*|*'[skip vercel]'*)
    echo "Ignored: commit message requests skipping build."
    exit 0
    ;;
esac

# 3. Proceed with all other commits
echo "Proceeding with build..."
exit 1
