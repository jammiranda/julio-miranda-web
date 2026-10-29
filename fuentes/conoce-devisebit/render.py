from playwright.sync_api import sync_playwright
import pathlib
d = pathlib.Path(__file__).parent
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto((d / "slides.html").as_uri()); pg.wait_for_timeout(500)
    for i in range(1, 13):
        pg.locator(f"#s{i}").screenshot(path=str(d / f"s{i:02d}.png"))
    pg.pdf(path=str(d / "Conoce-DEVISEBIT.pdf"), width="1920px", height="1080px", print_background=True)
    b.close()
