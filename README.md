# @lp-labs/color-palette

OKLCH hue-sequence palette generation with fixed-lightness chroma reduction and opaque-sRGB WCAG foreground choice, not a color-management suite.

Catalog ID 418. Version 0.1.0. Standalone, zero runtime, peer or sibling dependencies.
Node.js >=18; strict TypeScript; NodeNext ESM and CommonJS with separate declaration trees.

## Install

```sh
npm install @lp-labs/color-palette
```

## Quickstart (JavaScript ESM)

```js
import { generatePalette, chooseForeground, contrastRatio } from '@lp-labs/color-palette';
const palette = generatePalette({ count: 5, lightness: 0.75, chroma: 0.18, hue: 20 });
const foreground = chooseForeground(
  palette[0],
  [
    { r: 0, g: 0, b: 0 },
    { r: 1, g: 1, b: 1 },
  ],
  4.5,
);
console.log(palette, foreground);
if (foreground) console.log(contrastRatio(palette[0], foreground));
```

CommonJS exposes the same named exports with `require('@lp-labs/color-palette')`.
Use the bare package name in NodeNext TypeScript `.mts` and `.cts` consumers.
The package has no default export, global side effects, browser globals, network access or file access.

## Contracts, options, errors and customization

- `RGB` channels are finite encoded sRGB `[0,1]`, opaque only. `relativeLuminance` applies the sRGB transfer function and D65 coefficients. `contrastRatio` returns WCAG 2.x ratio `1..21`, not APCA or accessibility certification; text size, font, rendering and context are outside scope.
- `chooseForeground(background,candidates,minimum=4.5)` accepts <=4096 candidates and finite minimum `[1,21]`, validates every candidate, returns a copy of the highest-ratio qualifying color (first on a tie), or `null`. No hidden black/white fallback.
- `generatePalette` requires integer `count=1..256`. Defaults: `lightness=0.7` in `[0,1]`, `chroma=0.15` in `[0,0.5]`, `hue=0`, `hueStep=137.50776405003785` degrees. Hue and step are finite with magnitude <= `1e12`; hue is periodic.
- Each OKLCH color is converted through OKLab to linear sRGB; out-of-gamut chroma is reduced at fixed hue/lightness by exactly 32 bisections. Final roundoff is clipped to `[0,1]`. Neutral endpoints are allowed. This is not a guaranteed maximally distinct palette, equal contrast, printer profile or browser rendering simulation.
- `RangeError` indicates invalid channels/options/counts. O(count*32) palette work, O(candidates) foreground choice, fresh independent values. Customize lightness/chroma/hue spacing and minimum contrast; no runtime dependencies or sibling imports.

## Complete public declarations

All runtime exports, public types, options and return values follow. Readonly declarations
describe caller-facing ownership; results are not recursively frozen at runtime.

```ts
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
export declare function relativeLuminance(color: RGB): number;
/** WCAG 2.x opaque sRGB contrast ratio; not a certification or APCA metric. */
export declare function contrastRatio(a: RGB, b: RGB): number;
/** First highest-contrast candidate meeting minimum, or null. Returns a copy. */
export declare function chooseForeground(
  background: RGB,
  candidates: readonly RGB[],
  minimum?: number,
): RGB | null;
/** OKLCH hue sequence; out-of-gamut chroma reduced by 32 bisections at fixed lightness/hue. */
export declare function generatePalette(options: PaletteOptions): RGB[];
```

## Development and verification

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

An offline install requires the pinned lockfile's development packages in the local npm cache.
Development-only dependencies: TypeScript ^5.9.3 and Prettier ^3.6.2.
Build emits `dist/esm` and `dist/cjs`, each with declarations; CommonJS has its own package boundary.
Tests cover finite bounds, degeneracy, ownership, work limits, deterministic results and independent reference checks.
Consumer fixtures exercise bare-package ESM/CJS declaration resolution with negative compile-time checks.
Only dist, README, LICENSE and package metadata are published. No automatic publishing is performed.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
