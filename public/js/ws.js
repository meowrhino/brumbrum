// Conexión WebSocket a una sala, con reconexión automática. El protocolo (JSON
// con {type:"history"|"msg"|"color"}) lo define el motor (ConversationDO).
//   history → { messages, profiles }   (snapshot inicial)
//   msg     → un mensaje (user o system)
//   color   → { name, color }          (alguien cambió su color)

export function connectRoom({ room, onHistory, onMessage, onColor, onAvatar, onPresence, onTyping, onDelete, onKicked }) {
  let ws;
  let closed = false;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  // nombre, color y avatar los pone el Worker desde la cookie/perfil
  const url = `${proto}://${location.host}/ws?room=${encodeURIComponent(room)}`;

  function open() {
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "history") onHistory(data.messages, data.profiles || {}, data.avatars || {}, data.online || []);
      else if (data.type === "msg") onMessage(data);
      else if (data.type === "color") onColor(data);
      else if (data.type === "avatar") onAvatar?.(data);
      else if (data.type === "presence") onPresence?.(data.online || []);
      else if (data.type === "typing") onTyping?.(data.name);
      else if (data.type === "del") onDelete?.(data.seq);
    };
    // El DO hiberna o la red cae → el socket se cierra; reabrimos solos.
    // 4001 = expulsado por un mod: no reintentamos.
    ws.onclose = (e) => {
      if (e.code === 4001) { closed = true; onKicked?.(); return; }
      if (!closed) setTimeout(open, 1000);
    };
  }
  open();

  const tx = (obj) => { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); };
  return {
    send(body) { tx({ type: "msg", body }); },
    typing() { tx({ type: "typing" }); },
    del(seq) { tx({ type: "del", seq }); },
    kick(name) { tx({ type: "kick", name }); },
    close() {
      closed = true;
      ws?.close();
    },
    setColor(color) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "color", color }));
      }
    },
  };
}
