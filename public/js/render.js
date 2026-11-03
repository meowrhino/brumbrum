import { $, colorFor, hhmm, dayKey, dayLabel, linkifyInto } from "./util.js";
import { avatarSvg } from "./avatar.js";

// Pinta la sala: avatar (pictograma) + burbuja, los dos en el color de quien
// habla (variable CSS --c en la fila, así recolorear es cambiar una propiedad).
// Texto siempre con textContent/linkifyInto, nunca innerHTML con datos ajenos.

const list = () => $("#messages");
let colors = {};
let lastDay = null;
let online = [];
let myName = "";

const colorOf = (name) => colors[name] || colorFor(name);

export function setMe(name) { myName = name; }

export function setOnline(names) {
  online = names || [];
  paintPresence();
}

function paintPresence() {
  const box = $("#presence");
  box.innerHTML = "";
  for (const name of online) {
    const dot = document.createElement("span");
    dot.className = "presence-dot";
    dot.title = name;
    dot.style.setProperty("--c", colorOf(name));
    box.appendChild(dot);
  }
  $("#count").textContent = online.length === 1 ? "· 1 en línea" : `· ${online.length} en línea`;
}

function daySeparatorIfNeeded(ts) {
  const key = dayKey(ts);
  if (key === lastDay) return;
  lastDay = key;
  const li = document.createElement("li");
  li.className = "daysep";
  li.textContent = dayLabel(ts);
  list().appendChild(li);
}

export function addMessage(m) {
  const box = list();
  const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  daySeparatorIfNeeded(m.ts);

  const li = document.createElement("li");
  if (m.kind === "system") {
    li.className = "msg system";
    li.textContent = `${hhmm(m.ts)} ${m.author} ${m.body}`;
  } else {
    li.className = m.author === myName ? "msg me" : "msg";
    li.dataset.author = m.author;
    li.style.setProperty("--c", colorOf(m.author));

    const av = document.createElement("div");
    av.className = "avatar";
    av.innerHTML = avatarSvg(m.author); // SVG propio, no datos del usuario
    av.title = m.author;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = `${m.author} · ${hhmm(m.ts)}`;
    bubble.appendChild(name);
    linkifyInto(bubble, m.body);

    li.append(av, bubble);
  }
  box.appendChild(li);
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

export function renderHistory(messages, profiles) {
  colors = profiles || {};
  lastDay = null;
  list().innerHTML = "";
  messages.forEach(addMessage);
  list().scrollTop = list().scrollHeight;
}

export function applyColor(name, color) {
  colors[name] = color;
  for (const li of list().querySelectorAll(".msg")) {
    if (li.dataset.author === name) li.style.setProperty("--c", color);
  }
  paintPresence();
}
