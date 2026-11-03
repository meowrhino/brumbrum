// Identidad: nombre, color y avatar viven en el servidor (UsersDO) y llegan
// por /api/me con la cookie firmada. Nada en localStorage.
export async function me() {
  return (await fetch("/api/me")).json();
}

export async function login(name, password, club) {
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password, club }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "error");
  return data; // { name, color, avatar, created }
}

export const logout = () => fetch("/api/logout", { method: "POST" });

export const saveProfile = (p) =>
  fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });

export const getRoom = () => location.hash.slice(1);
