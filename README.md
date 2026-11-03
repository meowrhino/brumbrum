# brumbrum

chat anónimo por salas detrás de una contraseña de club. la moto negra.

motor de realtime heredado de [`rumrum`](https://github.com/meowrhino/rumrum) /
[`toctoc`](https://github.com/meowrhino/toctoc): Workers + un Durable Object
por sala + WebSocket Hibernation + SQLite en el DO. sin D1.

## arquitectura

```
Worker (src/index.ts)
  POST /api/login {name,password} → comprueba CLUB_PASSWORD → cookie firmada (HMAC)
  GET  /api/me                    → tu nombre (o null)
  GET  /api/rooms                 → salas fijas + gente dentro (RPC online() a cada DO)
  /ws?room=<sala>&color=<hex>     → cookie OK → ConversationDO (nombre SIEMPRE de la cookie)
  resto                           → ASSETS (public/)

ConversationDO (src/conversation.ts) ← el motor: mensajes, colores, presencia
```

front en `public/`: una página con tres vistas (entrada → lobby → sala, la
sala va en el hash `#ciudad`). estética B de `public/mockups/`: petra
(Ableton: gris neutro, cero border-radius, JetBrains Mono) + las burbujas del
chat de Dollars como clips de Live (avatar y burbuja en el color de quien habla).

## correr en local

```bash
npm install
cp .dev.vars.example .dev.vars   # AUTH_SECRET y CLUB_PASSWORD de desarrollo
npm run dev
```

entra con cualquier nombre y la contraseña de `.dev.vars` (`brumbrum`).
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
- elegir pictograma (hoy sale del nombre) → al perfil del DO como el color
- host de sala: expulsar / silenciar / borrar
