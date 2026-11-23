// Helper fetch untuk dashboard (client).
export async function api(url, { method = "GET", body, form } = {}) {
  const init = { method, headers: {}, credentials: "same-origin" };
  if (form) init.body = form;
  else if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
  const res = await fetch(url, init);
  let data = null;
  try { data = await res.json(); } catch {}
  if (res.status === 401 && typeof window !== "undefined" && !url.includes("/login")) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error("Sesi berakhir, silakan login lagi.");
  }
  if (!res.ok) throw new Error(data?.error || `Permintaan gagal (${res.status})`);
  return data;
}

export const fmtBytes = (n = 0) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
