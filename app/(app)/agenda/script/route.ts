import { requerir } from "@/lib/auth"
import { gcalConfig } from "@/lib/agenda"

/**
 * Conector de Google (Apps Script) del Sistema de gestión DEVISEBIT.
 * Versión 2: además de la agenda (ocupado/crear) lee eventos del calendario, archivos de una carpeta de Drive y correos de Gmail.
 * Corre en la cuenta de Google de quien lo implementa; el sistema solo recibe lo que pide, con la clave.
 */
const CODIGO = `// DEVISEBIT · Conector de Google para el Sistema de gestión (versión 2)
// Calendar, Drive y Gmail. La clave ya viene puesta: es la que generó el sistema para tu cuenta. No la compartas.
const TOKEN = '__TOKEN__';
const VERSION = 2;

function doPost(e) {
  const b = JSON.parse(e.postData.contents || '{}');
  if (b.token !== TOKEN) return json({ error: 'no autorizado' });
  try {
    if (b.accion === 'version') return json({ version: VERSION, cuenta: Session.getActiveUser().getEmail() });
    if (b.accion === 'ocupado') return json({ ocupado: ocupado(b) });
    if (b.accion === 'crear') return json(crear(b));
    if (b.accion === 'eventos') return json({ eventos: eventos(b) });
    if (b.accion === 'drive') return json(drive(b));
    if (b.accion === 'gmail') return json({ hilos: gmail(b) });
    return json({ error: 'acción desconocida' });
  } catch (err) {
    return json({ error: String(err && err.message || err) });
  }
}

function ocupado(b) {
  return CalendarApp.getDefaultCalendar().getEvents(new Date(b.desde), new Date(b.hasta))
    .filter(function (ev) { return !ev.isAllDayEvent() && (!ev.getTransparency || String(ev.getTransparency()) !== 'TRANSPARENT'); })
    .map(function (ev) { return [ev.getStartTime().toISOString(), ev.getEndTime().toISOString()]; });
}

function crear(b) {
  const opts = { description: b.descripcion || '', location: b.lugar || '' };
  if (b.email) { opts.guests = b.email; opts.sendInvites = true; }
  const ev = CalendarApp.getDefaultCalendar().createEvent(b.titulo || 'Reunión DEVISEBIT', new Date(b.inicio), new Date(b.fin), opts);
  ev.addPopupReminder(15);
  return { id: ev.getId() };
}

// Eventos con título, invitados y link de Meet. Primero prueba la API de Calendar (trae Meet); si no está disponible, usa CalendarApp.
function eventos(b) {
  try {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=250'
      + '&timeMin=' + encodeURIComponent(b.desde) + '&timeMax=' + encodeURIComponent(b.hasta);
    const r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200) {
      return (JSON.parse(r.getContentText()).items || []).filter(function (x) { return x.status !== 'cancelled'; }).map(function (x) {
        return {
          id: x.id, titulo: x.summary || '(sin título)',
          inicio: x.start.dateTime || x.start.date, fin: x.end.dateTime || x.end.date, todoElDia: !x.start.dateTime,
          lugar: x.location || '', meet: x.hangoutLink || '', link: x.htmlLink || '',
          descripcion: (x.description || '').replace(/<[^>]+>/g, ' ').slice(0, 300),
          invitados: (x.attendees || []).filter(function (a) { return !a.self; }).map(function (a) { return a.email; }),
          organizador: x.organizer && x.organizer.email || ''
        };
      });
    }
  } catch (err) {}
  return CalendarApp.getDefaultCalendar().getEvents(new Date(b.desde), new Date(b.hasta)).map(function (ev) {
    const d = ev.getDescription() || '', l = ev.getLocation() || '';
    const m = (d + ' ' + l).match(/https:\\/\\/meet\\.google\\.com\\/[a-z-]+/);
    return {
      id: ev.getId(), titulo: ev.getTitle() || '(sin título)', inicio: ev.getStartTime().toISOString(), fin: ev.getEndTime().toISOString(),
      todoElDia: ev.isAllDayEvent(), lugar: l, meet: m ? m[0] : '', link: '', descripcion: d.replace(/<[^>]+>/g, ' ').slice(0, 300),
      invitados: ev.getGuestList().map(function (g) { return g.getEmail(); }), organizador: ''
    };
  });
}

// Archivos de una carpeta de Drive (por nombre o ID), con sus subcarpetas hasta 3 niveles.
function drive(b) {
  let carpeta = null;
  try { carpeta = DriveApp.getFolderById(b.carpeta); } catch (err) {}
  if (!carpeta) { const it = DriveApp.getFoldersByName(b.carpeta || 'DEVISEBIT'); if (it.hasNext()) carpeta = it.next(); }
  if (!carpeta) return { error: 'No encontré la carpeta «' + (b.carpeta || 'DEVISEBIT') + '» en tu Drive.' };
  const max = Math.min(b.max || 500, 1000), archivos = [];
  let truncado = false;
  (function recorrer(f, ruta, nivel) {
    const fs = f.getFiles();
    while (fs.hasNext()) {
      if (archivos.length >= max) { truncado = true; return; }
      const a = fs.next();
      archivos.push({ id: a.getId(), nombre: a.getName(), url: a.getUrl(), mime: a.getMimeType(), actualizado: a.getLastUpdated().toISOString(), ruta: ruta });
    }
    if (nivel >= 3) return;
    const sub = f.getFolders();
    while (sub.hasNext()) { const s = sub.next(); recorrer(s, ruta ? ruta + ' / ' + s.getName() : s.getName(), nivel + 1); }
  })(carpeta, '', 0);
  return { carpeta: carpeta.getName(), url: carpeta.getUrl(), archivos: archivos, truncado: truncado };
}

// Hilos de Gmail que coinciden con una búsqueda (la misma sintaxis que el buscador de Gmail).
function gmail(b) {
  return GmailApp.search(b.q || 'in:inbox newer_than:7d', 0, Math.min(b.max || 30, 100)).map(function (t) {
    const ms = t.getMessages(), u = ms[ms.length - 1];
    return {
      id: t.getId(), asunto: t.getFirstMessageSubject() || '(sin asunto)', de: u.getFrom(), para: u.getTo(),
      fecha: t.getLastMessageDate().toISOString(), fragmento: u.getPlainBody().replace(/\\s+/g, ' ').slice(0, 220),
      noLeido: t.isUnread(), mensajes: t.getMessageCount(), link: 'https://mail.google.com/mail/u/0/#all/' + t.getId()
    };
  });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
`

export async function GET() {
  await requerir(["gerente", "coordinacion"])
  const { token } = await gcalConfig()
  return new Response(CODIGO.replace("__TOKEN__", token), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}
