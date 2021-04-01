#!/bin/sh
rustc +nightly --target wasm32-unknown-unknown -O --crate-type=cdylib src/lib.rs -o web/chip8.wasm
cargo install --force --git https://github.com/alexcrichton/wasm-gc
wasm-gc web/chip8.wasm web/chip8.wasm