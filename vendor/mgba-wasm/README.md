# Vendored mGBA WASM core

`dist/` contains mGBA compiled to WebAssembly, the same core that [gbajs3](https://github.com/thenick775/gbajs3) uses. It comes from [thenick775/mgba](https://github.com/thenick775/mgba/tree/feature/wasm), a community fork of [mGBA](https://mgba.io). The core is licensed under [MPL-2.0](./LICENSE).

`dist/` holds one of two builds:

- **Patched build**, produced by [`core/build.sh`](../../core/build.sh). The script checks out a pinned commit of the fork and applies [`core/patches/`](../../core/patches). The patch adds `readMemory(address, length)`, which reads the GBA bus with no side effects. The build runs in Emscripten inside Docker.
- **Stock npm build** (`@thenick775/mgba-wasm` 2.5.1). It has no memory-read export.

The app detects which build it has at runtime through `Emulator.memoryAccess` in `src/emulator/emulator.ts`:

- With the patched build, it reads live memory.
- With the stock build, it falls back to save-state snapshots.

The source for every modified file is in this repository, as MPL-2.0 requires.
