"""Hoja de contacto: 8 fotogramas del mp4 final. Uso: python3 contacto.py NOMBRE -> ../contactos/NOMBRE.png"""
import sys, subprocess, pathlib, io, json
from PIL import Image, ImageDraw, ImageFont
OUT = pathlib.Path(__file__).parent.parent; name = sys.argv[1]; mp4 = OUT / f"{name}.mp4"; T = json.load(open(OUT / "trabajo" / name / "timeline.json"))["dur"]
ts = [round(0.25 + i * (T - 1.6) / 7, 2) for i in range(8)]; w, h = 432, 768; hoja = Image.new("RGB", (4 * w, 2 * h), "#222"); d = ImageDraw.Draw(hoja); f = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 30)
for i, t in enumerate(ts):
    png = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"])
    x, y = (i % 4) * w, (i // 4) * h; hoja.paste(Image.open(io.BytesIO(png)).resize((w - 6, h - 6), Image.LANCZOS), (x + 3, y + 3)); d.rectangle([x + 3, y + h - 49, x + 118, y + h - 3], fill="#000"); d.text((x + 12, y + h - 44), f"{t:.1f} s", font=f, fill="#fff")
(OUT / "contactos").mkdir(exist_ok=True); hoja.save(OUT / "contactos" / f"{name}.png"); print("ok contacto", name, flush=True)
