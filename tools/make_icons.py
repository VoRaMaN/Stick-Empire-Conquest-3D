# Renders tools/icon.svg into the PNG app icons in public/icons (run once after editing the SVG).
import pathlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parent.parent
svg=(root/'tools/icon.svg').read_text()
out=root/'public/icons'; out.mkdir(parents=True,exist_ok=True)
def page_html(size,mode):
    s=svg
    if mode=='round':   # transparent rounded corners for the regular icon
        s=s.replace('<rect id="bgrect" width="512" height="512"','<rect id="bgrect" width="512" height="512" rx="112"')
    if mode=='maskable': # keep the emblem inside the 80% safe zone
        s=s.replace('<g id="emblem">','<g id="emblem" transform="translate(51.2 51.2) scale(.8)">')
    return f'<html><body style="margin:0;background:transparent"><div style="width:{size}px;height:{size}px">{s.replace("<svg ",f"<svg width={size} height={size} ")}</div></body></html>'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':600,'height':600})
    for name,size,mode in [('icon-512.png',512,'round'),('icon-192.png',192,'round'),('apple-touch-icon.png',180,'full'),('maskable-512.png',512,'maskable'),('favicon-48.png',48,'round')]:
        pg.set_content(page_html(size,mode)); pg.locator('div').first.screenshot(path=str(out/name),omit_background=True)
    b.close()
print('icons written to',out)
