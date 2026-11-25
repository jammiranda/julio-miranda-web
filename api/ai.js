// Carga mágica desde la app: texto, foto o audio → propuesta de movimientos para confirmar.
import { readJ, spacePath, currentUser, takeAi, giveBackAi, aiLeft, userPath, body, send, guard, fail } from './_core.js';
import { transcribe, parseMoves } from './_ai.js';

export default guard(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'metodo' });
  const me = await currentUser(req);
  if (!me) return send(res, 401, { error: 'sesion' });
  const b = body(req);
  const id = String(b.id || '');
  if (!(me.spaces || []).includes(id)) throw fail(404, 'No encontramos ese espacio.');
  const { data: space } = await readJ(spacePath(id));
  if (!space || !space.members.some((m) => m.uid === me.id)) throw fail(404, 'No encontramos ese espacio.');
  let text = String(b.text || '').slice(0, 2000).trim();
  const image = typeof b.image === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(b.image) ? b.image : null;
  const audio = typeof b.audio === 'string' ? b.audio : null;
  if (!text && !image && !audio) throw fail(400, 'Contame qué gastaste, mandá un audio o una foto.');
  if ((image && image.length > 4.2e6) || (audio && audio.length > 4.2e6)) throw fail(413, 'El archivo es muy pesado. Probá con uno más corto o una foto más liviana.');
  if (!(await takeAi(me))) throw fail(402, 'Usaste tus cargas mágicas gratis de este mes. Con Pro son ilimitadas.');
  try {
    if (audio) {
      text = await transcribe(req, audio, String(b.mime || 'audio/webm').split(';')[0]);
      if (!text) { await giveBackAi(me); throw fail(422, 'No llegué a escuchar bien el audio. ¿Probás de nuevo?'); }
    }
    const out = await parseMoves(req, { text, image, space });
    if (!out.items.length) await giveBackAi(me);
    const { data: u } = await readJ(userPath(me.email));
    return send(res, 200, { ...out, heard: audio ? text : '', ai: aiLeft(u || me) });
  } catch (e) {
    if (!e.status) await giveBackAi(me);
    if (e.status) throw e;
    console.error('ai', e.message);
    throw fail(502, 'La magia falló un segundo 😅 Probá de nuevo.');
  }
});
