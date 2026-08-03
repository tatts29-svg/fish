#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK THE WAY AROUND MY GEAR
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 3 Aug 2026: "back button menu button so its easy accessable
#  going from one spot to the next and it all makes sense where they
#  are and how to go from point a to point b."
#
#  This opens all four My Gear pages in a real browser, on a phone-sized
#  screen, and WALKS them - in, deeper, back out, and off to the next
#  page. Reading the HTML would not catch any of what it catches.
#
#  A PAGE THAT COMPILES IS NOT A PAGE THAT WORKS. Three times now a page
#  of this suite has shipped dead while Python compiled clean, the build
#  said OK and the file was the right size:
#    * the JS threw on boot
#    * it booted into the "hiccupped" fallback and showed an apology
#    * one bare apostrophe closed a string and NOTHING in that 2.8 MB
#      script block ever parsed
#  All three are the first thing checked on every page.
#
#  Needs Playwright. If it is not installed this says so and stops -
#  it never reports a pass it did not earn.
#
#  Run it:  py TEST_MY_GEAR_NAV.py          (or 73_CHECK_MY_GEAR_NAV)
# =====================================================================

"""Drive the real pages in a real browser and check the bar actually works.

A page that compiles is not a page that works. Three ways a page of this
suite has been broken while Python compiled clean:
  a) the JS throws on boot
  b) it boots into a "hiccup" fallback and shows an apology
  c) the script never parsed at all, so every function is undefined
All three are checked here before anything else is looked at.
"""
import sys, os, json
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
GL = os.path.join(HERE, "Gear_Lookup")

def _chrome():
    """Whatever browser this machine actually has. Playwright's own
    bundled one first, then the paths a Windows laptop keeps Chrome and
    Edge in - the same order browser_engine.py uses."""
    import glob as _g
    pats = [os.environ.get("PLAYWRIGHT_CHROMIUM", ""),
            "/opt/pw-browsers/chromium*/chrome-linux/chrome",
            os.path.expandvars(r"%LOCALAPPDATA%\\ms-playwright\\chromium*"
                               r"\\chrome-win\\chrome.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\\Google\\Chrome"
                               r"\\Application\\chrome.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\\Microsoft"
                               r"\\Edge\\Application\\msedge.exe")]
    for p in pats:
        if not p:
            continue
        for hit in sorted(_g.glob(p)):
            if os.path.isfile(hit):
                return hit
    return None


CHROME = _chrome()

PASS, FAIL = [], []


def check(name, ok, detail=""):
    (PASS if ok else FAIL).append((name, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ("  -  " + str(detail) if detail else ""))


def main(pages):
    print("=" * 62)
    print(" COATES | THE WAY AROUND MY GEAR - back, menu, and where you are")
    print("=" * 62)
    missing = [p for p in pages
               if not os.path.isfile(os.path.join(GL, p + ".html"))]
    if missing:
        print(" These pages are not built yet: " + ", ".join(missing))
        print(" Run 04_RUN_MY_GEAR.bat first, then me.")
        return 1
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=CHROME,
                                args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = br.new_context(viewport={"width": 390, "height": 844},
                             is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console." + m.type + ": " + m.text)
              if m.type == "error" else None)

        for key in pages:
            print("\n=== " + key + ".html")
            del errs[:]
            pg.goto("file://" + os.path.join(GL, key + ".html"),
                    wait_until="load", timeout=90000)
            pg.wait_for_timeout(1200)

            # (a) nothing threw
            check(key + ": boots without a JS error", not errs,
                  "; ".join(errs[:3]) if errs else "clean")

            # (c) the nav script actually parsed
            defined = pg.evaluate(
                "()=>({back:typeof k2Back,menu:typeof k2Menu,"
                "view:typeof k2View,own:typeof k2ViewOwn,home:typeof k2Home})")
            check(key + ": the bar's script parsed",
                  all(v == "function" for v in defined.values()), json.dumps(defined))

            # (c2) AND SO DID THE PAGE'S OWN. This is the one that bites:
            # a single bare apostrophe anywhere in a 2.8 MB script block
            # closes the string it is in and NOTHING in that block runs.
            # Python compiles, the build succeeds, the file is the right
            # size, and the page is dead. It has happened three times.
            # Each page names a function that only exists if its whole
            # block parsed.
            OWNFN = {"index": ["go", "reset", "renderCard", "showWelcome"],
                     "stores": ["nav", "home", "render", "bayLink", "dockOn"],
                     "crew": ["openCo", "search", "draw"],
                     "fleet": ["route", "showFleet", "showList", "hashNow"]}
            own = pg.evaluate(
                "(names)=>{var o={};names.forEach(function(n){"
                "o[n]=typeof window[n]});return o}", OWNFN.get(key, []))
            check(key + ": the PAGE's own script parsed too",
                  own and all(v == "function" for v in own.values()),
                  json.dumps(own))

            # (b) not the hiccup fallback
            txt = pg.inner_text("body")[:4000].lower()
            check(key + ": did not boot into the fallback",
                  "hiccupped" not in txt, "found the hiccup apology"
                  if "hiccupped" in txt else "real page")

            # the bar is there and on screen
            bar = pg.query_selector(".k2bar")
            check(key + ": the bar is on the page", bar is not None)
            if bar:
                box = bar.bounding_box()
                check(key + ": the bar is visible and tall enough",
                      bool(box) and box["height"] >= 44,
                      "%.0fpx tall" % (box["height"] if box else 0))
                # touch targets
                # hidden buttons are not measured - BACK hides itself on
                # the front door, where there is nothing behind it, and a
                # 0x0 hidden button is the right answer there
                sizes = pg.evaluate(
                    "()=>Array.from(document.querySelectorAll('.k2bar button'))"
                    ".filter(b=>!b.hasAttribute('hidden'))"
                    ".map(b=>{var r=b.getBoundingClientRect();"
                    "return {w:Math.round(r.width),h:Math.round(r.height)}})")
                check(key + ": every bar button on screen is a glove-sized target",
                      sizes and all(s["h"] >= 40 and s["w"] >= 40 for s in sizes),
                      json.dumps(sizes))

            # it STAYS on screen when you scroll to the bottom
            pg.evaluate("()=>window.scrollTo(0,document.body.scrollHeight)")
            pg.wait_for_timeout(350)
            still = pg.evaluate(
                "()=>{var b=document.querySelector('.k2bar');if(!b)return null;"
                "var r=b.getBoundingClientRect();return {top:Math.round(r.top),"
                "h:Math.round(r.height)}}")
            check(key + ": the bar is still there at the bottom of the page",
                  bool(still) and still["top"] >= -1 and still["top"] < 60,
                  json.dumps(still))
            pg.evaluate("()=>window.scrollTo(0,0)")

            # the menu opens, names every page, and marks where you are
            pg.click(".k2menu")
            pg.wait_for_timeout(300)
            open_ = pg.evaluate("()=>k2MenuOpen()")
            check(key + ": MENU opens", open_)
            names = pg.evaluate(
                "()=>Array.from(document.querySelectorAll('#k2sheet .k2t b'))"
                ".map(x=>x.textContent.trim())")
            # The WORKER page lists no staff screen at all - that is
            # deliberate (Andrew, 4 Aug: "make sure the main Worker menu
            # does not have access to everything"). Every staff page
            # lists the others.
            PAGENAMES = ("My Gear", "Store Street", "Who’s got what",
                         "Fleet Details")
            listed = [n for n in names if n in PAGENAMES]
            if key == "index":
                check(key + ": the worker menu lists NO staff screen",
                      listed == ["My Gear"], json.dumps(names))
            else:
                check(key + ": the menu lists all four pages",
                      len(listed) == 4, json.dumps(names))
            here = pg.evaluate(
                "()=>{var a=document.querySelector('#k2sheet .k2on .k2t b');"
                "return a?a.textContent.trim():null}")
            check(key + ": the menu says which one you are on", here is not None, here)
            # every destination is a real file
            hrefs = pg.evaluate(
                "()=>Array.from(document.querySelectorAll('#k2sheet a[href]'))"
                ".map(a=>a.getAttribute('href'))")
            missing = [h for h in hrefs
                       if h != "#" and not os.path.isfile(os.path.join(GL, h))]
            check(key + ": every menu destination exists on disk",
                  not missing, "missing: " + ", ".join(missing) if missing
                  else "%d links" % len(hrefs))
            pg.click(".k2close")
            pg.wait_for_timeout(250)
            check(key + ": MENU closes", not pg.evaluate("()=>k2MenuOpen()"))

        # ------------------------------------------------------------
        #  THE JOURNEYS. A bar that renders is not a bar that gets you
        #  anywhere. These are the real walks: in, deeper, back out.
        # ------------------------------------------------------------
        def go(page):
            pg.goto("file://" + os.path.join(GL, page + ".html"),
                    wait_until="load", timeout=90000)
            pg.wait_for_timeout(900)

        print("\n=== JOURNEY: the front door")
        go("index")
        hidden = pg.evaluate(
            "()=>document.getElementById('k2back').hasAttribute('hidden')")
        check("index: BACK hides itself on the front door", hidden,
              "there is nothing behind the front door to go back to")

        print("\n=== JOURNEY: into the board, and back out to My Gear")
        go("index")
        pg.evaluate("()=>k2Leave()")          # the menu tap
        go("stores")
        shown = pg.evaluate(
            "()=>!document.getElementById('k2back').hasAttribute('hidden')")
        check("stores: BACK is there once you have come from somewhere", shown)
        pg.click(".k2back")
        pg.wait_for_timeout(900)
        check("stores: BACK off the board lands on My Gear",
              pg.url.endswith("index.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== JOURNEY: three screens deep on the board and out")
        go("stores")
        pg.evaluate("()=>nav('stock')")
        pg.wait_for_timeout(400)
        title = pg.eval_on_selector("#k2where-t", "e=>e.textContent")
        check("stores: the bar names the screen you opened", bool(title)
              and title.lower() != "store street", title)
        on = pg.evaluate(
            "()=>document.getElementById('p-stock').className.indexOf('on')>=0")
        check("stores: that screen is the one showing", on)
        pg.click(".k2back")
        pg.wait_for_timeout(500)
        check("stores: BACK steps out of the screen, not off the page",
              pg.url.endswith("stores.html")
              and pg.evaluate("()=>document.getElementById('p-home')"
                              ".className.indexOf('on')>=0"),
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))

        print("\n=== JOURNEY: the phone's own Back button")
        go("stores")
        pg.evaluate("()=>nav('groups')")
        pg.wait_for_timeout(400)
        pg.go_back()
        pg.wait_for_timeout(600)
        check("stores: the phone Back button steps back one screen, "
              "it does not leave",
              pg.url.endswith("stores.html")
              and pg.evaluate("()=>document.getElementById('p-home')"
                              ".className.indexOf('on')>=0"),
              pg.url.rsplit("/", 1)[-1])

        print("\n=== JOURNEY: MENU is two taps from anywhere to anywhere")
        go("stores")
        pg.evaluate("()=>nav('print')")
        pg.wait_for_timeout(300)
        pg.click(".k2menu")
        pg.wait_for_timeout(250)
        pg.eval_on_selector(
            "#k2sheet a[href='fleet.html']", "a=>a.click()")
        pg.wait_for_timeout(1500)
        check("MENU: print hub to Fleet Details in two taps",
              pg.url.endswith("fleet.html"), pg.url.rsplit("/", 1)[-1])
        check("fleet: and BACK from there goes to the board it came from",
              pg.evaluate("()=>k2BackTo() && k2BackTo().url") == "stores.html",
              str(pg.evaluate("()=>k2BackTo()")))
        pg.click(".k2back")
        pg.wait_for_timeout(1500)
        check("fleet: BACK actually lands on the board",
              pg.url.endswith("stores.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== JOURNEY: arriving cold, straight off a QR code")
        ctx2 = br.new_context(viewport={"width": 390, "height": 844},
                              is_mobile=True, has_touch=True)
        p2 = ctx2.new_page()
        p2.goto("file://" + os.path.join(GL, "fleet.html"),
                wait_until="load", timeout=90000)
        p2.wait_for_timeout(900)
        check("fleet: BACK still works with no history behind it",
              p2.evaluate("()=>!document.getElementById('k2back')"
                          ".hasAttribute('hidden')")
              and p2.evaluate("()=>k2BackTo().url") == "stores.html",
              "falls back to the board")
        p2.goto("file://" + os.path.join(GL, "crew.html"),
                wait_until="load", timeout=90000)
        p2.wait_for_timeout(700)
        check("crew: reached cold, BACK falls back to My Gear",
              p2.evaluate("()=>k2BackTo().url") == "index.html",
              str(p2.evaluate("()=>k2BackTo()")))
        ctx2.close()

        print("\n=== JOURNEY: a company open on the crew page")
        go("crew")
        opened = pg.evaluate(
            "()=>{var c=(window.__CREW__&&__CREW__.companies||[])[0];"
            "if(!c)return null;openCo(c);return c.company}")
        pg.wait_for_timeout(400)
        check("crew: opening a company names it on the bar",
              opened and pg.eval_on_selector(
                  "#k2where-t", "e=>e.textContent") == opened,
              str(opened))
        pg.click(".k2back")
        pg.wait_for_timeout(600)
        check("crew: BACK closes the company, it does not leave the page",
              pg.url.endswith("crew.html")
              and pg.eval_on_selector("#k2where-t", "e=>e.textContent")
              == "Who’s got what",
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))

        print("\n=== JOURNEY: a fleet open on the fleet page")
        go("fleet")
        v = pg.evaluate(
            "()=>{var k=Object.keys(D.fleets)[0];location.hash=k;return D.fleets[k].n}")
        pg.wait_for_timeout(500)
        check("fleet: opening a fleet names it on the bar",
              pg.eval_on_selector("#k2where-t", "e=>e.textContent") == v, str(v))
        pg.click(".k2back")
        pg.wait_for_timeout(600)
        # clearing the hash leaves a bare "#" on the URL - still the page
        check("fleet: BACK closes the fleet, it does not leave the page",
              pg.url.rsplit("/", 1)[-1].split("#")[0] == "fleet.html"
              and pg.eval_on_selector("#k2where-t", "e=>e.textContent")
              == "Fleet Details",
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))

        print("\n=== JOURNEY: Back must never bounce between two pages")
        go("index")
        pg.evaluate("()=>k2Leave()")
        go("stores")
        pg.click(".k2back")
        pg.wait_for_timeout(1200)
        first = pg.url.rsplit("/", 1)[-1]
        back2 = pg.evaluate("()=>k2BackTo()")
        check("index: after coming back, BACK does not send you "
              "straight back in",
              first == "index.html" and not back2,
              "%s then %s" % (first, back2))

        # ------------------------------------------------------------
        #  WHAT THE NAV AUDIT FOUND. Each of these was a real defect
        #  before 4 Aug 2026 - they stay as tests so they cannot come
        #  back.
        # ------------------------------------------------------------
        print("\n=== THE DOCK (it had not appeared on a single phone)")
        go("stores")
        dock = pg.evaluate(
            "()=>{var d=document.getElementById('sdock');if(!d)return null;"
            "var r=d.getBoundingClientRect();"
            "return {cls:d.className,w:Math.round(r.width),"
            "h:Math.round(r.height)}}")
        check("stores: the bottom dock is actually on the screen",
              bool(dock) and dock["h"] > 20 and dock["w"] > 100,
              json.dumps(dock))
        n = pg.evaluate("()=>document.querySelectorAll('#sdock button').length")
        check("stores: and it carries its five buttons", n == 5, "%d buttons" % n)

        print("\n=== NO DEAD PRESSES OF THE PHONE BACK BUTTON")
        go("index")
        pg.evaluate("()=>k2Leave()")
        go("stores")
        for _ in range(3):
            pg.click(".k2menu"); pg.wait_for_timeout(220)
            pg.click(".k2close"); pg.wait_for_timeout(260)
        pg.go_back()
        pg.wait_for_timeout(1200)
        check("stores: after opening and closing MENU three times, "
              "ONE press of Back leaves the page",
              not pg.url.endswith("stores.html"), pg.url.rsplit("/", 1)[-1])

        go("index")
        pg.evaluate("()=>k2Leave()")
        go("stores")
        pg.evaluate("()=>{nav('find');nav('chase');nav('stock')}")
        pg.wait_for_timeout(400)
        pg.go_back()
        pg.wait_for_timeout(700)
        check("stores: one Back off three panes lands on the board",
              pg.evaluate("()=>document.getElementById('p-home')"
                          ".className.indexOf('on')>=0")
              and pg.url.endswith("stores.html"),
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))
        pg.go_back()
        pg.wait_for_timeout(1200)
        check("stores: and the NEXT Back leaves the board - three panes "
              "left no dead presses behind them",
              not pg.url.endswith("stores.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== A DOOR OUT OF A BAY REMEMBERS THE BOARD")
        go("stores")
        pg.eval_on_selector("a[href='crew.html']", "a=>a.click()")
        pg.wait_for_timeout(1600)
        check("stores -> crew through Bay 01 lands on the crew page",
              pg.url.endswith("crew.html"), pg.url.rsplit("/", 1)[-1])
        check("crew: and BACK from there returns to the BOARD, "
              "not to My Gear",
              pg.evaluate("()=>k2BackTo() && k2BackTo().url") == "stores.html",
              str(pg.evaluate("()=>k2BackTo()")))
        pg.click(".k2back")
        pg.wait_for_timeout(1600)
        check("crew: BACK actually lands on the board",
              pg.url.endswith("stores.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== TWO STICKY BARS MUST NOT SIT ON TOP OF EACH OTHER")
        for key in ("crew", "fleet"):
            go(key)
            pg.evaluate("()=>window.scrollTo(0,600)")
            pg.wait_for_timeout(350)
            boxes = pg.evaluate(
                "()=>{var a=document.querySelector('.k2bar'),"
                "b=document.querySelector('.bar');"
                "if(!a||!b)return null;var ra=a.getBoundingClientRect(),"
                "rb=b.getBoundingClientRect();"
                "return {navTop:Math.round(ra.top),navBot:Math.round(ra.bottom),"
                "titleTop:Math.round(rb.top),titleBot:Math.round(rb.bottom)}}")
            overlap = (boxes and boxes["titleTop"] < boxes["navBot"]
                       and boxes["titleBot"] > boxes["navTop"])
            check(key + ": the orange title does not hide under the nav bar",
                  not overlap, json.dumps(boxes))

        print("\n=== TAPPING A FLEET ACTUALLY OPENS IT")
        go("fleet")
        pg.eval_on_selector("[data-v]", "e=>e.click()")
        pg.wait_for_timeout(800)
        check("fleet: tapping a product opens its detail and STAYS there",
              pg.evaluate("()=>!!document.querySelector('#view [data-back]')"),
              "hash=" + str(pg.evaluate("()=>location.hash"))[:60])
        check("fleet: and the bar names it",
              pg.eval_on_selector("#k2where-t", "e=>e.textContent")
              not in ("Fleet Details", ""),
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))

        print("\n=== THE BAR STAYS OFF THE PRINTED PAGE")
        for key in ("crew", "fleet"):
            go(key)
            pg.emulate_media(media="print")
            pg.wait_for_timeout(250)
            shown = pg.evaluate(
                "()=>{var b=document.querySelector('.k2bar');"
                "return b?getComputedStyle(b).display:'none'}")
            check(key + ": the nav bar is not on the printout",
                  shown == "none", shown)
            pg.emulate_media(media="screen")

        print("\n=== THE WORKER MENU CANNOT REACH THE STAFF SCREENS")
        ctx3 = br.new_context(viewport={"width": 390, "height": 844},
                              is_mobile=True, has_touch=True)
        p3 = ctx3.new_page()
        p3.goto("file://" + os.path.join(GL, "index.html"),
                wait_until="load", timeout=90000)
        p3.wait_for_timeout(1100)
        p3.click(".k2menu"); p3.wait_for_timeout(300)
        shown = p3.evaluate(
            "()=>Array.from(document.querySelectorAll('#k2sheet a[data-k2]'))"
            ".filter(a=>!a.hasAttribute('hidden')).map(a=>a.getAttribute('data-k2'))")
        check("index: no staff screen on the worker menu",
              shown == [], json.dumps(shown))
        # not hidden - NOT IN THE FILE. Nothing to reveal by tapping
        # around, by a stale session, or by anything I did not think of.
        raw = p3.evaluate(
            "()=>document.getElementById('k2sheet').innerHTML")
        for page in ("stores.html", "crew.html", "fleet.html"):
            check("index: %s is not written into the worker menu at all"
                  % page, page not in raw,
                  "found it in the markup" if page in raw else "absent")
        # and having been on the board does not unlock it either
        p3.goto("file://" + os.path.join(GL, "stores.html"),
                wait_until="load", timeout=90000)
        p3.wait_for_timeout(1100)
        p3.evaluate("()=>k2Leave()")
        p3.goto("file://" + os.path.join(GL, "index.html"),
                wait_until="load", timeout=90000)
        p3.wait_for_timeout(1100)
        p3.click(".k2menu"); p3.wait_for_timeout(300)
        shown2 = p3.evaluate(
            "()=>Array.from(document.querySelectorAll('#k2sheet a[data-k2]'))"
            ".map(a=>a.getAttribute('data-k2'))")
        check("index: and a session that HAS been on the board still "
              "cannot see it on the worker menu",
              shown2 == [], json.dumps(shown2))
        # it still has to be worth opening
        guides = p3.evaluate(
            "()=>Array.from(document.querySelectorAll('#k2sheet button.k2go'))"
            ".map(b=>b.querySelector('b').textContent.trim())")
        check("index: the worker menu still carries this page's guides",
              len(guides) >= 4, json.dumps(guides))
        # the supervisor door he asked for on 3 Aug is still on the page
        sup = p3.evaluate(
            "()=>{var a=document.querySelector('a.suplink');"
            "return a?a.getAttribute('href'):null}")
        check("index: the Supervisor link is still on the landing page",
              sup == "crew.html", str(sup))
        ctx3.close()

        print("\n=== A GUIDE CLOSED WITH ITS OWN BUTTON LEAVES NO DEAD PRESS")
        go("index")
        pg.evaluate("()=>k2Leave()")
        go("stores")
        go("index")
        for _ in range(3):
            pg.evaluate("()=>openGuide('contacts')")
            pg.wait_for_timeout(320)
            pg.evaluate("()=>closeGuide()")
            pg.wait_for_timeout(320)
        pg.go_back()
        pg.wait_for_timeout(1300)
        check("index: after three guides opened and closed, ONE Back "
              "leaves the page",
              not pg.url.endswith("index.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== MENU CAN GET YOU BACK TO THE BOARD")
        go("stores")
        pg.evaluate("()=>nav('print')")
        pg.wait_for_timeout(400)
        pg.click(".k2menu"); pg.wait_for_timeout(320)
        row = pg.evaluate(
            "()=>({sub:document.getElementById('k2here-s').textContent,"
            "chev:document.getElementById('k2here-c').textContent})")
        check("stores: standing inside a pane, the top row does NOT claim "
              "you are on the board",
              "YOU ARE HERE" not in row["chev"]
              and "You are in" in row["sub"], json.dumps(row))
        pg.eval_on_selector("#k2here", "a=>a.click()")
        pg.wait_for_timeout(900)
        check("stores: and tapping it brings you back to the board",
              pg.evaluate("()=>document.getElementById('p-home')"
                          ".className.indexOf('on')>=0")
              and not pg.evaluate("()=>k2MenuOpen()"),
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))
        pg.go_back()
        pg.wait_for_timeout(1300)
        check("stores: and that left no dead press behind it",
              not pg.url.endswith("stores.html"), pg.url.rsplit("/", 1)[-1])

        go("stores")
        pg.click(".k2menu"); pg.wait_for_timeout(320)
        row2 = pg.evaluate(
            "()=>document.getElementById('k2here-c').textContent")
        check("stores: standing ON the board, it says YOU ARE HERE",
              "YOU ARE HERE" in row2, row2)
        pg.click(".k2close"); pg.wait_for_timeout(250)

        print("\n=== BACK ON THE CREW PAGE KEEPS THE LIST YOU SEARCHED")
        go("crew")
        n_before = pg.evaluate(
            "()=>{var q=document.getElementById('q');q.value='c';"
            "search();return document.querySelectorAll('#list .hit').length}")
        pg.wait_for_timeout(300)
        if n_before and n_before > 1:
            pg.eval_on_selector("#list .hit", "e=>e.click()")
            pg.wait_for_timeout(500)
            pg.click(".k2back")
            pg.wait_for_timeout(600)
            n_after = pg.evaluate(
                "()=>document.querySelectorAll('#list .hit').length")
            q = pg.evaluate("()=>document.getElementById('q').value")
            check("crew: BACK out of a company returns the SAME list, "
                  "not an empty box",
                  n_after == n_before and q == "c",
                  "%d hits -> %d hits, box=%r" % (n_before, n_after, q))
        else:
            check("crew: BACK out of a company returns the same list",
                  False, "could not set up a multi-company search")

        print("\n=== TAP A GEAR LINE AND FIND OUT WHAT IT IS")
        go("crew")
        co = pg.evaluate(
            "()=>{var c=(window.__CREW__&&__CREW__.companies||[])[0];"
            "if(!c)return null;openCo(c);return c.company}")
        pg.wait_for_timeout(500)
        rows = pg.evaluate("()=>document.querySelectorAll('tr.gl').length")
        check("crew: every gear line is a tap target", rows > 0,
              "%s, %d lines" % (co, rows))
        pg.eval_on_selector("tr.gl", "e=>e.click()")
        pg.wait_for_timeout(600)
        check("crew: tapping one opens its card", pg.evaluate("()=>k2DetOpen()"))
        card = pg.eval_on_selector("#k2det-b", "e=>e.innerText")
        check("crew: the card names the item number and who has it",
              "ITEM NUMBER" in card.upper() and "WHO HAS IT" in card.upper(),
              card.replace("\n", " / ")[:100])
        check("crew: NO money on the card while the code is locked",
              "$" not in card and "/day" not in card,
              "clean" if "$" not in card else card)
        pg.click(".k2back")
        pg.wait_for_timeout(600)
        check("crew: BACK closes the card and leaves you on the list",
              not pg.evaluate("()=>k2DetOpen()")
              and pg.url.rsplit("/", 1)[-1].split("#")[0] == "crew.html"
              and pg.evaluate("()=>document.querySelectorAll('tr.gl').length") > 0)
        pg.go_back()
        pg.wait_for_timeout(1000)
        check("crew: the next Back closes the company, one layer at a time",
              pg.url.rsplit("/", 1)[-1].split("#")[0] == "crew.html"
              and pg.eval_on_selector("#k2where-t", "e=>e.textContent")
              == "Who\u2019s got what",
              pg.eval_on_selector("#k2where-t", "e=>e.textContent"))
        pg.go_back()
        pg.wait_for_timeout(1200)
        check("crew: and the one after that leaves - no dead presses",
              not pg.url.endswith("crew.html"), pg.url.rsplit("/", 1)[-1])

        print("\n=== FIND ONE ASSET BY ITS NUMBER")
        go("fleet")
        smp = pg.evaluate(
            "()=>{var k=Object.keys(D.fleets);"
            "for(var a=0;a<k.length;a++){var f=D.fleets[k[a]];"
            "if(f.rows&&f.rows.length>10){var r=f.rows[8];"
            "return {i:r.i,bc:r.bc||r.i,n:f.n,rank:r.r};}}return null}")
        if not smp:
            check("fleet: find an asset by its number", False, "no sample")
        else:
            for label, q in (("its asset number", smp["i"]),
                             ("the barcode off the sticker", smp["bc"])):
                n = pg.evaluate("(q)=>findAssets(q).length", q)
                check("fleet: %s finds exactly one asset" % label, n == 1,
                      "%r -> %d" % (q, n))
            check("fleet: two characters does not drag the store back",
                  pg.evaluate("()=>findAssets('12').length") == 0,
                  "%d hits for '12'" % pg.evaluate("()=>findAssets('12').length"))
            pg.fill("#q", smp["bc"])
            pg.wait_for_timeout(700)
            check("fleet: the results say an asset was found",
                  "asset" in pg.eval_on_selector(
                      "#view", "e=>e.innerText.slice(0,120)").lower(),
                  pg.eval_on_selector("#view", "e=>e.innerText.split('\\n')[0]"))
            pg.eval_on_selector("[data-ai]", "e=>e.click()")
            pg.wait_for_timeout(1300)
            found = pg.evaluate(
                "()=>{var x=document.querySelector('.asset.found');"
                "return x?x.querySelector('b').textContent:null}")
            check("fleet: tapping it opens its fleet and walks to THAT asset",
                  found == smp["i"], "%s (wanted %s)" % (found, smp["i"]))
            check("fleet: and it is on screen, not somewhere below",
                  pg.evaluate(
                      "()=>{var x=document.querySelector('.asset.found');"
                      "if(!x)return false;var r=x.getBoundingClientRect();"
                      "return r.top>0&&r.top<window.innerHeight}"))

        br.close()

    print("\n" + "=" * 62)
    print(" %d passed, %d failed" % (len(PASS), len(FAIL)))
    print("=" * 62)
    if not FAIL:
        print("")
        print(" Every page opens, the bar is on all four, BACK is never a")
        print(" dead button and MENU gets you anywhere in two taps.")
        return 0
    for n, d in FAIL:
        print("  FAILED: " + n + ("  -  " + str(d) if d else ""))
    print("")
    print(" Fix these before the phones see it.")
    return 1


if __name__ == "__main__":
    try:
        from playwright.sync_api import sync_playwright as _p   # noqa: F401
    except Exception:
        print(" Playwright is not on this machine, so the pages cannot be")
        print(" opened and walked. Nothing was checked - and this will not")
        print(" say the nav is fine when it has not looked at it.")
        print(" Install it with:  py -m pip install playwright")
        sys.exit(2)
    if not CHROME:
        print(" No Chromium, Chrome or Edge found to open the pages with.")
        print(" Nothing was checked.")
        sys.exit(2)
    sys.exit(main(sys.argv[1:] or ["index", "stores", "crew", "fleet"]))
