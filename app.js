"use strict";
const APP_VERSION = "1.0";
const DATA = window.DATA;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICON = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  practice: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  verbs: '<path d="M4 6h16M4 12h10M4 18h13"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  plane: '<path d="M2 16l20-7-20-7 4 7-4 7z"/><path d="M6 9h16"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14"/><path d="M12 17.5h.01"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
};
const svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------------------------------------------------------------- utilidades */
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`]/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const ART_IT = /^(il|lo|la|l|i|gli|le|un|uno|una)\s+/;
const ART_ES = /^(el|la|los|las|lo|un|una|unos|unas)\s+/;
function variants(s, art) {
  const out = new Set();
  String(s).replace(/\([^)]*\)/g, " ").split(/\s*[\/,;]\s*|\s+o\s+/).forEach(p => {
    const n = norm(p); if (!n) return;
    out.add(n); const b = n.replace(art, ""); if (b) out.add(b);
  });
  return [...out];
}
function lev(a, b, max) {
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev = Array.from({ length: lb + 1 }, (_, j) => j), cur = new Array(lb + 1), pp = null;
  for (let i = 1; i <= la; i++) {
    cur[0] = i; let best = i;
    for (let j = 1; j <= lb; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      cur[j] = v; if (v < best) best = v;
    }
    if (best > max) return max + 1;
    pp = prev.slice(); [prev, cur] = [cur, prev];
  }
  return prev[lb];
}
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length];
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }

/* ---------------------------------------------------------------- datos */
const PERSONS = ["io", "tu", "lui / lei / Lei", "noi", "voi", "loro"];
const TENSES = DATA.tenses;
const DICT = DATA.dict.map((e, i) => ({ i, o: e[4] ?? i, it: e[0], pr: e[1], es: e[2], cat: e[3], id: "w" + hash(e[0] + "|" + e[2]), kIt: variants(e[0], ART_IT), kEs: variants(e[2], ART_ES) }));
const PHR = DATA.phr.filter(p => !/^Participios/.test(p[3])).map(p => ({ it: p[0], pr: p[1], es: p[2], g: p[3], id: "f" + hash(p[0] + "|" + p[2]), kIt: [...variants(p[0], ART_IT), norm(p[0])], kEs: [...variants(p[2], ART_ES), norm(p[2])] }));
const CARDS = Object.fromEntries([...DICT, ...PHR].map(e => [e.id, e]));
const CORDER = ["familia", "números", "tiempo", "alimentos", "ciudad", "viajes", "verbos", "adjetivos", "compras", "casa", "cocina", "ropa", "cuerpo", "salud", "colores", "emociones", "adverbios", "conectores", "interjecciones", "expresiones", "ocio", "trabajo", "estudio", "naturaleza", "animales", "tecnología", "falsos amigos"];
const crank = c => { const i = CORDER.indexOf(c); return i < 0 ? 99 : i; };
const numv = e => { const n = parseFloat(String(e.es).replace(/\./g, "")); return isNaN(n) ? 1e12 : n; };
const NEWORDER = DICT.slice().sort((a, b) => crank(a.cat) - crank(b.cat) || (a.cat === "números" ? numv(a) - numv(b) : 0) || a.o - b.o || a.i - b.i);
const CATS = [...new Set(NEWORDER.map(e => e.cat))];
const GORDER = ["Saludos", "Presentaciones", "Cortesía", "En el bar", "En el restaurante", "Hotel", "Transporte", "Compras", "Salud", "Emergencias", "Decir la hora", "Opinar", "Plantillas útiles"];
PHR.forEach(p => { p.g = p.g.replace(/^Situaciones cotidianas · /, ""); });
const GROUPS = [...new Set(PHR.map(p => p.g))].sort((a, b) => (GORDER.indexOf(a) + 99) % 99 - (GORDER.indexOf(b) + 99) % 99);
const VERBS = DATA.verbs;
const FORMIDX = new Map();
VERBS.forEach((v, vi) => {
  const add = (f, info) => f.split(/\s*\/\s*/).forEach(x => { const k = norm(x); if (!k) return; if (!FORMIDX.has(k)) FORMIDX.set(k, []); FORMIDX.get(k).push({ vi, ...info }); });
  add(v.inf, { t: "Infinitivo" }); add(v.ger[0], { t: "Gerundio" }); add(v.part[0], { t: "Participio" });
  for (const t of TENSES) v.T[t].forEach((f, p) => { if (f && !f[0].includes(" ")) add(f[0], { t, p }); });
});

/* ---------------------------------------------------------------- estado */
const LS = "italiano.app.v1";
const DEF = { cards: {}, days: {}, quiz: { ok: 0, n: 0 }, newDay: 0, newCount: 0, lastCh: 0, lastBackup: 0, plan: { day: 0, verb: 0, read: false, phr: [] },
  set: { rate: 0.9, newPerDay: 20, dir: "it", auto: true, pron: true, voice: "", theme: "auto" }, upd: 0 };
function fresh() { return JSON.parse(JSON.stringify(DEF)); }
function hydrate(o) { const s = Object.assign(fresh(), o || {}); s.set = Object.assign({}, DEF.set, (o || {}).set); s.plan = Object.assign({}, DEF.plan, (o || {}).plan); s.quiz = Object.assign({}, DEF.quiz, (o || {}).quiz); return s; }
let S = (() => { try { return hydrate(JSON.parse(localStorage.getItem(LS))); } catch (e) { return fresh(); } })();
function save() { S.upd = Date.now(); try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { toast("No se ha podido guardar el progreso."); } }
function plan() { const t = today(); if (S.plan.day !== t) S.plan = { day: t, verb: 0, read: false, phr: [] }; return S.plan; }
function logActivity(n = 1) { const t = today(); S.days[t] = (S.days[t] || 0) + n; }
function merge(a, b) {
  const out = hydrate(JSON.parse(JSON.stringify(a.upd >= b.upd ? a : b)));
  const other = a.upd >= b.upd ? b : a;
  for (const [k, c] of Object.entries(other.cards || {})) if (!out.cards[k] || (c.t || 0) > (out.cards[k].t || 0)) out.cards[k] = c;
  for (const [k, n] of Object.entries(other.days || {})) out.days[k] = Math.max(out.days[k] || 0, n);
  return out;
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
function applyTheme() { if (S.set.theme === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", S.set.theme); document.body.classList.toggle("hide-pr", !S.set.pron); }

/* ---------------------------------------------------------------- voz */
let VOICES = [];
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  const sc = v => (/(enhanced|premium|mejorada|natural|neural|google)/i.test(v.name) ? 3 : 0) + (/it[-_]it/i.test(v.lang) ? 1 : 0) + (v.localService ? 1 : 0);
  VOICES = speechSynthesis.getVoices().filter(v => /^it([-_]|$)/i.test(v.lang)).sort((a, b) => sc(b) - sc(a));
}
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = () => { loadVoices(); if (curView === "settings") render(); }; }
function cleanSpeak(t) { return String(t).split(" + ")[0].replace(/\([^)]*\)/g, " ").replace(/\bil\/la\b/g, "il").replace(/\s*\/\s*/g, ", ").replace(/[«»"…]/g, " ").replace(/\s+/g, " ").trim(); }
function speak(text, rate) {
  if (!("speechSynthesis" in window)) { toast("Este navegador no puede leer en voz alta."); return; }
  if (!VOICES.length) loadVoices();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanSpeak(text));
  u.lang = "it-IT"; u.rate = rate || S.set.rate;
  const v = VOICES.find(x => x.voiceURI === S.set.voice) || VOICES[0];
  if (v) u.voice = v; else if (!speak.warned) { speak.warned = true; toast("No hay voz italiana instalada: mira Ajustes."); }
  speechSynthesis.speak(u);
}
const sayBtn = (text, sm) => `<button class="say${sm ? " sm" : ""}" data-say="${esc(text)}" aria-label="Escuchar">${svg("speaker")}</button>`;
document.addEventListener("click", e => {
  const b = e.target.closest("[data-say]");
  if (b) { speak(b.dataset.say, b.dataset.slow ? 0.6 : undefined); if (b.dataset.phr) markPhrase(b.dataset.phr); return; }
  const w = e.target.closest(".manual .it, .speakable .it"); if (w) speak(w.textContent);
});
function markPhrase(id) { const p = plan(); if (!p.phr.includes(id)) { p.phr.push(id); logActivity(); save(); } }

/* ---------------------------------------------------------------- búsqueda aproximada */
function scoreKeys(q, keys) {
  let best = 0; const maxd = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
  for (const k of keys) {
    if (k === q) return 100;
    if (k.startsWith(q)) best = Math.max(best, 85 - Math.min(15, k.length - q.length));
    else if (k.split(" ").includes(q)) best = Math.max(best, 78);
    else if (q.length >= 3 && k.includes(q)) best = Math.max(best, 60);
    else if (q.length >= 3) {
      const d = lev(q, k, maxd); if (d <= maxd) best = Math.max(best, 55 - d * 12);
      else for (const w of k.split(" ")) { if (w.length < 3) continue; const d2 = lev(q, w, maxd); if (d2 <= maxd) best = Math.max(best, 45 - d2 * 12); }
    }
  }
  return best;
}
function search(qs, dir) {
  const q = norm(qs); if (!q) return null;
  const words = [];
  for (const e of DICT) { const s = Math.max(dir !== "es" ? scoreKeys(q, e.kIt) : 0, dir !== "it" ? scoreKeys(q, e.kEs) - 1 : 0); if (s > 0) words.push([s, e]); }
  words.sort((a, b) => b[0] - a[0] || a[1].it.length - b[1].it.length);
  const phr = [];
  if (q.length >= 3) for (const p of PHR) { const s = Math.max(dir !== "es" ? scoreKeys(q, p.kIt) : 0, dir !== "it" ? scoreKeys(q, p.kEs) : 0); if (s >= 40) phr.push([s, p]); }
  phr.sort((a, b) => b[0] - a[0]);
  const forms = dir !== "es" ? (FORMIDX.get(q) || []) : [];
  const ws = forms.length ? words.filter(w => w[0] >= 60) : words;
  return { words: ws.slice(0, 40), phr: phr.slice(0, 8).map(x => x[1]), forms, exact: words.some(w => w[0] >= 78) };
}

/* ---------------------------------------------------------------- repetición espaciada */
const INT = [0, 1, 3, 7, 16, 35, 90];
const deckOf = id => id[0] === "f" ? "f" : "w";
function dueList(deck, filter) { const t = today(); return Object.keys(S.cards).filter(id => CARDS[id] && deckOf(id) === deck && S.cards[id].d <= t && (!filter || filter(CARDS[id]))); }
function newAvailable() { const t = today(); if (S.newDay !== t) { S.newDay = t; S.newCount = 0; } return Math.max(0, S.set.newPerDay - S.newCount); }
function grade(id, g) {
  const t = today(); const isNew = !S.cards[id];
  const c = S.cards[id] || { b: 0, d: t, n: 0, ok: 0 };
  if (isNew) { newAvailable(); S.newCount++; }
  c.n++; c.t = Date.now();
  if (g === 0) { c.b = 1; c.d = t; }
  else if (g === 1) { c.b = Math.max(1, c.b); c.d = t + 1; c.ok++; }
  else if (g === 2) { c.b = Math.min(6, c.b + 1); c.d = t + INT[c.b]; c.ok++; }
  else { c.b = Math.min(6, c.b + 2); c.d = t + INT[c.b]; c.ok++; }
  S.cards[id] = c; logActivity(); save();
}
function streak() { let t = today(), n = 0; if (!S.days[t]) t--; while (S.days[t]) { n++; t--; } return n; }

/* ---------------------------------------------------------------- navegación */
const NAV = [["home", "Hoy", "home"], ["dict", "Buscar", "search"], ["review", "Repasar", "cards"], ["practice", "Practicar", "practice"],
  ["verbs", "Verbos", "verbs"], ["travel", "Viaje", "plane"], ["manual", "Manual", "book"], ["progress", "Progreso", "chart"],
  ["settings", "Ajustes", "gear"], ["help", "Ayuda", "help"]];
const BOTTOM = [["home", "Hoy", "home"], ["dict", "Buscar", "search"], ["review", "Repasar", "cards"], ["verbs", "Verbos", "verbs"], ["more", "Más", "more"]];
let curView = "home", params = {};
function nav() {
  const cur = k => (curView === k || (k === "more" && !BOTTOM.some(b => b[0] === curView))) ? 'aria-current="page"' : "";
  $("#navSide").innerHTML = NAV.map(([k, l, ic]) => `<button class="navbtn" data-go="${k}" ${curView === k ? 'aria-current="page"' : ""}>${svg(ic)}${l}</button>`).join("");
  $("#navBottom").innerHTML = BOTTOM.map(([k, l, ic]) => `<button class="navbtn" data-go="${k}" ${cur(k)}>${svg(ic)}${l}</button>`).join("");
}
document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go, b.dataset.p ? JSON.parse(b.dataset.p) : {}); });
function go(v, p = {}) { if ("speechSynthesis" in window) speechSynthesis.cancel(); curView = v; params = p; render(); window.scrollTo(0, 0); }
function render() { nav(); applyTheme(); VIEWS[curView](); }
const VIEWS = {};
const entryHTML = (e, opts = {}) => `<div class="entry speakable">${opts.phr ? `<button class="say" data-say="${esc(e.it)}" data-phr="${e.id}" aria-label="Escuchar">${svg("speaker")}</button>` : sayBtn(e.it)}
  <div class="grow"><div class="hw"><span class="it">${esc(e.it)}</span></div><div class="pr">[${esc(e.pr)}]</div><div class="tr">${esc(e.es)}</div>
  ${opts.meta === false ? "" : `<div class="meta">${esc(e.cat || e.g || "")}${S.cards[e.id] ? " · en repaso" : ""}</div>`}
  ${opts.slow ? `<div style="margin-top:6px"><button class="btn small" style="padding:4px 10px" data-say="${esc(e.it)}" data-slow="1" ${opts.phr ? `data-phr="${e.id}"` : ""}>Despacio</button></div>` : ""}</div></div>`;

/* ---------------------------------------------------------------- HOY */
const TRAVEL_FOCUS = GROUPS.filter(g => !/Plantillas|Opinar|Decir la hora/.test(g));
function todaysPhrases() { const t = today(); const pool = PHR.filter(p => TRAVEL_FOCUS.includes(p.g)); const out = []; for (let k = 0; out.length < 5 && k < 50; k++) { const p = pool[(t * 37 + k * 53) % pool.length]; if (!out.includes(p)) out.push(p); } return out; }
const VERB_ROT = ["Presente", "Passato prossimo", "Imperfetto", "Futuro", "Condizionale", "Congiuntivo presente", "Imperativo", "Passato remoto", "Congiuntivo imperfetto"];
function verbOfDay() {
  const t = today(); const core = VERBS.map((v, i) => [v, i]).filter(([v]) => v.tags.includes("irregular") || v.tags.includes("modelo") || v.tags.includes("esencial"));
  const all = VERBS.map((v, i) => [v, i]);
  const [v, vi] = (t % 3 === 2) ? pick(all, t * 7) : pick(core, t * 5);
  let tense = pick(VERB_ROT, t);
  if (!v.T[tense].some(Boolean)) tense = "Presente";
  return { v, vi, tense };
}
VIEWS.home = () => {
  const p = plan(); const h = new Date().getHours(); const hi = h < 14 ? "Buongiorno" : h < 20 ? "Buon pomeriggio" : "Buonasera";
  const dueW = dueList("w").length, dueF = dueList("f").length, nw = newAvailable();
  const reviewDone = dueW + dueF === 0 && (nw === 0 || Object.keys(S.cards).length >= DICT.length);
  const phrs = todaysPhrases(); const heard = phrs.filter(x => p.phr.includes(x.id)).length;
  const vd = verbOfDay(); const ch = DATA.ch[Math.min(S.lastCh, DATA.ch.length - 1)];
  const tasks = [
    [reviewDone, "1 · Repaso de vocabulario", dueW + dueF ? `${dueW + dueF} tarjetas pendientes y ${nw} palabras nuevas disponibles.` : nw ? `${nw} palabras nuevas para hoy.` : "Todo repasado por hoy.", "review", "Empezar"],
    [heard >= 5, "2 · Frases para el viaje", `5 frases del día · escuchadas ${heard} de 5. Repítelas en voz alta.`, "travel", "Escuchar", { today: 1 }],
    [p.verb >= 6, `3 · Verbo del día: ${vd.v.inf}`, `${vd.tense} · ${p.verb >= 6 ? "hecho" : "escribe sus formas (aciertos: " + p.verb + " de 6)"}.`, "drill", "Practicar", { vi: vd.vi, t: vd.tense }],
    [p.read, "4 · Lectura del manual", `${ch.title}. Lee un apartado y escucha los ejemplos.`, "manual", "Leer", { c: Math.min(S.lastCh, DATA.ch.length - 1) }],
  ];
  const doneN = tasks.filter(x => x[0]).length;
  const w = DICT[(today() * 7919) % DICT.length];
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent); const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  const needBackup = Object.keys(S.cards).length >= 30 && Date.now() - (S.lastBackup || 0) > 14 * 864e5;
  $("#view").innerHTML = `<h1 class="v">${hi}!</h1><p class="sub">Tu plan de hoy (30–40 minutos) · ${doneN} de ${tasks.length} completados · racha: ${streak()} día${streak() === 1 ? "" : "s"}</p>
  ${ios && !standalone ? `<p class="note">Para usarla como app y sin internet: pulsa <b>Compartir</b> en Safari y elige <b>Añadir a pantalla de inicio</b>. Más detalles en Ayuda.</p>` : ""}
  ${needBackup ? `<p class="note">Hace tiempo que no guardas una copia de tu progreso. <button class="btn" style="padding:4px 10px" data-go="settings">Hacer copia</button></p>` : ""}
  <div class="list" style="padding:0">${tasks.map(([d, t, desc, view, label, pp]) => `<div class="task ${d ? "done" : ""}"><div class="ck">${d ? "✓" : ""}</div>
    <div class="grow"><div class="t">${esc(t)}</div><div class="muted small">${esc(desc)}</div></div>
    <button class="btn ${d ? "" : "pri"}" data-go="${view}" ${pp ? `data-p='${JSON.stringify(pp)}'` : ""}>${d ? "Repetir" : label}</button></div>`).join("")}
    <div class="task"><div class="ck"></div><div class="grow"><div class="t">5 · Ruta por niveles</div><div class="muted small">Llegará en la próxima actualización (unidades A1–B2 con ejercicios).</div></div></div></div>
  <h2 class="s">Palabra del día</h2>
  <div class="hero speakable"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">${sayBtn(w.it)}<div>
  <div class="word"><span class="it">${esc(w.it)}</span></div><div class="pr" style="font-size:1rem">[${esc(w.pr)}]</div>
  <div style="font-size:1.15rem;margin-top:6px">${esc(w.es)}</div><div class="muted small" style="margin-top:4px">${esc(w.cat)}</div></div></div></div>`;
};

/* ---------------------------------------------------------------- MÁS */
VIEWS.more = () => {
  $("#view").innerHTML = `<h1 class="v">Más</h1><div class="list menu" style="padding:0 14px">
  ${[["practice", "Practicar", "Test, escritura, dictado, conjugación y autoevaluación", "practice"], ["travel", "Viaje y frases útiles", "Frases por situaciones con audio", "plane"],
     ["manual", "Manual", "Toda la gramática, con buscador", "book"], ["progress", "Progreso", "Estadísticas y copia de seguridad", "chart"],
     ["settings", "Ajustes y voz", "Voz italiana, velocidad, tarjetas nuevas al día", "gear"], ["help", "Ayuda", "Instalar, usar sin conexión, copias", "help"]]
    .map(([k, t, d, ic]) => `<button data-go="${k}">${svg(ic)}<span><b>${t}</b><br><span class="muted small">${d}</span></span></button>`).join("")}</div>`;
};

/* ---------------------------------------------------------------- DICCIONARIO */
VIEWS.dict = () => {
  const dir = params.dir || "both";
  $("#view").innerHTML = `<h1 class="v">Diccionario</h1><p class="sub">Escribe en italiano o en español. Si te equivocas al escribir, te propone las palabras más parecidas. También reconoce formas verbales («vado», «feci»…).</p>
  <input type="search" id="q" placeholder="ciao, mesa, forchetta, cuchillo…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Buscar palabra" value="${esc(params.q || "")}">
  <div class="row" style="margin-top:10px"><div class="seg" role="group" aria-label="Dirección">
   <button data-dir="both" aria-pressed="${dir === "both"}">Los dos</button><button data-dir="it" aria-pressed="${dir === "it"}">IT → ES</button><button data-dir="es" aria-pressed="${dir === "es"}">ES → IT</button></div></div>
  <div id="res" style="margin-top:14px"></div>`;
  const q = $("#q"); let tmr; const run = () => { params.q = q.value; drawResults(q.value, dir); };
  q.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(run, 120); });
  $("#view").querySelectorAll("[data-dir]").forEach(b => b.onclick = () => { params.dir = b.dataset.dir; VIEWS.dict(); });
  run();
};
function drawResults(qs, dir) {
  const r = $("#res"); const res = search(qs, dir);
  if (!res) {
    r.innerHTML = `<h2 class="s">Explorar por temas</h2><div class="chips">${CATS.map(c => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    r.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { r.innerHTML = `<button class="back" id="bk">← Temas</button><h2 class="s">${esc(b.dataset.cat)}</h2><div class="list">${DICT.filter(e => e.cat === b.dataset.cat).map(e => entryHTML(e)).join("")}</div>`; $("#bk").onclick = () => drawResults("", dir); });
    return;
  }
  let h = "";
  if (res.forms.length) {
    const seen = new Set();
    h += `<div class="note ok" style="margin-bottom:12px">${res.forms.filter(f => { const k = f.vi + "|" + f.t + "|" + f.p; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 4).map(f => {
      const v = VERBS[f.vi]; return `«${esc(qs.trim())}» es una forma de <b class="it">${esc(v.inf)}</b> (${esc(v.es)}) · ${esc(f.t)}${f.p != null ? " · " + esc(PERSONS[f.p]) : ""}. <button class="btn" style="padding:3px 10px;margin:4px 0 0" data-go="verbs" data-p='${JSON.stringify({ v: f.vi })}'>Ver conjugación</button>`;
    }).join("<br>")}</div>`;
  }
  if (res.words.length && !res.exact && !res.forms.length) h += `<p class="muted">No hay coincidencia exacta. ¿Quizás quisiste decir…?</p>`;
  if (res.words.length) h += `<div class="list">${res.words.map(x => entryHTML(x[1])).join("")}</div>`;
  if (res.phr.length) h += `<h2 class="s">En frases</h2><div class="list">${res.phr.map(p => entryHTML(p, { phr: true })).join("")}</div>`;
  if (!res.words.length && !res.phr.length && !res.forms.length && norm(qs).includes(" ")) {
    const parts = norm(qs).split(" ").filter(w => w.length >= 3); const seen = new Set(); const extra = [];
    parts.forEach(w => { const r2 = search(w, dir); if (r2) r2.words.slice(0, 3).forEach(x => { if (!seen.has(x[1].id)) { seen.add(x[1].id); extra.push(x[1]); } }); });
    if (extra.length) { r.innerHTML = `<p class="muted">No hay resultados para la frase completa. Por palabras:</p><div class="list">${extra.map(e => entryHTML(e)).join("")}</div>`; return; }
  }
  if (!res.words.length && !res.phr.length && !res.forms.length) h += `<p class="note">No hay ninguna palabra parecida en el diccionario. Prueba con el infinitivo o el singular.</p>`;
  r.innerHTML = h;
}

/* ---------------------------------------------------------------- REPASO */
let SESSION = null;
function buildSession(deck, filter) {
  const due = shuffle(dueList(deck, filter)).slice(0, 80);
  const pool = deck === "f" ? PHR : NEWORDER;
  const fresh = pool.filter(e => !S.cards[e.id] && (!filter || filter(e))).slice(0, newAvailable()).map(e => e.id);
  return { q: [...due, ...fresh], done: 0, showing: false, dir: null, deck };
}
VIEWS.review = () => {
  if (params.group) { const g = params.group; params.group = null; SESSION = buildSession("f", e => e.g === g); if (!SESSION.q.length) { SESSION = null; toast("No hay frases pendientes de ese grupo hoy."); } }
  if (!SESSION || !SESSION.q.length) {
    const dueW = dueList("w").length, dueF = dueList("f").length, nw = newAvailable();
    $("#view").innerHTML = `<h1 class="v">Repasar</h1><p class="sub">Tarjetas con repetición espaciada: lo que sabes vuelve cada vez más tarde; lo que fallas vuelve pronto.</p>
    ${SESSION && SESSION.done ? `<p class="note ok">Sessione terminata! ${SESSION.done} tarjetas repasadas. Bravo!</p>` : ""}
    <div class="stats" style="margin:14px 0"><div class="stat"><b>${dueW}</b><span>palabras para repasar</span></div><div class="stat"><b>${dueF}</b><span>frases para repasar</span></div><div class="stat"><b>${nw}</b><span>nuevas disponibles hoy</span></div></div>
    <div class="row" style="margin-bottom:10px"><span class="muted">Qué repasar:</span><div class="seg" role="group" aria-label="Mazo"><button data-deck="w" aria-pressed="${(params.deck || "w") === "w"}">Palabras</button><button data-deck="f" aria-pressed="${params.deck === "f"}">Frases de viaje</button></div></div>
    <label class="muted" for="cat">${params.deck === "f" ? "Situación" : "Tema"} (opcional)</label>
    <div style="margin:6px 0 16px"><select id="cat"><option value="">Todos</option>${(params.deck === "f" ? GROUPS : CATS).map(c => `<option>${esc(c)}</option>`).join("")}</select></div>
    <div class="row"><span class="muted">Sentido:</span><div class="seg" role="group" aria-label="Sentido">
    ${[["it", "Italiano → Español"], ["es", "Español → Italiano"], ["mix", "Mezclado"]].map(([k, l]) => `<button data-d="${k}" aria-pressed="${S.set.dir === k}">${l}</button>`).join("")}</div></div>
    <button class="btn pri big wide" id="start" style="margin-top:18px">Empezar</button>
    <p class="muted small" style="margin-top:14px">Cómo valorar: <b>Otra vez</b> si no la sabías (vuelve en esta sesión), <b>Difícil</b> si te costó (mañana), <b>Bien</b> o <b>Fácil</b> si la sabías (vuelve en unos días).</p>`;
    $("#view").querySelectorAll("[data-deck]").forEach(b => b.onclick = () => { params.deck = b.dataset.deck; SESSION = null; VIEWS.review(); });
    $("#view").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { S.set.dir = b.dataset.d; save(); SESSION = null; VIEWS.review(); });
    $("#start").onclick = () => { const v = $("#cat").value; const deck = params.deck || "w"; SESSION = buildSession(deck, v ? (deck === "f" ? e => e.g === v : e => e.cat === v) : null); if (!SESSION.q.length) { toast("No hay tarjetas pendientes ahí hoy. Prueba con otro tema."); SESSION = null; return; } VIEWS.review(); };
    return;
  }
  const e = CARDS[SESSION.q[0]];
  if (!SESSION.dir) SESSION.dir = S.set.dir === "mix" ? (Math.random() < .5 ? "it" : "es") : S.set.dir;
  const d = SESSION.dir; const isNew = !S.cards[e.id]; const box = (S.cards[e.id] || {}).b || 0;
  const pct = Math.round(100 * SESSION.done / Math.max(1, SESSION.done + SESSION.q.length));
  $("#view").innerHTML = `<div class="row" style="justify-content:space-between"><button class="back" id="quit">← Salir</button><span class="muted small">${SESSION.q.length} por delante${isNew ? " · nueva" : ""}</span></div>
  <div class="bar" style="margin-bottom:14px"><i style="width:${pct}%"></i></div>
  <div class="card speakable">${d === "it" ? `<div class="q itq"><span class="it">${esc(e.it)}</span></div><div class="pr">[${esc(e.pr)}]</div>` : `<div class="q">${esc(e.es)}</div><div class="muted small">${esc(e.cat || e.g)}</div>`}
  ${SESSION.showing ? `<hr style="border:0;border-top:1px solid var(--line);width:60%;margin:10px auto">${d === "it" ? `<div class="a">${esc(e.es)}</div>` : `<div class="a"><span class="it" style="font-size:1.4rem">${esc(e.it)}</span></div><div class="pr">[${esc(e.pr)}]</div>`}` : ""}
  ${d === "it" || SESSION.showing ? `<div>${sayBtn(e.it)}</div>` : ""}</div>
  ${SESSION.showing ? `<div class="grade"><button data-g="0">Otra vez<small>ahora</small></button><button data-g="1">Difícil<small>mañana</small></button><button data-g="2">Bien<small>${INT[Math.min(6, box + 1)]} d</small></button><button data-g="3">Fácil<small>${INT[Math.min(6, box + 2)]} d</small></button></div>`
    : `<button class="btn pri big wide" id="show" style="margin-top:14px">Mostrar respuesta</button>`}`;
  $("#quit").onclick = () => { SESSION = null; VIEWS.review(); };
  if (!SESSION.showing) $("#show").onclick = () => { SESSION.showing = true; VIEWS.review(); if (S.set.auto && SESSION.dir === "es") speak(e.it); };
  $("#view").querySelectorAll("[data-g]").forEach(b => b.onclick = () => {
    const g = +b.dataset.g; grade(e.id, g); SESSION.q.shift(); SESSION.showing = false; SESSION.dir = null;
    if (g === 0) SESSION.q.splice(Math.min(3, SESSION.q.length), 0, e.id); else SESSION.done++;
    VIEWS.review(); const n = CARDS[SESSION.q[0]]; if (n && S.set.auto && (S.set.dir === "it")) speak(n.it);
  });
};

/* ---------------------------------------------------------------- PRÁCTICA */
let PQ = null;
function answerDist(input, targets) {
  const a = norm(input).replace(ART_IT, ""); let best = 9;
  for (const t of targets) { const b = t.replace(ART_IT, ""); if (a === b || a === t) return 0; best = Math.min(best, lev(a, b, 2)); }
  return best;
}
VIEWS.practice = () => {
  if (PQ && PQ.i < PQ.items.length) return drawPractice();
  const last = PQ ? `<p class="note ok">Resultado: ${PQ.ok} de ${PQ.items.length}. ${PQ.ok === PQ.items.length ? "Perfetto!" : PQ.ok >= PQ.items.length * .7 ? "Molto bene!" : "Sigue practicando."}</p>` : "";
  PQ = null;
  $("#view").innerHTML = `<h1 class="v">Practicar</h1><p class="sub">Ejercicios de 10 preguntas. Los aciertos cuentan para tus estadísticas.</p>${last}
  <label class="muted" for="pcat">Tema</label><div style="margin:6px 0 16px"><select id="pcat"><option value="">Todos los temas</option><option value="__viaje" ${params.cat === "__viaje" ? "selected" : ""}>★ Frases de viaje (solo test)</option>${CATS.map(c => `<option ${params.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
  <div class="list">${[["mcq", "Elige la traducción", "Ves la palabra italiana y eliges entre cuatro opciones."], ["mcqes", "Elige la palabra italiana", "Ves el español y eliges la forma italiana."],
    ["write", "Escríbela en italiano", "Ves el español y escribes la palabra en italiano."], ["listen", "Dictado", "Escuchas una palabra y la escribes."],
    ["conj", "Conjugación", "Escribes la forma verbal que se pide."], ["self", "Autoevaluación del manual", "Las 30 preguntas del capítulo 21, con su solución."]]
    .map(([k, t, d]) => `<div class="entry"><div class="grow"><b>${t}</b><div class="muted small">${d}</div></div><button class="btn pri" data-mode="${k}">Empezar</button></div>`).join("")}</div>`;
  $("#view").querySelectorAll("[data-mode]").forEach(b => b.onclick = () => startPractice(b.dataset.mode, $("#pcat").value));
};
function startPractice(mode, cat, opts = {}) {
  params.cat = cat;
  const travel = cat === "__viaje";
  if (travel && (mode === "write" || mode === "listen")) { toast("Con frases solo está el test. Elige un tema de palabras."); return; }
  const pool = travel ? PHR : DICT.filter(e => !cat || e.cat === cat);
  let items;
  if (mode === "conj") {
    items = [];
    if (opts.vi != null) {
      const v = VERBS[opts.vi]; v.T[opts.t].forEach((f, p) => { if (f) items.push({ v, t: opts.t, p, f }); }); shuffle(items);
    } else {
      const ts = TENSES.filter(t => !/prossimo/.test(t));
      for (let k = 0; items.length < 10 && k < 200; k++) {
        const v = pick(VERBS, Math.floor(Math.random() * 1e6)); const t = pick(ts, Math.floor(Math.random() * 1e6));
        const ps = v.T[t].map((f, i) => f ? i : -1).filter(i => i >= 0); if (!ps.length) continue;
        const p = pick(ps, Math.floor(Math.random() * 1e6)); items.push({ v, t, p, f: v.T[t][p] });
      }
    }
  } else if (mode === "self") items = DATA.quiz.map(q => ({ q: q[0], a: q[1] }));
  else items = shuffle(pool.slice()).slice(0, 10);
  if (!items.length) { toast("No hay elementos en ese tema."); return; }
  PQ = { mode, items, i: 0, ok: 0, done: false, pool: pool.length >= 4 ? pool : DICT, daily: !!opts.daily };
  curView = "practice"; nav(); drawPractice();
}
function drawPractice() {
  const it = PQ.items[PQ.i], m = PQ.mode;
  const head = `<div class="row" style="justify-content:space-between"><button class="back" id="pquit">← Salir</button><span class="muted small">${PQ.i + 1} / ${PQ.items.length} · aciertos: ${PQ.ok}</span></div>`;
  let body = "";
  if (m === "mcq" || m === "mcqes") {
    if (!it._opts) { const same = PQ.pool.filter(e => e !== it && e.es !== it.es && e.it !== it.it && (e.cat || e.g) === (it.cat || it.g)); const o = shuffle(same).slice(0, 3); while (o.length < 3) { const r = pick(PQ.pool, Math.floor(Math.random() * 1e6)); if (r !== it && !o.includes(r)) o.push(r); } it._opts = shuffle([it, ...o]); }
    const qTxt = m === "mcq" ? `<div class="q itq"><span class="it">${esc(it.it)}</span></div><div class="pr">[${esc(it.pr)}]</div><div>${sayBtn(it.it)}</div>` : `<div class="q">${esc(it.es)}</div>`;
    body = `<div class="card speakable" style="min-height:160px">${qTxt}</div><div class="opts">${it._opts.map((o, k) => `<button class="opt ${PQ.done ? (o === it ? "good" : (k === PQ.pick ? "bad" : "")) : ""}" data-k="${k}" ${PQ.done ? "disabled" : ""}>${m === "mcq" ? esc(o.es) : `<span class="it">${esc(o.it)}</span>`}</button>`).join("")}</div>`;
  } else if (m === "write" || m === "listen" || m === "conj") {
    const top = m === "write" ? `<div class="q">${esc(it.es)}</div><div class="muted small">${esc(it.cat)}</div>`
      : m === "listen" ? `<div class="muted">Escucha y escribe la palabra en italiano</div><div class="row" style="justify-content:center">${sayBtn(it.it)}<button class="btn small" data-say="${esc(it.it)}" data-slow="1">Despacio</button></div>`
      : `<div class="muted">${esc(it.t)} · ${it.t === "Imperativo" ? ["", "(tu)", "(Lei)", "(noi)", "(voi)", "(Loro)"][it.p] : (it.t.startsWith("Congiuntivo") ? "che " : "") + esc(PERSONS[it.p])}</div><div class="q itq"><span class="it">${esc(it.v.inf)}</span></div><div class="muted small">${esc(it.v.es)}</div>`;
    body = `<div class="card speakable" style="min-height:160px">${top}</div>
    <div style="margin-top:14px"><input type="text" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${m === "conj" ? "Escribe la forma verbal…" : "Escribe en italiano…"}" aria-label="Tu respuesta" ${PQ.done ? "disabled" : ""} value="${esc(PQ.val || "")}"></div>
    ${PQ.done ? "" : `<div class="row" style="margin-top:10px"><button class="btn pri" id="check">Comprobar</button><button class="btn" id="skip">No lo sé</button></div>`}`;
  } else if (m === "self") {
    body = `<div class="card" style="min-height:160px;text-align:left"><div class="a">${esc(it.q)}</div>${PQ.done ? `<div class="note ok" style="margin-top:12px"><b>Solución:</b> ${esc(it.a)}</div>` : ""}</div>
    ${PQ.done ? `<div class="row" style="margin-top:12px"><span class="muted">¿La acertaste?</span><button class="btn pri" data-self="1">Sí</button><button class="btn" data-self="0">No</button></div>` : `<button class="btn pri big wide" id="reveal" style="margin-top:14px">Ver solución</button>`}`;
  }
  const fb = PQ.fb ? `<div class="note ${PQ.fbc} speakable" style="margin-top:14px">${PQ.fb}</div>` : "";
  const next = PQ.done && m !== "self" ? `<button class="btn pri big wide" id="next" style="margin-top:14px">${PQ.i + 1 < PQ.items.length ? "Siguiente" : "Ver resultado"}</button>` : "";
  $("#view").innerHTML = head + body + fb + next;
  $("#pquit").onclick = () => { PQ = null; go(params.from || "practice"); };
  if (m === "listen" && !PQ.done && !PQ.spoken) { PQ.spoken = true; setTimeout(() => speak(it.it), 150); }
  $("#view").querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    PQ.pick = +b.dataset.k; const right = it._opts[PQ.pick] === it;
    finish(right, right ? "Corretto!" : `La respuesta era: <b>${m === "mcq" ? esc(it.es) : `<span class="it">${esc(it.it)}</span>`}</b>`); speak(it.it);
  });
  const ans = $("#ans"); if (ans && !PQ.done) { ans.focus(); ans.addEventListener("keydown", ev => { if (ev.key === "Enter") $("#check").click(); }); }
  if ($("#check")) $("#check").onclick = () => {
    const v = ans.value; PQ.val = v; if (!norm(v)) { ans.focus(); return; }
    if (m === "conj") {
      const target = it.f[0]; const alts = target.split(/\s*\/\s*/);
      const exact = alts.some(x => x.trim().toLowerCase() === v.trim().toLowerCase());
      const d = answerDist(v, alts.map(norm));
      const show = `<span class="it">${esc(target)}</span> <span class="pr">[${esc(it.f[1])}]</span>`;
      if (exact) finish(true, `Corretto: ${show}`);
      else if (d === 0) finish(true, `Correcto, pero fíjate en el acento: ${show}`);
      else finish(false, `La forma correcta es ${show}`);
      if (PQ.daily && (exact || d === 0)) { plan().verb++; save(); }
      speak(target);
    } else {
      const d = answerDist(v, it.kIt); const show = `<span class="it">${esc(it.it)}</span> <span class="pr">[${esc(it.pr)}]</span>`;
      if (d === 0) finish(true, `Corretto: ${show} = ${esc(it.es)}`);
      else if (d === 1 && norm(v).length > 3) finish(true, `Casi: revisa la ortografía. Se escribe ${show}`);
      else finish(false, `Era ${show} = ${esc(it.es)}`);
      speak(it.it);
    }
  };
  if ($("#skip")) $("#skip").onclick = () => { const f = m === "conj" ? it.f : [it.it, it.pr]; finish(false, `Era <span class="it">${esc(f[0])}</span> <span class="pr">[${esc(f[1])}]</span>`); speak(f[0]); };
  if ($("#reveal")) $("#reveal").onclick = () => { PQ.done = true; drawPractice(); };
  $("#view").querySelectorAll("[data-self]").forEach(b => b.onclick = () => { const ok = b.dataset.self === "1"; if (ok) { PQ.ok++; S.quiz.ok++; } S.quiz.n++; logActivity(); save(); nextQ(); });
  if ($("#next")) { $("#next").onclick = nextQ; }
}
function finish(ok, msg) { PQ.done = true; if (ok) { PQ.ok++; S.quiz.ok++; } S.quiz.n++; PQ.fb = msg; PQ.fbc = ok ? "ok" : "err"; logActivity(); save(); drawPractice(); }
function nextQ() {
  PQ.i++; PQ.done = false; PQ.fb = null; PQ.val = ""; PQ.pick = null; PQ.spoken = false;
  if (PQ.i >= PQ.items.length) { if (PQ.daily) { const r = PQ; PQ = null; toast(`Verbo del día: ${r.ok} de ${r.items.length}.`); go("home"); return; } VIEWS.practice(); }
  else drawPractice();
}
VIEWS.drill = () => { params.from = "home"; startPractice("conj", "", { vi: params.vi, t: params.t, daily: true }); };

/* ---------------------------------------------------------------- VERBOS */
VIEWS.verbs = () => {
  if (params.v != null) {
    const v = VERBS[params.v];
    $("#view").innerHTML = `<button class="back" data-go="verbs">← Todos los verbos</button>
    <div class="row speakable" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(v.inf)}<div><h1 class="v" style="margin:0"><span class="it">${esc(v.inf)}</span></h1><div class="pr">[${esc(v.pr)}]</div>
    <p class="sub" style="margin:4px 0 0">${esc(v.es)} · auxiliar: <b>${esc(v.aux)}</b></p></div></div>
    <p class="muted small speakable" style="margin:12px 0">${esc(v.note)} Gerundio: <span class="it">${esc(v.ger[0])}</span> <span class="pr">[${esc(v.ger[1])}]</span> · Participio: <span class="it">${esc(v.part[0])}</span> <span class="pr">[${esc(v.part[1])}]</span></p>
    <div class="row" style="margin-bottom:14px"><label class="muted" for="dt">Practicar:</label><select id="dt">${TENSES.filter(t => v.T[t].some(Boolean)).map(t => `<option>${t}</option>`).join("")}</select><button class="btn pri" id="dgo">Empezar</button></div>
    <div class="tgrid speakable">${TENSES.map(t => `<div class="tense"><h3>${esc(t)}</h3><table>${v.T[t].map((f, i) => f ? `<tr><td class="p">${t === "Imperativo" ? ["", "(tu)", "(Lei)", "(noi)", "(voi)", "(Loro)"][i] : (t.startsWith("Congiuntivo") ? "che " : "") + esc(PERSONS[i])}</td><td><span class="it">${esc(f[0])}</span><br><span class="pr">[${esc(f[1])}]</span></td></tr>` : "").join("") || `<tr><td class="muted">No se usa.</td></tr>`}</table></div>`).join("")}</div>
    <p class="muted small" style="margin-top:14px">Toca cualquier forma para escucharla.</p>`;
    $("#dgo").onclick = () => { params.from = "verbs"; startPractice("conj", "", { vi: params.v, t: $("#dt").value }); };
    return;
  }
  $("#view").innerHTML = `<h1 class="v">Verbos</h1><p class="sub">${VERBS.length} verbos conjugados en 10 tiempos, con pronunciación. Busca por infinitivo, traducción o cualquier forma («vado», «feci»…).</p>
  <input type="search" id="vq" placeholder="Buscar verbo…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Buscar verbo" value="${esc(params.vq || "")}">
  <div class="seg" role="group" style="margin-top:10px">${[["", "Todos"], ["irregular", "Irregulares"], ["regular", "Regulares"]].map(([k, l]) => `<button data-f="${k}" aria-pressed="${(params.vf || "") === k}">${l}</button>`).join("")}</div>
  <div class="list" id="vl" style="margin-top:12px"></div>`;
  const draw = () => {
    const q = norm($("#vq").value); params.vq = $("#vq").value;
    let list = VERBS.map((v, i) => [v, i, 1]).filter(([v]) => !params.vf || v.tags.includes(params.vf));
    if (q) { const byForm = new Set((FORMIDX.get(q) || []).map(f => f.vi)); list = list.map(([v, i]) => [v, i, byForm.has(i) ? 100 : Math.max(scoreKeys(q, [norm(v.inf)]), scoreKeys(q, variants(v.es, ART_ES)))]).filter(x => x[2] > 0).sort((a, b) => b[2] - a[2]); }
    $("#vl").innerHTML = list.map(([v, i]) => `<div class="entry"><div class="grow"><button class="back" style="margin:0;padding:0;font-size:1.15rem;text-align:left" data-go="verbs" data-p='{"v":${i}}'><span class="it">${esc(v.inf)}</span></button>
    <div class="muted small">${esc(v.es)}${v.tags.includes("irregular") ? " · irregular" : ""}</div></div>${sayBtn(v.inf, true)}</div>`).join("") || `<p class="muted" style="padding:14px 0">Ningún verbo coincide.</p>`;
  };
  $("#vq").addEventListener("input", draw);
  $("#view").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { params.vf = b.dataset.f; VIEWS.verbs(); });
  draw();
};

/* ---------------------------------------------------------------- VIAJE */
VIEWS.travel = () => {
  if (params.today) {
    const ps = todaysPhrases();
    $("#view").innerHTML = `<button class="back" data-go="home">← Hoy</button><h1 class="v">5 frases del día</h1><p class="sub">Escucha cada frase (normal y despacio) y repítela en voz alta varias veces. Se marcan como hechas al escucharlas.</p>
    <div class="list">${ps.map(p => entryHTML(p, { phr: true, slow: true })).join("")}</div>`;
    return;
  }
  const g = params.g || GROUPS[0];
  $("#view").innerHTML = `<h1 class="v">Viaje y frases útiles</h1><p class="sub">Frases para desenvolverte en Italia, con audio normal y lento. Toca una situación.</p>
  <div class="chips">${GROUPS.map(x => `<button class="chip" aria-pressed="${x === g}" data-g="${esc(x)}">${esc(x)}</button>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri" data-go="review" data-p='${JSON.stringify({ group: g, deck: "f" })}'>Repasar estas frases</button></div>
  <div class="list" style="margin-top:14px">${PHR.filter(p => p.g === g).map(p => entryHTML(p, { phr: true, slow: true, meta: false })).join("")}</div>`;
  $("#view").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { params.g = b.dataset.g; VIEWS.travel(); });
};

/* ---------------------------------------------------------------- MANUAL */
VIEWS.manual = () => {
  if (params.c != null) {
    const c = DATA.ch[params.c]; S.lastCh = params.c; plan().read = true; logActivity(); save();
    $("#view").innerHTML = `<button class="back" data-go="manual">← Índice del manual</button><h1 class="v">${esc(c.title)}</h1>
    <p class="muted small">Toca cualquier palabra en verde para oírla.</p><div class="manual">${c.html}</div>
    <div class="row" style="justify-content:space-between;margin-top:30px">${params.c > 0 ? `<button class="btn" data-go="manual" data-p='{"c":${params.c - 1}}'>← Anterior</button>` : "<span></span>"}
    ${params.c < DATA.ch.length - 1 ? `<button class="btn pri" data-go="manual" data-p='{"c":${params.c + 1}}'>Siguiente →</button>` : ""}</div>`;
    return;
  }
  $("#view").innerHTML = `<h1 class="v">Manual</h1><p class="sub">El manual completo, con tablas y esquemas.</p>
  <input type="search" id="mq" placeholder="Buscar en el manual (congiuntivo, ci, preposiciones…)" aria-label="Buscar en el manual" autocomplete="off" autocorrect="off">
  <div id="mres"></div><div class="list chlist" style="margin-top:14px">${DATA.ch.map((c, i) => `<button data-go="manual" data-p='{"c":${i}}'>${i === S.lastCh ? "▸ " : ""}${esc(c.title)}</button>`).join("")}</div>`;
  let TXT = null;
  $("#mq").addEventListener("input", ev => {
    TXT = TXT || DATA.ch.map(c => norm(c.html.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " ")));
    const q = norm(ev.target.value); const r = $("#mres");
    if (q.length < 3) { r.innerHTML = ""; return; }
    const hits = TXT.map((t, i) => [i, t.split(q).length - 1]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    r.innerHTML = hits.length ? `<p class="muted" style="margin-top:12px">Aparece en:</p><div class="chips">${hits.slice(0, 10).map(([i, n]) => `<button class="chip" data-go="manual" data-p='{"c":${i}}'>${esc(DATA.ch[i].title)} (${n})</button>`).join("")}</div>` : `<p class="muted" style="margin-top:12px">No aparece en el manual.</p>`;
  });
};

/* ---------------------------------------------------------------- PROGRESO */
VIEWS.progress = () => {
  const ids = Object.keys(S.cards); const t = today();
  const lv = [0, 0, 0]; ids.forEach(id => lv[S.cards[id].b >= 4 ? 2 : S.cards[id].b >= 2 ? 1 : 0]++);
  const days = []; for (let d = t - 27; d <= t; d++) days.push(S.days[d] || 0); const mx = Math.max(1, ...days);
  const acc = S.quiz.n ? Math.round(100 * S.quiz.ok / S.quiz.n) : null;
  const hard = ids.filter(id => CARDS[id] && S.cards[id].n >= 2).map(id => [id, S.cards[id].ok / S.cards[id].n]).sort((a, b) => a[1] - b[1]).slice(0, 8).filter(x => x[1] < .7);
  $("#view").innerHTML = `<h1 class="v">Progreso</h1><p class="sub">Tu progreso se guarda en este dispositivo. Haz copias de seguridad de vez en cuando (Ajustes).</p>
  <div class="stats"><div class="stat"><b>${ids.length}</b><span>tarjetas empezadas</span></div><div class="stat"><b>${lv[1]}</b><span>en aprendizaje</span></div>
  <div class="stat"><b>${lv[2]}</b><span>dominadas</span></div><div class="stat"><b>${streak()}</b><span>días seguidos</span></div><div class="stat"><b>${acc == null ? "—" : acc + "%"}</b><span>aciertos en ejercicios</span></div></div>
  <h2 class="s">Actividad de las últimas 4 semanas</h2><div class="days">${days.map(n => `<div style="height:${Math.round(100 * n / mx)}%" title="${n}"></div>`).join("")}</div>
  ${hard.length ? `<h2 class="s">Las que más te cuestan</h2><div class="list">${hard.map(([id]) => entryHTML(CARDS[id])).join("")}</div>` : ""}
  <h2 class="s">Vocabulario por temas</h2><div class="kv">${CATS.map(c => { const all = DICT.filter(e => e.cat === c); const s = all.filter(e => S.cards[e.id]).length; const k = all.filter(e => S.cards[e.id] && S.cards[e.id].b >= 4).length;
    return `<div><div style="font-size:.95rem">${esc(c)} <span class="muted">· ${s}/${all.length}</span></div><div class="bar"><i style="width:${Math.round(100 * s / all.length)}%"></i></div></div><span class="muted small">${k} dominadas</span>`; }).join("")}</div>`;
};

/* ---------------------------------------------------------------- AJUSTES */
async function exportBackup() {
  const txt = JSON.stringify(S); const name = "italiano-progreso-" + new Date().toISOString().slice(0, 10) + ".json";
  const file = new File([txt], name, { type: "application/json" });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Copia de seguridad · Italiano" }); S.lastBackup = Date.now(); save(); return; } }
  catch (e) { if (e && e.name === "AbortError") return; }
  const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000); S.lastBackup = Date.now(); save(); toast("Copia descargada.");
}
function importBackup(file) {
  const r = new FileReader();
  r.onload = () => { try { const o = JSON.parse(r.result); if (!o || !o.cards) throw 0; S = merge(S, hydrate(o)); save(); toast("Progreso recuperado."); render(); } catch (e) { toast("Ese archivo no es una copia válida."); } };
  r.readAsText(file);
}
VIEWS.settings = () => {
  const has = "speechSynthesis" in window;
  $("#view").innerHTML = `<h1 class="v">Ajustes</h1>
  <h2 class="s">Voz italiana</h2>
  ${!has ? `<p class="note err">Este navegador no permite leer en voz alta. Usa Safari (iPhone) o Chrome/Edge (ordenador).</p>` :
    VOICES.length ? `<div class="row"><select id="voice" aria-label="Voz">${VOICES.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.set.voice ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select><button class="btn" data-say="Buongiorno! Vorrei un caffè, per favore.">Probar</button></div>`
    : `<p class="note err">No se ha encontrado ninguna voz italiana en este dispositivo. Mira cómo instalarla en Ayuda.</p>`}
  <h2 class="s">Velocidad de lectura</h2><div class="row"><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${S.set.rate}" aria-label="Velocidad" style="flex:1"><span id="rv">${S.set.rate}</span></div>
  <h2 class="s">Estudio</h2><div class="kv">
  <label for="npd">Tarjetas nuevas al día</label><select id="npd">${[10, 15, 20, 25, 30, 40, 50].map(n => `<option ${n === S.set.newPerDay ? "selected" : ""}>${n}</option>`).join("")}</select>
  <label for="auto">Leer en voz alta automáticamente</label><input type="checkbox" id="auto" ${S.set.auto ? "checked" : ""} style="width:24px;height:24px">
  <label for="pron">Mostrar la pronunciación figurada</label><input type="checkbox" id="pron" ${S.set.pron ? "checked" : ""} style="width:24px;height:24px">
  <label for="theme">Aspecto</label><select id="theme">${[["auto", "Como el teléfono"], ["light", "Claro"], ["dark", "Oscuro"]].map(([k, l]) => `<option value="${k}" ${S.set.theme === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
  <h2 class="s">Copia de seguridad</h2>
  <p class="muted small">Tu progreso solo está en este dispositivo. Guarda una copia (por ejemplo en Archivos o iCloud Drive) y recupérala si cambias de teléfono o quieres pasarla al ordenador.${S.lastBackup ? " Última copia: " + new Date(S.lastBackup).toLocaleDateString("es-ES") + "." : ""}</p>
  <div class="row"><button class="btn pri" id="exp">Guardar copia</button><button class="btn" id="imp">Recuperar copia</button><input type="file" id="impf" accept="application/json,.json" hidden></div>
  <h2 class="s">Zona de peligro</h2><button class="btn" id="reset" style="color:var(--rosso)">Borrar todo el progreso</button>
  <p class="muted small" style="margin-top:26px">Versión ${APP_VERSION}. La voz la genera tu propio dispositivo: es gratuita y funciona sin internet si está descargada, pero no es la grabación de un hablante nativo. La pronunciación figurada es una aproximación para hispanohablantes.</p>`;
  const v = $("#voice"); if (v) v.onchange = () => { S.set.voice = v.value; save(); speak("Ciao! Come stai?"); };
  $("#rate").oninput = e => { S.set.rate = +e.target.value; $("#rv").textContent = S.set.rate; save(); };
  $("#npd").onchange = e => { S.set.newPerDay = +e.target.value; save(); };
  $("#auto").onchange = e => { S.set.auto = e.target.checked; save(); };
  $("#pron").onchange = e => { S.set.pron = e.target.checked; save(); applyTheme(); };
  $("#theme").onchange = e => { S.set.theme = e.target.value; save(); applyTheme(); };
  $("#exp").onclick = exportBackup;
  $("#imp").onclick = () => $("#impf").click();
  $("#impf").onchange = e => { if (e.target.files[0]) importBackup(e.target.files[0]); };
  $("#reset").onclick = () => { if (confirm("¿Borrar todo tu progreso? No se puede deshacer.")) { const set = S.set; S = fresh(); S.set = set; save(); toast("Progreso borrado."); render(); } };
};

/* ---------------------------------------------------------------- AYUDA */
VIEWS.help = () => {
  $("#view").innerHTML = `<h1 class="v">Ayuda</h1>
  <h2 class="s">Instalarla en el iPhone</h2><ol class="steps"><li>Abre la dirección de la app en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li>
  <li>Elige <b>Añadir a pantalla de inicio</b> y confirma.</li><li>Ábrela desde su icono con internet <b>una vez</b>: a partir de ahí funciona sin conexión.</li></ol>
  <h2 class="s">Instalar la voz italiana (gratis)</h2><ol class="steps"><li>iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Italiano.</li>
  <li>Descarga una voz (por ejemplo Alice, Federica o Luca). Si aparece una versión <b>Mejorada</b> o <b>Premium</b>, elígela: suena mucho mejor.</li>
  <li>Cierra la app del todo y vuelve a abrirla. Después elige la voz en Ajustes.</li>
  <li>Ordenador: en Windows, Configuración → Hora e idioma → Voz → Agregar voces → Italiano. En Mac, Ajustes del Sistema → Accesibilidad → Contenido leído.</li></ol>
  <p class="muted small">Los menús pueden cambiar un poco según la versión del sistema.</p>
  <h2 class="s">Cómo estudiar con la app</h2><ol class="steps"><li>Abre <b>Hoy</b> cada día y completa las tareas en orden (30–40 minutos).</li>
  <li>En el repaso, valora con sinceridad: así la app te pregunta lo que necesitas.</li><li>Escucha y <b>repite en voz alta</b> cada frase; usa el botón «Despacio» al principio.</li>
  <li>Cuando algo no lo entiendas, búscalo en el <b>Manual</b> (tiene buscador).</li></ol>
  <h2 class="s">Actualizaciones</h2><p>Cuando subas una versión nueva, la app la descargará la próxima vez que la abras con internet y te mostrará un aviso para actualizar. Tu progreso no se pierde.</p>
  <h2 class="s">Tu progreso</h2><p>Se guarda solo en este dispositivo. Haz una copia desde <b>Ajustes → Guardar copia</b> de vez en cuando, y antes de cambiar de teléfono.</p>`;
};

/* ---------------------------------------------------------------- service worker y arranque */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").then(reg => {
    const show = w => { $("#update").hidden = false; $("#doUpdate").onclick = () => w.postMessage("skipWaiting"); };
    if (reg.waiting && navigator.serviceWorker.controller) show(reg.waiting);
    reg.addEventListener("updatefound", () => { const w = reg.installing; w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) show(w); }); });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
document.addEventListener("keydown", ev => {
  if (curView !== "review" || !SESSION || !SESSION.q.length || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (!SESSION.showing && (ev.key === " " || ev.key === "Enter")) { ev.preventDefault(); $("#show")?.click(); }
  else if (SESSION.showing && "1234".includes(ev.key)) $(`[data-g="${+ev.key - 1}"]`)?.click();
});
render();
