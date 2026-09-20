/**
 * Deteksi slot foto dari PNG Frame. Area transparan pada kanal alpha dipakai
 * sebagai penanda jendela foto, jadi inti algoritmanya murni (tanpa DOM) dan
 * bisa diuji lewat `node slot-detection.check.ts`.
 */

export interface DetectedSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AlphaSource {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Resolusi kerja maksimum; cukup untuk menemukan kotak dan jauh lebih cepat. */
const MAX_EDGE = 1200;

/** Komponen di bawah 0,2% kanvas dianggap derau, bukan jendela foto. */
const MIN_AREA_RATIO = 0.002;

/**
 * Jendela foto selalu berupa persegi penuh, sedangkan ornamen (bingkai, garis
 * tepi, bayangan) jarang mengisi kotak pembatasnya. Ambang ini yang membuang
 * ornamen tanpa perlu aturan khusus per bentuk.
 */
const MIN_FILL_RATIO = 0.4;

const ALPHA_THRESHOLD = 24;

function median(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

/** Urut atas→bawah lalu kiri→kanan supaya nomor foto mengikuti cara membacanya. */
function sortRowMajor(boxes: ReadonlyArray<DetectedSlot>): DetectedSlot[] {
  const sorted = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rowGap = median(sorted.map((box) => box.height)) * 0.5;
  const rows: DetectedSlot[][] = [];
  sorted.forEach((box) => {
    const row = rows.at(-1);
    const reference = row?.[0];
    if (row && reference && box.y - reference.y < rowGap) row.push(box);
    else rows.push([box]);
  });
  return rows.flatMap((row) => row.sort((a, b) => a.x - b.x));
}

/**
 * Flood fill iteratif pada kanal alpha. Sengaja memakai stack array, bukan
 * rekursi: kanvas 1200x1800 akan melewati batas call stack.
 */
export function detectSlotsInAlpha(
  source: AlphaSource,
  alphaThreshold: number = ALPHA_THRESHOLD,
): DetectedSlot[] {
  const { data, width, height } = source;
  const total = width * height;
  if (total <= 0) return [];

  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  const minimumArea = Math.max(64, Math.round(total * MIN_AREA_RATIO));
  const boxes: DetectedSlot[] = [];

  for (let start = 0; start < total; start += 1) {
    if (visited[start] === 1 || data[start * 4 + 3] > alphaThreshold) continue;

    let top = 0;
    stack[top++] = start;
    visited[start] = 1;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    while (top > 0) {
      const index = stack[--top];
      const x = index % width;
      const y = (index - x) / width;
      area += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      if (
        x > 0 &&
        visited[index - 1] === 0 &&
        data[(index - 1) * 4 + 3] <= alphaThreshold
      ) {
        visited[index - 1] = 1;
        stack[top++] = index - 1;
      }
      if (
        x < width - 1 &&
        visited[index + 1] === 0 &&
        data[(index + 1) * 4 + 3] <= alphaThreshold
      ) {
        visited[index + 1] = 1;
        stack[top++] = index + 1;
      }
      if (
        y > 0 &&
        visited[index - width] === 0 &&
        data[(index - width) * 4 + 3] <= alphaThreshold
      ) {
        visited[index - width] = 1;
        stack[top++] = index - width;
      }
      if (
        y < height - 1 &&
        visited[index + width] === 0 &&
        data[(index + width) * 4 + 3] <= alphaThreshold
      ) {
        visited[index + width] = 1;
        stack[top++] = index + width;
      }
    }

    if (area < minimumArea) continue;
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    if (area / (boxWidth * boxHeight) < MIN_FILL_RATIO) continue;
    boxes.push({ x: minX, y: minY, width: boxWidth, height: boxHeight });
  }

  return sortRowMajor(boxes);
}

/**
 * Baca PNG (berkas unggahan maupun blob dari URL) lalu kembalikan kotak dalam
 * koordinat kanvas Frame, karena PNG apa pun akan direntangkan ke kanvas itu.
 */
export async function detectSlotsInImage(
  source: Blob,
  target: { width: number; height: number },
): Promise<DetectedSlot[]> {
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return [];
    context.drawImage(bitmap, 0, 0, width, height);

    return detectSlotsInAlpha(context.getImageData(0, 0, width, height))
      .flatMap((box) => {
        const x = Math.min(
          Math.max(Math.round((box.x * target.width) / width), 0),
          target.width - 10,
        );
        const y = Math.min(
          Math.max(Math.round((box.y * target.height) / height), 0),
          target.height - 10,
        );
        const boxWidth = Math.min(
          Math.round((box.width * target.width) / width),
          target.width - x,
        );
        const boxHeight = Math.min(
          Math.round((box.height * target.height) / height),
          target.height - y,
        );
        return boxWidth < 10 || boxHeight < 10
          ? []
          : [{ x, y, width: boxWidth, height: boxHeight }];
      });
  } finally {
    bitmap.close();
  }
}
