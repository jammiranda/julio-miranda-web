"""Sonido de una pieza: musica sintetizada con pulso + efectos + voz, ducking y -14 LUFS. Une el audio a ../trabajo/NOMBRE/video.mp4 sin recodificar el video.
Uso: python3 sonido.py NOMBRE -> ../NOMBRE.mp4"""
import sys, json, subprocess, pathlib, re, numpy as np, musica
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).parent; OUT = D.parent; name = sys.argv[1]; W = OUT / "trabajo" / name; SR = musica.SR
tl = json.load(open(W / "timeline.json")); T = tl["dur"]; n = int(SR * T); idx = sorted(p.name for p in (OUT / "trabajo").iterdir() if p.is_dir() and p.name.startswith("b")).index(name)
with sync_playwright() as p:
    br = p.chromium.launch(args=["--allow-file-access-from-files"]); pg = br.new_page(); pg.goto((D / "pieza.html").as_uri() + f"?p={name}"); pg.wait_for_timeout(500); SFX = pg.evaluate("window.SFX"); br.close()
def dec(path): return np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), "<f4").astype(np.float64)
def lufs(path):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr; s = e[e.rindex("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
PROG = ["Am-F-C-G", "Dm-Bb-F-C", "Em-C-G-D", "C-G-Am-F", "F-Am-Dm-C"]   # cada pieza con otra progresion, mismo pulso
m = musica.pista(T, tl["bpm"], PROG[idx % 5], "reel", 4 + idx)[:n]; fx = np.zeros(n + SR * 2)
def add(sig, t):
    i = max(0, int(t * SR)); fx[i:i + len(sig)] += sig[:len(fx) - i]
for t in SFX["whoosh"]: add(musica.whoosh(0.42, 0.16, seed=int(t * 10)), t - 0.2)
for t in SFX["pop"]: add(musica.pop(740, 0.26), t)
for t in SFX["ping"]: add(musica.ping(1568, 0.18), t)
for t in SFX["golpe"]: add(musica.kick(0.8), t)
fx = fx[:n]; v = np.zeros(n)
for z in tl["voz"]:
    x = dec(z["file"])[:int(SR * (z["fin"] + 0.25))]; i0 = int(SR * z["at"]); x = x[:n - i0]; v[i0:i0 + len(x)] += x
v /= np.abs(v).max() + 1e-9
w = int(SR * 0.12); env = np.clip(np.sqrt(np.convolve(v * v, np.ones(w) / w, mode="same")) / 0.08, 0, 1); w2 = int(SR * 0.25); env = np.convolve(env, np.ones(w2) / w2, mode="same")
rv = np.sqrt((v[env > 0.5] ** 2).mean()); rm = np.sqrt((m ** 2).mean()); gm = rv / rm * 10 ** (-8 / 20); duck = 1 - 0.55 * env; gf = rv / 0.12 * 10 ** (-10 / 20)
st = np.stack([v + m[:, 0] * gm * duck + fx * gf, v + m[:, 1] * gm * duck + fx * gf], 1)
pre = W / "audio.pre.wav"; wav = W / "audio.wav"; musica.guardar(st / max(1.0, np.abs(st).max()), pre); g = 0.0
for _ in range(6):
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", str(pre), "-af", f"volume={g}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled", "-ar", str(SR), str(wav)]); i, pk = lufs(wav)
    if abs(i + 14) < 0.2: break
    g += -14 - i
pre.unlink(); dest = OUT / f"{name}.mp4"; tmp = W / "tmp_final.mp4"
subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", str(W / "video.mp4"), "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", str(SR), "-shortest", "-movflags", "+faststart", str(tmp)])
tmp.replace(dest); print(f"{dest.name}: {T:.2f} s  {i:.1f} LUFS  pico {pk:.1f} dBFS  {dest.stat().st_size / 1e6:.2f} MB", flush=True)
