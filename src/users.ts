import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";

// Perfil que viaja al front y a las salas.
export type Profile = { color: string; avatar: string };

// Código de avatar: 3 dígitos (pelo, ojos, accesorio), ver public/js/avatar.js.
export const AVATAR_RE = /^[0-9]{3}$/;

// Un solo DO ("users") con la lista de nombres reservados: el primero que
// entra con un nombre lo registra con SU contraseña; a partir de ahí hace
// falta esa contraseña. Sin D1: la tabla vive en el SQLite del DO.
export class UsersDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS users (
          name    TEXT PRIMARY KEY,
          hash    TEXT NOT NULL,
          salt    TEXT NOT NULL,
          color   TEXT NOT NULL,
          avatar  TEXT NOT NULL DEFAULT '000',
          created INTEGER NOT NULL
        );
      `);
    });
  }

  // Entra o registra. Devuelve el perfil, o null si el nombre existe y la
  // contraseña no es la suya. `created` dice si el nombre era nuevo.
  async auth(name: string, password: string, defaultColor: string): Promise<(Profile & { created: boolean }) | null> {
    const row = this.ctx.storage.sql
      .exec<{ hash: string; salt: string; color: string; avatar: string }>(
        "SELECT hash, salt, color, avatar FROM users WHERE name = ?",
        name,
      )
      .toArray()[0];
    if (row) {
      const ok = (await hash(password, row.salt)) === row.hash;
      return ok ? { color: row.color, avatar: row.avatar, created: false } : null;
    }
    const salt = crypto.randomUUID();
    this.ctx.storage.sql.exec(
      "INSERT INTO users (name, hash, salt, color, avatar, created) VALUES (?, ?, ?, ?, '000', ?)",
      name,
      await hash(password, salt),
      salt,
      defaultColor,
      Date.now(),
    );
    return { color: defaultColor, avatar: "000", created: true };
  }

  getProfile(name: string): Profile | null {
    return (
      this.ctx.storage.sql
        .exec<Profile>("SELECT color, avatar FROM users WHERE name = ?", name)
        .toArray()[0] ?? null
    );
  }

  // Solo lo que venga (ya validado por el Worker).
  setProfile(name: string, p: Partial<Profile>): void {
    if (p.color) this.ctx.storage.sql.exec("UPDATE users SET color = ? WHERE name = ?", p.color, name);
    if (p.avatar) this.ctx.storage.sql.exec("UPDATE users SET avatar = ? WHERE name = ?", p.avatar, name);
  }
}

// PBKDF2-SHA256 (WebCrypto, sin dependencias). 100k iteraciones: unos ms en el
// DO, suficiente para que probar contraseñas robadas salga caro.
async function hash(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100_000 },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
