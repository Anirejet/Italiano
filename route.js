"use strict";
/* ================================================================ RUTA POR NIVELES */
const UNITS = DATA.units || [];
const PASS = 75;
function RT() { if (!S.route) S.route = { best: {}, errs: [] }; if (!S.route.errs) S.route.errs = []; return S.route; }
function unitUnlocked(i) { if (S.set.unlockAll || i === 0) return true; return (RT().best[UNITS[i - 1].id] || 0) >= PASS; }
function nextUnitIndex() { for (let i = 0; i < UNITS.length; i++) if ((RT().best[UNITS[i].id] || 0) < PASS) return i; return -1; }
const LVLNAME = { A1: "A1 · Acceso", A2: "A2 · Plataforma", B1: "B1 · Umbral", B2: "B2 · Avanzado" };

VIEWS.route = () => {
  const r = RT(); const nx = nextUnitIndex();
  const passed = UNITS.filter(u => (r.best[u.id] || 0) >= PASS).length;
  const lvls = [...new Set(UNITS.map(u => u.lvl))];
  $("#view").innerHTML = `<h1 class="v">Ruta por niveles</h1>
  <p class="sub">${passed} de ${UNITS.length} unidades superadas. Cada unidad tiene una explicación breve, ejemplos con audio y ejercicios; con un ${PASS}% de aciertos se desbloquea la siguiente.</p>
  <div class="row" style="margin-bottom:8px">${nx >= 0 ? `<button class="btn pri" data-go="unit" data-p='{"u":${nx}}'>${passed ? "Continuar" : "Empezar"}: unidad ${nx + 1}</button>` : ""}
  ${r.errs.length ? `<button class="btn" data-go="uerr">Repasar mis errores (${r.errs.length})</button>` : ""}</div>
  ${lvls.map(l => `<h2 class="s">${esc(LVLNAME[l] || l)}</h2><div class="list" style="padding:0">${UNITS.map((u, i) => [u, i]).filter(([u]) => u.lvl === l).map(([u, i]) => {
    const best = r.best[u.id]; const ok = (best || 0) >= PASS; const open = unitUnlocked(i);
    return `<div class="task ${ok ? "done" : ""}" style="${open ? "" : "opacity:.55"}"><div class="ck">${ok ? "✓" : i + 1}</div>
    <div class="grow"><div class="t">${esc(u.t)}</div><div class="muted small">${esc(u.goal)}${best != null ? ` · mejor nota: ${best}%` : ""}</div></div>
    ${open ? `<button class="btn ${ok ? "" : "pri"}" data-go="unit" data-p='{"u":${i}}'>${ok ? "Repasar" : best != null ? "Repetir" : "Abrir"}</button>` : `<span class="muted small" aria-label="Bloqueada">🔒</span>`}</div>`;
  }).join("")}</div>`).join("")}
  <div class="row" style="margin-top:22px"><label class="muted small" for="ula" style="flex:1">Desbloquear todas las unidades (para saltar a la que quieras)</label><input type="checkbox" id="ula" ${S.set.unlockAll ? "checked" : ""} style="width:24px;height:24px"></div>`;
  $("#ula").onchange = e => { S.set.unlockAll = e.target.checked; save(); VIEWS.route(); };
};

VIEWS.unit = () => {
  const i = params.u; const u = UNITS[i];
  if (!u || !unitUnlocked(i)) { go("route"); return; }
  $("#view").innerHTML = `<button class="back" data-go="route">← Ruta</button>
  <p class="muted small" style="margin:0">${esc(u.lvl)} · Unidad ${i + 1}</p><h1 class="v">${esc(u.t)}</h1><p class="sub">${esc(u.goal)}</p>
  <h2 class="s">Lo que necesitas saber</h2><div class="manual speakable">${u.th.map(p => `<p>${p}</p>`).join("")}</div>
  <p><button class="btn" data-go="manual" data-p='{"c":${u.ch}}'>Ampliar en el manual: ${esc((DATA.ch[u.ch] || {}).title || "")}</button></p>
  <h2 class="s">Ejemplos (escúchalos y repítelos)</h2>
  <div class="list">${u.exm.map(e => `<div class="entry speakable">${sayBtn(e[0])}<div class="grow"><div class="hw"><span class="it">${esc(e[0])}</span></div><div class="pr">[${esc(e[1])}]</div><div class="tr">${esc(e[2])}</div>
    <div style="margin-top:6px"><button class="btn small" style="padding:4px 10px" data-say="${esc(e[0])}" data-slow="1">Despacio</button></div></div></div>`).join("")}</div>
  <button class="btn pri big wide" id="ustart" style="margin-top:18px">Hacer los ejercicios (${u.x.length})</button>`;
  $("#ustart").onclick = () => startUnitEx(i);
};

/* ---------------------------------------------------------------- ejecución de ejercicios */
let UX = null;
function startUnitEx(i) {
  const u = UNITS[i];
  UX = { mode: "unit", ui: i, items: u.x.map((x, xi) => ({ ui: i, xi, x })), i: 0, ok: 0, st: {} };
  curView = "uex"; params = {}; nav(); drawEx(); window.scrollTo(0, 0);
}
function startErrEx() {
  const items = RT().errs.map(e => { const ui = UNITS.findIndex(u => u.id === e.u); return ui >= 0 && UNITS[ui].x[e.x] ? { ui, xi: e.x, x: UNITS[ui].x[e.x] } : null; }).filter(Boolean);
  if (!items.length) { toast("No tienes errores pendientes."); go("route"); return; }
  UX = { mode: "errs", items: shuffle(items).slice(0, 20), i: 0, ok: 0, st: {} };
  curView = "uex"; params = {}; nav(); drawEx(); window.scrollTo(0, 0);
}
VIEWS.uex = () => { if (!UX) { go("route"); return; } drawEx(); };
VIEWS.uerr = () => {
  const errs = RT().errs;
  $("#view").innerHTML = `<button class="back" data-go="route">← Ruta</button><h1 class="v">Mis errores</h1>
  <p class="sub">${errs.length ? `Tienes ${errs.length} ejercicio${errs.length > 1 ? "s" : ""} para repasar. Cuando los aciertes, desaparecerán de esta lista.` : "No tienes errores pendientes. ¡Bravo!"}</p>
  ${errs.length ? `<button class="btn pri big wide" id="estart">Repasar mis errores</button>` : ""}`;
  if (errs.length) $("#estart").onclick = startErrEx;
};

const fiNorm = s => String(s).toLowerCase().replace(/[’`]/g, "'").replace(/[.,;:!?¡¿«»"]/g, "").replace(/\s+/g, " ").trim();
const tokens = s => fiNorm(s).split(" ").filter(Boolean);

function addErr(it) { const e = RT().errs; const id = UNITS[it.ui].id; if (!e.some(x => x.u === id && x.x === it.xi)) e.push({ u: id, x: it.xi }); }
function delErr(it) { const id = UNITS[it.ui].id; RT().errs = RT().errs.filter(x => !(x.u === id && x.x === it.xi)); }

function exResult(ok, html, say) {
  const it = UX.items[UX.i];
  UX.st.done = true; UX.st.ok = ok; UX.st.fb = html;
  if (ok) { UX.ok++; if (UX.mode === "errs") delErr(it); } else addErr(it);
  S.quiz.n++; if (ok) S.quiz.ok++; logActivity(); save();
  drawEx(); if (say) speak(say);
}

function drawEx() {
  const it = UX.items[UX.i]; const x = it.x; const st = UX.st;
  const u = UNITS[it.ui];
  const head = `<div class="row" style="justify-content:space-between"><button class="back" id="uquit">← Salir</button>
    <span class="muted small">${UX.mode === "errs" ? "Repaso de errores" : "Unidad " + (it.ui + 1)} · ${UX.i + 1} / ${UX.items.length}</span></div>
    <div class="bar" style="margin-bottom:14px"><i style="width:${Math.round(100 * UX.i / UX.items.length)}%"></i></div>`;
  let body = "";
  if (x.k === "ch") {
    body = `<div class="card speakable" style="min-height:120px;text-align:left"><div class="a">${x.q}</div></div>
    <div class="opts speakable">${x.o.map((o, k) => `<button class="opt ${st.done ? (k === x.a ? "good" : (k === st.pick ? "bad" : "")) : ""}" data-k="${k}" ${st.done ? "disabled" : ""}>${o}</button>`).join("")}</div>`;
  } else if (x.k === "fi") {
    body = `<div class="card" style="min-height:120px"><div class="muted small">Completa el hueco</div><div class="q" style="font-family:var(--serif);font-size:1.6rem">${esc(x.q)}</div><div class="muted">${esc(x.es)}</div></div>
    <input type="text" id="ans" style="margin-top:14px" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Escribe la palabra que falta…" aria-label="Respuesta" ${st.done ? "disabled" : ""} value="${esc(st.val || "")}">
    ${st.done ? "" : `<p class="muted small" style="margin:6px 0 0">Para escribir è, à, ò… mantén pulsada la vocal en el teclado.</p><div class="row" style="margin-top:10px"><button class="btn pri" id="check">Comprobar</button><button class="btn" id="skip">No lo sé</button></div>`}`;
  } else if (x.k === "or") {
    if (!st.tiles) { st.tiles = shuffle(x.it.split(" ").map((w, k) => ({ w, k }))); if (st.tiles.map(t => t.k).join() === x.it.split(" ").map((_, k) => k).join() && st.tiles.length > 1) st.tiles.reverse(); st.chosen = []; }
    const avail = st.tiles.filter(t => !st.chosen.includes(t.k));
    body = `<div class="card" style="min-height:110px"><div class="muted small">Ordena las palabras para decir</div><div class="a" style="font-size:1.25rem">${esc(x.es)}</div></div>
    <div style="min-height:58px;border-bottom:2px solid var(--line);margin:14px 0 10px;padding:6px 0;display:flex;flex-wrap:wrap;gap:8px">${st.chosen.map(k => { const t = st.tiles.find(t => t.k === k); return `<button class="chip tile" data-rm="${k}" ${st.done ? "disabled" : ""} style="font-family:var(--serif);font-size:1.1rem">${esc(t.w)}</button>`; }).join("")}</div>
    <div class="chips">${avail.map(t => `<button class="chip tile" data-add="${t.k}" ${st.done ? "disabled" : ""} style="font-family:var(--serif);font-size:1.1rem">${esc(t.w)}</button>`).join("")}</div>
    ${st.done ? "" : `<div class="row" style="margin-top:14px"><button class="btn pri" id="ocheck" ${avail.length ? "disabled" : ""}>Comprobar</button><button class="btn" id="oreset">Borrar</button></div>`}`;
  } else if (x.k === "li") {
    body = `<div class="card" style="min-height:120px"><div class="muted">Escucha y elige qué significa</div>
    <div class="row" style="justify-content:center">${sayBtn(x.it)}<button class="btn small" data-say="${esc(x.it)}" data-slow="1">Despacio</button></div>
    ${st.done ? `<div class="speakable"><span class="it" style="font-size:1.3rem">${esc(x.it)}</span><div class="pr">[${esc(x.pr)}]</div></div>` : ""}</div>
    <div class="opts">${x.o.map((o, k) => `<button class="opt ${st.done ? (k === x.a ? "good" : (k === st.pick ? "bad" : "")) : ""}" data-k="${k}" ${st.done ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>`;
  } else if (x.k === "pa") {
    if (!st.right) { st.right = shuffle(x.p.map((p, k) => k)); st.matched = []; st.sel = null; st.miss = 0; }
    body = `<div class="card" style="min-height:70px;padding:16px"><div class="muted">Une cada palabra italiana con su traducción</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
      <div style="display:grid;gap:8px">${x.p.map((p, k) => `<button class="opt ${st.matched.includes(k) ? "good" : ""}" data-pl="${k}" ${st.matched.includes(k) || st.done ? "disabled" : ""} style="${st.sel === k ? "border-color:var(--blu);box-shadow:0 0 0 2px var(--blu-soft)" : ""}"><span class="it">${esc(p[0])}</span></button>`).join("")}</div>
      <div style="display:grid;gap:8px">${st.right.map(k => `<button class="opt ${st.matched.includes(k) ? "good" : ""}" data-pr="${k}" ${st.matched.includes(k) || st.done ? "disabled" : ""}>${esc(x.p[k][2])}</button>`).join("")}</div></div>`;
  }
  const fb = st.done ? `<div class="note ${st.ok ? "ok" : "err"} speakable" style="margin-top:14px">${st.fb}</div>
    <button class="btn pri big wide" id="unext" style="margin-top:14px">${UX.i + 1 < UX.items.length ? "Siguiente" : "Ver resultado"}</button>` : "";
  $("#view").innerHTML = head + body + fb;

  $("#uquit").onclick = () => { const m = UX.mode, ui = UX.ui; UX = null; if (m === "unit") go("unit", { u: ui }); else go("route"); };
  if (st.done) { $("#unext").onclick = nextEx; return; }
  if (x.k === "ch") $("#view").querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    st.pick = +b.dataset.k; const ok = st.pick === x.a; exResult(ok, `${ok ? "<b>Corretto!</b> " : "<b>No.</b> "}${x.w}`, x.say);
  });
  if (x.k === "li") { if (!st.spoken) { st.spoken = true; setTimeout(() => speak(x.it), 200); }
    $("#view").querySelectorAll("[data-k]").forEach(b => b.onclick = () => { st.pick = +b.dataset.k; const ok = st.pick === x.a; exResult(ok, `${ok ? "<b>Corretto!</b>" : `<b>No.</b> Significa: «${esc(x.o[x.a])}»`}`, x.it); }); }
  if (x.k === "fi") {
    const inp = $("#ans"); inp.focus(); inp.addEventListener("keydown", ev => { if (ev.key === "Enter") $("#check").click(); });
    const full = `<span class="it">${esc(x.say)}</span> <span class="pr">[${esc(x.pr)}]</span>`;
    $("#check").onclick = () => {
      const v = inp.value; st.val = v; if (!fiNorm(v)) { inp.focus(); return; }
      const exact = x.a.some(a => fiNorm(a) === fiNorm(v)); const loose = x.a.some(a => norm(a) === norm(v));
      if (exact) exResult(true, `<b>Corretto!</b> ${full}<br>${x.w}`, x.say);
      else if (loose) exResult(true, `<b>Bien, pero ojo con el acento:</b> se escribe <span class="it">${esc(x.a[0])}</span>. ${full}<br>${x.w}`, x.say);
      else exResult(false, `<b>No.</b> La respuesta es <span class="it">${esc(x.a[0])}</span>: ${full}<br>${x.w}`, x.say);
    };
    $("#skip").onclick = () => exResult(false, `La respuesta es <span class="it">${esc(x.a[0])}</span>: ${full}<br>${x.w}`, x.say);
  }
  if (x.k === "or") {
    $("#view").querySelectorAll("[data-add]").forEach(b => b.onclick = () => { st.chosen.push(+b.dataset.add); drawEx(); });
    $("#view").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { st.chosen = st.chosen.filter(k => k !== +b.dataset.rm); drawEx(); });
    $("#oreset").onclick = () => { st.chosen = []; drawEx(); };
    $("#ocheck").onclick = () => {
      const got = st.chosen.map(k => st.tiles.find(t => t.k === k).w).join(" ");
      const ok = tokens(got).join(" ") === tokens(x.it).join(" ");
      exResult(ok, `${ok ? "<b>Corretto!</b>" : "<b>No.</b> El orden correcto es:"} <span class="it">${esc(x.it)}</span> <span class="pr">[${esc(x.pr)}]</span>`, x.it);
    };
  }
  if (x.k === "pa") {
    $("#view").querySelectorAll("[data-pl]").forEach(b => b.onclick = () => { st.sel = +b.dataset.pl; speak(x.p[st.sel][0]); drawEx(); });
    $("#view").querySelectorAll("[data-pr]").forEach(b => b.onclick = () => {
      if (st.sel == null) { toast("Toca primero una palabra italiana."); return; }
      const k = +b.dataset.pr;
      if (k === st.sel) { st.matched.push(k); st.sel = null; } else { st.miss++; b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 500); return; }
      if (st.matched.length === x.p.length) {
        const ok = st.miss <= 1;
        exResult(ok, ok ? "<b>Corretto!</b> Todas emparejadas." : `<b>Casi.</b> Has tenido ${st.miss} fallos al emparejar. Repásalas:<br>${x.p.map(p => `<span class="it">${esc(p[0])}</span> = ${esc(p[2])}`).join(" · ")}`);
      } else drawEx();
    });
  }
}
function nextEx() {
  UX.i++; UX.st = {};
  if (UX.i < UX.items.length) { drawEx(); window.scrollTo(0, 0); return; }
  const pct = Math.round(100 * UX.ok / UX.items.length);
  let html;
  if (UX.mode === "unit") {
    const u = UNITS[UX.ui]; const r = RT(); const prev = r.best[u.id] || 0;
    r.best[u.id] = Math.max(prev, pct); const passed = pct >= PASS;
    if (passed) plan().unit = true;
    save();
    const nx = UX.ui + 1 < UNITS.length ? UX.ui + 1 : -1;
    html = `<h1 class="v">${passed ? "Unità superata!" : "Casi…"}</h1><p class="sub">${esc(u.t)}</p>
    <div class="stats"><div class="stat"><b>${pct}%</b><span>aciertos (${UX.ok} de ${UX.items.length})</span></div><div class="stat"><b>${r.best[u.id]}%</b><span>tu mejor nota</span></div></div>
    <p class="note ${passed ? "ok" : ""}" style="margin-top:14px">${passed ? (nx >= 0 ? "Has desbloqueado la siguiente unidad." : "¡Has completado todas las unidades disponibles!") : `Necesitas un ${PASS}% para desbloquear la siguiente. Repasa la explicación y vuelve a intentarlo.`}</p>
    <div class="row" style="margin-top:14px">${passed && nx >= 0 ? `<button class="btn pri" data-go="unit" data-p='{"u":${nx}}'>Siguiente unidad</button>` : ""}
    <button class="btn ${passed ? "" : "pri"}" data-go="unit" data-p='{"u":${UX.ui}}'>Repetir esta unidad</button>
    ${RT().errs.length ? `<button class="btn" data-go="uerr">Repasar mis errores</button>` : ""}<button class="btn" data-go="route">Ver la ruta</button></div>`;
  } else {
    html = `<h1 class="v">Repaso terminado</h1><div class="stats"><div class="stat"><b>${UX.ok} / ${UX.items.length}</b><span>aciertos</span></div><div class="stat"><b>${RT().errs.length}</b><span>errores pendientes</span></div></div>
    <div class="row" style="margin-top:14px">${RT().errs.length ? `<button class="btn pri" data-go="uerr">Seguir repasando</button>` : ""}<button class="btn" data-go="route">Ver la ruta</button></div>`;
  }
  UX = null; curView = "route"; nav(); $("#view").innerHTML = html; window.scrollTo(0, 0);
}

/* arranque (después de cargar la ruta) */
render();
window.__appStarted = true;
