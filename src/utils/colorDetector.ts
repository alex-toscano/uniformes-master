export type CatalogCategory = 'fuego' | 'agua' | 'tierra' | 'tormenta' | 'eter'

export interface ColorDetectionResult {
  category: CatalogCategory
  categoryLabel: string
  dominantHex: string
  glow: string
  hue: number
  saturation: number
  lightness: number
  confidence: number
}

export const CATEGORY_INFO: Record<CatalogCategory, { label: string; glow: string; color: string }> = {
  fuego: { label: 'Fuego (Rojos / Cálidos)', glow: 'rgba(255, 50, 50, 0.7)', color: '#ef4444' },
  agua: { label: 'Agua (Azules / Cyan)', glow: 'rgba(0, 150, 255, 0.7)', color: '#3b82f6' },
  tierra: { label: 'Tierra (Verdes / Oliva)', glow: 'rgba(50, 200, 50, 0.7)', color: '#22c55e' },
  tormenta: { label: 'Tormenta (Neón / Amarillos)', glow: 'rgba(212, 255, 0, 0.7)', color: '#d4ff00' },
  eter: { label: 'Éter (Blancos / Negros / Neutros)', glow: 'rgba(255, 255, 255, 0.4)', color: '#ffffff' }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }

  return [h, s, l]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

export async function detectDominantColor(imageElement: HTMLImageElement): Promise<ColorDetectionResult> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const width = (canvas.width = 150)
  const height = (canvas.height = 150)

  if (!ctx) {
    return {
      category: 'eter',
      categoryLabel: CATEGORY_INFO.eter.label,
      dominantHex: '#FFFFFF',
      glow: CATEGORY_INFO.eter.glow,
      hue: 0,
      saturation: 0,
      lightness: 1,
      confidence: 50
    }
  }

  ctx.drawImage(imageElement, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height).data

  let weightedHues: { hue: number; weight: number; r: number; g: number; b: number }[] = []
  let totalColorPixels = 0
  let neutralPixels = 0

  let sumR = 0
  let sumG = 0
  let sumB = 0

  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i]
    const g = imgData[i + 1]
    const b = imgData[i + 2]
    const a = imgData[i + 3]

    if (a < 80) continue
    if (r > 240 && g > 240 && b > 240) continue

    const [h, s, l] = rgbToHsl(r, g, b)

    if (s < 0.16 || l < 0.08 || l > 0.92) {
      neutralPixels++
      continue
    }

    const weight = s * (1 - Math.abs(l - 0.5) * 1.5)
    if (weight > 0) {
      weightedHues.push({ hue: h, weight, r, g, b })
      sumR += r * weight
      sumG += g * weight
      sumB += b * weight
      totalColorPixels++
    }
  }

  if (totalColorPixels === 0 || totalColorPixels / (totalColorPixels + neutralPixels) < 0.15) {
    return {
      category: 'eter',
      categoryLabel: CATEGORY_INFO.eter.label,
      dominantHex: '#FFFFFF',
      glow: CATEGORY_INFO.eter.glow,
      hue: 0,
      saturation: 0,
      lightness: 0.8,
      confidence: 90
    }
  }

  let scoreFuego = 0
  let scoreAgua = 0
  let scoreTierra = 0
  let scoreTormenta = 0

  weightedHues.forEach(({ hue, weight }) => {
    if (hue <= 42 || hue >= 335) {
      scoreFuego += weight
    } else if (hue > 42 && hue <= 75) {
      scoreTormenta += weight * 1.25
    } else if (hue > 75 && hue <= 165) {
      scoreTierra += weight
    } else if (hue > 165 && hue <= 265) {
      scoreAgua += weight
    } else {
      if (hue < 300) scoreAgua += weight * 0.7
      else scoreFuego += weight * 0.7
    }
  })

  const scores = [
    { cat: 'fuego' as CatalogCategory, score: scoreFuego },
    { cat: 'tormenta' as CatalogCategory, score: scoreTormenta },
    { cat: 'tierra' as CatalogCategory, score: scoreTierra },
    { cat: 'agua' as CatalogCategory, score: scoreAgua }
  ]

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]

  const totalScore = scoreFuego + scoreTormenta + scoreTierra + scoreAgua
  const confidence = totalScore > 0 ? Math.min(99, Math.round((best.score / totalScore) * 100)) : 70

  const avgR = Math.min(255, Math.max(0, Math.round(sumR / (totalColorPixels || 1))))
  const avgG = Math.min(255, Math.max(0, Math.round(sumG / (totalColorPixels || 1))))
  const avgB = Math.min(255, Math.max(0, Math.round(sumB / (totalColorPixels || 1))))

  const dominantHex = rgbToHex(avgR, avgG, avgB)
  const [h, s, l] = rgbToHsl(avgR, avgG, avgB)

  return {
    category: best.cat,
    categoryLabel: CATEGORY_INFO[best.cat].label,
    dominantHex,
    glow: CATEGORY_INFO[best.cat].glow,
    hue: Math.round(h),
    saturation: Math.round(s * 100),
    lightness: Math.round(l * 100),
    confidence
  }
}

export function generateSKU(category: CatalogCategory): string {
  const catUpper = category.toUpperCase()
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase()
  return 'SKU-' + catUpper + '-' + randomHex
}

export function formatDesignName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '')
  const cleaned = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.toUpperCase()
}
