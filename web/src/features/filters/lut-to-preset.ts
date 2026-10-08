export interface CubeLut {
  readonly dim: 1 | 3
  readonly size: number
  readonly domainMin: readonly [number, number, number]
  readonly domainMax: readonly [number, number, number]
  readonly data: Float32Array
}

export interface FilterPresetEstimate {
  readonly brightness: number
  readonly contrast: number
  readonly saturation: number
  readonly white_balance: number
  readonly sharpness: number
  readonly intensity: number
}

const MAX_LUT_SIZE = 65

export function isCubeFile(fileName: string): boolean {
  return /\.cube$/i.test(fileName.trim())
}

export function parseCubeLut(text: string): CubeLut {
  let dim: 1 | 3 = 3
  let size = 0
  let domainMin: [number, number, number] = [0, 0, 0]
  let domainMax: [number, number, number] = [1, 1, 1]
  const values: number[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const upper = line.toUpperCase()
    if (upper.startsWith("TITLE")) continue

    if (upper.startsWith("LUT_3D_SIZE")) {
      size = Number.parseInt(line.split(/\s+/)[1] ?? "", 10)
      dim = 3
      continue
    }
    if (upper.startsWith("LUT_1D_SIZE")) {
      size = Number.parseInt(line.split(/\s+/)[1] ?? "", 10)
      dim = 1
      continue
    }
    if (upper.startsWith("DOMAIN_MIN") || upper.startsWith("DOMAIN_MAX")) {
      const parts = line.split(/\s+/).slice(1).map(Number)
      if (parts.length === 3 && parts.every(Number.isFinite)) {
        const triplet: [number, number, number] = [parts[0], parts[1], parts[2]]
        if (upper.startsWith("DOMAIN_MIN")) domainMin = triplet
        else domainMax = triplet
      }
      continue
    }

    const parts = line.split(/\s+/).map(Number)
    if (parts.length >= 3 && parts.every(Number.isFinite)) {
      values.push(parts[0], parts[1], parts[2])
    }
  }

  if (!Number.isInteger(size) || size < 2) {
    throw new Error("Ukuran LUT tidak valid.")
  }
  if (size > MAX_LUT_SIZE) {
    throw new Error(`Ukuran LUT maksimal ${MAX_LUT_SIZE}.`)
  }

  const expected = dim === 3 ? size * size * size * 3 : size * 3
  if (values.length < expected) {
    throw new Error("Data LUT tidak lengkap.")
  }

  return {
    dim,
    size,
    domainMin,
    domainMax,
    data: Float32Array.from(values.slice(0, expected)),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function chroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/**
 * Perkiraan nilai preset dari LUT. Ini pendekatan: LUT 3D penuh tidak bisa
 * direpresentasikan persis oleh beberapa knob. `sharpness` tidak bisa
 * diturunkan dari LUT warna, jadi dibiarkan 0.
 */
export function estimateFilterPreset(lut: CubeLut): FilterPresetEstimate {
  const { data, dim, size, domainMin, domainMax } = lut

  let lumInSum = 0
  let lumOutSum = 0
  let lumInSqSum = 0
  let lumOutSqSum = 0
  let chromaInSum = 0
  let chromaOutSum = 0
  let rbInSum = 0
  let rbOutSum = 0
  let count = 0

  function accumulate(ri: number, gi: number, bi: number, index: number) {
    const ro = data[index]
    const go = data[index + 1]
    const bo = data[index + 2]
    const li = luminance(ri, gi, bi)
    const lo = luminance(ro, go, bo)

    lumInSum += li
    lumOutSum += lo
    lumInSqSum += li * li
    lumOutSqSum += lo * lo
    chromaInSum += chroma(ri, gi, bi)
    chromaOutSum += chroma(ro, go, bo)
    rbInSum += ri - bi
    rbOutSum += ro - bo
    count += 1
  }

  if (dim === 3) {
    const step = 1 / (size - 1)
    for (let b = 0; b < size; b += 1) {
      for (let g = 0; g < size; g += 1) {
        for (let r = 0; r < size; r += 1) {
          const index = (r + g * size + b * size * size) * 3
          accumulate(
            domainMin[0] + r * step * (domainMax[0] - domainMin[0]),
            domainMin[1] + g * step * (domainMax[1] - domainMin[1]),
            domainMin[2] + b * step * (domainMax[2] - domainMin[2]),
            index
          )
        }
      }
    }
  } else {
    const step = 1 / (size - 1)
    for (let i = 0; i < size; i += 1) {
      const input = domainMin[0] + i * step * (domainMax[0] - domainMin[0])
      accumulate(input, input, input, i * 3)
    }
  }

  if (count === 0) {
    throw new Error("LUT tidak berisi data.")
  }

  const meanLumIn = lumInSum / count
  const meanLumOut = lumOutSum / count
  const meanChromaIn = chromaInSum / count
  const meanChromaOut = chromaOutSum / count
  const meanRbIn = rbInSum / count
  const meanRbOut = rbOutSum / count
  const stdIn = Math.sqrt(Math.max(0, lumInSqSum / count - meanLumIn * meanLumIn))
  const stdOut = Math.sqrt(Math.max(0, lumOutSqSum / count - meanLumOut * meanLumOut))

  const brightness = clamp(Math.round((meanLumOut - meanLumIn) * 200), -100, 100)
  const contrast =
    stdIn > 1e-4 ? clamp(Math.round((stdOut / stdIn - 1) * 100), -100, 100) : 0
  const saturation =
    meanChromaIn > 1e-4
      ? clamp(Math.round((meanChromaOut / meanChromaIn - 1) * 100), -100, 100)
      : 0
  const whiteBalance = clamp(Math.round((meanRbOut - meanRbIn) * 200), -100, 100)

  return {
    brightness,
    contrast,
    saturation,
    white_balance: whiteBalance,
    sharpness: 0,
    intensity: 100,
  }
}
