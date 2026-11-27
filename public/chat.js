/* Chat web de Bit · DEVISEBIT. Un solo archivo para todos los sitios del ecosistema:
   <script src="https://sistema.devisebit.com/chat.js" defer></script>
   Opcionales en la etiqueta: data-sitio (devisebit, academia, matebot, matecuentas, mateturnos, mateeventos, familiamate, tuweb),
   data-rutas (expresión regular de las rutas donde se muestra), data-sube (píxeles para subirlo si hay otro botón flotante).
   Habla con /api/chat del sistema: la conversación queda en Conversaciones, con su origen y los datos que deje la persona. */
(function () {
  "use strict"
  if (window.__dbChat) return
  window.__dbChat = true
  var yo = document.currentScript || document.querySelector('script[src*="/chat.js"]')
  var BASE = "https://sistema.devisebit.com"
  try { if (yo && yo.src) BASE = new URL(yo.src).origin } catch (e) {}
  var dato = function (k) { return yo && yo.getAttribute ? yo.getAttribute("data-" + k) : null }
  var WA = "5491173466490"

  // ¿En qué sitio estamos? Por la etiqueta o por el dominio.
  var h = location.hostname.toLowerCase()
  var SITIO = dato("sitio") || (/^academia\./.test(h) ? "academia" : /^matebot\./.test(h) ? "matebot" : /^matecuentas\./.test(h) ? "matecuentas" : /^mateturnos\./.test(h) ? "mateturnos" : /^mateeventos\./.test(h) ? "mateeventos" : /^familiamate\./.test(h) ? "familiamate" : /^tuweb\./.test(h) ? "tuweb" : "devisebit")
  var rutas = dato("rutas")
  function rutaOk() { try { return !rutas || new RegExp(rutas).test(location.pathname) } catch (e) { return true } }

  var MATE = { matebot: "MateBot", matecuentas: "MateCuentas", mateturnos: "MateTurnos", mateeventos: "MateEventos" }
  var TEXTOS = {
    devisebit: { marca: "DEVISEBIT", hola: "Hola, soy Bit, el asistente con IA de DEVISEBIT. ¿Qué estás buscando resolver?", gancho: "¿Te ayudo a encontrar lo que buscás?", ops: ["Una página web", "Un asistente de WhatsApp", "Un sistema a medida", "Redes y anuncios", "Quiero una reunión"] },
    academia: { marca: "ACADEMIA DEVISEBIT", hola: "Hola, soy Bit, el asistente con IA de ACADEMIA DEVISEBIT. ¿Te ayudo a encontrar una guía o un curso?", gancho: "¿Buscás una guía o un curso?", ops: ["Guías gratis", "Cursos con certificado", "Capacitar a mi equipo"] },
    familiamate: { marca: "Familia Mate · DEVISEBIT", hola: "Hola, soy Bit, el asistente con IA de DEVISEBIT. Contame qué querés resolver y te digo qué app de la Familia Mate te sirve.", gancho: "¿Te digo qué app te sirve?", ops: ["Organizar mi día", "Las cuentas de casa", "Turnos para mi negocio", "Un evento"] },
    tuweb: { marca: "Web por Suscripción · DEVISEBIT", hola: "Hola, soy Bit, el asistente con IA de DEVISEBIT. ¿Tenés alguna duda sobre tu web por suscripción?", gancho: "¿Dudas antes de pedir tu web?", ops: ["¿Qué incluye?", "¿En cuánto está lista?", "Necesito algo más grande"] },
  }
  var T = TEXTOS[SITIO]
  if (!T) {
    var app = MATE[SITIO] || "esta app"
    T = { marca: app + " · DEVISEBIT", hola: "Hola, soy Bit, el asistente con IA de DEVISEBIT. ¿Tenés alguna duda sobre " + app + "?", gancho: "¿Dudas sobre " + app + "?", ops: ["¿Cómo funciona?", "¿Cuánto sale?", "Quiero algo así para mi negocio"] }
  }

  // Guardado local (puede no estar disponible: todo va con try/catch y funciona igual en memoria)
  var mem = {}
  function leer(k, sesion) { try { var v = (sesion ? sessionStorage : localStorage).getItem(k); return v ? JSON.parse(v) : null } catch (e) { return mem[k] || null } }
  function guardar(k, v, sesion) { mem[k] = v; try { (sesion ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)) } catch (e) {} }
  function azar(n) { var a = "abcdefghijklmnopqrstuvwxyz0123456789", s = "", b; try { b = crypto.getRandomValues(new Uint8Array(n)) } catch (e) { b = []; for (var i = 0; i < n; i++) b.push(Math.floor(Math.random() * 256)) } for (var j = 0; j < n; j++) s += a[b[j] % 36]; return s }

  var est = leer("db_chat") || {}
  // Una conversación vieja (más de 7 días) arranca de cero
  if (!est.sid || !est.t || Date.now() - est.t > 7 * 864e5) est = { sid: azar(24), ultimo: 0, lead: false, n: 0, t: Date.now() }
  function persistir() { est.t = Date.now(); guardar("db_chat", est) }

  // Origen de la visita: el que ya guarda devisebit.com (db_origen) o los parámetros de esta entrada
  function origen() {
    var o = leer("db_origen") || leer("db_chat_o", true)
    if (o && (o.utm_source || o.gclid || o.fbclid || o.referrer || o.landing)) return o
    o = { landing: location.pathname, referrer: document.referrer && document.referrer.indexOf(location.host) < 0 ? document.referrer.slice(0, 200) : "" }
    try { var p = new URLSearchParams(location.search); ["utm_source", "utm_medium", "utm_campaign", "gclid", "gbraid", "wbraid", "fbclid"].forEach(function (k) { var v = p.get(k); if (v) o[k] = v.slice(0, 200) }) } catch (e) {}
    guardar("db_chat_o", o, true)
    return o
  }
  var ORIGEN = origen()
  function medir(ev, extra) { try { if (window.gtag) window.gtag("event", ev, extra || {}); if (ev === "generate_lead" && window.fbq) window.fbq("track", "Lead") } catch (e) {} }

  var CSS = "\
:host{all:initial;position:fixed;z-index:2147483000;right:0;bottom:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0E1116;-webkit-text-size-adjust:100%}\
*{box-sizing:border-box}\
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}\
.boton{position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(var(--sube,0px) + 16px + env(safe-area-inset-bottom,0px));width:58px;height:58px;border-radius:50%;background:#0E1116;box-shadow:0 8px 24px rgba(14,17,22,.28),0 0 0 2px #FF6A63;display:grid;place-items:center;transition:transform .18s ease}\
.boton:hover{transform:translateY(-2px)}\
.boton:focus-visible,.x:focus-visible,.env:focus-visible,.op:focus-visible,.pie a:focus-visible,.cerrarg:focus-visible{outline:3px solid #FF6A63;outline-offset:2px}\
.boton img{width:58px;height:58px;border-radius:50%;display:block}\
.punto{position:absolute;right:1px;top:1px;width:14px;height:14px;border-radius:50%;background:#2FBF71;border:2px solid #fff}\
.punto.nuevo{background:#FF6A63;width:16px;height:16px}\
.gancho{position:fixed;right:calc(84px + env(safe-area-inset-right,0px));bottom:calc(var(--sube,0px) + 24px + env(safe-area-inset-bottom,0px));max-width:min(260px,calc(100vw - 110px));background:#fff;border:1px solid #E3E5EA;border-radius:14px 14px 4px 14px;box-shadow:0 8px 24px rgba(14,17,22,.14);padding:10px 34px 10px 14px;font-size:14px;line-height:1.35;font-weight:600;text-align:left;animation:sube .25s ease}\
.cerrarg{position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;color:#6B7280;font-size:16px;line-height:1}\
.panel{position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:384px;max-width:calc(100vw - 24px);height:min(600px,calc(100vh - 32px));height:min(600px,calc(100dvh - 32px));background:#F4F5F7;border-radius:18px;box-shadow:0 18px 50px rgba(14,17,22,.32);display:flex;flex-direction:column;overflow:hidden;animation:sube .2s ease}\
@media (max-width:520px){.panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100vh;height:100dvh;border-radius:0}}\
@keyframes sube{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}\
@media (prefers-reduced-motion:reduce){.panel,.gancho{animation:none}.boton{transition:none}.tip i{animation:none}}\
.cab{background:#0E1116;color:#fff;padding:12px 12px 12px 14px;display:flex;align-items:center;gap:10px;border-bottom:3px solid #C8231F}\
.cab img{width:40px;height:40px;border-radius:50%;flex:none}\
.cab b{display:block;font-size:16px;font-weight:700;letter-spacing:.01em}\
.cab span{display:block;font-size:12px;color:rgba(255,255,255,.72);margin-top:1px}\
.cab div{flex:1;min-width:0}\
.x{width:40px;height:40px;border-radius:50%;color:#fff;font-size:24px;line-height:1;flex:none}\
.x:hover{background:rgba(255,255,255,.12)}\
.msjs{flex:1;overflow-y:auto;padding:14px 12px 6px;display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}\
.m{max-width:86%;padding:9px 12px;border-radius:16px;font-size:15px;line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere}\
.m.b{align-self:flex-start;background:#fff;border:1px solid #E3E5EA;border-bottom-left-radius:5px}\
.m.c{align-self:flex-end;background:#C8231F;color:#fff;border-bottom-right-radius:5px}\
.m.e{align-self:flex-start;background:#fff;border:1px solid #E3E5EA;border-left:3px solid #C8231F;border-bottom-left-radius:5px}\
.m small{display:block;font-size:11px;font-weight:700;color:#9E1A17;margin-bottom:2px}\
.m a{color:#9E1A17;font-weight:600;text-decoration:underline}\
.m.c a{color:#fff}\
.av{align-self:center;max-width:92%;text-align:center;font-size:12.5px;color:#4A515C;padding:4px 8px}\
.ops{display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 4px}\
.op{border:1px solid #C8231F;color:#9E1A17;background:#fff;border-radius:999px;padding:8px 13px;font-size:14px;font-weight:600;min-height:38px}\
.op:hover{background:#FFE3E1}\
.tip{align-self:flex-start;background:#fff;border:1px solid #E3E5EA;border-radius:16px;border-bottom-left-radius:5px;padding:12px 14px;display:flex;gap:4px}\
.tip i{width:7px;height:7px;border-radius:50%;background:#9AA1AC;animation:pun 1s infinite ease-in-out}\
.tip i:nth-child(2){animation-delay:.15s}.tip i:nth-child(3){animation-delay:.3s}\
@keyframes pun{0%,60%,100%{opacity:.35;transform:none}30%{opacity:1;transform:translateY(-3px)}}\
.caja{display:flex;align-items:flex-end;gap:8px;padding:8px 10px;background:#fff;border-top:1px solid #E3E5EA}\
textarea{flex:1;border:1px solid #D5D8DE;border-radius:14px;padding:10px 12px;font:inherit;font-size:16px;line-height:1.35;resize:none;max-height:110px;min-height:44px;color:#0E1116;background:#fff;outline:none}\
textarea:focus{border-color:#C8231F;box-shadow:0 0 0 3px rgba(200,35,31,.16)}\
.env{width:44px;height:44px;border-radius:50%;background:#C8231F;color:#fff;display:grid;place-items:center;flex:none}\
.env[disabled]{opacity:.45;cursor:default}\
.pie{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px calc(8px + env(safe-area-inset-bottom,0px));background:#fff;font-size:12px;color:#4A515C}\
.pie a{color:#4A515C;text-decoration:underline}\
.pie a.wa{display:inline-flex;align-items:center;gap:6px;color:#0B7A3E;font-weight:700;text-decoration:none;font-size:13px;padding:6px 2px}\
.pie a.wa:hover{text-decoration:underline}\
.oculto{display:none!important}\
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}"

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n }

  var host = el("div"); host.id = "devisebit-chat"
  var raiz = host.attachShadow ? host.attachShadow({ mode: "open" }) : host
  var st = el("style"); st.textContent = CSS; raiz.appendChild(st)
  var sube = Number(dato("sube") || 0); if (sube) host.style.setProperty("--sube", sube + "px")
  var LOGO = BASE + "/wa-perfil.jpg"

  // Botón flotante + globo de invitación
  var boton = el("button", "boton"); boton.type = "button"; boton.setAttribute("aria-label", "Abrir el chat con Bit, el asistente con IA de DEVISEBIT"); boton.setAttribute("aria-haspopup", "dialog")
  var bi = el("img"); bi.src = LOGO; bi.alt = ""; bi.width = 58; bi.height = 58; boton.appendChild(bi)
  var punto = el("span", "punto"); boton.appendChild(punto)
  var gancho = el("div", "gancho oculto"); gancho.setAttribute("role", "button"); gancho.tabIndex = 0; gancho.appendChild(document.createTextNode(T.gancho))
  var cg = el("button", "cerrarg", "×"); cg.type = "button"; cg.setAttribute("aria-label", "Cerrar la invitación"); gancho.appendChild(cg)

  // Panel
  var panel = el("div", "panel oculto"); panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat con Bit, asistente con IA de " + T.marca)
  var cab = el("div", "cab"); var ci = el("img"); ci.src = LOGO; ci.alt = ""; ci.width = 40; ci.height = 40; cab.appendChild(ci)
  var ct = el("div"); ct.appendChild(el("b", null, "Bit")); ct.appendChild(el("span", null, "Asistente con IA de " + T.marca)); cab.appendChild(ct)
  var x = el("button", "x", "×"); x.type = "button"; x.setAttribute("aria-label", "Cerrar el chat"); cab.appendChild(x)
  var msjs = el("div", "msjs"); msjs.setAttribute("role", "log"); msjs.setAttribute("aria-live", "polite")
  var caja = el("form", "caja"); var ta = el("textarea"); ta.rows = 1; ta.placeholder = "Escribí tu consulta…"; ta.setAttribute("aria-label", "Tu mensaje"); ta.maxLength = 1200; ta.setAttribute("enterkeyhint", "send")
  var env = el("button", "env"); env.type = "submit"; env.setAttribute("aria-label", "Enviar"); env.disabled = true
  env.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  caja.appendChild(ta); caja.appendChild(env)
  var pie = el("div", "pie"); var wa = el("a", "wa"); wa.target = "_blank"; wa.rel = "noopener noreferrer"
  wa.innerHTML = '<svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.3.6 4.5 1.8 6.4L3 29l7.2-1.9c1.8 1 3.8 1.5 5.8 1.5 7 0 12.7-5.7 12.7-12.6S23 3 16 3zm5.9 15.3c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>'
  wa.appendChild(document.createTextNode("Seguir por WhatsApp"))
  var priv = el("a", null, "Privacidad"); priv.href = "https://www.devisebit.com/privacidad"; priv.target = "_blank"; priv.rel = "noopener"
  pie.appendChild(wa); pie.appendChild(priv)
  panel.appendChild(cab); panel.appendChild(msjs); panel.appendChild(caja); panel.appendChild(pie)
  raiz.appendChild(gancho); raiz.appendChild(boton); raiz.appendChild(panel)

  function linkWa() {
    var txt = est.codigo && est.n ? "Hola, sigo la charla que empecé en el chat de la web [web:" + est.codigo + "]" : "Hola DEVISEBIT, quiero hacer una consulta"
    wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt)
  }
  linkWa()
  wa.addEventListener("click", function () { medir("contacto_whatsapp", { origen: "chat_web" }); try { if (window.fbq) window.fbq("track", "Contact") } catch (e) {} })

  // Texto del mensaje: *negrita* y links, siempre como nodos de texto (nunca HTML del servidor)
  var RE = /(\*[^*\n]{1,120}\*|https?:\/\/[^\s<>]+|(?:[a-z0-9-]+\.)+devisebit\.com(?:\/[^\s<>]*)?|wa\.me\/[^\s<>]+)/gi
  function pintar(nodo, texto) {
    var partes = String(texto).replace(/\*\*/g, "*").split(RE)
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i]; if (!p) continue
      if (i % 2 === 0) { nodo.appendChild(document.createTextNode(p)); continue }
      if (p.charAt(0) === "*") { nodo.appendChild(el("strong", null, p.slice(1, -1))); continue }
      var cola = (p.match(/[.,;:!?)]+$/) || [""])[0], url = cola ? p.slice(0, -cola.length) : p
      var a = el("a", null, url.replace(/^https?:\/\//, "")); a.href = /^https?:\/\//.test(url) ? url : "https://" + url; a.target = "_blank"; a.rel = "noopener noreferrer"
      nodo.appendChild(a); if (cola) nodo.appendChild(document.createTextNode(cola))
    }
  }
  function abajo() { msjs.scrollTop = msjs.scrollHeight }
  function burbuja(autor, texto, nombre) {
    var d = el("div", "m " + (autor === "cliente" ? "c" : autor === "equipo" ? "e" : "b"))
    if (autor === "equipo") d.appendChild(el("small", null, (nombre || "Equipo") + " · equipo DEVISEBIT"))
    pintar(d, texto); msjs.appendChild(d); abajo(); return d
  }
  function aviso(texto) { var d = el("div", "av", texto); msjs.appendChild(d); abajo() }
  var ops = null
  function saludo() {
    burbuja("bot", T.hola)
    ops = el("div", "ops")
    T.ops.forEach(function (o) { var b = el("button", "op", o); b.type = "button"; b.addEventListener("click", function () { mandar(o) }); ops.appendChild(b) })
    msjs.appendChild(ops)
  }
  var tip = null
  function escribiendo(si) {
    if (si && !tip) { tip = el("div", "tip"); tip.appendChild(el("i")); tip.appendChild(el("i")); tip.appendChild(el("i")); var s = el("span", "sr", "Bit está escribiendo"); tip.appendChild(s); msjs.appendChild(tip); abajo() }
    if (!si && tip) { tip.remove(); tip = null }
  }

  var abierto = false, cargado = false, enviando = false, ultimaActividad = 0, reloj = null
  function recibir(lista) {
    var hubo = false
    ;(lista || []).forEach(function (m) {
      if (m.id && m.id <= est.ultimo) return
      if (m.id) est.ultimo = m.id
      burbuja(m.autor, m.texto, m.nombre); hubo = true
    })
    if (hubo) { persistir(); if (!abierto) punto.className = "punto nuevo" }
    return hubo
  }
  function api(metodo, cuerpo, qs) {
    return fetch(BASE + "/api/chat" + (qs || ""), metodo === "POST" ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) } : { method: "GET" }).then(function (r) { return r.json().catch(function () { return { ok: false } }) })
  }
  function historial() {
    if (cargado) return
    cargado = true
    if (!est.n) { saludo(); return }
    // Vuelve a abrir una conversación ya empezada: se trae del sistema
    api("GET", null, "?sid=" + est.sid).then(function (j) {
      if (j && j.ok && j.mensajes && j.mensajes.length) {
        burbuja("bot", T.hola)
        j.mensajes.forEach(function (m) { burbuja(m.autor, m.texto, m.nombre); if (m.id > est.ultimo) est.ultimo = m.id })
        if (j.codigo) est.codigo = j.codigo
        persistir(); linkWa(); ultimaActividad = Date.now(); vigilar()
      } else saludo()
    }).catch(function () { saludo() })
  }
  function mandar(texto) {
    texto = String(texto || "").trim()
    if (!texto || enviando) return
    enviando = true; env.disabled = true
    if (ops) { ops.remove(); ops = null }
    burbuja("cliente", texto); ta.value = ""; alto(); escribiendo(true)
    if (!est.n) medir("chat_inicio", { sitio: SITIO })
    est.n = (est.n || 0) + 1; persistir()
    ultimaActividad = Date.now()
    api("POST", { sid: est.sid, texto: texto, sitio: SITIO, pagina: location.pathname.slice(0, 160), o: ORIGEN }).then(function (j) {
      escribiendo(false)
      if (j && j.codigo) est.codigo = j.codigo
      if (j && j.ok) {
        recibir(j.mensajes)
        if (j.aviso) aviso(j.aviso)
        if (j.lead && !est.lead) { est.lead = true; medir("generate_lead", { method: "chat_web", sitio: SITIO }) }
      } else aviso((j && j.aviso) || "No pude enviar tu mensaje. Probá de nuevo o seguí por WhatsApp.")
      persistir(); linkWa(); vigilar()
    }).catch(function () {
      escribiendo(false); aviso("No pude enviar tu mensaje. Revisá tu conexión y probá de nuevo, o seguí por WhatsApp.")
    }).then(function () { enviando = false; env.disabled = !ta.value.trim(); if (abierto) ta.focus() })
  }
  // Respuestas que llegan después (una persona del equipo desde el sistema): se consultan un rato después de cada mensaje
  function vigilar() {
    if (reloj) return
    reloj = setInterval(function () {
      if (!est.n || Date.now() - ultimaActividad > 20 * 60e3) { clearInterval(reloj); reloj = null; return }
      if (document.hidden || enviando) return
      api("GET", null, "?sid=" + est.sid + "&desde=" + (est.ultimo || 0)).then(function (j) { if (j && j.ok) recibir(j.mensajes) }).catch(function () {})
    }, abierto ? 6000 : 15000)
  }
  function alto() { ta.style.height = "auto"; ta.style.height = Math.min(110, ta.scrollHeight + 2) + "px" }

  function abrir() {
    if (abierto) return
    abierto = true; panel.classList.remove("oculto"); boton.classList.add("oculto"); gancho.classList.add("oculto"); punto.className = "punto"
    guardar("db_chat_g", 1, true)
    historial(); abajo(); medir("chat_abierto", { sitio: SITIO })
    if (reloj) { clearInterval(reloj); reloj = null; vigilar() }
    setTimeout(function () { try { ta.focus({ preventScroll: true }) } catch (e) { ta.focus() } }, 60)
  }
  function cerrar() {
    if (!abierto) return
    abierto = false; panel.classList.add("oculto"); boton.classList.remove("oculto")
    if (reloj) { clearInterval(reloj); reloj = null; vigilar() }
    try { boton.focus() } catch (e) {}
  }
  boton.addEventListener("click", abrir)
  gancho.addEventListener("click", function (e) { if (e.target === cg) { gancho.classList.add("oculto"); guardar("db_chat_g", 1, true); e.stopPropagation(); return } abrir() })
  gancho.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir() } })
  x.addEventListener("click", cerrar)
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar() })
  caja.addEventListener("submit", function (e) { e.preventDefault(); mandar(ta.value) })
  ta.addEventListener("input", function () { env.disabled = enviando || !ta.value.trim(); alto() })
  ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); mandar(ta.value) } })

  function mostrar() {
    var ok = rutaOk()
    host.style.display = ok ? "" : "none"
    if (!ok && abierto) cerrar()
  }
  function montar() {
    if (!document.body || host.parentNode) return
    document.body.appendChild(host); mostrar()
    // Invitación discreta, una vez por visita y sin abrir el chat sola
    if (!leer("db_chat_g", true)) setTimeout(function () { if (!abierto && rutaOk() && !leer("db_chat_g", true)) gancho.classList.remove("oculto") }, 9000)
    if (est.n) { ultimaActividad = est.t || 0; vigilar() }
  }
  // Sitios con navegación sin recarga: se vuelve a evaluar dónde se muestra
  try { var ps = history.pushState; history.pushState = function () { var r = ps.apply(this, arguments); setTimeout(mostrar, 60); return r }; window.addEventListener("popstate", function () { setTimeout(mostrar, 60) }) } catch (e) {}
  // Para abrirlo desde un botón propio del sitio: window.devisebitChat.abrir()
  window.devisebitChat = { abrir: abrir, cerrar: cerrar }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar()
})()
