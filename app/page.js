import Mate3D from './Mate3D';
import Animations from './Animations';
import Icon from './Icon';

const BOT = process.env.NEXT_PUBLIC_BOT_USERNAME || 'MateBotAR_bot';
const TG = `https://t.me/${BOT}`;
const DEVISEBIT_WA = 'https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20MateBot';

const features = [
  ['mic', 'Le hablás, te entiende', 'Mandá un audio como a un amigo. MateBot lo transcribe, entiende fechas y horarios y lo ordena solo.'],
  ['calendar', 'Conectado a Google Calendar', 'Lo que dictás queda en tu calendario, y te avisa también de lo que cargues ahí o te agenden otros.'],
  ['sun', 'Resumen cada mañana', 'A la hora que elijas te llega tu día: turnos, reuniones, recordatorios y cumpleaños.'],
  ['bell', 'Avisos a tiempo', 'Te escribe un rato antes de cada compromiso. Si dos cosas se superponen, te lo dice antes de agendar.'],
  ['list', 'Listas compartidas', 'Súper, tareas, regalos. "Agregá yerba y pan" y listo. La del súper la ve toda la familia.'],
  ['cake', 'Cumpleaños sin olvidos', 'Cargás la fecha una vez y te avisa todos los años, el día antes y el mismo día.'],
];

const faqs = [
  ['¿De verdad es gratis?', 'Sí. No hay prueba que vence ni tarjeta. MateBot es la carta de presentación de DEVISEBIT: mostramos lo que hacemos con inteligencia artificial y automatización.'],
  ['¿Qué hacen con mis datos?', 'Tu agenda, tus audios y tus listas solo se usan para darte el servicio: no los leemos, no los vendemos y no los compartimos. Los audios se transcriben y se descartan. Tu nombre, mail y teléfono se usan para tu cuenta y, solo si aceptás, para escribirte con novedades de DEVISEBIT.'],
  ['¿Necesito instalar algo?', 'Solo Telegram, que seguro ya tenés. Abrís el link, tocás "Iniciar" y arrancás. Sin apps nuevas ni contraseñas.'],
  ['¿Y por WhatsApp?', 'Muy pronto. Tu cuenta va a funcionar en los dos: lo que cargues por Telegram lo vas a ver por WhatsApp.'],
  ['¿Puedo borrar todo?', 'Cuando quieras. Escribí /borrar y eliminamos tu cuenta, tus listas, tus recordatorios y la conexión con Google.'],
  ['¿Sirve para mi negocio?', 'Para eso existe la versión para empresas: turnos, recordatorios a pacientes o clientes y atención automática. Escribinos.'],
];

const Section = ({ id, eyebrow, title, sub, children, className = '' }) => (
  <section id={id} className={`sec ${className}`}>
    <div className="wrap">
      {(eyebrow || title) && (
        <header className="sec-head" data-reveal>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h2>{title}</h2>}
          {sub && <p className="sec-sub">{sub}</p>}
        </header>
      )}
      {children}
    </div>
  </section>
);

export default function Home() {
  return (
    <main>
      <Animations />

      <nav className="nav">
        <div className="wrap nav-in">
          <a href="#" className="brand"><img src="/matebot.svg" alt="" width="34" height="34" /><span>MateBot</span><small>by DEVISEBIT</small></a>
          <div className="nav-links">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#funciones">Funciones</a>
            <a href="#privacidad">Privacidad</a>
            <a href="#empresas">Empresas</a>
          </div>
          <a className="btn sm" href={TG}>Empezar gratis</a>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="pill a1"><i className="dot" /> Gratis en Telegram <span className="sep" /> <b className="wa">Muy pronto en WhatsApp</b></span>
            <h1 className="a2">Le hablás como a un amigo. <em>MateBot</em> te ordena la semana.</h1>
            <p className="lead a3">El asistente personal por audio que anota turnos, reuniones, cumpleaños y listas, te avisa a tiempo y se comparte con tu familia.</p>
            <div className="ctas a4">
              <a className="btn" href={TG}>Empezar gratis en Telegram <Icon name="arrow" size={18} /></a>
              <span className="btn ghost wa-btn" aria-disabled="true"><i className="dot wa-dot" /> WhatsApp · muy pronto</span>
            </div>
          </div>

          <div className="hero-visual a3">
            <div className="glow" />
            <div className="mate-wrap"><Mate3D size={440} /></div>
            <div className="float f1"><span className="fi red"><Icon name="calendar" size={18} /></span><div><b>Dentista con León</b><small>Jueves · 10:00 · Agendado</small></div></div>
            <div className="float f2"><span className="fi amber"><Icon name="bell" size={18} /></span><div><b>Llamar a mamá</b><small>Hoy · 18:00</small></div></div>
            <div className="float f3"><span className="fi green"><Icon name="list" size={18} /></span><div><b>Súper (familia)</b><small>Yerba · leche · pan</small></div></div>
          </div>
        </div>

        <div className="wrap">
          <ul className="trust a4">
            <li><Icon name="gift" size={20} /> 100% gratis</li>
            <li><Icon name="zap" size={20} /> Sin instalar nada</li>
            <li><Icon name="calendar" size={20} /> Google Calendar</li>
            <li><Icon name="shield" size={20} /> Tus datos son tuyos</li>
          </ul>
        </div>
      </section>

      <Section id="como-funciona" eyebrow="Cómo funciona" title="Tres pasos. Cero apps nuevas." sub="Empezás en un minuto desde el chat que ya usás todos los días.">
        <ol className="steps">
          {[
            ['Abrís el link', 'Entrás a MateBot en Telegram y tocás "Iniciar". Tu cuenta queda lista en un minuto.'],
            ['Le hablás', 'Audio o texto, como te salga. Entiende "mañana", "el jueves a la tarde" o "el 3".'],
            ['Te olvidás', 'Te avisa antes de cada cosa y cada mañana te cuenta qué tenés.'],
          ].map(([t, d], i) => (
            <li key={t} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="num">0{i + 1}</span><h3>{t}</h3><p>{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <section className="sec demo-sec">
        <div className="wrap demo">
          <div className="demo-copy" data-reveal>
            <span className="eyebrow">En acción</span>
            <h2>Un audio de 6 segundos. Una semana ordenada.</h2>
            <p className="sec-sub left">Le contás lo que tenés, MateBot lo entiende, te muestra lo que anotó y te pide confirmación. Después se ocupa de recordártelo.</p>
            <ul className="checks">
              <li><Icon name="check" size={16} />Entiende fechas y horarios dichos de forma natural.</li>
              <li><Icon name="check" size={16} />Te avisa si algo se superpone antes de agendar.</li>
              <li><Icon name="check" size={16} />Siempre te pide confirmación: la decisión es tuya.</li>
            </ul>
          </div>
          <div className="phone" aria-hidden="true" data-reveal>
            <div className="screen">
              <div className="bar"><img src="/matebot.svg" alt="" width="30" height="30" /><div><b>MateBot</b><i>en línea</i></div></div>
              <div className="msg me audio" data-step><span className="play">▶</span><span className="wave">▂▃▅▇▅▃▂▃▅▇▅▃▂▅▇</span>0:06</div>
              <div className="msg bot" data-step><i>"El jueves a las 10 tengo dentista con León y recordame comprar yerba"</i></div>
              <div className="msg bot" data-step>¿Lo agendo así?<br /><b>Dentista con León</b> · jueves 10:00<br />Súper: <b>yerba</b></div>
              <div className="chips" data-step><span>Agendar</span><span>Cancelar</span></div>
              <div className="msg bot" data-step>¡Agendado! Te aviso a tiempo 🧉</div>
              <div className="msg bot" data-step>☀️ <b>¡Buen día!</b> Hoy tenés:<br />10:00 · Dentista con León<br />Cumple de la abuela</div>
            </div>
          </div>
        </div>
      </section>

      <Section id="funciones" eyebrow="Funciones" title="Todo lo que hace por vos" sub="Un solo asistente para tu agenda, tus pendientes y tu familia.">
        <div className="grid3">
          {features.map(([ic, t, d], k) => (
            <article key={t} className="card" data-reveal style={{ transitionDelay: `${(k % 3) * 0.08}s` }}>
              <span className="ic"><Icon name={ic} /></span><h3>{t}</h3><p>{d}</p>
            </article>
          ))}
        </div>
      </Section>

      <section className="sec">
        <div className="wrap bento">
          <div className="tile family" data-reveal>
            <span className="ic"><Icon name="users" /></span>
            <h3>Hecho para la familia</h3>
            <p>Creás tu familia con /familia y le pasás el código a los tuyos. Comparten la lista del súper, los cumpleaños y lo que marques "para la familia".</p>
            <div className="code">/unirme <b>7F3A2C</b></div>
          </div>
          <div className="tile wa-tile" data-reveal style={{ transitionDelay: '.1s' }}>
            <span className="ic wa-ic"><Icon name="chat" /></span>
            <span className="badge">Próximamente</span>
            <h3>También en WhatsApp</h3>
            <p>Vas a poder usar MateBot desde la app que prefieras, con la misma cuenta. Si empezás hoy, el día que llegue ya tenés todo listo.</p>
          </div>
        </div>
      </section>

      <Section id="privacidad" eyebrow="Privacidad" title="Tus datos son tuyos. Punto." sub="Reglas claras desde el diseño, explicadas sin letra chica.">
        <div className="grid2">
          <div className="card" data-reveal>
            <span className="ic"><Icon name="lock" /></span>
            <h3>Lo que nunca hacemos</h3>
            <ul className="ticks">
              <li>Usar tu agenda, tus audios o tus listas para otra cosa que no sea darte el servicio.</li>
              <li>Vender o compartir tu información con nadie.</li>
              <li>Guardar tus audios: se transcriben y se descartan.</li>
            </ul>
          </div>
          <div className="card" data-reveal style={{ transitionDelay: '.1s' }}>
            <span className="ic"><Icon name="shield" /></span>
            <h3>Lo que te pedimos, con permiso</h3>
            <ul className="ticks">
              <li>Nombre, mail y teléfono para tu cuenta.</li>
              <li>Solo si aceptás, novedades de DEVISEBIT. Es opcional y MateBot funciona igual.</li>
              <li>Te das de baja con /novedades y borrás todo con /borrar.</li>
            </ul>
          </div>
        </div>
        <p className="center-link" data-reveal><a href="/privacidad">Leé la política de privacidad completa <Icon name="arrow" size={16} /></a></p>
      </Section>

      <section className="sec" id="empresas">
        <div className="wrap">
          <div className="biz" data-reveal>
            <div>
              <span className="eyebrow">Para empresas</span>
              <h2>¿Un MateBot para tu negocio?</h2>
              <p>MateBot es gratis porque es nuestra carta de presentación. En DEVISEBIT llevamos esta misma tecnología a consultorios, centros de salud, estudios y comercios: turnos y recordatorios automáticos, atención por WhatsApp y agendas de equipo, integradas con tu CRM.</p>
            </div>
            <a className="btn" href={DEVISEBIT_WA}>Hablemos <Icon name="arrow" size={18} /></a>
          </div>
        </div>
      </section>

      <Section eyebrow="Preguntas frecuentes" title="Lo que todos preguntan">
        <div className="faq">
          {faqs.map(([q, a]) => (
            <details key={q} data-reveal><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </Section>

      <section className="sec final">
        <div className="wrap" data-reveal>
          <div className="final-mate"><Mate3D size={220} /></div>
          <h2>Cebate un mate. De la agenda se ocupa él.</h2>
          <div className="ctas center">
            <a className="btn" href={TG}>Empezar gratis en Telegram <Icon name="arrow" size={18} /></a>
            <span className="btn ghost wa-btn" aria-disabled="true"><i className="dot wa-dot" /> WhatsApp · muy pronto</span>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <a href="#" className="brand"><img src="/matebot.svg" alt="" width="28" height="28" /><span>MateBot</span></a>
          <p>Un producto de <a href="https://devisebit.com">DEVISEBIT SRL</a> · Buenos Aires, Argentina</p>
          <p><a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a> · info@devisebit.com</p>
        </div>
      </footer>
    </main>
  );
}
