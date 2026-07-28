#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - TEST EVERY FUNCTION
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  "Make sure every function of this works. Go over it multiple times,
#   don't move on till it's faultless." (A. Fisher, 25 Jul 2026)
#
#  Drives the real page in a real phone-sized browser and checks every
#  button, link and screen actually does its job - THREE TIMES OVER,
#  once for each way the page gets opened on site:
#
#    file://    a copy saved onto someone's phone
#    http://    the tool store network - NO INTERNET, so plain http
#    https://   anywhere secure
#
#  The http:// pass matters most. That is how the crews actually reach
#  it, and it is the one where the browser refuses the camera - the
#  reason the scanner used to flicker on and straight back off.
#
#      py TEST_MY_GEAR.py
#
#  Exits non-zero on any failure, and names what failed.
# =====================================================================

import os
import ssl
import sys
import time
import shutil
import tempfile
import socket
import threading
import subprocess
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "Gear_Lookup", "index.html")

#  A hirer who genuinely has gear out, so the card is fully populated.
TEST_ID = "10006460"


# ---------------------------------------------------------------------
#  a throwaway http + https server, so we can test the page the way the
#  tool store actually serves it
# ---------------------------------------------------------------------
def _serve(directory, port, certfile=None):
    h = partial(SimpleHTTPRequestHandler, directory=directory)
    srv = ThreadingHTTPServer(("0.0.0.0", port), h)
    if certfile:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(certfile)
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def _selfsigned(path):
    try:
        subprocess.run(
            ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
             "-keyout", path, "-out", path, "-days", "2",
             "-subj", "/CN=localhost"],
            check=True, capture_output=True)
        return path
    except Exception:
        return None


CHECKS = []


def check(name, fn):
    CHECKS.append((name, fn))


# ---------------------------------------------------------------------
#  the checks - one per thing a person can actually do
# ---------------------------------------------------------------------
def run_page(pg, url, scheme, results):
    def ok(name, cond, detail=""):
        results.append((scheme, name, bool(cond), detail))

    errs, reqs = [], []
    pg.on("request", lambda r: reqs.append(r.url))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # ---- 1. it opens, branded, with no errors ------------------------
    pg.goto(url)
    pg.wait_for_timeout(1100)
    ok("page loads with no JS errors", not errs, "; ".join(errs[:2]))
    ok("says MY GEAR (matches the signs)",
       pg.evaluate("()=>document.querySelector('h1.mg')?.innerText.replace(/\\s+/g,' ').toUpperCase()") == "MY GEAR")
    ok("title still My Gear",
       "My Gear" in (pg.title() or ""))

    # ---- 2. the guide shelf appears ONCE -----------------------------
    n_shelf = pg.evaluate("()=>document.querySelectorAll('.gshelf').length")
    ok("one guide shelf, not two", n_shelf == 1, "found %d" % n_shelf)

    # ---- 3. every guide opens and closes -----------------------------
    for key, want in (("contacts", "Contact board"),
                      ("radio", "Your two-way radio"),
                      ("gas", "Your gas monitor")):
        pg.evaluate("(k)=>openGuide(k)", key)
        pg.wait_for_timeout(320)
        opened = pg.evaluate(
            "()=>document.getElementById('gsheet').className.indexOf('on')>=0")
        title = pg.evaluate(
            "()=>document.getElementById('gsheet-title').textContent")
        vis = pg.evaluate(
            "(k)=>document.getElementById('g-'+k).className.indexOf('on')>=0",
            key)
        ok("guide '%s' opens" % key, opened and vis and title == want, title)
        pg.evaluate("()=>closeGuide()")
        pg.wait_for_timeout(200)
        ok("guide '%s' closes" % key,
           not pg.evaluate("()=>document.getElementById('gsheet')"
                           ".className.indexOf('on')>=0"))

    # ---- 4. the contact numbers actually dial ------------------------
    pg.evaluate("()=>openGuide('contacts')")
    pg.wait_for_timeout(300)
    tels = pg.evaluate(
        "()=>[...document.querySelectorAll('a.tel')].map(a=>a.getAttribute('href'))")
    ok("every number is a tel: link", len(tels) >= 40, "%d links" % len(tels))
    ok("all tel: links are well formed",
       all(t and t.startswith("tel:") and t[4:].isdigit() for t in tels),
       str([t for t in tels if not (t or "").startswith("tel:")][:2]))
    ok("emergency 2222 present", "tel:2222" in tels)
    ok("radio-only people show no dead link",
       pg.evaluate("()=>document.querySelectorAll('.gradio').length") >= 5)
    pg.evaluate("()=>closeGuide()")

    # ---- 5. the scan button tells the truth --------------------------
    #  Chromium treats file:// and localhost as secure origins, so the
    #  camera is genuinely available there. Only the LAN http case - the
    #  real tool store - must hide the button.
    secure = scheme in ("https", "file")
    shown = pg.evaluate(
        "()=>{var b=document.getElementById('scanbtn');"
        "return !!b && !b.hasAttribute('hidden')}")
    ok("scan button shown only where the camera can work",
       shown == secure,
       "scheme=%s shown=%s" % (scheme, shown))
    if not secure:
        hint = pg.evaluate(
            "()=>document.getElementById('scanhelp')?.textContent||''")
        ok("explains what to do instead of scanning",
           "camera" in hint.lower() and "qr" in hint.lower(), hint[:60])
        # and it must NOT flicker: no overlay should ever open
        pg.evaluate("()=>{try{startScan()}catch(e){}}")
        pg.wait_for_timeout(500)
        ok("no flickering camera overlay",
           not pg.evaluate("()=>document.getElementById('scanwrap')"
                           ".className.indexOf('on')>=0"))

    # ---- 6. looking yourself up --------------------------------------
    pg.fill("#idno", TEST_ID)
    pg.evaluate("()=>go()")
    pg.wait_for_timeout(1400)
    ok("ID lookup shows the card",
       pg.evaluate("()=>document.getElementById('result').style.display==='block'"))
    ok("the card is the right person",
       TEST_ID in pg.evaluate("()=>document.getElementById('result').innerText"))
    ok("gear lines rendered",
       pg.evaluate("()=>document.querySelectorAll('#result .item').length") > 0)

    # ---- 7. the new gear-line details --------------------------------
    ok("compliance badges on the gear lines",
       pg.evaluate("()=>document.querySelectorAll('#result .item .cb').length") > 0)
    ok("orange Plant ID pills",
       pg.evaluate("()=>document.querySelectorAll('#result .item .n .pid').length") > 0)

    # ---- 8. save to phone, not print ---------------------------------
    label = pg.evaluate(
        "()=>document.querySelector('#result .actions .primary')?.textContent||''")
    ok("save button says save, not print",
       "save" in label.lower() and "print" not in label.lower(), label)
    ok("save button does not call window.print",
       pg.evaluate("()=>document.querySelector('#result .actions .primary')"
                   ".getAttribute('onclick')") == "saveCard()")
    made = pg.evaluate("""()=>{try{var f=cardFile();
        return f && f.size>1000 && f.type==='text/html' && /My Gear/.test(f.name)}
        catch(e){return 'ERR '+e.message}}""")
    ok("save produces a real file", made is True, str(made))

    # ---- 9. the quiet guide link on the card -------------------------
    ok("one guide link on the card (not three buttons)",
       pg.evaluate("()=>document.querySelectorAll('#result .guidelink').length") == 1
       and pg.evaluate("()=>document.querySelectorAll('#result .gbtn').length") == 0)
    pg.evaluate("()=>document.querySelector('#result .guidelink').click()")
    pg.wait_for_timeout(320)
    ok("that link opens the guides",
       pg.evaluate("()=>document.getElementById('gsheet').className.indexOf('on')>=0"))
    pg.evaluate("()=>closeGuide()")

    # ---- 10. Done resets ---------------------------------------------
    pg.evaluate("()=>reset()")
    pg.wait_for_timeout(350)
    ok("Done goes back to the start",
       pg.evaluate("()=>document.getElementById('landing').style.display!=='none'")
       and pg.evaluate("()=>document.getElementById('idno').value") == "")

    # ---- 11. a wrong number shows nothing -----------------------------
    pg.fill("#idno", "00000000")
    pg.evaluate("()=>go()")
    pg.wait_for_timeout(600)
    ok("a wrong ID reveals nothing",
       pg.evaluate("()=>document.getElementById('result').style.display!=='block'")
       and len(pg.evaluate("()=>document.getElementById('err').textContent")) > 0)

    # ---- 12. the ?id= deep link (how the QR actually works) -----------
    pg.goto(url + "?id=" + TEST_ID)
    pg.wait_for_timeout(1500)
    ok("?id= link opens the gear straight up",
       pg.evaluate("()=>document.getElementById('result').style.display==='block'"))

    # ---- 13. nothing runs off the side of a phone --------------------
    ok("no sideways scrolling",
       not pg.evaluate("()=>document.documentElement.scrollWidth>"
                       "document.documentElement.clientWidth+1"))
    pg.evaluate("()=>openGuide('contacts')")
    pg.wait_for_timeout(300)
    ok("guides don't scroll sideways either",
       not pg.evaluate("()=>{var b=document.getElementById('gsbody');"
                       "return b.scrollWidth>b.clientWidth+1}"))
    pg.evaluate("()=>closeGuide()")

    # ---- 14. WORKS WITH NO INTERNET ----------------------------------
    #  The tool store network has no internet at all. If the page asked
    #  for a font, a script or an icon from anywhere off the box, it
    #  would hang or render broken out there. It must ask for NOTHING.
    ok("asks for nothing off the network", not [u for u in reqs
        if not u.startswith(("data:", "blob:", "file:")) and
           not u.startswith(url.rsplit("/", 1)[0])],
       str([u for u in reqs if not u.startswith(("data:", "blob:", "file:"))
            and not u.startswith(url.rsplit("/", 1)[0])][:2]))

    ok("still no JS errors at the end", not errs, "; ".join(errs[:2]))


def main():
    if not os.path.exists(PAGE):
        print("  Gear_Lookup\\index.html isn't there. Run BUILD_MY_GEAR.py first.")
        return 2
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Playwright isn't installed, so nothing can be measured.")
        return 2

    print("=" * 70)
    print("  COATES K2 | MY GEAR - EVERY FUNCTION, EVERY WAY IT'S OPENED")
    print("  Author: Andrew Fisher | POWERED BY SITEIQ")
    print("=" * 70)

    tmp = tempfile.mkdtemp()
    root = os.path.join(tmp, "site")
    os.makedirs(root)
    shutil.copy(PAGE, os.path.join(root, "index.html"))
    cert = _selfsigned(os.path.join(tmp, "c.pem"))

    #  IMPORTANT: 127.0.0.1 and file:// are treated as SECURE by browsers,
    #  so testing against them would wrongly show the camera as available.
    #  The tool store serves from a LAN address over plain http, which is
    #  NOT secure - so bind to this machine's real IP to reproduce what the
    #  crews actually get. (A. Fisher, 25 Jul 2026)
    lan = ""
    try:
        for cand in socket.gethostbyname_ex(socket.gethostname())[2]:
            if not cand.startswith("127."):
                lan = cand
                break
    except Exception:
        pass
    if not lan:
        try:
            _s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            _s.connect(("10.255.255.255", 1))
            lan = _s.getsockname()[0]
            _s.close()
        except Exception:
            lan = "127.0.0.1"
    _serve(root, 8731)
    if cert:
        _serve(root, 8732, cert)
    time.sleep(0.6)

    targets = [("file", "file://" + os.path.join(root, "index.html")),
               ("http-lan", "http://{}:8731/index.html".format(lan))]
    if cert:
        targets.append(("https", "https://127.0.0.1:8732/index.html"))
    else:
        print("  (openssl unavailable - the https pass is skipped)")

    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--ignore-certificate-errors"])
        for scheme, url in targets:
            ctx = b.new_context(viewport={"width": 414, "height": 896},
                                ignore_https_errors=True,
                                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS "
                                           "17_0 like Mac OS X) AppleWebKit/605.1.15")
            pg = ctx.new_page()
            print("\n  --- opened as {} ---".format(scheme))
            try:
                run_page(pg, url, scheme, results)
            except Exception as e:
                results.append((scheme, "the run itself completed", False,
                                str(e)[:120]))
            ctx.close()
        b.close()
    shutil.rmtree(tmp, ignore_errors=True)

    by = {}
    for scheme, name, good, detail in results:
        by.setdefault(name, []).append((scheme, good, detail))
    fails = []
    print()
    for name, rows in by.items():
        marks = "".join("." if g else "X" for _, g, _ in rows)
        allgood = all(g for _, g, _ in rows)
        print("  [{}] {:<52} {}".format("PASS" if allgood else "FAIL",
                                        name, marks))
        for scheme, g, d in rows:
            if not g:
                fails.append((scheme, name, d))
    print("-" * 70)
    n = len(results)
    if fails:
        print("  {} of {} checks FAILED:".format(len(fails), n))
        for scheme, name, d in fails:
            print("    [{}] {} {}".format(scheme, name,
                                          ("- " + d) if d else ""))
        return 1
    print("  ALL {} checks passed across {} ways of opening the page.".format(
        n, len(targets)))
    print("  Every button, every guide, every number, every screen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
