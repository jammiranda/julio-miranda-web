"""Hoja de contacto: 10 fotogramas del mp4 final repartidos en el tiempo. Uso: python3 contacto.py -> ../contacto.png"""
import subprocess, pathlib, io
from PIL import Image, ImageDraw, ImageFont
OUT = pathlib.Path(__file__).parent.parent; mp4 = OUT / "bit-v3-piloto-2347.mp4"
ts = [0.2, 3.1, 4.4, 6.0, 8.9, 11.2, 12.5, 14.2, 17.4, 21.0]; w, h = 432, 768
hoja = Image.new("RGB", (5 * w, 2 * h), "#222"); d = ImageDraw.Draw(hoja); f = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 30)
for i, t in enumerate(ts):
    png = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"])
    x, y = (i % 5) * w, (i // 5) * h; hoja.paste(Image.open(io.BytesIO(png)).resize((w - 6, h - 6), Image.LANCZOS), (x + 3, y + 3)); d.rectangle([x + 3, y + h - 49, x + 110, y + h - 3], fill="#000"); d.text((x + 12, y + h - 44), f"{t:.1f} s", font=f, fill="#fff")
hoja.save(OUT / "contacto.png"); print("ok contacto.png", ts)
