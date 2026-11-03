// Avatar por capas, estilo pictograma (tinta sobre el bloque de color de cada
// quien). Código de 3 dígitos "PEA": pelo, ojos, extra. Los huecos (ojos,
// separación del pelo) se pintan con el color del bloque (var(--c)).
const C = "var(--c)";
export const LAYERS = {
  pelo: [
    "",
    `<path d="M5.5 10a6.5 6.5 0 0 1 13 0z"/>`,
    `<path d="M5.5 9a6.5 6.5 0 0 1 13 0v8.5h-3V11h-7v6.5h-3z"/>`,
    `<path d="M5.5 10a6.5 6.5 0 0 1 13 0z"/><circle cx="4.3" cy="11.5" r="2.3"/><circle cx="19.7" cy="11.5" r="2.3"/>`,
    `<path d="M5.5 9.5l1-4.5 2 2.5 2-4.5 1.5 3 1.5-3 2 4.5 2-2.5 1 4.5z"/>`,
  ],
  ojos: [
    `<circle cx="10" cy="9.3" r="1.1" fill="${C}"/><circle cx="14" cy="9.3" r="1.1" fill="${C}"/>`,
    `<path d="M8.3 9.3h3.2M12.5 9.3h3.2" stroke="${C}" stroke-width="1.1" fill="none"/>`,
    `<circle cx="9.8" cy="9.5" r="2" fill="none" stroke="${C}" stroke-width="1"/><circle cx="14.2" cy="9.5" r="2" fill="none" stroke="${C}" stroke-width="1"/><path d="M11.8 9.5h.4" stroke="${C}"/>`,
    `<circle cx="10" cy="9.3" r="1.1" fill="${C}"/><path d="M12.5 9.3h3.2" stroke="${C}" stroke-width="1.1" fill="none"/>`,
  ],
  extra: [
    "",
    `<path d="M5 10a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3.4" y="8" width="3" height="5"/><rect x="17.6" y="8" width="3" height="5"/>`,
    `<path d="M5.5 8.5a6.5 6.5 0 0 1 13 0z"/><rect x="11" y="7.6" width="10" height="1.8"/><path d="M7 9.2a5 5 0 0 1 10 0" stroke="${C}" stroke-width=".8" fill="none"/>`,
    `<path d="M6.8 6.5l.4-5.5 3.8 3.2zM17.2 6.5l-.4-5.5-3.8 3.2z"/>`,
  ],
};
const BASE = `<circle cx="12" cy="9.5" r="5.5"/><path d="M3 23c0-5.5 4-8.5 9-8.5s9 3 9 8.5z"/>`;
// línea fina que separa el pelo de la cara (solo si hay pelo)
const GAP = `<path d="M7.2 10.2a4.9 4.9 0 0 1 9.6 0" stroke="${C}" stroke-width=".8" fill="none"/>`;

// "PEA" → [p, e, a] dentro de rango (cualquier basura cae al 0).
export function parse(code) {
  const d = String(code || "").padEnd(3, "0");
  return [LAYERS.pelo, LAYERS.ojos, LAYERS.extra].map((layer, i) => {
    const n = parseInt(d[i], 10);
    return n >= 0 && n < layer.length ? n : 0;
  });
}

export function avatarSvg(code) {
  const [p, e, a] = parse(code);
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${LAYERS.pelo[p]}${BASE}${p ? GAP : ""}${LAYERS.ojos[e]}${LAYERS.extra[a]}</svg>`;
}
