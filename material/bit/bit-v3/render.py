"""Render cuadro a cuadro (Playwright -> JPEG -> ffmpeg), 1080x1920 a 30 fps.
  python3 render.py                 -> ../trabajo/video.mp4 (sin audio): un archivo por escena, en paralelo, unidos con concat sin recodificar
  python3 render.py cuadros 0 2.5 9 -> cuadros sueltos en ../trabajo/cuadros/ + hoja ../trabajo/pre.jpg + control de zona segura de TikTok
  python3 render.py solo 3          -> rehace solo la escena 3 (0 = primera) y vuelve a unir
  python3 render.py parte i a b     -> (interno) cuadros a..b-1 a ../trabajo/parte_i.mp4"""
import sys, subprocess, os, json, pathlib
D = pathlib.Path(__file__).parent; W = D.parent / "trabajo"; FPS = 30
tl = json.load(open(W / "timeline.json")); N = round(tl["dur"] * FPS)
SEG = (60, 130, 940, 1670)   # zona segura TikTok: 130 arriba, 250 abajo, 140 a la derecha
CHK = """([x0,y0,x1,y1]) => { const out=[]; for (const e of document.querySelectorAll('#sub span,#reloj,#chip,#etq,#C_tit div,#C_btn,#C_link,#C_logo,#P_tit span,#P_tit b,#A_msg .b,.bub,#seg,#turno')) {
  let v=e, vis=true; while(v&&v!==document.body){ const c=getComputedStyle(v); if(c.display==='none'||+c.opacity<.5){vis=false;break;} v=v.parentElement; } if(!vis) continue;
  const b=e.getBoundingClientRect(); if(!b.width||b.right<0||b.left>1080) continue; const fs=b.height/Math.max(1,e.offsetHeight)*parseFloat(getComputedStyle(e).fontSize);
  if(b.left<x0-2||b.top<y0-2||b.right>x1+2||b.bottom>y1+2) out.push('FUERA ['+[b.left,b.top,b.right,b.bottom].map(Math.round)+'] '+(e.id||e.className)+' '+e.textContent.trim().slice(0,24));
  if(fs<40) out.push('CHICO '+Math.round(fs)+'px '+e.textContent.trim().slice(0,24)); if(/[$]|USD|ARS/.test(e.textContent)) out.push('PRECIO '+e.textContent); } return out; }"""
def pagina(p):
    br = p.chromium.launch(args=["--allow-file-access-from-files", "--font-render-hinting=none"]); pg = br.new_page(viewport={"width": 1080, "height": 1920})
    pg.on("pageerror", lambda e: print("  ERROR JS:", e)); pg.goto((D / "piloto.html").as_uri()); pg.wait_for_timeout(500); return br, pg
if sys.argv[1:2] == ["parte"]:
    from playwright.sync_api import sync_playwright
    i, a, b = map(int, sys.argv[2:5]); tmp = W / f"tmp_parte_{i}.mp4"
    with sync_playwright() as p:
        br, pg = pagina(p)
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-maxrate", "2600k", "-bufsize", "5200k", "-g", "60",
                               "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-r", "30", str(tmp)], stdin=subprocess.PIPE)
        for f in range(a, b):
            for intento in range(6):   # a veces la captura queda esperando al navegador: se reabre la pagina y se sigue desde ese cuadro
                try: pg.evaluate(f"setT({f / FPS})"); img = pg.screenshot(type="jpeg", quality=92, timeout=10000); break
                except Exception:
                    if intento == 5: raise
                    try: br.close()
                    except Exception: pass
                    br, pg = pagina(p)
            ff.stdin.write(img)
        ff.stdin.close(); ok = ff.wait() == 0; br.close()
    if not ok: sys.exit(1)
    os.replace(tmp, W / f"parte_{i}.mp4"); print("parte", i, a, b, flush=True)
elif sys.argv[1:2] == ["cuadros"]:
    from playwright.sync_api import sync_playwright
    from PIL import Image
    ts = [float(x) for x in sys.argv[2:]] or [round(i * tl["dur"] / 12 + .4, 2) for i in range(12)]; (W / "cuadros").mkdir(exist_ok=True); fs = []
    with sync_playwright() as p:
        br, pg = pagina(p)
        for t in ts:
            pg.evaluate(f"setT({t})"); f = W / "cuadros" / f"c_{t:05.2f}.jpg"; pg.screenshot(path=str(f), type="jpeg", quality=85); fs.append(f)
            for m in pg.evaluate(CHK, list(SEG)): print(f"  {t:5.2f}s {m}")
        br.close()
    w = 360; h = 640; cols = min(6, len(fs)); rows = -(-len(fs) // cols); hoja = Image.new("RGB", (cols * w, rows * h), "#333")
    for i, f in enumerate(fs): hoja.paste(Image.open(f).resize((w - 4, h - 4)), ((i % cols) * w + 2, (i // cols) * h + 2))
    hoja.save(W / "pre.jpg", quality=84); print("ok", W / "pre.jpg")
else:
    cortes = [0] + [round(s["end"] * FPS) for s in tl["scenes"]]; cortes[-1] = N
    partes = [(i, cortes[i], cortes[i + 1]) for i in range(len(cortes) - 1)]; solo = [int(x) for x in sys.argv[2:]] if sys.argv[1:2] == ["solo"] else None   # 'render.py solo 3' rehace solo esa escena y vuelve a unir
    pend = [x for x in partes if solo is None or x[0] in solo]; vivos = []
    import time
    while pend or vivos:      # dos procesos a la vez
        while pend and len(vivos) < 2: i, a, b = pend.pop(0); vivos.append(subprocess.Popen([sys.executable, __file__, "parte", str(i), str(a), str(b)]))
        time.sleep(1)
        for v in list(vivos):
            r = v.poll()
            if r is None: continue
            vivos.remove(v)
            if r != 0:
                for o in vivos: o.terminate()
                sys.exit("fallo una parte")
    open(W / "partes.txt", "w").write("".join(f"file 'parte_{i}.mp4'\n" for i, _, _ in partes))
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(W / "partes.txt"), "-c", "copy", str(W / "tmp_video.mp4")]); os.replace(W / "tmp_video.mp4", W / "video.mp4"); print("ok video.mp4", N, "cuadros")
