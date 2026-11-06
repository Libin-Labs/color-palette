import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../dist/esm/index.js';
const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/index.js');
test('CommonJS and ESM runtime behavior and export parity', () => {
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
  const sample = ({ generatePalette }) => generatePalette({ count: 3, chroma: 0.5 });
  assert.deepEqual(sample(esm), sample(cjs));
});
