#!/usr/bin/env python3
"""v5.93 - SMOOTH, NO LAG (Andrew Fisher, 25 Sep 2026). Measured on a phone profile throttled four times: Where we
are took 9 s to draw and the first tap on a tab was lost in it. The profile put most of that in isoIn(), which
built a new Intl.DateTimeFormat on every call, thousands of times a render. Now: one formatter, made once; today's
date cached for a second; the KPI fitter reads then writes once instead of thrashing layout; the Plant page paints
its plant lines first and draws the register a moment later; a tapped tab lights up before its page is drawn; and
the banner's race-day pod carries the full countdown, hours:minutes:seconds ticking beside the days. And the lost
first tap, found: the header car's reflection hung over Today and Where we are in the tab bar and took the tap.
python3 patch_v593.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

rep("""function isoIn(when){
  const t = when instanceof Date ? when : new Date(when);
  if (isNaN(t)) return '';
  try {
    const s = new Intl.DateTimeFormat('en-CA', {timeZone: EVENT_TZ, year: 'numeric', month: '2-digit', day: '2-digit'}).format(t);
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return s;
  } catch (e) {}
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
const todayIso = () => isoIn(new Date());""",
"""/* v5.93 - ONE formatter, made once. This used to build a new Intl.DateTimeFormat on every call — and a render of
   Where we are calls it thousands of times — which was most of the time a phone spent drawing a page. */
let ISO_FMT = null;
function isoIn(when){
  const t = when instanceof Date ? when : new Date(when);
  if (isNaN(t)) return '';
  try {
    if (!ISO_FMT) ISO_FMT = new Intl.DateTimeFormat('en-CA', {timeZone: EVENT_TZ, year: 'numeric', month: '2-digit', day: '2-digit'});
    const s = ISO_FMT.format(t);
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return s;
  } catch (e) {}
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
/* today's date on the Gold Coast, asked for constantly during a render: worked out once a second */
const TODAY_ISO = {at: 0, v: ''};
const todayIso = () => { const now = Date.now(); if (!TODAY_ISO.v || now - TODAY_ISO.at > 1000) { TODAY_ISO.v = isoIn(new Date(now)); TODAY_ISO.at = now; } return TODAY_ISO.v; };""", 'one date formatter')
rep("""function fitKpis(){
  document.querySelectorAll('.kpi .v').forEach(v => {
    v.style.fontSize = '';
    if (v.scrollWidth <= v.clientWidth + 1) return;
    let px = parseFloat(getComputedStyle(v).fontSize) || 38;
    for (let i = 0; i < 12 && v.scrollWidth > v.clientWidth + 1 && px > 16; i++) { px -= 2; v.style.fontSize = px + 'px'; }
  });
}""",
"""function fitKpis(){
  /* v5.93 - read everything, then write once: the loop of shrink-and-measure forced a layout per step per figure */
  const els = [...document.querySelectorAll('.pane.on .kpi .v')]; if (!els.length) return;
  els.forEach(v => { v.style.fontSize = ''; });
  const m = els.map(v => ({v, sw: v.scrollWidth, cw: v.clientWidth, px: parseFloat(getComputedStyle(v).fontSize) || 38}));
  m.forEach(({v, sw, cw, px}) => { if (sw > cw + 1) v.style.fontSize = Math.max(16, Math.floor(px * cw / sw) - 1) + 'px'; });
}""", 'kpi fitter')
rep("""  else if (state.tab === 'plant') { renderPlant(); plantCarriesRegister(); }""",
    """  else if (state.tab === 'plant') { renderPlant(); setTimeout(() => { if (state.tab === 'plant' && !$('#pane-plant #pane-register')) plantCarriesRegister(); }, 40); }   /* v5.93 - plant lines paint first, the register a moment later */""", 'register after paint')
rep("""      if (b.dataset.tab === state.tab) { TAB_SCROLL[state.tab] = 0; navScrollTo(0); return; }
      go(b.dataset.tab); } };""",
    """      if (b.dataset.tab === state.tab) { TAB_SCROLL[state.tab] = 0; navScrollTo(0); return; }
      /* v5.93 - the tapped tab lights up on this frame; its page is drawn on the next, so the press is answered at once */
      b.classList.add('busy'); requestAnimationFrame(() => setTimeout(() => { go(b.dataset.tab); }, 0)); } };""", 'instant tab answer')
rep("""    tm.onclick = e => { const g = e.target.closest('[data-goto]'); if (g) { closeTabMore(); go(g.dataset.goto); } };""",
    """    tm.onclick = e => { const g = e.target.closest('[data-goto]'); if (g) { closeTabMore(); g.classList.add('busy'); requestAnimationFrame(() => setTimeout(() => go(g.dataset.goto), 0)); } };""", 'instant menu answer')
rep("""     <span class="num"><b id="hzcdN">—</b><small id="hzcdU">DAYS</small></span>""",
    """     <span class="num"><b id="hzcdN">—</b><small id="hzcdU">DAYS</small><small class="cdt" id="hzcdT" aria-label="hours, minutes and seconds to race day"></small></span>""", 'countdown markup')
rep("""function tpodPaint(at){
  const r = tpodRead(at), num = $('#tpodNum');""",
    """/* v5.93 - the banner's race-day pod carries the full countdown: whole days, then hours:minutes:seconds to midnight
   on race day on the Gold Coast, ticking with the clock */
function hzCountdownTick(at){
  const el = $('#hzcdT'); if (!el) return;
  const race = (DATA.race_days || [])[0]; if (!race) { el.textContent = ''; return; }
  const left = new Date(race + 'T00:00:00+10:00') - (at instanceof Date ? at.getTime() : (at || Date.now()));
  if (!(left > 0)) { el.textContent = ''; return; }
  const d = Math.floor(left / 86400000), h = Math.floor(left / 3600000) % 24, m = Math.floor(left / 60000) % 60, sec = Math.floor(left / 1000) % 60;
  const n = $('#hzcdN'), u = $('#hzcdU'); if (n && n.textContent !== String(d)) { n.textContent = String(d); if (u) u.textContent = d === 1 ? 'DAY' : 'DAYS'; }
  el.textContent = [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}
function tpodPaint(at){
  hzCountdownTick(at);
  const r = tpodRead(at), num = $('#tpodNum');""", 'countdown tick')
rep(""".hzpod .num small{font:600 11px/1 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.16em;margin-left:7px;color:#b8c2c1;vertical-align:.32em;text-shadow:none}""",
    """.hzpod .num small{font:600 11px/1 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.16em;margin-left:7px;color:#b8c2c1;vertical-align:.32em;text-shadow:none}
.hzpod .num small.cdt{font:700 16px/1 'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);font-style:italic;letter-spacing:.04em;color:#ff9a4d;vertical-align:.22em;margin-left:9px;font-variant-numeric:tabular-nums;text-shadow:0 0 8px rgba(255,106,19,.35)}
.hzpod .num small.cdt:empty{display:none}
/* v5.93 - a tapped tab answers at once: lit while its page is drawn */
nav.tabs button.busy,#tabMoreMenu button.busy{color:#fff;background:rgba(255,106,19,.16)}""", 'countdown and busy css')
rep(""".hzcarref{position:absolute;left:0;top:68px;width:228px;transform:scaleY(-1);opacity:.2;-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 70%);mask-image:linear-gradient(180deg,transparent 0%,#000 70%)}""",
    """.hzcarref{position:absolute;left:0;top:68px;width:228px;transform:scaleY(-1);opacity:.2;-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 70%);mask-image:linear-gradient(180deg,transparent 0%,#000 70%);pointer-events:none}
/* v5.93 - THE LOST FIRST TAP, FOUND: the car's reflection (v5.87) hung 84 px below the brand row, over Today and
   Where we are in the tab bar, and took the tap meant for them. No decoration in the header takes a pointer now. */
.brandrow .hzcarref,.brandrow .hzcar img,.hzscene,.hzscene *{pointer-events:none}""", 'header decoration takes no pointer')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.93', n0, '->', len(s))
