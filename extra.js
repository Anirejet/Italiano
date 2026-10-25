"use strict";
/* ================================================================ v1.6: PRONUNCIACIÓN, DICTADO, LECTURAS, EXÁMENES, COCINA, TARJETAS, PRUEBA DE NIVEL, RECORDATORIO */

/* ---------------------------------------------------------------- utilidades comunes */
function speakSeq(lines, rate) {
  /* lines: [{t, who}] → lee una tras otra; cada hablante con una voz distinta si hay varias */
  if (!("speechSynthesis" in window)) { toast("Este navegador no puede leer en voz alta."); return Promise.resolve(); }
  if (!VOICES.length) loadVoices();
  stopSpeak(); const gen = SPGEN; const ss = speechSynthesis;
  const who = [...new Set(lines.map(l => l.who || ""))]; const base = curVoice();
  const others = VOICES.filter(v => v !== base);
  const voiceFor = w => { const i = who.indexOf(w || ""); return i <= 0 || !others.length ? base : others[(i - 1) % others.length]; };
  const parts = []; lines.forEach(l => chunks(cleanSpeak(l.t)).forEach(c => parts.push({ t: c, v: voiceFor(l.who), pitch: who.indexOf(l.who || "") % 2 && !others.length ? 1.15 : 1 })));
  return new Promise(res => {
    const say = k => {
      if (gen !== SPGEN || k >= parts.length) { res(); return; }
      const u = new SpeechSynthesisUtterance(parts[k].t); u.lang = "it-IT"; u.rate = rate || S.set.rate; u.pitch = parts[k].pitch; if (parts[k].v) u.voice = parts[k].v;
      SPQ = [u]; u.onend = () => setTimeout(() => say(k + 1), 180); u.onerror = e => { if (e.error === "interrupted" || e.error === "canceled") res(); else say(k + 1); };
      ss.speak(u);
    };
    setTimeout(() => say(0), 120);
  });
}
const toks = s => norm(s).split(" ").filter(Boolean);
/* Alinea palabras esperadas con las dichas/escritas (subsecuencia común más larga, aceptando pequeñas diferencias). */
function alignWords(expected, got) {
  const nw = w => norm(String(w).replace(/['’`]/g, ""));
  const E = String(expected).split(/\s+/).filter(Boolean), en = E.map(nw), gn = String(got).split(/\s+/).map(nw).filter(Boolean);
  const near = (a, b) => a === b || (a.length > 3 && lev(a, b, 1) <= 1);
  const n = en.length, m = gn.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = near(en[i], gn[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const res = E.map(w => ({ w, ok: false, got: "" })); let i = 0, j = 0;
  while (i < n && j < m) { if (near(en[i], gn[j])) { res[i].ok = true; res[i].got = gn[j]; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return res.filter(r => nw(r.w));
}
function startRecorder(onStop) {
  if (!navigator.mediaDevices || !window.MediaRecorder) return Promise.reject(new Error("Este navegador no puede grabar audio."));
  return navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const rec = new MediaRecorder(stream); const chunks2 = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks2.push(e.data); };
    rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); onStop(new Blob(chunks2, { type: rec.mimeType || "audio/mp4" })); };
    rec.start(); return rec;
  });
}
function fmtTime(sec) { const m = Math.floor(sec / 60), s2 = sec % 60; return m + ":" + String(s2).padStart(2, "0"); }

/* ---------------------------------------------------------------- PRONUNCIACIÓN: escucha y repite */
function pronSources() {
  const src = [["viaje", "Frases de viaje", PHR.map(p => [p.it, p.pr, p.es])]];
  ["A1", "A2", "B1", "B2"].forEach(l => src.push(["u" + l, "Ejemplos de la ruta " + l, (DATA.units || []).filter(u => u.lvl === l).flatMap(u => u.exm)]));
  const mine = Object.values(S.notes).filter(n => !n.del).map(n => [n.it, n.pr || pronText(n.it).pr, n.es]);
  if (mine.length) src.push(["mis", "Mis frases", mine]);
  return src;
}
VIEWS.pron = () => {
  const src = pronSources(); const k = params.s || "viaje"; const cur = src.find(x => x[0] === k) || src[0];
  if (params.i == null) params.i = Math.floor(Math.random() * cur[2].length);
  const it = cur[2][params.i % cur[2].length]; const prob = srProblem();
  $("#view").innerHTML = `<h1 class="v">Pronunciación</h1><p class="sub">Escucha la frase, repítela en voz alta y la app te dice qué palabras ha entendido. Si una palabra no la reconoce, es probable que un italiano tampoco la entienda bien.</p>
  <div class="chips">${src.map(x => `<button class="chip" aria-pressed="${x[0] === cur[0]}" data-ps="${x[0]}">${esc(x[1])}</button>`).join("")}</div>
  <div class="hero speakable" style="margin-top:14px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(it[0])}<div class="grow">
    <div style="font-family:var(--serif);font-size:1.35rem"><span class="it">${esc(it[0])}</span></div><div class="pr">[${esc(it[1])}]</div><div class="muted">${esc(it[2])}</div>
    <div class="row" style="margin-top:8px"><button class="btn small" data-say="${esc(it[0])}" data-slow="1">Despacio</button></div></div></div></div>
  ${prob ? `<p class="note" style="margin-top:12px">${prob === "ios-pwa" ? "En la app instalada del iPhone no hay reconocimiento de voz: dicta la frase con el micrófono del teclado italiano en el cuadro de abajo (o abre la app en Safari)." : "Este navegador no reconoce la voz: dicta con el micrófono del teclado en el cuadro de abajo."}</p>`
    : `<button class="mic" id="pmic">${svg("mic")}<span>Pulsa y repite</span></button>`}
  <div class="row" style="margin-top:10px;flex-wrap:nowrap"><input type="text" id="pans" placeholder="…o dicta / escribe lo que dices" autocomplete="off" spellcheck="false"><button class="btn" id="pchk">Comprobar</button></div>
  <div id="pres" style="margin-top:12px"></div>
  <div class="row" style="margin-top:14px"><button class="btn pri" id="pnext">Otra frase →</button></div>`;
  $("#view").querySelectorAll("[data-ps]").forEach(b => b.onclick = () => { params.s = b.dataset.ps; params.i = null; VIEWS.pron(); });
  $("#pnext").onclick = () => { params.i = Math.floor(Math.random() * cur[2].length); VIEWS.pron(); window.scrollTo(0, 0); };
  const show = said => {
    const al = alignWords(it[0], said); const okN = al.filter(r => r.ok).length; const pct = Math.round(100 * okN / Math.max(1, al.length));
    $("#pres").innerHTML = `<div class="note ${pct >= 85 ? "ok" : pct >= 60 ? "" : "err"}"><b>${pct >= 85 ? "Molto bene!" : pct >= 60 ? "Quasi!" : "Riprova"}</b> · ${pct}% de las palabras reconocidas.<br>
      <div style="font-family:var(--serif);font-size:1.25rem;margin:8px 0">${al.map(r => `<span class="${r.ok ? "wok" : "wbad"}">${esc(r.w)}</span>`).join(" ")}</div>
      <span class="muted small">He entendido: «${esc(said)}». Las palabras en rojo: escúchalas despacio y repítelas solas.</span></div>`;
    if (typeof fx === "function") { fx(pct >= 85); skill("habla", pct >= 85); } logActivity(); save();
  };
  $("#pchk").onclick = () => { const v = $("#pans").value.trim(); if (v) show(v); };
  const mic = $("#pmic");
  if (mic) mic.onclick = () => {
    if (REC) { stopListening(); return; }
    mic.classList.add("on"); mic.querySelector("span").textContent = "Te escucho…";
    listen(t => { $("#pres").innerHTML = `<p class="live muted">«${esc(t)}»</p>`; }, finals => { mic.classList.remove("on"); mic.querySelector("span").textContent = "Pulsa y repite";
      let best = finals[0], bs = -1; finals.forEach(f => { const s2 = alignWords(it[0], f).filter(r => r.ok).length; if (s2 > bs) { bs = s2; best = f; } }); show(best); },
      err => { mic.classList.remove("on"); mic.querySelector("span").textContent = "Pulsa y repite"; $("#pres").innerHTML = `<p class="note err">${SR_MSG[err] || esc(err)}</p>`; });
  };
};

/* ---------------------------------------------------------------- DICTADO */
let DT = null;
function dictPool(k) {
  if (k === "viaje") return PHR.map(p => [p.it, p.pr, p.es]);
  if (k && k[0] === "u") return (DATA.units || []).filter(u => u.lvl === k.slice(1)).flatMap(u => u.exm);
  if (k && k[0] === "l" && window.CONTENT) return CONTENT.readings.filter(r => r.lvl === k.slice(1)).flatMap(r => r.s);
  return PHR.map(p => [p.it, p.pr, p.es]);
}
function dictCompare(expected, typed) {
  const al = alignWords(expected, typed); const tw = String(typed).split(/\s+/).filter(Boolean);
  const exact = new Set(tw.map(w => w.toLowerCase().replace(/[.,;:!?¡¿«»"]/g, "").replace(/’/g, "'")));
  let pts = 0;
  const out = al.map(r => { const clean = r.w.toLowerCase().replace(/[.,;:!?¡¿«»"]/g, "").replace(/’/g, "'");
    let c = "wbad"; if (r.ok) { if (exact.has(clean)) { c = "wok"; pts += 1; } else if (r.got === norm(String(r.w).replace(/['’`]/g, ""))) { c = "wacc"; pts += 0.75; } else { c = "wnear"; pts += 0.5; } } return `<span class="${c}">${esc(r.w)}</span>`; });
  return { html: out.join(" "), pct: Math.round(100 * pts / Math.max(1, al.length)) };
}
VIEWS.dictation = () => {
  if (params.k && params.k[0] === "l" && !window.CONTENT) { lazyView(needContent()); return; }
  if (!DT || DT.k !== (params.k || "viaje")) {
    const k = params.k || "viaje"; const pool = dictPool(k).filter(x => x[0].split(" ").length <= 14);
    DT = { k, items: shuffle(pool.slice()).slice(0, 8), i: 0, pts: 0, done: false, res: null };
  }
  const opts = [["viaje", "Frases de viaje"], ["uA1", "Ruta A1"], ["uA2", "Ruta A2"], ["uB1", "Ruta B1"], ["uB2", "Ruta B2"], ["lA2", "Lecturas A2"], ["lB1", "Lecturas B1"], ["lB2", "Lecturas B2"]];
  const head = `<h1 class="v">Dictado</h1><p class="sub">Escucha la frase (las veces que quieras) y escríbela. La corrección marca en verde lo correcto, en amarillo los fallos de acento y en rojo lo que falta o está mal.</p>
  <div class="chips">${opts.map(([k, l]) => `<button class="chip" aria-pressed="${DT.k === k}" data-dk="${k}">${l}</button>`).join("")}</div>`;
  if (DT.i >= DT.items.length) {
    const pct = Math.round(DT.pts / DT.items.length);
    $("#view").innerHTML = head + `<div class="stats" style="margin-top:14px"><div class="stat"><b>${pct}%</b><span>nota media del dictado</span></div></div><button class="btn pri big wide" id="dagain" style="margin-top:14px">Otro dictado</button>`;
    $("#dagain").onclick = () => { DT = null; VIEWS.dictation(); };
  } else {
    const it = DT.items[DT.i];
    $("#view").innerHTML = head + `<div class="card" style="margin-top:14px"><div class="muted small">Frase ${DT.i + 1} de ${DT.items.length}</div>
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn pri" id="dplay">${svg("speaker")} Escuchar</button><button class="btn" id="dslow">Despacio</button></div></div>
      <textarea id="dans" rows="2" style="margin-top:14px" placeholder="Escribe lo que oyes…" autocapitalize="sentences" spellcheck="false" ${DT.res ? "disabled" : ""}>${esc(DT.val || "")}</textarea>
      ${DT.res ? `<div class="note ${DT.res.pct >= 85 ? "ok" : DT.res.pct >= 60 ? "" : "err"}" style="margin-top:12px"><b>${DT.res.pct}%</b><div style="font-family:var(--serif);font-size:1.2rem;margin:6px 0">${DT.res.html}</div><span class="pr">[${esc(it[1])}]</span><div class="muted">${esc(it[2])}</div></div>
        <button class="btn pri big wide" id="dnext" style="margin-top:12px">Siguiente</button>` : `<button class="btn pri big wide" id="dchk" style="margin-top:12px">Corregir</button>`}`;
    $("#dplay").onclick = () => speak(it[0]); $("#dslow").onclick = () => speak(it[0], 0.6);
    if (!DT.res && !DT.spoken) { DT.spoken = true; setTimeout(() => speak(it[0]), 300); }
    if ($("#dchk")) $("#dchk").onclick = () => { const v = $("#dans").value; if (!v.trim()) { $("#dans").focus(); return; } DT.val = v; DT.res = dictCompare(it[0], v); DT.pts += DT.res.pct; S.quiz.n++; if (DT.res.pct >= 85) S.quiz.ok++; if (typeof fx === "function") { fx(DT.res.pct >= 85); skill("escucha", DT.res.pct >= 85); } logActivity(); save(); VIEWS.dictation(); };
    if ($("#dnext")) $("#dnext").onclick = () => { DT.i++; DT.res = null; DT.val = ""; DT.spoken = false; VIEWS.dictation(); window.scrollTo(0, 0); };
  }
  $("#view").querySelectorAll("[data-dk]").forEach(b => b.onclick = () => { params.k = b.dataset.dk; DT = null; VIEWS.dictation(); });
};

/* ---------------------------------------------------------------- LECTURAS GRADUADAS */
/* frase de la lectura en la que aparece una palabra clave (para la tarjeta) */
function readingCtx(r, w) {
  const stem = norm(w).replace(/^(il|lo|la|i|gli|le|l'|un|uno|una|un')\s*/, "").replace(/\s*\(.*\)$/, "").split(/[ \/]/)[0];
  const k = stem.length > 4 ? stem.slice(0, stem.length - 1) : stem;
  return r.s.find(s2 => norm(s2[0]).includes(k)) || null;
}
VIEWS.read = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const R = CONTENT.readings;
  if (params.r == null) {
    $("#view").innerHTML = `<h1 class="v">Lecturas</h1><p class="sub">Textos cortos sobre Italia, su cocina y sus costumbres, con audio frase a frase, traducción al tocar cada frase y preguntas de comprensión.</p>
    ${["A2", "B1", "B2"].map(l => `<h2 class="s">Nivel ${l}</h2><div class="list" style="padding:0">${R.map((r, i) => [r, i]).filter(([r]) => r.lvl === l).map(([r, i]) => { const st = S.rd[r.id];
      return `<div class="task ${st && st.best >= 80 ? "done" : ""}"><div class="ck">${st && st.best >= 80 ? "✓" : ""}</div><div class="grow"><div class="t"><span class="it">${esc(r.t)}</span></div><div class="muted small">${esc(r.es_t)} · ${esc(r.topic)}${st ? ` · ${st.best}%` : ""}</div></div>
      <button class="btn ${st ? "" : "pri"}" data-go="read" data-p='{"r":${i}}'>${st ? "Releer" : "Leer"}</button></div>`; }).join("")}</div>`).join("")}`;
    return;
  }
  const r = R[params.r]; if (!r) { go("read", {}, { replace: true }); return; }
  const ans = params.ans || {};
  const done = params.done;
  $("#view").innerHTML = `<p class="muted small" style="margin:0">${esc(r.lvl)} · ${esc(r.topic)}</p><h1 class="v speakable"><span class="it">${esc(r.t)}</span></h1><p class="sub">${esc(r.es_t)}</p>
  <div class="row"><button class="btn pri" id="rall">${svg("speaker")} Escuchar todo</button><button class="btn" id="rslow">Despacio</button><button class="btn" id="rtr">${params.tr ? "Ocultar" : "Ver"} traducción</button></div>
  <div class="reading speakable">${r.s.map((s2, k) => `<p class="rs" data-rs="${k}"><span class="it-text">${esc(s2[0])}</span>${params.tr ? `<span class="rtr">${esc(s2[2])}</span>` : ""}</p>`).join("")}</div>
  <p class="muted small">Toca una frase para oírla; mantén pulsada una palabra para buscarla.</p>
  <h2 class="s">Palabras clave</h2><p class="muted small" style="margin-top:-6px">Con <b>+</b> la añades a tus tarjetas de repaso junto con la frase de la lectura en la que aparece.</p><div class="list">${r.w.map(w => { const cx = readingCtx(r, w[0]);
    return `<div class="entry speakable">${sayBtn(w[0], true)}<div class="grow"><span class="it">${esc(w[0])}</span> <span class="pr">[${esc(w[1])}]</span><div class="tr">${esc(w[2])}</div></div>${addBtn(w[0], w[1], w[2], cx && cx[0], cx && cx[2])}</div>`; }).join("")}</div>
  <h2 class="s">Comprensión</h2>${r.q.map((q, qi) => `<div class="qbox"><div class="t">${qi + 1}. ${esc(q[0])}</div><div class="opts">${q[1].map((o, oi) => `<button class="opt ${done ? (oi === q[2] ? "good" : (ans[qi] === oi ? "bad" : "")) : (ans[qi] === oi ? "sel" : "")}" data-q="${qi}" data-o="${oi}" ${done ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
    ${done ? `<p class="muted small">${esc(q[3])}</p>` : ""}</div>`).join("")}
  ${done ? `<div class="note ${done >= 80 ? "ok" : ""}">Resultado: <b>${done}%</b>.</div><div class="row" style="margin-top:10px"><button class="btn" id="ragain">Repetir preguntas</button><button class="btn pri" data-go="read">Otras lecturas</button></div>`
    : `<button class="btn pri big wide" id="rchk" style="margin-top:12px">Corregir</button>`}`;
  const lines = r.s.map(s2 => ({ t: s2[0] }));
  $("#rall").onclick = () => speakSeq(lines); $("#rslow").onclick = () => speakSeq(lines, 0.65);
  $("#rtr").onclick = () => { params.tr = !params.tr; const y = window.scrollY; VIEWS.read(); window.scrollTo(0, y); };
  $("#view").querySelectorAll("[data-rs]").forEach(p => p.addEventListener("click", () => { if (String(window.getSelection())) return; speak(r.s[+p.dataset.rs][0]); }));
  $("#view").querySelectorAll("[data-q]").forEach(b => b.onclick = () => { const a = Object.assign({}, params.ans || {}); a[b.dataset.q] = +b.dataset.o; params.ans = a; const y = window.scrollY; VIEWS.read(); window.scrollTo(0, y); });
  if ($("#rchk")) $("#rchk").onclick = () => {
    if (Object.keys(ans).length < r.q.length) { toast("Responde todas las preguntas."); return; }
    const ok = r.q.filter((q, i) => ans[i] === q[2]).length; const pct = Math.round(100 * ok / r.q.length);
    params.done = pct; const old = S.rd[r.id]; S.rd[r.id] = { best: Math.max(pct, old ? old.best : 0), t: Date.now() };
    S.quiz.n += r.q.length; S.quiz.ok += ok; if (typeof fx === "function") { for (let k = 0; k < r.q.length; k++) skill("lectura", k < ok); fx(pct >= 80 ? undefined : pct >= 60); if (pct >= 80) confetti(); } logActivity(5); save(); const y = window.scrollY; VIEWS.read(); window.scrollTo(0, y);
  };
  if ($("#ragain")) $("#ragain").onclick = () => { params.ans = {}; params.done = 0; delete params.done; VIEWS.read(); };
};

/* ---------------------------------------------------------------- EXÁMENES TIPO EOI */
let EXS = null; let EXTMR = null;
VIEWS.exam = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  clearInterval(EXTMR);
  const EX = CONTENT.exams;
  if (params.e == null) {
    $("#view").innerHTML = `<h1 class="v">Exámenes tipo EOI</h1><p class="sub">Simulacros con la estructura de las pruebas de certificación de las Escuelas Oficiales de Idiomas de Andalucía. Las comprensiones se corrigen solas; la expresión escrita y oral se autoevalúan con un modelo y una lista de criterios${typeof aiEngine === "function" ? " (o con la IA del dispositivo, si la tienes preparada)" : ""}.</p>
    <div class="list" style="padding:0">${EX.map((e, i) => { const st = S.ex[e.id];
      return `<div class="task"><div class="ck">${st ? "✓" : ""}</div><div class="grow"><div class="t">${esc(e.t)}</div><div class="muted small">${e.parts.length} partes${st ? ` · mejor media: ${st.best.toFixed(1)}` : ""}</div></div><button class="btn pri" data-go="exam" data-p='{"e":${i}}'>Abrir</button></div>`; }).join("")}</div>
    <p class="muted small" style="margin-top:14px">Estructura tomada de la Guía del candidato de las EOI de Andalucía (EOI de Chiclana, curso 2022-23). Comprueba en tu escuela la convocatoria del curso actual.</p>`;
    return;
  }
  const e = EX[params.e]; if (!EXS || EXS.id !== e.id) EXS = { id: e.id, sc: {}, ans: {}, txt: {}, chk: {}, rec: {} };
  if (params.p == null) {
    const sc = EXS.sc; const names = e.parts.map(p => p.t);
    const vals = e.parts.map((p, i) => sc[i]); const doneAll = vals.every(v => v != null);
    const avg = doneAll ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    $("#view").innerHTML = `<h1 class="v">${esc(e.t)}</h1><p class="sub">${esc(e.intro)}</p>
    <div class="list" style="padding:0">${e.parts.map((p, i) => `<div class="task ${sc[i] != null ? "done" : ""}"><div class="ck">${sc[i] != null ? "✓" : i + 1}</div><div class="grow"><div class="t">${esc(p.t)}</div>
      <div class="muted small">${p.tasks.length} tareas${p.min ? ` · ${p.min} min` : ""}${sc[i] != null ? ` · nota: <b>${sc[i].toFixed(1)}</b>` : ""}</div></div><button class="btn ${sc[i] != null ? "" : "pri"}" data-go="exam" data-p='{"e":${params.e},"p":${i}}'>${sc[i] != null ? "Repetir" : "Hacer"}</button></div>`).join("")}</div>
    ${doneAll ? `<div class="note ${avg >= 6.5 && vals.every(v => v >= 5) ? "ok" : "err"}" style="margin-top:14px">Media: <b>${avg.toFixed(1)}</b>. ${avg >= 6.5 && vals.every(v => v >= 5) ? "Con estos resultados aprobarías (al menos un 5 en cada parte y media de 6,5 o más)." : "Para aprobar hace falta al menos un 5 en cada parte y una media de 6,5 o más."}</div>` : `<p class="muted small" style="margin-top:12px">Haz las ${names.length} partes para ver la media.</p>`}`;
    if (doneAll) { const old = S.ex[e.id]; if (!old || avg > old.best) { S.ex[e.id] = { best: Math.round(avg * 10) / 10, t: Date.now() }; save(); } }
    return;
  }
  const pi = params.p, p = e.parts[pi]; const key = pi; const t0 = EXS["t" + pi] || (EXS["t" + pi] = Date.now());
  const done = EXS.sc[pi] != null && params.rev;
  let body = "";
  p.tasks.forEach((t, ti) => {
    body += `<h2 class="s">${esc(t.t)}</h2><p class="muted">${esc(t.ins)}</p>`;
    if (t.audio) {
      body += `<div class="row"><button class="btn pri" data-play="${ti}">${svg("speaker")} Escuchar (${(EXS["pl" + pi + "_" + ti] || 0)}/2)</button>${done ? `<button class="btn" data-trans="${ti}">Ver transcripción</button>` : ""}</div>
      <div class="trans" id="tr${ti}" hidden>${t.audio.map(a => `<p class="speakable"><b>${esc(a[0])}:</b> <span class="it">${esc(a[1])}</span></p>`).join("")}</div>`;
    }
    if (t.text) body += `<div class="extext">${t.text.split(/\n\n+/).map(par => `<p>${esc(par).replace(/\n/g, "<br>")}</p>`).join("")}</div>`;
    if (t.source) body += `<div class="extext src"><div class="muted small">Texto de partida</div>${t.source.split(/\n+/).map(par => `<p>${esc(par)}</p>`).join("")}</div>`;
    if (t.items) body += t.items.map((it, ii) => { const a = (EXS.ans[pi] || {})[ti + "_" + ii];
      return `<div class="qbox"><div class="t">${esc(it.q)}</div><div class="opts">${it.o.map((o, oi) => `<button class="opt ${done ? (oi === it.a ? "good" : (a === oi ? "bad" : "")) : (a === oi ? "sel" : "")}" data-ea="${ti}_${ii}" data-o="${oi}" ${done ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div></div>`; }).join("");
    if (p.k === "pcte") {
      const v = (EXS.txt[pi] || {})[ti] || ""; const wc = v.trim() ? v.trim().split(/\s+/).length : 0;
      body += `<textarea rows="9" data-tx="${ti}" placeholder="Escribe aquí tu texto en italiano…" ${done ? "disabled" : ""}>${esc(v)}</textarea><div class="muted small" id="wc${ti}">${wc} palabras (pedidas: ${t.words[0]}–${t.words[1]})</div>`;
      if (done) body += modelAndCheck(pi, ti, t, v);
    }
    if (p.k === "pcto") {
      const rec = EXS.rec[pi + "_" + ti];
      body += `<p class="muted small">Preparación: ${t.prep} min · Intervención: ${t.speak[0]}–${t.speak[1]} min.</p>
      <div class="row"><button class="btn pri" data-rec="${ti}">${svg("mic")} ${EXS.recOn === pi + "_" + ti ? "Parar grabación" : "Grabarme"}</button>${rec ? `<audio controls src="${rec}"></audio>` : ""}</div>`;
      if (done) body += modelAndCheck(pi, ti, t, "");
    }
  });
  $("#view").innerHTML = `<p class="muted small" style="margin:0">${esc(e.t)}</p><h1 class="v">${esc(p.t)}</h1>
  <div class="timer" id="extimer">${p.min ? `Tiempo: <b id="exel">0:00</b> de ${p.min}:00` : `Tiempo: <b id="exel">0:00</b>`}</div>${body}
  ${done ? `<div class="note ok" style="margin-top:14px">Nota de esta parte: <b>${EXS.sc[pi].toFixed(1)}</b> sobre 10.</div><div class="row" style="margin-top:10px"><button class="btn pri" data-go="exam" data-p='{"e":${params.e}}'>Volver al examen</button><button class="btn" id="exredo">Repetir esta parte</button></div>`
    : `<button class="btn pri big wide" id="exfin" style="margin-top:16px">${p.k === "pcte" || p.k === "pcto" ? "Terminar y ver el modelo" : "Corregir"}</button>`}`;
  const tick = () => { const el = $("#exel"); if (!el) { clearInterval(EXTMR); return; } const sec = Math.round((Date.now() - t0) / 1000); el.textContent = fmtTime(sec); if (p.min && sec > p.min * 60) el.style.color = "var(--rosso)"; };
  if (!done) { tick(); EXTMR = setInterval(tick, 1000); } else $("#extimer").remove();
  $("#view").querySelectorAll("[data-play]").forEach(b => b.onclick = async () => {
    const ti = +b.dataset.play, k = "pl" + pi + "_" + ti; if (!done && (EXS[k] || 0) >= 2) { toast("En el examen cada audio se escucha dos veces."); return; }
    EXS[k] = (EXS[k] || 0) + 1; b.innerHTML = `${svg("speaker")} Escuchando…`; b.disabled = true;
    await speakSeq(p.tasks[ti].audio.map(a => ({ t: a[1], who: a[0] })));
    b.disabled = false; b.innerHTML = `${svg("speaker")} Escuchar (${EXS[k]}/2)`;
  });
  $("#view").querySelectorAll("[data-trans]").forEach(b => b.onclick = () => { const el = $("#tr" + b.dataset.trans); el.hidden = !el.hidden; });
  $("#view").querySelectorAll("[data-ea]").forEach(b => b.onclick = () => { EXS.ans[pi] = EXS.ans[pi] || {}; EXS.ans[pi][b.dataset.ea] = +b.dataset.o; b.parentNode.querySelectorAll(".opt").forEach(x => x.classList.toggle("sel", x === b)); });
  $("#view").querySelectorAll("[data-tx]").forEach(ta => ta.addEventListener("input", () => { EXS.txt[pi] = EXS.txt[pi] || {}; EXS.txt[pi][ta.dataset.tx] = ta.value; const wc = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; $("#wc" + ta.dataset.tx).textContent = `${wc} palabras (pedidas: ${p.tasks[ta.dataset.tx].words[0]}–${p.tasks[ta.dataset.tx].words[1]})`; }));
  $("#view").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => {
    const k = pi + "_" + b.dataset.rec;
    if (EXS.recOn === k && EXS.recorder) { EXS.recorder.stop(); return; }
    startRecorder(blob => { EXS.recOn = null; EXS.recorder = null; EXS.rec[k] = URL.createObjectURL(blob); const y = window.scrollY; VIEWS.exam(); window.scrollTo(0, y); })
      .then(rec => { EXS.recorder = rec; EXS.recOn = k; b.innerHTML = `${svg("mic")} Parar grabación`; b.classList.add("rec"); })
      .catch(err => toast(err.name === "NotAllowedError" ? "No hay permiso para usar el micrófono." : (err.message || "No se ha podido grabar.")));
  });
  $("#view").querySelectorAll("[data-ck]").forEach(c => c.onchange = () => { const [ti2, ci] = c.dataset.ck.split("_"); EXS.chk[pi] = EXS.chk[pi] || {}; EXS.chk[pi][ti2] = EXS.chk[pi][ti2] || {}; EXS.chk[pi][ti2][ci] = c.checked; scoreProductive(pi, p); const el = $(".note.ok b"); if (el) el.textContent = EXS.sc[pi].toFixed(1); });
  $("#view").querySelectorAll("[data-aicorr]").forEach(b => b.onclick = () => aiCorrect(b, p.tasks[+b.dataset.aicorr], (EXS.txt[pi] || {})[b.dataset.aicorr] || ""));
  if ($("#exredo")) $("#exredo").onclick = () => { delete EXS.sc[pi]; delete EXS.ans[pi]; delete EXS.txt[pi]; delete EXS.chk[pi]; delete EXS["t" + pi]; p.tasks.forEach((_, ti) => delete EXS["pl" + pi + "_" + ti]); params.rev = 0; delete params.rev; VIEWS.exam(); window.scrollTo(0, 0); };
  if ($("#exfin")) $("#exfin").onclick = () => {
    if (p.k === "cto" || p.k === "cte") {
      let ok = 0, n = 0; p.tasks.forEach((t, ti) => (t.items || []).forEach((it, ii) => { n++; if ((EXS.ans[pi] || {})[ti + "_" + ii] === it.a) ok++; }));
      EXS.sc[pi] = Math.round(100 * ok / Math.max(1, n)) / 10; S.quiz.n += n; S.quiz.ok += ok;
      if (typeof skill === "function") for (let k = 0; k < n; k++) skill(p.k === "cto" ? "escucha" : "lectura", k < ok);
    } else scoreProductive(pi, p);
    logActivity(10); save(); clearInterval(EXTMR); params.rev = 1; VIEWS.exam(); window.scrollTo(0, 0);
  };
};
function modelAndCheck(pi, ti, t, written) {
  const ck = ((EXS.chk[pi] || {})[ti]) || {};
  return `<div class="note" style="margin-top:10px"><div class="muted small">Respuesta modelo</div><div class="speakable" style="margin-top:6px">${sayBtn(t.model[0], true)} <span class="it">${esc(t.model[0])}</span></div><div class="pr" style="margin-top:6px">[${esc(t.model[1])}]</div></div>
  ${written && typeof aiEngine === "function" ? `<p><button class="btn" data-aicorr="${ti}">Corregir mi texto con la IA del dispositivo</button></p><div id="aic${ti}"></div>` : ""}
  <div class="checks"><div class="muted small">Autoevaluación: marca lo que has conseguido</div>${t.check.map((c, ci) => `<label class="row" style="flex-wrap:nowrap;margin:6px 0"><input type="checkbox" data-ck="${ti}_${ci}" ${ck[ci] ? "checked" : ""} style="width:22px;height:22px;flex:none"> <span>${esc(c)}</span></label>`).join("")}</div>`;
}
function scoreProductive(pi, p) {
  let got = 0, tot = 0; p.tasks.forEach((t, ti) => t.check.forEach((c, ci) => { tot++; if (((EXS.chk[pi] || {})[ti] || {})[ci]) got++; }));
  EXS.sc[pi] = Math.round(100 * got / Math.max(1, tot)) / 10;
}

/* ---------------------------------------------------------------- COCINA PROFESIONAL */
VIEWS.kitchen = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const K = CONTENT.recipes;
  if (params.al) {
    $("#view").innerHTML = `<h1 class="v">Los 14 alérgenos</h1><p class="sub">Denominaciones del anexo II del Reglamento (UE) 1169/2011, tal como aparecen en las cartas italianas, con su nombre en español y qué buscar.</p>
    <div class="list">${CONTENT.allergens.map(a => `<div class="entry speakable">${sayBtn(a[0])}<div class="grow"><div class="hw"><span class="it">${esc(a[0])}</span></div><div class="pr">[${esc(a[1])}]</div><div class="tr">${esc(a[2])}</div><div class="meta">${esc(a[3])}</div></div></div>`).join("")}</div>`;
    return;
  }
  if (params.r == null) {
    $("#view").innerHTML = `<h1 class="v">Cocina profesional</h1><p class="sub">Recetas tradicionales en su versión canónica, en italiano con audio y traducción, con su vocabulario técnico y alérgenos.</p>
    <div class="row"><button class="btn" data-go="kitchen" data-p='{"al":1}'>Los 14 alérgenos en italiano</button><button class="btn" data-go="dict" data-p='{"cat":"cocina profesional"}'>Vocabulario de cocina profesional</button>${CONTENT.partidas ? `<button class="btn" data-go="partidas">Vocabulario por partidas</button>` : ""}</div>
    <div class="list" style="padding:0;margin-top:14px">${K.map((r, i) => `<div class="task"><div class="grow"><div class="t"><span class="it">${esc(r.t)}</span></div><div class="muted small">${esc(r.es_t)} · ${esc(r.region)} · ${esc(r.time)}</div></div><button class="btn pri" data-go="kitchen" data-p='{"r":${i}}'>Ver</button></div>`).join("")}</div>`;
    return;
  }
  const r = K[params.r];
  $("#view").innerHTML = `<p class="muted small" style="margin:0">${esc(r.region)} · ${r.serves} raciones · ${esc(r.time)}</p><h1 class="v speakable"><span class="it">${esc(r.t)}</span></h1><p class="sub">${esc(r.es_t)} <span class="pr">[${esc(r.tp)}]</span></p>
  <div class="row"><button class="btn small" id="kprint">${svg("printer")} Ficha bilingüe para imprimir o PDF</button></div>
  <h2 class="s">Ingredienti</h2><div class="list">${r.ing.map(i => `<div class="entry speakable">${sayBtn(i[0], true)}<div class="grow"><span class="it">${esc(i[0])}</span> <span class="muted">· ${esc(i[2])}</span><div class="pr">[${esc(i[1])}]</div><div class="tr">${esc(i[3])}</div></div></div>`).join("")}</div>
  <h2 class="s">Procedimento</h2><div class="row" style="margin-bottom:8px"><button class="btn small" id="kall">${svg("speaker")} Escuchar todos los pasos</button></div>
  <ol class="steps speakable">${r.steps.map(s2 => `<li><span class="it">${esc(s2[0])}</span><div class="pr">[${esc(s2[1])}]</div><div class="muted">${esc(s2[2])}</div></li>`).join("")}</ol>
  <h2 class="s">Alérgenos</h2><div class="chips">${r.all.map(a => `<span class="chip">${esc(a)}</span>`).join("") || `<span class="muted">Ninguno de los 14 del reglamento.</span>`}</div>
  <h2 class="s">Vocabulario técnico</h2><div class="list">${r.voc.map(v => `<div class="entry speakable">${sayBtn(v[0], true)}<div class="grow"><span class="it">${esc(v[0])}</span> <span class="pr">[${esc(v[1])}]</span><div class="tr">${esc(v[2])}</div></div>${addBtn(v[0], v[1], v[2])}</div>`).join("")}</div>
  <h2 class="s">Notas</h2><p>${esc(r.notes)}</p>`;
  $("#kall").onclick = () => speakSeq(r.steps.map(s2 => ({ t: s2[0] })));
  $("#kprint").onclick = () => printSheet(recipeSheet(r));
};

/* ---------------------------------------------------------------- TARJETAS PARA ENSEÑAR */
function allCards() {
  const base = (window.CONTENT ? CONTENT.cards : []).map((c, i) => ({ id: "c" + i, t: c[0], it: c[1], es: c[3] }));
  const mine = Object.entries(S.ucards).filter(([, c]) => !c.del).sort((a, b) => b[1].t - a[1].t).map(([id, c]) => ({ id, t: c.ti, it: c.it, es: c.es, mine: true }));
  return mine.concat(base);
}
function showCard(c) {
  closeOverlay();
  const o = document.createElement("div"); o.className = "ovl bigcard"; o.setAttribute("role", "dialog");
  o.innerHTML = `<div class="bigcard-box"><div class="bigcard-it">${esc(c.it)}</div><div class="bigcard-es">${esc(c.es)}</div>
  <div class="row" style="justify-content:center;margin-top:18px"><button class="btn" id="bcs">${svg("speaker")} Leer en voz alta</button><button class="btn pri" id="bcx">Cerrar</button></div></div>`;
  OVL_Y = window.scrollY; document.body.appendChild(o); document.body.classList.add("noscroll");
  $("#bcs").onclick = () => speak(c.it); $("#bcx").onclick = closeOverlay;
}
VIEWS.cards = () => {
  if (!window.CONTENT) { lazyView(needContent()); return; }
  const cs = allCards();
  $("#view").innerHTML = `<h1 class="v">Tarjetas para enseñar</h1><p class="sub">Toca una tarjeta y se abre en grande para enseñársela al camarero, al taxista o al farmacéutico. Puedes crear las tuyas (por ejemplo con la dirección de tu hotel).</p>
  <div class="list" style="padding:0">${cs.map(c => `<div class="task"><div class="grow"><div class="t">${esc(c.t)}${c.mine ? ` <span class="tag ok">tuya</span>` : ""}</div><div class="muted small it-text">${esc(c.it.slice(0, 90))}${c.it.length > 90 ? "…" : ""}</div></div>
    <button class="btn pri" data-card="${c.id}">Mostrar</button>${c.mine ? `<button class="btn small" data-cdel="${c.id}">Borrar</button>` : `<button class="btn small" data-ccopy="${c.id}">Copiar y editar</button>`}</div>`).join("")}</div>
  <h2 class="s">Crear una tarjeta</h2>
  <input type="text" id="nct" placeholder="Título (en español)" data-noacc autocomplete="off">
  <textarea id="ncit" rows="3" style="margin-top:8px" placeholder="Texto en italiano (puedes usar Traducir para prepararlo)"></textarea>
  <textarea id="nces" rows="2" style="margin-top:8px" placeholder="Traducción en español" data-noacc></textarea>
  <button class="btn pri" id="ncok" style="margin-top:8px">Guardar tarjeta</button>`;
  $("#view").querySelectorAll("[data-card]").forEach(b => b.onclick = () => showCard(cs.find(c => c.id === b.dataset.card)));
  $("#view").querySelectorAll("[data-cdel]").forEach(b => b.onclick = () => { if (!confirm("¿Borrar esta tarjeta?")) return; S.ucards[b.dataset.cdel] = { del: true, t: Date.now() }; save(); VIEWS.cards(); });
  $("#view").querySelectorAll("[data-ccopy]").forEach(b => b.onclick = () => { const c = cs.find(x => x.id === b.dataset.ccopy); $("#nct").value = c.t + " (mía)"; $("#ncit").value = c.it; $("#nces").value = c.es; $("#ncit").scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("#ncok").onclick = () => {
    const t = $("#nct").value.trim(), it = $("#ncit").value.trim(), es2 = $("#nces").value.trim();
    if (!t || !it) { toast("Pon al menos el título y el texto en italiano."); return; }
    S.ucards["k" + hash(t + it + Date.now())] = { ti: t, it, es: es2, t: Date.now() }; save(); toast("Tarjeta guardada."); VIEWS.cards();
  };
};

/* ---------------------------------------------------------------- RECORDATORIO DIARIO (.ics para el calendario) */
function reminderICS(hh, mm, mins) {
  const now = new Date(); const pad = n => String(n).padStart(2, "0");
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hh, mm);
  const end = new Date(start.getTime() + mins * 60000);
  const loc = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Italiano app//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    "UID:italiano-" + Date.now() + "@app", "DTSTAMP:" + stamp, "DTSTART:" + loc(start), "DTEND:" + loc(end), "RRULE:FREQ=DAILY",
    "SUMMARY:Italiano: plan de hoy", "DESCRIPTION:Abre la app de italiano y haz las tareas de Hoy.",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Italiano: plan de hoy", "TRIGGER:PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
async function downloadReminder(hh, mm, mins) {
  const file = new File([reminderICS(hh, mm, mins)], "italiano-recordatorio.ics", { type: "text/calendar" });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Recordatorio de italiano" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  const url = URL.createObjectURL(file); const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast("Abre el archivo descargado para añadirlo al calendario.");
}
function reminderHTML() {
  return `<div id="remBox"><h2 class="s">Recordatorio diario</h2><p class="muted small">Una app web gratuita no puede enviar avisos por sí sola. La solución: un evento diario en el calendario de tu móvil, con aviso, que te recuerda estudiar.</p>
  <div class="row"><label for="remt" class="muted small">Hora</label><input type="time" id="remt" value="19:00" style="width:auto"><label for="remd" class="muted small">Duración</label><select id="remd" style="width:auto">${[20, 30, 40, 60].map(n => `<option value="${n}" ${n === 30 ? "selected" : ""}>${n} min</option>`).join("")}</select><button class="btn" id="remgo">Crear recordatorio</button></div>
  <p class="muted small">En el iPhone: si al pulsar no se abre el calendario, abre la app en Safari y vuelve a pulsar; Safari ofrece «Añadir al calendario».</p></div>`;
}
function bindReminder() { const b = $("#remgo"); if (b) b.onclick = () => { const [h, m] = ($("#remt").value || "19:00").split(":").map(Number); downloadReminder(h, m, +$("#remd").value); }; }

/* ---------------------------------------------------------------- PRUEBA DE NIVEL (usa los ejercicios de la ruta) */
function startPlacement() {
  const pick = u => { const xs = u.x.map((x, xi) => [x, xi]).filter(([x]) => x.k === "ch" || x.k === "fi" || x.k === "li"); return xs[Math.floor(Math.random() * xs.length)]; };
  const items = []; for (let i = 0; i < UNITS.length; i += 2) { const p = pick(UNITS[i]); if (p) items.push({ ui: i, xi: p[1], x: p[0] }); }
  UX = { mode: "place", items, i: 0, ok: 0, st: {}, hist: [] };
  pushHist(); curView = "uex"; params = {}; nav(); drawEx(); window.scrollTo(0, 0);
}
function placementNext() {
  /* se para tras 3 fallos en los últimos 4 ejercicios */
  const h = UX.hist; const last = h.slice(-4); const stop = last.length >= 3 && last.filter(x => !x).length >= 3;
  UX.i++; UX.st = {};
  if (!stop && UX.i < UX.items.length) { drawEx(); window.scrollTo(0, 0); return; }
  let start = UX.items.length ? UX.items[Math.min(UX.i, UX.items.length) - 1].ui : 0;
  const firstFail = h.findIndex((ok, k) => !ok && h.slice(k, k + 4).filter(x => !x).length >= 2);
  if (firstFail >= 0) start = UX.items[firstFail].ui; else if (!stop) start = UNITS.length - 1;
  start = Math.max(0, Math.min(start, UNITS.length - 1));
  const u = UNITS[start];
  const html = `<h1 class="v">Resultado de la prueba</h1><p class="sub">Has acertado ${UX.ok} de ${h.length} ejercicios.</p>
  <div class="note ok">Te recomiendo empezar en la <b>unidad ${start + 1}</b> (${esc(u.lvl)}): ${esc(u.t)}.</div>
  <p class="muted small">Si aceptas, las unidades anteriores quedan marcadas como superadas (convalidadas) y se desbloquea esa. Siempre puedes volver a hacerlas.</p>
  <div class="row"><button class="btn pri" id="plok">Empezar en la unidad ${start + 1}</button><button class="btn" data-go="route">Ahora no</button></div>`;
  UX = null; curView = "uresult"; params = {}; nav(); $("#view").innerHTML = html; window.scrollTo(0, 0);
  $("#plok").onclick = () => { const r = RT(); for (let i = 0; i < start; i++) if ((r.best[UNITS[i].id] || 0) < PASS) r.best[UNITS[i].id] = PASS; save(); go("unit", { u: start }); };
}
