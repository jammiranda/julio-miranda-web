export const metadata = { title: 'Términos de uso — MateBot by DEVISEBIT' };

export default function Terminos() {
  return (
    <main className="wrap legal">
      <p><a href="/">← Volver a MateBot</a></p>
      <h1>Términos de uso</h1>
      <p>Última actualización: noviembre de 2026.</p>
      <h2>1. El servicio</h2>
      <p>MateBot es un asistente personal gratuito de DEVISEBIT SRL que funciona por Telegram (y próximamente WhatsApp). Ayuda a anotar eventos, recordatorios, cumpleaños y listas, y a recibir avisos.</p>
      <h2>2. Uso responsable</h2>
      <ul>
        <li>MateBot es una ayuda: revisá la confirmación antes de agendar. La interpretación automática puede equivocarse.</li>
        <li>No lo uses como único medio para cosas críticas (por ejemplo, tomas de medicación o vencimientos legales) sin otro respaldo.</li>
        <li>No lo uses para enviar contenido ilegal ni para molestar a otras personas.</li>
      </ul>
      <h2>3. Disponibilidad</h2>
      <p>Hacemos lo posible para que funcione siempre, pero puede haber interrupciones. Podemos cambiar funciones, poner límites razonables de uso gratuito o discontinuar el servicio avisando con anticipación por el mismo bot.</p>
      <h2>4. Privacidad</h2>
      <p>El uso de tus datos se rige por la <a href="/privacidad">Política de privacidad</a>.</p>
      <h2>5. Baja</h2>
      <p>Podés dejar de usar MateBot cuando quieras y borrar todo con /borrar.</p>
      <h2>6. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República Argentina.</p>
    </main>
  );
}
