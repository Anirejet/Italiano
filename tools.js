"use strict";
/* ================================================================ TRADUCIR, PRONUNCIACIÓN AUTOMÁTICA Y GUARDADAS */

/* ---- Pronunciación figurada automática (misma regla que el manual). Sin marcas de acento,
   se supone acento en la penúltima sílaba: por eso, para palabras que no están en la app, es aproximada. */
const PV = "aeiou", PACC = { "à": "a", "è": "e", "é": "e", "ì": "i", "í": "i", "ò": "o", "ó": "o", "ù": "u", "ú": "u" }, PTIL = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
function pronWord(word) {
  if (!word) return "";
  const cap = word[0] !== word[0].toLowerCase();
  const c = [...word.toLowerCase()].map(ch => PACC[ch] ? { ch: PACC[ch], st: true } : { ch, st: false });
  const n = c.length, ch = k => (k >= 0 && k < n ? c[k].ch : ""), isV = k => !!ch(k) && PV.includes(ch(k));
  const silentI = p => { if (ch(p) !== "i" || c[p].st || p + 1 >= n || !isV(p + 1) || p === 0) return false; const pr = ch(p - 1); return "cg".includes(pr) || ("nl".includes(pr) && ch(p - 2) === "g"); };
  let stress = -1; c.forEach((d, i) => { if (d.st) stress = i; });
  const vpos = []; for (let i = 0; i < n; i++) if (isV(i) && !silentI(i)) vpos.push(i);
  const glide = new Set(vpos.filter(i => ch(i) === "u" && (ch(i - 1) === "q" || (ch(i - 1) === "g" && isV(i + 1)))));
  const groups = []; let cur = [];
  for (const i of vpos) { if (glide.has(i)) continue; if (cur.length && i === cur[cur.length - 1] + 1) cur.push(i); else { if (cur.length) groups.push(cur); cur = [i]; } }
  if (cur.length) groups.push(cur);
  const nuc = []; for (const g of groups) { const strong = g.filter(i => !"iu".includes(ch(i)) || c[i].st); nuc.push(...(strong.length ? strong : [g[0]])); }
  if (stress < 0 && nuc.length >= 2) stress = nuc[nuc.length - 2];
  const mono = nuc.length <= 1; const out = []; let i = 0;
  while (i < n) {
    const x = ch(i), nx = ch(i + 1);
    if (PV.includes(x)) { if (!silentI(i)) out.push(i === stress && !mono ? PTIL[x] : x); i++; continue; }
    if (x === "h") { i++; continue; }
    if (x === "c") { const dbl = nx === "c"; let j = dbl ? i + 2 : i + 1; const f = ch(j);
      if (f === "h") { out.push(dbl ? "k-k" : "k"); j++; } else if (f && "ei".includes(f)) out.push(dbl ? "t-ch" : "ch"); else if (f === "q") out.push("c-"); else out.push(dbl ? "c-c" : "c");
      i = j; continue; }
    if (x === "s" && nx === "c") { const f = ch(i + 2);
      if (f === "h") { out.push("sk"); i += 3; } else if (f && "ei".includes(f)) { out.push(i > 0 && isV(i - 1) ? "sh-sh" : "sh"); i += 2; } else { out.push("sc"); i += 2; }
      continue; }
    if (x === "g") { const dbl = nx === "g"; const j = dbl ? i + 2 : i + 1; const f = ch(j); const pre = dbl ? "g-" : "";
      if (f === "h") { out.push(pre + (ch(j + 1) && "ei".includes(ch(j + 1)) ? "gu" : "g")); i = j + 1; continue; }
      if (f && "ei".includes(f)) { out.push(dbl ? "d-dy" : "dy"); i = j; continue; }
      if (f === "n" && !dbl) { out.push(i > 0 && isV(i - 1) ? "ñ-ñ" : "ñ"); i = j + 1; continue; }
      if (f === "l" && ch(j + 1) === "i" && !dbl) { const gem = i > 0 && isV(i - 1) ? "ll-ll" : "ll"; const k = j + 2;
        if (k < n && isV(k) && !c[j + 1].st) { out.push(gem); i = k; } else { out.push(gem + (c[j + 1].st && !mono ? "í" : "i")); i = j + 2; } continue; }
      if (f === "u" && isV(j + 1)) { out.push(pre + ("ei".includes(ch(j + 1)) ? "gü" : "gu")); i = j + 1; continue; }
      out.push(dbl ? "g-g" : "g"); i = j; continue; }
    if (x === "q") { out.push("cu"); i += nx === "u" ? 2 : 1; continue; }
    if (x === "z") { let dbl = nx === "z"; const j = dbl ? i + 2 : i + 1; if (!dbl && i > 0 && isV(i - 1) && isV(i + 1)) dbl = true; out.push(dbl ? "t-ts" : "ts"); i = j; continue; }
    if (x === "x") { out.push("cs"); i++; continue; }
    if (x === nx && /[a-z]/.test(x) && !PV.includes(x)) { out.push(x + "-" + x); i += 2; continue; }
    out.push(x); i++;
  }
  const r = out.join(""); return cap && r ? r[0].toUpperCase() + r.slice(1) : r;
}

/* ---- Pronunciaciones exactas que ya están en la app (diccionario, frases, verbos, unidades): se usan siempre que existan. */
const wkey = w => String(w).toLowerCase().replace(/[’`]/g, "'").replace(/^[^a-zàèéìíòóùú']+|[^a-zàèéìíòóùú']+$/g, "");
const PRMAP = new Map();
function learnPr(it, pr) {
  if (!it || !pr) return;
  const a = String(it).replace(/\([^)]*\)/g, " ").split(/\s+/).filter(Boolean), b = String(pr).replace(/\([^)]*\)/g, " ").split(/\s+/).filter(Boolean);
  if (a.length !== b.length) return;
  a.forEach((w, k) => { const key = wkey(w); const p = b[k].replace(/^[^\p{L}]+|[^\p{L}-]+$/gu, ""); if (key && p && !PRMAP.has(key) && !/[\/…]/.test(w)) PRMAP.set(key, p.toLowerCase()); });
}
let PR_READY = false;
function buildPr() {
  if (PR_READY) return; PR_READY = true;
  VERBS.forEach(v => { learnPr(v.inf, v.pr); learnPr(v.ger[0], v.ger[1]); learnPr(v.part[0], v.part[1]); TENSES.forEach(t => v.T[t].forEach(f => { if (f) learnPr(f[0], f[1]); })); });
  DICT.forEach(e => learnPr(e.it, e.pr)); PHR.forEach(p => learnPr(p.it, p.pr));
  (DATA.units || []).forEach(u => { u.exm.forEach(e => learnPr(e[0], e[1])); u.x.forEach(x => { if (x.say && x.pr) learnPr(x.say, x.pr); if (x.it && x.pr) learnPr(x.it, x.pr); }); });
}
function pronText(text) {
  buildPr(); let approx = false;
  const out = String(text).replace(/[A-Za-zÀ-ÿ’']+/g, w => {
    const key = wkey(w); if (!key) return w;
    let p = PRMAP.get(key);
    if (!p && key.includes("'")) { const [a, b] = key.split("'"); const pb = PRMAP.get(b); if (pb) p = a + pb; }
    if (!p && key.length > 3) for (const sg of singulars(key)) { const ps = PRMAP.get(sg); if (ps && /[aeiou]$/.test(ps)) { p = pluralPr(ps, key); break; } }
    if (!p) { p = pronWord(key.replace(/'/g, "")); if (/[aeiou].*[aeiou]/.test(key) && !/[àèéìòù]/.test(key)) approx = true; }
    return w[0] !== w[0].toLowerCase() ? p[0].toUpperCase() + p.slice(1) : p;
  }).replace(/'/g, "");
  return { pr: out, approx };
}

/* ---- Plurales y femeninos: si «persone» no está, se prueba «persona» */
function singulars(k) {
  const out = [];
  const rules = [[/chi$/, "co"], [/ghi$/, "go"], [/che$/, "ca"], [/ghe$/, "ga"], [/ie$/, "ia"], [/i$/, "o"], [/i$/, "e"], [/e$/, "a"], [/a$/, "o"], [/e$/, "o"]];
  for (const [re, rep] of rules) if (re.test(k)) out.push(k.replace(re, rep));
  return out;
}
function pluralPr(ps, key) {
  const v = key.slice(-1), base = ps.slice(0, -1);
  if (/(chi|che)$/.test(key) && /c$/.test(base)) return base.slice(0, -1) + "k" + v;
  if (/(ghi|ghe)$/.test(key) && /g$/.test(base)) return base + "u" + v;
  if (/[^h][ie]$/.test(key) && /c[ie]$/.test(key) && /c$/.test(base)) return base + "h" + v;
  if (/[^h][ie]$/.test(key) && /g[ie]$/.test(key) && /g$/.test(base)) return base.slice(0, -1) + "dy" + v;
  return base + v;
}
/* ---- Significado de cada palabra italiana */
function wordInfo(tok) {
  const k = norm(tok); if (!k) return null;
  const forms = FORMIDX.get(k) || [];
  const dict = DICT.filter(e => e.kIt.includes(k)).slice(0, 2);
  const noArt = k.replace(/^(l|un|dell|dall|nell|sull|all|quest|quell|c|n|s|m|t|v)\s+/, "");
  const dict2 = !dict.length && noArt !== k ? DICT.filter(e => e.kIt.includes(noArt)).slice(0, 2) : [];
  let dict3 = [], from = "";
  if (!dict.length && !dict2.length && !forms.length && k.length > 3) for (const sg of singulars(k)) { const d = DICT.filter(e => e.kIt.includes(sg)).slice(0, 2); if (d.length) { dict3 = d; from = sg; break; } }
  return { forms, dict: dict.length ? dict : dict2.length ? dict2 : dict3, from };
}
const SMALL = { il: "el", lo: "el", la: "la", i: "los", gli: "los / le (a él)", le: "las / le (a ella)", un: "un", uno: "un", una: "una", di: "de", a: "a", da: "desde / de / en casa de", in: "en", con: "con", su: "sobre / en", per: "por / para", tra: "entre / dentro de", fra: "entre / dentro de", e: "y", ed: "y", o: "o", ma: "pero", che: "que", non: "no", mi: "me", ti: "te", si: "se", ci: "nos / ahí", vi: "os", ne: "de ello / de eso", è: "es / está", del: "del", della: "de la", dei: "de los", delle: "de las", al: "al", alla: "a la", nel: "en el", nella: "en la", sul: "sobre el", sulla: "sobre la", dal: "del / desde el", dalla: "de la / desde la", come: "como / cómo", dove: "dónde / donde", quando: "cuándo / cuando", perché: "por qué / porque", lui: "él", lei: "ella / usted", io: "yo", tu: "tú", noi: "nosotros", voi: "vosotros", loro: "ellos", mio: "mi / mío", tuo: "tu / tuyo", suo: "su / suyo", molto: "mucho / muy", più: "más", anche: "también", già: "ya", ancora: "todavía / otra vez", sì: "sí", no: "no" };
function analyzeIt(text) {
  const toks = String(text).match(/[A-Za-zÀ-ÿ’']+/g) || [];
  const seen = new Set(); const rows = [];
  for (const t of toks) {
    const lk = t.toLowerCase(); if (seen.has(lk)) continue; seen.add(lk);
    const pr = pronText(t); const info = wordInfo(t);
    let mean = "", note = "";
    if (info && info.forms.length) { const f = info.forms[0]; const v = VERBS[f.vi]; mean = v.es; note = `${v.inf} · ${f.t}${f.p != null ? " · " + PERSONS[f.p] : ""}`; }
    else if (info && info.dict.length) { mean = info.dict.map(e => e.es).join(" · "); note = info.from ? `forma de «${info.from}»: ${info.dict[0].it}` : info.dict[0].it !== t ? info.dict[0].it : ""; }
    else if (SMALL[lk] || SMALL[norm(lk)]) mean = SMALL[lk] || SMALL[norm(lk)];
    rows.push({ t, pr: pr.pr, approx: pr.approx, mean, note });
  }
  return rows;
}
function analyzeEs(text) {
  const toks = norm(text).split(" ").filter(w => w.length >= 2);
  const out = []; const seen = new Set();
  for (const w of toks) { if (seen.has(w)) continue; seen.add(w); const r = search(w, "es"); const hit = r && r.words.find(x => x[0] >= 78); out.push({ w, e: hit ? hit[1] : null }); }
  return out;
}
function guessLang(text) {
  const toks = norm(text).split(" ").filter(Boolean); let it = 0, es = 0;
  const IT_HINT = /(zione|zioni|gli|gn|cch|zz|ò|à|ù|è)|^(il|lo|gli|sono|non|che|per|della|del|è|ho|hai|ci|mi|io|perché|questo|questa|molto|grazie|buongiorno|vorrei|dove|come)$/;
  const ES_HINT = /(ción|ñ|que|ll)|^(el|los|las|y|es|está|soy|tengo|quiero|por|para|con|una|muy|gracias|hola|dónde|cómo|qué|me|mi|yo)$/;
  const raw = String(text).toLowerCase();
  for (const t of toks) { if (FORMIDX.has(t) || DICT.some(e => e.kIt.includes(t))) it++; if (DICT.some(e => e.kEs.includes(t))) es++; }
  raw.split(/\s+/).forEach(w => { if (IT_HINT.test(w)) it += 1.5; if (ES_HINT.test(w)) es += 1.5; });
  return it >= es ? "it" : "es";
}
function similarPhrases(text, lang) {
  const q = new Set(norm(text).split(" ").filter(w => w.length >= 3)); if (!q.size) return [];
  const pool = PHR.concat((DATA.units || []).flatMap(u => u.exm.map(e => ({ it: e[0], pr: e[1], es: e[2], g: u.t }))));
  return pool.map(p => { const ws = norm(lang === "it" ? p.it : p.es).split(" "); let s = 0; ws.forEach(w => { if (q.has(w)) s++; }); return [s / Math.sqrt(ws.length + 2), p]; })
    .filter(x => x[0] > 0.45).sort((a, b) => b[0] - a[0]).slice(0, 5).map(x => x[1]);
}

/* ---- Traductor integrado de Chrome (ordenador, Chrome 138 o posterior): traduce dentro del navegador, sin enviar el texto a nadie. */
async function browserTranslate(text, from, to, onProg) {
  if (!("Translator" in self)) return null;
  try {
    const opts = { sourceLanguage: from, targetLanguage: to };
    const av = await self.Translator.availability(opts);
    if (av === "unavailable") return null;
    const tr = await self.Translator.create(Object.assign({}, opts, { monitor(m) { m.addEventListener("downloadprogress", e => onProg && onProg(e.loaded)); } }));
    return await tr.translate(text);
  } catch (e) { return null; }
}
const gUrl = (t, sl, tl) => `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${encodeURIComponent(t)}&op=translate`;
const dUrl = (t, sl, tl) => `https://www.deepl.com/translator#${sl}/${tl}/${encodeURIComponent(t.replace(/\//g, "\\/"))}`;

VIEWS.translate = () => {
  const dir = params.dir || "auto";
  $("#view").innerHTML = `<h1 class="v">Traducir frases</h1>
  <p class="sub">Escribe o pega una frase en español o en italiano. Verás el italiano con audio, su pronunciación y qué significa cada palabra.</p>
  <textarea id="tt" rows="3" placeholder="¿Dónde está la estación? / Vorrei prenotare un tavolo per due…" aria-label="Texto para traducir" autocapitalize="sentences">${esc(params.t || "")}</textarea>
  <div class="row" style="margin-top:10px"><div class="seg" role="group" aria-label="Idioma">${[["auto", "Detectar"], ["es", "ES → IT"], ["it", "IT → ES"]].map(([k, l]) => `<button data-td="${k}" aria-pressed="${dir === k}">${l}</button>`).join("")}</div>
  <button class="btn pri" id="tgo">Traducir</button>${navigator.clipboard && navigator.clipboard.readText ? `<button class="btn" id="tpaste">Pegar</button>` : ""}<button class="btn" id="tclr">Borrar</button></div>
  <div id="tout" style="margin-top:16px"></div>`;
  const ta = $("#tt");
  $("#view").querySelectorAll("[data-td]").forEach(b => b.onclick = () => { params.dir = b.dataset.td; params.t = ta.value; VIEWS.translate(); });
  $("#tgo").onclick = () => { params.t = ta.value; runTranslate(true); };
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); params.t = ta.value; runTranslate(true); } });
  ta.addEventListener("input", () => { params.t = ta.value; });
  $("#tclr").onclick = () => { ta.value = ""; params.t = ""; $("#tout").innerHTML = ""; ta.focus(); };
  if ($("#tpaste")) $("#tpaste").onclick = async () => { try { ta.value = await navigator.clipboard.readText(); params.t = ta.value; runTranslate(); } catch (e) { toast("No se ha podido pegar. Mantén pulsado el cuadro y elige Pegar."); } };
  if (params.t) runTranslate();
};
function drawItalian(itText, esText) {
  const p = pronText(itText); const rows = analyzeIt(itText);
  $("#tit").innerHTML = `<h2 class="s">El italiano</h2><div class="hero speakable"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${sayBtn(itText)}<div class="grow">
    <div style="font-family:var(--serif);font-size:1.3rem"><span class="it">${esc(itText)}</span></div><div class="pr" style="font-size:1rem">[${esc(p.pr)}]</div>
    ${p.approx ? `<div class="muted small">Las palabras marcadas con ≈ no están en la app: su pronunciación sale de la regla general (acento en la penúltima sílaba) y el acento puede no ser exacto.</div>` : ""}
    <div class="row" style="margin-top:8px"><button class="btn small" data-say="${esc(itText)}" data-slow="1">Despacio</button><button class="btn small" id="tsave">${svg("star")} Guardar en mis frases</button></div></div></div></div>
    <h2 class="s">Palabra por palabra</h2><div class="list">${rows.map(r => `<div class="entry speakable">${sayBtn(r.t, true)}<div class="grow"><div class="hw"><span class="it">${esc(r.t)}</span> <span class="pr">[${esc(r.pr)}]${r.approx ? " ≈" : ""}</span></div>
    <div class="tr">${r.mean ? esc(r.mean) : `<span class="muted">No está en el diccionario de la app.</span>`}</div>${r.note ? `<div class="meta">${esc(r.note)}</div>` : ""}</div></div>`).join("")}</div>`;
  $("#tsave").onclick = () => noteForm(itText, esText || "");
}
function drawSpanish(text) {
  const rows = analyzeEs(text);
  $("#tit").innerHTML = `<h2 class="s">Palabra por palabra <span class="muted small">(orientativo: no es una traducción)</span></h2>
  <div class="list">${rows.map(r => r.e ? entryHTML(r.e) : `<div class="entry"><div class="grow"><div class="tr">${esc(r.w)}</div><div class="meta">No está en el diccionario de la app.</div></div></div>`).join("")}</div>
  <p style="margin-top:12px"><button class="btn" id="tsave">${svg("star")} Guardar en mis frases</button></p>`;
  $("#tsave").onclick = () => noteForm("", text);
}
function runTranslate(gesture) {
  const text = String(params.t || "").trim(); const out = $("#tout"); if (!out) return;
  if (!text) { out.innerHTML = ""; return; }
  const lang = params.dir === "es" ? "es" : params.dir === "it" ? "it" : guessLang(text);
  const from = lang, to = lang === "es" ? "it" : "es";
  const tok = (runTranslate.n = (runTranslate.n || 0) + 1);
  const links = `<div class="row" style="margin-top:8px"><a class="btn" href="${gUrl(text, from, to)}" target="_blank" rel="noopener">Google Traductor ↗</a><a class="btn" href="${dUrl(text, from, to)}" target="_blank" rel="noopener">DeepL ↗</a></div>`;
  out.innerHTML = `<p class="muted small">Detectado: <b>${lang === "es" ? "español → italiano" : "italiano → español"}</b>${params.dir === "auto" || !params.dir ? " (si no es así, elige el sentido arriba)" : ""}.</p>
  <div class="note"><b>Traducción completa:</b> ábrela en Google Traductor o DeepL (necesitan internet).${lang === "es" ? " Después copia el italiano que te den y pégalo aquí: verás su pronunciación, el audio y cada palabra." : ""}${links}</div>
  <div id="tbr"></div><div id="tit"></div><div id="tsim"></div>`;
  if (lang === "it") drawItalian(text, ""); else drawSpanish(text);
  const sim = similarPhrases(text, lang);
  $("#tsim").innerHTML = sim.length ? `<h2 class="s">Frases de la app que se parecen <span class="muted small">(revisadas, funcionan sin internet)</span></h2><div class="list">${sim.map(p => p.id ? entryHTML(p, { phr: true, slow: true }) : entryHTML(p, { slow: true, fav: false })).join("")}</div>` : "";
  /* Chrome de ordenador: traducción dentro del navegador (si tarda o no está disponible, se queda lo anterior) */
  if (!("Translator" in self)) return;
  $("#tbr").innerHTML = `<p class="muted small">Preparando la traducción de Chrome…</p>`;
  const timeout = new Promise(r => setTimeout(() => r(null), gesture ? 60000 : 12000));
  Promise.race([browserTranslate(text, from, to, pr => { const e = $("#tbr"); if (e && tok === runTranslate.n) e.innerHTML = `<p class="muted small">Descargando el traductor de Chrome (solo la primera vez): ${Math.round(pr * 100)}%</p>`; }), timeout]).then(tr => {
    const e = $("#tbr"); if (!e || tok !== runTranslate.n) return;
    if (!tr) { e.innerHTML = ""; return; }
    e.innerHTML = `<div class="note ok"><div class="muted small">Traducción automática de Chrome (en tu ordenador; puede tener errores)</div><div style="font-size:1.15rem;margin-top:4px">${lang === "es" ? `<span class="it">${esc(tr)}</span>` : esc(tr)}</div></div>`;
    if (lang === "es") drawItalian(tr, text); else { const b = $("#tsave"); if (b) b.onclick = () => noteForm(text, tr); }
  });
}

/* ---- Mis frases (cuaderno propio): se repasan con tarjetas y se sincronizan */
function noteCard(id, n) { return { id, it: n.it, pr: n.pr || pronText(n.it).pr, es: n.es, g: "Mis frases", kIt: [norm(n.it)], kEs: [norm(n.es)] }; }
function refreshNotes() {
  for (const id of Object.keys(CARDS)) if (id[0] === "u" && (!S.notes[id] || S.notes[id].del)) delete CARDS[id];
  for (const [id, n] of Object.entries(S.notes)) if (!n.del) CARDS[id] = noteCard(id, n);
}
function noteForm(it, es, id) {
  closeOverlay();
  const o = document.createElement("div"); o.className = "ovl"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Guardar frase");
  o.innerHTML = `<div class="ovl-box"><h2 class="s" style="margin-top:0">${id ? "Editar" : "Guardar en"} mis frases</h2>
  <label class="muted small" for="nit">Italiano</label><textarea id="nit" rows="2">${esc(it)}</textarea>
  <label class="muted small" for="nes" style="display:block;margin-top:10px">Español</label><textarea id="nes" rows="2">${esc(es)}</textarea>
  <p class="muted small">Revisa que la traducción sea correcta antes de guardarla: la repasarás con tarjetas.</p>
  <div class="row"><button class="btn pri" id="nok">Guardar</button><button class="btn" id="nno">Cancelar</button></div></div>`;
  OVL_Y = window.scrollY; document.body.appendChild(o); document.body.classList.add("noscroll");
  $("#nno").onclick = closeOverlay;
  $("#nok").onclick = () => {
    const a = $("#nit").value.trim(), b = $("#nes").value.trim();
    if (!a || !b) { toast("Escribe la frase en los dos idiomas."); return; }
    const nid = id || "u" + hash(a + "|" + b + "|" + Date.now());
    S.notes[nid] = { it: a, es: b, pr: pronText(a).pr, t: Date.now() }; save(); refreshNotes(); closeOverlay();
    toast("Guardada en «Mis frases»."); if (curView === "saved") VIEWS.saved();
  };
  setTimeout(() => $(it ? "#nes" : "#nit").focus(), 30);
}
function savedIds() { refreshNotes(); return Object.keys(S.fav).filter(id => isFav(id) && CARDS[id]).concat(Object.keys(S.notes).filter(id => !S.notes[id].del)); }
VIEWS.saved = () => {
  refreshNotes();
  const favs = Object.entries(S.fav).filter(([id, t]) => t > 0 && CARDS[id] && id[0] !== "u").sort((a, b) => b[1] - a[1]).map(([id]) => CARDS[id]);
  const notes = Object.entries(S.notes).filter(([, n]) => !n.del).sort((a, b) => b[1].t - a[1].t);
  const total = savedIds().length; const t = today(); const due = savedIds().filter(id => !S.cards[id] || S.cards[id].d <= t).length;
  $("#view").innerHTML = `<h1 class="v">Guardadas</h1><p class="sub">Las palabras y frases que marcas con la estrella ${svg("star")} y las frases que guardas tú. Se repasan con tarjetas.</p>
  <div class="row"><button class="btn pri" id="srev" ${due ? "" : "disabled"}>Repasar guardadas (${due} pendientes de ${total})</button><button class="btn" id="snew">Añadir una frase</button></div>
  <h2 class="s">Mis frases (${notes.length})</h2>
  ${notes.length ? `<div class="list">${notes.map(([id, n]) => `<div class="entry speakable">${sayBtn(n.it)}<div class="grow"><div class="hw"><span class="it">${esc(n.it)}</span></div><div class="pr">[${esc(n.pr || pronText(n.it).pr)}]</div><div class="tr">${esc(n.es)}</div>
    <div class="row" style="margin-top:6px"><button class="btn small" data-ned="${id}">Editar</button><button class="btn small" data-ndel="${id}">Borrar</button></div></div></div>`).join("")}</div>`
    : `<p class="muted">Aún no tienes frases propias. Guárdalas desde <button class="linkb" data-go="translate">Traducir</button> o con «Añadir una frase».</p>`}
  <h2 class="s">Palabras y frases con estrella (${favs.length})</h2>
  ${favs.length ? `<div class="list">${favs.map(e => entryHTML(e, { phr: e.id[0] === "f" })).join("")}</div>` : `<p class="muted">Toca la estrella de cualquier palabra (en Buscar, en la lupa, en Viaje…) para guardarla aquí.</p>`}`;
  $("#snew").onclick = () => noteForm("", "");
  $("#srev").onclick = () => {
    const ids = savedIds(); const td = today();
    const dueIds = shuffle(ids.filter(id => S.cards[id] && S.cards[id].d <= td)); const neu = ids.filter(id => !S.cards[id]);
    SESSION = { q: dueIds.concat(neu), done: 0, showing: false, dir: null, deck: "s" };
    if (!SESSION.q.length) { SESSION = null; toast("No hay guardadas pendientes hoy."); return; }
    go("review");
  };
  $("#view").querySelectorAll("[data-ned]").forEach(b => b.onclick = () => { const n = S.notes[b.dataset.ned]; noteForm(n.it, n.es, b.dataset.ned); });
  $("#view").querySelectorAll("[data-ndel]").forEach(b => b.onclick = () => { if (!confirm("¿Borrar esta frase?")) return; const id = b.dataset.ndel; S.notes[id] = { it: S.notes[id].it, es: S.notes[id].es, del: true, t: Date.now() }; save(); refreshNotes(); VIEWS.saved(); });
};
refreshNotes();
