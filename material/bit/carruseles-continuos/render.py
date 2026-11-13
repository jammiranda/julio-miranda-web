"""Captura cada lienzo, lo corta en placas de 1080x1350 y arma PDF y panorama. Uso: python3 render.py [c1 c2 c3 c4]"""
import sys, pathlib, io
from playwright.sync_api import sync_playwright
from PIL import Image
D = pathlib.Path(__file__).parent; OUT = D.parent
C = {"c1": ("c1-caminando", 7), "c2": ("c2-recorrido", 7), "c3": ("c3-zoom", 6), "c4": ("c4-borroso", 6)}
que = sys.argv[1:] or list(C)
with sync_playwright() as p:
    br = p.chromium.launch(args=["--allow-file-access-from-files", "--font-render-hinting=none"])
    for k in que:
        nom, N = C[k]; W = N * 1080; dest = OUT / nom; dest.mkdir(exist_ok=True)
        pg = br.new_page(viewport={"width": W, "height": 1350}); pg.on("pageerror", lambda e: print("  ERROR JS:", e)); pg.on("console", lambda m: print("  consola:", m.text))
        pg.goto((D / f"{k}.html").as_uri()); pg.wait_for_timeout(700)
        im = Image.open(io.BytesIO(pg.screenshot(clip={"x": 0, "y": 0, "width": W, "height": 1350}))).convert("RGB"); pg.close()
        assert im.size == (W, 1350), im.size
        ims = [im.crop((i * 1080, 0, (i + 1) * 1080, 1350)) for i in range(N)]
        for i, x in enumerate(ims): x.save(dest / f"placa-{i + 1}.png")
        ims[0].save(dest / f"{nom}.pdf", save_all=True, append_images=ims[1:], resolution=144)
        im.resize((2400, round(1350 * 2400 / W)), Image.LANCZOS).save(dest / f"{nom}-panorama.png")
        print("ok", nom, N, "placas")
    br.close()
