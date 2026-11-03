import { ConversationDO } from "./conversation";
import { UsersDO, AVATAR_RE } from "./users";
import { getUser, setUserCookie, safeEqual } from "./auth";
import { cleanColor, defaultColor } from "./color";

export interface Env {
  CHAT: DurableObjectNamespace<ConversationDO>;
  USERS: DurableObjectNamespace<UsersDO>;
  ASSETS: Fetcher;
  // Secrets (`wrangler secret put`; en local, .dev.vars): firma de la cookie
  // de identidad y la contraseña única del club (la puerta, como en Dollars).
  AUTH_SECRET: string;
  CLUB_PASSWORD: string;
  // Nombres de moderadores, separados por coma (wrangler.toml [vars]).
  MODS?: string;
}

const isMod = (env: Env, name: string) => (env.MODS || "").split(",").map((s) => s.trim()).includes(name);

export { ConversationDO, UsersDO };

// Salas fijas del lobby. shortcut: las salas que la gente cree por URL no
// aparecen aquí; cuando haga falta listarlas, un LobbyDO con tabla rooms.
const ROOMS = ["ciudad", "rumores", "musica", "ayuda", "rol", "random"];
const ROOM_RE = /^[a-z0-9_-]{1,32}$/;
const NAME_RE = /^[\p{L}\p{N} _.-]{1,25}$/u;

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
    const users = env.USERS.get(env.USERS.idFromName("users"));

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      if (!user) return new Response("unauthorized", { status: 401 });
      const room = url.searchParams.get("room") || "";
      if (!ROOM_RE.test(room)) return new Response("bad room", { status: 400 });
      // Nombre, color y avatar van SIEMPRE del servidor: el cliente no elige quién es.
      const profile = (await users.getProfile(user)) ?? { color: defaultColor(user), avatar: "000" };
      const target = new URL(request.url);
      target.searchParams.set("name", user);
      target.searchParams.set("color", profile.color);
      target.searchParams.set("avatar", profile.avatar);
      target.searchParams.set("mod", isMod(env, user) ? "1" : "0");
      return env.CHAT.get(env.CHAT.idFromName(room)).fetch(new Request(target, request));
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      if (!env.AUTH_SECRET || !env.CLUB_PASSWORD) return json({ error: "server misconfigured" }, { status: 500 });
      const { name, password, club } = (await request.json()) as { name?: string; password?: string; club?: string };
      const clean = String(name || "").trim();
      if (!NAME_RE.test(clean)) return json({ error: "nombre: letras, números, espacio . _ - (máx 25)" }, { status: 400 });
      if (!safeEqual(String(club || ""), env.CLUB_PASSWORD)) return json({ error: "la del club no es esa" }, { status: 403 });
      if (String(password || "").length < 4) return json({ error: "tu contraseña: 4 caracteres mínimo" }, { status: 400 });
      const p = await users.auth(clean, String(password), defaultColor(clean));
      if (!p) return json({ error: "ese nombre ya es de alguien (o no es tu contraseña)" }, { status: 403 });
      return json({ name: clean, mod: isMod(env, clean), ...p }, { headers: { "Set-Cookie": await setUserCookie(clean, env.AUTH_SECRET) } });
    }

    if (url.pathname === "/api/me") {
      if (!user) return json({ name: null });
      return json({ name: user, mod: isMod(env, user), ...((await users.getProfile(user)) ?? { color: defaultColor(user), avatar: "000" }) });
    }

    // La cookie es HttpOnly: solo el servidor puede borrarla.
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return json({ ok: true }, { headers: { "Set-Cookie": "brumbrum_user=; Path=/; HttpOnly; Max-Age=0" } });
    }

    if (url.pathname === "/api/profile" && request.method === "POST") {
      if (!user) return json({ error: "unauthorized" }, { status: 401 });
      const body = (await request.json()) as { color?: unknown; avatar?: unknown };
      const color = cleanColor(body.color) ?? undefined;
      const avatar = typeof body.avatar === "string" && AVATAR_RE.test(body.avatar) ? body.avatar : undefined;
      await users.setProfile(user, { color, avatar });
      return json({ ok: true });
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
