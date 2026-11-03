// Identidad: el nombre lo da el servidor (/api/me, cookie firmada). El color
// es local a este dispositivo y se sincroniza a la sala vía el perfil del DO.
import { colorFor } from "./util.js";

export async function me() {
  const r = await fetch("/api/me");
  return (await r.json()).name;
}

export async function login(name, password) {
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "error");
  return data.name;
}

export const logout = () => fetch("/api/logout", { method: "POST" });

export const getRoom = () => location.hash.slice(1);
export const getColor = (name) => localStorage.getItem("brumbrum_color") || colorFor(name);
export const setColor = (color) => localStorage.setItem("brumbrum_color", color);
