#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | EMAIL IMAGES - the report, pasted straight into the email
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Every report kit uses this module to put the ACTUAL report into the
#  email body as clear, full-width images, in order - the same look as
#  the Cost Tracking Snapshot email. How it works:
#
#    1. The report's own HTML is re-rendered in page-height slices
#       (the whole document shifted up one page at a time inside a
#       fixed window) and each slice is screenshotted by the same
#       headless Edge/Chrome that makes the PDFs.
#    2. Slices stack seamlessly in the email (no gaps), so a row cut
#       at a slice edge joins back together perfectly - the reader
#       just sees one continuous report.
#    3. Capture stops automatically after the report's real content
#       ends (a blank slice is a few KB; content is tens of KB - two
#       blanks in a row means we're past the end).
#    4. No browser on the machine? The caller falls back to its old
#       email body - the kit never fails over this.
#
#  Offline-only, stdlib-only: no Pillow, no pip installs, no internet.
# =====================================================================

import os
import shutil
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))

# Below this size a rendered page is blank, not content. Re-measured
# 25 Jul 2026 on the current 2x A4 pipeline: a blank sheet is about
# 15 KB (it used to be a dark 2-8 KB before the background went white),
# while a real page of tables is 250 KB+. 12,000 was under the blank
# size, so "this page failed to render" never fired.
BLANK_BYTES = 60000

#  Safety cap only. The real stop is the page count read off the document
#  itself (see page_count) - this is just the backstop for a document
#  that doesn't paginate. Raised from 16 on 25 Jul 2026: DGH's on-hire
#  report is 22 pages, and an email that stops at 16 looks complete.
MAX_SLICES = 40


def _tmp_dir():
    """Somewhere to put browser profiles. TEMP is a Windows variable -
    on anything else it was dropping profile folders into the kit."""
    import tempfile
    return os.environ.get("TEMP") or tempfile.gettempdir()


_PROF_N = [0]


def _fresh_profile(tag):
    """A browser profile folder used ONCE and thrown away.

    THIS COST US THE WHOLE MORNING RUN. The captures shared one profile
    folder (coates_email_img) - the PDF side learned long ago that a
    shared profile makes headless Edge misbehave, but the email images
    kept sharing. When one capture was killed or timed out, Edge's child
    processes lived on holding the profile lock, and EVERY capture after
    that sat its full timeout doing nothing: three attempts a page, page
    after page, company after company. From the outside the kit was
    frozen. One folder per launch = nothing to hold, nothing to poison.
    Found 26 Jul 2026, the morning the activity packs never came."""
    _PROF_N[0] += 1
    return os.path.join(_tmp_dir(), "coates_email_prof_{}_{}".format(
        os.getpid(), _PROF_N[0]))


def _run_browser(argv, timeout, text=False):
    """One headless browser call that can NEVER leave children behind.

    subprocess.run(timeout=...) kills only the process it started; the
    browser's own children survive, keep the pipes open and keep the
    profile locked. Kill the whole tree instead - taskkill /T on
    Windows, the process group everywhere else. Returns stdout ('' if
    none), or None if the call timed out."""
    kw = {"stdout": subprocess.PIPE, "stderr": subprocess.PIPE}
    if text:
        #  Browser DOM dumps are UTF-8; without saying so, Windows decodes
        #  them as cp1252 and the reader thread dies on the first fancy
        #  byte (seen 27 Jul 2026 in Andrew's morning run). errors=
        #  'replace' means a weird byte can never kill a capture again.
        kw["universal_newlines"] = True
        kw["encoding"] = "utf-8"
        kw["errors"] = "replace"
    if os.name != "nt":
        kw["start_new_session"] = True
    p = subprocess.Popen(argv, **kw)
    try:
        out, _ = p.communicate(timeout=timeout)
        return out if out is not None else ("" if text else b"")
    except subprocess.TimeoutExpired:
        if os.name == "nt":
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(p.pid)],
                           capture_output=True)
        else:
            import signal
            try:
                os.killpg(p.pid, signal.SIGKILL)
            except OSError:
                p.kill()
        try:
            p.communicate(timeout=10)
        except Exception:
            pass
        return None
    finally:
        # The one-shot profile folder goes with the call that used it.
        for a in argv:
            if a.startswith("--user-data-dir="):
                shutil.rmtree(a.split("=", 1)[1], ignore_errors=True)
                break


def page_count(browser, html_path):
    """How many pages this report actually has - asked of the document
    instead of guessed from file sizes. The paginator writes 'Page 3 of
    17' onto every sheet, so the total is there to be read once the
    layout has run. Returns 0 if it can't be read, and the old
    blank-page / repeat-frame checks carry on as the backstop."""
    try:
        out = _run_browser([browser, "--headless", "--disable-gpu",
                            "--no-first-run", "--hide-scrollbars"] + _extra() +
                           ["--user-data-dir=" + _fresh_profile("pagecount"),
                            "--virtual-time-budget=8000", "--dump-dom",
                            "file:///" + os.path.abspath(html_path).replace("\\", "/")],
                           timeout=60, text=True)
        import re as _re
        hits = [int(n) for n in
                _re.findall(r"(?i)page\s+\d+\s+of\s+(\d+)", out or "")]
        return max(hits) if hits else 0
    except Exception:
        return 0


def find_browser():
    """Headless-capable Edge/Chrome as shipped on a Coates PC. One list
    for the whole kit (browser_engine.py) so if the PDFs work, the email
    images work - they can no longer disagree about what's installed."""
    try:
        import browser_engine
        return browser_engine.find_browser()
    except Exception:
        pass
    return next((p for p in [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        shutil.which("msedge"), shutil.which("microsoft-edge"),
        shutil.which("google-chrome"), shutil.which("chrome"),
        shutil.which("chromium"), shutil.which("chromium-browser"),
    ] if p and os.path.isfile(p)), None)


def _extra():
    try:
        import browser_engine
        return browser_engine.extra_args()
    except Exception:
        return [] if os.name == "nt" else ["--no-sandbox"]


_RESERVED = []           # measured once per run


def reserved_height(browser):
    """How much of --window-size headless Chrome/Edge keeps for itself.

    THIS COST US THE BOTTOM OF EVERY EMAILED PAGE. Ask for a 1123px
    window and the page only gets 1036px - the browser reserves the rest
    for window furniture that headless never draws. The last 87px of
    every A4 sheet was being cut off, which is exactly where the 'your
    Coates tool store team' strip sits. Found 25 Jul 2026 by measuring
    it instead of assuming it.

    So we measure it, on this machine, with this browser, once a run.
    If the probe can't run we assume a generous 120px - too much only
    costs a little white space; too little cuts the page."""
    if _RESERVED:
        return _RESERVED[0]
    pad = 120
    probe = os.path.join(_tmp_dir(), "coates_vp_probe.html")
    try:
        with open(probe, "w", encoding="utf-8") as fh:
            fh.write("<!DOCTYPE html><html><body style='margin:0'>"
                     "<i id=o></i><script>document.getElementById('o')"
                     ".textContent='VP:'+window.innerHeight;</script>"
                     "</body></html>")
        out = _run_browser([browser, "--headless", "--disable-gpu",
                            "--no-first-run", "--hide-scrollbars"] + _extra() +
                           ["--user-data-dir=" + _fresh_profile("vp"),
                            "--window-size=794,1123", "--dump-dom",
                            "file:///" + probe.replace("\\", "/")],
                           timeout=60, text=True)
        for token in (out or "").split("VP:")[1:]:
            digits = ""
            for ch in token:
                if ch.isdigit():
                    digits += ch
                else:
                    break
            if digits:
                pad = max(0, 1123 - int(digits))
                break
    except Exception:
        pass
    finally:
        try:
            os.remove(probe)
        except OSError:
            pass
    _RESERVED.append(pad)
    return pad


def _white_backed(src_html):
    """The report, re-framed for an email body.

    On paper each page is an A4 sheet with a white margin round a dark
    panel. In an email the pages are stacked into one continuous report
    inside one Coates border, so those white margins would show as gaps
    between every page and a white ring inside the border.

    So for the email capture only - never for the PDF - the panel fills
    the page, and THE ORANGE BORDER IS BAKED INTO THE PICTURES THEMSELVES:
    sides on every page, the heavier rounded top on the first, the
    rounded bottom on the last. Stacked in the email they join into one
    continuous report inside one border - snug, no gaps, and it cannot
    break because no mail client is asked to draw anything.

    The corner cut-outs on the first and last page show the sheet's
    white, which matches the email's white. Everything else outside the
    panel is painted the report's own dark, so the strip the browser
    reserves below each capture disappears against the next page.
    (A. Fisher, 25 Jul 2026)"""
    override = ("<style>"
                "html,body{background:#0E1116 !important}"
                ".psheet{padding:0 !important;background:#ffffff !important;"
                "height:1123px !important}"
                ".ppanel{height:100% !important;border-radius:0 !important;"
                "border-top:0 !important;border-bottom:0 !important}"
                ".psheet:first-of-type .ppanel{"
                "border-top:9px solid #F26222 !important;"
                "border-radius:18px 18px 0 0 !important}"
                ".psheet:last-of-type .ppanel{"
                "border-bottom:6px solid #F26222 !important;"
                "border-radius:0 0 18px 18px !important}"
                "</style>")
    if "</head>" in src_html:
        return src_html.replace("</head>", override + "</head>", 1)
    return override + src_html


def _pillow():
    try:
        from PIL import Image  # noqa: F401
        return True
    except Exception:
        return False


def capture_scale():
    """How sharp the page pictures are taken.

    3x with Pillow, 2x without. The blur A. Fisher called out (25 Jul
    2026) had two causes: pictures taken at 794px were being shown at
    800px, so every pixel was fractionally stretched; and phones draw at
    3x, so a 2x picture gets scaled UP on the screen most people read
    these on. 3x captures are pin-sharp on a phone - but they are ~2.2x
    the bytes, so they only go with Pillow's palette compression (below),
    which brings a page back to roughly half its old size. No Pillow, no
    3x - the email must stay small enough to send."""
    return 3 if _pillow() else 2


def _crop(png, width, height):
    """Trim the picture back to one A4 sheet, if this machine has Pillow.
    Without it the extra is dark like the report, so nothing breaks."""
    try:
        from PIL import Image
    except Exception:
        return False
    try:
        im = Image.open(png)
        if im.size[1] <= height:
            return False
        im.crop((0, 0, min(width, im.size[0]), height)).save(png)
        return True
    except Exception:
        return False


def _shrink(png):
    """Palette-compress a page picture. The reports are flat colour and
    text - 256 colours reproduce them exactly to the eye and cut the
    file roughly in half, which is what pays for the 3x sharpness."""
    try:
        from PIL import Image
    except Exception:
        return False
    try:
        im = Image.open(png).convert("RGB")
        im.quantize(colors=256, dither=Image.Dither.NONE).save(
            png, optimize=True)
        return True
    except Exception:
        return False


def slice_doc(src_html, offset_px, width, slice_h, bg="#0E1116"):
    """Return the report HTML re-framed to show one page-height window,
    starting offset_px down the document. The body itself is shifted, so
    every stylesheet in the report still applies exactly as designed."""
    override = ("<style>"
                "html{{height:{h}px;overflow:hidden;background:{bg}}}"
                "body{{margin:0 !important;width:{w}px;position:absolute;"
                "left:0;top:-{off}px}}"
                "</style>").format(h=slice_h, w=width, off=offset_px, bg=bg)
    if "</head>" in src_html:
        return src_html.replace("</head>", override + "</head>", 1)
    return override + src_html


def capture_report_images(html_path, outdir, prefix, width=794, page_h=1123,
                          bg="#0E1116", max_pages=MAX_SLICES):
    """Photograph the report PAGE BY PAGE - never sliced. The report is a
    paginating document (see report_pages.py): opening it with #page=3
    shows ONLY page 3, laid out whole. Each page is captured as its own
    PNG, in order. Returns the PNG paths, or [] if no browser is here
    (caller then keeps its old email body). A page request past the end
    of the report renders bare background (a few KB) - that's the stop
    signal; the repeat check is the belt to that brace.

    The window we ask for is TALLER than the sheet by whatever this
    browser reserves for itself (see reserved_height) - otherwise the
    foot of every page, team strip and all, never makes it into the
    picture."""
    browser = find_browser()
    if not browser:
        return []
    if not os.path.isfile(html_path):
        return []
    #  A copy of the report laid out for the email - see _white_backed.
    shot_path = html_path
    tmp_copy = None
    try:
        with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
            src = f.read()
        tmp_copy = os.path.join(outdir, "_{}_shot.html".format(prefix))
        with open(tmp_copy, "w", encoding="utf-8") as f:
            f.write(_white_backed(src))
        shot_path = tmp_copy
    except Exception:
        tmp_copy = None

    #  Ask the report how many pages it has - OF THE COPY WE ARE ABOUT TO
    #  PHOTOGRAPH, not the printed one. They are different documents: the
    #  email layout gives each page the full sheet, so DGH is 21 pages in
    #  an email and 24 on paper. Counting one and capturing the other had
    #  every long report reported short. (A. Fisher, 25 Jul 2026)
    real_pages = page_count(browser, shot_path)
    if real_pages:
        max_pages = min(max_pages, real_pages)

    win_h = page_h + reserved_height(browser)
    base_url = "file:///" + os.path.abspath(shot_path).replace("\\", "/")
    scale = capture_scale()
    #  Blank-page size depends on how the picture is made: a blank dark
    #  sheet is ~15 KB raw at 2x, ~4 KB palette-compressed at 3x. A real
    #  page of content is 100 KB+ either way. Measured 25 Jul 2026.
    blank_limit = 12000 if scale == 3 else BLANK_BYTES
    kept = []
    prev_sig = None
    for i in range(1, max_pages + 1):
        png = os.path.join(outdir, "{}_Email{}.png".format(prefix, i))
        #  A long report takes longer to lay out, and one page failing to
        #  come back used to end the capture - so a 24-page report went out
        #  as 21 pages and looked complete. Try again, with more time,
        #  before believing it. (A. Fisher, 25 Jul 2026)
        for attempt in (0, 1, 2):
            try:
                os.remove(png)
            except OSError:
                pass
            try:
                _run_browser([browser, "--headless", "--disable-gpu",
                              "--no-first-run", "--hide-scrollbars",
                              "--force-device-scale-factor={}".format(scale),
                              "--virtual-time-budget={}".format(
                                  5000 + attempt * 7000)] + _extra() + [
                              "--user-data-dir=" + _fresh_profile("img"),
                              "--window-size={},{}".format(width, win_h),
                              "--screenshot=" + os.path.abspath(png),
                              base_url + "#page={}".format(i)],
                             timeout=60)
            except Exception:
                pass
            if os.path.isfile(png) and os.path.getsize(png) > 0:
                break
        if not (os.path.isfile(png) and os.path.getsize(png) > 0):
            if real_pages and i < real_pages:
                #  Not the end - this page would not draw. Say so and keep
                #  going, so the gap is visible rather than the report
                #  quietly finishing early.
                print("  ! page {} of {} would not render - the email is "
                      "short and will be held.".format(i, real_pages))
                continue
            break
        _crop(png, width * scale, page_h * scale)
        _shrink(png)
        with open(png, "rb") as f:
            sig = f.read()
        if len(sig) < blank_limit:
            #  A blank page. Past the end if we knew where the end was;
            #  a page that failed to render if we didn't get that far.
            #  Either way it never goes in an email.
            os.remove(png)
            if real_pages and i <= real_pages:
                print("  ! page {} of this report came back blank - it was "
                      "not put in the email.".format(i))
            break
        if not real_pages and prev_sig is not None and sig == prev_sig:
            #  Identical frames mean the document isn't paged, so this one
            #  is a repeat of the page we already have. Drop the repeat and
            #  stop - the page we kept is good and stays kept. (It used to
            #  throw that one away too, silently losing a real page.)
            os.remove(png)
            break
        prev_sig = sig
        kept.append(png)
    if tmp_copy:
        try:
            os.remove(tmp_copy)
        except OSError:
            pass

    #  Nothing captured at all? Then this run knows nothing, and it must
    #  not destroy what an earlier run of the same day got right. Leave
    #  the pictures and the count exactly as they are.
    if kept:
        #  Anything left over from a longer earlier run would be appended
        #  to today's email as if it belonged - clear it out. The prefix
        #  carries the date, so this can only ever match this report's
        #  own pages.
        import glob as _glob
        import re as _re
        for old in _glob.glob(os.path.join(outdir,
                                           "{}_Email*.png".format(prefix))):
            m = _re.search(r"_Email(\d+)\.png$", old)
            if m and int(m.group(1)) > len(kept):
                try:
                    os.remove(old)
                except OSError:
                    pass

        #  How many pages this report HAS, written down beside the
        #  pictures, so anything building an email from them can prove it
        #  is sending the whole report and not the first few pages of it.
        try:
            with open(os.path.join(outdir, "{}_Email.pages".format(prefix)),
                      "w", encoding="utf-8") as fh:
                fh.write("{}\n{}\n".format(real_pages or len(kept), len(kept)))
        except Exception:
            pass
    if real_pages and len(kept) < real_pages:
        print("  ! Only {} of this report's {} pages made it into the email "
              "body. Do not send it as the report - the PDF has the "
              "lot.".format(len(kept), real_pages))
    elif not real_pages and len(kept) == max_pages:
        print("  NOTE: report longer than {} email pages - the email shows "
              "the first {}; the attached PDF has the lot.".format(max_pages, max_pages))
    return kept


# ---------------------------------------------------------------------
#  THE FRAME - one Coates border around the whole report, every email
# ---------------------------------------------------------------------
#  A. Fisher, 25 Jul 2026: every report pasted into an email body is to
#  sit inside ONE clean orange border - header through to the values
#  line - not a border per page and not a border inside a border.
FRAME_COLOUR = "#F26222"
FRAME_SIDE = 6            # px, all edges
FRAME_TOP = 9             # px, the top edge carries a little more weight
FRAME_RADIUS = 18         # px, smooth corners
FRAME_PAD = 0             # px - the border sits straight on the report
FRAME_MARGIN = 14         # px, clean white space outside the border
FRAME_SHADOW = "0 6px 22px rgba(242, 98, 34, 0.12)"


def frame_html(inner, width=794, title="", before="", after="",
               draw_border=True):
    """The report, inside one Coates border.

    Built as tables with inline styles, because an email body is not a
    web page - Outlook renders it through Word. What that means here:

      * The border is on a TD, which Word honours. Every reader sees a
        solid orange frame around the whole report.
      * Rounded corners and the soft shadow are CSS3. Outlook on Windows
        ignores them and shows clean square corners; everywhere else -
        Outlook on Mac, iPhone, Android, the web app, Gmail, Apple Mail -
        renders them as drawn. Nothing breaks either way.
      * The frame is a table around the content, so it GROWS with the
        report. There is no fixed height anywhere in it.

    `inner` is whatever goes inside: the stacked page pictures, or a
    rebuilt Outlook-safe report. One frame, wherever it comes from."""
    outer = width + (FRAME_PAD * 2) + (FRAME_SIDE * 2)
    return (
        "<html><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "{ttl}</head>"
        "<body style='margin:0;padding:0;background:#ffffff;'>"
        "<table role='presentation' width='100%' cellpadding='0' "
        "cellspacing='0' border='0' style='background:#ffffff;'>"
        #  the clean white space outside the border
        "<tr><td align='center' style='padding:{marg}px;background:#ffffff;'>"
        "<table role='presentation' cellpadding='0' cellspacing='0' "
        "border='0' width='{outer}' style='width:100%;max-width:{outer}px;'>"
        #  what you say before the report
        "{before}"
        #  the border itself, and the breathing room inside it. When the
        #  border is already BAKED INTO the page pictures (see
        #  _white_backed) this td draws nothing - asking a mail client to
        #  draw a second border around a bordered picture is how you get
        #  double lines and corner gaps.
        "<tr><td style='{edge}'>"
        "{inner}"
        "</td></tr>"
        #  and after it
        "{after}"
        "</table></td></tr></table></body></html>"
    ).format(ttl=("<title>" + title + "</title>") if title else "",
             marg=FRAME_MARGIN, outer=outer, side=FRAME_SIDE, top=FRAME_TOP,
             col=FRAME_COLOUR, rad=FRAME_RADIUS, shadow=FRAME_SHADOW,
             pad=FRAME_PAD, inner=inner,
             edge=("background:#ffffff;border:{side}px solid {col};"
                   "border-top:{top}px solid {col};border-radius:{rad}px;"
                   "box-shadow:{shadow};padding:{pad}px;".format(
                       side=FRAME_SIDE, col=FRAME_COLOUR, top=FRAME_TOP,
                       rad=FRAME_RADIUS, shadow=FRAME_SHADOW, pad=FRAME_PAD)
                   if draw_border else
                   "background:#ffffff;padding:0;font-size:0;line-height:0;"
                   "border-radius:{rad}px;box-shadow:{shadow};".format(
                       rad=FRAME_RADIUS, shadow=FRAME_SHADOW)),
             before=("<tr><td style='padding:0 2px 4px'>" + before + "</td></tr>")
             if before else "",
             after=("<tr><td style='padding:4px 2px 0'>" + after + "</td></tr>")
             if after else "")


def unframe_document(html):
    """Pull the contents out of a finished <body> so an email body built
    somewhere else can go inside the same one frame - rather than end up
    with a frame inside a frame."""
    import re as _re
    m = _re.search(r"<body[^>]*>(.*)</body>", html or "", _re.S | _re.I)
    return m.group(1) if m else (html or "")


#  The words around the report. A. Fisher, 25 Jul 2026: an email is a
#  message, not a wall of report - it opens by saying hello and closes
#  by signing off, the same as any note you'd send a contractor.
def letter(inner, greeting="", lead=(), signoff=(), width=794,
           draw_border=True):
    """The report inside its border, with a greeting above and a sign-off
    below. Plain text, plain typeface - it should read like it was
    typed, because the report underneath does the talking."""
    txt = ("font-family:Segoe UI,Calibri,Arial,sans-serif;font-size:11.5pt;"
           "color:#1B1F24;line-height:1.55")
    top = ""
    if greeting:
        top += "<p style=\"{s};margin:0 0 14px\">{g}</p>".format(
            s=txt, g=greeting)
    for line in lead:
        top += "<p style=\"{s};margin:0 0 14px\">{l}</p>".format(s=txt, l=line)
    bottom = ""
    if signoff:
        bottom = "<p style=\"{s};margin:16px 0 0\">{b}</p>".format(
            s=txt, b="<br>".join(signoff))
    return frame_html(inner, width=width, before=top, after=bottom,
                      draw_border=draw_border)


def images_stack(cids, width=794):
    """Just the page pictures, butted together. 794 is the pictures own
    logical width - shown at exactly that, every capture pixel maps
    cleanly onto the screen. They were shown at 800 for a while, which
    stretched every pixel fractionally: that is the blur A. Fisher
    called out on 25 Jul 2026."""
    imgs = "".join(
        "<img src='cid:{c}' width='{w}' style='width:100%;max-width:{w}px;"
        "display:block;margin:0 auto;border:0;outline:none;"
        "text-decoration:none;'>".format(c=c, w=width) for c in cids)
    return ("<table role='presentation' width='100%' cellpadding='0' "
            "cellspacing='0' border='0' style='width:100%;'>"
            "<tr><td style='padding:0;font-size:0;line-height:0;'>{imgs}"
            "</td></tr></table>").format(imgs=imgs)


def images_body(cids, width=794, baked=True):
    """The report pasted into the email body. Report-page captures carry
    the orange border IN the pictures (see _white_backed), so the wrap
    adds only the white breathing room round the outside; pictures from
    any other pipeline still get the CSS border drawn for them."""
    return frame_html(images_stack(cids, width=width), width=width,
                      draw_border=not baked)


def _addr_list(s):
    """One header-safe address list, however it was typed."""
    import re as _re
    out = []
    for part in _re.split(r"[;,\r\n\t]+", str(s or "")):
        p = part.strip()
        m = _re.search(r"<([^<>@\s]+@[^<>@\s]+)>", p)
        if m:
            p = m.group(1)
        if p and "@" in p and " " not in p and p not in out:
            out.append(p)
    return ", ".join(out)


def build_image_eml(subject, png_paths, width=794,
                    sender="Andrew Fisher", to="", cc="", baked=True):
    """The report pasted INTO the email body - each page an inline image,
    in order, right where you type. Built EXACTLY like the proven Cost
    Tracking Snapshot email (same structure, byte for byte): a plain
    multipart/alternative with the images related to the HTML body, and
    NOTHING on the paperclip - no PDF attachment, no X-Unsent header, no
    mixed wrapper. Those extras are what made Outlook shove the pages
    onto the attachment strip instead of the body (fixed 24 Jul 2026 -
    don't add attachments back here). The PDF print copy still lands in
    the day's Reports folder for anyone who wants it.
    to/cc come pre-filled from the recipients book (see recipients.py)."""
    import email.message
    import email.policy
    m = email.message.EmailMessage(policy=email.policy.SMTP)  # CRLF lines -
    m["Subject"] = subject                # Outlook's parser wants them
    m["From"] = sender
    #  Commas between addresses. A semicolon list is what you type into
    #  Outlook's To box, but inside the file itself a strict mail server
    #  reads it as ONE malformed address and only the first person gets
    #  the report. (25 Jul 2026)
    m["To"] = _addr_list(to)
    if cc:
        m["Cc"] = _addr_list(cc)
    m.set_content("This report is best viewed in HTML. The {}-page report "
                  "is in the message body.".format(len(png_paths)))
    cids = ["pg{}".format(i) for i in range(1, len(png_paths) + 1)]
    m.add_alternative(images_body(cids, width=width, baked=baked),
                      subtype="html")
    html_part = m.get_payload()[-1]
    for cid, png in zip(cids, png_paths):
        with open(png, "rb") as f:
            data = f.read()
        # disposition inline and NO filename - a filename makes Outlook
        # list the page images on the attachment strip
        html_part.add_related(data, "image", "png", cid="<{}>".format(cid),
                              disposition="inline")
    return m


def save_eml(msg, path):
    """Write an .eml with proper CRLF line endings, byte-exact on any OS
    (text mode on Windows would double the carriage returns)."""
    with open(path, "wb") as f:
        f.write(msg.as_bytes())


def write_manifest(eml_path, subject, body_html, images, company="", report="",
                   attachments=()):
    """The .draft.json sidecar next to an .eml so MAKE_OUTLOOK_DRAFTS can
    build the same email as a NATIVE Outlook draft - the reliable way to
    get the pages INTO the compose body on every Outlook."""
    import json
    stem = eml_path[:-4] if eml_path.lower().endswith(".eml") else eml_path
    body_path = stem + ".body.html"
    with open(body_path, "w", encoding="utf-8") as f:
        f.write(body_html)
    payload = {"subject": subject, "company": company, "report": report,
               "body": os.path.basename(body_path),
               "attachments": [os.path.relpath(a, os.path.dirname(eml_path))
                               for a in attachments if a]}
    if images:
        payload["images"] = manifest_images(images)
    with open(stem + ".draft.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1)


def make_native_drafts(base_dir):
    """Finish a report run by building NATIVE Outlook drafts for today's
    reports - the pages pasted straight into the compose body, addressed
    from the recipients book, sitting in the Drafts folder ready to send.
    Runs MAKE_OUTLOOK_DRAFTS.ps1 (classic Outlook via COM). On a machine
    without Outlook it says so plainly and the .eml files remain."""
    #  OUTLOOK OFF SWITCH (Andrew, 27 Jul 2026): on a machine where
    #  Outlook is locked to a work account - or not set up at all - the
    #  native-draft step is just noise. Drop a file called NO_OUTLOOK.txt
    #  in this folder (26_OUTLOOK_DRAFTS_OFF.bat does it) and the suite
    #  stops trying. The .eml files are still written either way, so
    #  nothing is lost: double-click one to open and send it.
    if os.path.isfile(os.path.join(base_dir, "NO_OUTLOOK.txt")):
        print(" Outlook drafts: OFF (NO_OUTLOOK.txt present) - the .eml "
              "files in Reports\\<date>\\Emails are ready to open and send.")
        return False
    ps1 = os.path.join(base_dir, "MAKE_OUTLOOK_DRAFTS.ps1")
    if os.name != "nt" or not os.path.isfile(ps1):
        return False
    try:
        r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy",
                            "Bypass", "-File", ps1],
                           capture_output=True, text=True, timeout=300,
                           errors="replace")
        out = (r.stdout or "").strip()
        if out:
            print(" Outlook drafts:")
            for line in out.splitlines():
                print("   " + line)
        return r.returncode == 0
    except Exception as exc:
        print(" Outlook drafts skipped ({}) - open the .eml files or run "
              "12_MAKE_OUTLOOK_DRAFTS.bat instead.".format(exc))
        return False


def manifest_images(png_paths):
    """The images list for the .draft.json sidecar, so MAKE_OUTLOOK_DRAFTS
    can rebuild the same inline-image body as a native Outlook draft."""
    return [{"cid": "pg{}".format(i), "file": os.path.basename(p)}
            for i, p in enumerate(png_paths, 1)]
