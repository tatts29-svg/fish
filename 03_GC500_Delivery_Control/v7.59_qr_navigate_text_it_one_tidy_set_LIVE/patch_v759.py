#!/usr/bin/env python3
"""v7.59 - the QR code, Navigate and Text it as one tidy set. Andrew, 1 Oct 2026: "Can we add the Text me near the QR
code, make this look really tidy and pretty please. Make it go live."

v7.57 put the Text it button beside the QR code and Navigate. This makes the three read as one set: the two pills the
same height and shape (Navigate stays the orange one that pulses; Text it is the dark one with the orange bubble,
lighting up orange on touch), the QR tile the same height as the pills, even gaps; on a phone the QR sits at the left
with the two pills stacked at full width beside it. Styles only - no words, no behaviour, no record.
    python3 patch_v759.py <page.html>   (needs v7.57's styles: mms757)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.59 tidy set' in t: sys.exit('v7.59 already applied')
OLD = ".ld-qr svg{display:block;width:58px;height:58px} /* mms757 */ .ld-txt{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:8px 12px;border-radius:10px;border:1px solid #3a4550;background:#141a1e;color:#fff;cursor:pointer;font:inherit;text-align:left;line-height:1.15} .ld-txt svg{width:22px;height:22px;fill:var(--ld-or,#ff6a13);flex:0 0 auto} .ld-txt b{display:block;font-size:14px} .ld-txt em{display:block;font-style:normal;font-size:11.5px;color:#9aa3ad} .ld-txt:hover,.ld-txt:focus-visible{border-color:var(--ld-or,#ff6a13);outline:none} .mms757-pic{position:relative;background:#0f1214;border-radius:10px;overflow:hidden;min-height:110px;display:flex;align-items:center;justify-content:center;color:#c9d1d9;font-size:13px;margin-top:4px} .mms757-pic img{display:block;width:100%;height:auto} .drawer .mms757-tick{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;font:inherit;font-size:14px;line-height:1.35;text-transform:none;letter-spacing:0;color:inherit;cursor:pointer} .drawer .mms757-tick input{margin:3px 0 0;flex:0 0 auto;width:18px;height:18px} .drawer .mms757-tick span{flex:1 1 auto} @media (max-width:640px){.ld-go{flex-wrap:wrap;justify-content:flex-end}}"
NEW = """.ld-qr svg{display:block;width:50px;height:50px}
/* v7.59 tidy set - the QR code, Navigate and Text it as one set: same height, same shape, even gaps */
.ld-go{display:flex;align-items:center;gap:10px;padding:8px 14px 8px 12px}
.ld-go .ld-qr{padding:3px;border-radius:10px;height:56px;box-sizing:border-box}
.ld-go .ld-nav,.ld-go .ld-txt{height:56px;box-sizing:border-box;padding:0 18px 0 14px;border-radius:999px;display:flex;align-items:center;gap:10px;flex:0 0 auto}
.ld-txt{background:linear-gradient(180deg,#2b343b,#151a1e);border:1px solid rgba(255,138,61,.6);color:#fff;cursor:pointer;font:inherit;text-align:left;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 10px 1px rgba(255,106,19,.12);transition:transform .12s,box-shadow .2s,border-color .2s,background .2s}
.ld-txt svg{width:21px;height:21px;fill:var(--ld-or,#ff6a13);flex:0 0 auto}
.ld-txt .ld-nav-t em{color:rgba(255,255,255,.72)}
.ld-txt:hover,.ld-txt:focus-visible{transform:translateY(-1px);border-color:#ff8a3d;background:linear-gradient(180deg,#34404a,#1a2026);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 16px 4px rgba(255,106,19,.38);outline:none}
.ld-txt:active{transform:translateY(0)}
.mms757-pic{position:relative;background:#0f1214;border-radius:10px;overflow:hidden;min-height:110px;display:flex;align-items:center;justify-content:center;color:#c9d1d9;font-size:13px;margin-top:4px} .mms757-pic img{display:block;width:100%;height:auto}
.drawer .mms757-tick{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;font:inherit;font-size:14px;line-height:1.35;text-transform:none;letter-spacing:0;color:inherit;cursor:pointer} .drawer .mms757-tick input{margin:3px 0 0;flex:0 0 auto;width:18px;height:18px} .drawer .mms757-tick span{flex:1 1 auto}
@media (max-width:640px){
 .ld-go{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;gap:8px 12px;align-items:stretch;justify-items:stretch;padding:10px 12px}
 .ld-go .ld-qr{grid-row:1/3;align-self:center;height:auto;padding:4px} .ld-go .ld-qr svg{width:92px;height:92px}
 .ld-go .ld-nav,.ld-go .ld-txt{height:46px;width:100%;min-width:0;padding:0 14px 0 12px;justify-content:flex-start}
 .ld-go .ld-nav-t b{font-size:16px}
}"""
t = rep(t, OLD, NEW, 'tidy set styles', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
