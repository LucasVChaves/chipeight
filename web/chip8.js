const hex = (value, length = 2) => {
     const padded = "0000" + value.toString(16).toUpperCase();
     return padded.substr(padded.length - length);
}

const inRange = (value, lower, upper) => value >= lower && value <= upper;

const ROMS = [
     "15PUZZLE",
     "CONNECT4",
     "INVADERS",
     "PONG",
     "TETRIS",
     "TICTAC",
     "UFO",
     "WIPEOFF"
];

const translateKeys = {
     49: 0x1, // 1
     50: 0x2, // 2
     51: 0x3, // 3
     52: 0xc, // 4
     81: 0x4, // Q
     87: 0x5, // W
     69: 0x6, // E
     82: 0xd, // R
     65: 0x7, // A
     83: 0x8, // S
     68: 0x9, // D
     70: 0xe, // F
     90: 0xa, // Z
     88: 0x0, // X
     67: 0xb, // C
     86: 0xf // V
}

const disassemble = (program, addr) => {
     const opcode = (program[addr] << 8) | program[addr + 1];

     const x = (opcode & 0x0F00) >> 8;
     const y = (opcode & 0x00F0) >> 4;
     const nnn = opcode & 0x0FFF;
     const kk = opcode & 0x00FF;
     const n = opcode & 0x000F;

     if (opcode === 0x00E0) return "CLS";
     if (opcode === 0x00EE) return "RET";
     if (inRange(opcode, 0x1000, 0x1FFFF)) return `JP 0x${hex(nnn, 3)}`;
     if (inRange(opcode, 0x2000, 0x2FFF)) return `CALL 0x${hex(nnn, 3)}`;
     if (inRange(opcode, 0x3000, 0x3fff)) return `SE V${n} ${kk}`;
     if (inRange(opcode, 0x4000, 0x4fff)) return `SNE V${n} ${kk}`;
     if (inRange(opcode, 0x5000, 0x5fff)) return `SE V${x} V${y}`;
     if (inRange(opcode, 0x6000, 0x6fff)) return `LD V${x} ${kk}`;
     if (inRange(opcode, 0x7000, 0x7fff)) return `ADD V${x} ${kk}`;
     if (inRange(opcode, 0x8000, 0x8fff)) {
          if (n === 0x0) return `LD V${x} V${y}`;
          if (n === 0x1) return `OR V${x} V${y}`;
          if (n === 0x2) return `AND V${x} V${y}`;
          if (n === 0x3) return `XOR V${x} V${y}`;
          if (n === 0x4) return `ADD V${x} V${y}`;
          if (n === 0x5) return `SUB V${x} V${y}`;
          if (n === 0x6) return `SHR V${x}`;
          if (n === 0x7) return `SUBN V${x} V${y}`;
          if (n === 0xe) return `SHL V${x}`;
     }
     if (inRange(opcode, 0x9000, 0x9fff)) return `SNE V${x} V${y}`;
     if (inRange(opcode, 0xa000, 0xafff)) return `LDI ${nnn}`;
     if (inRange(opcode, 0xb000, 0xbfff)) return `JP V0 + ${nnn}`;
     if (inRange(opcode, 0xc000, 0xcfff)) return `RND ${kk}`;
     if (inRange(opcode, 0xd000, 0xdfff)) return `DRW V${x} V${y} ${n}`;
     if (inRange(opcode, 0xe000, 0xefff)) {
          if (kk === 0x9e) return `SKP V${x}`;
          if (kk === 0xa1) return `SKNP V${x}`;
     }
     if (inRange(opcode, 0xf000, 0xffff)) {
          if (kk === 0x07) return `LD V${x} DT`;
          if (kk === 0x0a) return `LD V${x} K`;
          if (kk === 0x15) return `LD DT, V${x}`;
          if (kk === 0x1e) return `ADD I, V${x}`;
          if (kk === 0x29) return `LD F, V${x}`;
          if (kk === 0x33) return `LD B, V${x}`;
          if (kk === 0x55) return `LD [I], ${x}`;
          if (kk === 0x65) return `LD ${x}, [I]`;
     }
     return "-";
};

const run = async () => {
     const WIDTH = 64;
     const HEIGHT = 32;

     const res = await fetch("chip8.wasm");
     const buffer = await res.arrayBuffer();
     const module = await WebAssembly.compile(buffer);
     const instance = await WebAssembly.instantiate(module);
     const exports = instance.exports;

     const programMemory = new Uint8Array(
          exports.memory.buffer,
          exports.get_memory(),
          4096
     );

     const displayMemory = new Uint8Array(
          exports.memory.buffer,
          exports.get_display(),
          2048
     );

     const vMemory = new Uint8Array(
          exports.memory.buffer,
          exports.get_register_v(),
          16
     );

     const canvas = document.getElementById("canvas");
     const ctx = canvas.getContext("2d");
     ctx.fillStyle = "black";
     ctx.fillRect(0, 0, WIDTH, HEIGHT);

     const updateDisplay = () => {
          const imageData = ctx.createImageData(WIDTH, HEIGHT);
          for (let i = 0; i < displayMemory.length; i++) {
               imageData.data[i * 4] = displayMemory[i] === 1 ? 0x33 : 0;
               imageData.data[i * 4 + 1] = displayMemory[i] === 1 ? 0xff : 0;
               imageData.data[i * 4 + 2] = displayMemory[i] === 1 ? 0x66 : 0;
               imageData.data[i * 4 + 3] = 255;
          }
          ctx.putImageData(imageData, 0, 0);
     };

     const dumpRegisters = () => {
          $("#1").empty();
          const vValues = Array(16);
          for (let i = 0; i < vMemory.length; i++) {
               $("#r1").append(`<div>V${i}: ${vMemory[i]}</div>`);
          }
          $("#r2").empty();
          $("#r2").append(`<div>PC: ${exports.get_register_pc()}</div>`);
          $("#r2").append(`<div>I: ${exports.get_register_i()}</div>`);
     };

     const dumpMemory = () => {
          $(".memory").empty();
          let address = 0x200;
          while (address < 4096) {
               const clazz = `addr_${address}`;
               const haddress = "0x" + hex(address, 4);
               $(".memory").append(
                    `<div class='${clazz}'>${haddress} - ${disassemble(
                         programMemory,
                         address
                    )}</div>`
               );
               address += 2;
          }
     };

     const updateProgramCounter = () => {
          $(`.memory > div`).removeClass("pc");
          const pc = exports.get_register_pc();
          const currentAddress = $(`.memory .addr_${pc}`).addClass("pc");
          if (currentAddress[0]) {
               const container = $(".memory");
               container.scrollTop(
                    currentAddress.offset().top - container.offset().top + container.scrollTop()
               );
          }
     };

     const updateUI = () => {
          dumpRegisters();
          updateDisplay();
          updateProgramCounter();
     };

     const loadROM = rom => fetch(`roms/${rom}`)
          .then(i => i.arrayBuffer())
          .then(buffer => {
               //Shove the selected ROM down memory's throat.
               const rom = new DataView(buffer, 0, buffer.byteLength);
               exports.reset();
               for (i = 0; i < rom.byteLength; i++) {
                    programMemory[0x200 + i] = rom.getUint8(i);
               }
               updateUI();
               dumpMemory();
          });

     ROMS.forEach(rom => {
          $("#roms").append(`<option value='${rom}'>${rom}</option>`);
     });

     document.getElementById("roms").addEventListener("change", e => {
          loadROM(e.target.value);
     });

     document.getElementById("step").addEventListener("click", () => {
          exports.execute_cycle();
          updateUI();
     });

     let running = false;
     const runloop = () => {
          if (running) {
               for (var i = 0; i < 10; i++) {
                    exports.execute_cycle();
               }
               exports.decrement_timers();
          }
          updateUI();
          window.requestAnimationFrame(runloop);
     };

     window.requestAnimationFrame(runloop);

     const runButton = document.getElementById("run");
     runButton.addEventListener("click", () => {
          if (running) {
               running = false;
               runButton.innerHTML = "Start";
          } else {
               running = true;
               runButton.innerHTML = "Stop";
          }

     });

     document.addEventListener("keydown", Event => {
          exports.key_down(translateKeys[Event.key]);
     });

     document.addEventListener("keyup", Event => {
          exports.key_up(translateKeys[Event.key]);
     });

     $("#roms")[0].value = "WIPEOFF";
     loadROM("WIPEOFF");
};

run();