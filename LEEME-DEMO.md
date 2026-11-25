# Salud Digital · demo en marca blanca (DEVISEBIT)

Rama `salud-demo`: el mismo sistema de gestión de internación domiciliaria, con marca neutra "Salud Digital" y **datos 100 % ficticios**.

- `DEMO=1` (variable de entorno): la base es Postgres en memoria (PGlite) y se siembra con `lib/demo-seed.ts` al arrancar. No usa ni toca ninguna base real. Cada instancia arranca limpia: los cambios que hace un visitante se reinician solos.
- Entrada directa sin clave: `/demo` (abre la sesión de Gerencia).
- Para una marca blanca nueva: cambiar `components/Marca.tsx`, `app/layout.tsx`, `app/manifest.ts` y el color verde de los estilos.
- Nunca copiar datos reales de pacientes a esta rama.
