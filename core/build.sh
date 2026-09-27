#!/usr/bin/env bash
# Rebuilds the patched mGBA WASM core into vendor/mgba-wasm/dist.
# mGBA and thenick775/mgba are MPL-2.0; the modifications are core/patches/*.patch.
set -euo pipefail

MGBA_REPO="https://github.com/thenick775/mgba.git"
MGBA_COMMIT="d5e226c63725f79bc96c7f75e2c8cbf07af9f2cd" # feature/wasm, 2026-09-22 (npm 2.5.1 + fixes)
IMAGE="emerald-lens/mgba-wasm:emsdk-6.0.5"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/core/.build/mgba"
OUT="$ROOT/vendor/mgba-wasm/dist"

if [ ! -d "$WORK/.git" ]; then
  git init -q "$WORK"
  git -C "$WORK" remote add origin "$MGBA_REPO"
fi
git -C "$WORK" fetch -q --depth 1 origin "$MGBA_COMMIT"
git -C "$WORK" checkout -q --force FETCH_HEAD
git -C "$WORK" clean -qfdx -e build-wasm
for patch in "$ROOT"/core/patches/*.patch; do
  git -C "$WORK" apply "$patch"
done

docker build -t "$IMAGE" "$WORK/src/platform/wasm/docker"

# Git Bash on Windows needs a native path for the bind mount
MOUNT="$(cd "$WORK" && (pwd -W 2>/dev/null || pwd))"
MSYS_NO_PATHCONV=1 docker run --rm -v "$MOUNT:/home/mgba/src" "$IMAGE"

rm -rf "$OUT" && mkdir -p "$OUT"
cp "$WORK"/build-wasm/wasm/mgba.js "$WORK"/build-wasm/wasm/mgba.wasm "$OUT"/
cp "$WORK"/src/platform/wasm/mgba.d.ts "$OUT"/
echo "mGBA core built -> $OUT"
