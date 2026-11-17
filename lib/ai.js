import { cfg } from './config';
import { localParts } from './time';

const TOOL = {
  name: 'acciones',
  description: 'Devuelve las acciones que el usuario quiere hacer con su agenda, recordatorios y listas.',
  input_schema: {
    type: 'object',
    properties: {
      acciones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['evento', 'recordatorio', 'cumpleanios', 'lista_agregar', 'lista_ver', 'lista_quitar', 'agenda', 'charla'],
              description: 'evento: algo con fecha/hora (turno, reunión, viaje). recordatorio: avisame de algo a tal hora. cumpleanios: cumpleaños o aniversario anual. lista_agregar/ver/quitar: listas (súper, tareas, regalos). agenda: pregunta qué tiene un día o la semana. charla: saludo, duda o algo que no es una acción.',
            },
            titulo: { type: 'string', description: 'Título corto y claro, con mayúscula inicial. Ej: "Dentista con León".' },
            inicio: { type: 'string', description: 'Fecha y hora local "YYYY-MM-DDTHH:MM", o "YYYY-MM-DD" si es todo el día.' },
            fin: { type: 'string', description: 'Fin local "YYYY-MM-DDTHH:MM" si lo dijo; si no, omitir.' },
            todo_el_dia: { type: 'boolean' },
            fecha_cumple: { type: 'string', description: 'Para cumpleaños: "MM-DD".' },
            lista: { type: 'string', description: 'Nombre de la lista en minúsculas, ej "super". Por defecto "super" si son cosas de comprar, "tareas" si son pendientes.' },
            elementos: { type: 'array', items: { type: 'string' }, description: 'Elementos a agregar o quitar de la lista.' },
            familiar: { type: 'boolean', description: 'true si dijo que es para la familia / compartido / "anotalo para todos".' },
            dia_consulta: { type: 'string', description: 'Para agenda: "YYYY-MM-DD" o "semana".' },
            respuesta: { type: 'string', description: 'Para charla: respuesta breve, cálida, en argentino.' },
          },
          required: ['tipo'],
        },
      },
    },
    required: ['acciones'],
  },
};

export async function interpret(text) {
  if (!cfg.anthropicKey) throw new Error('Falta ANTHROPIC_API_KEY');
  const now = localParts();
  const system = `Sos MateBot, un asistente personal por chat de DEVISEBIT, argentino, cálido y breve.
Hoy es ${now.weekday} ${now.date}, son las ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')} (hora de Argentina).
Interpretá el mensaje y devolvé SIEMPRE las acciones con la herramienta "acciones".
Reglas:
- Resolvé fechas relativas ("el jueves", "mañana", "pasado", "el 3") a fechas concretas futuras.
- Si no dice hora para un evento, usá todo_el_dia=true.
- "a la mañana" = 09:00, "al mediodía" = 12:00, "a la tarde" = 16:00, "a la noche" = 20:00.
- Un mensaje puede traer varias acciones.
- Si es un saludo o algo fuera de agenda/listas, usá "charla" con una respuesta corta y ofrecé ayuda.
- Nunca inventes datos que el usuario no dijo.`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.claudeModel,
      max_tokens: 1024,
      system,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'acciones' },
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const use = j.content?.find((c) => c.type === 'tool_use');
  return use?.input?.acciones || [];
}
