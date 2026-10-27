import { requerir } from "@/lib/auth"
import { gcalConfig } from "@/lib/agenda"

/** Código de Google Apps Script que conecta la agenda del sistema con Google Calendar. */
const CODIGO = `// DEVISEBIT · conexión de la agenda con Google Calendar
// La clave ya viene puesta: es la que generó el sistema para tu cuenta. No la compartas.
const TOKEN = '__TOKEN__';

function doPost(e) {
  const b = JSON.parse(e.postData.contents || '{}');
  if (b.token !== TOKEN) return json({ error: 'no autorizado' });
  const cal = CalendarApp.getDefaultCalendar();
  if (b.accion === 'ocupado') {
    const evs = cal.getEvents(new Date(b.desde), new Date(b.hasta));
    const ocupado = evs
      .filter(function (ev) { return !ev.isAllDayEvent() && (!ev.getTransparency || String(ev.getTransparency()) !== 'TRANSPARENT'); })
      .map(function (ev) { return [ev.getStartTime().toISOString(), ev.getEndTime().toISOString()]; });
    return json({ ocupado: ocupado });
  }
  if (b.accion === 'crear') {
    const opts = { description: b.descripcion || '', location: b.lugar || '' };
    if (b.email) { opts.guests = b.email; opts.sendInvites = true; }
    const ev = cal.createEvent(b.titulo || 'Reunión DEVISEBIT', new Date(b.inicio), new Date(b.fin), opts);
    ev.addPopupReminder(15);
    return json({ id: ev.getId() });
  }
  return json({ error: 'acción desconocida' });
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
