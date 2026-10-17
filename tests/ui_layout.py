"""PC / Mobile layout check in a real browser (Chromium through Playwright, no network needed).

    npm run build && python3 -m http.server 8080 -d dist/web &
    python3 tests/ui_layout.py http://localhost:8080/

Checks the first-launch question (shown once, suggests Mobile on a touch phone and PC with a mouse, remembered),
the Settings switch, and that the Mobile layout leaves the battlefield in view: on a phone in landscape the top
row (cards and map) and the dock (unit cards, orders and actions) together take well under half of the screen,
nothing overlaps the pause button, and the orders share one row with the action buttons.
"""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/'
fails = 0
def ok(c, m):
    global fails
    print(('  ok   ' if c else '  FAIL ') + m, flush=True)
    if not c: fails += 1

def S(pg, code): return pg.evaluate('() => { const S = window.__SE3D; ' + code + ' }')
def rect(pg, sel): return pg.evaluate('(s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width || r.height ? {l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height} : null; }', sel)
def overlap(a, b): return a and b and a['l'] < b['r'] and b['l'] < a['r'] and a['t'] < b['b'] and b['t'] < a['b']

def open_page(b, w, h, touch, ui=None):
    ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=touch, has_touch=touch, service_workers='block')
    if ui: ctx.add_init_script("try{localStorage.setItem('se3d-settings',JSON.stringify({uiMode:'%s',quality:'low'}))}catch(e){}" % ui)
    pg = ctx.new_page(); pg.goto(URL, wait_until='domcontentloaded', timeout=90000)
    pg.wait_for_function('() => window.__SE3D && !document.querySelector("#menu").hidden', timeout=90000)
    S(pg, "S.settings.quality='low'; S.applyQuality(); window.SE3D_NO_DRAW=true; return 1")
    return ctx, pg

def battle(pg):
    pg.click('#mmSkirmish'); pg.click('#skStart')
    pg.wait_for_function('() => document.querySelector("#menu").hidden && !document.querySelector("#hudBattle").hidden', timeout=30000)
    S(pg, 'S.layoutTop(); return 1'); pg.wait_for_timeout(300)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    print('first launch')
    for (w, h, touch, want) in [(844, 390, True, 'mobile'), (1366, 768, False, 'pc')]:
        ctx, pg = open_page(b, w, h, touch)
        vis = pg.evaluate('() => !document.querySelector("#uiPick").hidden')
        sug = pg.evaluate('() => { const e = document.querySelector("#uiPick .ui-opt.sugg"); return e && e.dataset.ui; }')
        ok(vis and sug == want, '%dx%d %s: the PC-or-Mobile question is shown, suggesting %s (got %s)' % (w, h, 'touch' if touch else 'mouse', want, sug))
        other = 'pc' if want == 'mobile' else 'mobile'
        pg.click('#uiPick [data-ui=%s]' % other)
        st = pg.evaluate('() => [document.querySelector("#uiPick").hidden, document.body.classList.contains("ui-%s"), JSON.parse(localStorage.getItem("se3d-settings")).uiMode]' % other)
        ok(st == [True, True, other], 'picking %s closes it, applies the layout and saves it: %s' % (other, st))
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_function('() => window.__SE3D && !document.querySelector("#menu").hidden', timeout=90000)
        ok(pg.evaluate('() => document.querySelector("#uiPick").hidden && document.body.classList.contains("ui-%s")' % other), 'after a reload it is not asked again and %s stays' % other)
        S(pg, "S.openSheet('settings'); return 1"); pg.click('#uiPills [data-ui=%s]' % want)
        st = pg.evaluate('() => [document.body.classList.contains("ui-%s"), document.querySelector("#uiPills [data-ui=%s]").getAttribute("aria-checked"), JSON.parse(localStorage.getItem("se3d-settings")).uiMode]' % (want, want))
        ok(st == [True, 'true', want], 'Settings switches it back to %s: %s' % (want, st))
        ctx.close()

    print('Mobile layout, phone in landscape')
    for (w, h) in [(844, 390), (740, 360), (667, 375), (932, 430)]:
        ctx, pg = open_page(b, w, h, True, 'mobile'); battle(pg)
        hud, dock, pause = rect(pg, '#hudBattle'), rect(pg, '#dock'), rect(pg, '#bPause')
        a, bb, mm = rect(pg, '.side.a'), rect(pg, '.side.b'), rect(pg, '#minimap')
        used = hud['b'] + (h - dock['t'])
        ok(used < .45 * h, '%dx%d: top row %d px + dock %d px = %d%% of the height' % (w, h, hud['b'], h - dock['t'], 100 * used / h))
        ok(not overlap(pause, a) and not overlap(pause, mm) and not overlap(a, mm) and not overlap(mm, bb), '%dx%d: pause button, cards and map side by side without overlapping' % (w, h))
        ok(abs(a['t'] - mm['t']) < 2 and abs(bb['t'] - mm['t']) < 2, '%dx%d: both armies and the map share one row' % (w, h))
        o, ac = rect(pg, '#orders'), rect(pg, '#actBattle')
        ok(o and ac and abs(o['t'] - ac['t']) < 2, '%dx%d: orders and actions share one row' % (w, h))
        ok(not overlap(rect(pg, '#hint'), rect(pg, '#chips')), '%dx%d: the hint floats above the unit cards' % (w, h))
        ok(pg.evaluate('() => document.documentElement.scrollWidth <= innerWidth'), '%dx%d: nothing spills off the side' % (w, h))
        S(pg, 'S.openPanel(S.CASTLES[0].list[0]); return 1'); pg.wait_for_timeout(200)
        bp = rect(pg, '#bpanel')
        ok(bp and bp['h'] > .5 * h and bp['b'] <= h and bp['t'] >= hud['b'] - 1, '%dx%d: the building panel uses the height under the top row (%d px tall)' % (w, h, bp['h'] if bp else 0))
        ctx.close()

    print('Mobile layout, phone in portrait')
    ctx, pg = open_page(b, 390, 844, True, 'mobile'); battle(pg)
    seg, pause, a = rect(pg, '.top .seg'), rect(pg, '#bPause'), rect(pg, '.side.a')
    ok(seg and abs(seg['t'] + seg['h'] / 2 - (pause['t'] + pause['h'] / 2)) < 3, 'the mode tabs share the top row with the pause button')
    hud, dock = rect(pg, '#hudBattle'), rect(pg, '#dock')
    ok(hud['b'] + (844 - dock['t']) < .45 * 844, 'top + dock = %d%% of the height' % (100 * (hud['b'] + 844 - dock['t']) / 844))
    ctx.close()

    print('the PC layout on the same phone, for comparison (it stays the player\'s choice)')
    ctx, pg = open_page(b, 844, 390, True, 'pc'); battle(pg)
    hud, dock = rect(pg, '#hudBattle'), rect(pg, '#dock')
    print('       844x390 with the PC layout: top %d px + dock %d px = %d%% of the height' % (hud['b'], 390 - dock['t'], 100 * (hud['b'] + 390 - dock['t']) / 390))
    ctx.close()

    print('PC layout is unchanged')
    ctx, pg = open_page(b, 1366, 768, False, 'pc'); battle(pg)
    ok(pg.evaluate('() => getComputedStyle(document.querySelector(".brand .w")).display !== "none" && getComputedStyle(document.querySelector(".top .seg")).display !== "none"'), 'title and mode tabs shown')
    o, ac = rect(pg, '#orders'), rect(pg, '#actBattle')
    ok(ac['t'] > o['b'], 'orders and actions on their own rows')
    ok('click' in pg.evaluate('() => document.querySelector("#hint").textContent'), 'the hint speaks of clicking: "%s"' % pg.evaluate('() => document.querySelector("#hint").textContent'))
    ctx.close()
    b.close()

print('\nui layout: %s' % ('all passed' if not fails else '%d failed' % fails))
sys.exit(1 if fails else 0)
