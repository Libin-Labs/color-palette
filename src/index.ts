/** Opaque sRGB channels in [0,1]. */
export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
export interface PaletteOptions {
  readonly count: number;
  readonly lightness?: number;
  readonly chroma?: number;
  readonly hue?: number;
  readonly hueStep?: number;
}
function rgb(c: RGB): void {
  if (![c.r, c.g, c.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 1))
    throw new RangeError('sRGB channels must be in [0,1]');
}
function linear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function encode(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}
export function relativeLuminance(color: RGB): number {
  rgb(color);
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}
/** WCAG 2.x opaque sRGB contrast ratio; not a certification or APCA metric. */
export function contrastRatio(a: RGB, b: RGB): number {
  const x = relativeLuminance(a),
    y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** First highest-contrast candidate meeting minimum, or null. Returns a copy. */
export function chooseForeground(
  background: RGB,
  candidates: readonly RGB[],
  minimum = 4.5,
): RGB | null {
  rgb(background);
  if (!Number.isFinite(minimum) || minimum < 1 || minimum > 21 || candidates.length > 4096)
    throw new RangeError('Invalid minimum or candidate count');
  let best: RGB | null = null,
    score = -1;
  for (const candidate of candidates) {
    const ratio = contrastRatio(background, candidate);
    if (ratio >= minimum && ratio > score) {
      best = { ...candidate };
      score = ratio;
    }
  }
  return best;
}
function toLinear(l: number, c: number, h: number): [number, number, number] {
  const a = c * Math.cos(h),
    b = c * Math.sin(h);
  const x = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const y = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const z = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z,
    -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z,
    -0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z,
  ];
}
/** OKLCH hue sequence; out-of-gamut chroma reduced by 32 bisections at fixed lightness/hue. */
export function generatePalette(options: PaletteOptions): RGB[] {
  const { count, lightness = 0.7, chroma = 0.15, hue = 0, hueStep = 137.50776405003785 } = options;
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 256 ||
    !Number.isFinite(lightness) ||
    lightness < 0 ||
    lightness > 1 ||
    !Number.isFinite(chroma) ||
    chroma < 0 ||
    chroma > 0.5 ||
    ![hue, hueStep].every((v) => Number.isFinite(v) && Math.abs(v) <= 1e12)
  )
    throw new RangeError('Invalid palette options');
  return Array.from({ length: count }, (_, i) => {
    const h = ((((hue % 360) + i * (hueStep % 360)) % 360) * Math.PI) / 180;
    const inGamut = (v: readonly number[]) => v.every((n) => n >= 0 && n <= 1);
    let c = chroma,
      values = toLinear(lightness, c, h);
    if (!inGamut(values)) {
      let low = 0,
        high = c;
      for (let j = 0; j < 32; j++) {
        const mid = (low + high) / 2;
        if (inGamut(toLinear(lightness, mid, h))) low = mid;
        else high = mid;
      }
      c = low;
      values = toLinear(lightness, c, h);
    }
    const [r, g, b] = values.map((v) => encode(Math.max(0, Math.min(1, v)))) as [
      number,
      number,
      number,
    ];
    return { r, g, b };
  });
}
