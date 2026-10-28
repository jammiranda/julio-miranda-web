# DEVISEBIT · web institucional (www.devisebit.com)

Next.js 15 + Tailwind 4. Se publica en Vercel (proyecto `v0-fork-of-devisebit-clone`, equipo DEVISEBIT) desde esta rama: **devisebit-web**.

- Landings `/webs`, `/sistemas`, `/whatsapp`, `/redes`, `/comunidad`: las sirve el proyecto `devisebit-landings` mediante reglas de ruteo del proyecto en Vercel (no están en este código).
- Notas del blog: `lib/posts.ts` (arreglo `posts`). Para publicar una nota: agregarla arriba del arreglo, commit y push a esta rama.
- Formulario de contacto: `lib/send-form.ts` (FormSubmit + alta en el sistema comercial `sistema.devisebit.com/api/consultas`).
- Hasta el 27/10/2026 se publicaba sin GitHub desde la CLI; este repositorio arranca con ese mismo código (sin el panel de administración con Supabase, que no usaba la web pública).
