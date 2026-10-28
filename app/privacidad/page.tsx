import { Header } from "@/components/header"
import { pageMeta } from "@/lib/seo"
import { Footer } from "@/components/footer"

export const metadata = pageMeta(
  "Política de privacidad · DEVISEBIT",
  "Cómo DEVISEBIT SRL trata los datos personales de quienes nos contactan por la web, WhatsApp, redes o correo.",
  "/privacidad",
)

const S = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="m-0 font-tight text-[24px] font-extrabold">{t}</h2>
    <div className="flex flex-col gap-3 text-[17px] leading-relaxed text-[#2A2F37]">{children}</div>
  </section>
)

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white text-[#0E1116]">
      <Header />
      <main id="contenido" className="pt-[72px]">
        <section className="db-tech bg-[#0B0D12] text-white">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[56px] flex flex-col gap-4">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">Legal</p>
            <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold">Política de privacidad</h1>
            <p className="m-0 text-lg text-[#C3C8D1]">Última actualización: 22 de octubre de 2026</p>
          </div>
        </section>
        <div className="max-w-[860px] mx-auto px-4 md:px-8 py-[56px] flex flex-col gap-10">
          <S t="Quiénes somos">
            <p className="m-0">DEVISEBIT SRL ("DEVISEBIT") es una empresa argentina de software e inteligencia artificial, con oficinas en Luna 24, 6.º piso, Parque Patricios, Ciudad de Buenos Aires, y en Av. de los Lagos 7008, Nordelta, Tigre. Para cualquier consulta sobre esta política escribinos a <a className="underline text-[#C8231F]" href="mailto:info@devisebit.com">info@devisebit.com</a>.</p>
          </S>
          <S t="Qué datos recopilamos">
            <p className="m-0">Solo los que vos nos das al contactarnos por el formulario de la web, WhatsApp (+54 9 11 7346-6490), redes sociales o correo: nombre, organización, email, teléfono, el contenido de tu consulta y, si nos escribís por WhatsApp, tu número y el nombre de tu perfil. La web también usa herramientas de medición y publicidad (por ejemplo Google Ads) que registran datos de navegación de forma agregada.</p>
          </S>
          <S t="Para qué los usamos">
            <p className="m-0">Para responder tu consulta, preparar propuestas, coordinar reuniones, brindar los servicios contratados y, si lo aceptaste, enviarte novedades. No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
          </S>
          <S t="Asistente de WhatsApp">
            <p className="m-0">Nuestro WhatsApp tiene un asistente automático que responde consultas frecuentes y registra la conversación en nuestro sistema de atención para que una persona del equipo pueda continuarla. Las respuestas automáticas pueden generarse con servicios de inteligencia artificial que procesan el texto del mensaje solo para responderte. Siempre podés pedir hablar con una persona.</p>
          </S>
          <S t="Proveedores">
            <p className="m-0">Usamos proveedores que tratan los datos por cuenta nuestra y bajo acuerdos de confidencialidad: Meta (WhatsApp Business Platform), servicios de alojamiento y base de datos en la nube, correo electrónico y herramientas de medición. Algunos de estos servicios pueden almacenar datos fuera de la Argentina, con niveles de protección adecuados.</p>
          </S>
          <S t="Cuánto tiempo los guardamos">
            <p className="m-0">Mientras sea necesario para atender tu consulta o la relación comercial, y luego el tiempo que exijan las obligaciones legales. Podés pedirnos que los borremos antes.</p>
          </S>
          <S t="Tus derechos">
            <p className="m-0">Podés acceder, rectificar, actualizar o suprimir tus datos en cualquier momento escribiendo a <a className="underline text-[#C8231F]" href="mailto:info@devisebit.com">info@devisebit.com</a> o por WhatsApp. Respondemos dentro de los plazos de la Ley 25.326 de Protección de Datos Personales.</p>
            <p className="m-0 text-[15px] text-[#4A515C]">La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley N.º 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
          </S>
          <S t="Eliminación de datos">
            <p className="m-0">Para pedir la eliminación de los datos asociados a tus conversaciones de WhatsApp o redes sociales, envianos un mensaje con el texto "Eliminar mis datos" a info@devisebit.com o a nuestro WhatsApp. Los eliminamos dentro de los 10 días hábiles y te confirmamos por el mismo medio.</p>
          </S>
          <S t="Cambios">
            <p className="m-0">Podemos actualizar esta política. La versión vigente es siempre la publicada en esta página.</p>
          </S>
        </div>
      </main>
      <Footer />
    </div>
  )
}
