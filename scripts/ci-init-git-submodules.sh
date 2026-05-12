#!/usr/bin/env bash
# Init git submodules in GitHub Actions without the job token for github.com.
#
# actions/checkout sets http.https://github.com/.extraheader to GITHUB_TOKEN.
# That token only grants access to the *current* repository, so git reports
# "repository not found" when cloning submodules that point at other repos—even
# when those repos are public. Unset the injected header so submodule URLs clone
# anonymously (works for public repos).
set -euo pipefail

# actions/checkout@v4 injects http.https://github.com/.extraheader via
# GIT_CONFIG_KEY_* / GIT_CONFIG_VALUE_* environment variables, which break
# submodule clone for other repositories (token scope limited to current repo).
# Clear them regardless — we set our own extraheader below.
unset GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0 GIT_CONFIG_KEY_1 GIT_CONFIG_VALUE_1 GIT_CONFIG_COUNT 2>/dev/null || true

# Disable interactive username/password prompt (CI is non-interactive).
export GIT_TERMINAL_PROMPT=0

clean_submodule_worktrees() {
  # Self-hosted runners may reuse workspace with stale files inside submodules.
  # Clean recursively before checkout to avoid "untracked files would be overwritten".
  git submodule foreach --recursive 'git reset --hard || true; git clean -fd || true'
}

# Pick a token if any is available. Both submodule repos are public but
# HTTPS clone on self-hosted runner needs some credential to avoid the
# "could not read Username" prompt.
# Priority: APRIL_PROFILE_GH_TOKEN (cross-repo app token) > NODE_AUTH_TOKEN (GPR) > GITHUB_TOKEN.
GHA_TOKEN="${APRIL_PROFILE_GH_TOKEN:-${NODE_AUTH_TOKEN:-${GITHUB_TOKEN:-}}}"

if [ -n "$GHA_TOKEN" ]; then
  auth_header="$(printf 'x-access-token:%s' "$GHA_TOKEN" | base64 | tr -d '\n')"
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" submodule sync --recursive
  clean_submodule_worktrees
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" submodule update --init --recursive
  exit 0
fi

# No token at all — fallback to config-unset + anonymous (works for public repos
# when no credential manager intercepts).
git config --local --unset-all http.https://github.com/.extraheader 2>/dev/null || true
git config --global --unset-all http.https://github.com/.extraheader 2>/dev/null || true

git submodule sync --recursive
clean_submodule_worktrees
git submodule update --init --recursive
