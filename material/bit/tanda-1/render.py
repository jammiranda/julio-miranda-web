"""Render de una pieza (Playwright -> JPEG -> ffmpeg), 1080x1920 a 30 fps.
  python3 render.py NOMBRE                 -> ../trabajo/NOMBRE/video.mp4 (dos mitades en paralelo, unidas sin recodificar)
  python3 render.py NOMBRE cuadros [t ...] -> cuadros en ../trabajo/NOMBRE/pre.jpg + control de zona segura de TikTok y de precios
  python3 render.py NOMBRE portada         -> ../NOMBRE-portada.jpg
  python3 render.py NOMBRE parte i a b     -> (interno)"""
import sys, subprocess, os, json, pathlib, time
D = pathlib.Path(__file__).parent; OUT = D.parent; name = sys.argv[1]; W = OUT / "trabajo" / name; FPS = 30
tl = json.load(open(W / "timeline.json")); N = round(tl["dur"] * FPS); modo = sys.argv[2:3]
SEG = (56, 130, 942, 1670)
CHK = """([x0,y0,x1,y1]) => { const out=[]; for (const e of document.querySelectorAll('#sub span,#etq,.cont *,.hud *,#P span,#P b')) { if (e.children.length && !e.matches('.T,.c-btn,.c-link,.fila,.bub,.tag,.ej,.globo,.hora,.chipg')) continue; if (!e.textContent.trim()) continue;
  let v=e, vis=true; while(v&&v!==document.body){ const c=getComputedStyle(v); if(c.display==='none'||+c.opacity<.5){vis=false;break;} v=v.parentElement; } if(!vis) continue;
  const b=e.getBoundingClientRect(); if(!b.width||b.right<0||b.left>1080) continue; const fs=b.height/Math.max(1,e.offsetHeight)*parseFloat(getComputedStyle(e).fontSize), tx=e.textContent.trim().slice(0,26);
  if(b.top<y0-2||b.right>x1+2||b.bottom>y1+2||b.left<x0-40) out.push('FUERA ['+[b.left,b.top,b.right,b.bottom].map(Math.round)+'] '+tx); if(fs<26) out.push('CHICO '+Math.round(fs)+'px '+tx); if(/[$]|USD|ARS/.test(e.textContent)) out.push('PRECIO '+tx); } return out; }"""
def pagina(p, extra=""):
    br = p.chromium.launch(args=["--allow-file-access-from-files", "--font-render-hinting=none"]); pg = br.new_page(viewport={"width": 1080, "height": 1920}); pg.on("pageerror", lambda e: print("  ERROR JS:", e, flush=True))
    pg.goto((D / "pieza.html").as_uri() + f"?p={name}{extra}"); pg.wait_for_timeout(600); return br, pg
if modo == ["parte"]:
    from playwright.sync_api import sync_playwright
    i, a, b = map(int, sys.argv[3:6]); tmp = W / f"tmp_parte_{i}.mp4"
    with sync_playwright() as p:
        br, pg = pagina(p)
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "2700k", "-bufsize", "5400k", "-g", "60",
                               "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-r", "30", str(tmp)], stdin=subprocess.PIPE)
        for f in range(a, b):
            for intento in range(6):   # si la captura queda esperando al navegador, se reabre la pagina y se sigue desde ese cuadro
                try: pg.evaluate(f"setT({f / FPS})"); img = pg.screenshot(type="jpeg", quality=92, timeout=10000); break
                except Exception:
                    if intento == 5: raise
                    try: br.close()
                    except Exception: pass
                    br, pg = pagina(p)
            ff.stdin.write(img)
        ff.stdin.close(); ok = ff.wait() == 0; br.close()
    if not ok: sys.exit(1)
    os.replace(tmp, W / f"parte_{i}.mp4")
elif modo == ["cuadros"]:
    from playwright.sync_api import sync_playwright
    from PIL import Image
    ts = [float(x) for x in sys.argv[3:]] or sorted({round(s["start"] + (s["end"] - s["start"]) * f, 2) for s in tl["scenes"] for f in (.3, .9)}); fs = []
    with sync_playwright() as p:
        br, pg = pagina(p)
        for t in ts:
            pg.evaluate(f"setT({t})"); fs.append(Image.open(__import__("io").BytesIO(pg.screenshot(type="jpeg", quality=85))).resize((356, 632)))
            for m in pg.evaluate(CHK, list(SEG)): print(f"  {t:5.2f}s {m}")
        br.close()
    cols = min(6, len(fs)); rows = -(-len(fs) // cols); hoja = Image.new("RGB", (cols * 360, rows * 636), "#333")
    for i, f in enumerate(fs): hoja.paste(f, ((i % cols) * 360 + 2, (i // cols) * 636 + 2))
    hoja.save(W / "pre.jpg", quality=84); print("ok", name, "pre.jpg", ts)
elif modo == ["portada"]:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p: br, pg = pagina(p, "&portada=1"); pg.screenshot(path=str(OUT / f"{name}-portada.jpg"), type="jpeg", quality=92); br.close()
    print("ok portada", name)
else:
    m = N // 2; partes = [(0, 0, m), (1, m, N)]; vivos = [subprocess.Popen([sys.executable, __file__, name, "parte", str(i), str(a), str(b)]) for i, a, b in partes]
    while vivos:
        time.sleep(1)
        for v in list(vivos):
            r = v.poll()
            if r is None: continue
            vivos.remove(v)
            if r != 0:
                for o in vivos: o.terminate()
                sys.exit("fallo una parte")
    open(W / "partes.txt", "w").write("".join(f"file 'parte_{i}.mp4'\n" for i, _, _ in partes))
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(W / "partes.txt"), "-c", "copy", str(W / "tmp_video.mp4")]); os.replace(W / "tmp_video.mp4", W / "video.mp4"); print("ok video", name, N, "cuadros", flush=True)
