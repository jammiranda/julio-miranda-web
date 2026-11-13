/**
 * Script de Google Ads → Panel de Contenido DEVISEBIT (panel.devisebit.com/anuncios).
 *
 * Se instala UNA copia en CADA cuenta de Google Ads (Herramientas → Acciones masivas → Secuencias de comandos):
 *   - Cuenta 1 · Búsqueda: 501-335-3550
 *   - Cuenta 2 · Máximo rendimiento: 346-016-2490
 * Frecuencia: diaria (por ejemplo 6:00). Manda los últimos 30 días por campaña y por día; el panel actualiza
 * sin duplicar. Cada envío lleva la cuenta, así el panel muestra de cuál viene cada campaña y avisa si una deja de mandar.
 *
 * CLAVE: pegá el valor de ADS_INGESTA_KEY (está en Vercel, proyecto devisebit-sistema). No la subas a ningún repositorio.
 */
var PANEL_URL = "https://sistema.devisebit.com/api/ads/ingesta"
var CLAVE = "PEGAR_ACA_ADS_INGESTA_KEY"

function main() {
  var cuenta = AdsApp.currentAccount().getCustomerId() // "501-335-3550"
  var moneda = AdsApp.currentAccount().getCurrencyCode()
  var consulta =
    "SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions " +
    "FROM campaign WHERE segments.date DURING LAST_30_DAYS"
  var filas = []
  var it = AdsApp.search(consulta)
  while (it.hasNext()) {
    var r = it.next()
    filas.push({
      fecha: r.segments.date,
      campania: r.campaign.name,
      campania_id: String(r.campaign.id),
      gasto: Number(r.metrics.costMicros || 0) / 1e6,
      moneda: moneda,
      impresiones: Number(r.metrics.impressions || 0),
      clics: Number(r.metrics.clicks || 0),
      conversiones: Number(r.metrics.conversions || 0),
    })
  }
  var resp = UrlFetchApp.fetch(PANEL_URL, {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": CLAVE },
    payload: JSON.stringify({ plataforma: "google", cuenta: cuenta, filas: filas }),
    muteHttpExceptions: true,
  })
  Logger.log("Cuenta " + cuenta + ": " + filas.length + " filas → " + resp.getResponseCode() + " " + resp.getContentText())
}
