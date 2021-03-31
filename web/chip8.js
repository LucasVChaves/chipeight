const res = await fetch("chip8.wasm");
const buffer = await res.arrayBuffer();
const module = await WebAssembly.compile(buffer);
const instance = await WebAssembly.instantiate(module);
const exports = instace.exports;

const programMemory = new Uint8Array(
     exports.memory.buffer,
     exports.get_memory(),
     4096
);

const runloop = () => {
     for (var i = 0; i < 10; i++) {
          exports.execute_cycle();
     }
}
exports.decrement_timers();
updateUI();
window.requestAnimationFrame(runloop);
//window.requestAnimationFrame(runloop);