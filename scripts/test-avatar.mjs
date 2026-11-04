// Autocomprobación del motor poporing: cualquier código (bueno o basura) da un SVG.
import assert from "node:assert/strict";
import { poporingSvg, decode, encode, randomCode, FIELDS, CO } from "../public/js/poporing.js";

assert.equal(encode(decode("0")), FIELDS.map(() => 0).join("."), "legado/basura → slime base");
assert.equal(encode(decode("x.99.2")), "0.0.2" + ".0".repeat(FIELDS.length - 3));
assert.match(poporingSvg(undefined, "rojo"), /^<svg[\s\S]*<\/svg>$/);
for (let i = 0; i < 300; i++) {
  const code = randomCode();
  assert.equal(encode(decode(code)), code);
  assert.match(poporingSvg(code, "#9588dd"), /^<svg[\s\S]*<\/svg>$/);
}
// cada opción de cada capa pinta sin romper
for (const f of FIELDS) for (let i = 0; i < CO[f].length; i++) {
  const s = decode("0"); s[f] = CO[f][i][0];
  assert.match(poporingSvg(encode(s), "#a6c081"), /<rect/);
}
console.log("avatar ok");
