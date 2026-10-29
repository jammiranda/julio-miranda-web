import sys, subprocess, os, pathlib
from playwright.sync_api import sync_playwright
d = pathlib.Path(__file__).parent
nombre, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
fps = 30; n = round((b - a) * fps)
tmp = d / f"tmp_{nombre}.mp4"
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", str(tmp)], stdin=subprocess.PIPE)
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto((d / "anim.html").as_uri()); pg.wait_for_timeout(300)
    for i in range(n):
        pg.evaluate(f"setT({a + i / fps})")
        ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
    br.close()
ff.stdin.close()
if ff.wait() == 0: os.replace(tmp, d / f"{nombre}.mp4")
else: sys.exit(1)
