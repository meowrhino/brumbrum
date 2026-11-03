# brumbrum

chat anónimo por salas detrás de una contraseña de club. la moto negra.

motor de realtime heredado de [`rumrum`](https://github.com/meowrhino/rumrum) /
[`toctoc`](https://github.com/meowrhino/toctoc): Workers + un Durable Object
por sala + WebSocket Hibernation + SQLite en el DO. sin D1.

## arquitectura

```
Worker (src/index.ts)
  POST /api/login {name,password,club} → club OK → UsersDO.auth (registra o
                                         comprueba TU contraseña) → cookie HMAC
  GET  /api/me                    → tu nombre, color y avatar (o null)
  POST /api/profile {color,avatar}→ guarda en UsersDO
  POST /api/logout
  GET  /api/rooms                 → salas fijas + gente dentro (RPC online() a cada DO)
  /ws?room=<sala>                 → cookie OK → ConversationDO con nombre, color y
                                    avatar inyectados desde el UsersDO
  resto                           → ASSETS (public/)

ConversationDO (src/conversation.ts) ← el motor: mensajes, colores, avatares, presencia
UsersDO        (src/users.ts)        ← uno solo: nombres reservados (PBKDF2), color, avatar
```

front en `public/`: una página con cuatro vistas (entrada → tu avatar → lobby
→ sala, la sala va en el hash `#ciudad`). el avatar es un pictograma por capas
(pelo, ojos, extra; `public/js/avatar.js`) guardado como código de 3 dígitos. estética: petra
(Ableton: gris neutro, cero border-radius, JetBrains Mono) + las burbujas del
chat de Dollars como clips de Live (avatar y burbuja en el color de quien habla).

## correr en local

```bash
npm install
cp .dev.vars.example .dev.vars   # AUTH_SECRET y CLUB_PASSWORD de desarrollo
npm run dev
```

password del club: la de `.dev.vars` (`brumbrum`). el nombre se registra la
primera vez con la contraseña que tú pongas; desde entonces es tuyo.
para chatear contigo mismo: dos navegadores (la cookie es por navegador).

## desplegar

```bash
npx wrangler secret put AUTH_SECRET     # algo largo y aleatorio
npx wrangler secret put CLUB_PASSWORD   # la contraseña del club
npm run deploy
```

## pendiente

- "escribiendo…" (broadcast efímero desde el DO)
- salas creadas por URL en el lobby (hoy solo salen las 6 fijas) → LobbyDO
- host de sala: expulsar / silenciar / borrar
