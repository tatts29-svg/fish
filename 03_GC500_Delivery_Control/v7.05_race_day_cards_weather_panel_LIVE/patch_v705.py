#!/usr/bin/env python3
"""v7.05 - THE RACE DAY CARDS, UPPED (DRAFT).
Andrew Fisher, 27 Sep 2026: "The weather on the race day cards is great and all. But they are tiny and small and they
kind of look like shit. So we need to up the ante on the Timeline race cards."

- The weather leaves the card's top corner (a 22 px icon squeezed beside TODAY, where it clipped) and becomes its own
  data plate on the card, in the gap that sat empty between the week line and the figures: a dark broadcast-style tile
  with a 32 px icon, the top and the low in Barlow Condensed ("21° / 16°"), a short condition word, the chance of rain
  as a bar and a figure, and the wind in km/h. Every plate is labelled FORECAST, and a source line under the strip says
  whose forecast it is, when it was fetched and which days it covers.
- A day the forecast does not reach says "No forecast yet" (and how far the forecast does run); a day that has passed
  says "No forecast". Nothing is drawn in the weather's place: no figures, no icon, just the words.
- Site-work flags on the plate, in words: HOT (top of 32° or more), WET (60 % chance of rain or more), WINDY (wind to
  40 km/h or more). Thresholds in WX_FLAG and in the source line.
- Due in / Due out in Barlow Condensed, bigger, as the second read after the date. Everything else on the card is as
  it was: the selected livery, TODAY, the weekend / holiday / event / demob marks, the chips, the lights bar.
Build on v7.10 (live; the day cards are as v7.04 left them).   python3 patch_v705.py <page.html>"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

JS = r"""/* v7.05 - THE WEATHER AS A PLATE ON THE RACE DAY CARD (the project manager, 27 Sep 2026: the weather on the cards was
 "tiny and small"). The same forecast rows, the same rules: a forecast is labelled a forecast, nothing is worked out
 or filled in, and a day the forecast does not reach shows the words "No forecast yet" and nothing else - no icon, no
 figure, no guess.

 THE FLAGS. Three conditions that change how a site crew works, flagged on the plate in words:
   HOT    the forecast top is 32 degrees or more   - heat-stress planning, water, shade, rest breaks
   WET    the chance of rain is 60 per cent or more - covers on deliveries, forklift and ground conditions
   WINDY  the wind reaches 40 km/h or more           - lifts, fencing and shade structures, loose loads
 They are working thresholds for site planning, not Bureau of Meteorology warnings, and the source line under the
 strip says so. A flag is the word; the safety-yellow chip only helps it be seen. */
const WX_FLAG = {hot: 32, wet: 60, wind: 40};
const wxNum = v => typeof v === 'number' && isFinite(v);
/* the condition in a word or two. The service's own text when it is short; a long one is summarised by the same
   eight pictures the icon uses, and the full text is always in the plate's title and in the card's label. */
function wxShort(kind, text){
 const s = String(text || '').trim(), t = s.toLowerCase();
 if (s && s.length <= 13) return s;
 if (kind === 'storm') return 'Storms';
 if (kind === 'pour') return 'Heavy rain';
 if (kind === 'rain') return /shower|patchy/.test(t) ? 'Showers' : /drizzle/.test(t) ? 'Drizzle' : /light/.test(t) ? 'Light rain' : 'Rain';
 if (kind === 'sleet') return /snow/.test(t) ? 'Snow' : 'Sleet';
 if (kind === 'fog') return /mist/.test(t) ? 'Mist' : 'Fog';
 if (kind === 'sun') return /clear/.test(t) ? 'Clear' : 'Sunny';
 if (kind === 'part') return 'Part cloud';
 return s ? s.split(/\s+/).slice(0, 2).join(' ') : 'Forecast';
}
function wxFlags(f){
 const out = [];
 if (wxNum(f.max_c) && f.max_c >= WX_FLAG.hot) out.push(['hot', 'HOT', 'Hot: a forecast top of ' + Math.round(f.max_c) + '°, at or over the ' + WX_FLAG.hot + '° site-work line']);
 if (wxNum(f.rain_pc) && f.rain_pc >= WX_FLAG.wet) out.push(['wet', 'WET', 'Wet: a ' + Math.round(f.rain_pc) + '% chance of rain, at or over the ' + WX_FLAG.wet + '% site-work line']);
 if (wxNum(f.wind_kph) && f.wind_kph >= WX_FLAG.wind) out.push(['wind', 'WINDY', 'Windy: wind to ' + Math.round(f.wind_kph) + ' km/h, at or over the ' + WX_FLAG.wind + ' km/h site-work line']);
 return out;
}
function wxWords(f){
 const hi = wxNum(f.max_c) ? Math.round(f.max_c) + '°' : '', lo = wxNum(f.min_c) ? Math.round(f.min_c) + '°' : '';
 const bits = [f.text, hi && lo ? hi + ' / ' + lo : hi, wxNum(f.rain_pc) ? 'rain ' + f.rain_pc + '%' : '',
  wxNum(f.wind_kph) ? 'wind to ' + Math.round(f.wind_kph) + ' km/h' : ''].filter(Boolean);
 const fl = wxFlags(f).map(x => x[1]);
 return bits.join(' · ') + (fl.length ? ' · flagged ' + fl.join(', ') : '') + ' — the weather service’s forecast';
}
/* the forecast's rows, oldest first, while they are fresh enough to show */
function wxfDates(){ return WXF.days && wxAgeMin(WXF.at) < WXF_STALE_MIN ? Object.keys(WXF.days).sort() : []; }
/* why a day has no forecast, in a few words, from what is actually known */
function wxNoneWhy(iso){
 if (String(iso) < todayIso()) return 'the day has passed';
 const ks = wxfDates();
 if (ks.length) { const z = ks[ks.length - 1]; if (String(iso) > z) { const x = fmtDay(z); return 'forecast runs to ' + x.dow + ' ' + x.dm; } return 'not in this forecast'; }
 if (WXF.state === 'loading' || WXF.state === 'idle') return 'asking the weather service';
 if (WXF.state === 'off') return 'laptop copy: no weather service';
 return 'weather service not reached';
}
/* what the plate is showing, as a short stamp: the paint redraws a plate only when this changes */
function wxSig(iso){ const f = wxfDay(iso); return f ? 'f' + [f.code, f.text, f.max_c, f.min_c, f.rain_pc, f.wind_kph].join('|') : 'n' + wxNoneWhy(iso); }
function wxAria(iso){ const f = wxfDay(iso);
 return 'Weather: ' + (f ? wxWords(f) : String(iso) < todayIso() ? 'no forecast, the day has passed' : 'no forecast yet, ' + wxNoneWhy(iso)); }
const WX_DROP = '<svg viewBox="0 0 10 12" aria-hidden="true"><path d="M5 1C3.5 3.5 1.6 5.6 1.6 7.7a3.4 3.4 0 0 0 6.8 0C8.4 5.6 6.5 3.5 5 1z"/></svg>';
const WX_WIND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5h10.5a2.8 2.8 0 1 0-2.8-2.8M3 12.5h15a3 3 0 1 1-3 3M3 16.5h7"/></svg>';
/* the plate on a day card: the forecast, or the honest words for a day it does not reach */
function wxCardHtml(iso){
 const f = wxfDay(iso), sig = esc(wxSig(iso));
 if (!f) {
  const past = String(iso) < todayIso();
  /* three elements and block layout: there are sixty-odd of these in the strip, so the label and the empty ring are drawn by the stylesheet */
  return `<span class="wxp nof${past ? ' past' : ''}" data-s="${sig}"><b class="wxnt">${past ? 'No forecast' : 'No forecast yet'}</b><em class="wxnw">${esc(wxNoneWhy(iso))}</em></span>`;
 }
 const kind = wxKind(f.code), words = wxWords(f), flags = wxFlags(f);
 const hi = wxNum(f.max_c) ? Math.round(f.max_c) + '°' : '', lo = wxNum(f.min_c) ? Math.round(f.min_c) + '°' : '';
 const rain = wxNum(f.rain_pc) ? Math.max(0, Math.min(100, Math.round(f.rain_pc))) : null, wind = wxNum(f.wind_kph) ? Math.round(f.wind_kph) : null;
 return `<span class="wxp f${flags.length > 1 ? ' nf2' : ''}" data-s="${sig}" title="${esc(words)}"><span class="wxh"><span class="wxsrc"><span class="l">Forecast</span><span class="s">Fcst</span></span>${flags.length ? `<span class="wxflags">${flags.map(x => `<span class="wxflag ${x[0]}" title="${esc(x[2])}">${x[1]}</span>`).join('')}</span>` : ''}</span>`
  + `<i class="wxi ${kind}">${wxIcon(kind)}</i><span class="wxm"><span class="wxtt">${hi ? `<b>${hi}</b>` : ''}${hi && lo ? '<span class="wxsl">/</span>' : ''}${lo ? `<em>${lo}</em>` : ''}</span><span class="wxc">${esc(wxShort(kind, f.text))}</span></span>`
  + `<span class="wxr">${rain !== null ? `<span class="wxrain" title="${rain}% chance of rain">${WX_DROP}<span class="wxbar"><i style="width:${rain}%"></i></span><b>${rain}%</b></span>` : '<span class="wxrain nil">rain: not given</span>'}${
     wind !== null ? `<span class="wxwind" title="wind to ${wind} km/h">${WX_WIND}<b>${wind}</b><em>km/h</em></span>` : ''}</span><span class="sr">${esc(words)}</span></span>`;
}
/* the source line under the strip: whose forecast, when it was fetched, which days, and what the flags mean */
function wxSrcLine(){
 const ks = wxfDates();
 const th = 'Site-work flags: HOT at ' + WX_FLAG.hot + '° or more, WET at a ' + WX_FLAG.wet + '% chance of rain or more, WINDY at ' + WX_FLAG.wind + ' km/h or more (working lines for planning, not weather warnings).';
 if (!ks.length) return `<b>Weather on the cards:</b> forecast, weather service: none to show yet${WXF.why ? ' (' + esc(WXF.why) + ')' : ''}. A day without a forecast says so. ${th}`;
 const a = fmtDay(ks[0]), z = fmtDay(ks[ks.length - 1]), t = WXF.at ? new Date(WXF.at) : null;
 return `<b>Weather on the cards:</b> forecast, weather service${t && !isNaN(t) ? ', fetched ' + two(t.getHours()) + ':' + two(t.getMinutes()) : ''} · covers ${esc(a.dow + ' ' + a.dm)} to ${esc(z.dow + ' ' + z.dm)}; a day past that says “No forecast yet”. ${th}`;
}
"""

PAINT_OLD = """function wxfPaint(){
 document.querySelectorAll('.dwx[data-wx]').forEach(el => { const h = wxDayHtml(el.dataset.wx, 'card'); if (h && el.innerHTML !== h) el.innerHTML = h; });"""
PAINT_NEW = """function wxfPaint(){
 /* v7.05 - a plate is redrawn only when what it says has changed, and the card's spoken label follows it */
 document.querySelectorAll('.dwx[data-wx]').forEach(el => { const iso = el.dataset.wx, cur = el.firstElementChild;
  if (cur && cur.dataset && cur.dataset.s === wxSig(iso)) return;
  el.innerHTML = wxCardHtml(iso);
  const b = el.closest('.day'), al = b ? b.getAttribute('aria-label') || '' : '', i = al.lastIndexOf('. Weather: ');
  if (i >= 0) b.setAttribute('aria-label', al.slice(0, i) + '. ' + wxAria(iso)); });
 document.querySelectorAll('[data-wxsrc]').forEach(el => { const h = wxSrcLine(); if (el._wxh !== h) { el.innerHTML = h; el._wxh = h; } });"""

CSS = r"""
/* ================================================================================================================
   v7.05 - THE RACE DAY CARDS, UPPED. The weather is a plate of its own on the card (a broadcast tile on a Coates data
   plate), the figures are in the race face, and nothing else changes meaning: orange is still where you are looking,
   every colour still has its words. No filters are added; the plate is one gradient on the few forecast days and a
   dashed outline on the rest.
   ================================================================================================================ */
.day .dface{gap:7px}
.day .dwx.wxb{display:block;min-height:0;margin:1px 0 0}
.day .wxp{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr);grid-template-rows:11px 32px 13px;
  column-gap:9px;row-gap:4px;align-items:center;height:78px;padding:6px 9px 7px 10px;border-radius:9px 0 9px 0;
  font-family:'Inter',var(--sans,system-ui,sans-serif);text-align:left}
.day .wxp.f{background:linear-gradient(180deg,#2c2e33 0%,#17181b 100%);color:#f4f1ec;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 0 0 1px #0c0d0f}
.day .wxh{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;height:11px}
.day .wxsrc{display:block;min-width:0;padding-left:10px;font-size:8px;line-height:11px;font-weight:800;letter-spacing:.12em;
  text-transform:uppercase;color:#a9b1b9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:linear-gradient(#7d8791,#7d8791) 0 50%/6px 2px no-repeat}
.day .wxsrc .s{display:none}
.day .wxflags{display:inline-flex;gap:3px;flex:0 0 auto}
.day .wxflag{display:inline-block;padding:1px 3px 1px 7px;border-radius:2px;font-size:7.5px;line-height:9px;font-weight:900;
  letter-spacing:.06em;color:#15120c;
  background:repeating-linear-gradient(135deg,#15120c 0 1.5px,#ffd21a 1.5px 3px) 0 0/4px 100% no-repeat,#ffd21a}
.day .wxp .wxi{width:32px;height:32px;color:#eef1f4;justify-self:center}
.day .wxp .wxi svg{width:32px;height:32px}
.day .wxp .wxi .c{fill:#d3d9e0;stroke:#f4f6f8}
.day .wxp .wxi .s{fill:#ffc53d;stroke:#ffb020} .day .wxp .wxi .rays{stroke:#ffb020}
.day .wxp .wxi .d{stroke:#5cb6ff} .day .wxp .wxi .b{fill:#ffd21a;stroke:#e0a800}
.day .wxm{display:flex;flex-direction:column;justify-content:center;min-width:0;gap:3px}
.day .wxtt{display:flex;align-items:baseline;white-space:nowrap;line-height:.9;
  font-family:'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);font-style:italic;font-weight:700;font-variant-numeric:tabular-nums}
.day .wxtt b{font-size:25px;font-weight:700;color:#fff;letter-spacing:0}
.day .wxtt .wxsl{font-size:15px;color:#6f7881;margin:0 3px 0 2px;font-style:normal}
.day .wxtt em{font-size:18px;font-style:italic;color:#b9c1c9}
.day .wxc{display:block;font-size:10px;line-height:1.15;font-weight:700;letter-spacing:.02em;color:#d8dde2;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.day .wxr{grid-column:1/-1;display:flex;align-items:center;gap:9px;min-width:0;height:14px}
.day .wxrain{flex:1 1 auto;display:flex;align-items:center;gap:5px;min-width:0}
.day .wxrain svg{flex:0 0 auto;width:8px;height:10px;fill:#5cb6ff}
.day .wxbar{flex:1 1 auto;min-width:14px;height:4px;border-radius:2px;background:rgba(255,255,255,.16);overflow:hidden}
.day .wxbar i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#3d8fe0,#6cc2ff)}
.day .wxr b{font-size:10.5px;line-height:1;font-weight:800;color:#fff;font-variant-numeric:tabular-nums}
.day .wxrain.nil{font-size:9px;font-weight:600;color:#a9b1b9}
.day .wxwind{flex:0 0 auto;display:inline-flex;align-items:center;gap:3px}
.day .wxwind svg{width:12px;height:12px;fill:none;stroke:#b9c1c9;stroke-width:2.2;stroke-linecap:round}
.day .wxwind em{font-size:9px;font-style:normal;font-weight:600;color:#a9b1b9}
/* a day with no forecast: the words, calm, in the same footprint so the strip keeps one height */
.day .wxp.nof{display:block;padding:25px 8px 0 50px;border:1px dashed rgba(127,127,127,.45);color:var(--mute)}
.day .wxp.nof::before{content:'Weather';position:absolute;left:10px;top:6px;padding-left:10px;font-size:8px;line-height:11px;font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;color:var(--mute);background:linear-gradient(var(--rule),var(--rule)) 0 50%/6px 2px no-repeat}
.day .wxp.nof::after{content:'';position:absolute;left:14px;top:32px;width:24px;height:24px;border:1.5px dashed currentColor;border-radius:50%;opacity:.5}
.day .wxnt{display:block}
.day .wxnw{display:block;margin-top:2px}
.day .wxnt{font-size:12px;line-height:1.15;font-weight:800;color:var(--ink2)}
.day .wxnw{font-size:9.5px;line-height:1.25;font-style:normal;font-weight:600;color:var(--mute);overflow:hidden;max-height:3.75em}
.day.on .wxp.nof{border-color:rgba(27,18,7,.38);color:rgba(27,18,7,.72)}
.day.on .wxp.nof::before,.day.on .wxnt{color:#1b1207}
.day.on .wxnw{color:rgba(27,18,7,.74)}
.day.on .wxp.nof::before{background-image:linear-gradient(#1b1207,#1b1207)}
.day.on .wxp.f{box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 0 0 1px #1b1207,0 4px 10px -4px rgba(27,18,7,.5)}
/* the figures in the race face: Due in is the second read after the date, Due out beside it and never hidden */
.day .dfig{align-items:flex-end}
.day .dfig b{font-family:'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);font-style:italic;font-weight:700;letter-spacing:0;line-height:.88}
.day .dfig .din b{font-size:36px}
.day .dfig .dout b{font-size:26px}
.day .dfig em{font-size:8.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:2px}
.day .dpan{border-radius:9px 0 9px 0;gap:7px}
.wxsrcline{margin:-6px 2px 12px;font-size:11px;line-height:1.5;color:var(--mute)}
.wxsrcline b{color:var(--ink2);font-weight:700}
/* dark: the paper-white sheen at the top of every card read as a grey fog on a dark face and hid SAT and SUN */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .day:not(.on) .dface{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0) 54px),var(--face)}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .day .wxp.f{background:linear-gradient(180deg,#111214 0%,#08090a 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 0 1px #3b3431}}
html[data-motion="off"] .wxi.sun .rays,html[data-motion="off"] .wxi.part .rays{animation:none}
@media (max-width:470px){
  .day .wxp{grid-template-columns:28px minmax(0,1fr);grid-template-rows:11px 28px 13px;column-gap:7px;row-gap:4px;height:74px;padding:6px 8px 7px}
  .day .wxp.nof{padding:24px 7px 0 44px} .day .wxp.nof::before{left:8px} .day .wxp.nof::after{left:10px;top:30px;width:22px;height:22px}
  .day .wxp.nf2 .wxsrc .l{display:none} .day .wxp.nf2 .wxsrc .s{display:inline}
  .day .wxp .wxi,.day .wxp .wxi svg{width:28px;height:28px}
  .day .wxtt b{font-size:23px} .day .wxtt em{font-size:16px} .day .wxr{gap:7px}
  .day .wxsrc{letter-spacing:.1em;padding-left:9px}
  .day .dfig .din b{font-size:31px} .day .dfig .dout b{font-size:23px} }
@media (max-width:360px){ .day .wxp{padding:7px 7px 8px;column-gap:6px} .day .wxwind em{display:none} }
@media print{ .day .wxp.f,.day .wxflag,.day .wxbar i{-webkit-print-color-adjust:exact;print-color-adjust:exact} }
"""


def patch(path, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function wxCardHtml(' in t: sys.exit('v7.05 already applied')
    if 'function dpPlate(' not in t: sys.exit('apply v7.04 first')
    for name, src in (('JS', JS), ('PAINT', PAINT_NEW)):
        bad = re.findall(r" \.", src)
        if bad: sys.exit('%s holds a space before a dot, which the attribution scrub folds' % name)
    # 1. the helpers, beside the forecast's paint
    t = rep(t, "function wxfPaint(){", JS + "function wxfPaint(){", 'helpers', path, need)
    # 2. the paint: the plates, their labels and the source line
    t = rep(t, PAINT_OLD, PAINT_NEW, 'paint', path, need)
    # 3. wxDayHtml's card mode is the plate (the heading's line mode is unchanged and still says nothing when nothing is known)
    t = rep(t, "function wxDayHtml(iso, mode){\n const f = wxfDay(iso); if (!f) return '';",
            "function wxDayHtml(iso, mode){\n if (mode === 'card') return wxCardHtml(iso); /* v7.05 - the plate, or the words for a day without one */\n const f = wxfDay(iso); if (!f) return '';",
            'wxDayHtml', path, need)
    # 4. the card: the weather out of the top corner ...
    t = rep(t, """isToday ? '<span class="dtoday"><i aria-hidden="true"></i>TODAY</span>' : ''}<span class="dwx" data-wx="${d.iso}">${wxDayHtml(d.iso, 'card')}</span></span></span>""",
            """isToday ? '<span class="dtoday"><i aria-hidden="true"></i>TODAY</span>' : ''}</span></span>""", 'head', path, need)
    # ... and onto its own plate under the week line
    t = rep(t, """<span class="dwk"><i aria-hidden="true"></i>${esc(week)}${phase ? ' · ' + esc(phase) : ''}</span>""",
            """<span class="dwk"><i aria-hidden="true"></i>${esc(week)}${phase ? ' · ' + esc(phase) : ''}</span>
 <span class="dwx wxb" data-wx="${d.iso}">${wxCardHtml(d.iso)}</span>""", 'plate', path, need)
    # 5. the card's spoken label carries the weather too
    t = rep(t, """lateNone ? ', ' + lateNone + ' with no delivery record' : ''}">""",
            """lateNone ? ', ' + lateNone + ' with no delivery record' : ''}. ${esc(wxAria(d.iso))}">""", 'aria', path, need)
    # 6. the source line under the strip
    t = rep(t, """<div class="daystrip" role="group" aria-label="Pick a programme day">${days.map(card).join('')}</div>""",
            """<div class="daystrip" role="group" aria-label="Pick a programme day">${days.map(card).join('')}</div>
 <p class="wxsrcline" data-wxsrc>${wxSrcLine()}</p>""", 'source', path, need)
    k = t.find('</style>')
    if k < 0: sys.exit('no </style>')
    t = t[:k] + CSS.lstrip('\n') + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1])
