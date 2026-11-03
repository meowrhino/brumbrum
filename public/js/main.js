// Tres vistas en una página: entrada → lobby → sala. La sala va en el hash
// (#ciudad), así una URL compartida abre esa sala directamente.
import { $ } from "./util.js";
import { me, login, logout, getRoom, getColor, setColor } from "./session.js";
import { connectRoom } from "./ws.js";
import { addMessage, renderHistory, applyColor, setOnline, setMe } from "./render.js";
import * as alerts from "./alerts.js";

let name = null;
let conn = null;

function show(id) {
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== id;
}

async function boot() {
  name = await me();
  if (!name) return show("entrada");
  setMe(name);
  route();
}

function route() {
  const room = getRoom();
  if (room && /^[a-z0-9_-]{1,32}$/.test(room)) openRoom(room);
  else openLobby();
}

// --- entrada ---------------------------------------------------------------
$("#login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#login-error").textContent = "";
  try {
    name = await login($("#name").value, $("#password").value);
    setMe(name);
    route();
  } catch (err) {
    $("#login-error").textContent = err.message;
  }
});
// puntitos de colores bajo el nombre: decorativos, un color por letra
$("#dots").innerHTML = ["#f2a93b", "#4f8fe8", "#7bd389", "#e86aa0", "#c0c0c0"]
  .map((c) => `<b style="--c:${c}"></b>`).join("");

// --- lobby -----------------------------------------------------------------
async function openLobby() {
  closeRoom();
  show("lobby");
  $("#me-lobby").textContent = name;
  const rooms = await (await fetch("/api/rooms")).json();
  const ul = $("#rooms");
  ul.innerHTML = "";
  for (const { room, online } of rooms) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${room}`;
    const label = document.createElement("span");
    label.textContent = `#${room}`;
    const n = document.createElement("span");
    n.className = "n";
    n.title = `${online} en línea`;
    for (let i = 0; i < online; i++) n.appendChild(document.createElement("b"));
    a.append(label, n);
    li.appendChild(a);
    ul.appendChild(li);
  }
}
$("#goto").addEventListener("submit", (e) => {
  e.preventDefault();
  location.hash = $("#room-name").value.trim().toLowerCase();
});
$("#logout").addEventListener("click", async (e) => {
  e.preventDefault();
  await logout();
  name = null;
  location.hash = "";
  show("entrada");
});

// --- sala ------------------------------------------------------------------
function openRoom(room) {
  closeRoom();
  show("sala");
  $("#room").textContent = room;
  let color = getColor(name);
  const picker = $("#mycolor");
  picker.value = color;
  alerts.setup({ emoji: "🏍", base: `#${room}` });

  conn = connectRoom({
    room, name, color,
    onHistory: (messages, profiles, online) => { renderHistory(messages, profiles); setOnline(online); },
    onMessage: (m) => {
      addMessage(m);
      if (m.kind !== "system" && m.author !== name) alerts.incoming(m.author, m.body);
    },
    onColor: ({ name, color }) => applyColor(name, color),
    onPresence: setOnline,
  });

  picker.oninput = () => applyColor(name, picker.value);
  picker.onchange = () => { color = picker.value; setColor(color); applyColor(name, color); conn.setColor(color); };
}
function closeRoom() {
  conn?.close();
  conn = null;
}
$("#composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#body");
  const body = input.value.trim();
  if (!body) return;
  alerts.askNotifPermission();
  conn.send(body);
  input.value = "";
});
$("#back").addEventListener("click", (e) => { e.preventDefault(); location.hash = ""; });

addEventListener("hashchange", () => { if (name) route(); });
boot();
