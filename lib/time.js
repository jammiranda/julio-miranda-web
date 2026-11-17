// Argentina no tiene horario de verano: UTC-3 fijo.
export const OFFSET = '-03:00';

export function localParts(d = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'long', hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    hour: parseInt(p.hour === '24' ? '0' : p.hour, 10),
    minute: parseInt(p.minute, 10),
    weekday: new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' }).format(d),
  };
}

// "2026-11-20T10:00" (hora local) -> Date
export function fromLocal(s) {
  if (!s) return null;
  const clean = s.length === 10 ? `${s}T00:00` : s.slice(0, 16);
  const d = new Date(`${clean}:00${OFFSET}`);
  return isNaN(d) ? null : d;
}

export function dayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00${OFFSET}`);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start, end };
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00${OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return localParts(d).date;
}

const fmtHour = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false,
});
const fmtDay = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long',
});

export const hora = (d) => fmtHour.format(d);
export const dia = (d) => fmtDay.format(d);
export const cuando = (d, allDay) => (allDay ? dia(d) : `${dia(d)} a las ${hora(d)}`);
