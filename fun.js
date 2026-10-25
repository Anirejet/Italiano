"use strict";
/* ================================================================ v1.9: panel de Hoy, niveles, insignias, sonidos, confeti, estadísticas,
   tarjetas con imagen, ✕ para borrar, bienvenida y repaso inteligente */

/* ---------------------------------------------------------------- ilustraciones propias (SVG) */
const ILL = {
  toscana: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="248" cy="52" r="30" fill="#FFD166"/><path d="M0 150 Q60 105 120 130 T240 118 T320 112 V200 H0Z" fill="#7BC47F"/><path d="M0 170 Q80 135 160 158 T320 146 V200 H0Z" fill="#3E8E5A"/><g fill="#1F5E3B"><path d="M70 160 q6-46 12 0z"/><path d="M90 158 q5-38 10 0z"/><path d="M228 150 q6-50 12 0z"/><path d="M246 150 q5-40 10 0z"/></g><path d="M150 140 h40 v-22 l-20-14 -20 14z" fill="#F4A261"/><rect x="164" y="126" width="10" height="14" fill="#8D5524"/><path d="M146 120 l24-18 24 18" fill="none" stroke="#B5523B" stroke-width="5" stroke-linejoin="round"/></svg>`,
  tarjetas: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="70" y="40" width="150" height="110" rx="16" fill="#C4B5FD" transform="rotate(-10 145 95)"/><rect x="90" y="40" width="150" height="110" rx="16" fill="#93C5FD" transform="rotate(4 165 95)"/><rect x="100" y="48" width="150" height="110" rx="16" fill="#fff" stroke="#E2E4EE" stroke-width="2"/><text x="175" y="100" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#0B7A4B">ciao!</text><text x="175" y="128" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#5E6078">¡hola!</text><circle cx="262" cy="52" r="16" fill="#F59E0B"/><path d="M254 52 l6 6 10-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  charla: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="40" y="40" width="160" height="70" rx="22" fill="#FDBA74"/><path d="M70 108 l-6 24 26-22z" fill="#FDBA74"/><text x="120" y="82" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="22" fill="#7C2D12">Buongiorno!</text><rect x="120" y="110" width="160" height="62" rx="22" fill="#A7F3D0"/><path d="M250 170 l8 22 -26-20z" fill="#A7F3D0"/><text x="200" y="148" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="20" fill="#065F46">Un caffè!</text><circle cx="262" cy="56" r="20" fill="#C026D3"/><path d="M262 44 v10 M255 52 a7 7 0 0 0 14 0 M262 60 v6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  copa: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="160" cy="96" r="78" fill="#FEF3C7"/><path d="M120 50 h80 v26 a40 40 0 0 1 -80 0z" fill="#F59E0B"/><path d="M120 60 h-18 a18 18 0 0 0 18 30 M200 60 h18 a18 18 0 0 1 -18 30" fill="none" stroke="#F59E0B" stroke-width="7"/><rect x="152" y="112" width="16" height="22" fill="#D97706"/><rect x="128" y="134" width="64" height="14" rx="5" fill="#B45309"/><g fill="#6D28D9"><circle cx="80" cy="50" r="5"/><circle cx="246" cy="40" r="4"/><circle cx="252" cy="130" r="6"/></g><g fill="#DB2777"><rect x="70" y="120" width="8" height="8" transform="rotate(20 74 124)"/><rect x="236" y="80" width="8" height="8" transform="rotate(-15 240 84)"/></g></svg>`,
};

/* ---------------------------------------------------------------- sonidos (sintetizados, sin archivos) y vibración */
let ACX = null;
function tone(seq) {
  if (S.set.snd === false) return;
  try {
    ACX = ACX || new (window.AudioContext || window.webkitAudioContext)(); if (ACX.state === "suspended") ACX.resume();
    let t = ACX.currentTime + 0.01;
    seq.forEach(([f, d, type, vol]) => { const o = ACX.createOscillator(), g = ACX.createGain(); o.type = type || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ACX.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.8; });
  } catch (e) {}
}
function fx(ok) {
  if (ok === true) tone([[880, .12], [1320, .18]]); else if (ok === false) tone([[220, .22, "triangle", .1]]); else tone([[660, .12], [880, .12], [1100, .14], [1320, .3]]);
  try { if (S.set.snd !== false && navigator.vibrate) navigator.vibrate(ok === false ? [30, 40, 30] : 25); } catch (e) {}
}
/* ---------------------------------------------------------------- confeti */
function confetti() {
  if (matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let c = $("#confetti"); if (!c) { c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c); }
  const ctx = c.getContext("2d"); const W = c.width = innerWidth * devicePixelRatio, H = c.height = innerHeight * devicePixelRatio;
  const cols = ["#D9480F", "#6D28D9", "#1D4ED8", "#0F766E", "#BE185D", "#F59E0B", "#16A34A"];
  const P = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 18 * devicePixelRatio, vy: (-Math.random() * 16 - 6) * devicePixelRatio,
    s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const step = now => {
    const el = now - t0; ctx.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .55 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - el / 2200); ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
    if (el < 2200) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------------- puntos (XP), niveles, objetivo diario */
const xpToday = () => S.days[today()] || 0;
const xpTotal = () => Object.values(S.days).reduce((a, b) => a + b, 0);
const goal = () => S.set.goal || 50;
function levelOf(xp) { let L = 1; while (xp >= 60 * L * (L + 1) / 2) L++; const lo = 60 * (L - 1) * L / 2, hi = 60 * L * (L + 1) / 2; return { L, cur: xp - lo, need: hi - lo }; }
function maxStreak() { const ds = Object.keys(S.days).filter(k => S.days[k] > 0).map(Number).sort((a, b) => a - b); let best = 0, run = 0, prev = null; ds.forEach(d => { run = prev != null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }); return best; }
/* destrezas: aciertos por tipo de actividad (por dispositivo, para sumar bien entre dispositivos) */
function skill(k, ok) { if (!S.sk[DEV]) S.sk[DEV] = {}; const x = S.sk[DEV][k] || (S.sk[DEV][k] = { ok: 0, n: 0 }); x.n++; if (ok) x.ok++; }
function skillTotals() { const t = {}; Object.values(S.sk).forEach(d => Object.entries(d).forEach(([k, v]) => { t[k] = t[k] || { ok: 0, n: 0 }; t[k].ok += v.ok; t[k].n += v.n; })); return t; }
/* tiempo de estudio: cuenta medio minuto cada 30 s de uso real con la app delante */
let LAST_ACT = 0;
["pointerdown", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, () => { LAST_ACT = Date.now(); }, { passive: true }));
setInterval(() => { if (document.visibilityState === "visible" && Date.now() - LAST_ACT < 60000) { const t = today(); S.tm[t] = Math.round(((S.tm[t] || 0) + 0.5) * 10) / 10; save(true); } }, 30000);
let GOAL_DONE_DAY = null;
function afterXP() {
  const t = today(); if (xpToday() >= goal() && GOAL_DONE_DAY !== t && !(S.goalHit && S.goalHit[t])) { GOAL_DONE_DAY = t; S.goalHit = Object.assign({}, S.goalHit, { [t]: 1 }); toast("¡Objetivo de hoy cumplido! 🎉"); confetti(); fx(); }
  checkBadges();
}

/* ---------------------------------------------------------------- insignias */
const unitsOf = l => (DATA.units || []).filter(u => u.lvl === l);
const lvlDone = l => unitsOf(l).length && unitsOf(l).every(u => (S.route.best[u.id] || 0) >= PASS);
const BADGES = [
  ["first", "🌱", "Primer paso", "Tu primera actividad", () => xpTotal() > 0],
  ["s3", "🔥", "Racha de 3", "3 días seguidos", () => maxStreak() >= 3], ["s7", "🔥", "Una semana", "7 días seguidos", () => maxStreak() >= 7],
  ["s30", "🏅", "Un mes", "30 días seguidos", () => maxStreak() >= 30], ["s100", "👑", "Imparable", "100 días seguidos", () => maxStreak() >= 100],
  ["u1", "🚩", "Primera unidad", "Supera una unidad de la ruta", () => Object.values(S.route.best).some(v => v >= PASS)],
  ["a1", "🥉", "Nivel A1", "Todas las unidades A1", () => lvlDone("A1")], ["a2", "🥈", "Nivel A2", "Todas las unidades A2", () => lvlDone("A2")],
  ["b1", "🥇", "Nivel B1", "Todas las unidades B1", () => lvlDone("B1")], ["b2", "🏆", "Nivel B2", "Todas las unidades B2", () => lvlDone("B2")],
  ["w100", "📚", "100 palabras", "100 tarjetas empezadas", () => Object.keys(S.cards).length >= 100], ["w500", "📚", "500 palabras", "500 tarjetas empezadas", () => Object.keys(S.cards).length >= 500],
  ["w1000", "🧠", "1.000 palabras", "1.000 tarjetas empezadas", () => Object.keys(S.cards).length >= 1000],
  ["d100", "💎", "100 dominadas", "100 tarjetas dominadas", () => Object.values(S.cards).filter(c => c.b >= 4).length >= 100],
  ["c1", "💬", "Primera charla", "Termina una conversación", () => Object.keys(S.conv).length >= 1], ["c12", "🗣️", "Conversador", "Las 12 conversaciones", () => Object.keys(S.conv).length >= 12],
  ["r5", "📖", "Lector", "5 lecturas", () => Object.keys(S.rd).length >= 5], ["r15", "📗", "Gran lector", "Las 15 lecturas", () => Object.keys(S.rd).length >= 15],
  ["ex", "🎓", "Aprobado", "Aprueba un simulacro EOI", () => Object.values(S.ex).some(e => e.best >= 6.5)],
  ["xp1", "⭐", "1.000 puntos", "Suma 1.000 XP", () => xpTotal() >= 1000], ["xp5", "🌟", "5.000 puntos", "Suma 5.000 XP", () => xpTotal() >= 5000],
  ["sv", "⭐", "Coleccionista", "20 palabras o frases guardadas", () => Object.values(S.fav).filter(x => x > 0).length + Object.values(S.notes).filter(n => !n.del).length >= 20],
];
let BADGE_TMR = null;
function checkBadges() {
  clearTimeout(BADGE_TMR);
  BADGE_TMR = setTimeout(() => {
    const now = []; BADGES.forEach(b => { try { if (!S.badges[b[0]] && b[4]()) { S.badges[b[0]] = Date.now(); now.push(b); } } catch (e) {} });
    if (now.length) { save(true); toast(`¡Insignia nueva! ${now[0][1]} ${now[0][2]}`); confetti(); fx(); }
  }, 600);
}

/* ---------------------------------------------------------------- HOY: panel */
VIEWS.home = () => {
  const p = plan(); const h = new Date().getHours(); const hi = h < 14 ? "Buongiorno" : h < 20 ? "Buon pomeriggio" : "Buonasera";
  const name = profName(PROF.list.find(x => x.id === PID)); const named = PROF.list.length > 1 || PROF.list[0].name;
  const dueW = dueList("w").length, dueF = dueList("f").length, nw = newAvailable();
  const reviewDone = dueW + dueF === 0 && (nw === 0 || Object.keys(S.cards).length >= DICT.length);
  const phrs = todaysPhrases(); const heard = phrs.filter(x => p.phr.includes(x.id)).length;
  const vd = verbOfDay(); const vgoal = Math.min(6, vd.v.T[vd.tense].filter(Boolean).length);
  const chI = Math.min(S.lastCh, DATA.ch.length - 1); const ch = DATA.ch[chI];
  const errs = RT().errs.length;
  const tasks = [
    [reviewDone, "Repaso inteligente", `${dueW + dueF} pendientes, ${nw} nuevas${errs ? ` y ${errs} errores de la ruta` : ""}: todo en una sesión.`, "smart", "Empezar", null, "cards", "review"],
    [heard >= 5, "Frases para el viaje", `5 frases del día · escuchadas ${heard} de 5.`, "travel", "Escuchar", { today: 1 }, "plane", "travel"],
    [p.verb >= vgoal, `Verbo del día: ${vd.v.inf}`, `${vd.tense} · ${p.verb >= vgoal ? "hecho" : "aciertos: " + p.verb + " de " + vgoal}.`, "drill", "Practicar", { vi: vd.vi, t: vd.tense }, "verbs", "verbs"],
    [p.read, "Lectura del manual", `${ch.title}.`, "manual", "Leer", { c: chI }, "library", "manual"],
    [!!p.lis, "Escucha diaria", "Un diálogo con preguntas de comprensión (5–8 minutos).", "listen", "Escuchar", null, "headphones", "listen"],
  ];
  const nu = nextUnitIndex();
  if (nu >= 0) tasks.unshift([!!p.unit, `Ruta: unidad ${nu + 1}`, `${UNITS[nu].t}.`, "unit", "Empezar", { u: nu }, "route", "route"]);
  const doneN = tasks.filter(x => x[0]).length;
  const xp = xpToday(), g = goal(), pct = Math.min(1, xp / g), lv = levelOf(xpTotal()), st = streak();
  const C = 2 * Math.PI * 44;
  const w = DICT[(today() * 7919) % DICT.length];
  const ios = IS_IOS; const standalone = IS_STANDALONE;
  const needBackup = Object.keys(S.cards).length >= 30 && Date.now() - (S.lastBackup || 0) > 14 * 864e5 && !(typeof SY !== "undefined" && SY.token);
  const tiles = [["route", "Ruta", "A1 → B2"], ["talk", "Conversar", "Habla en voz alta"], ["ai", "IA", "Charla libre"], ["read", "Lecturas", "Con audio"],
    ["practice", "Practicar", "Test, dictado…"], ["translate", "Traducir", "Con contexto"], ["kitchen", "Cocina", "Recetas y alérgenos"], ["exam", "Exámenes", "Tipo EOI"],
    ["travel", "Viaje", "Frases y tarjetas"], ["listen", "Escucha", "Diálogos"], ["diary", "Diario", "Escribe y corrige"], ["cities", "Ciudades", "Guías"], ["search", "Buscar todo", "En toda la app"], ["dict", "Buscar", (DICT.length + (window.DICT2 ? 0 : (DATA.dict2 || 0))).toLocaleString("es-ES") + " palabras"]];
  $("#view").innerHTML = `<section class="dash">${ILL.toscana.replace("<svg ", '<svg class="ill" ')}
    <h1 class="v" data-noico>${hi}${named ? ", " + esc(name) : ""}!</h1>
    <p class="sub">${doneN} de ${tasks.length} tareas de hoy${PROF.list.length > 1 ? ` · <button class="linkb" id="chgUser" style="color:#fff">cambiar de usuario</button>` : ""}</p>
    <div class="dash-row"><div class="ring" role="img" aria-label="${xp} de ${g} puntos hoy"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
      <div class="c"><div><b>${xp}</b><small>de ${g} XP</small></div></div></div>
      <div class="dash-stats"><div class="pill"><b>🔥 ${st}</b><span>día${st === 1 ? "" : "s"} seguido${st === 1 ? "" : "s"}</span></div>
      <div class="pill"><b>⭐ ${lv.L}</b><span>nivel · ${lv.cur}/${lv.need} XP</span><div class="lvlbar"><i style="width:${Math.round(100 * lv.cur / lv.need)}%"></i></div></div>
      <button class="pill" data-go="badges" style="border:0;color:#fff;text-align:left"><b>🏅 ${Object.keys(S.badges).length}</b><span>insignias</span></button>
      <div class="pill"><b>${Math.round(S.tm[today()] || 0)} min</b><span>hoy</span></div></div></div></section>
  ${ios && !standalone ? `<p class="note" style="margin-top:14px">Para usarla como app y sin internet: pulsa <b>Compartir</b> en Safari y elige <b>Añadir a pantalla de inicio</b>.</p>` : ""}
  ${needBackup ? `<p class="note" style="margin-top:14px">Hace tiempo que no guardas una copia de tu progreso. <button class="btn small" data-go="settings">Hacer copia</button></p>` : ""}
  <h2 class="s">Tu plan de hoy</h2>
  <div class="list" style="padding:0">${tasks.map(([d, t, desc, view, label, pp, ic, sec]) => `<div class="task ${d ? "done" : ""}" style="--c:${SEC[sec]}"><div class="ck">${d ? "✓" : `<span class="nico" style="color:${SEC[sec]}">${svg(ic)}</span>`}</div>
    <div class="grow"><div class="t">${esc(t)}</div><div class="muted small">${esc(desc)}</div></div>
    ${view === "smart" ? `<button class="btn ${d ? "" : "pri"}" id="smartGo">${d ? "Repasar" : label}</button>` : `<button class="btn ${d ? "" : "pri"}" data-go="${view}" ${pp ? `data-p='${JSON.stringify(pp)}'` : ""}>${d ? "Repetir" : label}</button>`}</div>`).join("")}</div>
  <h2 class="s">Todo lo que puedes hacer</h2>
  <div class="tiles">${tiles.map(([k, l, d]) => `<button class="tile" style="--c:${SEC[k]}" data-go="${k}"><span class="ti">${svg(NAVMAP[k][2])}</span><b>${l}</b><span>${esc(d)}</span></button>`).join("")}</div>
  <h2 class="s">Palabra del día</h2>
  <div class="hero speakable"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">${sayBtn(w.it)}<div>
  <div class="word">${w.em ? `<span class="emo">${w.em}</span> ` : ""}<span class="it">${esc(w.it)}</span></div><div class="pr" style="font-size:1rem">[${esc(w.pr)}]</div>
  <div style="font-size:1.15rem;margin-top:6px">${esc(w.es)}</div><div class="muted small" style="margin-top:4px">${esc(w.cat)}</div></div>${favBtn(w.id)}</div></div>`;
  const cu = $("#chgUser"); if (cu) cu.onclick = () => showPicker(true);
  $("#smartGo").onclick = startSmart;
};

/* ---------------------------------------------------------------- repaso inteligente: tarjetas pendientes + guardadas + nuevas, y luego errores de la ruta */
function startSmart() {
  const t = today(); const seen = new Set();
  const due = shuffle([...dueList("w"), ...dueList("f")]).slice(0, 60);
  const saved = (typeof savedIds === "function" ? savedIds() : []).filter(id => S.cards[id] && S.cards[id].d <= t);
  const fresh = NEWORDER.filter(e => !S.cards[e.id]).slice(0, newAvailable()).map(e => e.id);
  const q = [...due, ...saved, ...fresh].filter(id => CARDS[id] && !seen.has(id) && seen.add(id));
  if (!q.length) { if (RT().errs.length) { toast("No hay tarjetas pendientes: vamos con tus errores de la ruta."); startErrEx(); } else toast("¡Todo repasado por hoy!"); return; }
  SESSION = { q, done: 0, showing: false, dir: null, deck: "smart" };
  go("review");
}

/* ---------------------------------------------------------------- INSIGNIAS */
VIEWS.badges = () => {
  checkBadges();
  const got = BADGES.filter(b => S.badges[b[0]]).length;
  $("#view").innerHTML = `<h1 class="v">Insignias</h1><p class="sub">${got} de ${BADGES.length} conseguidas. Nivel ${levelOf(xpTotal()).L} · ${xpTotal().toLocaleString("es-ES")} XP en total · mejor racha: ${maxStreak()} días.</p>
  <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b[0]] ? "" : "off"}"><div class="bi emo">${b[1]}</div><b>${esc(b[2])}</b><span>${esc(b[3])}</span>${S.badges[b[0]] ? `<div class="muted small" style="margin-top:4px">${new Date(S.badges[b[0]]).toLocaleDateString("es-ES")}</div>` : ""}</div>`).join("")}</div>
  <h2 class="s">Cómo se ganan puntos (XP)</h2><p class="muted small">Cada tarjeta repasada, ejercicio, frase escuchada o lectura suma puntos. Superar una unidad da 20 XP extra; terminar una conversación, 10; un simulacro de examen, 10 por parte. Tu objetivo diario se cambia en Ajustes.</p>`;
};

/* ---------------------------------------------------------------- PROGRESO con gráficos */
VIEWS.progress = () => {
  const ids = Object.keys(S.cards); const t = today();
  const lv = [0, 0, 0]; ids.forEach(id => lv[S.cards[id].b >= 4 ? 2 : S.cards[id].b >= 2 ? 1 : 0]++);
  const weeks = []; for (let w = 7; w >= 0; w--) { let xp = 0, mins = 0, nw = 0; for (let d = t - w * 7 - 6; d <= t - w * 7; d++) { xp += S.days[d] || 0; mins += S.tm[d] || 0; }
    ids.forEach(id => { const f = S.cards[id].f; if (f != null && f >= t - w * 7 - 6 && f <= t - w * 7) nw++; }); weeks.push({ xp, mins, nw, lab: w === 0 ? "esta" : "-" + w }); }
  const mx = k => Math.max(1, ...weeks.map(w => w[k]));
  const bars = (k, unit) => `<div class="chartbars">${weeks.map(w => `<div><span>${Math.round(w[k])}</span><i style="height:${Math.round(85 * w[k] / mx(k))}%"></i><span>${w.lab}</span></div>`).join("")}</div>`;
  const sk = skillTotals(); const SKN = { vocab: "Vocabulario", ejer: "Ejercicios", escucha: "Comprensión oral", habla: "Expresión oral", lectura: "Comprensión lectora", escrit: "Expresión escrita" };
  const qt = quizTotal(); const totalMin = Object.values(S.tm).reduce((a, b) => a + b, 0);
  const hard = ids.filter(id => CARDS[id] && S.cards[id].n >= 2).map(id => [id, S.cards[id].ok / S.cards[id].n]).sort((a, b) => a[1] - b[1]).slice(0, 8).filter(x => x[1] < .7);
  $("#view").innerHTML = `<h1 class="v">Progreso</h1><p class="sub">Nivel ${levelOf(xpTotal()).L} · ${xpTotal().toLocaleString("es-ES")} XP · ${Math.round(totalMin / 60 * 10) / 10} horas de estudio registradas.</p>
  <div class="row" style="margin-bottom:12px"><button class="btn" data-go="cert">${svg("printer")} Informe de progreso (PDF)</button></div>
  <div class="stats"><div class="stat"><b>${ids.length}</b><span>tarjetas empezadas</span></div><div class="stat"><b>${lv[1]}</b><span>en aprendizaje</span></div>
  <div class="stat"><b>${lv[2]}</b><span>dominadas</span></div><div class="stat"><b>${streak()}</b><span>días seguidos (mejor: ${maxStreak()})</span></div>
  <div class="stat"><b>${qt.n ? Math.round(100 * qt.ok / qt.n) + "%" : "—"}</b><span>aciertos en ejercicios</span></div><div class="stat"><b>${Object.keys(S.badges).length}</b><span><button class="linkb" data-go="badges">insignias</button></span></div></div>
  <h2 class="s">Puntos por semana</h2>${bars("xp")}
  <h2 class="s">Minutos de estudio por semana</h2>${bars("mins")}
  <h2 class="s">Palabras nuevas por semana</h2>${bars("nw")}<p class="muted small">Cuenta desde la versión 1.9 (antes no se guardaba la fecha de la primera vez).</p>
  <h2 class="s">Aciertos por destreza</h2>${Object.keys(SKN).map(k => { const v = sk[k]; const p = v && v.n ? Math.round(100 * v.ok / v.n) : null;
    return `<div class="skill"><span>${SKN[k]}</span><div class="bar"><i style="width:${p || 0}%"></i></div><b>${p == null ? "—" : p + "%"}</b></div>`; }).join("")}
  ${hard.length ? `<h2 class="s">Las que más te cuestan</h2><div class="list">${hard.map(([id]) => entryHTML(CARDS[id])).join("")}</div>` : ""}
  <h2 class="s">Vocabulario por temas</h2><div class="kv">${CATS.map(c => { const all = DICT.filter(e => e.cat === c); if (!all.length) return ""; const s2 = all.filter(e => S.cards[e.id]).length; const k = all.filter(e => S.cards[e.id] && S.cards[e.id].b >= 4).length;
    return `<div><div style="font-size:.95rem">${esc(c)} <span class="muted">· ${s2}/${all.length}</span></div><div class="bar"><i style="width:${Math.round(100 * s2 / all.length)}%"></i></div></div><span class="muted small">${k} dominadas</span>`; }).join("")}</div>`;
};

/* ---------------------------------------------------------------- ✕ para borrar en todos los cuadros de texto */
function decorateInputs(root) {
  (root || document).querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(el => {
    if (el.dataset.noclr != null || (el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("clr-wrap"))) return;
    const w = document.createElement("span"); w.className = "clr-wrap";
    el.parentNode.insertBefore(w, el); w.appendChild(el);
    const b = document.createElement("button"); b.type = "button"; b.className = "clr-x"; b.setAttribute("aria-label", "Borrar lo escrito"); b.tabIndex = -1; b.innerHTML = svg("x");
    b.addEventListener("pointerdown", e => e.preventDefault()); b.addEventListener("mousedown", e => e.preventDefault());
    b.addEventListener("click", e => { e.preventDefault(); if (el.disabled) return; el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); w.classList.remove("has-text"); el.focus(); });
    w.appendChild(b); w.classList.toggle("has-text", !!el.value && !el.disabled);
  });
}
document.addEventListener("input", e => { const w = e.target.parentNode; if (w && w.classList && w.classList.contains("clr-wrap")) w.classList.toggle("has-text", !!e.target.value && !e.target.disabled); }, true);
new MutationObserver(muts => { for (const m of muts) if (m.addedNodes.length) { decorateInputs(document.body); break; } }).observe(document.body, { childList: true, subtree: true });

/* ---------------------------------------------------------------- BIENVENIDA (primera vez de cada usuario) */
function showOnboarding(force) {
  const key = "italiano.onb." + PID;
  try { if (!force && (localStorage.getItem(key) || Object.keys(S.cards).length || xpTotal())) return; } catch (e) { return; }
  const slides = [
    [ILL.toscana, "Benvenuto!", "Esta app te acompaña de cero a B2 y te prepara para el viaje: ruta por niveles, repaso con tarjetas, conversación, lecturas, cocina y mucho más. Todo gratis y sin internet."],
    [ILL.tarjetas, "Un poco cada día", "Abre «Hoy» y sigue tu plan: la ruta, el repaso inteligente, las frases de viaje y el verbo del día. Cada actividad suma puntos (XP) para tu objetivo diario y tu racha."],
    [ILL.charla, "Escucha y habla", "Toca cualquier palabra en verde para oírla. La lupa busca sin perder el sitio y «‹ Atrás» te devuelve donde estabas. En Conversar, contesta en voz alta."],
  ];
  let i = 0; const o = document.createElement("div"); o.className = "onb"; document.body.appendChild(o); document.body.dataset.sec = "home";
  const draw = () => {
    const last = i === slides.length;
    o.innerHTML = last ? `<div class="ill">${ILL.copa}</div><h2>¿Empezamos?</h2><p>Dos datos para personalizarla (los puedes cambiar en Ajustes).</p>
      <input type="text" id="onbName" data-noclr placeholder="Tu nombre" value="${esc((PROF.list.find(x => x.id === PID) || {}).name || "")}" style="max-width:320px;margin:6px auto">
      <label class="muted small" for="onbGoal" style="display:block;margin-top:10px">Objetivo diario</label><select id="onbGoal" style="margin:6px auto">${[[30, "Suave · 30 XP (unos 15 min)"], [50, "Normal · 50 XP (unos 25 min)"], [80, "Serio · 80 XP (unos 40 min)"], [120, "Intenso · 120 XP (1 hora)"]].map(([v, l]) => `<option value="${v}" ${goal() === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div class="dots">${slides.concat([0]).map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div><button class="btn pri big" id="onbOk" style="min-width:220px">Empezar</button>`
      : `<div class="ill">${slides[i][0]}</div><h2>${slides[i][1]}</h2><p>${slides[i][2]}</p><div class="dots">${slides.concat([0]).map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="row" style="justify-content:center"><button class="btn" id="onbSkip">Saltar</button><button class="btn pri big" id="onbNext" style="min-width:160px">Siguiente</button></div>`;
    const done = () => { try { localStorage.setItem(key, "1"); } catch (e) {} o.remove(); render(); };
    if ($("#onbNext")) $("#onbNext").onclick = () => { i++; draw(); };
    if ($("#onbSkip")) $("#onbSkip").onclick = done;
    if ($("#onbOk")) $("#onbOk").onclick = () => { const n = $("#onbName").value.trim().slice(0, 30); const pr = PROF.list.find(x => x.id === PID); if (n && pr) { pr.name = n; saveProf(); } S.set.goal = +$("#onbGoal").value; save(); done(); };
  };
  draw();
}

/* ---------------------------------------------------------------- ajustes nuevos: objetivo, sonidos, barra inferior */
function funSettingsHTML() {
  const opts = NAV.filter(n => n[0] !== "home");
  return `<h2 class="s">Objetivo, sonidos y barra inferior</h2><div class="kv">
  <label for="sgoal">Objetivo diario</label><select id="sgoal">${[30, 50, 80, 120].map(v => `<option value="${v}" ${goal() === v ? "selected" : ""}>${v} XP</option>`).join("")}</select>
  <label for="ssnd">Sonidos al acertar y fallar</label><input type="checkbox" id="ssnd" ${S.set.snd !== false ? "checked" : ""} style="width:24px;height:24px"></div>
  <p class="muted small" style="margin:12px 0 6px">Elige las 4 secciones de la barra de abajo (además de Hoy y Más):</p>
  <div class="row">${bottomKeys().map((k, i) => `<select data-bn="${i}" aria-label="Botón ${i + 1}">${opts.map(([key, l]) => `<option value="${key}" ${key === k ? "selected" : ""}>${esc(SHORT[key] || l)}</option>`).join("")}</select>`).join("")}</div>
  <p style="margin-top:12px"><button class="btn small" id="onbAgain">Ver otra vez la bienvenida</button></p>`;
}
function bindFunSettings() {
  const g = $("#sgoal"); if (!g) return;
  g.onchange = () => { S.set.goal = +g.value; save(); };
  $("#ssnd").onchange = e => { S.set.snd = e.target.checked; save(); if (e.target.checked) fx(true); };
  $("#view").querySelectorAll("[data-bn]").forEach(sel => sel.onchange = () => { const k = bottomKeys().slice(); k[+sel.dataset.bn] = sel.value; S.set.nav = k; save(); nav(); });
  $("#onbAgain").onclick = () => showOnboarding(true);
}

/* ---------------------------------------------------------------- tarjetas con imagen (emoji) */
function emojiPool(cat) { return DICT.filter(e => e.em && (!cat || e.cat === cat)); }

setTimeout(() => { showOnboarding(false); checkBadges(); }, 400);
