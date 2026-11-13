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
    // Medición (Google Ads, GA4 y Meta): las etiquetas y los eventos quedan en cola desde el primer momento,
    // pero las librerías (unos 650 kB) se bajan cuando la página ya se ve: al primer toque o scroll,
    // o 2 segundos después de terminar de cargar. Los eventos en cola se envían cuando llegan.
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'AW-10953063902'); gtag('config', 'G-DPH6T7Z06S'); gtag('config', 'AW-18556479684'); gtag('event', 'conversion', { send_to: 'AW-18556479684/XsupCIzwlbIdEMTRtZBF', value: 1.0, currency: 'ARS' });
    if (!window.fbq) { var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!window._fbq) window._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; }
    fbq('init','1597635908717757');fbq('track','PageView');
    var cargada = false, avisos = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
    var cargar = function () {
      if (cargada) return; cargada = true;
      avisos.forEach(function (e) { window.removeEventListener(e, cargar); });
      add('script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=AW-10953063902' });
      add('script', { async: '', src: 'https://connect.facebook.net/en_US/fbevents.js' });
    };
    avisos.forEach(function (e) { window.addEventListener(e, cargar, { passive: true }); });
    var luego = function () { setTimeout(cargar, 2000); };
    if (d.readyState === 'complete') luego(); else window.addEventListener('load', luego);
    // Si la persona se va antes, las etiquetas se cargan igual para no perder la visita
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') cargar(); });
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
    // utm_campaign llega del sufijo de URL de cada cuenta de Google Ads (cuenta1 = Búsqueda, pmax-cuenta2 = Máximo rendimiento);
    // se le suma la landing de entrada para saber también el servicio: «cuenta1/webs», «pmax-cuenta2/webs»
    var lp = ((o.landing || '').split('/')[1] || '').replace(/\.html$/, '');
    var c = o.utm_campaign ? o.utm_campaign.slice(0, 28) + (lp ? '/' + lp : '') : lp;
    return ' [ref:' + k + (c ? '|' + c.slice(0, 40) : '') + ']';
  })();
  // Paso previo al WhatsApp (12/11/2026): antes de abrir el chat se pide el tipo de negocio y el email.
  // Filtra los toques sin intención (banners de Display) y la consulta llega al bot con rubro y email.
  // La conversión de Google Ads y Meta se cuenta al completar el paso, no al tocar el botón.
  var RUBROS = /\/(sistemas|comunidad)(\.html)?$/.test(location.pathname)
    ? ['Empresa o pyme', 'Institución, gremio u obra social', 'Salud', 'Comercio o servicios', 'Otro']
    : ['Comercio o tienda', 'Servicios o profesional', 'Gastronomía', 'Empresa o industria', 'Otro'];
  function medir(msg, rubro, email) {
    try {
      if (window.gtag) {
        gtag('event', 'conversion', { send_to: AW_CONV });
        gtag('event', 'contacto_whatsapp', { event_label: msg, rubro: rubro || '', con_email: email ? 'si' : 'no' });
        if (email) gtag('event', 'generate_lead', { metodo: 'paso_whatsapp', rubro: rubro || '' });
      }
    } catch (e) {}
    try { if (window.fbq) { fbq('track', 'Contact'); if (email) fbq('track', 'Lead'); } } catch (e) {}
  }
  function urlWa(msg, rubro, email) {
    var t = msg + (rubro ? '. Rubro: ' + rubro : '') + (email ? '. Email: ' + email : '');
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t + REF);
  }
  var paso = null, pasoMsg = '';
  function armarPaso() {
    if (paso) return paso;
    if (!('HTMLDialogElement' in window)) return null;
    var g = document.createElement('dialog');
    g.className = 'wa-paso'; g.setAttribute('aria-labelledby', 'wa-paso-t');
    g.innerHTML = '<form method="dialog" novalidate>'
      + '<button type="button" class="wa-paso-x" aria-label="Cerrar">×</button>'
      + '<h3 id="wa-paso-t">Dos datos y te respondemos mejor</h3>'
      + '<p class="wa-paso-s">Así te contestamos por WhatsApp con ejemplos y precios de tu rubro.</p>'
      + '<fieldset><legend>¿Para qué tipo de negocio es?</legend><div class="wa-paso-r">'
      + RUBROS.map(function (r, i) { return '<label><input type="radio" name="rubro" value="' + r + '"' + (i ? '' : ' required') + '><span>' + r + '</span></label>'; }).join('')
      + '</div></fieldset>'
      + '<label class="wa-paso-l" for="wa-paso-e">Tu email, para mandarte la propuesta por escrito</label>'
      + '<input id="wa-paso-e" type="email" name="email" autocomplete="email" inputmode="email" placeholder="nombre@tuempresa.com" maxlength="120">'
      + '<p class="wa-paso-err" role="alert" hidden></p>'
      + '<button type="submit" class="btn btn-red wa-paso-ok">Abrir WhatsApp</button>'
      + '<button type="button" class="wa-paso-sin">Seguir sin email</button>'
      + '<p class="wa-paso-n">Lo usamos para responderte y mandarte la propuesta.</p>'
      + '</form>';
    document.body.appendChild(g);
    var f = g.querySelector('form'), err = g.querySelector('.wa-paso-err'), em = g.querySelector('#wa-paso-e');
    var aviso = function (t) { err.textContent = t; err.hidden = !t; };
    var rubro = function () { var r = f.querySelector('input[name="rubro"]:checked'); return r ? r.value : ''; };
    var ir = function (conEmail) {
      var r = rubro(), e = conEmail ? em.value.trim() : '';
      if (!r) { aviso('Elegí el tipo de negocio para seguir.'); return; }
      if (conEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { aviso('Escribí un email válido, o tocá «Seguir sin email».'); em.focus(); return; }
      aviso('');
      try { sessionStorage.setItem('db_paso', JSON.stringify({ r: r, e: e })); } catch (x) {}
      medir(pasoMsg, r, e);
      var u = urlWa(pasoMsg, r, e);
      g.close();
      var w = window.open(u, '_blank', 'noopener'); if (!w) location.href = u;
    };
    f.addEventListener('submit', function (ev) { ev.preventDefault(); ir(true); });
    g.querySelector('.wa-paso-sin').addEventListener('click', function () { ir(false); });
    g.querySelector('.wa-paso-x').addEventListener('click', function () { g.close(); });
    // Tocar afuera del recuadro lo cierra
    g.addEventListener('click', function (ev) { if (ev.target === g) g.close(); });
    try {
      var v = JSON.parse(sessionStorage.getItem('db_paso') || '{}') || {};
      if (v.e) em.value = v.e;
      if (v.r) { var x = f.querySelector('input[name="rubro"][value="' + v.r + '"]'); if (x) x.checked = true; }
    } catch (x) {}
    paso = g; return g;
  }
  document.querySelectorAll('.js-wa').forEach(function (a) {
    var msg = a.getAttribute('data-msg') || 'Hola DEVISEBIT';
    a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg + REF);
    a.target = '_blank'; a.rel = 'noopener';
    // Palabras clave del bot (por ejemplo INICIO) van directo: el texto tiene que llegar tal cual
    var directo = /^[A-ZÁÉÍÓÚÑ]{3,}$/.test(msg);
    a.addEventListener('click', function (ev) {
      var g = directo ? null : armarPaso();
      if (!g) { medir(msg, '', ''); return; }
      ev.preventDefault();
      pasoMsg = msg;
      try { if (window.gtag) gtag('event', 'paso_whatsapp_abierto', { event_label: msg }); } catch (e) {}
      if (!g.open) g.showModal();
    });
  });
  // YouTube: el reproductor (más de 1 MB) se carga recién al tocar el recuadro; sin JavaScript, el recuadro abre el canal
  document.querySelectorAll('a.yt[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var c = document.createElement('div'), i = document.createElement('iframe');
      c.className = 'yt';
      i.src = a.getAttribute('data-yt') + '&autoplay=1'; i.title = 'Últimos videos de DEVISEBIT en YouTube';
      i.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share'; i.allowFullscreen = true;
      c.appendChild(i); a.parentNode.replaceChild(c, a);
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
    // Si un campo de «Contanos más» tiene un dato inválido, la sección se abre para que se vea el aviso
    f.addEventListener('invalid', function (ev) { var m = ev.target.closest && ev.target.closest('details'); if (m) m.open = true; }, true);
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
