/**
 * Cek cepat untuk algoritma deteksi slot. Jalankan dari folder `web`:
 *   node src/features/templates/slot-detection.check.ts
 *
 * Masker dibuat langsung di memori, jadi tidak butuh PNG ataupun framework tes.
 */

import {
  detectSlotsInAlpha,
  type AlphaSource,
} from "./slot-detection.ts";

const WIDTH = 200;
const HEIGHT = 300;

function check(condition: boolean, label: string): void {
  if (!condition) throw new Error(`GAGAL: ${label}`);
  console.log(`ok - ${label}`);
}

/** Kanvas opaque; hanya area yang digambar yang tembus pandang. */
function newMask(): AlphaSource {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let index = 0; index < WIDTH * HEIGHT; index += 1) data[index * 4 + 3] = 255;
  return { data, width: WIDTH, height: HEIGHT };
}

function punch(
  mask: AlphaSource,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      mask.data[(row * WIDTH + column) * 4 + 3] = 0;
    }
  }
}

// 8 jendela dalam susunan 2 kolom x 4 baris, seperti Frame 2R strip.
const grid = newMask();
for (let row = 0; row < 4; row += 1) {
  for (let column = 0; column < 2; column += 1) {
    punch(grid, 20 + column * 90, 20 + row * 70, 80, 60);
  }
}
const gridBoxes = detectSlotsInAlpha(grid);
check(gridBoxes.length === 8, "8 jendela terdeteksi");
check(
  gridBoxes[0]?.x === 20 && gridBoxes[0]?.y === 20,
  "kotak pertama di kiri atas",
);
check(
  gridBoxes[1]?.x === 110 && gridBoxes[1]?.y === 20,
  "urutan baris demi baris (kiri lalu kanan)",
);
check(
  gridBoxes[2]?.y === 90,
  "baris kedua menyusul setelah baris pertama",
);
check(
  gridBoxes.every((box) => box.width === 80 && box.height === 60),
  "ukuran tiap jendela utuh",
);

// PNG tanpa lubang sama sekali.
check(detectSlotsInAlpha(newMask()).length === 0, "PNG opaque tidak menghasilkan slot");

// Bintik kecil dari anti-aliasing / tekstur.
const noise = newMask();
punch(noise, 5, 5, 3, 3);
check(detectSlotsInAlpha(noise).length === 0, "bintik kecil diabaikan");

// Garis tepi transparan mengelilingi PNG: luasnya besar, tapi bukan jendela foto.
const border = newMask();
punch(border, 0, 0, WIDTH, 1);
punch(border, 0, HEIGHT - 1, WIDTH, 1);
punch(border, 0, 0, 1, HEIGHT);
punch(border, WIDTH - 1, 0, 1, HEIGHT);
check(detectSlotsInAlpha(border).length === 0, "garis tepi tipis diabaikan");

// Dua jendela bersebelahan tanpa celah tetap dihitung sebagai dua kotak.
const pair = newMask();
punch(pair, 10, 10, 60, 80);
punch(pair, 71, 10, 60, 80);
check(detectSlotsInAlpha(pair).length === 2, "jendela berdekatan tetap terpisah");

console.log("Semua cek deteksi slot lulus.");
