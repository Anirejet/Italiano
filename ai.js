"use strict";
/* ================================================================ IA LOCAL: conversación libre que funciona dentro del dispositivo
   Usa WebLLM (código abierto, licencia Apache 2.0): el modelo se descarga una vez y después funciona sin internet.
   Nada de lo que escribes o dices sale del dispositivo. */
const AI_MODELS = [
  { id: "Llama-3.2-3B-Instruct", mb: 2264, name: "Ligero", rec: "móvil", desc: "Llama 3.2 3B (Meta). El italiano es uno de sus idiomas oficiales. Recomendado en el iPhone." },
  { id: "Qwen3-4B", mb: 3432, name: "Completo", rec: "ordenador", desc: "Qwen 3 4B (Alibaba). Conversa y corrige mejor. Recomendado en el ordenador.", think: true },
  { id: "Llama-3.1-8B-Instruct", mb: 5001, name: "Grande", rec: "ordenador potente", desc: "Llama 3.1 8B (Meta). El mejor de los cuatro, pero necesita un ordenador con buena tarjeta gráfica." },
  { id: "Llama-3.2-1B-Instruct", mb: 879, name: "Mínimo", rec: "móviles antiguos", desc: "Llama 3.2 1B. Solo si los demás no funcionan: entiende poco y se equivoca a menudo." },
];
const AI_LS = "italiano.ai";
let AIC = (() => { try { return JSON.parse(localStorage.getItem(AI_LS)) || {}; } catch (e) { return {}; } })();
function saveAIC() { try { localStorage.setItem(AI_LS, JSON.stringify(AIC)); } catch (e) {} }
let AIE = null, AIE_ID = "", AI_LOADING = false, AI_PROG = "", AI_GPU = null, AI_CHAT = null, AI_BUSY = false;
const aiEngine = () => AIE;
const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent) || IS_IOS;
const fullId = (m, f16) => `${m.id}-${f16 ? "q4f16_1" : "q4f32_1"}-MLC`;
const gb = mb => (mb / 1024).toFixed(1).replace(".", ",") + " GB";

async function aiCheckGPU() {
  if (AI_GPU) return AI_GPU;
  if (window.__AI_MOCK) return (AI_GPU = { ok: true, f16: true });
  if (!navigator.gpu) return (AI_GPU = { ok: false, why: "nogpu" });
  try { const ad = await navigator.gpu.requestAdapter(); if (!ad) return (AI_GPU = { ok: false, why: "noadapter" }); return (AI_GPU = { ok: true, f16: ad.features.has("shader-f16") }); }
  catch (e) { return (AI_GPU = { ok: false, why: "noadapter" }); }
}
async function aiLoad(m) {
  const g = await aiCheckGPU(); const id = fullId(m, g.f16);
  if (AIE && AIE_ID === id) return AIE;
  AI_LOADING = true; AI_PROG = "Preparando…"; drawAIStatus();
  try {
    if (AIE && AIE.unload) { try { await AIE.unload(); } catch (e) {} }
    AIE = null;
    if (window.__AI_MOCK) { AIE = window.__AI_MOCK; }
    else {
      const lib = await import("./vendor/web-llm.js");
      const worker = new Worker(new URL("./ai-worker.js", location.href), { type: "module" });
      AIE = await lib.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: r => { AI_PROG = r.text || ""; AIC.pct = Math.round((r.progress || 0) * 100); drawAIStatus(); } });
    }
    AIE_ID = id; AIC.model = m.id; AIC.ready = Object.assign({}, AIC.ready, { [id]: true }); saveAIC();
    return AIE;
  } catch (e) {
    AIE = null; const msg = String(e && e.message || e);
    AI_PROG = /memory|out of memory|device.*lost|allocation|OOM|QuotaExceeded/i.test(msg)
      ? "No hay memoria suficiente para este modelo en este dispositivo. Prueba con uno más pequeño."
      : /network|fetch|Failed to fetch/i.test(msg) ? "No se ha podido descargar (comprueba la conexión). Puedes volver a pulsar: continúa donde se quedó."
      : "No se ha podido preparar la IA: " + msg;
    throw e;
  } finally { AI_LOADING = false; drawAIStatus(); }
}
function drawAIStatus() { const el = $("#aistat"); if (!el) return; el.innerHTML = AI_LOADING ? `<div class="bar" style="margin:8px 0"><i style="width:${AIC.pct || 0}%"></i></div><p class="muted small">${esc(AI_PROG)}</p>` : (AI_PROG ? `<p class="note err">${esc(AI_PROG)}</p>` : ""); }

async function aiComplete(messages, opts = {}) {
  const req = Object.assign({ messages, temperature: 0.7, max_tokens: 260, stream: !!opts.onToken }, opts.req || {});
  req.extra_body = { enable_thinking: false };
  if (opts.onToken) {
    let out = ""; const it = await AIE.chat.completions.create(req);
    for await (const ch of it) { const d = ch.choices && ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content || ""; if (d) { out += d; opts.onToken(cleanAI(out)); } }
    return cleanAI(out);
  }
  const r = await AIE.chat.completions.create(req); return cleanAI(r.choices[0].message.content || "");
}
const cleanAI = t => String(t).replace(/<think>[\s\S]*?(<\/think>|$)/g, "").replace(/^\s+/, "");
function aiSplit(text, userText) {
  /* separa la línea de corrección («CORREZIONE: … // …») de la respuesta */
  const lines = String(text).split(/\n+/); let corr = null; const rest = [];
  for (const l of lines) { const m = l.match(/^\s*\**\s*(correzione|corrección|correccion)\s*\**\s*[:：]\s*(.+)$/i); if (m && !corr) { const [c, why] = m[2].split(/\s*\/\/\s*|\s+—\s+|\s+-\s+(?=[A-ZÁÉÍÓÚa-z])/); corr = { c: c.replace(/^["«]|["»]$/g, "").trim(), why: (why || "").trim() }; } else rest.push(l); }
  if (corr && (!userText || norm(corr.c) === norm(userText))) corr = null;   /* sin mensaje del alumno no hay nada que corregir */
  return { corr, reply: rest.join("\n").trim() };
}
function aiSystem(role, level, correct) {
  return `Sei ${role}. Stai parlando con Alejandro, uno spagnolo che sta imparando l'italiano (livello ${level}).
Regole:
1. Rispondi sempre e solo in italiano, con frasi semplici e brevi (al massimo tre frasi), adatte al livello ${level}.
2. Resta nel tuo ruolo e alla fine fai una domanda per continuare la conversazione.
3. ${correct ? "Se l'ultimo messaggio di Alejandro contiene errori di grammatica o di vocabolario, scrivi PRIMA una riga che comincia con «CORREZIONE:», con la frase corretta, poi « // » e una spiegazione brevissima in spagnolo. Poi vai a capo e continua la conversazione. Se il messaggio è corretto, non scrivere la riga CORREZIONE." : "Non correggere gli errori: continua solo la conversazione."}
4. Niente emoji, niente elenchi.`;
}
const AI_ROLES2 = [
  ["Camarero en una trattoria", "un cameriere simpatico di una trattoria di Firenze; Alejandro è un cliente che vuole cenare"],
  ["Recepcionista de hotel", "il receptionist di un albergo di Roma; Alejandro è appena arrivato"],
  ["Viajero en el tren", "un italiano che viaggia accanto ad Alejandro sul treno da Firenze a Roma e vuole fare due chiacchiere"],
  ["Chef de una cocina", "lo chef di una cucina professionale italiana; Alejandro è un insegnante di cucina spagnolo che fa una settimana di stage nella tua cucina"],
  ["Farmacéutico", "un farmacista di Bologna; Alejandro entra perché non si sente bene"],
  ["Amigo italiano", "un amico italiano di Alejandro che chiacchiera con lui di cucina, viaggi e vita quotidiana"],
  ["Profesor de italiano", "un insegnante di italiano paziente che fa domande ad Alejandro per farlo parlare"],
];

VIEWS.ai = () => {
  const level = AIC.level || "A2-B1";
  if (AIE && AI_CHAT) return drawAIChat();
  const ready = AIC.ready || {};
  $("#view").innerHTML = `<h1 class="v">Conversar con la IA</h1>
  <p class="sub">Una inteligencia artificial que funciona <b>dentro de tu dispositivo</b>: gratis, sin cuenta y sin enviar nada a internet. Se descarga una vez y después funciona sin conexión.</p>
  <div id="aigpu" class="muted small">Comprobando si este dispositivo puede usarla…</div>
  <h2 class="s">1 · Elige el modelo</h2>
  <div class="list" style="padding:0">${AI_MODELS.map(m => { const isR = Object.keys(ready).some(k => k.indexOf(m.id + "-") === 0);
    return `<label class="task" style="cursor:pointer"><input type="radio" name="aim" value="${m.id}" ${(AIC.model || (isMobile ? AI_MODELS[0].id : AI_MODELS[1].id)) === m.id ? "checked" : ""} style="width:22px;height:22px;flex:none">
    <div class="grow"><div class="t">${esc(m.name)} <span class="muted small">· para ${esc(m.rec)} · ${gb(m.mb)}</span>${isR ? ` <span class="tag ok">descargado</span>` : ""}</div><div class="muted small">${esc(m.desc)}</div></div></label>`; }).join("")}</div>
  <p class="muted small">El tamaño es la memoria que necesita mientras funciona; la descarga es parecida. Hazla con wifi y con la pantalla encendida. Si el dispositivo no tiene memoria suficiente, aparecerá un aviso: prueba entonces con uno más pequeño.</p>
  <h2 class="s">2 · Con quién hablas</h2><div class="chips">${AI_ROLES2.map(([l], i) => `<button class="chip" aria-pressed="${(AIC.role || 0) === i}" data-air="${i}">${esc(l)}</button>`).join("")}</div>
  <div class="row" style="margin-top:12px"><label class="muted small" for="ailv">Nivel</label><select id="ailv" style="width:auto">${["A2", "A2-B1", "B1", "B2"].map(l => `<option ${l === level ? "selected" : ""}>${l}</option>`).join("")}</select>
  <label class="row" style="gap:6px"><input type="checkbox" id="aicorr" ${AIC.corr !== false ? "checked" : ""} style="width:22px;height:22px"> <span>Corregir mis errores</span></label></div>
  <button class="btn pri big wide" id="aigo" style="margin-top:16px">Empezar la conversación</button>
  <div id="aistat"></div>
  <details class="toc" style="margin-top:18px"><summary>Qué esperar (léelo una vez)</summary><div style="padding:0 14px 12px">
  <ul class="steps"><li>Son modelos pequeños: conversan bien a nivel A2–B1, pero <b>a veces se equivocan al corregir</b> o repiten cosas. Si una corrección te extraña, compruébala en el manual o en el diccionario.</li>
  <li>Funciona en el <b>ordenador</b> con Chrome o Edge actualizados. En el <b>iPhone</b> necesita iOS 26 o posterior y bastante memoria: en los modelos recientes debería funcionar el «Ligero»; en los antiguos, quizá solo el «Mínimo».</li>
  <li>Para hablar en voz alta se usa el mismo micrófono que en Conversar (en la app instalada del iPhone, el dictado del teclado). La IA te contesta con la voz italiana del dispositivo.</li>
  <li>El modelo ocupa espacio en el dispositivo. Puedes borrarlo abajo cuando quieras.</li></ul>
  <button class="btn small" id="aidel">Borrar los modelos descargados de este dispositivo</button></div></details>`;
  aiCheckGPU().then(g => { const el = $("#aigpu"); if (!el) return;
    el.innerHTML = g.ok ? `<span class="tag ok">Compatible</span> Este navegador tiene WebGPU${g.f16 ? "" : " (sin coma flotante de 16 bits: se usará una versión algo mayor del modelo)"}.`
      : `<p class="note err">Este navegador no tiene WebGPU, que es lo que permite a la IA funcionar en el dispositivo. En el ordenador usa Chrome o Edge actualizados; en el iPhone hace falta iOS 26 o posterior (Ajustes → General → Actualización de software).</p>`;
    $("#aigo").disabled = !g.ok; });
  $("#view").querySelectorAll("[data-air]").forEach(b => b.onclick = () => { AIC.role = +b.dataset.air; saveAIC(); $("#view").querySelectorAll("[data-air]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#ailv").onchange = e => { AIC.level = e.target.value; saveAIC(); };
  $("#aicorr").onchange = e => { AIC.corr = e.target.checked; saveAIC(); };
  $("#view").querySelectorAll("[name=aim]").forEach(r => r.onchange = () => { AIC.model = r.value; saveAIC(); });
  $("#aigo").onclick = async () => {
    const m = AI_MODELS.find(x => x.id === ($("[name=aim]:checked") || {}).value) || AI_MODELS[0];
    $("#aigo").disabled = true;
    try { await aiLoad(m); } catch (e) { $("#aigo").disabled = false; return; }
    const r = AI_ROLES2[AIC.role || 0];
    AI_CHAT = { role: r, level: AIC.level || "A2-B1", corr: AIC.corr !== false, msgs: [], view: [] };
    if (curView === "ai") { drawAIChat(); aiTurn(null); }
  };
  $("#aidel").onclick = async () => {
    if (!confirm("¿Borrar los modelos de IA descargados en este dispositivo? Si los quieres usar otra vez, habrá que descargarlos de nuevo.")) return;
    try { const lib = await import("./vendor/web-llm.js"); for (const k of Object.keys(AIC.ready || {})) { try { await lib.deleteModelAllInfoInCache(k); } catch (e) {} } } catch (e) {}
    if (AIE && AIE.unload) { try { await AIE.unload(); } catch (e) {} } AIE = null; AIC.ready = {}; saveAIC(); toast("Modelos borrados."); VIEWS.ai();
  };
};
function drawAIChat() {
  const c = AI_CHAT; const prob = srProblem();
  $("#view").innerHTML = `<div class="row" style="justify-content:space-between"><span class="muted small">${esc(c.role[0])} · ${esc(c.level)}</span><div class="row"><button class="btn small" id="aisum">Terminar y ver mis errores</button><button class="btn small" id="ainew">Cambiar</button></div></div>
  <div class="chat" id="aichat">${c.view.map((v, k) => aiBubble(v, k)).join("")}</div>
  <div class="taskbox" style="margin-top:10px">
    ${prob ? "" : `<button class="mic" id="aimic">${svg("mic")}<span>Pulsa y habla</span></button>`}
    <div id="ailive" class="live muted"></div>
    <div class="row" style="margin-top:8px;flex-wrap:nowrap"><textarea id="aiin" rows="2" placeholder="${prob ? "Escribe o dicta en italiano…" : "…o escribe en italiano"}" autocapitalize="sentences" spellcheck="false"></textarea><button class="btn pri" id="aisend">Enviar</button></div>
    ${prob === "ios-pwa" ? `<p class="muted small">En la app instalada del iPhone: usa el micrófono del teclado italiano para dictar.</p>` : ""}
  </div>`;
  const send = () => { const v = $("#aiin").value.trim(); if (!v || AI_BUSY) return; $("#aiin").value = ""; aiTurn(v); };
  $("#aisend").onclick = send;
  $("#aiin").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  $("#ainew").onclick = () => { if (AIE && AIE.interruptGenerate) try { AIE.interruptGenerate(); } catch (e) {} AI_CHAT = null; VIEWS.ai(); };
  $("#aisum").onclick = aiSummary;
  const mic = $("#aimic");
  if (mic) mic.onclick = () => {
    if (REC) { stopListening(); return; }
    mic.classList.add("on"); mic.querySelector("span").textContent = "Te escucho…";
    listen(t => { $("#ailive").textContent = "«" + t + "»"; }, finals => { mic.classList.remove("on"); mic.querySelector("span").textContent = "Pulsa y habla"; $("#ailive").textContent = ""; aiTurn(finals[0]); },
      err => { mic.classList.remove("on"); mic.querySelector("span").textContent = "Pulsa y habla"; $("#ailive").innerHTML = `<span style="color:var(--rosso)">${SR_MSG[err] || esc(err)}</span>`; });
  };
  $("#aichat").querySelectorAll("[data-aitr]").forEach(b => b.onclick = () => aiTranslate(+b.dataset.aitr));
  const last = $("#aichat").lastElementChild; if (last) last.scrollIntoView({ block: "nearest" });
}
function aiBubble(v, k) {
  if (v.who === "me") return `<div class="bub me"><div class="muted small">Tú</div>${esc(v.t)}</div>`;
  return `<div class="bub them speakable" id="aib${k}">${v.corr ? `<div class="aicorr"><b>Mejor así:</b> <span class="it">${esc(v.corr.c)}</span>${v.corr.why ? `<div class="muted small">${esc(v.corr.why)}</div>` : ""}</div>` : ""}
  <div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px">${v.t ? sayBtn(v.t, true) : ""}<div class="grow"><span class="it-text">${esc(v.t || "…")}</span>${v.tr ? `<div class="muted small" style="margin-top:4px">${esc(v.tr)}</div>` : ""}
  ${v.done && v.t ? `<div><button class="linkb small" data-aitr="${k}">${v.tr ? "" : "En español"}</button></div>` : ""}</div></div></div>`;
}
async function aiTurn(userText) {
  const c = AI_CHAT; if (!c || AI_BUSY) return;
  AI_BUSY = true;
  if (userText) { c.msgs.push({ role: "user", content: userText }); c.view.push({ who: "me", t: userText }); S.quiz.n++; logActivity(); save(); }
  else c.msgs.push({ role: "user", content: "(Alejandro arriva. Salutalo e comincia tu la conversazione.)" });
  const v = { who: "ai", t: "", done: false }; c.view.push(v); const k = c.view.length - 1;
  if (curView === "ai") drawAIChat();
  const sys = { role: "system", content: aiSystem(c.role[1], c.level, c.corr) };
  const hist = c.msgs.slice(-10);
  try {
    const full = await aiComplete([sys, ...hist], { onToken: t => { const sp = aiSplit(t, userText); v.t = sp.reply; v.corr = sp.corr; const el = $("#aib" + k); if (el) el.outerHTML = aiBubble(v, k); } });
    const sp = aiSplit(full, userText); v.t = sp.reply || full; v.corr = sp.corr; v.done = true;
    c.msgs.push({ role: "assistant", content: full });
    if (S.set.auto && v.t) speak(v.t);
  } catch (e) { v.t = "(No se ha podido generar la respuesta: " + (e.message || e) + ")"; v.done = true; }
  AI_BUSY = false; if (curView === "ai") drawAIChat();
}
async function aiTranslate(k) {
  const v = AI_CHAT.view[k]; if (!v || v.tr || AI_BUSY) return;
  AI_BUSY = true; v.tr = "Traduciendo…"; drawAIChat();
  try { v.tr = await aiComplete([{ role: "system", content: "Traduci in spagnolo (di Spagna) il testo dell'utente. Rispondi solo con la traduzione, senza commenti." }, { role: "user", content: v.t }], { req: { temperature: 0.2, max_tokens: 200 } }); }
  catch (e) { v.tr = ""; toast("No se ha podido traducir."); }
  AI_BUSY = false; if (curView === "ai") drawAIChat();
}
async function aiSummary() {
  const c = AI_CHAT; const mine = c.view.filter(v => v.who === "me").map(v => v.t);
  if (!mine.length) { toast("Todavía no has escrito nada."); return; }
  if (AI_BUSY) return; AI_BUSY = true;
  const v = { who: "ai", t: "Preparando el resumen…", done: false }; c.view.push(v); drawAIChat();
  try {
    v.t = await aiComplete([{ role: "system", content: "Eres un profesor de italiano para hispanohablantes. Responde en español de España, de forma breve y clara." },
      { role: "user", content: `Estas son las frases en italiano que ha escrito un alumno de nivel ${c.level}:\n${mine.map((m, i) => (i + 1) + ". " + m).join("\n")}\n\nIndica sus 3-5 errores más importantes (frase original → forma correcta en italiano, con una explicación muy breve) y después 3 expresiones italianas útiles para esta situación. Si no hay errores, dilo.` }],
      { req: { temperature: 0.3, max_tokens: 450 } });
  } catch (e) { v.t = "No se ha podido hacer el resumen."; }
  v.done = true; AI_BUSY = false; if (curView === "ai") drawAIChat();
}
/* corrección de redacciones en los simulacros de examen */
async function aiCorrect(btn, task, text) {
  const out = $("#aic" + btn.dataset.aicorr);
  if (!AIE) { out.innerHTML = `<p class="note">Primero prepara la IA en <button class="linkb" data-go="ai">Conversar con la IA</button> (una vez descargada, vuelve aquí).</p>`; return; }
  if (!text.trim()) { toast("No has escrito nada en esta tarea."); return; }
  btn.disabled = true; out.innerHTML = `<p class="muted">La IA está leyendo tu texto…</p>`;
  try {
    const r = await aiComplete([{ role: "system", content: "Eres un profesor de italiano de Escuela Oficial de Idiomas. Corriges textos de alumnos hispanohablantes. Respondes en español de España." },
      { role: "user", content: `Consigna: ${task.ins}\n\nTexto del alumno:\n${text}\n\nHaz esto, de forma breve: 1) Lista los errores (original → corrección en italiano, con una explicación muy corta). 2) Di si cumple la consigna y la extensión pedida (${task.words ? task.words.join("–") + " palabras" : ""}). 3) Escribe el texto corregido en italiano.` }],
      { onToken: t => { out.innerHTML = `<div class="note">${esc(t).replace(/\n/g, "<br>")}</div>`; }, req: { temperature: 0.3, max_tokens: 700 } });
    out.innerHTML = `<div class="note">${esc(r).replace(/\n/g, "<br>")}<p class="muted small" style="margin-top:8px">Corrección automática de un modelo pequeño: puede equivocarse. Úsala como orientación.</p></div>`;
  } catch (e) { out.innerHTML = `<p class="note err">No se ha podido corregir: ${esc(e.message || e)}</p>`; }
  btn.disabled = false;
}
