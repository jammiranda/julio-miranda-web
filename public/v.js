/* Contador de visitas DEVISEBIT: sin cookies ni datos personales. Cuenta páginas vistas, origen (referrer o utm_*) y clics en botones de suscripción, inscripción y compra. */
(function () {
  var U = "https://sistema.devisebit.com/api/visita", last = "", ultimoClic = 0
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
})()
