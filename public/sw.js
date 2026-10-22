self.addEventListener("push", (e) => {
  let d = {}
  try { d = e.data.json() } catch { d = { titulo: "San Patricio", cuerpo: e.data ? e.data.text() : "" } }
  e.waitUntil(self.registration.showNotification(d.titulo || "Sistema San Patricio", { body: d.cuerpo || "", icon: "/icon.png", badge: "/icon.png", data: { url: d.url || "/" }, tag: d.url || undefined, renotify: true }))
})
self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || "/"
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ("focus" in w) { w.navigate(url); return w.focus() } }
    return clients.openWindow(url)
  }))
})
