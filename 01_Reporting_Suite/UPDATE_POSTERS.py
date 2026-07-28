#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | UPDATE POSTERS - same picture, fresh QR codes
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 27 Jul 2026): "use the picture as the template and
#  update just the inner QR codes." The A3 poster and the window
#  poster are good as they are - the only thing that goes stale is the
#  address inside the QR. Change network, change port, move to https,
#  and every printed poster on the wall is quietly wrong.
#
#  This keeps your artwork EXACTLY as it is and swaps only the QR
#  squares - the Wi-Fi join code and the My Gear address - then
#  reprints the PDF. Nothing else on the poster is touched.
#
#  QR codes are generated here (qr_lite.py), not by a website, so the
#  store's addresses and wifi password never leave this laptop.
# =====================================================================
import os
import re
import shutil
import subprocess
import sys

import qr_lite

HERE = os.path.dirname(os.path.abspath(__file__))
GEAR = os.path.join(HERE, "Gear_Lookup")
BK = os.path.join(HERE, "Updates", "poster_backups")


def ask(label, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        v = input(" {}{}: ".format(label, d)).strip()
    except EOFError:
        v = ""
    return v or default


def lan_ip():
    """The address the PHONES can reach - not the one facing the
    internet. On a laptop with building Wi-Fi plus a store router on
    ethernet those are different cards, and picking the internet one
    prints a QR that no phone on the store network can open."""
    try:
        import net_pick
        return net_pick.best_guess()
    except Exception:
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("10.255.255.255", 1))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "192.168.1.50"


def retext_urls(src, url):
    """Any plain-text store address on the poster (the small print at the
    foot, usually) moves with the QR - a poster that shows one address
    and encodes another is worse than no poster."""
    return re.sub(r"https?://[0-9A-Za-z\.\-]+:\d+/?", url, src)


def inject_qr(src, url, px=300):
    """A poster that says 'scan the window' but has no QR gets one, in a
    plain white box with the Coates rule under it. Inserted before the
    numbered instructions so it reads: see it, scan it, follow the
    steps. (The window poster shipped without one.)"""
    box = ("<div style='margin:8px auto 22px;display:inline-block;"
           "background:#fff;padding:16px 16px 10px;border:3px solid #F26222;"
           "border-radius:14px'>" + qr_lite.qr_svg(url, px=px) +
           "<div style='font-size:15px;font-weight:800;letter-spacing:1px;"
           "color:#1D1D1B;margin-top:8px'>SCAN ME</div></div>")
    m = re.search(r"<div[^>]*>\s*<b>1\.</b>", src)
    if not m:
        return src, False
    return src[:m.start()] + box + src[m.start():], True


def swap_qrs(path, codes):
    """Replace the QR <svg> blocks in order, leaving everything else
    byte-for-byte as it was."""
    with open(path, encoding="utf-8") as f:
        src = f.read()
    blocks = list(re.finditer(r"<svg width='(\d+)' height='\1'[^>]*viewBox='0 0 "
                              r"\d+ \d+'[^>]*>.*?</svg>", src, re.S))
    if not blocks:
        return 0, src
    out, last, n = [], 0, 0
    for i, m in enumerate(blocks):
        if i >= len(codes) or codes[i] is None:
            continue
        px = int(m.group(1))
        out.append(src[last:m.start()])
        out.append(qr_lite.qr_svg(codes[i], px=px))
        last = m.end()
        n += 1
    out.append(src[last:])
    return n, "".join(out)


def to_pdf(html_path, pdf_path):
    try:
        import browser_engine
        b = browser_engine.find_browser()
    except Exception:
        b = None
    if not b:
        return False
    prof = os.path.join(os.environ.get("TEMP") or "/tmp", "coates_poster_pdf")
    cmd = [b, "--headless", "--disable-gpu", "--no-first-run",
           "--user-data-dir=" + prof, "--no-pdf-header-footer",
           "--print-to-pdf=" + os.path.abspath(pdf_path),
           "file:///" + os.path.abspath(html_path).replace("\\", "/")]
    if os.name != "nt":
        cmd.insert(1, "--no-sandbox")
    try:
        subprocess.run(cmd, capture_output=True, timeout=180)
    finally:
        shutil.rmtree(prof, ignore_errors=True)
    return os.path.isfile(pdf_path) and os.path.getsize(pdf_path) > 0


def main():
    print("=" * 62)
    print(" COATES | UPDATE POSTERS - same picture, fresh QR codes")
    print("=" * 62)
    if not os.path.isdir(GEAR):
        print(" No Gear_Lookup folder - run 04_RUN_MY_GEAR.bat first.")
        return 1

    #  Pick the address by ASKING, not by guessing. The old default came
    #  from "which card doesn't face the internet", which put the wrong
    #  address on the poster on Andrew's own laptop. A number off a list,
    #  or the phone's own IP, cannot be wrong. (28 Jul 2026.)
    ip = ""
    try:
        import net_pick
        addrs = [a for a, _n, _b in net_pick.candidates()]
        if addrs:
            print("")
            print(" This laptop's addresses:")
            for i, a in enumerate(addrs, 1):
                print("   {}  {}".format(i, a))
            print("")
            print(" Type the NUMBER of the one to put on the poster.")
            print(" Not sure which? Put your PHONE on the store Wi-Fi, find")
            print(" its IP address, and type THAT instead - I'll work out")
            print(" which of the above it can reach.")
            print("")
            pick = ask("Number, or your phone's IP")
            if pick.isdigit() and 1 <= int(pick) <= len(addrs):
                ip = addrs[int(pick) - 1]
            elif pick in addrs:
                #  he typed one of THIS laptop's own addresses - take it
                #  at face value rather than treating it as a phone
                ip = pick
            elif pick.count(".") == 3:
                hits = net_pick.match_phone(pick, addrs)
                if hits:
                    ip = hits[0]
                    print(" Phone on {}.x reaches {} - using that."
                          .format(net_pick.subnet(pick), ip))
                else:
                    print(" ! Nothing on this laptop is on {}.x, so a phone"
                          .format(net_pick.subnet(pick)))
                    print("   there cannot reach it at all. Put the laptop on")
                    print("   the same network as the phones first.")
                    return 1
            else:
                ip = pick
    except Exception:
        pass
    if not ip:
        ip = ask("Store server address (the one the PHONES can reach)",
                 lan_ip())
    secure = ask("Secure https (needed for phone scanning)? y/n", "y")
    scheme, port = ("https", "8443") if secure.lower().startswith("y") \
        else ("http", "8123")
    port = ask("Port", port)
    url = "{}://{}:{}/".format(scheme, ip, port)

    print("")
    print(" My Gear address for the QR : " + url)
    #  The LEFT code is the join-the-Wi-Fi one. Leave this blank and the
    #  poster quietly becomes a different poster - two My Gear codes and
    #  nothing to join the network with. It used to do that in silence.
    #  (Andrew, 28 Jul 2026: "left barcode is meant to join the WiFi.")
    print("")
    print(" The LEFT QR code joins the Wi-Fi. That is the network the")
    print(" CREWS join - the same one your phone is on, not the corporate")
    print(" site Wi-Fi.")
    #  Don't make him TYPE it. His store has 'Tool Store' AND 'Tool Store
    #  2' in the list, and one character between them is the difference
    #  between a QR that joins the crews to the server and one that joins
    #  them to nothing. The laptop is already on the right network - it is
    #  serving the page - so ask Windows and offer that.
    #  (Andrew, 28 Jul 2026: "I have a dual router.")
    here = ""
    try:
        import net_pick
        here = net_pick.wifi_ssid()
    except Exception:
        here = ""
    if here:
        print("")
        print(" This laptop is on Wi-Fi  : {}".format(here))
        print(" That is the network serving the page, so it is almost")
        print(" certainly the one to put on the poster. Press Enter to take")
        print(" it, or type a different name.")
    wifi_ssid = ask("Wi-Fi name (exactly as it appears on the phone)", here)
    wifi = None
    pw = ""
    if wifi_ssid:
        pw = ask("Wi-Fi password")
        if not pw:
            print(" ! No password given. The QR will offer an OPEN network")
            print("   and will not join a secured one.")
        wifi = "WIFI:T:WPA;S:{};P:{};;".format(wifi_ssid, pw)
    else:
        print("")
        print(" ** NO WI-FI NAME GIVEN **")
        print(" The poster will have NO join-the-network code - both codes")
        print(" will point at My Gear instead. That is probably not what")
        print(" you want.")
        if ask("Carry on anyway? y/n", "n").lower() != "y":
            print(" Stopped. Nothing was changed. Get the Wi-Fi name and")
            print(" password and run me again.")
            return 1

    os.makedirs(BK, exist_ok=True)
    #  BUILT, not patched (Andrew, 27 Jul 2026 - "looks very boring very
    #  basic"). The posters are now drawn in the same language as the
    #  My Gear page they open, and the QR codes are made fresh every
    #  run, so poster and server can never drift apart.
    import build_posters
    #  Two of everything (Andrew, 27 Jul 2026 - "on occasion we have a
    #  black n white printer"). The _BW files are redrawn for one ink,
    #  not the colour poster in greyscale, so the store never has to
    #  wait for the good printer to put a poster on the wall.
    done = 0
    for name, html in [
            ("MyGear_A3_Poster.html",
             build_posters.poster_html(url, wifi, wifi_ssid, wifi_pw=pw)),
            ("MyGear_A3_Poster_BW.html",
             build_posters.poster_html(url, wifi, wifi_ssid, mono=True,
                                       wifi_pw=pw)),
            ("QR_Window_Poster.html", build_posters.window_html(url)),
            ("QR_Window_Poster_BW.html",
             build_posters.window_html(url, mono=True)),
            #  The process sheet lives with the posters so it can never
            #  quote an address the store has moved away from - and it
            #  carries the Wi-Fi name and password so the counter can
            #  answer "what's the Wi-Fi" without going hunting.
            ("MyGear_How_It_Works.html",
             build_posters.process_html(url, wifi_name=wifi_ssid,
                                        wifi_pw=pw)),
            ("MyGear_How_It_Works_BW.html",
             build_posters.process_html(url, mono=True, wifi_name=wifi_ssid,
                                        wifi_pw=pw))]:
        path = os.path.join(GEAR, name)
        if os.path.isfile(path):
            shutil.copy2(path, os.path.join(BK, name))
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print("  BUILT | {}{}".format(
            name, "   (black & white printer)" if "_BW" in name else ""))
        pdf = path[:-5] + ".pdf"
        if to_pdf(path, pdf):
            print("        | printed {}".format(os.path.basename(pdf)))
        done += 1
    if done:
        print("-" * 62)
        print(" Originals kept in Updates\\poster_backups\\")
        print("")
        print(" COLOUR printer  ->  MyGear_A3_Poster.pdf")
        print("                     QR_Window_Poster.pdf")
        print(" BLACK & WHITE   ->  MyGear_A3_Poster_BW.pdf")
        print("                     QR_Window_Poster_BW.pdf")
        print("")
        print(" HOW IT WORKS    ->  MyGear_How_It_Works.pdf  (+ _BW)")
        print("                     the process, both sides of the counter")
        print("")
        print(" Same poster, same QR codes - the BW ones are drawn for one")
        print(" ink so they come out sharp instead of a grey smudge.")
        print("")
        print(" Tip: run me again any time the store's address changes -")
        print(" all four are rebuilt from scratch each time.")
        return 0
    old_done = 0
    for name, codes in [("MyGear_A3_Poster.html", [wifi, url]),
                        ("QR_Window_Poster.html", [url, url])]:
        path = os.path.join(GEAR, name)
        if not os.path.isfile(path):
            continue
        shutil.copy2(path, os.path.join(BK, name))
        n, new = swap_qrs(path, codes)
        added = False
        if not n:
            new, added = inject_qr(new, url)
        new = retext_urls(new, url)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
        if n:
            print("  DONE  | {}: {} QR code(s) refreshed".format(name, n))
        elif added:
            print("  DONE  | {}: QR code ADDED (it had none) + address"
                  " updated".format(name))
        else:
            print("  DONE  | {}: address text updated".format(name))
        pdf = path[:-5] + ".pdf"
        if to_pdf(path, pdf):
            print("        | reprinted {}".format(os.path.basename(pdf)))
        done += 1

    if not done:
        print(" Nothing to update.")
        return 1
    print("-" * 62)
    print(" Originals kept in Updates\\poster_backups\\")
    print(" Print the PDFs in Gear_Lookup and put them back on the wall.")
    print("")
    print(" Tip: run me again any time the store's address changes -")
    print(" the artwork never changes, only the squares.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
