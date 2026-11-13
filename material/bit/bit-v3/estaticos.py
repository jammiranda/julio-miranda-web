"""Piezas fijas: hoja de personaje, placas del carrusel + PDF, portada. Uso: python3 estaticos.py [hoja] [carrusel] [portada]"""
import sys, pathlib
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).parent; OUT = D.parent; que = sys.argv[1:] or ["hoja", "carrusel", "portada"]
with sync_playwright() as p:
    br = p.chromium.launch(args=["--allow-file-access-from-files", "--font-render-hinting=none"])
    def foto(url, w, h, dest, **kw):
        pg = br.new_page(viewport={"width": w, "height": h}); pg.on("pageerror", lambda e: print("  ERROR JS:", e)); pg.goto(url); pg.wait_for_timeout(500); pg.screenshot(path=str(dest), **kw); pg.close(); print("ok", dest.name)
    if "hoja" in que: foto((D / "hoja.html").as_uri(), 2400, 1500, OUT / "bit-v3-hoja.png")
    if "carrusel" in que:
        C = OUT / "carrusel-v3"; C.mkdir(exist_ok=True)
        for i in range(1, 6): foto((D / "carrusel.html").as_uri() + f"?n={i}", 1080, 1350, C / f"placa-{i}.png")
        from PIL import Image
        ims = [Image.open(C / f"placa-{i}.png").convert("RGB") for i in range(1, 6)]; ims[0].save(C / "carrusel-v3.pdf", save_all=True, append_images=ims[1:], resolution=144); print("ok carrusel-v3.pdf")
    if "portada" in que: foto((D / "piloto.html").as_uri() + "?portada=1", 1080, 1920, OUT / "bit-v3-portada.jpg", type="jpeg", quality=92)
    br.close()
