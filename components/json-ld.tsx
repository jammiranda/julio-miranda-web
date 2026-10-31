/** Inserta datos estructurados (schema.org) en la página. Se escapa "<" para que el JSON no cierre el script. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
