// Vistas en una página: entrada → (tu avatar) → lobby → sala. La sala va en
// el hash (#ciudad), así una URL compartida abre esa sala directamente.
import { $ } from "./util.js";
import { me, login, logout, saveProfile, getRoom } from "./session.js";
import { connectRoom } from "./ws.js";
import { addMessage, renderHistory, applyColor, applyAvatar, setOnline, setMe, setModActions, removeMessage, showTyping, clearTyping } from "./render.js";
import { CO, decode, encode, randomCode } from "./poporing.js";
import { avatarSvg } from "./render.js";
import { changePassword } from "./session.js";
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
const TABS = {
  cuerpo: { bodyShape: "forma", bodyTexture: "textura", bodyPattern: "dibujo", bodyFx: "efecto" },
  cara: { eyes: "ojos", mouth: "boca", cheeks: "mejillas" },
  cosas: { headTop: "arriba", headwear: "sombrero", ears: "orejas", wings: "alas", heldItem: "en mano" },
  magia: { effect: "ambiente", aura: "aura" },
};
let draft = decode("0");
let tab = "cuerpo";

function paintDraft() {
  const prev = $("#preview");
  prev.style.setProperty("--c", $("#avatar-color").value);
  prev.innerHTML = avatarSvg(encode(draft), $("#avatar-color").value);
  for (const b of $("#chips").querySelectorAll(".chip")) b.classList.toggle("active", draft[b.dataset.f] === b.dataset.v);
}
function paintChips() {
  const box = $("#chips");
  box.innerHTML = "";
  for (const [field, label] of Object.entries(TABS[tab])) {
    const opt = document.createElement("div");
    opt.className = "opt";
    const k = document.createElement("span");
    k.className = "k"; k.textContent = label;
    const chips = document.createElement("div");
    chips.className = "chips";
    for (const [v, name] of CO[field]) {
      const c = document.createElement("button");
      c.type = "button"; c.className = "chip"; c.textContent = name;
      c.dataset.f = field; c.dataset.v = v;
      c.onclick = () => { draft[field] = v; paintDraft(); };
      chips.appendChild(c);
    }
    opt.append(k, chips);
    box.appendChild(opt);
  }
  for (const b of $("#tabs").children) b.classList.toggle("active", b.dataset.tab === tab);
  paintDraft();
}
for (const t of Object.keys(TABS)) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = t; b.dataset.tab = t;
  b.onclick = () => { tab = t; paintChips(); };
  $("#tabs").appendChild(b);
}
function openAvatar() {
  closeRoom();
  show("avatar");
  $("#avatar-name").textContent = profile.name;
  draft = decode(profile.avatar);
  $("#avatar-color").value = profile.color;
  $("#pw-msg").textContent = "";
  paintChips();
}
$("#avatar-color").addEventListener("input", paintDraft);
$("#random-avatar").addEventListener("click", () => {
  draft = decode(randomCode());
  $("#avatar-color").value = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
  paintDraft();
});
$("#save-avatar").addEventListener("click", async () => {
  profile.avatar = encode(draft);
  profile.color = $("#avatar-color").value;
  await saveProfile({ avatar: profile.avatar, color: profile.color });
  route();
});
$("#pwform").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await changePassword($("#pw-current").value, $("#pw-next").value);
    $("#pw-msg").textContent = "cambiada";
    e.target.reset();
  } catch (err) {
    $("#pw-msg").textContent = err.message;
  }
});

// --- lobby -----------------------------------------------------------------
async function openLobby() {
  closeRoom();
  show("lobby");
  $("#me-lobby").textContent = profile.name;
  const mini = $("#me-avatar");
  mini.style.setProperty("--c", profile.color);
  mini.innerHTML = avatarSvg(profile.avatar, profile.color);
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
