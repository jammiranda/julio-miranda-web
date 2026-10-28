// DEVISEBIT landings · favicon, etiqueta de Google Ads y casos con imagen
(function () {
  var d = document, h = d.head;
  function add(tag, attrs) { var e = d.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); h.appendChild(e); return e; }
  if (!d.querySelector('link[rel~="icon"]')) {
    add('link', { rel: 'icon', href: '/lp-assets/favicon.ico', sizes: 'any' });
    add('link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/lp-assets/favicon-32.png' });
    add('link', { rel: 'apple-touch-icon', href: '/lp-assets/apple-touch-icon.png' });
    add('meta', { name: 'theme-color', content: '#0B0B0D' });
  }
  if (!window.gtag) {
    var s = add('script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=AW-10953063902' });
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'AW-10953063902');
  }
  var st = d.createElement('style'); st.textContent = ".work-item.has-img{padding:0;background:#0E0E10;container-type:inline-size}.work-item.has-img::before,.work-item.has-img::after{display:none}.work-item.has-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;transition:transform .5s ease}.work-item.has-img:hover img,.work-item.has-img:hover .mk{transform:scale(1.04)}.work-item.has-img span{position:absolute;left:0;right:0;bottom:0;padding:44px 16px 14px;background:linear-gradient(transparent,rgba(8,8,10,.94) 55%)}.mk{position:absolute;inset:0;font-size:2.5cqw;background:radial-gradient(circle at 75% 15%,#3a0d10,#0B0B0D 62%);overflow:hidden;transition:transform .5s ease;font-family:inherit}.mk-wa em{position:absolute;left:1.6em;top:1.4em;font-style:normal;font-weight:700;font-size:1em;letter-spacing:.12em;text-transform:uppercase;color:#fff}.mk-wa em i{display:inline-block;width:.6em;height:.6em;border-radius:50%;background:#E11D2A;margin-right:.5em}.mk-wa .ph{position:absolute;left:50%;top:3.6em;width:20em;margin-left:-10em;bottom:-2em;background:#0b141a;border:.4em solid #1d1d22;border-radius:1.8em;padding:0 .8em;box-shadow:0 1.5em 4em rgba(0,0,0,.6)}.mk-wa .hd{display:flex;gap:.6em;align-items:center;background:#202c33;margin:0 -.8em .7em;padding:.8em;color:#e9edef;font-weight:700;font-size:1.05em}.mk-wa .hd b{width:2em;height:2em;border-radius:50%;background:#E11D2A;display:flex;align-items:center;justify-content:center;color:#fff}.mk-wa .hd small{display:block;color:#8696a0;font-weight:400;font-size:.75em}.mk-wa p{margin:0 0 .5em;max-width:80%;padding:.45em .7em;border-radius:.6em;font-size:1em;line-height:1.3;color:#e9edef}.mk-wa p.in{background:#202c33}.mk-wa p.out{background:#005c4b;margin-left:auto}.mk-rs .pst{position:absolute;left:3.5em;top:2.4em;width:15em;height:18.75em;border-radius:1em;padding:1.4em;box-sizing:border-box;transform:rotate(-5deg);box-shadow:0 1.2em 3em rgba(0,0,0,.55);z-index:2;border-bottom:.45em solid var(--acc)}.mk-rs .pst.p2{left:15.5em;top:3.4em;transform:rotate(4deg);background:var(--acc);color:#fff;z-index:1;border:0}.mk-rs u{display:inline-block;text-decoration:none;background:var(--acc);color:#fff;font-size:.8em;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:.35em .65em;border-radius:.4em}.mk-rs .p2 u{background:#0B0B0D}.mk-rs h5{font-size:2em;line-height:1.02;margin:1.1em 0 0;font-weight:900;letter-spacing:-.02em}.mk-rs .pst small{position:absolute;left:1.4em;bottom:1.2em;font-weight:800;font-size:1em}.mk-rs .rl{position:absolute;right:2em;top:11em;width:6em;height:10.6em;border-radius:.8em;background:var(--acc);color:#fff;padding:.8em;box-sizing:border-box;font-weight:800;font-size:1.05em;box-shadow:0 1em 2em rgba(0,0,0,.5);z-index:3}"; h.appendChild(st);
  var CASES = {"webs": "<div class=\"work-item has-img reveal\"><img src=\"/lp-assets/cases/csc.webp\" alt=\"Centro médico · Web con turnos y servicios\" loading=\"lazy\"><span>Centro médico<small>Web con turnos y servicios</small></span></div><div class=\"work-item has-img reveal\"><img src=\"/lp-assets/cases/devisebit.webp\" alt=\"Empresa de tecnología · Web institucional\" loading=\"lazy\"><span>Empresa de tecnología<small>Web institucional</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/turismo-nautico.jpg\" alt=\"Turismo náutico · Web comercial\" loading=\"lazy\"><span>Turismo náutico<small>Web comercial</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/web-arquitectura.jpg\" alt=\"Estudio de arquitectura · Web con portfolio\" loading=\"lazy\"><span>Estudio de arquitectura<small>Web con portfolio</small></span></div>", "whatsapp": "<div class=\"work-item has-img reveal\"><div class=\"mk mk-wa\"><em><i></i>Agente IA · 24 h</em><div class=\"ph\"><div class=\"hd\"><b>C</b><div>Centro Médico<small>en línea</small></div></div><p class=\"in\">Hola, quiero turno con clínica médica</p><p class=\"out\">¡Hola! Tengo martes 10:30 o jueves 16:00. ¿Cuál preferís?</p><p class=\"in\">El jueves</p><p class=\"out\">Listo ✅ Jueves 16:00. Te recuerdo el día antes.</p></div></div><span>Salud<small>Turnos y consultas</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-wa\"><em><i></i>Agente IA · 24 h</em><div class=\"ph\"><div class=\"hd\"><b>R</b><div>Residencia Los Álamos<small>en línea</small></div></div><p class=\"in\">¿Qué incluye la estadía permanente?</p><p class=\"out\">Habitación, 4 comidas, enfermería 24 h y talleres. ¿Coordinamos una visita?</p><p class=\"in\">Sí, el sábado</p><p class=\"out\">Agendado 🙌 Sábado 11 h.</p></div></div><span>Residencias y centros de día<small>Información a familias</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-wa\"><em><i></i>Agente IA · 24 h</em><div class=\"ph\"><div class=\"hd\"><b>A</b><div>Asesor de Planes<small>en línea</small></div></div><p class=\"in\">Quiero info de planes de salud</p><p class=\"out\">¡Hola! ¿Para cuántas personas es y qué edades tienen?</p><p class=\"in\">Somos 3: 34, 32 y 2 años</p><p class=\"out\">Genial. Te paso con un asesor con 2 opciones 👌</p></div></div><span>Venta de planes<small>Calificación de clientes</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-wa\"><em><i></i>Agente IA · 24 h</em><div class=\"ph\"><div class=\"hd\"><b>F</b><div>Ferretería Centro<small>en línea</small></div></div><p class=\"in\">¿Tienen taladro percutor?</p><p class=\"out\">Sí 🔧 Percutor 750W, hasta 3 cuotas sin interés. ¿Lo reservo?</p><p class=\"in\">Dale, retiro hoy</p><p class=\"out\">Reservado ✅ Pedido #2481.</p></div></div><span>Comercios<small>Precios y pedidos</small></span></div>", "redes": "<div class=\"work-item has-img reveal\"><div class=\"mk mk-rs\" style=\"--acc:#E11D2A\"><div class=\"pst\" style=\"background:#0B0B0D;color:#fff\"><u>Reel</u><h5>Tu WhatsApp atiende solo.</h5><small>DEVISEBIT</small></div><div class=\"pst p2\"><u>Historia</u><h5>Escribinos por WhatsApp</h5></div><div class=\"rl\">▶ 0:15<br>Reel</div></div><span>Tecnología<small>Reels y placas</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-rs\" style=\"--acc:#0E9F8E\"><div class=\"pst\" style=\"background:#F4FBFA;color:#0B0B0D\"><u>Placa</u><h5>Internación domiciliaria</h5><small>Cuidar en Casa</small></div><div class=\"pst p2\"><u>Historia</u><h5>Escribinos por WhatsApp</h5></div><div class=\"rl\">▶ 0:15<br>Reel</div></div><span>Internación domiciliaria<small>Placas e historias</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-rs\" style=\"--acc:#2563EB\"><div class=\"pst\" style=\"background:#EEF4FF;color:#0B0B0D\"><u>Efeméride</u><h5>Día Mundial del Corazón</h5><small>Clínica del Sur</small></div><div class=\"pst p2\"><u>Historia</u><h5>Escribinos por WhatsApp</h5></div><div class=\"rl\">▶ 0:15<br>Reel</div></div><span>Clínicas y centros médicos<small>Campañas y efemérides</small></span></div><div class=\"work-item has-img reveal\"><div class=\"mk mk-rs\" style=\"--acc:#F59E0B\"><div class=\"pst\" style=\"background:#1A1203;color:#fff\"><u>Carrusel</u><h5>+1000 inscriptos</h5><small>Comunidad Educativa</small></div><div class=\"pst p2\"><u>Historia</u><h5>Escribinos por WhatsApp</h5></div><div class=\"rl\">▶ 0:15<br>Reel</div></div><span>Comunidad educativa<small>Carruseles y cursos</small></span></div>", "sistemas": "<div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/panel-administracion.jpg\" alt=\"Empresas · Panel de administración a medida\" loading=\"lazy\"><span>Empresas<small>Panel de administración a medida</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/plataforma-academia.jpg\" alt=\"Instituciones · Tablero de cursos y afiliados\" loading=\"lazy\"><span>Instituciones<small>Tablero de cursos y afiliados</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/app-espectaculos.jpg\" alt=\"Eventos · App de espectáculos y entradas\" loading=\"lazy\"><span>Eventos<small>App de espectáculos y entradas</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/portal-exportacion.jpg\" alt=\"Gobierno provincial · Portal de oferta exportable\" loading=\"lazy\"><span>Gobierno provincial<small>Portal de oferta exportable</small></span></div>", "comunidad": "<div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/plataforma-academia.jpg\" alt=\"Comunidad gremial · Más de 1000 inscriptos en un año\" loading=\"lazy\"><span>Comunidad gremial<small>Más de 1000 inscriptos en un año</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/expo-posgrado-universidad.jpg\" alt=\"Universidad · Posgrados, eventos e inscripciones\" loading=\"lazy\"><span>Universidad<small>Posgrados, eventos e inscripciones</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/portal-expo-productiva.jpg\" alt=\"Gobierno provincial · Portal de una expo productiva\" loading=\"lazy\"><span>Gobierno provincial<small>Portal de una expo productiva</small></span></div><div class=\"work-item has-img reveal\"><img src=\"https://julio.devisebit.com/media/trabajos/panel-administracion.jpg\" alt=\"Obra social · Padrón, órdenes y recaudación\" loading=\"lazy\"><span>Obra social<small>Padrón, órdenes y recaudación</small></span></div>"};
  var slug = (location.pathname.split('/')[1] || '').toLowerCase();
  var w = d.querySelector('#trabajos .work');
  if (w && CASES[slug] && !w.querySelector('.has-img')) w.innerHTML = CASES[slug];
  if (slug === 'webs') {
    var fl = d.querySelector('.foot-links');
    if (fl && !fl.querySelector('a[href*="brochure"]')) { var a = d.createElement('a'); a.href = '/webs/brochure/'; a.textContent = 'Brochure (PDF)'; fl.insertBefore(a, fl.firstChild); fl.insertBefore(d.createTextNode(' '), a.nextSibling); }
  }
  if (slug === 'redes') {
    d.querySelectorAll('.card').forEach(function (c) {
      var t = c.querySelector('h3');
      if (!t || t.textContent.indexOf('Anuncios') < 0) return;
      var pr = c.querySelector('.price'); if (pr) { pr.className = 'price'; pr.innerHTML = '$690.000<small>/mes</small>'; }
      var tm = c.querySelector('.time'); if (tm) tm.textContent = 'Inversión en anuncios aparte';
      var li = c.querySelectorAll('li'); if (li[1]) li[1].textContent = 'Anuncios en Instagram y Facebook, con inversión de hasta $800.000 por mes';
      var b = c.querySelector('.btn'); if (b) { b.textContent = 'Quiero este'; b.setAttribute('data-msg', 'Hola DEVISEBIT, me interesa Redes 360 + Anuncios'); }
    });
    var nt = d.querySelector('#planes .note, .note');
    if (nt && nt.textContent.indexOf('Solo anuncios') < 0) nt.insertAdjacentHTML('afterend', '<p class="note"><b>¿Solo anuncios?</b> Gestión de Meta Ads o Google Ads: armado $120.000 una vez y $150.000 por mes, con hasta $600.000 de inversión incluida. Meta + Google: armado $180.000 y $250.000 por mes. La inversión la pagás vos directo a Meta o Google.</p>');
  }
})();
// WhatsApp de DEVISEBIT: 11 7346-6490
  // Después de enviar un formulario: página de gracias del sitio
  document.querySelectorAll('input[name="_next"]').forEach(function (i) { i.value = 'https://www.devisebit.com/gracias'; });
  // Comunidad: producto aparte para gremios (padrón + obra social, sin academia)
  if (/^\/comunidad/.test(location.pathname)) {
    var pl = document.querySelector('#planes .cards');
    if (pl && !document.getElementById('gremios')) {
      var g = document.createElement('article');
      g.id = 'gremios'; g.className = 'card reveal in';
      g.style.cssText = 'margin-top:20px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px 28px;align-items:start';
      g.innerHTML = '<div><div class="mono" style="color:var(--red-2,#FF6A63)">Producto aparte · para gremios</div><h3 style="margin-top:6px">Sistema de padrón y obra social</h3><div class="price">$1.690.000</div><div class="time">+ $299.000 por mes · hasta 5.000 afiliados</div><p style="margin:10px 0 0;color:var(--muted,#C3C8D1)">La parte de gestión de la plataforma gremial, sin academia ni cursos. Para el gremio que necesita ordenar el padrón y la obra social.</p></div>' +
        '<div><ul><li>Padrón de afiliados con credencial digital</li><li>Aportes, cuotas y estado de cada afiliado</li><li>Obra social: beneficiarios, órdenes y autorizaciones</li><li>Prestadores y cartilla</li><li>Tablero para la conducción</li></ul><a class="btn btn-red js-wa" data-msg="Hola DEVISEBIT, me interesa el sistema de padrón y obra social para gremios" href="#">Quiero este</a></div>';
      pl.parentNode.insertBefore(g, pl.nextSibling);
    }
  }
  var WA = '5491173466490';
  // Conversión Google Ads «Contacto por WhatsApp»
  var AW_CONV = 'AW-10953063902/pk_YCMaLpaodEN776eYo';
  document.querySelectorAll('.js-wa').forEach(function (a) {
    var msg = a.getAttribute('data-msg') || 'Hola DEVISEBIT';
    a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
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
  // Formulario de inicio: también cuenta como contacto
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function () {
      try { if (window.gtag) gtag('event', 'conversion', { send_to: AW_CONV }); } catch (e) {}
      try { if (window.fbq) fbq('track', 'Lead'); } catch (e) {}
    });
  });
