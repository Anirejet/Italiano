"use strict";
/* ================================================================ VOCES, CONVERSACIONES GUIADAS, CONVERSACIÓN CON IA Y USUARIOS */
const CONVS = DATA.convs || [];
const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const IS_STANDALONE = !!(window.navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ---------------------------------------------------------------- VOCES */
const VOICE_SAMPLE = "Buongiorno! Vorrei prenotare un tavolo per due persone, alle otto e mezza. Grazie mille.";
function voiceTags(v) {
  const t = [];
  const s = vScore(v);
  if (s >= 5) t.push(["Calidad alta", "ok"]); else if (s < 0) t.push(["Calidad baja", "err"]);
  if (!v.localService) t.push(["Necesita internet", ""]);
  return t;
}
VIEWS.voices = () => {
  if (!VOICES.length) loadVoices();
  const cur = curVoice(); const has = "speechSynthesis" in window;
  $("#view").innerHTML = `<h1 class="v">Voces</h1>
  <p class="sub">La voz la pone tu dispositivo (gratis). Cada dispositivo tiene sus voces: aquí ves las italianas que hay en este y puedes probarlas y elegir.</p>
  ${!has ? `<p class="note err">Este navegador no puede leer en voz alta.</p>` : ""}
  <label class="muted small" for="vtext">Frase de prueba</label>
  <input type="text" id="vtext" value="${esc(VOICE_SAMPLE)}" autocomplete="off" autocapitalize="off" spellcheck="false">
  <h2 class="s">Voces italianas de este dispositivo (${VOICES.length})</h2>
  ${VOICES.length ? `<div class="list">
    <div class="entry"><div class="grow"><b>Automática</b><div class="muted small">La app elige la de mejor calidad (ahora: ${esc(VOICES[0].name)}).</div></div>
      <button class="btn ${!S.set.voice ? "pri" : ""}" data-vuse="">${!S.set.voice ? "En uso" : "Usar"}</button></div>
    ${VOICES.map((v, i) => `<div class="entry"><button class="say" data-vtry="${i}" aria-label="Probar ${esc(v.name)}">${svg("speaker")}</button>
      <div class="grow"><b>${esc(v.name)}</b> <span class="muted small">${esc(v.lang)}</span><div class="tags">${voiceTags(v).map(([l, c]) => `<span class="tag ${c}">${l}</span>`).join("")}</div></div>
      <button class="btn ${S.set.voice === v.voiceURI ? "pri" : ""}" data-vuse="${esc(v.voiceURI)}">${S.set.voice === v.voiceURI ? "En uso" : "Usar"}</button></div>`).join("")}</div>
    <p class="muted small">Voz en uso: <b>${esc(cur ? cur.name : "—")}</b>. Si una voz corta palabras o se queda callada, prueba otra o baja un poco la velocidad en Ajustes.</p>`
  : `<p class="note err">No hay ninguna voz italiana instalada. Sigue los pasos de abajo.</p>`}
  <h2 class="s">Cómo descargar más voces (gratis)</h2>
  <details class="toc" ${IS_IOS ? "open" : ""}><summary>iPhone / iPad</summary><div style="padding:0 14px 12px"><ol class="steps">
    <li>Abre <b>Ajustes</b> del iPhone → <b>Accesibilidad</b> → <b>Contenido leído</b> → <b>Voces</b>.</li>
    <li>Toca <b>Italiano</b>. Verás las voces (por ejemplo Alice, Federica, Luca, Emma…). Toca una para descargarla; si aparece la versión <b>Mejorada</b> o <b>Premium</b>, esa suena mucho mejor (ocupa más: usa wifi).</li>
    <li>Vuelve aquí, <b>cierra la app del todo</b> (desliza hacia arriba desde la lista de apps abiertas) y ábrela otra vez. La nueva voz aparecerá en esta lista.</li></ol>
    <p class="muted small">Aviso: desde iOS 18 hay quien ha comprobado que las apps web no ven las voces Mejoradas o Premium aunque estén descargadas. Es una limitación de Apple, no de esta app. Si la que descargues no aparece aquí, prueba las demás voces básicas (no suenan igual unas que otras).</p></div></details>
  <details class="toc"><summary>Ordenador con Windows</summary><div style="padding:0 14px 12px"><ol class="steps">
    <li><b>La mejor opción:</b> abre la app con el navegador <b>Microsoft Edge</b>. Con internet, Edge ofrece voces italianas «Online (Natural)», mucho más naturales. Aparecerán en esta lista con la etiqueta «Necesita internet».</li>
    <li>Para tener una voz sin internet: <b>Configuración</b> → <b>Hora e idioma</b> → <b>Voz</b> → <b>Agregar voces</b> → <b>Italiano (Italia)</b>. Después cierra y abre el navegador.</li></ol></div></details>
  <details class="toc"><summary>Mac</summary><div style="padding:0 14px 12px"><ol class="steps">
    <li><b>Ajustes del Sistema</b> → <b>Accesibilidad</b> → <b>Contenido leído</b>.</li>
    <li>Junto a <b>Voz del sistema</b>, abre el menú y elige <b>Gestionar voces…</b>. Busca <b>Italiano</b>, marca las voces que quieras (mejor las Mejoradas o Premium) y espera a que se descarguen.</li>
    <li>Cierra y abre el navegador.</li></ol></div></details>
  <details class="toc"><summary>Móvil Android</summary><div style="padding:0 14px 12px"><ol class="steps">
    <li><b>Ajustes</b> → <b>Sistema</b> → <b>Idiomas</b> (o «Idiomas e introducción de texto») → <b>Salida de texto a voz</b>.</li>
    <li>Como motor elige <b>Servicios de voz de Google</b>, toca la rueda ⚙ → <b>Instalar datos de voz</b> → <b>Italiano</b> y descarga una voz.</li>
    <li>Cierra y abre el navegador. (Los nombres de los menús cambian un poco según la marca del móvil.)</li></ol></div></details>`;
  $("#view").querySelectorAll("[data-vtry]").forEach(b => b.onclick = () => speak($("#vtext").value || VOICE_SAMPLE, undefined, VOICES[+b.dataset.vtry]));
  $("#view").querySelectorAll("[data-vuse]").forEach(b => b.onclick = () => { S.set.voice = b.dataset.vuse; save(); const y = window.scrollY; VIEWS.voices(); window.scrollTo(0, y); speak($("#vtext").value || VOICE_SAMPLE); });
};

/* ---------------------------------------------------------------- RECONOCIMIENTO DE VOZ */
let REC = null;
function srProblem() {
  if (!SRClass) return IS_IOS && IS_STANDALONE ? "ios-pwa" : "none";
  return "";
}
function stopListening() { if (REC) { try { REC.abort(); } catch (e) {} REC = null; } const b = $("#micBtn"); if (b) b.classList.remove("on"); }
function listen(onInterim, onFinal, onErr) {
  stopListening(); stopSpeak();
  const r = new SRClass(); REC = r;
  r.lang = "it-IT"; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
  let finals = [], got = false;
  r.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) { got = true; finals = [...res].map(a => a.transcript); }
      else interim += res[0].transcript;
    }
    if (interim) onInterim(interim);
  };
  r.onerror = e => { if (REC !== r) return; REC = null; if (e.error !== "aborted") onErr(e.error); };
  r.onend = () => { if (REC !== r) return; REC = null; if (got) onFinal(finals); else onErr("no-speech"); };
  try { r.start(); } catch (e) { REC = null; onErr("start"); }
}
const SR_MSG = {
  "not-allowed": "No hay permiso para usar el micrófono. Permítelo en los ajustes del navegador (en el iPhone: Ajustes → Safari → Micrófono) y vuelve a intentarlo.",
  "service-not-allowed": "Este navegador no deja usar el reconocimiento de voz aquí. Escribe la respuesta o díctala con el micrófono del teclado.",
  "network": "El reconocimiento de voz necesita internet y ahora no hay conexión. Puedes escribir la respuesta.",
  "no-speech": "No te he oído. Pulsa el micrófono y habla cerca del teléfono.",
  "audio-capture": "No se encuentra ningún micrófono.",
  "language-not-supported": "Este navegador no reconoce italiano. Escribe la respuesta o díctala con el teclado italiano.",
  "start": "No se ha podido activar el micrófono. Vuelve a intentarlo."
};
const DICTATION_TIP = `<b>Dictado con el teclado</b> (funciona en la app instalada): en el iPhone ve a Ajustes → General → Teclado → <b>Teclados → Añadir teclado → Italiano</b> y comprueba que <b>Activar dictado</b> está encendido. Luego, en el cuadro de respuesta, cambia al teclado italiano con el globo 🌐 y pulsa el <b>micrófono del teclado</b>: lo que digas se escribe en italiano.`;

/* ---------------------------------------------------------------- CONVERSACIONES GUIADAS */
function convMatch(texts, keys) {
  let best = null;
  for (const t of texts) {
    const n = " " + norm(t) + " ";
    const miss = keys.filter(g => !g.some(k => n.includes(" " + k + " ")));
    if (!best || miss.length < best.miss.length) best = { t, miss };
  }
  return best;
}
let CV = null;
VIEWS.talk = () => {
  const lv = l => CONVS.filter(c => c.lvl === l);
  const res = S.conv || {};
  const card = c => { const i = CONVS.indexOf(c); const r = res[c.id];
    return `<div class="task ${r && r.best >= 80 ? "done" : ""}"><div class="ck">${r && r.best >= 80 ? "✓" : ""}</div><div class="grow"><div class="t">${esc(c.t)}</div><div class="muted small">${esc(c.intro)}${r ? ` · mejor: ${r.best}%` : ""}</div></div>
    <button class="btn ${r ? "" : "pri"}" data-go="conv" data-p='{"c":${i}}'>${r ? "Repetir" : "Empezar"}</button></div>`; };
  const prob = srProblem();
  $("#view").innerHTML = `<h1 class="v">Conversar</h1>
  <p class="sub">Conversaciones de la vida real. El italiano te habla, tú contestas <b>en voz alta</b> con frases completas y la app comprueba si te ha entendido. Si no hay micrófono, puedes escribir.</p>
  ${prob === "ios-pwa" ? `<p class="note">En la app instalada del iPhone, Apple no permite todavía el reconocimiento de voz de las páginas web. Tienes dos opciones: abrir la app en <b>Safari</b> (ahí sí funciona el micrófono de la app; si sincronizas, tu progreso es el mismo) o usar el dictado del teclado.<br><br>${DICTATION_TIP}</p>`
    : prob === "none" ? `<p class="note">Este navegador no tiene reconocimiento de voz: usa Chrome o Edge en el ordenador, Safari en el iPhone, o el dictado del teclado.</p>` : `<p class="muted small">El reconocimiento de voz lo hace tu navegador (Safari usa el servicio de Apple; Chrome y Edge, el de Google o Microsoft) y necesita internet.</p>`}
  <div class="list menu" style="padding:0 14px;margin:14px 0"><button data-go="aitalk">${svg("chat")}<span><b>Conversación libre con una IA</b><br><span class="muted small">Para hablar de cualquier tema: instrucciones listas para copiar</span></span></button></div>
  ${["A2", "B1"].map(l => lv(l).length ? `<h2 class="s">Nivel ${l}</h2><div class="list" style="padding:0">${lv(l).map(card).join("")}</div>` : "").join("")}`;
};
VIEWS.conv = () => {
  const ci = params.c; const c = CONVS[ci]; if (!c) { go("talk", {}, { replace: true }); return; }
  if (!CV || CV.ci !== ci) CV = { ci, ti: 0, log: [], firstOk: 0, tries: 0, st: null };
  drawConv();
};
function bubbleApp(it, pr, es, showEs) {
  return `<div class="bub them speakable"><div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px">${sayBtn(it, true)}<div class="grow"><span class="it">${esc(it)}</span><div class="pr">[${esc(pr)}]</div>
  ${showEs ? `<div class="muted small">${esc(es)}</div>` : `<button class="linkb small" data-showes>Ver en español</button><div class="muted small" hidden>${esc(es)}</div>`}</div></div></div>`;
}
function drawConv() {
  const c = CONVS[CV.ci]; const done = CV.ti >= c.turns.length; const t = c.turns[CV.ti]; const st = CV.st || (CV.st = {});
  const prob = srProblem();
  const hist = CV.log.map(l => `${bubbleApp(l.it, l.pr, l.es, true)}<div class="bub me ${l.ok ? "ok" : "bad"}"><div class="muted small">Tú${l.ok ? " ✓" : ""}</div>${esc(l.said || "—")}</div>`).join("");
  let cur = "";
  if (!done) {
    cur = `${bubbleApp(t.it, t.pr, t.es, false)}
    <div class="taskbox"><div class="muted small">Tu turno · ${CV.ti + 1} de ${c.turns.length}</div><div class="t">${esc(t.task)}</div>
    ${st.fb ? `<div class="note ${st.ok ? "ok" : "err"}" style="margin-top:10px">${st.fb}</div>` : ""}
    ${st.ok ? `<button class="btn pri big wide" id="cnext" style="margin-top:12px">Seguir</button>` : `
      <div id="live" class="live muted">${esc(st.live || "")}</div>
      ${prob ? "" : `<button class="mic" id="micBtn" aria-label="Pulsa y habla en italiano">${svg("mic")}<span>Pulsa y habla</span></button>`}
      <div class="row" style="margin-top:10px;flex-wrap:nowrap"><input type="text" id="cans" placeholder="${prob ? "Escribe o dicta tu respuesta…" : "…o escríbela aquí"}" autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-label="Tu respuesta"><button class="btn pri" id="csend">Enviar</button></div>
      <div class="row" style="margin-top:10px"><button class="btn small" id="chint">${st.hint ? "Ocultar respuesta modelo" : "Ver respuesta modelo"}</button>${st.tries ? `<button class="btn small" id="cskip">Seguir sin acertar</button>` : ""}</div>
      ${st.hint ? `<div class="note" style="margin-top:10px">${t.ans.map(a => `<div class="speakable" style="margin:4px 0">${sayBtn(a[0], true)} <span class="it">${esc(a[0])}</span> <span class="pr">[${esc(a[1])}]</span></div>`).join("")}</div>` : ""}`}
    ${t.tip ? `<p class="muted small" style="margin-top:10px">💡 ${esc(t.tip)}</p>` : ""}</div>`;
  } else {
    const pct = Math.round(100 * CV.firstOk / c.turns.length);
    cur = `${bubbleApp(c.end[0], c.end[1], c.end[2], true)}
    <div class="taskbox"><div class="t">${pct >= 80 ? "Perfetto!" : pct >= 50 ? "Bene!" : "Sigue practicando"}</div><p>Has acertado a la primera <b>${CV.firstOk} de ${c.turns.length}</b> (${pct}%).</p>
    <div class="row"><button class="btn pri" id="cagain">Repetir</button><button class="btn" data-go="talk">Otras conversaciones</button></div></div>`;
  }
  $("#view").innerHTML = `<div class="row" style="justify-content:space-between"><span class="muted small">${esc(c.place)} · ${esc(c.lvl)}</span><button class="btn small" id="crestart">Empezar de nuevo</button></div>
  <h1 class="v" style="margin-top:4px">${esc(c.t)}</h1><p class="sub">${esc(c.intro)}</p><div class="chat">${hist}${cur}</div>`;
  $("#view").querySelectorAll("[data-showes]").forEach(b => b.onclick = () => { b.nextElementSibling.hidden = false; b.remove(); });
  $("#crestart").onclick = () => { stopListening(); CV = null; VIEWS.conv(); };
  if (done) {
    const pct = Math.round(100 * CV.firstOk / c.turns.length);
    if (!CV.saved) { CV.saved = true; if (!S.conv) S.conv = {}; const old = S.conv[c.id]; S.conv[c.id] = { best: Math.max(pct, old ? old.best : 0), t: Date.now() }; logActivity(); save(); if (S.set.auto) speak(c.end[0]); }
    $("#cagain").onclick = () => { CV = null; VIEWS.conv(); window.scrollTo(0, 0); };
    scrollChat(); return;
  }
  if (!st.spoken && S.set.auto) { st.spoken = true; speak(t.it); }
  if (st.ok) { $("#cnext").onclick = () => { CV.log.push({ it: t.it, pr: t.pr, es: t.es, said: st.said, ok: st.tries === 1 }); CV.ti++; CV.st = null; drawConv(); }; scrollChat(); return; }
  const check = texts => {
    const m = convMatch(texts, t.keys); st.tries = (st.tries || 0) + 1; st.said = m.t; st.live = "";
    const model = `<span class="speakable">${sayBtn(t.ans[0][0], true)} <span class="it">${esc(t.ans[0][0])}</span> <span class="pr">[${esc(t.ans[0][1])}]</span></span>`;
    if (!m.miss.length) {
      st.ok = true; if (st.tries === 1) CV.firstOk++;
      st.fb = `<b>Ti ho capito!</b> Has dicho: «${esc(m.t)}».<br><span class="muted small">Una forma natural de decirlo:</span><br>${model}`;
    } else {
      st.fb = `<b>No te he entendido del todo.</b> He oído: «${esc(m.t)}».<br>${m.miss.length > 1 ? "Faltan palabras como" : "Falta una palabra como"}: ${m.miss.map(g => `<b class="it">${esc(g[0])}</b>`).join(", ")}.<br><span class="muted small">Inténtalo otra vez o mira la respuesta modelo.</span>`;
    }
    S.quiz.n++; if (!m.miss.length && st.tries === 1) S.quiz.ok++; save();
    drawConv();
  };
  const inp = $("#cans");
  $("#csend").onclick = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } check([v]); };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") $("#csend").click(); });
  $("#chint").onclick = () => { st.hint = !st.hint; drawConv(); };
  if ($("#cskip")) $("#cskip").onclick = () => { CV.log.push({ it: t.it, pr: t.pr, es: t.es, said: st.said, ok: false }); CV.ti++; CV.st = null; drawConv(); };
  const mic = $("#micBtn");
  if (mic) mic.onclick = () => {
    if (REC) { stopListening(); return; }
    mic.classList.add("on"); mic.querySelector("span").textContent = "Te escucho… (toca para parar)"; $("#live").textContent = "";
    listen(txt => { const l = $("#live"); if (l) l.textContent = "«" + txt + "»"; }, finals => check(finals),
      err => { const m2 = $("#micBtn"); if (m2) { m2.classList.remove("on"); m2.querySelector("span").textContent = "Pulsa y habla"; }
        const l = $("#live"); if (l) l.innerHTML = `<span style="color:var(--rosso)">${SR_MSG[err] || "No se ha podido usar el micrófono (" + esc(err) + ")."}</span>${err === "service-not-allowed" || err === "language-not-supported" ? "<br>" + DICTATION_TIP : ""}`; });
  };
  scrollChat();
}
function scrollChat() { const tb = $(".taskbox"); if (tb && CV && (CV.ti > 0 || CV.st && CV.st.tries)) setTimeout(() => { const y = tb.getBoundingClientRect().top + window.scrollY - 160; if (y > window.scrollY) window.scrollTo({ top: y, behavior: "smooth" }); }, 50); }

/* ---------------------------------------------------------------- CONVERSACIÓN LIBRE CON UNA IA */
const AI_ROLES = [
  ["Camarero en una trattoria de Florencia", "un camarero de una trattoria de Florencia; yo soy un cliente"],
  ["Recepcionista de hotel en Roma", "el recepcionista de un hotel de Roma; yo acabo de llegar"],
  ["Compañero de mesa en un tren", "un italiano simpático que viaja a mi lado en el tren de Florencia a Roma"],
  ["Chef de una cocina italiana", "el chef de una cocina profesional en Italia; yo soy un profesor de cocina español que hace unas prácticas de una semana"],
  ["Charla libre sobre comida", "un amigo italiano con el que hablo de comida, recetas y costumbres de Italia y de España"],
];
function aiPrompt(role, level) {
  return `Quiero practicar italiano hablando contigo. Soy hispanohablante (español de España) y mi nivel es ${level}.
Reglas:
1. Habla SOLO en italiano, con frases claras y no muy largas, de nivel ${level}.
2. Haz de ${role}. Empieza tú la conversación.
3. Después de cada respuesta mía, si he cometido algún error, dime primero la frase corregida en italiano y una explicación muy breve en español. Luego sigue la conversación.
4. Si digo «non capisco», repite más despacio y con palabras más sencillas.
5. Hazme preguntas para que yo tenga que hablar con frases completas.
6. Cuando diga «basta», hazme un resumen en español de mis errores más repetidos y de 5 expresiones útiles que deba aprender.`;
}
VIEWS.aitalk = () => {
  const ri = params.r || 0, lv = params.l || "A2-B1";
  const txt = aiPrompt(AI_ROLES[ri][1], lv);
  $("#view").innerHTML = `<h1 class="v">Conversación libre con una IA</h1>
  <p class="sub">Para hablar de cualquier cosa y que te entiendan y respondan como una persona hace falta una inteligencia artificial: eso no puede hacerlo esta app gratis y sin internet. Lo que sí puedes hacer gratis es usar una app de IA con conversación por voz y darle estas instrucciones.</p>
  <h2 class="s">1 · Elige la situación</h2><div class="chips">${AI_ROLES.map(([l], i) => `<button class="chip" aria-pressed="${i === ri}" data-ar="${i}">${esc(l)}</button>`).join("")}</div>
  <h2 class="s">2 · Elige tu nivel</h2><div class="seg" role="group">${["A2", "A2-B1", "B1", "B2"].map(l => `<button data-al="${l}" aria-pressed="${l === lv}">${l}</button>`).join("")}</div>
  <h2 class="s">3 · Copia las instrucciones</h2><textarea id="aitxt" rows="11" data-noacc>${esc(txt)}</textarea>
  <div class="row" style="margin-top:10px"><button class="btn pri" id="aicopy">Copiar</button></div>
  <h2 class="s">4 · Pégalas en una app de IA y habla</h2><ol class="steps">
  <li>Por ejemplo, en la app de <b>Claude</b> (iPhone o Android): pega las instrucciones, envíalas y luego toca el icono de <b>ondas de sonido</b> que hay junto al micrófono para hablar en modo voz. Es gratuito, aunque el plan gratis tiene límites de uso.</li>
  <li>En los ajustes de la app de IA, si permite elegir el idioma de la voz, pon <b>italiano</b> para que te entienda mejor.</li>
  <li>Otras apps de IA con conversación por voz funcionan igual con estas mismas instrucciones.</li></ol>
  <p class="muted small">La IA puede equivocarse alguna vez al corregir: si algo te extraña, compruébalo en el manual o en el diccionario de la app.</p>`;
  $("#view").querySelectorAll("[data-ar]").forEach(b => b.onclick = () => { params.r = +b.dataset.ar; VIEWS.aitalk(); });
  $("#view").querySelectorAll("[data-al]").forEach(b => b.onclick = () => { params.l = b.dataset.al; VIEWS.aitalk(); });
  $("#aicopy").onclick = async () => {
    const t = $("#aitxt").value;
    try { await navigator.clipboard.writeText(t); toast("Copiado. Ahora pégalo en la app de IA."); }
    catch (e) { const ta = $("#aitxt"); ta.focus(); ta.select(); try { document.execCommand("copy"); toast("Copiado."); } catch (e2) { toast("Mantén pulsado el texto y elige Copiar."); } }
  };
};

/* ---------------------------------------------------------------- USUARIOS */
function profilesHTML() {
  return `<div id="profBox"><h2 class="s">Usuarios de este dispositivo</h2>
  <p class="muted small">Cada usuario tiene su propio progreso (ruta, tarjetas, guardadas, lectura…) y su propia sincronización. Si cada persona usa su propio móvil, no hace falta crear usuarios: basta con que cada uno ponga su nombre aquí.</p>
  <div class="list">${PROF.list.map(p => `<div class="entry"><div class="grow">${p.id === PID
      ? `<label class="muted small" for="pname">Tu nombre (usuario actual)</label><input type="text" id="pname" data-noacc value="${esc(p.name)}" placeholder="${esc(profName(p))}" autocomplete="off">`
      : `<b>${esc(profName(p))}</b>`}</div>
    ${p.id === PID ? `<span class="tag ok">En uso</span>` : `<button class="btn" data-pgo="${p.id}">Cambiar a este</button><button class="btn small" data-pdel="${p.id}" aria-label="Borrar ${esc(profName(p))}">Borrar</button>`}</div>`).join("")}</div>
  ${PROF.list.length < 5 ? `<div class="row" style="margin-top:10px;flex-wrap:nowrap"><input type="text" id="pnew" data-noacc placeholder="Nombre del nuevo usuario" autocomplete="off"><button class="btn" id="padd">Añadir usuario</button></div>` : ""}
  ${PROF.list.length > 1 ? `<label class="row" style="margin-top:12px"><input type="checkbox" id="pask" ${PROF.ask ? "checked" : ""} style="width:24px;height:24px"> <span>Preguntar quién va a estudiar cada vez que se abre la app</span></label>` : ""}</div>`;
}
function bindProfiles() {
  const pn = $("#pname"); if (pn) pn.onchange = () => { PROF.list.find(p => p.id === PID).name = pn.value.trim().slice(0, 30); saveProf(); toast("Nombre guardado."); };
  const add = $("#padd"); if (add) add.onclick = () => {
    const name = $("#pnew").value.trim().slice(0, 30); if (!name) { $("#pnew").focus(); toast("Escribe el nombre."); return; }
    let n = 2; while (PROF.list.some(p => p.id === "p" + n)) n++;
    PROF.list.push({ id: "p" + n, name }); if (PROF.list.length === 2) PROF.ask = true; saveProf();
    if (confirm(`Usuario «${name}» creado. ¿Cambiar a ese usuario ahora?`)) switchProfile("p" + n); else { const y = window.scrollY; render(); window.scrollTo(0, y); }
  };
  $("#view").querySelectorAll("[data-pgo]").forEach(b => b.onclick = () => switchProfile(b.dataset.pgo));
  $("#view").querySelectorAll("[data-pdel]").forEach(b => b.onclick = () => {
    const p = PROF.list.find(x => x.id === b.dataset.pdel);
    if (!confirm(`¿Borrar el usuario «${profName(p)}» y todo su progreso en este dispositivo? (Si lo tenía sincronizado, su copia de GitHub no se borra.)`)) return;
    const suf = p.id === "p1" ? "" : "." + p.id;
    ["italiano.app.v1", "italiano.sync", "italiano.recent"].forEach(k => { try { localStorage.removeItem(k + (k === "italiano.recent" ? "." + p.id : suf)); } catch (e) {} });
    PROF.list = PROF.list.filter(x => x !== p); saveProf(); const y = window.scrollY; render(); window.scrollTo(0, y);
  });
  const ask = $("#pask"); if (ask) ask.onchange = () => { PROF.ask = ask.checked; saveProf(); };
}
function showPicker(force) {
  if (PROF.list.length < 2) return;
  if (!force) { let picked = null; try { picked = sessionStorage.getItem("italiano.picked"); } catch (e) {} if (picked || !PROF.ask) return; }
  closeOverlay();
  const o = document.createElement("div"); o.className = "ovl"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Elegir usuario");
  o.innerHTML = `<div class="ovl-box" style="max-width:420px;margin-top:12vh"><h2 class="s" style="margin-top:0">¿Quién va a estudiar?</h2>
  <div style="display:grid;gap:10px">${PROF.list.map(p => `<button class="btn ${p.id === PID ? "pri" : ""} big wide" data-pick="${p.id}">${svg("user")} ${esc(profName(p))}</button>`).join("")}</div></div>`;
  OVL_Y = window.scrollY; document.body.appendChild(o); document.body.classList.add("noscroll");
  o.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { try { sessionStorage.setItem("italiano.picked", "1"); } catch (e) {} if (b.dataset.pick === PID) closeOverlay(); else switchProfile(b.dataset.pick); });
}
setTimeout(() => showPicker(false), 50);
