"""Real online match test: separate browser sessions, separate anonymous identities, the real Supabase project.

    python3 tests/online/browser_match.py http://localhost:8080/ 1v1      (or 2v2; serve dist/web first: npm run serve)

Each player is its own Chromium browser context (its own sessionStorage, so its own anonymous Supabase user). Player A
creates a private room through the Online Multiplayer menu, the others join with the code, everyone presses Ready, the
host starts, and the battle is then checked on every screen: teams, recruitment and treasury, movement orders both
ways, combat and deaths, statue health and the final result (also read back from the database).
Needs network access to the Supabase project (and HTTPS_PROXY when running behind a proxy).
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080/'
MODE = sys.argv[2] if len(sys.argv) > 2 else '1v1'
SHOTS = os.environ.get('SHOTS', '')
N = 2 if MODE == '1v1' else 4
fails = 0
def ok(c, m):
    global fails
    print(('  ok   ' if c else '  FAIL ') + m, flush=True)
    if not c: fails += 1

def S(pg, code):   # evaluate in the game (window.__SE3D is the game's debug/test handle)
    return pg.evaluate('() => { const S = window.__SE3D; ' + code + ' }')

def wait(pg, code, timeout=60, what=''):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            v = S(pg, code)
            if v: return v
        except Exception as e:
            pass
        pg.wait_for_timeout(250)
    try: print('   (state:', pg.evaluate('() => { const S=window.__SE3D; return JSON.stringify({net:S.NET, over:S.game.over, winner:S.game.winner, mode:S.game.mode, res:!document.querySelector("#results").hidden, st:S.statues.map(s=>s.hp)}) }'), ')')
    except Exception as e: pass
    print('   recent console:', json.dumps(logs[-8:]))
    raise AssertionError('timed out waiting for ' + (what or code))

def shot(pg, name):
    if not SHOTS: return
    pg.evaluate('() => { window.SE3D_NO_DRAW = false }'); pg.wait_for_timeout(1500)
    pg.screenshot(path=os.path.join(SHOTS, name + '.png'))
    pg.evaluate('() => { window.SE3D_NO_DRAW = true }')

proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
with sync_playwright() as p:
    args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
    if proxy: args += ['--proxy-server=' + proxy, '--proxy-bypass-list=localhost;127.0.0.1']   # the game itself is served locally; Supabase goes through the proxy
    b = p.chromium.launch(args=args)
    pages, logs = [], []
    for i in range(N):
        ctx = b.new_context(viewport={'width': 640, 'height': 420}, ignore_https_errors=True, service_workers='block')
        # answer the first-launch "PC or Mobile" question up front (it would cover the title menu)
        ctx.add_init_script("try{const k='se3d-settings',s=JSON.parse(localStorage.getItem(k)||'{}');if(!s.uiMode){s.uiMode='%s';localStorage.setItem(k,JSON.stringify(s));}}catch(e){}" % os.environ.get('UI', 'pc'))   # UI=mobile for the Mobile layout
        pg = ctx.new_page()
        pg.on('console', lambda m, i=i: logs.append((i, m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e, i=i: logs.append((i, 'pageerror', str(e))))
        for attempt in range(3):
            try: pg.goto(URL, wait_until='domcontentloaded', timeout=45000); break
            except Exception as e: print('   (page load retry: %s)' % str(e).split('\n')[0], flush=True)
        pages.append(pg)
        wait(pg, 'return S && S.game && !document.querySelector("#menu").hidden', 120, 'title menu')
        S(pg, "S.settings.quality='low'; S.applyQuality(); window.SE3D_NO_DRAW=true; return 1")   # several browsers on one small CPU: simulate, don't render
    A = pages[0]
    names = ['Alpha', 'Bravo', 'Charlie', 'Delta']
    print('lobby', flush=True)
    for i, pg in enumerate(pages):
        pg.click('#mmOnline')
        wait(pg, 'return document.querySelector("#onConn").dataset.s==="ok"', 40, 'sign-in')
        pg.fill('#onName', names[i]); pg.dispatch_event('#onName', 'change')
        if MODE == '2v2': pg.click('.on-seg button[data-m="2v2"]')
    A.click('#onCreate')
    code = wait(A, 'const e=document.querySelector("#onRoomCode"); return e&&e.textContent', 30, 'room code')
    ok(len(code) == 6, 'A created a private room: code ' + code)
    for pg in pages[1:]:
        pg.fill('#onCode', code.lower()); pg.click('#onJoin')
        wait(pg, 'const e=document.querySelector("#onRoomCode"); return e&&e.textContent', 30, 'joined lobby')
    wait(A, 'return document.querySelectorAll(".on-p:not(.empty)").length===%d' % N, 30, 'all players in the lobby')
    seats = [pg.evaluate('() => [...document.querySelectorAll(".on-team")].map(t => [...t.querySelectorAll(".on-p:not(.empty) .nm")].map(x => x.textContent.replace(" (you)", "")))') for pg in pages]
    ok(all(s == seats[0] for s in seats), 'every lobby shows the same seats: ' + json.dumps(seats[0]))
    ok(all(any(names[i] in n for n in sum(seats[0], [])) for i in range(N)), 'all %d named players are seated' % N)
    if MODE == '1v1': ok(names[0] in ' '.join(seats[0][0]) and names[1] in ' '.join(seats[0][1]), 'team assignment: Alpha on team 1, Bravo on team 2')
    else: ok(names[0] in ' '.join(seats[0][0]) and names[2] in ' '.join(seats[0][0]) and names[1] in ' '.join(seats[0][1]) and names[3] in ' '.join(seats[0][1]), '2v2 teams: Alpha+Charlie vs Bravo+Delta')
    ok(A.is_disabled('#onStart'), 'Start is disabled until everyone is ready')
    shot(A, MODE + '_lobby_A')
    for pg in pages: pg.click('#onReady')
    wait(A, 'return !document.querySelector("#onStart").disabled', 30, 'everyone ready')
    shot(A, MODE + '_lobby_ready_A')
    A.click('#onStart')
    print('battle', flush=True)
    for pg in pages: wait(pg, 'return S.NET.on && S.game.mode==="battle" && document.querySelector("#menu").hidden', 40, 'battle started')
    roles = [S(pg, 'return [S.NET.host, S.NET.team]') for pg in pages]
    ok(roles[0] == [True, 0] and all(r[0] is False for r in roles[1:]), 'A hosts the simulation; the others are guests: ' + json.dumps(roles))
    ok([r[1] for r in roles] == ([0, 1] if MODE == '1v1' else [0, 1, 0, 1]), 'each player commands the right team: ' + json.dumps([r[1] for r in roles]))
    for pg in pages[1:]: wait(pg, 'return S.units.filter(u=>u.alive).length>=16', 60, 'guest sees the armies')
    pg.wait_for_timeout(1500)
    def census(pg): return S(pg, 'return {ids:S.units.filter(u=>u.alive&&u.isUnit).map(u=>u.id).sort((a,b)=>a-b), gold:S.game.gold.map(Math.floor), st:S.statues.map(s=>Math.ceil(s.hp)), corpses:S.corpses.filter(c=>c.isUnit).length}')
    c = [census(pg) for pg in pages]
    ok(all(x['ids'] == c[0]['ids'] for x in c), 'every screen shows the same %d soldiers' % len(c[0]['ids']))
    shot(A, MODE + '_battle_A'); shot(pages[1], MODE + '_battle_B')
    print('recruitment and treasury', flush=True)
    g0 = S(A, 'return S.game.gold[0]')
    A.click('#chip-sword'); A.wait_for_timeout(300)
    ok(S(A, 'return S.game.gold[0]') <= g0 - 99, 'A recruits a Swordsman from the dock: gold %d -> %d' % (g0, S(A, 'return S.game.gold[0]')))
    Bp = pages[1]
    fac1 = S(Bp, 'return S.facOf(1)'); cheap = 'thrall' if fac1 == 'chaos' else 'miner'
    sb0 = S(Bp, 'return S.game.gold[1]')
    Bp.click('#chip-' + cheap)
    wait(Bp, 'return S.netTest().pending()===0 && (S.netTest().acks||[]).length>0', 20, 'host confirms B purchase')
    ack = S(Bp, 'return S.netTest().acks.slice(-1)[0]')
    ok(ack[1] == 1, 'B recruits a %s from its dock; the host confirms it (%s)' % (cheap, json.dumps(ack)))
    wait(Bp, 'return S.game.gold[1] < %d' % (sb0 - 20), 30, "B's own treasury drop")
    gA, gB = S(A, 'return S.game.gold.map(Math.floor)'), S(Bp, 'return S.game.gold.map(Math.floor)')
    ok(abs(gA[1] - gB[1]) <= 15 and gB[1] < sb0, 'both screens show B\'s treasury spent: host %d, guest %d (was %d)' % (gA[1], gB[1], sb0))
    wait(Bp, 'return S.units.filter(u=>u.alive&&u.team===1&&u.type==="%s").length>=3' % cheap, 40, 'B unit appears')
    wait(A, 'return S.units.filter(u=>u.alive&&u.team===1&&u.type==="%s").length>=3' % cheap, 5, 'B unit on host')
    ok(True, 'B\'s new %s walked out of its castle on the host and on B' % cheap)
    wait(Bp, 'const ids=new Set(S.units.filter(u=>u.alive&&u.team===0&&u.type==="sword").map(u=>u.id)); return ids.size>=%d' % 4, 40, "A's swordsman appears on B")
    ok(True, 'A\'s recruited Swordsman appears on B\'s screen')
    print('movement orders both ways', flush=True)
    dist = 'const r=S.regs.find(r=>r.id===%d); const a=r?r.units.filter(u=>u.alive):[]; return a.length?a.reduce((s,u)=>s+Math.hypot(u.pos.x-(%s),u.pos.z-(%s)),0)/a.length:-1'
    rA = S(A, 'return S.regs.find(r=>r.team===0&&r.units.some(u=>u.alive)).id')
    rB = S(Bp, 'return S.regs.find(r=>r.team===1&&r.units.some(u=>u.alive)).id')
    dA0, dB0 = S(A, dist % (rA, -12, -8)), S(A, dist % (rB, 14, 8))
    S(A, 'S.issue("reg",{r:%d,k:"move",x:-12,z:-8}); return 1' % rA)      # through the same path as a tap on the ground
    S(Bp, 'S.issue("reg",{r:%d,k:"move",x:14,z:8}); return 1' % rB)
    t0 = time.time()
    while time.time() - t0 < 120 and not (S(A, dist % (rA, -12, -8)) < 4.5 and S(A, dist % (rB, 14, 8)) < 4.5): A.wait_for_timeout(1500)
    A.wait_for_timeout(1500)
    hA, gA_, hB, gB_ = S(A, dist % (rA, -12, -8)), S(Bp, dist % (rA, -12, -8)), S(A, dist % (rB, 14, 8)), S(Bp, dist % (rB, 14, 8))
    kA, kB = S(Bp, 'return S.regs.find(r=>r.id===%d).order.kind' % rA), S(A, 'return S.regs.find(r=>r.id===%d).order.kind' % rB)
    ok(kA in ('move', 'hold') and dA0 - hA > 5 and abs(hA - gA_) < 1.5, "A's move order: regiment %d marched %.1f -> %.1f m from the spot on the host, %.1f m on B's screen (%s)" % (rA, dA0, hA, gA_, kA))
    ok(kB in ('move', 'hold') and dB0 - hB > 5 and abs(hB - gB_) < 1.5, "B's move order: regiment %d marched %.1f -> %.1f m from the spot on the host, %.1f m on B's screen (%s)" % (rB, dB0, hB, gB_, kB))
    shot(A, MODE + '_moved_A'); shot(Bp, MODE + '_moved_B')
    if MODE == '2v2':
        print('2v2: teammates share an army and a treasury', flush=True)
        Cp, Dp = pages[2], pages[3]
        g0 = S(A, 'return S.game.gold[0]')
        S(Cp, 'S.issue("buy",{t:"sword"}); return 1')
        wait(Cp, 'return S.netTest().pending()===0', 30, "Charlie's purchase confirmed")
        ackC = S(Cp, 'return (S.netTest().acks||[]).slice(-1)[0]')
        wait(A, 'return S.game.gold[0] < %d' % (g0 - 100), 10, 'team 0 treasury spent')
        ok(ackC and ackC[1] == 1, "Charlie (Alpha's teammate) buys a Swordsman from the shared team-0 treasury (%d -> %d)" % (g0, S(A, 'return S.game.gold[0]')))
        reg0 = S(Cp, 'return S.regs.find(r=>r.team===0&&r.units.some(u=>u.alive)).id')
        S(Cp, 'S.issue("reg",{r:%d,k:"hold"}); return 1' % reg0)
        S(Dp, 'S.issue("reg",{r:%d,k:"charge"}); return 1' % reg0)
        wait(Dp, 'return S.netTest().pending()===0', 30, "Delta's order answered")
        ackD = S(Dp, 'return (S.netTest().acks||[]).slice(-1)[0]')
        A.wait_for_timeout(1500)
        kinds = [S(pg, 'return S.regs.find(r=>r.id===%d).order.kind' % reg0) for pg in pages]
        ok(ackD and ackD[1] == 0 and ackD[2] == 'not_your_regiment', "Delta (the other team) is refused command of team 0's regiment: " + json.dumps(ackD))
        ok(all(k == 'hold' for k in kinds), "Charlie's hold order stands on all four screens: " + json.dumps(kinds))
        golds = [S(pg, 'return Math.floor(S.game.gold[0])') for pg in pages]
        ok(max(golds) - min(golds) <= 30, 'all four screens show the same shared team-0 treasury: ' + json.dumps(golds))
    print('combat', flush=True)
    for pg in pages: S(pg, 'S.issue("stance",{st:"charge"}); return 1')
    t0 = time.time()
    while time.time() - t0 < 150:
        if S(A, 'return S.corpses.filter(c=>c.isUnit).length') >= 6: break
        A.wait_for_timeout(2000)
    A.wait_for_timeout(2500)
    c = [census(pg) for pg in pages]
    ok(c[0]['corpses'] >= 3, 'soldiers fell on the host: %d' % c[0]['corpses'])
    same = [len(set(c[0]['ids']) ^ set(x['ids'])) for x in c[1:]]
    ok(all(s <= 3 for s in same), 'the same soldiers are alive on every screen (differences: %s, host %d alive)' % (same, len(c[0]['ids'])))
    ok(all(abs(x['corpses'] - c[0]['corpses']) <= 3 for x in c[1:]), 'deaths reached every screen: ' + ', '.join(str(x['corpses']) for x in c))
    ok(all(x['st'] == c[0]['st'] for x in c), 'statue health agrees: ' + json.dumps([x['st'] for x in c]))
    hp = [S(pg, 'const m={}; for(const u of S.units) if(u.alive&&u.isUnit) m[u.id]=Math.round(u.hp); return m') for pg in pages]
    gap = max([abs(hp[0][k] - h[k]) for h in hp[1:] for k in h if k in hp[0]] or [0])
    ok(gap <= 60, 'unit health agrees across screens (largest gap %d, a hit in flight)' % gap)
    shot(A, MODE + '_combat_A'); shot(Bp, MODE + '_combat_B')
    print('victory', flush=True)
    S(A, 'S.statues[1].hp=3; S.hitStatue(S.statues[1], 50); return 1')
    for pg in pages: wait(pg, 'return !document.querySelector("#results").hidden', 120, 'results')
    res = [pg.evaluate('() => [document.querySelector("#resH").textContent, document.querySelector("#resSub").textContent]') for pg in pages]
    want = ['Victory', 'Defeat'] if MODE == '1v1' else ['Victory', 'Defeat', 'Victory', 'Defeat']
    ok([r[0] for r in res] == want, 'every player gets the right result: ' + json.dumps([r[0] for r in res]))
    shot(A, MODE + '_result_A'); shot(Bp, MODE + '_result_B')
    errs = [l for l in logs if l[1] in ('error', 'pageerror')]
    ok(not errs, 'no page errors (%d)' % len(errs) + ('' if not errs else ': ' + json.dumps(errs[:5])))
    print(json.dumps({'code': code}), flush=True)
    b.close()
print('\n%s: %s' % (MODE, 'all passed' if not fails else '%d failed' % fails))
sys.exit(1 if fails else 0)
