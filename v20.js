"use strict";
/* ================================================================ v2.0
   Mis palabras (añadir a tarjetas con su frase), Escucha diaria, Diario con corrección por IA local,
   Ciudades, Modo viaje, Partidas de cocina, Fichas imprimibles, Informe de progreso y Buscar en toda la app. */

/* ---------------------------------------------------------------- MIS PALABRAS → TARJETAS DE REPASO */
function uwEntry(id, w) {
  if (!CARDS[id]) CARDS[id] = { i: 1e6, o: 1e6, it: w.it, pr: w.pr || "", es: w.es, cat: "mis palabras", id, uw: 1, kIt: variants(w.it, ART_IT), kEs: variants(w.es, ART_ES) };
  if (w.cx) CARDS[id].cx = w.cx;
  return CARDS[id];
}
function syncUW() { Object.entries(S.uw || {}).forEach(([id, w]) => { if (!w.del) uwEntry(id, w); }); }
function addUW(it, pr, es, cx) {
  const id = "w" + hash(it + "|" + es);
  if (!pr && typeof pronText === "function") { try { pr = pronText(it).pr; } catch (e) { pr = ""; } }
  S.uw[id] = { it, pr: pr || "", es, cx: cx && cx[0] ? cx : null, t: Date.now() };
  uwEntry(id, S.uw[id]);
  if (!S.cards[id]) S.cards[id] = { b: 0, d: today(), n: 0, ok: 0, t: Date.now() };
  save(); return id;
}
const inCards = (it, es) => !!S.cards["w" + hash(it + "|" + es)];
/* botón «+ tarjeta»: data-addw = [it, pr, es, frase_it, frase_es] */
const addBtn = (it, pr, es, cxit, cxes) => `<button class="addw" data-addw="${esc(JSON.stringify([it, pr || "", es, cxit || "", cxes || ""]))}" aria-pressed="${inCards(it, es)}" aria-label="Añadir a mis tarjetas de repaso" title="Añadir a mis tarjetas">${svg(inCards(it, es) ? "check" : "plus")}</button>`;
document.addEventListener("click", e => {
  const b = e.target.closest("[data-addw]"); if (!b) return; e.stopPropagation();
  const [it, pr, es, ci, ce] = JSON.parse(b.dataset.addw);
  if (inCards(it, es)) { toast("Ya está en tus tarjetas de repaso."); return; }
  addUW(it, pr, es, ci ? [ci, ce] : null);
  document.querySelectorAll("[data-addw]").forEach(x => { if (x.dataset.addw === b.dataset.addw) { x.setAttribute("aria-pressed", "true"); x.innerHTML = svg("check"); } });
  toast("Añadida a tus tarjetas: te la preguntará en Repasar.");
}, true);
syncUW();
/* ejemplo que se enseña al dar la vuelta a una tarjeta */
function cardExample(e) {
  const x = e.cx ? [e.cx[0], "", e.cx[1]] : (window.DEX && DEX[e.it]);
  if (!x) return "";
  return `<div class="cardex speakable"><span class="it">${esc(x[0])}</span>${x[2] ? `<div class="muted small">${esc(x[2])}</div>` : ""}</div>`;
}

/* ---------------------------------------------------------------- ESCUCHA DIARIA */
function listenOfDay(L) { const notDone = L.filter(d => !S.ls[d.id]); return (notDone.length ? notDone : L)[today() % (notDone.length || L.length)]; }
VIEWS.listen = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const L = CONTENT.listen || [];
  if (!L.length) { $("#view").innerHTML = `<h1 class="v">Escucha diaria</h1><p class="note">Esta versión no incluye diálogos.</p>`; return; }
  if (params.l == null) {
    const d0 = listenOfDay(L); const i0 = L.indexOf(d0);
    const done = L.filter(d => S.ls[d.id]).length;
    $("#view").innerHTML = `<h1 class="v">Escucha diaria</h1>
    <p class="sub">Diálogos de la vida real leídos con voces distintas. Primero escucha <b>sin leer</b> y contesta; después mira la transcripción. ${done} de ${L.length} hechos.</p>
    <div class="hero"><div class="muted small">Escucha de hoy · ${esc(d0.lvl)}</div><div class="t" style="font-size:1.2rem;margin:4px 0"><span class="it">${esc(d0.t)}</span></div><div class="muted">${esc(d0.place)}</div>
      <button class="btn pri" style="margin-top:10px" data-go="listen" data-p='{"l":${i0}}'>${svg("headphones")} Empezar</button></div>
    ${["A2", "B1"].map(l => `<h2 class="s">Nivel ${l}</h2><div class="list" style="padding:0">${L.map((d, i) => [d, i]).filter(([d]) => d.lvl === l).map(([d, i]) => { const st = S.ls[d.id];
      return `<div class="task ${st && st.best >= 75 ? "done" : ""}"><div class="ck">${st && st.best >= 75 ? "✓" : ""}</div><div class="grow"><div class="t"><span class="it">${esc(d.t)}</span></div><div class="muted small">${esc(d.place)}${st ? ` · ${st.best}%` : ""}</div></div>
      <button class="btn ${st ? "" : "pri"}" data-go="listen" data-p='{"l":${i}}'>${st ? "Repetir" : "Escuchar"}</button></div>`; }).join("")}</div>`).join("")}`;
    return;
  }
  const d = L[params.l]; if (!d) { go("listen", {}, { replace: true }); return; }
  const ans = params.ans || {}, done = params.done, tx = params.tx || done != null, tr = params.tr;
  const who = [...new Set(d.l.map(x => x[0]))];
  const lines = d.l.map(x => ({ t: x[1], who: x[0] }));
  $("#view").innerHTML = `<button class="back" data-go="listen">← Escucha diaria</button><p class="muted small" style="margin:0">${esc(d.lvl)} · ${esc(d.place)}</p>
  <h1 class="v speakable"><span class="it">${esc(d.t)}</span></h1><p class="sub">${esc(d.intro)}</p>
  <div class="row"><button class="btn pri" id="lplay">${svg("speaker")} Escuchar</button><button class="btn" id="lslow">Despacio</button><button class="btn" id="lstop">Parar</button></div>
  <p class="muted small">Personajes: ${who.map(esc).join(", ")}. ${VOICES.length > 1 ? "Cada uno con una voz distinta." : "Solo hay una voz italiana instalada: cambia el tono para distinguirlos (en Ajustes → Voces puedes instalar más)."}</p>
  <h2 class="s">Preguntas</h2>${d.q.map((q, qi) => `<div class="qbox"><div class="t">${qi + 1}. ${esc(q[0])}</div><div class="opts">${q[1].map((o, oi) => `<button class="opt ${done != null ? (oi === q[2] ? "good" : (ans[qi] === oi ? "bad" : "")) : (ans[qi] === oi ? "sel" : "")}" data-q="${qi}" data-o="${oi}" ${done != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
    ${done != null ? `<p class="muted small">${esc(q[3])}</p>` : ""}</div>`).join("")}
  ${done != null ? `<div class="note ${done >= 75 ? "ok" : ""}">Resultado: <b>${done}%</b>.</div>` : `<button class="btn pri big wide" id="lchk" style="margin-top:12px">Corregir</button>`}
  <h2 class="s">Transcripción</h2>
  ${tx ? `<div class="row" style="margin-bottom:8px"><button class="btn small" id="ltr">${tr ? "Ocultar" : "Ver"} traducción</button></div>
    <div class="dlg speakable">${d.l.map((x, k) => `<div class="dl ${who.indexOf(x[0]) % 2 ? "b" : "a"}"><div class="who">${esc(x[0])}</div><div class="grow"><span class="it" data-ln="${k}">${esc(x[1])}</span><div class="pr">[${esc(x[2])}]</div>${tr ? `<div class="es">${esc(x[3])}</div>` : ""}</div>${addBtn(x[1], x[2], x[3])}</div>`).join("")}</div>
    <p class="muted small">Toca una frase para oírla. Con <b>+</b> la añades a tus tarjetas de repaso.</p>`
    : `<p class="muted">Intenta contestar antes de leer. <button class="linkb" id="ltx">Ver la transcripción ahora</button></p>`}
  ${done != null ? `<div class="row" style="margin-top:14px"><button class="btn" id="lagain">Repetir preguntas</button>${params.l + 1 < L.length ? `<button class="btn pri" data-go="listen" data-p='{"l":${params.l + 1}}'>Siguiente diálogo</button>` : ""}</div>` : ""}`;
  const rd = () => { const y = window.scrollY; VIEWS.listen(); window.scrollTo(0, y); };
  $("#lplay").onclick = () => speakSeq(lines); $("#lslow").onclick = () => speakSeq(lines, 0.7); $("#lstop").onclick = () => stopSpeak();
  if ($("#ltx")) $("#ltx").onclick = () => { params.tx = true; rd(); };
  if ($("#ltr")) $("#ltr").onclick = () => { params.tr = !params.tr; rd(); };
  $("#view").querySelectorAll("[data-q]").forEach(b => b.onclick = () => { const a = Object.assign({}, params.ans || {}); a[b.dataset.q] = +b.dataset.o; params.ans = a; rd(); });
  if ($("#lchk")) $("#lchk").onclick = () => {
    if (Object.keys(ans).length < d.q.length) { toast("Responde todas las preguntas."); return; }
    const ok = d.q.filter((q, i) => ans[i] === q[2]).length; const pct = Math.round(100 * ok / d.q.length);
    params.done = pct; const old = S.ls[d.id]; S.ls[d.id] = { best: Math.max(pct, old ? old.best : 0), t: Date.now() };
    S.quiz.n += d.q.length; S.quiz.ok += ok; for (let k = 0; k < d.q.length; k++) skill("escucha", k < ok);
    fx(pct >= 75 ? undefined : pct >= 50); if (pct >= 75) confetti(); plan().lis = true; logActivity(5); save(); rd();
  };
  if ($("#lagain")) $("#lagain").onclick = () => { params.ans = {}; delete params.done; params.tx = false; VIEWS.listen(); };
};

/* ---------------------------------------------------------------- DIARIO EN ITALIANO */
const DIA_IDEAS = [
  ["Che cosa hai fatto oggi?", "¿Qué has hecho hoy?"], ["Che cosa hai mangiato oggi?", "¿Qué has comido hoy?"], ["Descrivi la tua cucina.", "Describe tu cocina."],
  ["Racconta la tua ricetta preferita.", "Cuenta tu receta favorita."], ["Che cosa farai nel fine settimana?", "¿Qué harás el fin de semana?"],
  ["Descrivi il tuo lavoro con gli studenti.", "Describe tu trabajo con los alumnos."], ["Dove vorresti andare in Italia e perché?", "¿Adónde te gustaría ir en Italia y por qué?"],
  ["Racconta un viaggio che ti è piaciuto.", "Cuenta un viaje que te gustó."], ["Che tempo fa oggi dove abiti?", "¿Qué tiempo hace hoy donde vives?"],
  ["Se avessi un mese libero, che cosa faresti?", "Si tuvieras un mes libre, ¿qué harías?"], ["Descrivi il tuo giardino o la tua terrazza.", "Describe tu jardín o tu terraza."],
  ["Qual è il piatto che cucini meglio? Spiega come lo fai.", "¿Qué plato cocinas mejor? Explica cómo lo haces."]];
const diaKey = (t = today()) => "d" + t;
const diaDate = k => new Date(+k.slice(1) * 864e5).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
function diaPrompt(text) {
  return `Sei un insegnante di italiano. Lo studente (spagnolo, livello A2-B1) ha scritto questo diario:\n"""${text}"""\n\nRispondi ESATTAMENTE in questo formato, senza altro testo:\nTESTO CORRETTO:\n<il testo corretto, cambiando solo ciò che è sbagliato>\nERRORI:\n- <parte sbagliata> → <parte corretta> // <spiegazione brevissima in spagnolo>\n(una riga per ogni errore; se non ci sono errori scrivi solo: - nessuno)\nCONSIGLIO:\n<un consiglio breve in spagnolo per migliorare>`;
}
function diaParse(out) {
  const g = (a, b) => { const m = out.match(new RegExp(a + "\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:" + b + ")\\s*:|$)", "i")); return m ? m[1].trim() : ""; };
  const fix = g("TESTO CORRETTO", "ERRORI|CONSIGLIO"), errs = g("ERRORI", "CONSIGLIO"), tip = g("CONSIGLIO", "$^");
  const E = errs.split(/\n/).map(l => l.replace(/^\s*[-•*\d.)]+\s*/, "").trim()).filter(l => l && !/^nessun/i.test(l)).map(l => {
    const [a, why] = l.split(/\s*\/\/\s*/); const [o, c] = (a || "").split(/\s*(?:→|->|=>)\s*/); return c ? [o.replace(/^["«]|["»]$/g, ""), c.replace(/^["«]|["»]$/g, ""), (why || "").trim()] : null; }).filter(Boolean);
  return { fix: fix.replace(/^["«]|["»]$/g, ""), errs: E, tip };
}
async function aiEnsure() {
  if (typeof AIE !== "undefined" && AIE) return AIE;
  const ready = Object.keys(AIC.ready || {}); if (!ready.length) return null;
  const m = AI_MODELS.find(x => x.id === AIC.model) || AI_MODELS[0];
  return aiLoad(m);
}
VIEWS.diary = () => {
  const k = params.k || diaKey(); const isToday = k === diaKey();
  const e = S.dia[k] && !S.dia[k].del ? S.dia[k] : null;
  const idea = DIA_IDEAS[(today() + (params.idea || 0)) % DIA_IDEAS.length];
  const past = Object.entries(S.dia).filter(([kk, x]) => !x.del && x.it && kk !== k).sort((a, b) => b[0].localeCompare(a[0], "es", { numeric: true }));
  const aiOk = Object.keys(AIC.ready || {}).length > 0;
  $("#view").innerHTML = `<h1 class="v">Diario en italiano</h1>
  <p class="sub">Escribe unas líneas cada día (aunque sean 3 frases). La IA del dispositivo te las corrige sin internet y cada error se puede convertir en una tarjeta de repaso.</p>
  ${!isToday ? `<p><button class="back" data-go="diary">← Volver a hoy</button></p>` : ""}
  <p class="muted small" style="margin:0">${esc(diaDate(k))}</p>
  ${isToday ? `<div class="hero" style="padding:12px 14px"><div class="muted small">Idea para hoy</div><div class="speakable"><span class="it">${esc(idea[0])}</span></div><div class="muted small">${esc(idea[1])}</div>
    <button class="linkb small" id="dnew" style="margin-top:4px">Otra idea</button></div>` : ""}
  <textarea id="dtx" rows="7" style="margin-top:10px" placeholder="Scrivi qui… (Oggi ho…)">${esc(e ? e.it : "")}</textarea>
  <div class="row" style="margin-top:8px"><button class="btn pri" id="dfix">${svg("ai")} Corregir con la IA</button><button class="btn" id="dsave">Guardar</button>
  ${typeof SRClass !== "undefined" && SRClass ? `<button class="btn" id="dmic">${svg("mic")} Dictar</button>` : ""}<button class="btn" id="dcopy">Copiar para otra IA</button></div>
  ${aiOk ? "" : `<p class="muted small">Para corregir sin internet primero descarga un modelo en <button class="linkb" data-go="ai">IA del dispositivo</button> (una sola vez). Mientras tanto puedes guardar tu texto o copiarlo con las instrucciones para pegarlo en otra IA.</p>`}
  <div id="dout">${e && e.fix ? diaResultHTML(e) : ""}</div>
  ${past.length ? `<h2 class="s">Días anteriores</h2><div class="list" style="padding:0">${past.slice(0, 60).map(([kk, x]) => `<div class="task"><div class="grow"><div class="t">${esc(diaDate(kk))}</div><div class="muted small it-text">${esc(x.it.slice(0, 80))}${x.it.length > 80 ? "…" : ""}${x.errs ? ` · ${x.errs.length} error${x.errs.length === 1 ? "" : "es"}` : ""}</div></div><button class="btn" data-go="diary" data-p='{"k":"${kk}"}'>Abrir</button></div>`).join("")}</div>` : ""}`;
  const ta = $("#dtx");
  const store = (extra) => { const it = ta.value.trim(); if (!it) return false; S.dia[k] = Object.assign({}, S.dia[k] && !S.dia[k].del ? S.dia[k] : {}, { it }, extra || {}, { t: Date.now() }); save(); return true; };
  if ($("#dnew")) $("#dnew").onclick = () => { params.idea = (params.idea || 0) + 1; params.draft = ta.value; VIEWS.diary(); };
  if (params.draft) { ta.value = params.draft; delete params.draft; }
  ta.addEventListener("input", () => { clearTimeout(ta._t); ta._t = setTimeout(() => store(), 1200); });
  $("#dsave").onclick = () => { if (store()) { toast("Guardado."); logActivity(2); } else toast("Escribe algo primero."); };
  $("#dcopy").onclick = async () => { const t = ta.value.trim(); if (!t) { toast("Escribe algo primero."); return; } try { await navigator.clipboard.writeText(diaPrompt(t)); toast("Copiado con las instrucciones. Pégalo en la IA que quieras."); } catch (er) { toast("No se ha podido copiar."); } };
  if ($("#dmic")) $("#dmic").onclick = () => { const b = $("#dmic"); b.classList.add("on"); const base = ta.value ? ta.value.replace(/\s*$/, " ") : "";
    listen(t => { ta.value = base + t; }, t => { b.classList.remove("on"); ta.value = base + (Array.isArray(t) ? t[0] : t); store(); }, () => b.classList.remove("on")); };
  $("#dfix").onclick = async () => {
    const t = ta.value.trim(); if (!t) { toast("Escribe algo primero."); return; }
    store(); const out = $("#dout");
    if (!aiOk) { out.innerHTML = `<p class="note">Primero descarga un modelo en <button class="linkb" data-go="ai">IA del dispositivo</button>. Tu texto ya está guardado.</p>`; return; }
    const b = $("#dfix"); b.disabled = true; out.innerHTML = `<p class="muted">Preparando la IA…</p>`;
    try {
      await aiEnsure(); out.innerHTML = `<p class="muted">La IA está corrigiendo…</p>`;
      const r = await aiComplete([{ role: "system", content: "Sei un insegnante di italiano preciso. Segui il formato richiesto alla lettera." }, { role: "user", content: diaPrompt(t) }],
        { onToken: x => { out.innerHTML = `<div class="note small">${esc(x).replace(/\n/g, "<br>")}</div>`; }, req: { temperature: 0.2, max_tokens: 700 } });
      const p = diaParse(r);
      if (!p.fix) { out.innerHTML = `<div class="note">${esc(r).replace(/\n/g, "<br>")}</div>`; }
      else { store({ fix: p.fix, errs: p.errs, tip: p.tip }); skill("escrit", !p.errs.length); logActivity(5); if (curView === "diary") $("#dout").innerHTML = diaResultHTML(S.dia[k]); }
    } catch (er) { out.innerHTML = `<p class="note err">No se ha podido corregir: ${esc(er.message || er)}</p>`; }
    b.disabled = false;
  };
};
function diaResultHTML(e) {
  return `<h2 class="s">Corrección</h2><div class="note ok speakable"><span class="it">${esc(e.fix)}</span><div style="margin-top:6px">${sayBtn(e.fix, true)}</div></div>
  ${e.errs && e.errs.length ? `<div class="list" style="margin-top:10px">${e.errs.map(([o, c, w]) => `<div class="entry speakable"><div class="grow"><div><s class="muted">${esc(o)}</s> → <span class="it">${esc(c)}</span></div>${w ? `<div class="tr">${esc(w)}</div>` : ""}</div>${addBtn(c, "", "Corrección de «" + o + "»" + (w ? ": " + w : ""))}</div>`).join("")}</div>
  <p class="muted small">Con <b>+</b> conviertes el error en tarjeta: en Repasar verás «Corrección de…» y tendrás que decir la forma correcta.</p>` : `<p class="note ok">¡Sin errores! Bravissimo.</p>`}
  ${e.tip ? `<p class="muted">${esc(e.tip)}</p>` : ""}<p class="muted small">Corrección automática de un modelo pequeño: puede equivocarse. Si algo no te cuadra, búscalo en el manual o en el diccionario.</p>`;
}

/* ---------------------------------------------------------------- CIUDADES */
VIEWS.cities = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const C = CONTENT.cities || [];
  if (params.c == null) {
    $("#view").innerHTML = `<h1 class="v">Ciudades</h1><p class="sub">Guías prácticas para moverte, comer y no meter la pata, con frases útiles para cada ciudad. Los horarios, precios y normas cambian: compruébalos siempre en la web oficial antes de ir.</p>
    <div class="list" style="padding:0">${C.map((c, i) => `<div class="task"><div class="ck"><span class="nico" style="color:var(--acc)">${svg("pin")}</span></div><div class="grow"><div class="t">${esc(c.name)}</div><div class="muted small">${esc(c.region)}</div></div><button class="btn pri" data-go="cities" data-p='{"c":${i}}'>Ver</button></div>`).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-go="trip">${svg("luggage")} Modo viaje</button><button class="btn" data-go="cards">Tarjetas para enseñar</button></div>`;
    return;
  }
  const c = C[params.c]; if (!c) { go("cities", {}, { replace: true }); return; }
  const sec = (t, arr) => `<h2 class="s">${t}</h2><ul class="clist">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  $("#view").innerHTML = `<button class="back" data-go="cities">← Ciudades</button><p class="muted small" style="margin:0">${esc(c.region)}</p><h1 class="v">${esc(c.name)}</h1><p class="sub">${esc(c.intro)}</p>
  ${sec("Moverse", c.moverse)}${sec("Comer", c.comer)}${sec("Qué ver", c.ver)}${sec("Ojo", c.ojo)}
  <h2 class="s">Frases para ${esc(c.name)}</h2><div class="list">${c.frases.map(f => `<div class="entry speakable">${sayBtn(f[0])}<div class="grow"><div class="hw"><span class="it">${esc(f[0])}</span></div><div class="pr">[${esc(f[1])}]</div><div class="tr">${esc(f[2])}</div><div class="meta">${esc(f[3])}</div></div>${addBtn(f[0], f[1], f[2])}</div>`).join("")}</div>
  <p class="muted small" style="margin-top:14px">Información general revisada en octubre de 2026. Lo que cambia a menudo (horarios, precios, obras, reservas obligatorias) no se incluye: consúltalo en la web oficial de cada sitio.</p>`;
};

/* ---------------------------------------------------------------- MODO VIAJE */
VIEWS.trip = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const V = CONTENT.viaje || [];
  $("#view").innerHTML = `<button class="back" data-go="travel">← Viaje</button><h1 class="v">Modo viaje</h1>
  <p class="sub">Las 30 frases imprescindibles, en grande. Toca una para oírla; pulsa <b>Mostrar</b> para enseñarla a pantalla completa.</p>
  ${V.map(([g, ps], gi) => `<h2 class="s">${esc(g)}</h2><div class="tripl">${ps.map((p, k) => `<div class="tripc speakable"><span class="it">${esc(p[0])}</span><div class="pr">[${esc(p[1])}]</div><div class="es">${esc(p[2])}</div>
    <div class="row" style="margin-top:8px">${sayBtn(p[0], true)}<button class="btn small" data-tshow="${gi}.${k}">Mostrar</button><button class="btn small" data-say="${esc(p[0])}" data-slow="1">Despacio</button></div></div>`).join("")}</div>`).join("")}`;
  $("#view").querySelectorAll("[data-tshow]").forEach(b => b.onclick = () => { const [g, k] = b.dataset.tshow.split(".").map(Number); const p = V[g][1][k]; showCard({ it: p[0], es: p[2] }); });
};

/* ---------------------------------------------------------------- COCINA: PARTIDAS Y FICHAS IMPRIMIBLES */
VIEWS.partidas = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const P = CONTENT.partidas || []; const pi = Math.min(params.pt || 0, P.length - 1);
  if (!P.length) { go("kitchen", {}, { replace: true }); return; }
  const p = P[pi];
  $("#view").innerHTML = `<button class="back" data-go="kitchen">← Cocina profesional</button><h1 class="v">Vocabulario por partidas</h1>
  <p class="sub">El italiano que se oye en cada partida de una cocina profesional. Con <b>+</b> lo añades a tus tarjetas.</p>
  <div class="chips">${P.map((x, i) => `<button class="chip" aria-pressed="${i === pi}" data-pt="${i}">${esc(x.name)}</button>`).join("")}</div>
  <div class="row" style="margin-top:12px"><button class="btn small" id="ptall">${svg("speaker")} Escuchar todo</button><button class="btn small" id="ptprint">${svg("printer")} Imprimir</button></div>
  <div class="list" style="margin-top:10px">${p.terms.map(t => `<div class="entry speakable">${sayBtn(t[0], true)}<div class="grow"><span class="it">${esc(t[0])}</span> <span class="pr">[${esc(t[1])}]</span><div class="tr">${esc(t[2])}</div>${t[3] ? `<div class="meta">${esc(t[3])}</div>` : ""}</div>${addBtn(t[0], t[1], t[2])}</div>`).join("")}</div>`;
  $("#view").querySelectorAll("[data-pt]").forEach(b => b.onclick = () => { params.pt = +b.dataset.pt; VIEWS.partidas(); });
  $("#ptall").onclick = () => speakSeq(p.terms.map(t => ({ t: t[0] })));
  $("#ptprint").onclick = () => printSheet(`<h1>${esc(p.name)}</h1><table class="pt"><thead><tr><th>Italiano</th><th>Pronunciación</th><th>Español</th></tr></thead><tbody>${p.terms.map(t => `<tr><td><b>${esc(t[0])}</b></td><td>${esc(t[1])}</td><td>${esc(t[2])}${t[3] ? `<br><small>${esc(t[3])}</small>` : ""}</td></tr>`).join("")}</tbody></table>`);
};
function printSheet(html) {
  let el = $("#printArea"); if (!el) { el = document.createElement("div"); el.id = "printArea"; document.body.appendChild(el); }
  el.innerHTML = html + `<p class="pfoot">Italiano · app personal de Alejandro${PROF.list.length > 1 ? "" : ""} · ${new Date().toLocaleDateString("es-ES")}</p>`;
  document.body.classList.add("printing");
  const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  setTimeout(() => { try { window.print(); } catch (e) { toast("Este navegador no permite imprimir."); } setTimeout(() => { if (!matchMedia("print").matches) done(); }, 1500); }, 60);
}
function recipeSheet(r) {
  return `<div class="rsheet"><h1>${esc(r.t)} <small>· ${esc(r.es_t)}</small></h1><p class="meta">${esc(r.region)} · ${r.serves} raciones · ${esc(r.time)}</p>
  <h2>Ingredienti · Ingredientes</h2><table class="pt"><thead><tr><th>Italiano</th><th>Cantidad</th><th>Español</th></tr></thead><tbody>${r.ing.map(i => `<tr><td><b>${esc(i[0])}</b><br><small>[${esc(i[1])}]</small></td><td>${esc(i[2])}</td><td>${esc(i[3])}</td></tr>`).join("")}</tbody></table>
  <h2>Procedimento · Elaboración</h2><table class="pt steps"><tbody>${r.steps.map((s2, k) => `<tr><td class="n">${k + 1}</td><td>${esc(s2[0])}</td><td>${esc(s2[2])}</td></tr>`).join("")}</tbody></table>
  <h2>Allergeni · Alérgenos</h2><p>${r.all.length ? r.all.map(esc).join(" · ") : "Ninguno de los 14 del Reglamento (UE) 1169/2011."}</p>
  <h2>Lessico · Vocabulario técnico</h2><p>${r.voc.map(v => `<b>${esc(v[0])}</b>: ${esc(v[2])}`).join(" · ")}</p>
  <h2>Note · Notas</h2><p>${esc(r.notes)}</p></div>`;
}

/* ---------------------------------------------------------------- INFORME DE PROGRESO (imprimible) */
VIEWS.cert = () => {
  const r = RT(); const byL = {}; UNITS.forEach(u => { byL[u.lvl] = byL[u.lvl] || [0, 0]; byL[u.lvl][1]++; if ((r.best[u.id] || 0) >= PASS) byL[u.lvl][0]++; });
  const cards = Object.values(S.cards); const known = cards.filter(c => (c.s || 0) >= 21).length; const learning = cards.filter(c => c.n > 0).length;
  const mins = Object.values(S.tm).reduce((a, b) => a + b, 0); const days = Object.keys(S.days).length;
  const avg = o => { const v = Object.values(o).map(x => x.best); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const sk = skillTotals(); const SKN = { vocab: "Vocabulario", ejer: "Ejercicios de gramática", escucha: "Comprensión oral", habla: "Expresión oral", lectura: "Comprensión lectora", escrit: "Expresión escrita (diario)" };
  const name = profName(PROF.list.find(x => x.id === PID)) || "";
  const rows = [
    ["Días de estudio", days], ["Tiempo registrado", mins >= 60 ? `${Math.floor(mins / 60)} h ${Math.round(mins % 60)} min` : `${Math.round(mins)} min`], ["Racha más larga", maxStreak() + " días"],
    ["Palabras y frases estudiadas", learning], ["Palabras consolidadas (no se olvidan en 3 semanas o más)", known], ["Nivel de la app", `${levelOf(xpTotal()).L} (${xpTotal()} XP)`],
    ...Object.entries(byL).map(([l, [a, b]]) => [`Unidades superadas ${l}`, `${a} de ${b}`]),
    ["Lecturas hechas (media)", Object.keys(S.rd).length ? `${Object.keys(S.rd).length} (${avg(S.rd)} %)` : "—"],
    ["Escuchas hechas (media)", Object.keys(S.ls).length ? `${Object.keys(S.ls).length} (${avg(S.ls)} %)` : "—"],
    ["Simulacros de examen (media)", Object.keys(S.ex).length ? `${Object.keys(S.ex).length} (${avg(S.ex)} / 10)` : "—"],
    ["Días de diario escritos", Object.values(S.dia).filter(x => !x.del && x.it).length]];
  const body = `<div class="certbox"><p class="ctop">Informe de progreso · Italiano</p><h1>${esc(name || "Alumno")}</h1><p class="meta">Emitido el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
  <table class="pt"><tbody>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td><b>${esc(String(b))}</b></td></tr>`).join("")}</tbody></table>
  ${Object.keys(sk).length ? `<h2>Aciertos por destreza</h2><table class="pt"><tbody>${Object.entries(sk).filter(([k]) => SKN[k]).map(([k, v]) => `<tr><td>${SKN[k]}</td><td><b>${Math.round(100 * v.ok / Math.max(1, v.n))} %</b> <small>(${v.ok} de ${v.n})</small></td></tr>`).join("")}</tbody></table>` : ""}
  <p class="cnote">Este informe resume la actividad registrada en la app en este dispositivo y en los sincronizados. No es un certificado oficial de nivel: los títulos oficiales los expiden las Escuelas Oficiales de Idiomas y otros organismos acreditados.</p></div>`;
  $("#view").innerHTML = `<button class="back" data-go="progress">← Progreso</button><h1 class="v">Informe de progreso</h1><p class="sub">Un resumen de todo lo que has hecho, para guardarlo en PDF o imprimirlo.</p>
  <div class="row"><button class="btn pri" id="cprint">${svg("printer")} Imprimir o guardar en PDF</button></div><div style="margin-top:14px">${body}</div>
  <p class="muted small">En el iPhone: pulsa Imprimir y, en la vista previa, «Compartir» → «Guardar en Archivos» para tener el PDF.</p>`;
  $("#cprint").onclick = () => printSheet(body);
};

/* ---------------------------------------------------------------- BUSCAR EN TODA LA APP */
let GS_TMR = null;
VIEWS.search = () => {
  $("#view").innerHTML = `<h1 class="v">Buscar en toda la app</h1><p class="sub">Diccionario, frases, verbos, unidades de la ruta, manual, lecturas, escuchas, recetas y ciudades.</p>
  <input type="search" id="gq" placeholder="Escribe en italiano o en español (al menos 3 letras)…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Buscar en toda la app" value="${esc(params.q || "")}">
  <div id="gres" style="margin-top:12px"></div>`;
  const inp = $("#gq");
  const run = async () => {
    const v = inp.value.trim(); params.q = v; const q = norm(v); const out = $("#gres"); if (!out) return;
    if (q.length < 3) { out.innerHTML = `<p class="muted">Ejemplos: «congiuntivo», «aparcar», «forno», «Bologna», «ragù».</p>`; return; }
    await Promise.all([needContent().catch(() => {}), (DATA.ch[0].html ? Promise.resolve() : needManual().catch(() => {}))]);
    if (curView !== "search" || norm(inp.value.trim()) !== q) return;
    const has = t => norm(t || "").includes(q);
    const G = [];
    const res = search(v, "both");
    const good = res ? res.words.filter(w => w[0] >= 60) : [];
    if (good.length) G.push(["Diccionario", good.slice(0, 6).map(([, e]) => `<button class="gsr" data-go="dict" data-p='${esc(JSON.stringify({ q: e.it }))}'><span class="it">${esc(e.it)}</span> <span class="muted">— ${esc(e.es)}</span></button>`), res.words.length >= 40 ? "40+" : res.words.length, { go: "dict", p: { q: v } }]);
    if (res && res.phr && res.phr.length) G.push(["Frases", res.phr.slice(0, 5).map(p => `<button class="gsr" data-say="${esc(p.it)}"><span class="it">${esc(p.it)}</span> <span class="muted">— ${esc(p.es)}</span></button>`), res.phr.length]);
    const vb = new Set((FORMIDX.get(q) || []).map(f => f.vi)); VERBS.forEach((x, i) => { if (norm(x.inf).includes(q) || norm(x.es).includes(q)) vb.add(i); });
    if (vb.size) G.push(["Verbos", [...vb].slice(0, 8).map(i => `<button class="gsr" data-go="verbs" data-p='{"v":${i}}'><span class="it">${esc(VERBS[i].inf)}</span> <span class="muted">— ${esc(VERBS[i].es)}</span></button>`), vb.size]);
    if (typeof TINFO !== "undefined") { const ti = Object.keys(TINFO).filter(t => has(t) || has(TINFO[t].es) || TINFO[t].uso.some(has)); if (ti.length) G.push(["Tiempos verbales", ti.map(t => `<button class="gsr" data-go="tenses" data-p='${esc(JSON.stringify({ t }))}'>${esc(t)} <span class="muted">— ${esc(TINFO[t].es)}</span></button>`), ti.length]); }
    const us = UNITS.map((u, i) => [u, i]).filter(([u]) => has(u.t) || has(u.goal) || u.th.some(h => has(h.replace(/<[^>]+>/g, " "))));
    if (us.length) G.push(["Ruta por niveles", us.slice(0, 6).map(([u, i]) => `<button class="gsr" data-go="unit" data-p='{"u":${i}}'>${esc(u.lvl)} · ${esc(u.t)}</button>`), us.length]);
    if (DATA.ch[0].html) { GS_TXT = GS_TXT || DATA.ch.map(c => norm(c.html.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " "))); const hits = GS_TXT.map((t, i) => [i, t.split(q).length - 1]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
      if (hits.length) G.push(["Manual", hits.slice(0, 6).map(([i, n]) => `<button class="gsr" data-go="manual" data-p='${esc(JSON.stringify({ c: i, hl: v }))}'>${esc(DATA.ch[i].title)} <span class="muted">(${n})</span></button>`), hits.length]); }
    if (window.CONTENT) {
      const C = CONTENT;
      const rd = C.readings.map((r, i) => [r, i]).filter(([r]) => has(r.t) || has(r.es_t) || r.s.some(s2 => has(s2[0]) || has(s2[2])));
      if (rd.length) G.push(["Lecturas", rd.slice(0, 5).map(([r, i]) => `<button class="gsr" data-go="read" data-p='{"r":${i}}'><span class="it">${esc(r.t)}</span> <span class="muted">— ${esc(r.es_t)}</span></button>`), rd.length]);
      const ls = (C.listen || []).map((d, i) => [d, i]).filter(([d]) => has(d.t) || has(d.place) || d.l.some(x => has(x[1]) || has(x[3])));
      if (ls.length) G.push(["Escucha diaria", ls.slice(0, 5).map(([d, i]) => `<button class="gsr" data-go="listen" data-p='{"l":${i}}'><span class="it">${esc(d.t)}</span> <span class="muted">— ${esc(d.place)}</span></button>`), ls.length]);
      const rc = C.recipes.map((r, i) => [r, i]).filter(([r]) => has(r.t) || has(r.es_t) || r.ing.some(x => has(x[0]) || has(x[3])) || r.voc.some(x => has(x[0]) || has(x[2])));
      if (rc.length) G.push(["Recetas", rc.slice(0, 6).map(([r, i]) => `<button class="gsr" data-go="kitchen" data-p='{"r":${i}}'><span class="it">${esc(r.t)}</span> <span class="muted">— ${esc(r.es_t)}</span></button>`), rc.length]);
      const pt = []; (C.partidas || []).forEach((p, pi) => p.terms.forEach(t => { if (has(t[0]) || has(t[2])) pt.push([p, pi, t]); }));
      if (pt.length) G.push(["Partidas de cocina", pt.slice(0, 6).map(([p, pi, t]) => `<button class="gsr" data-go="partidas" data-p='{"pt":${pi}}'><span class="it">${esc(t[0])}</span> <span class="muted">— ${esc(t[2])} · ${esc(p.name)}</span></button>`), pt.length]);
      const ct = (C.cities || []).map((c, i) => [c, i]).filter(([c]) => has(c.name) || [c.intro, ...c.moverse, ...c.comer, ...c.ver, ...c.ojo].some(has) || c.frases.some(f => has(f[0]) || has(f[2])));
      if (ct.length) G.push(["Ciudades", ct.map(([c, i]) => `<button class="gsr" data-go="cities" data-p='{"c":${i}}'>${esc(c.name)} <span class="muted">— ${esc(c.region)}</span></button>`), ct.length]);
    }
    out.innerHTML = G.length ? G.map(([t, items, n, more]) => `<h2 class="s">${t} <span class="muted small">(${n})</span></h2><div class="gsl">${items.join("")}</div>${more && (typeof n === "string" || n > items.length) ? `<button class="linkb small" data-go="${more.go}" data-p='${esc(JSON.stringify(more.p))}'>Ver los ${n} resultados</button>` : ""}`).join("")
      : `<p class="muted">No aparece en ningún sitio. Prueba con otra forma de la palabra o con <button class="linkb" data-go="translate" data-p='${esc(JSON.stringify({ t: v }))}'>Traducir</button>.</p>`;
  };
  inp.addEventListener("input", () => { clearTimeout(GS_TMR); GS_TMR = setTimeout(run, 250); });
  run();
};
let GS_TXT = null;
