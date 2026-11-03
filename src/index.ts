import { ConversationDO } from "./conversation";
import { getUser, setUserCookie, safeEqual } from "./auth";
import { cleanColor, defaultColor } from "./color";

export interface Env {
  CHAT: DurableObjectNamespace<ConversationDO>;
  ASSETS: Fetcher;
  // Secrets (`wrangler secret put`; en local, .dev.vars): firma de la cookie
  // de identidad y la contraseña única del club (la puerta, como en Dollars).
  AUTH_SECRET: string;
  CLUB_PASSWORD: string;
}

export { ConversationDO };

// Salas fijas del lobby. shortcut: las salas que la gente cree por URL no
// aparecen aquí; cuando haga falta listarlas, un LobbyDO con tabla rooms.
const ROOMS = ["ciudad", "rumores", "musica", "ayuda", "rol", "random"];
const ROOM_RE = /^[a-z0-9_-]{1,32}$/;

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const user = await getUser(request, env.AUTH_SECRET);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      if (!user) return new Response("unauthorized", { status: 401 });
      const room = url.searchParams.get("room") || "";
      if (!ROOM_RE.test(room)) return new Response("bad room", { status: 400 });
      // El nombre va SIEMPRE de la cookie: el cliente no elige quién es.
      const target = new URL(request.url);
      target.searchParams.set("name", user);
      target.searchParams.set("color", cleanColor(url.searchParams.get("color")) ?? defaultColor(user));
      return env.CHAT.get(env.CHAT.idFromName(room)).fetch(new Request(target, request));
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      if (!env.AUTH_SECRET || !env.CLUB_PASSWORD) return json({ error: "server misconfigured" }, { status: 500 });
      const { name, password } = (await request.json()) as { name?: string; password?: string };
      const clean = String(name || "").trim().slice(0, 25);
      if (!clean) return json({ error: "falta el nombre" }, { status: 400 });
      if (!safeEqual(String(password || ""), env.CLUB_PASSWORD)) {
        return json({ error: "no es esa" }, { status: 403 });
      }
      return json({ name: clean }, { headers: { "Set-Cookie": await setUserCookie(clean, env.AUTH_SECRET) } });
    }

    if (url.pathname === "/api/me") return json({ name: user });

    // La cookie es HttpOnly: solo el servidor puede borrarla.
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return json({ ok: true }, { headers: { "Set-Cookie": "brumbrum_user=; Path=/; HttpOnly; Max-Age=0" } });
    }

    if (url.pathname === "/api/rooms") {
      if (!user) return json({ error: "unauthorized" }, { status: 401 });
      const rooms = await Promise.all(
        ROOMS.map(async (room) => ({ room, online: await env.CHAT.get(env.CHAT.idFromName(room)).online() })),
      );
      return json(rooms);
    }

    return env.ASSETS.fetch(request);
  },
};
