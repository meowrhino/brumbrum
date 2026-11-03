// Pictograma por nombre (determinista: mismo nombre → mismo dibujo en todos
// los navegadores). shortcut: no se elige; cuando se quiera elegir, va al
// perfil del DO como el color.
const ICON = [
  '<circle cx="12" cy="8" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/>',
  '<circle cx="12" cy="8" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><path d="M6 9c0-5 3-7 6-7s6 2 6 7" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  '<circle cx="12" cy="9" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><rect x="3" y="7" width="3" height="6"/><rect x="18" y="7" width="3" height="6"/>',
  '<circle cx="12" cy="9" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><path d="M7 6l1-5 3 3zM17 6l-1-5-3 3z"/>',
];
export function avatarSvg(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 1000;
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICON[h % ICON.length]}</svg>`;
}
