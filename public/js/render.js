import { $, colorFor, hhmm, dayKey, dayLabel, linkifyInto } from "./util.js";
import { avatarSvg } from "./avatar.js";

// Pinta la sala como el chat de Dollars: avatar cuadrado con el nombre debajo
// y bocadillo con pico, todo en el color de quien habla (variable CSS --c en
// la fila). Texto siempre con textContent/linkifyInto, nunca innerHTML ajeno.

const list = () => $("#messages");
let colors = {};
let avatars = {};
let lastDay = null;
let online = [];
let myName = "";
let isMod = false;
let onMod = null; // { del(seq), kick(name) }
const typing = new Map(); // name → timeout

const colorOf = (name) => colors[name] || colorFor(name);
const avatarOf = (name) => avatars[name] || "000";

export function setMe(name, mod = false) { myName = name; isMod = mod; }
export function setModActions(actions) { onMod = actions; }

export function removeMessage(seq) {
  list().querySelector(`[data-seq="${seq}"]`)?.remove();
}

// "x está escribiendo…" durante 4s desde el último aviso.
export function showTyping(name) {
  if (name === myName) return;
  clearTimeout(typing.get(name));
  typing.set(name, setTimeout(() => { typing.delete(name); paintTyping(); }, 4000));
  paintTyping();
}
function paintTyping() {
  const names = [...typing.keys()];
  $("#typing").textContent = names.length ? `${names.join(", ")} está escribiendo…` : "";
}
export function clearTyping() {
  for (const t of typing.values()) clearTimeout(t);
  typing.clear();
  paintTyping();
}

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
    li.dataset.seq = m.seq;
    li.style.setProperty("--c", colorOf(m.author));

    const who = document.createElement("div");
    who.className = "who";
    const av = document.createElement("div");
    av.className = "avatar";
    av.innerHTML = avatarSvg(avatarOf(m.author)); // SVG propio, no datos del usuario
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = m.author;
    who.append(av, name);

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.title = hhmm(m.ts);
    linkifyInto(bubble, m.body);

    li.append(who, bubble);
    if (isMod) li.appendChild(modButtons(m));
  }
  box.appendChild(li);
  if (wasAtBottom) box.scrollTop = box.scrollHeight;
}

function modButtons(m) {
  const box = document.createElement("span");
  box.className = "mod";
  const del = document.createElement("button");
  del.type = "button"; del.textContent = "×"; del.title = "borrar mensaje";
  del.onclick = () => onMod?.del(m.seq);
  box.appendChild(del);
  if (m.author !== myName) {
    const kick = document.createElement("button");
    kick.type = "button"; kick.textContent = "⇥"; kick.title = `expulsar a ${m.author} 10 min`;
    kick.onclick = () => confirm(`¿expulsar a ${m.author} 10 min?`) && onMod?.kick(m.author);
    box.appendChild(kick);
  }
  return box;
}

export function renderHistory(messages, profiles, avs) {
  colors = profiles || {};
  avatars = avs || {};
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

export function applyAvatar(name, code) {
  avatars[name] = code;
  for (const li of list().querySelectorAll(".msg")) {
    if (li.dataset.author === name) li.querySelector(".avatar").innerHTML = avatarSvg(code);
  }
}
