import test from 'node:test';
import assert from 'node:assert/strict';
import {
  relativeLuminance,
  contrastRatio,
  chooseForeground,
  generatePalette,
} from '../dist/esm/index.js';
const black = { r: 0, g: 0, b: 0 },
  white = { r: 1, g: 1, b: 1 };
test('known WCAG luminance and contrast values', () => {
  assert.equal(relativeLuminance(black), 0);
  assert.equal(relativeLuminance(white), 1);
  assert.equal(contrastRatio(black, white), 21);
  assert.equal(relativeLuminance({ r: 1, g: 0, b: 0 }), 0.2126);
  assert.equal(contrastRatio(white, white), 1);
});
test('highest qualifying foreground, stable tie, no match', () => {
  assert.deepEqual(chooseForeground(white, [white, black]), black);
  assert.equal(chooseForeground({ r: 0.5, g: 0.5, b: 0.5 }, [white], 7), null);
  assert.equal(chooseForeground(white, []), null);
  const chosen = chooseForeground(white, [black, black]);
  assert.notEqual(chosen, black);
});
test('palette neutral endpoints and deterministic hue sequence', () => {
  assert.deepEqual(generatePalette({ count: 1, lightness: 0 })[0], black);
  const p = generatePalette({ count: 3, chroma: 0 });
  assert.deepEqual(p[0], p[1]);
  assert.ok(Math.abs(p[0].r - p[0].g) < 1e-6);
  assert.deepEqual(generatePalette({ count: 4 }), generatePalette({ count: 4 }));
  assert.deepEqual(generatePalette({ count: 1, hue: 360 }), generatePalette({ count: 1, hue: 0 }));
});
test('gamut mapping finite bounded maximum count', () => {
  const p = generatePalette({ count: 256, chroma: 0.5, lightness: 0.9 });
  assert.equal(p.length, 256);
  for (const c of p)
    for (const v of Object.values(c)) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
});
test('strict numeric validation and exact bounds', () => {
  for (const opts of [
    { count: 0 },
    { count: 257 },
    { count: 1, lightness: NaN },
    { count: 1, chroma: -1 },
    { count: 1, hue: Infinity },
  ])
    assert.throws(() => generatePalette(opts), RangeError);
  assert.throws(() => contrastRatio({ r: 2, g: 0, b: 0 }, white), RangeError);
  assert.throws(() => chooseForeground(white, [black], 21.01), RangeError);
  assert.throws(() => chooseForeground(white, Array(4097).fill(black)), RangeError);
  assert.ok(chooseForeground(white, [black], 21));
});
test('input and result ownership', () => {
  const background = { ...white },
    candidate = { ...black };
  const c = chooseForeground(background, [candidate]);
  c.r = 1;
  assert.deepEqual(candidate, black);
  assert.deepEqual(background, white);
  const p = generatePalette({ count: 2 });
  p[0].r = 0;
  assert.notEqual(p[0], p[1]);
});
test('seeded independent WCAG reference and OKLab lightness reconstruction', () => {
  let seed = 418;
  const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
  const decode = (v) => (v < 0.04045 ? v / 12.92 : Math.exp(2.4 * Math.log((v + 0.055) / 1.055)));
  for (let i = 0; i < 100; i++) {
    const a = { r: random(), g: random(), b: random() },
      b = { r: random(), g: random(), b: random() };
    const lum = (c) =>
        [c.r, c.g, c.b].map(decode).reduce((s, v, j) => s + v * [0.2126, 0.7152, 0.0722][j], 0),
      x = lum(a),
      y = lum(b);
    assert.ok(
      Math.abs(contrastRatio(a, b) - (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) < 1e-12,
    );
    const L = 0.1 + random() * 0.8,
      c = generatePalette({ count: 1, lightness: L, chroma: 0.5, hue: random() * 360 })[0],
      r = decode(c.r),
      g = decode(c.g),
      bb = decode(c.b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bb),
      m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bb),
      s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bb);
    assert.ok(Math.abs(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s - L) < 1e-6);
  }
});
