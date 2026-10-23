import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { q, one } from "@/lib/db"
export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Suscripción · DEVISEBIT", robots: { index: false, follow: false } }

async function cambiar(fd: FormData) {
  "use server"
  const tok = String(fd.get("tok") ?? ""), a = String(fd.get("a"))
  if (a === "baja") await q("update db_contactos set email_estado='baja', baja_en=now() where email_token=$1", [tok])
  else await q("update db_contactos set email_estado='activo', baja_en=null, suscrito_en=coalesce(suscrito_en, now()) where email_token=$1 and email_estado='baja'", [tok])
  await q("update em_envios set baja=true where contacto_id=(select id from db_contactos where email_token=$1) and estado='enviado'", [tok]).catch(() => {})
  redirect(`/baja/${tok}?h=${a}`)
}

export default async function Baja({ params, searchParams }: { params: { token: string }; searchParams: { h?: string } }) {
  const c = await one<{ email: string; email_estado: string }>("select email, email_estado from db_contactos where email_token=$1", [params.token])
  if (!c) notFound()
  const baja = c.email_estado === "baja"
  return (
    <main className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
      <form action={cambiar} className="card max-w-md w-full flex flex-col gap-4">
        <div className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#C8231F]">BIT</span></div>
        <input type="hidden" name="tok" value={params.token} />
        {baja ? (
          <>
            <h1 className="m-0 text-2xl">Listo, no te vamos a escribir más</h1>
            <p className="m-0 text-[#4A515C]">Dimos de baja <strong>{c.email}</strong> de nuestros correos. Si fue un error, podés volver a suscribirte.</p>
            <input type="hidden" name="a" value="alta" /><button className="btn-s self-start">Volver a suscribirme</button>
          </>
        ) : (
          <>
            <h1 className="m-0 text-2xl">{searchParams.h === "alta" ? "¡Bienvenido de nuevo!" : "¿Querés dejar de recibir nuestros correos?"}</h1>
            <p className="m-0 text-[#4A515C]">{searchParams.h === "alta" ? `Vas a seguir recibiendo novedades en ${c.email}.` : `Vamos a dejar de escribirle a ${c.email}. Mandamos poco y solo cosas útiles, pero entendemos.`}</p>
            {searchParams.h !== "alta" && <><input type="hidden" name="a" value="baja" /><button className="btn-p self-start">Darme de baja</button></>}
          </>
        )}
      </form>
    </main>
  )
}
