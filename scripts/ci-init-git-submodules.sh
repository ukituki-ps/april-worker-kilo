#!/usr/bin/env bash
# Init git submodules in GitHub Actions without the job token for github.com.
#
# actions/checkout sets http.https://github.com/.extraheader to GITHUB_TOKEN.
# That token only grants access to the *current* repository, so git reports
# "repository not found" when cloning submodules that point at other repos—even
# when those repos are public. Unset the injected header so submodule URLs clone
# anonymously (works for public repos).
set -euo pipefail

git config --local --unset-all http.https://github.com/.extraheader 2>/dev/null || true
git config --global --unset-all http.https://github.com/.extraheader 2>/dev/null || true

git submodule sync --recursive
git submodule update --init --recursive
