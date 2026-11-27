/* Contador de visitas DEVISEBIT: sin cookies ni datos personales. Cuenta páginas vistas, origen (referrer o utm_*) y clics en botones de suscripción, inscripción y compra. */
(function () {
  var U = "https://sistema.devisebit.com/api/visita", last = "", ultimoClic = 0
  var yoV = document.currentScript
  function enviar(o) {
    try {
      var d = JSON.stringify(o)
      if (navigator.sendBeacon) navigator.sendBeacon(U, new Blob([d], { type: "text/plain" }))
      else fetch(U, { method: "POST", body: d, keepalive: true, mode: "no-cors" })
    } catch (e) {}
  }
  function send() {
    try {
      var p = location.pathname
      if (p === last) return
      var o = { h: location.hostname, p: p, r: last ? location.origin : document.referrer, w: window.innerWidth }
      if (!last) {
        // Solo en la entrada al sitio: de dónde vino según los parámetros del link (mails, redes, anuncios)
        var q = new URLSearchParams(location.search)
        if (q.get("utm_medium")) o.m = q.get("utm_medium")
        if (q.get("utm_source")) o.s = q.get("utm_source")
        if (q.get("gclid")) o.m = o.m || "cpc"
        if (q.get("fbclid")) o.s = o.s || "facebook"
      }
      last = p
      enviar(o)
    } catch (e) {}
  }
  // Clics en botones de envío: suscripción (formulario con email), inscripción y compra. Se guarda solo el tipo y la página, nunca lo escrito.
  function tipoClic(el) {
    var a = el.getAttribute("data-acc")
    if (a) return a
    var tag = el.tagName
    var esEnvio = tag === "BUTTON" && (el.getAttribute("type") || "submit") === "submit"
    if (!esEnvio) return ""
    var f = el.form || el.closest("form")
    if (f && f.querySelector("input[type=email]")) return "suscripcion"
    var t = (el.textContent || "").toLowerCase()
    if (/pagar|comprar|desbloque|mercado ?pago/.test(t)) return "compra"
    if (/inscrib|reservar|empez[aá] gratis/.test(t)) return "inscripcion"
    return ""
  }
  document.addEventListener("click", function (e) {
    try {
      var el = e.target && e.target.closest ? e.target.closest("button,[data-acc]") : null
      if (!el) return
      var a = tipoClic(el)
      if (!a) return
      var ahora = Date.now()
      if (ahora - ultimoClic < 1500) return
      ultimoClic = ahora
      enviar({ h: location.hostname, p: location.pathname, a: a })
    } catch (err) {}
  }, true)
  var ps = history.pushState
  history.pushState = function () { var r = ps.apply(this, arguments); setTimeout(send, 50); return r }
  window.addEventListener("popstate", function () { setTimeout(send, 50) })
  if (document.readyState === "complete") send(); else window.addEventListener("load", send)

  /* Chat de Bit (el mismo bot de WhatsApp, en la web). En qué sitios y páginas aparece se decide acá, en un solo lugar:
     s = sitio (le dice a Bit de dónde viene la persona), r = rutas donde se muestra, u / um = píxeles que sube el botón
     en escritorio / celular para no tapar otro botón flotante del sitio. Para sumar o sacar un sitio alcanza con tocar esta lista.
     El widget es /chat.js y habla con /api/chat. */
  var CHAT = {
    "www.devisebit.com": { s: "devisebit", r: "^/(?!en(/|$)|gracias)", u: 64, um: 56 },
    "devisebit.com": { s: "devisebit", r: "^/(?!en(/|$)|gracias)", u: 64, um: 56 },
    "academia.devisebit.com": { s: "academia", r: "^/(?!mi-cuenta|autor|certificado|descarga|gracias|sistema|login|email|usuarios|cuenta|ayuda|primer-ingreso|activar|recuperar)", u: 56, um: 56 },
    "matebot.devisebit.com": { s: "matebot", r: "^/(plus/?)?$" },
    "matecuentas.devisebit.com": { s: "matecuentas", r: "^/$" },
    "mateturnos.devisebit.com": { s: "mateturnos", r: "^/$" },
    "mateeventos.devisebit.com": { s: "mateeventos", r: "^/$" },
    "familiamate.devisebit.com": { s: "familiamate", r: "^/$" },
    "tuweb.devisebit.com": { s: "tuweb", r: "^/(preguntas(\\.html)?)?$", um: 68 }
  }
  // Interruptor general: en false el chat no aparece en ningún sitio (solo con ?_chat= para probar)
  var ACTIVO = true
  function cargarChat() {
    try {
      var c = ACTIVO ? CHAT[location.hostname] : null
      // Para probarlo en una vista previa o en local: agregar ?_chat=devisebit (o el sitio que sea) a la dirección
      var prueba = /[?&]_chat=([a-z]+)/.exec(location.search)
      if (prueba) { var real = CHAT[location.hostname] || {}; c = { s: prueba[1], r: null, u: real.u, um: real.um } }
      if (!c || window.__dbChat || document.querySelector('script[src*="/chat.js"]')) return
      var s = document.createElement("script")
      var base = "https://sistema.devisebit.com"
      try { if (yoV && yoV.src && !/devisebit\.com$/.test(new URL(yoV.src).hostname)) base = new URL(yoV.src).origin } catch (e) {}
      s.src = base + "/chat.js"; s.async = true
      s.setAttribute("data-sitio", c.s)
      if (c.r) s.setAttribute("data-rutas", c.r)
      if (c.u) s.setAttribute("data-sube", c.u)
      if (c.um) s.setAttribute("data-sube-movil", c.um)
      document.head.appendChild(s)
    } catch (e) {}
  }
  // No compite con la carga de la página: entra un momento después de que terminó de cargar
  function luego() { setTimeout(cargarChat, 1200) }
  if (document.readyState === "complete") luego(); else window.addEventListener("load", luego)
})()
