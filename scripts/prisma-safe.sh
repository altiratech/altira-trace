#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_ROOT="${PRISMA_SAFE_TMP_ROOT:-/tmp/ria-prisma-safe}"

PRISMA_VERSION="$(
  node -p "const pkg = require('$REPO_ROOT/package.json'); const value = pkg.dependencies?.prisma || pkg.devDependencies?.prisma || ''; value.replace(/^[^0-9]*/, '')"
)"
CLIENT_VERSION="$(
  node -p "const pkg = require('$REPO_ROOT/package.json'); const value = pkg.dependencies?.['@prisma/client'] || ''; value.replace(/^[^0-9]*/, '')"
)"

if [[ -z "$PRISMA_VERSION" || -z "$CLIENT_VERSION" ]]; then
  echo "Unable to determine Prisma versions from package.json" >&2
  exit 1
fi

TOOLCHAIN_ROOT="$TMP_ROOT/toolchain-$PRISMA_VERSION"
CACHE_HOME="$TMP_ROOT/cache-$PRISMA_VERSION"
HOME_OVERRIDE="$TMP_ROOT/home-$PRISMA_VERSION"
NPM_CACHE_DIR="$TMP_ROOT/npm-cache-$PRISMA_VERSION"

mkdir -p "$TOOLCHAIN_ROOT" "$CACHE_HOME" "$HOME_OVERRIDE" "$NPM_CACHE_DIR"

export npm_config_cache="$NPM_CACHE_DIR"

if [[ ! -x "$TOOLCHAIN_ROOT/node_modules/.bin/prisma" ]]; then
  npm install --prefix "$TOOLCHAIN_ROOT" --no-audit --no-fund \
    "prisma@$PRISMA_VERSION" \
    "@prisma/client@$CLIENT_VERSION" \
    "@prisma/get-platform@$PRISMA_VERSION"
fi

export XDG_CACHE_HOME="$CACHE_HOME"
export HOME="$HOME_OVERRIDE"

exec "$TOOLCHAIN_ROOT/node_modules/.bin/prisma" "$@"
