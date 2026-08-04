#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - THE SHOWCASE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 4 Aug 2026): "i have a meeting tonight to promote. can
#  you make this into a fully operational html for me to showcase."
#  Then: "i mean of the mygear."
#
#  MY GEAR IS THE THING WORTH SHOWING. The reports are what the job
#  produces; My Gear is what changed how the store runs. A QR sticker
#  on the window, any phone on site, no app, no login, no data plan -
#  and a bloke standing in an aisle can find out what is on the shelf,
#  which aisle it lives in, how many are already out, what tag colour
#  it has to carry and what has to come back with it.
#
#  THIS PAGE RUNS IT. Not a screenshot of the board - the board, with
#  the real shelf catalogue inside it, searching as you type. Hand the
#  laptop to somebody in the room and let them look for a cumalong.
#
#  WHAT IT CARRIES, AND WHAT IT WILL NOT.
#    * the real shelf: every line, every aisle, on-shelf and out counts
#    * the real compliance flags - tag colour and log book
#    * the real kit lists - what an item goes out and comes back with
#    * NO money. Not a rate, not a total, not $0. That is My Gear's
#      own rule, not a decision made for this page: the board every
#      phone on site can open has never carried a dollar and this is
#      the same board.
#
#  ONE FILE. Photos are embedded up to a budget and the page SAYS how
#  many made it in and how many exist - a gallery that quietly shows
#  a third of the store while looking complete is exactly the sort of
#  thing this suite refuses to do.
#
#  Run it:  py build_mygear_showcase.py      (or 80_MYGEAR_SHOWCASE)
# =====================================================================
from __future__ import print_function

import base64
import collections
import datetime as dt
import glob
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOOKUP = os.path.join(HERE, 'Gear_Lookup')
BOARD = os.path.join(LOOKUP, 'index.html')
THUMBS = os.path.join(LOOKUP, 'thumbs')

#  How much photography is allowed to ride inside one file. A meeting
#  room laptop opens 6 MB off a stick without complaint; 60 MB is a
#  different conversation, and his store has over a thousand thumbs.
PHOTO_BUDGET = 5 * 1024 * 1024


def esc(s):
    import html
    return html.escape('' if s is None else str(s), quote=True)


# ---------------------------------------------------------------------
#  READ THE REAL BOARD. Nothing here is re-typed - the catalogue comes
#  out of the built My Gear page itself, so the showcase can never
#  drift away from what the store is actually serving.
# ---------------------------------------------------------------------
def read_store():
    if not os.path.isfile(BOARD):
        return [], ''
    with io.open(BOARD, encoding='utf-8', errors='ignore') as fh:
        s = fh.read()
    m = re.search(r'var STORE\s*=', s)
    if not m:
        return [], ''
    k = s.index('[', m.end())
    rows, _ = json.JSONDecoder().raw_decode(s[k:])
    tag = ''
    mt = re.search(r'>TAG (\w+)<', s)
    if mt:
        tag = mt.group(1)
    return rows, tag


def read_photos(rows):
    """Embed what fits, in the order a storeman actually asks for it -
    the gear that is out the most, then the deepest shelves. Returns
    (map of sku -> data URI, how many exist, how many travelled)."""
    have = {}
    for p in glob.glob(os.path.join(THUMBS, '*')):
        stem = os.path.splitext(os.path.basename(p))[0]
        if stem.startswith('_'):
            continue
        have[stem.upper()] = p
    order = sorted(rows, key=lambda r: (-(r.get('o') or 0),
                                        -(r.get('q') or 0)))
    out, spent, seen, dropped = {}, 0, set(), 0
    for r in order:
        v = str(r.get('v') or '').upper()
        if not v or v in seen or v not in have:
            continue
        seen.add(v)
        try:
            with open(have[v], 'rb') as fh:
                raw = fh.read()
        except Exception:
            continue
        if spent + len(raw) * 1.37 > PHOTO_BUDGET:
            #  Out of room, not out of photos. Counted, so the page can
            #  say so rather than look complete.
            dropped += 1
            continue
        ext = os.path.splitext(have[v])[1].lower().lstrip('.') or 'jpg'
        mime = 'image/png' if ext == 'png' else 'image/jpeg'
        out[v] = ('data:' + mime + ';base64,'
                  + base64.b64encode(raw).decode('ascii'))
        spent += len(raw) * 1.37
    #  seen = shelf lines that HAVE a photo on this machine. len(have) is
    #  the thumb count, which is bigger whenever the same item is filed
    #  under two spellings - counting those as "missing photos" would be
    #  a wrong number dressed up as a shortfall.
    return out, len(seen), len(out), dropped, len(have)


def _bars(pairs, total):
    if not pairs:
        return "<p class='empty'>Nothing to read.</p>"
    top = max(v for _k, v in pairs) or 1
    rows = ''
    for k, v in pairs:
        share = (100.0 * v / total) if total else 0
        rows += (
            "<div class='bar' title='" + esc(k) + " — "
            + '{:,}'.format(v) + " line(s), " + '{:.1f}'.format(share)
            + "% of the shelf'>"
            "<span class='bl'>" + esc(k) + "</span>"
            "<span class='bt'><i style='width:"
            + '{:.2f}'.format(100.0 * v / top) + "%'></i></span>"
            "<span class='bv'>" + '{:,}'.format(v) + "</span></div>")
    return rows


def build():
    rows, tag = read_store()
    photos, withphoto_n, took_n, dropped_n, thumb_n = read_photos(rows)

    #  Trim to what the board actually shows. No rate ever existed in
    #  this payload - there is nothing to strip, which is the point.
    slim = []
    for r in rows:
        slim.append({
            'n': r.get('n', ''), 'c': r.get('c', ''), 'u': r.get('u', ''),
            'q': r.get('q') or 0, 'o': r.get('o') or 0,
            'v': r.get('v', ''), 'fl': r.get('fl', '') or '',
            'kt': r.get('kt', '') or '',
            'k': r.get('k', ''),
        })

    units = collections.Counter(r['u'] for r in slim if r['u'])
    cats = collections.Counter(r['c'] for r in slim if r['c'])
    on_shelf = sum(r['q'] for r in slim)
    out_now = sum(r['o'] for r in slim)
    kitted = sum(1 for r in slim if r['kt'])
    flagged = sum(1 for r in slim if r['fl'])

    tpl = _TEMPLATE
    rep = {
        '__LINES__': '{:,}'.format(len(slim)),
        '__ONSHELF__': '{:,}'.format(on_shelf),
        '__OUTNOW__': '{:,}'.format(out_now),
        '__AISLES__': str(len(units)),
        '__CATS__': str(len(cats)),
        '__KITTED__': '{:,}'.format(kitted),
        '__FLAGGED__': '{:,}'.format(flagged),
        '__TAG__': tag or 'BLUE',
        '__PHOTOS_IN__': '{:,}'.format(took_n),
        '__PHOTOS_HAVE__': '{:,}'.format(withphoto_n),
        '__PHOTONOTE__': _photo_note(took_n, withphoto_n, dropped_n, len(slim)),
        '__BUILT__': dt.date.today().strftime('%d %b %Y'),
        '__STOREJSON__': json.dumps(slim, separators=(',', ':')),
        '__PHOTOJSON__': json.dumps(photos, separators=(',', ':')),
        '__UNITBARS__': _bars(units.most_common(), len(slim)),
        '__CATBARS__': _bars(cats.most_common(), len(slim)),
    }
    for k, v in rep.items():
        tpl = tpl.replace(k, v)

    out = os.path.join(HERE, 'MYGEAR_SHOWCASE.html')
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(tpl)
    return out, len(slim), took_n, withphoto_n


def _photo_note(took, withphoto, dropped, lines):
    """Say what did not travel, and say it in the right units.

    Three different numbers get confused here and all three matter:
    lines on the shelf, lines that HAVE a photo on this machine, and
    lines whose photo fitted inside this file. Reporting the gap
    between the first and the last as if it were all a shortfall
    would overstate what is missing; reporting only the last would
    hide it. So the note carries all three."""
    n = '{:,}'.format
    if not withphoto:
        return ("No photos found beside this build, so every line shows "
                "the <b>NO PHOTO YET</b> marker — which is what the real "
                "board does too, rather than pretend.")
    bits = ["<b>{}</b> of the <b>{}</b> shelf lines have a photo on this "
            "machine".format(n(withphoto), n(lines))]
    if dropped:
        bits.append("<b>{}</b> of those travelled inside this file and "
                    "<b>{}</b> were left out to keep it openable off a "
                    "memory stick".format(n(took), n(dropped)))
    else:
        bits.append("all of them travelled inside this file")
    return (', and '.join(bits) + ". Every line without one shows the "
            "<b>NO PHOTO YET</b> marker rather than an empty box — the "
            "board never leaves a gap unexplained.")


_TEMPLATE = r"""<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#F26222">
<title>Coates | My Gear &mdash; the store, on every phone</title>
<style>
:root{
  --ground:#0B0F14; --panel:#121922; --panel2:#171F29; --line:#26313F;
  --ink:#E9EEF5; --ink2:#949DAA; --ink3:#66707E;
  --accent:#F26222; --accent-dim:#8A3714;
  --good:#2BB673; --warn:#F5A623; --bad:#FF6B5A; --tag:#2F80ED;
  --display:Bahnschrift,"DIN Alternate","Arial Narrow","Segoe UI Semibold",system-ui,sans-serif;
  --body:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;
  --mono:Consolas,"SF Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme:light){
  :root{--ground:#F6F4F1;--panel:#FFFFFF;--panel2:#FBFAF8;--line:#E0DBD3;
    --ink:#14181D;--ink2:#5D6570;--ink3:#8A929C;--accent-dim:#F9DCCC}
}
:root[data-theme="dark"]{--ground:#0B0F14;--panel:#121922;--panel2:#171F29;
  --line:#26313F;--ink:#E9EEF5;--ink2:#949DAA;--ink3:#66707E;--accent-dim:#8A3714}
:root[data-theme="light"]{--ground:#F6F4F1;--panel:#FFFFFF;--panel2:#FBFAF8;
  --line:#E0DBD3;--ink:#14181D;--ink2:#5D6570;--ink3:#8A929C;--accent-dim:#F9DCCC}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}
  *{animation:none!important;transition:none!important}}
body{background:var(--ground);color:var(--ink);font-family:var(--body);
  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:0 22px}

.mast{border-bottom:1px solid var(--line);background:var(--panel);
  position:sticky;top:0;z-index:40}
.mast .wrap{display:flex;align-items:center;gap:14px;min-height:58px;
  justify-content:space-between}
.brand{display:flex;align-items:center;gap:11px;min-width:0}
.mark{width:11px;height:22px;background:var(--accent);flex:none;border-radius:1px}
.brand b{font-family:var(--display);font-size:16px;letter-spacing:.5px;
  font-weight:700;white-space:nowrap}
.brand span{color:var(--ink3);font-size:11px;letter-spacing:1.4px;
  text-transform:uppercase;white-space:nowrap}
.mnav{display:flex;gap:2px;flex-wrap:wrap}
.mnav a{color:var(--ink2);text-decoration:none;font-size:12px;padding:7px 10px;
  border-radius:7px;white-space:nowrap}
.mnav a:hover,.mnav a:focus-visible{color:var(--ink);background:var(--panel2);outline:none}
@media (max-width:900px){.mnav{display:none}}
.toggle{background:none;border:1px solid var(--line);color:var(--ink2);
  border-radius:8px;padding:6px 11px;font-size:11.5px;cursor:pointer;
  font-family:var(--body);min-height:34px}
.toggle:hover{color:var(--ink);border-color:var(--accent)}

.eyebrow{font-family:var(--display);font-size:11px;letter-spacing:2.6px;
  text-transform:uppercase;color:var(--accent);font-weight:700}
h1{font-family:var(--display);font-size:clamp(30px,4.8vw,52px);line-height:1.03;
  font-weight:700;letter-spacing:-.4px;margin:14px 0 0;text-wrap:balance}
.sub{color:var(--ink2);font-size:17px;line-height:1.62;margin-top:15px}
.sub b{color:var(--ink);font-weight:600}
h2.sec{font-family:var(--display);font-size:clamp(23px,3.2vw,32px);font-weight:700;
  margin:12px 0 0;text-wrap:balance;max-width:24ch}
.lede{color:var(--ink2);font-size:15.5px;margin-top:12px;max-width:66ch;line-height:1.65}
.lede b{color:var(--ink);font-weight:600}
section{padding:54px 0;border-top:1px solid var(--line);margin-top:46px;
  scroll-margin-top:72px}

/* ---- hero: the phone is the thesis ---------------------------- */
.hero{padding:44px 0 6px;display:grid;grid-template-columns:1fr 372px;
  gap:46px;align-items:start}
@media (max-width:980px){.hero{grid-template-columns:1fr;gap:32px}}
.qr{margin-top:24px;display:flex;gap:14px;align-items:center;
  background:var(--panel);border:1px solid var(--line);border-radius:14px;
  padding:14px 16px}
.qr svg{flex:none}
.qr div b{display:block;font-size:14px;font-weight:600}
.qr div span{display:block;color:var(--ink2);font-size:12.5px;margin-top:2px}
.ba{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:620px){.ba{grid-template-columns:1fr}}
.ba>div{background:var(--panel);border:1px solid var(--line);
  border-radius:14px;padding:15px 17px}
.ba .now{border-left:3px solid var(--accent)}
.ba .lbl{font-family:var(--display);font-size:10.5px;letter-spacing:1.8px;
  text-transform:uppercase;color:var(--ink3);font-weight:700;margin-bottom:7px}
.ba .now .lbl{color:var(--accent)}
.ba p{color:var(--ink2);font-size:13.5px;line-height:1.6}

/* ---- the phone -------------------------------------------------- */
.phone{position:sticky;top:78px;background:#05080B;border:9px solid #1A222C;
  border-radius:34px;overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,.45);
  display:flex;flex-direction:column;height:660px}
:root[data-theme="light"] .phone{box-shadow:0 22px 50px rgba(0,0,0,.18)}
.pbar{background:var(--accent);color:#fff;padding:13px 15px 12px;flex:none}
.pbar b{display:block;font-family:var(--display);font-size:16px;
  letter-spacing:.4px;font-weight:700}
.pbar span{display:block;font-size:10px;letter-spacing:1.6px;opacity:.9;
  margin-top:2px}
.psearch{padding:11px;background:#0E141B;flex:none;border-bottom:1px solid #1E2731}
.psearch input{width:100%;background:#161E27;border:1px solid #26313F;
  border-radius:11px;color:#E9EEF5;padding:12px 13px;font-size:15px;
  font-family:var(--body)}
.psearch input:focus{outline:none;border-color:var(--accent)}
.psearch input::placeholder{color:#66707E}
.pcount{padding:9px 13px 3px;color:#7E8896;font-size:11px;flex:none;
  font-variant-numeric:tabular-nums}
.plist{flex:1;overflow-y:auto;padding:6px 11px 16px;background:#0B1117}
.gi{background:#141C24;border:1px solid #222D38;border-radius:12px;
  padding:10px 11px;margin-bottom:7px;cursor:pointer;display:flex;gap:10px}
.gi:hover{border-color:#3A4756}
.gth{width:46px;height:46px;border-radius:9px;flex:none;object-fit:cover;
  background:#1B242E;border:1px solid #2A3540}
.gnp{width:46px;height:46px;border-radius:9px;flex:none;background:#1B242E;
  border:1px dashed #38434F;display:flex;align-items:center;justify-content:center;
  color:#5A6472;font-size:7.5px;text-align:center;line-height:1.2;padding:3px}
.gt{flex:1;min-width:0}
.gt b{display:block;color:#EDF1F6;font-size:13.5px;font-weight:600;
  line-height:1.3}
.gmeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;align-items:center}
.ch{font-size:9px;letter-spacing:.7px;font-weight:700;border-radius:20px;
  padding:3px 7px;text-transform:uppercase;white-space:nowrap}
.ch.aisle{background:#1E2833;color:#93A0AF}
.ch.shelf{background:#12280C;color:#7BD45C}
.ch.zero{background:#3A1512;color:#FF6B5A}
.ch.out{background:#2A2233;color:#B79BD6}
.ch.tag{background:var(--tag);color:#fff}
.ch.log{background:#3A2110;color:#F5A623}
.kit{margin-top:8px;padding-top:8px;border-top:1px solid #222D38;
  color:#9AA6B4;font-size:11.5px;line-height:1.5}
.kit b{color:#D6DEE8;display:block;font-size:9.5px;letter-spacing:1.2px;
  text-transform:uppercase;margin-bottom:3px}
.pnone{color:#66707E;font-size:12.5px;padding:16px 4px;line-height:1.6}
.pchips{display:flex;gap:5px;flex-wrap:wrap;padding:0 11px 9px;background:#0B1117}
.pchip{background:#161E27;border:1px solid #26313F;color:#93A0AF;
  border-radius:20px;padding:5px 10px;font-size:11px;cursor:pointer;
  font-family:var(--body)}
.pchip:hover{border-color:var(--accent);color:#E9EEF5}

/* ---- tiles / bars / rules -------------------------------------- */
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));
  gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:14px;overflow:hidden;margin-top:26px}
.tile{background:var(--panel);padding:15px 17px}
.tile b{display:block;font-family:var(--display);font-size:30px;font-weight:700;
  line-height:1;font-variant-numeric:tabular-nums}
.tile span{display:block;color:var(--ink2);font-size:11.5px;margin-top:6px;
  line-height:1.4}
.tile.hi b{color:var(--accent)}
.chartwrap{margin-top:22px;border:1px solid var(--line);border-radius:14px;
  background:var(--panel);padding:19px 20px 21px;overflow-x:auto}
.chartwrap h3{font-family:var(--display);font-size:12px;letter-spacing:2px;
  text-transform:uppercase;color:var(--ink2);font-weight:700;margin-bottom:14px}
.bar{display:grid;grid-template-columns:minmax(120px,1.1fr) 3fr 50px;gap:12px;
  align-items:center;padding:4px 0}
.bl{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bt{background:var(--panel2);border-radius:4px;height:13px;overflow:hidden;
  border:1px solid var(--line)}
.bt i{display:block;height:100%;background:var(--accent);border-radius:0 4px 4px 0}
.bv{text-align:right;font-family:var(--mono);font-size:12.5px;color:var(--ink2);
  font-variant-numeric:tabular-nums}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media (max-width:860px){.twocol{grid-template-columns:1fr}}
.doors{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:15px;margin-top:24px}
.door{background:var(--panel);border:1px solid var(--line);border-radius:14px;
  padding:19px;border-top:3px solid var(--accent)}
.door.locked{border-top-color:var(--bad)}
.door h3{font-family:var(--display);font-size:17px;font-weight:700}
.door .who{color:var(--accent);font-size:10.5px;letter-spacing:1.4px;
  text-transform:uppercase;font-weight:700;margin-bottom:7px}
.door.locked .who{color:var(--bad)}
.door p{color:var(--ink2);font-size:13px;margin-top:8px;line-height:1.6}
.note{margin-top:24px;background:var(--panel);border:1px solid var(--line);
  border-left:3px solid var(--accent);border-radius:0 12px 12px 0;
  padding:15px 19px;color:var(--ink2);font-size:13.5px;line-height:1.65}
.note b{color:var(--ink)}
.empty{color:var(--ink3);font-style:italic}
footer{border-top:1px solid var(--line);margin-top:54px;padding:32px 0 60px;
  color:var(--ink3);font-size:12.5px;line-height:1.8}
footer b{color:var(--ink2)}
@media print{
  body{background:#fff;color:#000}
  .mast,.psearch,.pchips,.toggle{display:none}
  .phone{position:static;height:auto;box-shadow:none}
  section{break-inside:avoid}
}
</style>
</head>
<body>

<header class="mast">
  <div class="wrap">
    <div class="brand"><span class="mark"></span><b>MY GEAR</b>
      <span>K2 Tool Store &middot; Gladstone</span></div>
    <nav class="mnav">
      <a href="#try">Try it</a><a href="#shelf">The shelf</a>
      <a href="#doors">Three doors</a><a href="#honest">Kept honest</a>
    </nav>
    <button class="toggle" id="tg" type="button">Light / dark</button>
  </div>
</header>

<div class="wrap">

  <div class="hero">
    <div>
      <p class="eyebrow">Cement Australia K2 Shutdown 2026</p>
      <h1>Every phone on site is a tool store terminal.</h1>
      <p class="sub">A QR sticker on the store window. Scan it and the whole
        shelf is in your hand &mdash; <b>__LINES__ lines</b> across
        <b>__AISLES__ aisles</b>, what is on the shelf, what is already
        out, the tag colour it has to carry and what has to come back with
        it. <b>No app. No login. No data plan</b> &mdash; it runs off the
        store&rsquo;s own Wi-Fi.</p>
      <p class="sub">The phone beside this is not a picture.
        <b>It is the board</b>, with the real catalogue inside it. Search it.</p>
      <div class="qr">
        <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
          <rect width="52" height="52" fill="#fff" rx="4"/>
          <g fill="#0B0F14">
            <rect x="5" y="5" width="14" height="14"/>
            <rect x="8" y="8" width="8" height="8" fill="#fff"/>
            <rect x="33" y="5" width="14" height="14"/>
            <rect x="36" y="8" width="8" height="8" fill="#fff"/>
            <rect x="5" y="33" width="14" height="14"/>
            <rect x="8" y="36" width="8" height="8" fill="#fff"/>
            <rect x="23" y="5" width="4" height="4"/><rect x="23" y="13" width="4" height="4"/>
            <rect x="23" y="21" width="4" height="4"/><rect x="23" y="29" width="4" height="4"/>
            <rect x="23" y="41" width="4" height="4"/><rect x="31" y="23" width="4" height="4"/>
            <rect x="39" y="23" width="4" height="4"/><rect x="31" y="31" width="4" height="4"/>
            <rect x="39" y="39" width="4" height="4"/><rect x="43" y="31" width="4" height="4"/>
            <rect x="31" y="43" width="4" height="4"/><rect x="13" y="23" width="4" height="4"/>
            <rect x="5" y="23" width="4" height="4"/>
          </g>
        </svg>
        <div><b>On the window, on the racks, on the crib room wall</b>
          <span>Scan &rarr; the board opens. Nothing to install, nothing
            to remember.</span></div>
      </div>

      <div class="ba">
        <div class="was">
          <p class="lbl">What it was</p>
          <p>&ldquo;Have you got any 32 mm crowfeet?&rdquo; &mdash; asked
            at the counter, answered by someone walking the aisle. Every
            time, by every crew, all shift.</p>
        </div>
        <div class="now">
          <p class="lbl">What it is</p>
          <p>The bloke checks before he walks over, and turns up knowing
            the aisle, the count, and what has to come back with it.</p>
        </div>
      </div>
    </div>

    <!-- the working board -->
    <div class="phone">
      <div class="pbar"><b>MY GEAR</b><span>K2 TOOL STORE &middot; GLADSTONE</span></div>
      <div class="psearch">
        <input id="q" type="search" autocomplete="off" spellcheck="false"
          placeholder="What are you after?" aria-label="Search the shelf">
      </div>
      <div class="pchips" id="chips"></div>
      <p class="pcount" id="pcount"></p>
      <div class="plist" id="plist"></div>
    </div>
  </div>

  <section id="try">
    <p class="eyebrow">What a storeman actually does with it</p>
    <h2 class="sec">Three seconds, standing in the aisle.</h2>
    <p class="lede">Type <b>cumalong</b>. The board says which aisle it
      lives in, how many are on the shelf, how many are already out, that
      it needs a <b>TAG __TAG__</b> this period &mdash; and that it comes
      back with a load chain free of knots and a rated hook with a latch.
      <b>__KITTED__ lines</b> carry that kit list, so the check is on the
      screen instead of in somebody&rsquo;s head.</p>
    <div class="tiles">
      <div class="tile hi"><b>__LINES__</b><span>lines on the shelf</span></div>
      <div class="tile"><b>__ONSHELF__</b><span>items counted in</span></div>
      <div class="tile"><b>__OUTNOW__</b><span>out with crews now</span></div>
      <div class="tile"><b>__AISLES__</b><span>aisles</span></div>
      <div class="tile"><b>__FLAGGED__</b><span>need a tag or a log book</span></div>
      <div class="tile"><b>__KITTED__</b><span>carry a kit list</span></div>
    </div>
    <div class="note">__PHOTONOTE__</div>
  </section>

  <section id="shelf">
    <p class="eyebrow">The store, as it stands</p>
    <h2 class="sec">Where it all lives.</h2>
    <p class="lede">Straight off the same catalogue the phone is
      searching. Every aisle and every category is shown &mdash; nothing
      folded into an &ldquo;other&rdquo; that hides the tail.</p>
    <div class="twocol">
      <div class="chartwrap"><h3>Lines by aisle</h3>__UNITBARS__</div>
      <div class="chartwrap"><h3>Lines by category</h3>__CATBARS__</div>
    </div>
  </section>

  <section id="doors">
    <p class="eyebrow">Same Wi-Fi, different doors</p>
    <h2 class="sec">Everyone gets a board. Not everyone gets the same one.</h2>
    <p class="lede">One QR, one address, three destinations. The split is
      not a convention somebody remembers &mdash; the pages a worker can
      reach are named in a single list, and <b>no page on that list is
      allowed to name a staff screen</b>. It is checked on every build.</p>
    <div class="doors">
      <div class="door">
        <p class="who">Anyone on site</p>
        <h3>The shelf</h3>
        <p>What we stock, which aisle, how many are on the shelf and how
          many are out. Photos, tag colour, kit list. This is the board
          in the phone above.</p>
      </div>
      <div class="door">
        <p class="who">Crews &amp; supervisors</p>
        <h3>Who is holding what</h3>
        <p>Their own company&rsquo;s gear and their own people, with a
          worked gauge on each asset. A supervisor sees his crew. He does
          not see the store&rsquo;s books.</p>
      </div>
      <div class="door locked">
        <p class="who">Store staff &mdash; code</p>
        <h3>The stores board</h3>
        <p>Counting, racking, reordering, the fleet screens. Behind the
          store code, and the worker menu has no route to it at all
          &mdash; not a hidden link, no route.</p>
      </div>
    </div>
    <div class="note"><b>No money crosses the store Wi-Fi.</b> Not a rate,
      not a total, not even a zero &mdash; a zero is a claim, and on
      somebody else&rsquo;s gear it is the wrong one. The reports that do carry
      money are encrypted under a manager code before they ever reach the
      folder a phone can open. There is no dollar figure anywhere in the
      board you are searching, because there never was one to remove.</div>
  </section>

  <section id="honest">
    <p class="eyebrow">The rule underneath all of it</p>
    <h2 class="sec">A board that hides things without saying so is the one
      thing this refuses to be.</h2>
    <p class="lede">Lines can be held off the shelf &mdash; dead stock, a
      line that belongs to another site. Every one of them is listed on a
      page you can hold up, with the aisle it is held off and why. The
      totals say how many they left out rather than counting them as
      nothing, and a search that finds nothing says so plainly instead of
      showing an empty screen.</p>
    <div class="note">Try it: search the phone for something the store has
      never carried. It will tell you the shelf is __LINES__ lines and
      none of them is that &mdash; <b>which is an answer</b>, not a blank.</div>
  </section>

  <footer>
    <b>My Gear</b> &middot; Cement Australia K2 Shutdown 2026 &middot; Gladstone<br>
    Built __BUILT__ from the live board &middot; read-only SiteIQ snapshot<br>
    __PHOTOS_IN__ of __PHOTOS_HAVE__ photos embedded &middot; no rate,
    total or dollar figure appears anywhere on this page<br>
    Author: Andrew Fisher &middot; POWERED BY SITEIQ
  </footer>
</div>

<script>
(function(){
  "use strict";
  var tg=document.getElementById('tg');
  tg.addEventListener('click',function(){
    var cur=document.documentElement.getAttribute('data-theme');
    if(!cur)cur=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    document.documentElement.setAttribute('data-theme',cur==='dark'?'light':'dark');
  });

  var STORE=__STOREJSON__;
  var PHOTO=__PHOTOJSON__;
  var TAG='__TAG__';
  var SHOW=40;

  STORE.forEach(function(r){
    r._s=(r.n+' '+r.c+' '+r.u+' '+r.v).toLowerCase();
  });

  function esc(s){
    return String(s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
  }
  function chips(r){
    var h="<span class='ch aisle'>"+esc(r.u||'—')+"</span>";
    h+= r.q>0 ? "<span class='ch shelf'>"+r.q+" on the shelf</span>"
              : "<span class='ch zero'>none on the shelf</span>";
    if(r.o>0) h+="<span class='ch out'>"+r.o+" out</span>";
    if(r.fl.indexOf('E')>=0||r.fl.indexOf('R')>=0)
      h+="<span class='ch tag'>TAG "+esc(TAG)+"</span>";
    if(r.fl.indexOf('L')>=0) h+="<span class='ch log'>LOG BOOK</span>";
    return h;
  }
  function thumb(r){
    var p=PHOTO[(r.v||'').toUpperCase()];
    if(p) return "<img class='gth' src='"+p+"' alt='' loading='lazy'>";
    return "<div class='gnp'>NO PHOTO YET</div>";
  }
  var list=document.getElementById('plist');
  var cnt=document.getElementById('pcount');
  var q=document.getElementById('q');

  function render(term){
    var t=term.trim().toLowerCase();
    var out=t?STORE.filter(function(r){return r._s.indexOf(t)>=0;}):STORE;
    if(!out.length){
      cnt.textContent='';
      list.innerHTML="<p class='pnone'>Nothing on the shelf matches <b>"+
        esc(term)+"</b>.<br><br>The shelf is "+STORE.length.toLocaleString()+
        " lines and none of them is that. That is an answer &mdash; not an "+
        "empty screen.</p>";
      return;
    }
    cnt.textContent=out.length.toLocaleString()+' line'+
      (out.length===1?'':'s')+(t?' matching "'+term.trim()+'"':' on the shelf')+
      (out.length>SHOW?' — showing the first '+SHOW:'');
    list.innerHTML=out.slice(0,SHOW).map(function(r,i){
      return "<div class='gi' data-i='"+i+"'>"+thumb(r)+
        "<div class='gt'><b>"+esc(r.n)+"</b>"+
        "<div class='gmeta'>"+chips(r)+"</div>"+
        (r.kt?"<div class='kit' hidden><b>Comes back with</b>"+esc(r.kt)+
          "</div>":"")+"</div></div>";
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.gi'),function(el){
      el.addEventListener('click',function(){
        var k=el.querySelector('.kit');
        if(k)k.hidden=!k.hidden;
      });
    });
    list.scrollTop=0;
  }
  q.addEventListener('input',function(){render(q.value);});

  ['Cumalong','Grinder','Radio','Gas monitor','Air hose','Sling',
   'Rigging','Torque wrench'].forEach(function(c){
    var b=document.createElement('button');
    b.type='button'; b.className='pchip'; b.textContent=c;
    b.addEventListener('click',function(){q.value=c;render(c);q.focus();});
    document.getElementById('chips').appendChild(b);
  });
  render('');
})();
</script>
</body>
</html>
"""


def main():
    print('=' * 66)
    print(' COATES | MY GEAR - THE SHOWCASE')
    print('=' * 66)
    out, lines, took, withphoto = build()
    if not lines:
        print(' ! No Gear_Lookup\\index.html to read. Run 04_RUN_MY_GEAR')
        print('   first - this page is built FROM the board, never')
        print('   re-typed, so there is nothing to show without it.')
        return 1
    print(' Shelf lines  : {:,}'.format(lines))
    print(' Photos       : {:,} embedded; {:,} shelf line(s) have one'
          .format(took, withphoto))
    print('')
    print(' Page         : ' + out)
    print('')
    print(' One file. Opens off a memory stick with no network and no')
    print(' server. Carries no rate, no total and no dollar figure -')
    print(' same as the board it was built from.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
