import {
  relativeLuminance,
  contrastRatio,
  chooseForeground,
  generatePalette,
  type RGB,
  type PaletteOptions,
} from '@lp-labs/color-palette';
const options: PaletteOptions = { count: 3, lightness: 0.7, chroma: 0.15, hue: 20, hueStep: 120 };
const palette: RGB[] = generatePalette(options);
const color: RGB | null = chooseForeground(palette[0]!, palette);
relativeLuminance(palette[0]!);
contrastRatio(palette[0]!, palette[1]!);
void color;
// @ts-expect-error Count required.
generatePalette({ hue: 30 });
// @ts-expect-error RGB channels are numeric.
relativeLuminance({ r: '0', g: 0, b: 0 });
