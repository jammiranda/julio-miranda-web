/* Contador de visitas DEVISEBIT: sin cookies ni datos personales. */
(function () {
  var U = "https://sistema.devisebit.com/api/visita", last = ""
  function send() {
    try {
      var p = location.pathname
      if (p === last) return
      var d = JSON.stringify({ h: location.hostname, p: p, r: last ? location.origin : document.referrer, w: window.innerWidth })
      last = p
      if (navigator.sendBeacon) navigator.sendBeacon(U, new Blob([d], { type: "text/plain" }))
      else fetch(U, { method: "POST", body: d, keepalive: true, mode: "no-cors" })
    } catch (e) {}
  }
  var ps = history.pushState
  history.pushState = function () { var r = ps.apply(this, arguments); setTimeout(send, 50); return r }
  window.addEventListener("popstate", function () { setTimeout(send, 50) })
  if (document.readyState === "complete") send(); else window.addEventListener("load", send)
})()
