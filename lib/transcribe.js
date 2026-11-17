import { cfg } from './config';

// Transcribe audios con Whisper en Groq. El audio no se guarda: se procesa y se descarta.
export async function transcribe(buf, filename = 'audio.ogg') {
  if (!cfg.groqKey) throw new Error('Falta GROQ_API_KEY');
  const form = new FormData();
  form.append('file', new Blob([buf]), filename.split('/').pop());
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'es');
  form.append('response_format', 'json');
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.groqKey}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Transcripción falló (${r.status})`);
  const j = await r.json();
  return (j.text || '').trim();
}
