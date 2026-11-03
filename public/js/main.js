// Vistas en una página: entrada → (tu avatar) → lobby → sala. La sala va en
// el hash (#ciudad), así una URL compartida abre esa sala directamente.
import { $ } from "./util.js";
import { me, login, logout, saveProfile, getRoom } from "./session.js";
import { connectRoom } from "./ws.js";
import { addMessage, renderHistory, applyColor, applyAvatar, setOnline, setMe, setModActions, removeMessage, showTyping, clearTyping } from "./render.js";
import { avatarSvg, parse, LAYERS } from "./avatar.js";
import * as alerts from "./alerts.js";

let profile = null; // { name, color, avatar, mod }
let conn = null;

function show(id) {
  for (const v of document.querySelectorAll(".view")) v.hidden = v.id !== id;
}

async function boot() {
  profile = await me();
  if (!profile.name) return show("entrada");
  setMe(profile.name, profile.mod);
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
    profile = await login($("#name").value, $("#password").value, $("#club").value);
    setMe(profile.name, profile.mod);
    // nombre nuevo → primero te haces el avatar
    profile.created ? openAvatar() : route();
  } catch (err) {
    $("#login-error").textContent = err.message;
  }
});
$("#dots").innerHTML = ["#f2a93b", "#4f8fe8", "#7bd389", "#e86aa0", "#c0c0c0"]
  .map((c) => `<b style="--c:${c}"></b>`).join("");

// --- tu avatar -------------------------------------------------------------
const SIZES = [LAYERS.pelo.length, LAYERS.ojos.length, LAYERS.extra.length];
let draft = [0, 0, 0];

function paintDraft() {
  const code = draft.join("");
  const prev = $("#preview");
  prev.style.setProperty("--c", $("#avatar-color").value);
  prev.innerHTML = avatarSvg(code);
  draft.forEach((v, i) => ($(`#v${i}`).textContent = `${v + 1}/${SIZES[i]}`));
}
function openAvatar() {
  closeRoom();
  show("avatar");
  $("#avatar-name").textContent = profile.name;
  draft = parse(profile.avatar);
  $("#avatar-color").value = profile.color;
  paintDraft();
}
for (const b of document.querySelectorAll("#avatar [data-layer]")) {
  b.addEventListener("click", () => {
    const i = +b.dataset.layer;
    draft[i] = (draft[i] + +b.dataset.d + SIZES[i]) % SIZES[i];
    paintDraft();
  });
}
$("#avatar-color").addEventListener("input", paintDraft);
$("#random-avatar").addEventListener("click", () => {
  draft = SIZES.map((n) => Math.floor(Math.random() * n));
  $("#avatar-color").value = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
  paintDraft();
});
$("#save-avatar").addEventListener("click", async () => {
  profile.avatar = draft.join("");
  profile.color = $("#avatar-color").value;
  await saveProfile({ avatar: profile.avatar, color: profile.color });
  route();
});

// --- lobby -----------------------------------------------------------------
async function openLobby() {
  closeRoom();
  show("lobby");
  $("#me-lobby").textContent = profile.name;
  const mini = $("#me-avatar");
  mini.style.setProperty("--c", profile.color);
  mini.innerHTML = avatarSvg(profile.avatar);
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
$("#edit-avatar").addEventListener("click", (e) => { e.preventDefault(); openAvatar(); });
$("#logout").addEventListener("click", async (e) => {
  e.preventDefault();
  await logout();
  profile = null;
  location.hash = "";
  show("entrada");
});

// --- sala ------------------------------------------------------------------
function openRoom(room) {
  closeRoom();
  show("sala");
  $("#room").textContent = room;
  const picker = $("#mycolor");
  picker.value = profile.color;
  alerts.setup({ emoji: "🏍", base: `#${room}` });

  conn = connectRoom({
    room,
    onHistory: (messages, profiles, avatars, online) => { renderHistory(messages, profiles, avatars); setOnline(online); },
    onMessage: (m) => {
      addMessage(m);
      if (m.kind !== "system" && m.author !== profile.name) alerts.incoming(m.author, m.body);
    },
    onColor: ({ name, color }) => applyColor(name, color),
    onAvatar: ({ name, avatar }) => applyAvatar(name, avatar),
    onPresence: setOnline,
    onTyping: showTyping,
    onDelete: removeMessage,
    onKicked: () => { alert("te han expulsado de la sala 10 min"); location.hash = ""; },
  });
  setModActions({ del: (seq) => conn?.del(seq), kick: (name) => conn?.kick(name) });

  picker.oninput = () => applyColor(profile.name, picker.value);
  picker.onchange = () => {
    profile.color = picker.value;
    saveProfile({ color: profile.color }); // persistente (UsersDO)
    conn.setColor(profile.color); // y en vivo para la sala
  };
}
function closeRoom() {
  conn?.close();
  conn = null;
  clearTyping();
}
// "escribiendo…": como mucho un aviso cada 2s mientras tecleas.
let lastTyping = 0;
$("#body").addEventListener("input", () => {
  const now = Date.now();
  if ($("#body").value && now - lastTyping > 2000) { lastTyping = now; conn?.typing(); }
});
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

addEventListener("hashchange", () => { if (profile?.name) route(); });
boot();
