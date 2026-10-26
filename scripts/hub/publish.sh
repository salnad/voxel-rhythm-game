#!/usr/bin/env bash
# Publishes the playtest hub to the gh-pages branch: applies the builds in ./incoming,
# reconciles PR state (archive merged, drop closed) and regenerates the index.
# gh-pages is kept as a single commit so old builds don't pile up in history; runs that race
# each other retry against the latest branch thanks to --force-with-lease.
# Needs GH_TOKEN (contents: write, pull-requests: read), GITHUB_REPOSITORY, RUNNER_TEMP.
set -euo pipefail

HUB="$(cd "$(dirname "$0")" && pwd)"
INCOMING="$(pwd)/incoming"
WORK="$RUNNER_TEMP/gh-pages"
PRS="$RUNNER_TEMP/prs-latest.json"
REMOTE="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
MESSAGE="${HUB_MESSAGE:-update}"

publish() {
  rm -rf "$WORK" && mkdir -p "$WORK" && cd "$WORK"
  git init -q
  git remote add origin "$REMOTE"
  local old=""
  if git fetch -q --depth 1 origin gh-pages 2>/dev/null; then
    old="$(git rev-parse FETCH_HEAD)"
    git checkout -q FETCH_HEAD
    git checkout -q --orphan publish
  fi
  gh api "repos/$GITHUB_REPOSITORY/pulls?state=all&sort=updated&direction=desc&per_page=100" >"$PRS"
  node "$HUB/site.ts" update . "$INCOMING" "$PRS"
  git add -A
  git -c user.name='github-actions[bot]' \
    -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    commit -q -m "Playtest hub: $MESSAGE"
  git push -q --force-with-lease="gh-pages:${old}" origin HEAD:refs/heads/gh-pages
}

for attempt in 1 2 3 4 5; do
  set +e
  (
    set -e
    publish
  )
  rc=$?
  set -e
  if [ "$rc" -eq 0 ]; then
    echo "published on attempt $attempt"
    exit 0
  fi
  echo "publish attempt $attempt failed ($rc), retrying"
  sleep $((attempt * 3))
done
exit 1
