// Autocomprobación del generador: cualquier código (bueno o basura) da un SVG.
import assert from "node:assert/strict";
import { avatarSvg, parse, LAYERS } from "../public/js/avatar.js";

assert.deepEqual(parse("000"), [0, 0, 0]);
assert.deepEqual(parse("433"), [4, 3, 3]);
assert.deepEqual(parse("999"), [0, 0, 0], "fuera de rango → 0");
assert.deepEqual(parse(undefined), [0, 0, 0]);
assert.deepEqual(parse("x1"), [0, 1, 0]);
for (let p = 0; p < LAYERS.pelo.length; p++)
  for (let e = 0; e < LAYERS.ojos.length; e++)
    for (let a = 0; a < LAYERS.extra.length; a++) assert.match(avatarSvg(`${p}${e}${a}`), /^<svg[\s\S]*<\/svg>$/);
console.log("avatar ok");
