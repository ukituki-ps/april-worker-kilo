#!/usr/bin/env bash
# Init git submodules in GitHub Actions without the job token for github.com.
#
# actions/checkout sets http.https://github.com/.extraheader to GITHUB_TOKEN.
# That token only grants access to the *current* repository, so git reports
# "repository not found" when cloning submodules that point at other repos—even
# when those repos are public. Unset the injected header so submodule URLs clone
# anonymously (works for public repos).
set -euo pipefail

clean_submodule_worktrees() {
  # Self-hosted runners may reuse workspace with stale files inside submodules.
  # Clean recursively before checkout to avoid "untracked files would be overwritten".
  git submodule foreach --recursive 'git reset --hard || true; git clean -fd || true'
}

if [ -n "${APRIL_PROFILE_GH_TOKEN:-}" ]; then
  auth_header="$(printf 'x-access-token:%s' "$APRIL_PROFILE_GH_TOKEN" | base64 | tr -d '\n')"
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" submodule sync --recursive
  clean_submodule_worktrees
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" submodule update --init --recursive
  exit 0
fi

git config --local --unset-all http.https://github.com/.extraheader 2>/dev/null || true
git config --global --unset-all http.https://github.com/.extraheader 2>/dev/null || true

git submodule sync --recursive
clean_submodule_worktrees
git submodule update --init --recursive
