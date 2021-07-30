# chipeight -> CHIP-8 + WASM emulator

- A CHIP-8 emulator made in Rust and compiled in WebAssembly.

- Not 100% original, based in [this](https://github.com/ColinEberhardt/wasm-rust-chip8) project by [Colin Eberhardt](https://github.com/ColinEberhardt).

## What is CHIP-8  

CHIP-8 is a interpreted programming language created in the mid 70's, it was mainly used in DIY projects by hobbyists and appeared in some graphic calculators too.  

Nowadays it is used to develop retro games and systems.  

If you're curious check this [source](https://chip-8.com) or the [wikipedia page](https://wikipedia.org/wiki/chip-8).  

-------------------------------------------------------------------------------------------------------------------------------

## Building

This emulator uses a *(not that much)* new version of the `wasm32-unknown-unknown` target wich has a complicated [setup process](https://www.hellorust.com/setup/wasm-target/). Once installed simply run the `build.sh` script.
