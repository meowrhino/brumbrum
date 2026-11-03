// Conexión WebSocket a una sala, con reconexión automática. El protocolo (JSON
// con {type:"history"|"msg"|"color"}) lo define el motor (ConversationDO).
//   history → { messages, profiles }   (snapshot inicial)
//   msg     → un mensaje (user o system)
//   color   → { name, color }          (alguien cambió su color)

export function connectRoom({ room, onHistory, onMessage, onColor, onAvatar, onPresence }) {
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
    };
    // El DO hiberna o la red cae → el socket se cierra; reabrimos solos.
    ws.onclose = () => { if (!closed) setTimeout(open, 1000); };
  }
  open();

  return {
    send(body) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "msg", body }));
      }
    },
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
