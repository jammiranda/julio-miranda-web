export const metadata = { title: 'Política de privacidad — MateBot by DEVISEBIT' };

export default function Privacidad() {
  return (
    <main className="wrap legal">
      <p><a href="/">← Volver a MateBot</a></p>
      <h1>Política de privacidad</h1>
      <p>Última actualización: noviembre de 2026.</p>
      <p>MateBot es un servicio gratuito de <b>DEVISEBIT SRL</b> (Buenos Aires, Argentina), responsable de la base de datos. Esta política explica qué datos usamos, para qué y cómo podés ejercer tus derechos, de acuerdo con la Ley 25.326 de Protección de los Datos Personales.</p>

      <h2>1. Qué datos usamos</h2>
      <ul>
        <li><b>Datos de cuenta:</b> nombre y usuario de Telegram, el teléfono que compartas y el mail que nos des (todos opcionales salvo los de Telegram).</li>
        <li><b>Contenido que cargás:</b> eventos, recordatorios, cumpleaños y listas.</li>
        <li><b>Audios:</b> se transcriben a texto para entender el pedido y <b>no se guardan</b>.</li>
        <li><b>Google Calendar (si lo conectás):</b> leemos tus eventos para avisarte y creamos los que nos dictes. Guardamos el permiso de acceso cifrado.</li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Tu agenda, tus listas, tus audios y tu calendario se usan <b>únicamente para prestarte el servicio</b>: ordenar, recordarte y resumirte. No los leemos con otro fin, no los vendemos y no los compartimos.</li>
        <li>Tu nombre, mail y teléfono se usan para gestionar tu cuenta y darte soporte.</li>
        <li><b>Solo si lo aceptás</b> (es opcional y MateBot funciona igual), los usamos para enviarte novedades sobre otros productos y servicios de DEVISEBIT. Podés retirar ese permiso en cualquier momento con el comando /novedades.</li>
      </ul>

      <h2>3. Con quién se procesan</h2>
      <p>Para funcionar usamos proveedores que procesan datos por cuenta nuestra y bajo sus propias medidas de seguridad: Telegram (mensajería), Vercel (alojamiento), Neon (base de datos), Groq (transcripción de audios), Anthropic (interpretación del texto con inteligencia artificial) y Google (si conectás tu calendario). Algunos operan fuera de Argentina. No vendemos ni cedemos tus datos a terceros para fines comerciales.</p>

      <h2>4. Uso de datos de Google</h2>
      <p>El uso que MateBot hace de la información recibida de las APIs de Google se ajusta a la Política de Datos de Usuario de los Servicios de API de Google, incluidos los requisitos de uso limitado. No usamos datos de tu calendario para publicidad ni para entrenar modelos de inteligencia artificial.</p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>Mientras tengas tu cuenta. Si escribís /borrar, eliminamos tu cuenta, tu contenido y el acceso a Google. Los eventos que ya hayamos creado en tu Google Calendar quedan en tu calendario, que es tuyo.</p>

      <h2>6. Tus derechos</h2>
      <p>Podés pedir acceso, rectificación, actualización o supresión de tus datos escribiendo a <a href="mailto:info@devisebit.com">info@devisebit.com</a>. El titular de los datos tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>

      <h2>7. Seguridad</h2>
      <p>Usamos conexiones cifradas, guardamos cifrado el acceso a Google y limitamos el acceso interno a lo indispensable para operar el servicio.</p>

      <h2>8. Contacto</h2>
      <p>DEVISEBIT SRL · <a href="mailto:info@devisebit.com">info@devisebit.com</a></p>
    </main>
  );
}
