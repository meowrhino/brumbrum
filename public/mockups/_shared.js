// Datos falsos compartidos por las 3 maquetas. Cada una los pinta a su manera.
export const USERS = {
  kanra:  { color: '#f2a93b', ico: 'girl' },
  setton: { color: '#9a9a9a', ico: 'headset' },
  taro:   { color: '#4f8fe8', ico: 'boy' },
  yo:     { color: '#7bd389', ico: 'cat' },
};
export const MSGS = [
  ['sys', 'kanra', 'se ha conectado'],
  ['kanra', 'por cierto, últimamente hay muchas desapariciones…'],
  ['setton', 'eso es de mal gusto'],
  ['taro', '(;´Д`)…'],
  ['kanra', 'y aún no han encontrado los cuerpos'],
  ['kanra', 'igual es que nadie se ha dado cuenta todavía'],
  ['sys', 'yo', 'se ha conectado'],
  ['yo', 'he oído la moto otra vez. sin faro.'],
  ['taro', 'yo también!! a las 3 por el puente'],
];
// Pictogramas (cuadrado 1:1, trazo sólido): cabeza+hombros con variantes.
export const ICON = {
  girl:    '<circle cx="12" cy="8" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><path d="M6 9c0-5 3-7 6-7s6 2 6 7" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  headset: '<circle cx="12" cy="9" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><rect x="3" y="7" width="3" height="6" rx="1"/><rect x="18" y="7" width="3" height="6" rx="1"/>',
  boy:     '<circle cx="12" cy="8" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/>',
  cat:     '<circle cx="12" cy="9" r="5"/><path d="M4 22c0-5 4-8 8-8s8 3 8 8z"/><path d="M7 6l1-5 3 3zM17 6l-1-5-3 3z"/>',
};
export const svg = (k) => `<svg viewBox="0 0 24 24" fill="currentColor">${ICON[k]}</svg>`;
