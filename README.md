# MateCuentas · by DEVISEBIT

Las cuentas de la casa, entre todos. Proyecto Vercel `matecuentas-devisebit` → https://matecuentas.devisebit.com

- `api/`: funciones (cuentas, espacios, carga mágica con IA, puente con MateBot, cobros Pro vía el puente de sistema.devisebit.com).
- `site/`: páginas y app. Se publican en Blob con `POST /api/admin?a=put` (no hace falta redeploy).
- Datos en Vercel Blob privado (`u/`, `s/`, `id/`, `inv/`, `lnk/`, `bot/`).
