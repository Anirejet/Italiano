"use strict";
/* ================================================================ SINCRONIZACIÓN ORDENADOR ↔ MÓVIL
   Tu progreso se guarda en un «gist» privado de tu propia cuenta de GitHub (gratis).
   Cada dispositivo lo descarga, lo une con lo suyo (gana siempre el cambio más reciente) y lo vuelve a subir. */
const SYNC_LS = PID === "p1" ? "italiano.sync" : "italiano.sync." + PID;
const GIST_DESC = "Italiano app – progreso (no borrar)";
const GIST_FILE = "italiano-progreso.json";
const API = "https://api.github.com";
let SY = (() => { try { return JSON.parse(localStorage.getItem(SYNC_LS)) || {}; } catch (e) { return {}; } })();
let syncStatus = SY.token ? "idle" : "off", syncBusy = false, syncAgain = false, syncTmr = null, syncMsg = "";
function saveSY() { try { localStorage.setItem(SYNC_LS, JSON.stringify(SY)); } catch (e) {} }

function stable(x) {
  if (Array.isArray(x)) return "[" + x.map(stable).join(",") + "]";
  if (x && typeof x === "object") return "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + stable(x[k])).join(",") + "}";
  return JSON.stringify(x);
}
function shareable(st) { const o = JSON.parse(JSON.stringify(st)); delete o.set; delete o.upd; delete o.lastBackup; Object.keys(o).forEach(k => { if (k[0] === "_") delete o[k]; }); return o; }
const canon = st => stable(shareable(hydrate(st)));

class GhErr extends Error { constructor(code, msg) { super(msg); this.code = code; } }
async function gh(path, method, body) {
  let r;
  try {
    r = await fetch(API + path, { method: method || "GET", cache: "no-store",
      headers: Object.assign({ Authorization: "Bearer " + SY.token, Accept: "application/vnd.github+json" }, body ? { "Content-Type": "application/json" } : {}),
      body: body ? JSON.stringify(body) : undefined });
  } catch (e) { throw new GhErr("net", "Sin conexión a internet."); }
  if (r.status === 401) throw new GhErr("auth", "GitHub no acepta el código: puede estar mal copiado, caducado o revocado.");
  if (r.status === 403 || r.status === 429) throw new GhErr("perm", "GitHub ha rechazado la petición. Comprueba que el código tiene marcado el permiso «gist» (o que no has hecho demasiadas peticiones en poco tiempo).");
  if (r.status === 404) throw new GhErr("404", "No se encuentra el archivo de progreso en GitHub.");
  if (!r.ok) throw new GhErr("http", "GitHub ha respondido con un error (" + r.status + "). Inténtalo más tarde.");
  return r.json();
}
/* Cada usuario tiene su propio archivo de progreso. El primero se llama «principal»; los demás llevan el nombre detrás. */
const descFor = label => label ? GIST_DESC + " – " + label : GIST_DESC;
async function listGists() {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const list = await gh("/gists?per_page=100&page=" + page);
    list.forEach(x => { if (x.description && x.description.indexOf(GIST_DESC) === 0 && x.files && x.files[GIST_FILE]) out.push({ id: x.id, label: x.description === GIST_DESC ? "" : x.description.slice(GIST_DESC.length).replace(/^\s*–\s*/, ""), upd: x.updated_at }); });
    if (list.length < 100) break;
  }
  return out;
}
async function createGist(label) {
  const g = await gh("/gists", "POST", { description: descFor(label), public: false, files: { [GIST_FILE]: { content: JSON.stringify(Object.assign(shareable(S), { _app: APP_VERSION, _by: DEV, _at: Date.now() })) } } });
  return g.id;
}
async function findOrCreateGist() {
  const l = (await listGists()).find(x => x.label === (SY.label || ""));
  return l ? l.id : createGist(SY.label || "");
}
async function pullRemote() {
  let g;
  try { g = await gh("/gists/" + SY.gist); }
  catch (e) { if (e.code !== "404") throw e; SY.gist = await findOrCreateGist(); saveSY(); g = await gh("/gists/" + SY.gist); }
  const f = g.files && g.files[GIST_FILE]; if (!f) return null;
  let txt = f.content;
  if (f.truncated && f.raw_url) { const r = await fetch(f.raw_url, { cache: "no-store" }); txt = await r.text(); }
  try { return JSON.parse(txt); } catch (e) { return null; }
}
const SAFE_VIEWS = ["home", "progress", "route", "saved", "more", "settings", "uerr"];
async function syncNow(manual) {
  if (!SY.token || !SY.gist) return;
  if (syncBusy) { syncAgain = true; return; }
  if (!navigator.onLine) { syncStatus = "offline"; drawSyncDot(); if (manual) toast("Sin conexión: se sincronizará cuando vuelva internet."); return; }
  syncBusy = true; syncStatus = "busy"; drawSyncDot();
  try {
    const remote = await pullRemote();
    const before = canon(S);
    const merged = remote ? merge(S, hydrate(remote)) : hydrate(S);
    merged.set = S.set; merged.lastBackup = S.lastBackup;
    if (canon(merged) !== before) {
      S = merged; save(true);
      if (SAFE_VIEWS.includes(curView) || (curView === "manual" && params.c == null) || (curView === "review" && !(SESSION && SESSION.q.length))) { const y = window.scrollY; render(); window.scrollTo(0, y); }
    }
    if (!remote || canon(remote) !== canon(merged)) {
      await gh("/gists/" + SY.gist, "PATCH", { files: { [GIST_FILE]: { content: JSON.stringify(Object.assign(shareable(merged), { _app: APP_VERSION, _by: DEV, _at: Date.now() })) } } });
    }
    SY.last = Date.now(); SY.err = ""; saveSY(); syncStatus = "ok"; syncMsg = "";
    if (manual) toast("Sincronizado.");
  } catch (e) {
    syncStatus = e.code === "net" ? "offline" : "err"; syncMsg = e.message || String(e);
    if (e.code !== "net") { SY.err = syncMsg; saveSY(); }
    if (manual || e.code === "auth") toast(syncMsg);
  } finally {
    syncBusy = false; drawSyncDot();
    if (curView === "settings" && $("#syncBox")) $("#syncBox").outerHTML = syncSettingsHTML(true), bindSyncSettings();
    if (syncAgain) { syncAgain = false; setTimeout(() => syncNow(), 1500); }
  }
}
function scheduleSync(ms) { if (!SY.token) return; clearTimeout(syncTmr); syncTmr = setTimeout(() => syncNow(), ms); }
onSaved = () => scheduleSync(10000);
document.addEventListener("visibilitychange", () => {
  if (!SY.token) return;
  if (document.visibilityState === "visible") { if (Date.now() - (SY.last || 0) > 20000) scheduleSync(300); }
  else if (syncTmr) { clearTimeout(syncTmr); syncNow(); }
});
window.addEventListener("online", () => scheduleSync(1000));
window.addEventListener("offline", () => { if (SY.token) { syncStatus = "offline"; drawSyncDot(); } });

function drawSyncDot() {
  const el = $("#syncDot"); if (!el) return;
  if (!SY.token) { el.innerHTML = ""; return; }
  const lab = { idle: "Sincronización activada", busy: "Sincronizando…", ok: "Sincronizado", err: "Error de sincronización: toca para ver", offline: "Sin conexión: se sincronizará después" }[syncStatus] || "";
  el.innerHTML = `<button class="tb-ic sync-${syncStatus}" id="syncBtn" aria-label="${esc(lab)}" title="${esc(lab)}">${svg("cloud")}</button>`;
  $("#syncBtn").onclick = () => { if (syncStatus === "err") go("settings"); else syncNow(true); };
}
function ago(t) {
  if (!t) return "nunca"; const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "hace unos segundos"; if (s < 3600) return "hace " + Math.round(s / 60) + " min";
  if (s < 86400) return "hace " + Math.round(s / 3600) + " h"; return new Date(t).toLocaleDateString("es-ES");
}
function otherToken() {
  for (const p of PROF.list) { if (p.id === PID) continue; try { const o = JSON.parse(localStorage.getItem(p.id === "p1" ? "italiano.sync" : "italiano.sync." + p.id)); if (o && o.token) return { t: o.token, n: profName(p) }; } catch (e) {} }
  return null;
}
function syncSettingsHTML() {
  if (!SY.token) return `<div id="syncBox"><h2 class="s">Sincronizar ordenador y móvil</h2>
  <p class="muted small">Para que lo que haces en un dispositivo aparezca en el otro, la app guarda tu progreso en un archivo privado de <b>tu propia cuenta de GitHub</b> (la misma donde está publicada la app). Es gratis y solo hay que hacerlo una vez en cada dispositivo. Los pasos detallados están en <button class="linkb" data-go="help" data-p='{"s":"sync"}'>Ayuda → Sincronizar</button>.</p>
  <label class="muted small" for="tok">Pega aquí tu código de acceso de GitHub (empieza por <b>ghp_</b>)</label>
  <div class="row" style="flex-wrap:nowrap;margin-top:6px"><input type="text" id="tok" data-noacc autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ghp_…" aria-label="Código de acceso de GitHub"><button class="btn pri" id="tokGo">Conectar</button></div>
  ${otherToken() ? `<button class="btn small" id="tokReuse" data-t="${esc(otherToken().t)}" style="margin-top:8px">Usar la misma cuenta de GitHub que ${esc(otherToken().n)}</button>` : ""}
  <p class="muted small" id="tokMsg" style="margin-top:6px"></p></div>`;
  return `<div id="syncBox"><h2 class="s">Sincronizar ordenador y móvil</h2>
  <p class="note ${SY.err ? "err" : "ok"}">${SY.err ? esc(SY.err) : `Sincronización activada${SY.user ? " con la cuenta <b>" + esc(SY.user) + "</b>" : ""}${SY.label ? " (progreso de <b>" + esc(SY.label) + "</b>)" : ""}. Última vez: ${ago(SY.last)}.`}</p>
  <p class="muted small">Se sincroniza sola al abrir la app, unos segundos después de cada cambio y al salir. Se comparte el progreso (tarjetas, ruta, errores, guardadas, mis frases, posición de lectura); los ajustes (voz, letra…) son de cada dispositivo.</p>
  <div class="row"><button class="btn pri" id="syncGo">Sincronizar ahora</button><button class="btn" id="syncOff">Desconectar este dispositivo</button></div></div>`;
}
function bindSyncSettings() {
  const go1 = $("#tokGo");
  if (go1) go1.onclick = async () => {
    const t = $("#tok").value.trim().replace(/\s+/g, ""); const msg = $("#tokMsg");
    if (!/^(ghp_|github_pat_)[A-Za-z0-9_]{20,}$/.test(t)) { msg.textContent = "Ese código no tiene el formato de GitHub (ghp_… o github_pat_…). Cópialo entero."; return; }
    if (!navigator.onLine) { msg.textContent = "Necesitas internet para conectar."; return; }
    go1.disabled = true; msg.textContent = "Comprobando el código…";
    const prev = SY; SY = { token: t };
    try {
      const u = await gh("/user"); SY.user = u.login;
      msg.textContent = "Buscando tu progreso en GitHub…";
      const list = await listGists();
      const me = profName(PROF.list.find(x => x.id === PID));
      const finish = async (id, label) => { SY.gist = id; SY.label = label; saveSY(); await syncNow(); toast("¡Conectado! Haz lo mismo en el otro dispositivo con el mismo código."); if (curView === "settings") { const y = window.scrollY; render(); window.scrollTo(0, y); } };
      if (!list.length) { const label = PROF.list.length > 1 && PID !== "p1" ? me : ""; await finish(await createGist(label), label); return; }
      /* varios progresos en la cuenta (varias personas con la misma cuenta de GitHub): que elija el suyo */
      const box = $("#syncBox");
      box.innerHTML = `<h2 class="s">Sincronizar ordenador y móvil</h2><p class="note">En esta cuenta de GitHub ya hay ${list.length === 1 ? "un progreso guardado" : list.length + " progresos guardados"}. ¿Cuál es el de <b>${esc(me)}</b>?</p>
      <div style="display:grid;gap:8px">${list.map((g, i) => `<button class="btn" data-gpick="${i}">${esc(g.label || "Progreso principal")} <span class="muted small">· actualizado ${esc(new Date(g.upd).toLocaleDateString("es-ES"))}</span></button>`).join("")}</div>
      <p class="muted small" style="margin-top:12px">¿Ninguno es el tuyo? Crea uno nuevo con tu nombre (cada persona debe tener el suyo):</p>
      <div class="row" style="flex-wrap:nowrap"><input type="text" id="gnew" data-noacc value="${esc(me)}" autocomplete="off"><button class="btn pri" id="gcreate">Crear el mío</button></div>`;
      box.querySelectorAll("[data-gpick]").forEach(b => b.onclick = () => { const g = list[+b.dataset.gpick]; finish(g.id, g.label); });
      $("#gcreate").onclick = async () => { const label = $("#gnew").value.trim().slice(0, 30); if (!label) { toast("Escribe un nombre."); return; }
        if (list.some(g => g.label.toLowerCase() === label.toLowerCase())) { toast("Ya existe uno con ese nombre: elígelo arriba o usa otro nombre."); return; }
        try { await finish(await createGist(label), label); } catch (e) { toast(e.message); } };
    } catch (e) { SY = prev; saveSY(); go1.disabled = false; msg.textContent = e.message; }
  };
  /* otro usuario de este dispositivo ya tiene la cuenta conectada: reutilizar su código */
  const reuse = $("#tokReuse");
  if (reuse) reuse.onclick = () => { $("#tok").value = reuse.dataset.t; $("#tokGo").click(); };
  const g = $("#syncGo"); if (g) g.onclick = () => syncNow(true);
  const off = $("#syncOff");
  if (off) off.onclick = () => {
    if (!confirm("¿Desconectar este dispositivo? Tu progreso se queda aquí y en GitHub; solo dejará de sincronizarse.")) return;
    SY = {}; saveSY(); syncStatus = "off"; drawSyncDot(); render();
  };
}
if (SY.token && SY.gist) setTimeout(() => syncNow(), 800);
