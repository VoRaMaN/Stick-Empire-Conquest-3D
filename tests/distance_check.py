"""View distance and shadow distance check in a real browser (Chromium through Playwright, no network needed).

    npm run build && python3 -m http.server 8080 -d dist/web &
    python3 tests/distance_check.py http://localhost:8080/ [screenshot-dir]

Checks that both sliders exist in Settings and in the Advanced graphics screen, stay in step with each other, are
saved, survive a preset change, and move what they should: the haze and far plane for view distance (and the
Riverlands scenery reaching further), the sun's shadow box for shadow distance. Takes screenshots of the extremes.
"""
import sys, os
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/'
OUT = sys.argv[2] if len(sys.argv) > 2 else None
fails = 0
def ok(c, m):
    global fails
    print(('  ok   ' if c else '  FAIL ') + m, flush=True)
    if not c: fails += 1
def S(pg, code): return pg.evaluate('() => { const S = window.__SE3D; ' + code + ' }')
def slide(pg, sel, v): pg.evaluate('([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event("input", {bubbles: true})); }', [sel, v])
STATE = "const f = S.sceneRef.fog, C = S.sun.shadow.camera; return {near: f.near, far: f.far, cf: S.camera.far, sl: C.left, sr: C.right, st: C.top, sfar: C.far, vd: S.settings.viewDist, sd: S.settings.shadowDist, tiles: S.RL.tiles.filter(t => t.im.visible || (t.lo && t.lo.visible)).length}"

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
    ctx.add_init_script("try{if(!localStorage.getItem('se3d-settings'))localStorage.setItem('se3d-settings',JSON.stringify({uiMode:'pc',quality:'medium',map:'river'}))}catch(e){}")
    pg = ctx.new_page(); pg.goto(URL, wait_until='domcontentloaded', timeout=90000)
    pg.wait_for_function('() => window.__SE3D && !document.querySelector("#menu").hidden', timeout=90000)

    print('defaults')
    st = S(pg, STATE)
    ok(st['vd'] == 1 and st['sd'] == 46 and abs(st['sr'] - 46) < 1e-6 and abs(st['st'] - 24) < 1e-6 and abs(st['sfar'] - 95) < 1e-6, 'view distance 1×, shadow box ±46 × ±24, depth 95, as before: %s' % st)

    print('Settings sliders')
    S(pg, "S.openSheet('settings'); return 1")
    ok(pg.is_visible('#sView') and pg.is_visible('#sShadowD'), 'View distance and Shadow distance sliders are in Settings')
    ok(pg.evaluate('() => document.querySelector("#oView").textContent') == '105 m', 'view distance reads %s on the classic map' % pg.evaluate('() => document.querySelector("#oView").textContent'))
    slide(pg, '#sView', 2); slide(pg, '#sShadowD', 90)
    st = S(pg, STATE)
    ok(abs(st['near'] * 1 - 38 * 2 / S(pg, 'return S.GFX().fog')) < .01 and st['cf'] >= 105 * 2 * 2.2 - 1, 'view 2×: haze from %.0f to %.0f m, far plane %.0f m' % (st['near'], st['far'], st['cf']))
    ok(abs(st['sr'] - 90) < 1e-6 and abs(st['st'] - 90 * 24 / 46) < 1e-6 and st['sfar'] > 180, 'shadow 90 m: box ±%.0f × ±%.0f, depth %.0f' % (st['sr'], st['st'], st['sfar']))
    ok(pg.evaluate('() => document.querySelector("#oView").textContent') == '210 m' and pg.evaluate('() => document.querySelector("#oShadowD").textContent') == '90 m', 'the read-outs follow')
    saved = pg.evaluate('() => JSON.parse(localStorage.getItem("se3d-settings"))')
    ok(saved.get('viewDist') == 2 and saved.get('shadowDist') == 90, 'both are saved')

    print('Advanced graphics screen')
    pg.click('#setGfx'); pg.wait_for_timeout(200)
    ok(pg.is_visible('#gx_viewDist') and pg.is_visible('#gx_shadowDist'), 'both sliders are on the Advanced screen too')
    adv = pg.evaluate('() => [document.querySelector("#gx_viewDist").value, document.querySelector("#gx_shadowDist").value]')
    ok(adv == ['2', '90'], 'and show the same values: %s' % adv)
    slide(pg, '#gx_shadowDist', 30)
    ok(S(pg, 'return S.settings.shadowDist') == 30 and abs(S(pg, 'return S.sun.shadow.camera.right') - 30) < 1e-6, 'moving it there sets the shadow box to ±30')
    ok(S(pg, 'return S.settings.quality') == 'medium', 'and does not switch the preset to Custom (%s)' % S(pg, 'return S.settings.quality'))
    S(pg, "S.settings.quality='low'; S.applyQuality(); return 1")
    st = S(pg, STATE)
    ok(st['vd'] == 2 and abs(st['sr'] - 30) < 1e-6, 'changing the preset keeps both: %s' % st)
    S(pg, "S.settings.quality='medium'; S.applyQuality(); return 1")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)

    print('Riverlands')
    S(pg, "S.closeMenu && 0; return 1")
    pg.reload(wait_until='domcontentloaded'); pg.wait_for_function('() => window.__SE3D && !document.querySelector("#menu").hidden', timeout=90000)
    st = S(pg, STATE); ok(st['vd'] == 2 and st['sd'] == 30, 'after a reload both are still set: vd %s sd %s' % (st['vd'], st['sd']))
    pg.click('#mmSkirmish'); pg.click('.mapc[data-map=river]'); pg.click('#skStart')
    pg.wait_for_function('() => document.querySelector("#menu").hidden && !document.querySelector("#hudBattle").hidden', timeout=60000)
    pg.wait_for_timeout(3200)
    S(pg, "S.cam.target.set(0,0,0); S.cam.dist=60; S.cam.pitch=.42; return 1")
    shots = []
    for (vd, sd, name) in [(.5, 20, 'near'), (1, 46, 'default'), (2.5, 160, 'far')]:
        S(pg, "S.setDistance('viewDist', %s); S.setDistance('shadowDist', %s); return 1" % (vd, sd))
        S(pg, 'S.draw(); S.draw(); return 1'); pg.wait_for_timeout(250)
        st = S(pg, STATE); shots.append(st)
        print('       view %.1f× shadow %d m: haze %.0f–%.0f m, far plane %.0f, box ±%.0f, depth %.0f, scenery tiles drawn %d' % (vd, sd, st['near'], st['far'], st['cf'], st['sr'], st['sfar'], st['tiles']))
        if OUT: pg.screenshot(path=os.path.join(OUT, 'dist-%s.png' % name))
    ok(shots[0]['far'] < shots[1]['far'] < shots[2]['far'] and shots[0]['cf'] < shots[2]['cf'], 'the haze and far plane move out with view distance')
    ok(shots[0]['tiles'] < shots[1]['tiles'] < shots[2]['tiles'], 'more scenery tiles are drawn further out: %d < %d < %d' % (shots[0]['tiles'], shots[1]['tiles'], shots[2]['tiles']))
    sp = S(pg, 'const s = S.sun.position, t = S.sun.target.position; return [s.x - t.x, s.y - t.y, s.z - t.z]')
    import math
    ok(abs(math.hypot(*sp) - 37.58 * 160 / 46) < 1, 'at 160 m the sun backs off to %.0f m so the box stays in front of it' % math.hypot(*sp))
    ctx.close(); b.close()

print('\ndistance check: %s' % ('all passed' if not fails else '%d failed' % fails))
sys.exit(1 if fails else 0)
