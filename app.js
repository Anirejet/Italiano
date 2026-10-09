"use strict";
const APP_VERSION = "1.5";
const DATA = window.DATA;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17V9a3 3 0 0 1 3-3h7M18 7v8a3 3 0 0 1-3 3H8"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  translate: '<path d="M4 5h8M8 3v2M5.5 5c.8 3 3 5.5 5.5 6.5M10.5 5c-.8 3-3 5.5-5.5 6.5"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  chat: '<path d="M4 5h16v10H9l-5 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
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
const DICT = DATA.dict.map((e, i) => ({ i, o: e[4] != null ? e[4] : i, it: e[0], pr: e[1], es: e[2], cat: e[3], id: "w" + hash(e[0] + "|" + e[2]), kIt: variants(e[0], ART_IT), kEs: variants(e[2], ART_ES) }));
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
/* ---- Usuarios (perfiles) de este dispositivo: cada uno tiene su propio progreso y su propia sincronización */
const PROF = (() => { let p = null; try { p = JSON.parse(localStorage.getItem("italiano.profiles")); } catch (e) {} if (!p || !p.list || !p.list.length) p = { list: [{ id: "p1", name: "" }], cur: "p1", ask: false }; if (!p.list.some(x => x.id === p.cur)) p.cur = p.list[0].id; return p; })();
const PID = PROF.cur;
const LS = PID === "p1" ? "italiano.app.v1" : "italiano.app.v1." + PID;
const profName = pr => (pr && pr.name) || ("Usuario " + (PROF.list.indexOf(pr) + 1));
function saveProf() { try { localStorage.setItem("italiano.profiles", JSON.stringify(PROF)); } catch (e) {} }
function switchProfile(id) { PROF.cur = id; saveProf(); try { sessionStorage.setItem("italiano.picked", "1"); } catch (e) {} location.reload(); }
const DEF = { cards: {}, days: {}, quiz: { ok: 0, n: 0 }, newDay: 0, newCount: 0, lastCh: 0, lastChT: 0, lastBackup: 0, plan: { day: 0, verb: 0, read: false, phr: [], unit: false }, route: { best: {}, errs: [], ed: {} },
  fav: {}, notes: {}, pos: {}, qd: {}, conv: {}, resetAt: 0,
  set: { rate: 0.9, newPerDay: 20, dir: "it", auto: true, pron: true, voice: "", theme: "auto", fs: 1 }, upd: 0 };
function fresh() { return JSON.parse(JSON.stringify(DEF)); }
function hydrate(o) {
  o = o || {}; const s = Object.assign(fresh(), o); Object.keys(s).forEach(k => { if (k[0] === "_") delete s[k]; });
  s.set = Object.assign({}, DEF.set, o.set); s.plan = Object.assign({}, DEF.plan, o.plan); s.quiz = Object.assign({}, DEF.quiz, o.quiz);
  s.route = Object.assign({ best: {}, errs: [], ed: {} }, o.route); if (!s.route.ed) s.route.ed = {}; if (!s.route.errs) s.route.errs = [];
  ["fav", "notes", "pos", "qd", "cards", "days", "conv"].forEach(k => { if (!s[k] || typeof s[k] !== "object") s[k] = {}; });
  return s;
}
/* Cada dispositivo tiene un identificador propio (no se sincroniza): sirve para sumar bien los aciertos de varios dispositivos. */
const DEV = (() => { try { let d = localStorage.getItem("italiano.dev"); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem("italiano.dev", d); } return d; } catch (e) { return "x"; } })();
let S = (() => { try { return hydrate(JSON.parse(localStorage.getItem(LS))); } catch (e) { return fresh(); } })();
let onSaved = null;
function save(quiet) {
  S.upd = Date.now(); S.qd[DEV] = { ok: S.quiz.ok, n: S.quiz.n };
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { toast("No se ha podido guardar el progreso."); }
  if (!quiet && onSaved) onSaved();
}
function plan() { const t = today(); if (S.plan.day !== t) S.plan = { day: t, verb: 0, read: false, phr: [], unit: false }; return S.plan; }
function logActivity(n = 1) { const t = today(); S.days[t] = (S.days[t] || 0) + n; }
function quizTotal() { const q = Object.assign({}, S.qd, { [DEV]: S.quiz }); let ok = 0, n = 0; Object.values(q).forEach(x => { ok += x.ok || 0; n += x.n || 0; }); return { ok, n }; }
const isFav = id => (S.fav[id] || 0) > 0;
function toggleFav(id) { S.fav[id] = isFav(id) ? -Date.now() : Date.now(); save(); return isFav(id); }

/* Une dos estados (este dispositivo + copia o nube) sin perder nada: para cada elemento gana el cambio más reciente. */
function merge(a, b) {
  a = hydrate(JSON.parse(JSON.stringify(a))); b = hydrate(JSON.parse(JSON.stringify(b)));
  const reset = Math.max(a.resetAt || 0, b.resetAt || 0);
  const out = hydrate(JSON.parse(JSON.stringify(a))); out.resetAt = reset;
  const after = x => !reset || (x || 0) > reset;
  const cur = src => (src.resetAt || 0) === reset;   /* datos sin fecha: solo de quien ya está después del último «borrar todo» */
  const both = [a, b].filter(cur);
  out.cards = {};
  for (const src of [a, b]) for (const [k, c] of Object.entries(src.cards)) if (after(c.t) && (!out.cards[k] || (c.t || 0) > (out.cards[k].t || 0))) out.cards[k] = c;
  out.days = {};
  for (const src of both) for (const [k, n] of Object.entries(src.days)) out.days[k] = Math.max(out.days[k] || 0, n);
  out.qd = {};
  for (const src of both) for (const [k, q] of Object.entries(src.qd)) if (!out.qd[k] || (q.n || 0) > (out.qd[k].n || 0)) out.qd[k] = q;
  out.quiz = out.qd[DEV] ? { ok: out.qd[DEV].ok, n: out.qd[DEV].n } : { ok: 0, n: 0 };
  for (const key of ["fav"]) { out[key] = {}; for (const src of [a, b]) for (const [k, t] of Object.entries(src[key])) if (after(Math.abs(t)) && Math.abs(t) > Math.abs(out[key][k] || 0)) out[key][k] = t; }
  out.notes = {}; for (const src of [a, b]) for (const [k, n] of Object.entries(src.notes)) if (after(n.t) && (!out.notes[k] || n.t > out.notes[k].t)) out.notes[k] = n;
  out.conv = {}; for (const src of [a, b]) for (const [k, c] of Object.entries(src.conv)) if (after(c.t) && (!out.conv[k] || c.best > out.conv[k].best || (c.best === out.conv[k].best && c.t > out.conv[k].t))) out.conv[k] = c;
  out.pos = {}; for (const src of [a, b]) for (const [k, p] of Object.entries(src.pos)) if (!out.pos[k] || (p.t || 0) > (out.pos[k].t || 0)) out.pos[k] = p;
  const nb = (b.lastChT || 0) > (a.lastChT || 0); out.lastCh = nb ? b.lastCh : a.lastCh; out.lastChT = Math.max(a.lastChT || 0, b.lastChT || 0);
  if (both.length === 1) out.plan = both[0].plan;
  else if (a.plan.day === b.plan.day) out.plan = { day: a.plan.day, verb: Math.max(a.plan.verb, b.plan.verb), read: a.plan.read || b.plan.read, unit: a.plan.unit || b.plan.unit, phr: [...new Set([...a.plan.phr, ...b.plan.phr])] };
  else out.plan = a.plan.day > b.plan.day ? a.plan : b.plan;
  if (a.newDay === b.newDay) out.newCount = Math.max(a.newCount, b.newCount); else { out.newDay = Math.max(a.newDay, b.newDay); out.newCount = a.newDay > b.newDay ? a.newCount : b.newCount; }
  const R = out.route; R.best = {}; R.ed = {}; const errs = {};
  for (const src of [a, b]) {
    if (cur(src)) for (const [k, v] of Object.entries(src.route.best)) R.best[k] = Math.max(R.best[k] || 0, v);
    for (const [k, t] of Object.entries(src.route.ed)) R.ed[k] = Math.max(R.ed[k] || 0, t);
    for (const e of src.route.errs) { const k = e.u + "|" + e.x; if (!errs[k] || (e.t || 0) > (errs[k].t || 0)) errs[k] = e; }
  }
  R.errs = Object.values(errs).filter(e => after(e.t || 1) && (e.t || 1) > (R.ed[e.u + "|" + e.x] || 0));
  out.lastBackup = Math.max(a.lastBackup || 0, b.lastBackup || 0);
  out.set = a.set; out.upd = Math.max(a.upd || 0, b.upd || 0);
  return out;
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
function applyTheme() {
  if (S.set.theme === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", S.set.theme);
  document.body.classList.toggle("hide-pr", !S.set.pron);
  const px = Math.round(17 * (S.set.fs || 1)) + "px"; document.documentElement.style.fontSize = px; document.body.style.fontSize = px;
}

/* ---------------------------------------------------------------- voz */
let VOICES = [];
const vScore = v => (/premium/i.test(v.name + v.voiceURI) ? 6 : 0) + (/(enhanced|mejorada|natural|neural)/i.test(v.name + v.voiceURI) ? 5 : 0) + (/google/i.test(v.name) ? 3 : 0)
  + (/it[-_]it/i.test(v.lang) ? 1 : 0) + (v.localService ? 1 : 0) - (/(eloquence|compact|grandpa|grandma|rocko|shelley|flo|reed|sandy|eddy)/i.test(v.name + v.voiceURI) ? 3 : 0);
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  VOICES = speechSynthesis.getVoices().filter(v => /^it([-_]|$)/i.test(v.lang)).sort((a, b) => vScore(b) - vScore(a));
}
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = () => { loadVoices(); if (curView === "settings" || curView === "voices") { const y = window.scrollY; render(); window.scrollTo(0, y); } }; }
function cleanSpeak(t) { return String(t).split(" + ")[0].replace(/\([^)]*\)/g, " ").replace(/\bil\/la\b/g, "il").replace(/\s*\/\s*/g, ", ").replace(/[«»"…]/g, " ").replace(/\s+/g, " ").trim(); }
/* Lectura en voz alta más estable: frases troceadas (Chrome corta las largas), pausa breve tras cancelar (Safari se come
   el principio), punto final (algunas voces cortan la última sílaba), referencias guardadas y un reintento si falla. */
let SPQ = [], SPGEN = 0;
function chunks(t) {
  const out = []; let cur = "";
  t.split(/(?<=[.!?;:])\s+|(?<=,)\s+(?=\S{2,})/).forEach(part => {
    if ((cur + " " + part).trim().length > 160 && cur) { out.push(cur.trim()); cur = part; } else cur = (cur + " " + part).trim();
  });
  if (cur) out.push(cur.trim());
  return out.map(c => /[.!?…;:,]$/.test(c) ? c : c + ".");
}
function curVoice() { return VOICES.find(x => x.voiceURI === S.set.voice) || VOICES[0]; }
function speak(text, rate, voice) {
  if (!("speechSynthesis" in window)) { toast("Este navegador no puede leer en voz alta."); return; }
  if (!VOICES.length) loadVoices();
  const gen = ++SPGEN; const ss = speechSynthesis;
  const parts = chunks(cleanSpeak(text)); if (!parts.length) return;
  const v = voice || curVoice();
  if (!v && !speak.warned) { speak.warned = true; toast("No hay voz italiana instalada: mira Ajustes → Voces."); }
  const was = ss.speaking || ss.pending; ss.cancel();
  const say = (k, retry) => {
    if (gen !== SPGEN || k >= parts.length) return;
    const u = new SpeechSynthesisUtterance(parts[k]); u.lang = (v && v.lang) || "it-IT"; u.rate = rate || S.set.rate; if (v) u.voice = v;
    SPQ = [u];
    u.onend = () => say(k + 1);
    u.onerror = e => { if (e.error === "interrupted" || e.error === "canceled") return; if (!retry) setTimeout(() => say(k, true), 120); else say(k + 1); };
    if (ss.paused) ss.resume();
    ss.speak(u);
  };
  if (was) setTimeout(() => say(0), 120); else say(0);   /* sin espera si no sonaba nada: el iPhone exige empezar dentro del toque */
}
function stopSpeak() { SPGEN++; if ("speechSynthesis" in window) speechSynthesis.cancel(); }
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
const deckOf = id => (id[0] === "f" || id[0] === "u") ? "f" : "w";
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
const NAV = [["home", "Hoy", "home"], ["route", "Ruta por niveles", "route"], ["dict", "Buscar", "search"], ["review", "Repasar", "cards"], ["practice", "Practicar", "practice"],
  ["talk", "Conversar", "mic"], ["translate", "Traducir", "translate"], ["saved", "Guardadas", "star"],
  ["verbs", "Verbos", "verbs"], ["travel", "Viaje", "plane"], ["manual", "Manual", "book"], ["progress", "Progreso", "chart"],
  ["settings", "Ajustes", "gear"], ["help", "Ayuda", "help"]];
const BOTTOM = [["home", "Hoy", "home"], ["route", "Ruta", "route"], ["dict", "Buscar", "search"], ["review", "Repasar", "cards"], ["more", "Más", "more"]];
let curView = "home", params = {};
const ALIAS = { unit: "route", uex: "route", uerr: "route", uresult: "route", drill: "home", conv: "talk", aitalk: "talk", voices: "settings" };
const TITLES = Object.fromEntries(NAV.map(([k, l]) => [k, l]));
Object.assign(TITLES, { more: "Más", unit: "Unidad", uex: "Ejercicios", uerr: "Mis errores", drill: "Verbo del día", translate: "Traducir", saved: "Guardadas", talk: "Conversar", conv: "Conversación", aitalk: "Conversar con IA", voices: "Voces" });
function nav() {
  const cv = ALIAS[curView] || curView;
  const cur = k => (cv === k || (k === "more" && !BOTTOM.some(b => b[0] === cv))) ? 'aria-current="page"' : "";
  $("#navSide").innerHTML = NAV.map(([k, l, ic]) => `<button class="navbtn" data-go="${k}" ${cv === k ? 'aria-current="page"' : ""}>${svg(ic)}${l}</button>`).join("");
  $("#navBottom").innerHTML = BOTTOM.map(([k, l, ic]) => `<button class="navbtn" data-go="${k}" ${cur(k)}>${svg(ic)}${l}</button>`).join("");
  drawTop();
}
/* ---- historial: «Atrás» devuelve a la pantalla anterior en el mismo punto (también el botón/gesto atrás del sistema) */
const HIST = []; let RENDERING = false, RESTORE = false;
const snap = () => ({ v: curView, p: JSON.parse(JSON.stringify(params || {})), y: window.scrollY });
function pushHist() {
  const top = HIST[HIST.length - 1]; const s = snap();
  if (top && top.v === s.v && JSON.stringify(top.p) === JSON.stringify(s.p)) { top.y = s.y; return; }
  HIST.push(s); if (HIST.length > 60) HIST.shift();
  try { history.pushState({ n: HIST.length }, ""); } catch (e) {}
}
document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { e.preventDefault(); go(b.dataset.go, b.dataset.p ? JSON.parse(b.dataset.p) : {}); } });
function go(v, p = {}, opt = {}) {
  stopSpeak();
  if (typeof stopListening === "function") stopListening();
  if (!RENDERING && !opt.replace && !(v === curView && JSON.stringify(p) === JSON.stringify(params))) pushHist();
  curView = v; params = p; render(); window.scrollTo(0, opt.y || 0);
}
function back() {
  if (!HIST.length) { if (curView !== "home") { curView = "home"; params = {}; render(); window.scrollTo(0, 0); } return; }
  const h = HIST.pop(); stopSpeak();
  curView = h.v; params = h.p; RESTORE = true; try { render(); } finally { RESTORE = false; }
  const y = h.y; window.scrollTo(0, y); requestAnimationFrame(() => window.scrollTo(0, y)); setTimeout(() => window.scrollTo(0, y), 60);
}
let popSkip = 0;
window.addEventListener("popstate", () => { if (popSkip) { popSkip--; return; } if (closeOverlay()) { try { history.pushState({ n: HIST.length }, ""); } catch (e) {} return; } back(); });
function goBack() { if (HIST.length) { try { history.back(); return; } catch (e) {} } back(); }
/* gesto: deslizar desde el borde izquierdo hacia la derecha = atrás (en la app instalada del iPhone no hay botón del navegador) */
(() => { let x0 = null, y0 = 0;
  document.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX < 22 ? t.clientX : null; y0 = t.clientY; }, { passive: true });
  document.addEventListener("touchend", e => { if (x0 == null) return; const t = e.changedTouches[0]; if (t.clientX - x0 > 70 && Math.abs(t.clientY - y0) < 60 && !$(".ovl")) goBack(); x0 = null; }, { passive: true });
})();
function drawTop() {
  const el = $("#topbar"); if (!el) return;
  const prev = HIST[HIST.length - 1];
  const label = prev ? (prev.v === "manual" && prev.p.c != null ? "Manual" : prev.v === "verbs" && prev.p.v != null ? VERBS[prev.p.v].inf : TITLES[prev.v] || "Atrás") : "";
  el.innerHTML = `${prev ? `<button class="tb-back" id="tbBack" aria-label="Volver a ${esc(label)}">‹ ${esc(label)}</button>` : `<span class="tb-title">${esc(TITLES[ALIAS[curView] || curView] || "")}</span>`}
  <span class="tb-sp"></span><span id="syncDot"></span>
  <button class="tb-ic" id="tbTr" aria-label="Traducir frases">${svg("translate")}</button>
  <button class="tb-ic" id="tbSearch" aria-label="Buscar una palabra sin salir de aquí">${svg("search")}</button>`;
  if (prev) $("#tbBack").onclick = goBack;
  $("#tbSearch").onclick = () => openQuick("");
  $("#tbTr").onclick = () => go("translate");
  if (typeof drawSyncDot === "function") drawSyncDot();
}
function render() { RENDERING = true; try { if (typeof refreshNotes === "function") refreshNotes(); nav(); applyTheme(); hideSelBtn(); VIEWS[curView](); } finally { RENDERING = false; } }
const VIEWS = {};
const favBtn = id => `<button class="favb" data-fav="${id}" aria-pressed="${isFav(id)}" aria-label="${isFav(id) ? "Quitar de guardadas" : "Guardar"}">${svg("star")}</button>`;
document.addEventListener("click", e => { const b = e.target.closest("[data-fav]"); if (!b) return; const on = toggleFav(b.dataset.fav); document.querySelectorAll(`[data-fav="${b.dataset.fav}"]`).forEach(x => { x.setAttribute("aria-pressed", on); x.setAttribute("aria-label", on ? "Quitar de guardadas" : "Guardar"); }); toast(on ? "Guardada en «Guardadas»." : "Quitada de «Guardadas»."); });
const entryHTML = (e, opts = {}) => `<div class="entry speakable">${opts.phr ? `<button class="say" data-say="${esc(e.it)}" data-phr="${e.id}" aria-label="Escuchar">${svg("speaker")}</button>` : sayBtn(e.it)}
  <div class="grow"><div class="hw"><span class="it">${esc(e.it)}</span></div><div class="pr">[${esc(e.pr)}]</div><div class="tr">${esc(e.es)}</div>
  ${opts.meta === false ? "" : `<div class="meta">${esc(e.cat || e.g || "")}${S.cards[e.id] ? " · en repaso" : ""}</div>`}
  ${opts.slow ? `<div style="margin-top:6px"><button class="btn small" style="padding:4px 10px" data-say="${esc(e.it)}" data-slow="1" ${opts.phr ? `data-phr="${e.id}"` : ""}>Despacio</button></div>` : ""}</div>${e.id && opts.fav !== false ? favBtn(e.id) : ""}</div>`;

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
  const vd = verbOfDay(); const vgoal = Math.min(6, vd.v.T[vd.tense].filter(Boolean).length); const ch = DATA.ch[Math.min(S.lastCh, DATA.ch.length - 1)];
  const tasks = [
    [reviewDone, "1 · Repaso de vocabulario", dueW + dueF ? `${dueW + dueF} tarjetas pendientes y ${nw} palabras nuevas disponibles.` : nw ? `${nw} palabras nuevas para hoy.` : "Todo repasado por hoy.", "review", "Empezar"],
    [heard >= 5, "2 · Frases para el viaje", `5 frases del día · escuchadas ${heard} de 5. Repítelas en voz alta.`, "travel", "Escuchar", { today: 1 }],
    [p.verb >= vgoal, `3 · Verbo del día: ${vd.v.inf}`, `${vd.tense} · ${p.verb >= vgoal ? "hecho" : "escribe sus formas (aciertos: " + p.verb + " de " + vgoal + ")"}.`, "drill", "Practicar", { vi: vd.vi, t: vd.tense }],
    [p.read, "4 · Lectura del manual", `${ch.title}. Lee un apartado y escucha los ejemplos.`, "manual", "Leer", { c: Math.min(S.lastCh, DATA.ch.length - 1) }],
  ];
  const nu = typeof nextUnitIndex === "function" ? nextUnitIndex() : -1;
  if (nu >= 0) tasks.splice(0, 0, [!!p.unit, `1 · Ruta: unidad ${nu + 1}`, `${UNITS[nu].t}. Explicación, ejemplos y ejercicios.`, "unit", "Empezar", { u: nu }]);
  tasks.forEach((t, k) => { t[1] = t[1].replace(/^\d+ · /, (k + 1) + " · "); });
  const doneN = tasks.filter(x => x[0]).length;
  const w = DICT[(today() * 7919) % DICT.length];
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent); const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  const needBackup = Object.keys(S.cards).length >= 30 && Date.now() - (S.lastBackup || 0) > 14 * 864e5;
  $("#view").innerHTML = `<h1 class="v">${hi}${PROF.list.length > 1 || PROF.list[0].name ? ", " + esc(profName(PROF.list.find(x => x.id === PID))) : ""}!</h1>
  ${PROF.list.length > 1 ? `<p class="muted small" style="margin:-6px 0 8px">${svg("user")} <button class="linkb" id="chgUser">Cambiar de usuario</button></p>` : ""}<p class="sub">Tu plan de hoy (30–40 minutos) · ${doneN} de ${tasks.length} completados · racha: ${streak()} día${streak() === 1 ? "" : "s"}</p>
  ${ios && !standalone ? `<p class="note">Para usarla como app y sin internet: pulsa <b>Compartir</b> en Safari y elige <b>Añadir a pantalla de inicio</b>. Más detalles en Ayuda.</p>` : ""}
  ${needBackup ? `<p class="note">Hace tiempo que no guardas una copia de tu progreso. <button class="btn" style="padding:4px 10px" data-go="settings">Hacer copia</button></p>` : ""}
  <div class="list" style="padding:0">${tasks.map(([d, t, desc, view, label, pp]) => `<div class="task ${d ? "done" : ""}"><div class="ck">${d ? "✓" : ""}</div>
    <div class="grow"><div class="t">${esc(t)}</div><div class="muted small">${esc(desc)}</div></div>
    <button class="btn ${d ? "" : "pri"}" data-go="${view}" ${pp ? `data-p='${JSON.stringify(pp)}'` : ""}>${d ? "Repetir" : label}</button></div>`).join("")}
</div>
  <h2 class="s">Palabra del día</h2>
  <div class="hero speakable"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">${sayBtn(w.it)}<div>
  <div class="word"><span class="it">${esc(w.it)}</span></div><div class="pr" style="font-size:1rem">[${esc(w.pr)}]</div>
  <div style="font-size:1.15rem;margin-top:6px">${esc(w.es)}</div><div class="muted small" style="margin-top:4px">${esc(w.cat)}</div></div></div></div>`;
  const cu = $("#chgUser"); if (cu) cu.onclick = () => showPicker(true);
};

/* ---------------------------------------------------------------- MÁS */
VIEWS.more = () => {
  $("#view").innerHTML = `<h1 class="v">Más</h1><div class="list menu" style="padding:0 14px">
  ${[["talk", "Conversar", "Habla en voz alta en situaciones reales y la app te entiende; y conversación libre con IA", "mic"], ["translate", "Traducir frases", "Frases enteras español ↔ italiano, con audio y análisis palabra por palabra", "translate"], ["saved", "Guardadas y mis frases", "Tus palabras con estrella y las frases que has guardado", "star"],
     ["verbs", "Verbos", "114 verbos conjugados con audio y práctica", "verbs"], ["practice", "Practicar", "Test, escritura, dictado, conjugación y autoevaluación", "practice"], ["travel", "Viaje y frases útiles", "Frases por situaciones con audio", "plane"],
     ["manual", "Manual", "Toda la gramática, con buscador", "book"], ["progress", "Progreso", "Estadísticas y copia de seguridad", "chart"],
     ["settings", "Ajustes, voz y sincronización", "Voz, tamaño de letra, sincronizar ordenador y móvil", "gear"], ["help", "Ayuda", "Instalar, usar sin conexión, copias", "help"]]
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
  q.addEventListener("input", () => { params.cat = null; clearTimeout(tmr); tmr = setTimeout(() => { run(); addRecent(q.value); }, 120); });
  $("#view").querySelectorAll("[data-dir]").forEach(b => b.onclick = () => { params.dir = b.dataset.dir; VIEWS.dict(); });
  run();
};
function drawResults(qs, dir, r) {
  r = r || $("#res"); const res = search(qs, dir);
  if (!res) {
    r.innerHTML = `<h2 class="s">Explorar por temas</h2><div class="chips">${CATS.map(c => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    r.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { if (r.id === "res") params.cat = b.dataset.cat; drawCat(b.dataset.cat, dir, r); });
    if (r.id === "res" && params.cat) drawCat(params.cat, dir, r);
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
  if (norm(qs).split(" ").length >= 3) h += `<p style="margin-top:12px"><button class="btn" data-go="translate" data-p='${esc(JSON.stringify({ t: qs.trim() }))}'>${svg("translate")} Traducir la frase entera</button></p>`;
  r.innerHTML = h;
}
function drawCat(cat, dir, r) {
  r.innerHTML = `<button class="back" id="bk">← Temas</button><h2 class="s">${esc(cat)} <span class="muted small">(${DICT.filter(e => e.cat === cat).length})</span></h2><div class="list">${DICT.filter(e => e.cat === cat).map(e => entryHTML(e)).join("")}</div>`;
  r.querySelector("#bk").onclick = () => { if (r.id === "res") params.cat = null; drawResults("", dir, r); };
}

/* ---------------------------------------------------------------- CONSULTA RÁPIDA (lupa) */
/* Se abre encima de la pantalla actual: al cerrarla sigues exactamente donde estabas. */
let RECENT = (() => { try { return JSON.parse(localStorage.getItem("italiano.recent." + PID)) || []; } catch (e) { return []; } })();
let recentTmr;
function addRecent(q) {
  clearTimeout(recentTmr);
  recentTmr = setTimeout(() => { q = String(q || "").trim(); if (q.length < 2) return; RECENT = [q, ...RECENT.filter(x => norm(x) !== norm(q) && !norm(q).startsWith(norm(x)))].slice(0, 12); try { localStorage.setItem("italiano.recent." + PID, JSON.stringify(RECENT)); } catch (e) {} }, 1500);
}
let OVL_Y = 0;
function closeOverlay() { const o = $(".ovl"); if (!o) return false; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); o.remove(); document.body.classList.remove("noscroll"); window.scrollTo(0, OVL_Y); requestAnimationFrame(() => window.scrollTo(0, OVL_Y)); stopSpeak(); return true; }
function openQuick(text) {
  closeOverlay(); hideSelBtn();
  const o = document.createElement("div"); o.className = "ovl"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Buscar palabra");
  o.innerHTML = `<div class="ovl-box"><div class="row" style="flex-wrap:nowrap;gap:8px"><input type="search" id="qq" placeholder="Palabra en italiano o en español…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Buscar palabra" value="${esc(text)}">
  <button class="btn" id="qclose" aria-label="Cerrar y volver">Cerrar</button></div>
  <div class="muted small" style="margin:6px 2px 0">Al cerrar vuelves al mismo sitio en el que estabas.</div>
  <div id="qres" style="margin-top:10px"></div></div>`;
  OVL_Y = window.scrollY; document.body.appendChild(o); document.body.classList.add("noscroll");
  const q = $("#qq"), r = $("#qres"); let tmr;
  const run = () => {
    if (!norm(q.value)) { r.innerHTML = RECENT.length ? `<h2 class="s" style="margin-top:6px">Búsquedas recientes</h2><div class="chips">${RECENT.map(x => `<button class="chip" data-rq="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : `<p class="muted">Escribe una palabra. También reconoce formas verbales («vado», «feci»…).</p>`;
      r.querySelectorAll("[data-rq]").forEach(b => b.onclick = () => { q.value = b.dataset.rq; run(); }); return; }
    drawResults(q.value, "both", r); addRecent(q.value);
  };
  q.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(run, 120); });
  q.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(); });
  $("#qclose").onclick = closeOverlay;
  o.addEventListener("click", e => { if (e.target === o) closeOverlay(); if (e.target.closest("[data-go]")) closeOverlay(); });
  run(); setTimeout(() => { q.focus({ preventScroll: true }); if (text) q.select(); }, 30);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openQuick(""); } });

/* Seleccionar texto (mantener pulsado en el iPhone) muestra «Buscar» y «Traducir» con lo seleccionado. */
let selTmr;
function hideSelBtn() { const b = $("#selbtn"); if (b) b.remove(); }
document.addEventListener("selectionchange", () => {
  clearTimeout(selTmr);
  selTmr = setTimeout(() => {
    const sel = window.getSelection(); const t = sel ? String(sel).trim() : "";
    const inView = sel && sel.anchorNode && $("#view").contains(sel.anchorNode) && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
    if (!t || t.length > 300 || !inView) { hideSelBtn(); return; }
    let b = $("#selbtn"); if (!b) { b = document.createElement("div"); b.id = "selbtn"; b.className = "selbtn"; document.body.appendChild(b); }
    const short = t.length > 28 ? t.slice(0, 26) + "…" : t;
    b.innerHTML = `<button class="btn pri" id="selq">${svg("search")} Buscar «${esc(short)}»</button>${t.split(/\s+/).length > 1 ? `<button class="btn" id="selt">${svg("translate")} Traducir</button>` : ""}<button class="btn" id="sels" aria-label="Escuchar">${svg("speaker")}</button>`;
    $("#selq").onclick = () => openQuick(t);
    if ($("#selt")) $("#selt").onclick = () => { hideSelBtn(); go("translate", { t }); };
    $("#sels").onclick = () => speak(t);
  }, 350);
});

/* Barra de acentos debajo de los campos de texto: à è é ì ò ù sin buscar en el teclado. */
const ACC_KEYS = ["à", "è", "é", "ì", "ò", "ù", "'"];
document.addEventListener("focusin", e => {
  const el = e.target;
  if (!el.matches || !el.matches("input[type=text], textarea") || el.dataset.noacc != null) return;
  if (el.nextElementSibling && el.nextElementSibling.classList.contains("accbar")) return;
  const bar = document.createElement("div"); bar.className = "accbar"; bar.setAttribute("aria-label", "Letras con acento");
  bar.innerHTML = ACC_KEYS.map(k => `<button type="button" tabindex="-1" data-acc="${k}">${k}</button>`).join("");
  bar.addEventListener("pointerdown", ev => ev.preventDefault());
  bar.addEventListener("mousedown", ev => ev.preventDefault());
  bar.addEventListener("click", ev => {
    const k = ev.target.closest("[data-acc]"); if (!k) return; ev.preventDefault();
    const st = el.selectionStart != null ? el.selectionStart : el.value.length, en = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    el.value = el.value.slice(0, st) + k.dataset.acc + el.value.slice(en); el.focus();
    try { el.setSelectionRange(st + 1, st + 1); } catch (e2) {}
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  el.insertAdjacentElement("afterend", bar);
});

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
  if (curView !== "practice") { pushHist(); curView = "practice"; }
  nav(); drawPractice(); window.scrollTo(0, 0);
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
  $("#pquit").onclick = () => { PQ = null; if (HIST.length && params.from) goBack(); else go("practice", {}, { replace: true }); };
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
VIEWS.drill = () => { curView = "practice"; params.from = "home"; startPractice("conj", "", { vi: params.vi, t: params.t, daily: true }); };

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
/* Posición de lectura: se guarda el bloque del capítulo que está arriba de la pantalla (vale para cualquier tamaño de pantalla y se sincroniza). */
let posTmr = null;
function manualBlocks() { const m = $("#view .manual"); return m ? [...m.children] : []; }
function trackReading(c) {
  const onScroll = () => {
    if (curView !== "manual" || params.c !== c) { window.removeEventListener("scroll", onScroll); return; }
    clearTimeout(posTmr);
    posTmr = setTimeout(() => {
      if (curView !== "manual" || params.c !== c || RESTORE) return;
      const bl = manualBlocks(); if (!bl.length) return; const top = 70; let k = 0;
      for (let i = 0; i < bl.length; i++) { if (bl[i].getBoundingClientRect().bottom > top) { k = i; break; } }
      const old = S.pos[c]; if (!old || old.b !== k) { S.pos[c] = { b: k, n: bl.length, t: Date.now() }; save(); }
      const pb = $("#rprog"); if (pb) pb.style.width = Math.round(100 * Math.min(1, (window.scrollY + innerHeight) / document.documentElement.scrollHeight)) + "%";
    }, 400);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}
function scrollToBlock(k, smooth) { const el = manualBlocks()[k]; if (!el) return; const y = el.getBoundingClientRect().top + window.scrollY - 64; window.scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" }); }
function highlight(root, q) {
  const nq = norm(q); if (nq.length < 3) return [];
  const marks = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    const t = n.nodeValue; const nt = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nt.length !== t.length) continue;
    const ql = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); if (!ql) continue;
    let i = nt.indexOf(ql); if (i < 0) continue;
    const frag = document.createDocumentFragment(); let last = 0;
    while (i >= 0) { frag.appendChild(document.createTextNode(t.slice(last, i))); const m = document.createElement("mark"); m.textContent = t.slice(i, i + ql.length); frag.appendChild(m); marks.push(m); last = i + ql.length; i = nt.indexOf(ql, last); }
    frag.appendChild(document.createTextNode(t.slice(last))); n.parentNode.replaceChild(frag, n);
  }
  return marks;
}
VIEWS.manual = () => {
  if (params.c != null) {
    const ci = params.c; const c = DATA.ch[ci]; S.lastCh = ci; S.lastChT = Date.now(); plan().read = true; logActivity(); save();
    $("#view").innerHTML = `<div class="rprog"><i id="rprog"></i></div><button class="back" data-go="manual">← Índice del manual</button><h1 class="v">${esc(c.title)}</h1>
    <p class="muted small">Toca cualquier palabra en verde para oírla. Mantén pulsada cualquier palabra para buscarla o traducirla sin perder el sitio.</p>
    <details class="toc"><summary>Apartados de este capítulo</summary><div class="list" id="toc"></div></details>
    <div class="manual">${c.html}</div>
    <div class="row" style="justify-content:space-between;margin-top:30px">${ci > 0 ? `<button class="btn" data-go="manual" data-p='{"c":${ci - 1}}'>← Anterior</button>` : "<span></span>"}
    ${ci < DATA.ch.length - 1 ? `<button class="btn pri" data-go="manual" data-p='{"c":${ci + 1}}'>Siguiente →</button>` : ""}</div>`;
    const bl = manualBlocks(); const heads = bl.map((el, k) => [el, k]).filter(([el]) => /^H[34]$/.test(el.tagName));
    $("#toc").innerHTML = heads.length ? heads.map(([el, k]) => `<button class="tocb ${el.tagName === "H4" ? "sub" : ""}" data-blk="${k}">${esc(el.textContent)}</button>`).join("") : `<p class="muted small">Este capítulo no tiene apartados.</p>`;
    $("#toc").querySelectorAll("[data-blk]").forEach(b => b.onclick = () => { $("details.toc").open = false; scrollToBlock(+b.dataset.blk, true); });
    if (params.hl) {
      const marks = highlight($("#view .manual"), params.hl);
      if (marks.length) {
        let k = 0; const bar = document.createElement("div"); bar.className = "hlbar";
        const show = () => { marks.forEach(m => m.classList.remove("cur")); marks[k].classList.add("cur"); const y = marks[k].getBoundingClientRect().top + window.scrollY - innerHeight / 3; window.scrollTo({ top: Math.max(0, y) }); bar.querySelector("span").textContent = `«${params.hl}» ${k + 1} de ${marks.length}`; };
        bar.innerHTML = `<span></span><button class="btn small" data-h="-1" aria-label="Anterior">▲</button><button class="btn small" data-h="1" aria-label="Siguiente">▼</button><button class="btn small" data-h="0" aria-label="Quitar resaltado">✕</button>`;
        bar.addEventListener("click", e => { const h = e.target.closest("[data-h]"); if (!h) return; const d = +h.dataset.h; if (!d) { marks.forEach(m => m.replaceWith(document.createTextNode(m.textContent))); bar.remove(); delete params.hl; return; } k = (k + d + marks.length) % marks.length; show(); });
        $("#view").appendChild(bar);
        if (RESTORE) { marks[0].classList.add("cur"); bar.querySelector("span").textContent = `«${params.hl}» · ${marks.length}`; } else setTimeout(show, 30);
      }
    } else if (!RESTORE && params.top == null && S.pos[ci] && S.pos[ci].b > 2) {
      const k = S.pos[ci].b; setTimeout(() => { if (window.scrollY < 50) { scrollToBlock(k); toast("Sigues donde lo dejaste."); } }, 30);
    }
    delete params.top;
    trackReading(ci);
    return;
  }
  const lc = Math.min(S.lastCh, DATA.ch.length - 1);
  $("#view").innerHTML = `<h1 class="v">Manual</h1><p class="sub">El manual completo, con tablas y esquemas.</p>
  ${S.lastChT ? `<p><button class="btn pri" data-go="manual" data-p='{"c":${lc}}'>Seguir leyendo: ${esc(DATA.ch[lc].title)}</button></p>` : ""}
  <input type="search" id="mq" placeholder="Buscar en el manual (congiuntivo, ci, preposiciones…)" aria-label="Buscar en el manual" autocomplete="off" autocorrect="off" value="${esc(params.mq || "")}">
  <div id="mres"></div><div class="list chlist" style="margin-top:14px">${DATA.ch.map((c, i) => { const p = S.pos[i]; const pct = p && p.n ? Math.round(100 * (p.b + 1) / p.n) : 0;
    return `<button data-go="manual" data-p='{"c":${i}}'>${i === lc && S.lastChT ? "▸ " : ""}${esc(c.title)}${pct > 5 ? ` <span class="muted small">· leído ${pct}%</span>` : ""}</button>`; }).join("")}</div>`;
  let TXT = null;
  const runQ = () => {
    const v = $("#mq").value; params.mq = v;
    TXT = TXT || DATA.ch.map(c => norm(c.html.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " ")));
    const q = norm(v); const r = $("#mres");
    if (q.length < 3) { r.innerHTML = ""; return; }
    const hits = TXT.map((t, i) => [i, t.split(q).length - 1]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    r.innerHTML = hits.length ? `<p class="muted" style="margin-top:12px">Aparece en (toca para ir a la primera coincidencia):</p><div class="chips">${hits.slice(0, 10).map(([i, n]) => `<button class="chip" data-go="manual" data-p='${esc(JSON.stringify({ c: i, hl: v.trim() }))}'>${esc(DATA.ch[i].title)} (${n})</button>`).join("")}</div>` : `<p class="muted" style="margin-top:12px">No aparece en el manual.</p>`;
  };
  $("#mq").addEventListener("input", runQ); if (params.mq) runQ();
};

/* ---------------------------------------------------------------- PROGRESO */
VIEWS.progress = () => {
  const ids = Object.keys(S.cards); const t = today();
  const lv = [0, 0, 0]; ids.forEach(id => lv[S.cards[id].b >= 4 ? 2 : S.cards[id].b >= 2 ? 1 : 0]++);
  const days = []; for (let d = t - 27; d <= t; d++) days.push(S.days[d] || 0); const mx = Math.max(1, ...days);
  const qt = quizTotal(); const acc = qt.n ? Math.round(100 * qt.ok / qt.n) : null;
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
    VOICES.length ? `<p class="muted small">Voz en uso: <b>${esc(curVoice().name)}</b>. Hay ${VOICES.length} voz${VOICES.length > 1 ? "es" : ""} italiana${VOICES.length > 1 ? "s" : ""} en este dispositivo.</p><div class="row"><button class="btn pri" data-go="voices">Elegir y probar voces</button><button class="btn" data-say="Buongiorno! Vorrei un caffè, per favore.">Probar</button></div>`
    : `<p class="note err">No se ha encontrado ninguna voz italiana en este dispositivo. <button class="linkb" data-go="voices">Cómo instalarla</button></p>`}
  <h2 class="s">Velocidad de lectura</h2><div class="row"><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${S.set.rate}" aria-label="Velocidad" style="flex:1"><span id="rv">${S.set.rate}</span></div>
  <h2 class="s">Estudio</h2><div class="kv">
  <label for="npd">Tarjetas nuevas al día</label><select id="npd">${[10, 15, 20, 25, 30, 40, 50].map(n => `<option ${n === S.set.newPerDay ? "selected" : ""}>${n}</option>`).join("")}</select>
  <label for="auto">Leer en voz alta automáticamente</label><input type="checkbox" id="auto" ${S.set.auto ? "checked" : ""} style="width:24px;height:24px">
  <label for="pron">Mostrar la pronunciación figurada</label><input type="checkbox" id="pron" ${S.set.pron ? "checked" : ""} style="width:24px;height:24px">
  <label for="fs">Tamaño de la letra</label><select id="fs">${[[0.9, "Pequeña"], [1, "Normal"], [1.12, "Grande"], [1.25, "Muy grande"]].map(([k, l]) => `<option value="${k}" ${(S.set.fs || 1) === k ? "selected" : ""}>${l}</option>`).join("")}</select>
  <label for="theme">Aspecto</label><select id="theme">${[["auto", "Como el teléfono"], ["light", "Claro"], ["dark", "Oscuro"]].map(([k, l]) => `<option value="${k}" ${S.set.theme === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
  ${typeof profilesHTML === "function" ? profilesHTML() : ""}
  ${typeof syncSettingsHTML === "function" ? syncSettingsHTML() : ""}
  <h2 class="s">Copia de seguridad</h2>
  <p class="muted small">Además de la sincronización, puedes guardar una copia en un archivo (por ejemplo en Archivos o iCloud Drive) y recuperarla cuando quieras: se une con lo que ya tengas, no lo borra.${S.lastBackup ? " Última copia: " + new Date(S.lastBackup).toLocaleDateString("es-ES") + "." : ""}</p>
  <div class="row"><button class="btn pri" id="exp">Guardar copia</button><button class="btn" id="imp">Recuperar copia</button><input type="file" id="impf" accept="application/json,.json" hidden></div>
  <h2 class="s">Zona de peligro</h2><button class="btn" id="reset" style="color:var(--rosso)">Borrar todo el progreso</button>
  <p class="muted small" style="margin-top:26px">Versión ${APP_VERSION}. La voz la genera tu propio dispositivo: es gratuita y funciona sin internet si está descargada, pero no es la grabación de un hablante nativo. La pronunciación figurada es una aproximación para hispanohablantes.</p>`;
  $("#rate").oninput = e => { S.set.rate = +e.target.value; $("#rv").textContent = S.set.rate; save(); };
  $("#npd").onchange = e => { S.set.newPerDay = +e.target.value; save(); };
  $("#auto").onchange = e => { S.set.auto = e.target.checked; save(); };
  $("#pron").onchange = e => { S.set.pron = e.target.checked; save(); applyTheme(); };
  $("#theme").onchange = e => { S.set.theme = e.target.value; save(); applyTheme(); };
  $("#fs").onchange = e => { S.set.fs = +e.target.value; save(); applyTheme(); };
  if (typeof bindSyncSettings === "function") bindSyncSettings();
  if (typeof bindProfiles === "function") bindProfiles();
  $("#exp").onclick = exportBackup;
  $("#imp").onclick = () => $("#impf").click();
  $("#impf").onchange = e => { if (e.target.files[0]) importBackup(e.target.files[0]); };
  $("#reset").onclick = () => { if (confirm("¿Borrar todo tu progreso? No se puede deshacer.")) { const set = S.set; S = fresh(); S.set = set; S.resetAt = Date.now(); save(); toast("Progreso borrado."); render(); } };
};

/* ---------------------------------------------------------------- AYUDA */
VIEWS.help = () => {
  $("#view").innerHTML = `<h1 class="v">Ayuda</h1>
  <h2 class="s">Moverte por la app sin perder el sitio</h2><ul class="steps">
  <li><b>‹ Atrás</b> (arriba a la izquierda) te devuelve a la pantalla anterior, en el mismo punto en que estabas. En el iPhone también puedes deslizar el dedo desde el borde izquierdo hacia la derecha.</li>
  <li><b>Lupa</b> (arriba a la derecha): busca una palabra encima de lo que estás haciendo; al cerrarla sigues exactamente donde estabas. En el ordenador también se abre con Ctrl+K.</li>
  <li><b>Mantén pulsada una palabra</b> del manual o de cualquier texto: aparece «Buscar» y «Traducir» con lo que hayas seleccionado.</li>
  <li>El manual recuerda <b>por dónde ibas</b> en cada capítulo (también en el otro dispositivo si sincronizas). Cada capítulo tiene la lista de sus apartados.</li>
  <li>Debajo de los cuadros de texto tienes una <b>barra con à è é ì ò ù</b>.</li>
  <li>La <b>estrella</b> guarda palabras y frases en «Guardadas», donde también puedes apuntar tus propias frases y repasarlo todo con tarjetas.</li></ul>
  <h2 class="s">Traducir frases enteras</h2><ul class="steps">
  <li>En <b>Traducir</b> escribe o pega una frase en español o en italiano.</li>
  <li>Con <b>Chrome en el ordenador</b> (versión 138 o posterior) la traducción se hace dentro del navegador. La primera vez descarga el idioma.</li>
  <li>En el <b>iPhone</b> la traducción completa se abre en Google Traductor o DeepL (necesitan internet). Copia el italiano que te den, pégalo en la app y tendrás el audio, la pronunciación y el significado de cada palabra.</li>
  <li>Sin internet tienes el análisis palabra por palabra y las frases de la app que se parecen, que están revisadas.</li>
  <li>Una traducción automática puede equivocarse: revísala antes de guardarla en «Mis frases».</li></ul>
  <h2 class="s">Conversar en voz alta</h2><ul class="steps">
  <li>En <b>Conversar</b> hay 12 situaciones reales (bar, restaurante, hotel, tren, farmacia, mercado, cocina profesional, proveedor…). El italiano te habla; tú contestas en voz alta con el botón del micrófono, o escribiendo.</li>
  <li>La app comprueba que en tu respuesta están las palabras importantes. Si falta algo, te dice qué y puedes repetir o ver la respuesta modelo con audio.</li>
  <li>El reconocimiento de voz necesita internet y lo hace el navegador: en el ordenador, Chrome o Edge; en el iPhone, <b>Safari</b>. En la app instalada del iPhone Apple todavía no lo permite: ahí usa el <b>dictado del teclado</b> (añade el teclado italiano en Ajustes → General → Teclado → Teclados, y pulsa el micrófono del teclado).</li>
  <li>Para hablar de cualquier tema, «Conversación libre con una IA» te da unas instrucciones listas para copiar en una app de IA con voz.</li></ul>
  <h2 class="s">Voces</h2><p>En <b>Ajustes → Elegir y probar voces</b> ves las voces italianas del dispositivo, puedes probarlas con la misma frase y quedarte con la que mejor suene. Ahí mismo están los pasos para descargar más voces en iPhone, Windows, Mac y Android.</p>
  <h2 class="s">Varios usuarios</h2><p>En <b>Ajustes → Usuarios</b> puedes crear hasta 5 usuarios en el mismo dispositivo; cada uno con su progreso y su sincronización. Si cada persona usa su propio móvil, basta con que escriba su nombre. Varias personas pueden usar la misma cuenta de GitHub para sincronizar: al conectar, cada una elige o crea <b>su</b> progreso.</p>
  <h2 class="s" id="h-sync">Sincronizar el ordenador y el móvil</h2>
  <p>El progreso se guarda en cada dispositivo. Para tenerlo igual en los dos, la app lo guarda también en un archivo privado (un «gist secreto») de tu cuenta de GitHub, la misma con la que publicas la app. Solo se hace una vez:</p>
  <ol class="steps"><li>En el ordenador entra en github.com con tu cuenta y abre tu foto (arriba a la derecha) → <b>Settings</b>.</li>
  <li>Abajo del todo, en el menú de la izquierda: <b>Developer settings</b> → <b>Personal access tokens</b> → <b>Tokens (classic)</b>.</li>
  <li><b>Generate new token</b> → <b>Generate new token (classic)</b>. En <b>Note</b> escribe «Italiano app». En <b>Expiration</b> elige la duración (si eliges «No expiration» no tendrás que repetirlo).</li>
  <li>Marca <b>solo</b> la casilla <b>gist</b> y pulsa <b>Generate token</b>. Copia el código (empieza por <b>ghp_</b>): GitHub solo lo enseña una vez.</li>
  <li>En la app del ordenador: <b>Ajustes → Sincronizar</b>, pega el código y pulsa <b>Conectar</b>.</li>
  <li>Envíate el código (por ejemplo en una nota o un correo a ti mismo) y, <b>dentro de la app instalada en el iPhone</b> (abriéndola desde su icono, no desde Safari), haz lo mismo en Ajustes. La app instalada y Safari guardan cosas por separado.</li></ol>
  <p class="muted small">Ese código solo permite crear y modificar gists, no da acceso a tus repositorios ni a tu cuenta. Aun así, no lo compartas. Si lo pierdes o quieres anularlo, bórralo en la misma página de GitHub y crea otro. Desde el teléfono también se puede hacer en github.com, pero es más cómodo en el ordenador.</p>
  <p>Después se sincroniza sola: al abrir la app, unos segundos después de cada cambio y al salir. El icono de la nube arriba indica el estado (tócalo para sincronizar en ese momento). Si estudias sin internet, se sincroniza cuando vuelva la conexión. Si cambias lo mismo en los dos dispositivos, se juntan los dos cambios: nunca se pierde lo hecho.</p>
  <h2 class="s">Instalarla en el iPhone</h2><ol class="steps"><li>Abre la dirección de la app en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li>
  <li>Elige <b>Añadir a pantalla de inicio</b> y confirma.</li><li>Ábrela desde su icono con internet <b>una vez</b>: a partir de ahí funciona sin conexión.</li></ol>
  <h2 class="s">Instalar la voz italiana (gratis)</h2><ol class="steps"><li>iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Italiano.</li>
  <li>Descarga una voz (por ejemplo Alice, Federica o Luca). Si aparece una versión <b>Mejorada</b> o <b>Premium</b>, elígela: suena mucho mejor.</li>
  <li>Cierra la app del todo y vuelve a abrirla. Después elige la voz en Ajustes.</li>
  <li>Ordenador: en Windows, Configuración → Hora e idioma → Voz → Agregar voces → Italiano. En Mac, Ajustes del Sistema → Accesibilidad → Contenido leído.</li></ol>
  <p class="muted small">Los menús pueden cambiar un poco según la versión del sistema.</p>
  <h2 class="s">Cómo estudiar con la app</h2><ol class="steps"><li>Abre <b>Hoy</b> cada día y completa las tareas en orden (30–40 minutos).</li>
  <li>Sigue la <b>Ruta por niveles</b>: A1, A2, B1 y B2 (55 unidades).</li>
  <li>En el repaso, valora con sinceridad: así la app te pregunta lo que necesitas.</li><li>Escucha y <b>repite en voz alta</b> cada frase; usa el botón «Despacio» al principio.</li>
  <li>Cuando algo no lo entiendas, búscalo en el <b>Manual</b> (tiene buscador).</li></ol>
  <h2 class="s">Actualizaciones</h2><p>Cuando subas una versión nueva, la app la descargará la próxima vez que la abras con internet y te mostrará un aviso para actualizar. Tu progreso no se pierde.</p>`;
  if (params.s === "sync") setTimeout(() => { const h = $("#h-sync"); if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 60); }, 30);
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
  if (!SESSION.showing && (ev.key === " " || ev.key === "Enter")) { ev.preventDefault(); const b = $("#show"); if (b) b.click(); }
  else if (SESSION.showing && "1234".includes(ev.key)) { const b = $(`[data-g="${+ev.key - 1}"]`); if (b) b.click(); }
});

