import sharp from "sharp"

/**
 * Remove a flat logo background (usually white) at full resolution.
 *
 * Only background that is connected to the image border is removed, so white
 * inside the artwork (letters, counters) stays. Edge pixels get a soft alpha
 * ramp and have the background colour subtracted so no light halo is left.
 */
export type ClearOptions = {
  /** Background colour to remove; default is estimated from the image border. */
  bg?: [number, number, number]
  hard?: number
  soft?: number
  /** Crop empty edges afterwards (logos yes, full-frame designs no). */
  trim?: boolean
}

export async function clearLogoBackground(input: Buffer, options: ClearOptions = {}): Promise<Buffer> {
  const trim = options.trim !== false
  const { data, info } = await sharp(input, { failOn: "none" })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  if (!width || !height || channels < 4) {
    return sharp(input).png({ compressionLevel: 6 }).toBuffer()
  }

  const pixels = Buffer.from(data)
  const total = width * height
  const encode = () => sharp(pixels, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 6 })

  // Estimate background colour from the border (ignoring already-transparent pixels).
  let sr = 0
  let sg = 0
  let sb = 0
  let sn = 0
  let transparentBorder = 0
  let borderCount = 0
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4
    borderCount++
    if (pixels[i + 3] < 24) {
      transparentBorder++
      return
    }
    sr += pixels[i]
    sg += pixels[i + 1]
    sb += pixels[i + 2]
    sn++
  }
  for (let x = 0; x < width; x++) {
    sample(x, 0)
    if (height > 1) sample(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    sample(0, y)
    if (width > 1) sample(width - 1, y)
  }

  if (borderCount > 0 && transparentBorder / borderCount > 0.65) {
    return trim ? encode().trim({ threshold: 2 }).toBuffer() : encode().toBuffer()
  }

  const br = options.bg ? options.bg[0] : sn ? sr / sn : 255
  const bg = options.bg ? options.bg[1] : sn ? sg / sn : 255
  const bb = options.bg ? options.bg[2] : sn ? sb / sn : 255

  const dist = (i: number) => {
    const dr = pixels[i] - br
    const dg = pixels[i + 1] - bg
    const db = pixels[i + 2] - bb
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  // Flood fill from the border through pixels that look like background.
  const hard = options.hard ?? 22
  const soft = options.soft ?? 70
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0
  const push = (p: number) => {
    if (visited[p]) return
    const i = p * 4
    if (pixels[i + 3] >= 24 && dist(i) > soft) return
    visited[p] = 1
    queue[tail++] = p
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    if (x > 0) push(p - 1)
    if (x < width - 1) push(p + 1)
    if (p >= width) push(p - width)
    if (p < total - width) push(p + width)
  }

  const isBackground = (p: number) => visited[p] === 1
  const edgeBand = (p: number) => {
    const x = p % width
    return (
      (x > 0 && isBackground(p - 1)) ||
      (x < width - 1 && isBackground(p + 1)) ||
      (p >= width && isBackground(p - width)) ||
      (p < total - width && isBackground(p + width))
    )
  }

  for (let p = 0; p < total; p++) {
    const i = p * 4
    if (isBackground(p)) {
      const d = dist(i)
      if (d <= hard) {
        pixels[i + 3] = 0
        continue
      }
      // Anti-aliased rim inside the fill: partial alpha + remove background tint.
      const a = Math.min(1, (d - hard) / (soft - hard))
      for (let c = 0; c < 3; c++) {
        const bgc = c === 0 ? br : c === 1 ? bg : bb
        pixels[i + c] = Math.max(0, Math.min(255, Math.round((pixels[i + c] - (1 - a) * bgc) / Math.max(a, 0.05))))
      }
      pixels[i + 3] = Math.round(pixels[i + 3] * a)
    } else if (edgeBand(p)) {
      // Foreground pixel touching the removed area: neutralise background bleed.
      const d = dist(i)
      if (d < soft) {
        const a = Math.max(0.05, Math.min(1, d / soft))
        for (let c = 0; c < 3; c++) {
          const bgc = c === 0 ? br : c === 1 ? bg : bb
          pixels[i + c] = Math.max(0, Math.min(255, Math.round((pixels[i + c] - (1 - a) * bgc) / a)))
        }
        pixels[i + 3] = Math.round(pixels[i + 3] * a)
      }
    }
  }

  return trim ? encode().trim({ threshold: 4 }).toBuffer() : encode().toBuffer()
}
