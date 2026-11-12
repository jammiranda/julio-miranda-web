// DEVISEBIT landings · favicon y etiquetas de medición (Google Ads, GA4 y Meta)
(function () {
  var d = document, h = d.head;
  function add(tag, attrs) { var e = d.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); h.appendChild(e); return e; }
  if (!d.querySelector('link[rel~="icon"]')) {
    add('link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' });
    add('link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/lp-assets/favicon-32.png' });
    add('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
    add('meta', { name: 'theme-color', content: '#0B0B0D' });
  }
  if (!window.gtag) {
    var s = add('script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=AW-10953063902' });
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'AW-10953063902'); gtag('config', 'G-DPH6T7Z06S'); gtag('config', 'AW-18556479684'); gtag('event', 'conversion', { send_to: 'AW-18556479684/XsupCIzwlbIdEMTRtZBF', value: 1.0, currency: 'ARS' });
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1597635908717757');fbq('track','PageView');
  }
})();
// WhatsApp de DEVISEBIT: 11 7346-6490
  // Después de enviar un formulario: página de gracias del sitio
  document.querySelectorAll('input[name="_next"]').forEach(function (i) { i.value = 'https://www.devisebit.com/gracias'; });
  var WA = '5491173466490';
  // Conversión Google Ads «Contacto por WhatsApp»
  var AW_CONV = 'AW-10953063902/pk_YCMaLpaodEN776eYo';
  // Origen de la visita (igual que el sitio): guarda gclid/utm 90 días y agrega [ref:...] al mensaje,
  // para que el sistema sepa si la consulta vino de Google Ads, Meta u orgánico y de qué campaña
  var REF = (function () {
    var K = 'db_origen', o = {};
    try { o = JSON.parse(localStorage.getItem(K) || '{}') || {}; if (!(o.t && Date.now() - o.t < 90 * 864e5)) o = {}; } catch (e) { o = {}; }
    try {
      var p = new URLSearchParams(location.search), n = {}, hay = false;
      ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'gbraid', 'wbraid', 'fbclid'].forEach(function (k) { var v = p.get(k); if (v) { n[k] = v.slice(0, 200); hay = true; } });
      if (hay || !o.t) {
        n.landing = location.pathname;
        n.referrer = document.referrer && document.referrer.indexOf(location.host) < 0 ? document.referrer.slice(0, 200) : '';
        n.t = Date.now(); o = n;
        localStorage.setItem(K, JSON.stringify(o));
      }
    } catch (e) {}
    var s = (o.utm_source || '').toLowerCase(), m = (o.utm_medium || '').toLowerCase();
    var k = o.gclid || o.gbraid || o.wbraid || (s.indexOf('google') >= 0 && /cpc|ppc|paid|ads/.test(m)) ? 'gads'
      : (/facebook|instagram|meta/.test(s) && /cpc|paid|ads/.test(m)) ? 'meta'
      : /facebook|instagram|linkedin|social/.test(s) || o.fbclid ? 'social'
      : /google|bing/.test(s) || /google\./.test(o.referrer || '') ? 'seo' : '';
    if (!k) return '';
    // Sin utm_campaign (etiquetado automático de Google): se usa la landing de entrada, que identifica la campaña
    var c = o.utm_campaign || ((o.landing || '').split('/')[1] || '');
    return ' [ref:' + k + (c ? '|' + c.slice(0, 40) : '') + ']';
  })();
  document.querySelectorAll('.js-wa').forEach(function (a) {
    var msg = a.getAttribute('data-msg') || 'Hola DEVISEBIT';
    a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg + REF);
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function () {
      // Conversión para Google Ads y Meta (se activa si las etiquetas están instaladas)
      try { if (window.gtag) { gtag('event', 'conversion', { send_to: AW_CONV }); gtag('event', 'contacto_whatsapp', { event_label: msg }); } } catch (e) {}
      try { if (window.fbq) fbq('track', 'Contact'); } catch (e) {}
    });
  });
  // Animación al hacer scroll
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  document.querySelectorAll('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  // Formularios: la consulta entra al sistema de DEVISEBIT (CRM) con el origen de la visita, igual que el
  // formulario del sitio (lib/send-form.ts), y después sigue el envío normal por correo (FormSubmit).
  var CRM = 'https://sistema.devisebit.com/api/consultas';
  // Conversión Google Ads de formulario: la misma etiqueta que usa el formulario de contacto del sitio
  var AW_FORM = 'AW-10953063902/fEQsCN6s7aQdEN776eYo';
  function origen() {
    try { var o = JSON.parse(localStorage.getItem('db_origen') || '{}') || {}; return o.t && Date.now() - o.t < 90 * 864e5 ? o : {}; } catch (e) { return {}; }
  }
  function oculto(f, n, v) {
    var i = f.querySelector('input[type="hidden"][name="' + n + '"]');
    if (!i) { i = document.createElement('input'); i.type = 'hidden'; i.name = n; f.appendChild(i); }
    i.value = v;
  }
  function consulta(f, o) {
    var v = function (n) { var e = f.elements[n]; return e && typeof e.value === 'string' ? e.value.trim() : ''; };
    var propios = { Nombre: 1, WhatsApp: 1, email: 1, Negocio: 1, Empresa: 1 }, lineas = [];
    Array.prototype.forEach.call(f.elements, function (e) {
      if (!e.name || e.name.charAt(0) === '_' || e.type === 'hidden' || propios[e.name]) return;
      var x = (e.value || '').trim(); if (x) lineas.push(e.name + ': ' + x);
    });
    lineas.push('Página: ' + location.pathname);
    var c = { canal: 'web', nombre: v('Nombre'), email: v('email'), organizacion: v('Negocio') || v('Empresa'), telefono: v('WhatsApp'), motivo: v('_subject') || 'Consulta', mensaje: lineas.join('\n') };
    for (var k in o) c[k] = o[k];
    return c;
  }
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      if (f._enviando) { ev.preventDefault(); return; }
      try { if (window.gtag) gtag('event', 'conversion', { send_to: AW_FORM, value: 1.0, currency: 'ARS' }); } catch (e) {}
      try { if (window.fbq) fbq('track', 'Lead'); } catch (e) {}
      try {
        if (f.elements._honey && f.elements._honey.value) return; // trampa para bots: no entra al sistema
        var o = origen();
        // El correo también lleva el origen de la visita
        ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'landing', 'referrer'].forEach(function (k) { if (o[k]) oculto(f, k, o[k]); });
        oculto(f, 'Página', location.pathname);
        var cuerpo = JSON.stringify(consulta(f, o));
        // El envío por correo sigue cuando el sistema respondió o, como mucho, en 1,2 segundos; si el sistema falla, sigue igual
        var hecho = false, seguir = function () { if (hecho) return; hecho = true; HTMLFormElement.prototype.submit.call(f); };
        var espera = setTimeout(seguir, 1200), fin = function () { clearTimeout(espera); seguir(); };
        ev.preventDefault(); f._enviando = true;
        if (window.fetch) fetch(CRM, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true }).then(fin, fin);
        else { try { navigator.sendBeacon(CRM, new Blob([cuerpo], { type: 'application/json' })); } catch (e) {} fin(); }
      } catch (e) {}
    });
  });
  // Al volver atrás desde la página de gracias, el formulario se puede enviar de nuevo
  window.addEventListener('pageshow', function () { document.querySelectorAll('form').forEach(function (f) { f._enviando = false; }); });
