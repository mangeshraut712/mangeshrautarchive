#!/bin/bash

# Vercel Ignored Build Step Script
# Determines whether Vercel should build the current commit.
# Exits with 0 to cancel/skip the build, or 1 to proceed with the build.

echo "🔍 Vercel build filter checks starting..."
echo "👤 Author: $VERCEL_GIT_COMMIT_AUTHOR_LOGIN"
echo "🌿 Branch: $VERCEL_GIT_COMMIT_REF"
echo "📝 Message: $VERCEL_GIT_COMMIT_MESSAGE"

# 1. Skip Dependabot builds
if [[ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "dependabot[bot]" ]] || [[ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "dependabot" ]]; then
  echo "✅ Ignored: Commit is from Dependabot. Skipping build to conserve team hours."
  exit 0
fi

# 2. Skip builds with [skip ci], [ci skip], or [skip vercel] in the commit message
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" =~ "\[skip ci\]" ]] || [[ "$VERCEL_GIT_COMMIT_MESSAGE" =~ "\[ci skip\]" ]] || [[ "$VERCEL_GIT_COMMIT_MESSAGE" =~ "\[skip vercel\]" ]]; then
  echo "✅ Ignored: Commit message requests skipping build. Skipping build to conserve team hours."
  exit 0
fi

# 3. Allow all other builds (e.g. normal user commits on production/preview branches)
echo "🛑 Proceeding with build..."
exit 1
