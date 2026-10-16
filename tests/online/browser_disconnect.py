"""Real online disconnection test (two browsers, the real Supabase project).

    python3 tests/online/browser_disconnect.py http://localhost:8080/ guest     # the guest's page closes mid-battle
    python3 tests/online/browser_disconnect.py http://localhost:8080/ host      # the host's page closes mid-battle

guest: the host shows the player as disconnected, keeps the battle going through the grace period, then ends the match
       with no winner (a dropped connection never awards a victory); the database records 'abandoned'.
host:  the guest shows the lost connection, waits, then asks the server to end the match; the server checks the host's
       heartbeat itself and records 'host_disconnected' with no winner.
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/'
WHO = sys.argv[2] if len(sys.argv) > 2 else 'guest'
fails = 0
def ok(c, m):
    global fails
    print(('  ok   ' if c else '  FAIL ') + m, flush=True)
    if not c: fails += 1
def S(pg, code): return pg.evaluate('() => { const S = window.__SE3D; ' + code + ' }')
def wait(pg, code, timeout=60, what=''):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            v = S(pg, code)
            if v: return v
        except Exception: pass
        pg.wait_for_timeout(500)
    raise AssertionError('timed out waiting for ' + (what or code))

proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
with sync_playwright() as p:
    args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
    if proxy: args += ['--proxy-server=' + proxy, '--proxy-bypass-list=localhost;127.0.0.1']
    b = p.chromium.launch(args=args)
    pages = []
    for i in range(2):
        ctx = b.new_context(viewport={'width': 640, 'height': 420}, ignore_https_errors=True, service_workers='block')
        pg = ctx.new_page()
        for attempt in range(3):
            try: pg.goto(URL, wait_until='domcontentloaded', timeout=45000); break
            except Exception as e: print('   (page load retry)', flush=True)
        wait(pg, 'return S && S.game && !document.querySelector("#menu").hidden', 120, 'title menu')
        S(pg, "S.settings.quality='low'; S.applyQuality(); window.SE3D_NO_DRAW=true; return 1")
        pages.append(pg)
    A, B = pages
    for i, pg in enumerate(pages):
        pg.click('#mmOnline'); wait(pg, 'return document.querySelector("#onConn").dataset.s==="ok"', 40, 'sign-in')
        pg.fill('#onName', ['Host', 'Guest'][i]); pg.dispatch_event('#onName', 'change')
    A.click('#onCreate')
    code = wait(A, 'const e=document.querySelector("#onRoomCode"); return e&&e.textContent', 30, 'room code')
    B.fill('#onCode', code); B.click('#onJoin'); wait(B, 'return !!document.querySelector("#onRoomCode")', 30, 'joined')
    for pg in pages: pg.click('#onReady')
    wait(A, 'return !document.querySelector("#onStart").disabled', 30, 'ready'); A.click('#onStart')
    for pg in pages: wait(pg, 'return S.NET.on && document.querySelector("#menu").hidden', 40, 'battle')
    wait(B, 'return S.units.filter(u=>u.alive).length>=16', 60, 'guest sees the battle')
    print('room ' + code + ': battle running, now closing the ' + WHO + "'s page", flush=True)
    if WHO == 'guest':
        B.context.close()
        t0 = time.time()
        note = wait(A, 'const t=document.querySelector("#netTxt").textContent+" "+document.querySelector("#netNote").textContent; return /disconnected|lost connection/.test(t)&&t', 40, 'host notices the guest dropping')
        ok(True, 'the host shows the dropped player: "' + note.strip() + '"')
        A.wait_for_timeout(15000)
        ok(S(A, 'return !S.netTest().over() && S.game.over<=0'), 'during the grace period the battle goes on')
        wait(A, 'return !document.querySelector("#results").hidden', 150, 'match ends after the grace period')
        res = A.evaluate('() => [document.querySelector("#resH").textContent, document.querySelector("#resSub").textContent]')
        ok(res[0] == 'No result', 'after %.0f s the host ends the match with no winner: %s — %s' % (time.time() - t0, res[0], res[1]))
    else:
        A.context.close()
        t0 = time.time()
        wait(B, 'return !document.querySelector("#netWait").hidden', 40, 'guest notices the host is gone')
        ok(True, 'the guest shows the lost connection: "' + B.evaluate('() => document.querySelector("#netWaitH").textContent') + '"')
        wait(B, 'return !document.querySelector("#results").hidden', 240, 'match ended for the guest')
        res = B.evaluate('() => [document.querySelector("#resH").textContent, document.querySelector("#resSub").textContent]')
        ok(res[0] == 'No result' and 'host' in res[1].lower(), 'after %.0f s the server-confirmed end reaches the guest: %s — %s' % (time.time() - t0, res[0], res[1]))
    print(json.dumps({'code': code}), flush=True)
    b.close()
print('\ndisconnect (%s): %s' % (WHO, 'all passed' if not fails else '%d failed' % fails))
sys.exit(1 if fails else 0)
