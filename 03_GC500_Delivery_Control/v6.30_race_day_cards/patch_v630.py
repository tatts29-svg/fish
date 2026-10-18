#!/usr/bin/env python3
"""v6.30 - RACE DAY CARDS WITH THE WEATHER ON THEM (Andrew Fisher, 26 Sep 2026, with his mock-up: "Race daycards only idea.
U need ti go better. We have a weather api. Use it. We can add weather to th days").

The Timeline's day cards, rebuilt to his picture: a carbon strip along the top under an orange hairline, the day top-left,
the weather top-right (the sky as a drawn icon, the high and the low), the date as a bigger race number, the month and
year, the programme week and phase, the Due in / Due out plate with an on-site progress bar under it, and a footer with a
Coates Way value and a chequered flag. The selected day wears the livery as before; today keeps its badge.

The weather is the day-by-day forecast from the weather service (the hosted copy asks its own service, which holds the
key; a copy on a laptop with a key in the browser asks weatherapi.com itself). A card whose day the forecast covers shows
it; every other card shows nothing - no guessed sky, no blank icon. The forecast is held in the browser for an hour and
painted onto the cards in place when it arrives, so nothing redraws and nothing jumps. The selected day's heading carries
the same reading in words.

  python3 patch_v630.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

# ---------------------------------------------------------------------------------------------------- the card markup
OLD_CARD_FN = """  const card = d => {
    const t = lightTally(d.deliveries.map(r => r.a));"""
NEW_CARD_FN = """  const card = (d, ci) => {
    const t = lightTally(d.deliveries.map(r => r.a));"""

OLD_HEAD = """        <span class="dhead"><span class="dow">${esc(dt.dow)}</span>${
          isToday ? '<span class="dtoday"><i aria-hidden="true"></i>TODAY</span>' : ''}</span>"""
NEW_HEAD = """        <span class="dhead"><span class="dow">${esc(dt.dow)}</span><span class="dhr">${
          isToday ? '<span class="dtoday"><i aria-hidden="true"></i>TODAY</span>' : ''}<span class="dwx" data-wx="${d.iso}">${wxDayHtml(d.iso, 'card')}</span></span></span>"""

OLD_LIGHTS = """          <span class="lights" aria-hidden="true">${d.deliveries.length ? seg('g', t.green) + seg('a', t.amber) + seg('r', t.red) + seg('n', t.none) : '<i class="n" style="flex:1"></i>'}</span>
        </span>
        <span class="dfoot"><span class="dsel">${on ? 'Selected' : ''}</span><span class="dslash" aria-hidden="true">//</span></span>"""
NEW_LIGHTS = """          ${d.deliveries.length ? `<span class="dprog"><em>On site</em><b>${t.green}<i>/${d.deliveries.length}</i></b></span>` : ''}
          <span class="lights" aria-hidden="true">${d.deliveries.length ? seg('g', t.green) + seg('a', t.amber) + seg('r', t.red) + seg('n', t.none) : '<i class="n" style="flex:1"></i>'}</span>
        </span>
        <span class="dfoot">${on ? '<span class="dsel">Selected</span>' : `<span class="dmotto">${esc(COATES_WAY_VALUES[(ci || 0) % COATES_WAY_VALUES.length])}</span>`}<i class="dflag" aria-hidden="true"></i></span>"""

# the selected day's heading carries the reading in words
OLD_DAYH = """      <div><h3>${esc(fmtDate(d.iso))}</h3>"""
NEW_DAYH = """      <div><h3>${esc(fmtDate(d.iso))}<span class="daywx" data-wxday="${esc(d.iso)}">${wxDayHtml(d.iso, 'line')}</span></h3>"""

# the forecast is asked for when the Timeline draws, and painted onto the cards in place when it arrives
OLD_WIRE = """  const pane = $('#pane-timeline');
  raceMount(pane);"""
NEW_WIRE = """  const pane = $('#pane-timeline');
  raceMount(pane);
  wxfLoad(wxfPaint);   /* v6.30 - the forecast onto the day cards, in place, when it arrives */"""

# ---------------------------------------------------------------------------------------------------- the forecast
OLD_WX = """function wxCacheWrite(d){ try { localStorage.setItem(WX_CACHE, JSON.stringify({d, at: new Date().toISOString()})); } catch (e) {} }"""
NEW_WX = """function wxCacheWrite(d){ try { localStorage.setItem(WX_CACHE, JSON.stringify({d, at: new Date().toISOString()})); } catch (e) {} }

/* ------------------------------------------------------------------------------------------------- the forecast
   v6.30 (Andrew Fisher, 26 Sep 2026: "We have a weather api. Use it. We can add weather to the days"). The day-by-day
   forecast for the day cards. Same rules as the reading above: the hosted copy asks its own service, a laptop copy with
   a key asks weatherapi.com itself, nothing is guessed, and a day the forecast does not cover shows nothing. Held for an
   hour; a forecast up to twelve hours old is still shown, because this morning's forecast is still a forecast. */
const WXF_CACHE = 'gc500.weather.forecast';
const WXF_FRESH_MIN = 60, WXF_STALE_MIN = 720;
let WXF = {state: 'idle', days: null, at: null, why: null, q: []};
const COATES_WAY_VALUES = ['Care Deeply', 'Customer Focused', 'Be Our Best', 'One Team', 'Competitive Spirit'];
function wxfTrim(j){
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  let rows = null;
  if (j && Array.isArray(j.days)) rows = j.days;                       /* our own service, already trimmed */
  else if (j && j.forecast && Array.isArray(j.forecast.forecastday))    /* weatherapi.com direct */
    rows = j.forecast.forecastday.map(f => { const d = f.day || {}, a = f.astro || {};
      return {date: f.date, code: num((d.condition || {}).code), text: (d.condition || {}).text || null,
              max_c: num(d.maxtemp_c), min_c: num(d.mintemp_c), avg_c: num(d.avgtemp_c), rain_pc: num(d.daily_chance_of_rain),
              rain_mm: num(d.totalprecip_mm), wind_kph: num(d.maxwind_kph), humidity: num(d.avghumidity),
              sunrise: a.sunrise || null, sunset: a.sunset || null}; });
  if (!rows) return null;
  const days = {};
  rows.forEach(r => { if (r && r.date && num(r.max_c) !== null) days[String(r.date).slice(0, 10)] = r; });
  return Object.keys(days).length ? days : null;
}
function wxfCacheRead(){ try { const r = JSON.parse(localStorage.getItem(WXF_CACHE) || 'null'); return r && r.days && r.at ? r : null; } catch (e) { return null; } }
function wxfCacheWrite(days){ try { localStorage.setItem(WXF_CACHE, JSON.stringify({days, at: new Date().toISOString()})); } catch (e) {} }
function wxfLoad(onDone){
  const done = () => { const q = WXF.q.splice(0); if (onDone) q.push(onDone); q.forEach(f => { try { f(); } catch (e) {} }); };
  if (WXF.state === 'loading') { if (onDone) WXF.q.push(onDone); return; }
  const cached = wxfCacheRead();
  if (cached && wxAgeMin(cached.at) < WXF_FRESH_MIN) { WXF = {state: 'ok', days: cached.days, at: cached.at, why: null, q: WXF.q}; return done(); }
  const key = wxKey();
  if (!wxHosted() && !key) {
    WXF = {state: 'off', days: cached && wxAgeMin(cached.at) < WXF_STALE_MIN ? cached.days : null, at: cached ? cached.at : null,
           why: 'this copy is a file on your laptop, so there is no service to hold the key', q: WXF.q};
    return done();
  }
  WXF = {state: 'loading', days: WXF.days, at: WXF.at, why: null, q: WXF.q};
  const viaService = wxHosted() && !key;
  const url = viaService ? '/api/weather/forecast'
            : 'https://api.weatherapi.com/v1/forecast.json?key=' + encodeURIComponent(key || '') + '&q=' + encodeURIComponent(WX_Q) + '&days=7&aqi=no&alerts=no';
  const opts = {cache: 'no-store'};
  if (viaService) { const t = wxToken(); if (t) opts.headers = {'x-gc500-token': t}; }
  const fail = why => { const c = wxfCacheRead();
    WXF = {state: 'error', days: c && wxAgeMin(c.at) < WXF_STALE_MIN ? c.days : null, at: c ? c.at : null, why, q: WXF.q}; done(); };
  let timer = setTimeout(() => fail('the weather service did not answer'), 9000);
  fetch(url, opts).then(r => {
    if (r.ok) return r.json();
    return r.json().catch(() => null).then(j => {
      const said = j && typeof j.error === 'string' ? j.error : null;
      throw new Error(said || (r.status === 401 || r.status === 403 ? 'the weather service refused the key'
                             : r.status === 503 ? 'no key is set on the service yet' : 'the weather service answered ' + r.status));
    });
  }).then(j => {
    clearTimeout(timer);
    const days = wxfTrim(j);
    if (!days) return fail('the weather service answered without a forecast');
    WXF = {state: 'ok', days, at: new Date().toISOString(), why: null, q: WXF.q};
    wxfCacheWrite(days); done();
  }).catch(e => { clearTimeout(timer); fail(String(e && e.message || e) || 'the forecast could not be fetched'); });
}
/* the forecast row for a day, or null - a day outside the forecast is simply not known */
function wxfDay(iso){
  if (!WXF.days || wxAgeMin(WXF.at) >= WXF_STALE_MIN) return null;
  return WXF.days[String(iso || '').slice(0, 10)] || null;
}
/* the sky as a drawing. weatherapi.com's condition codes fall into eight pictures; anything unknown is a cloud. */
function wxKind(code){
  const c = Number(code);
  if (c === 1000) return 'sun';
  if (c === 1003) return 'part';
  if (c === 1006 || c === 1009) return 'cloud';
  if (c === 1030 || c === 1135 || c === 1147) return 'fog';
  if ([1087, 1273, 1276, 1279, 1282].includes(c)) return 'storm';
  if ([1192, 1195, 1243, 1246].includes(c)) return 'pour';
  if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1198, 1201, 1240].includes(c)) return 'rain';
  if (c >= 1066 && c <= 1282) return 'sleet';
  return 'cloud';
}
function wxIcon(kind){
  const cloud = '<path class="c" d="M7 18.5h9.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 5.6 12.1 3.25 3.25 0 0 0 7 18.5z"/>';
  const drops = n => [...Array(n)].map((_, i) => `<path class="d" d="M${8.5 + i * 2.6} 20.2l-.9 1.9"/>`).join('');
  const P = {
    sun: '<g class="rays"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></g><circle class="s" cx="12" cy="12" r="4.2"/>',
    part: '<g class="rays"><path d="M15 2.8v1.8M20.2 5.1l-1.3 1.3M22.2 10.5h-1.8"/></g><circle class="s" cx="15.2" cy="9.4" r="3.1"/><path class="c" d="M6.5 20h8.3a3.5 3.5 0 0 0 .5-6.96A5.2 5.2 0 0 0 5.3 14.5 2.8 2.8 0 0 0 6.5 20z"/>',
    cloud: cloud,
    fog: '<path class="c" d="M7 15h9.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 5.6 8.6 3.25 3.25 0 0 0 7 15z"/><path class="d" d="M5 18.5h13M7.5 21.5h9"/>',
    rain: cloud + drops(3),
    pour: cloud + drops(4) + '<path class="d" d="M7.2 20.2l-.9 1.9"/>',
    storm: cloud + '<path class="b" d="M12.6 15.5l-2.1 3.6h2.4l-1.4 3.2 3.8-4.6h-2.4l1.2-2.2z"/>',
    sleet: cloud + '<path class="d" d="M9 20.4l.01.01M12 21.6l.01.01M15 20.4l.01.01"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[kind] || P.cloud}</svg>`;
}
/* what a day card (mode 'card') or the day heading (mode 'line') shows for its day - '' when nothing is known */
function wxDayHtml(iso, mode){
  const f = wxfDay(iso); if (!f) return '';
  const kind = wxKind(f.code);
  const hi = f.max_c !== null && f.max_c !== undefined ? Math.round(f.max_c) + '°' : '';
  const lo = f.min_c !== null && f.min_c !== undefined ? Math.round(f.min_c) + '°' : '';
  const bits = [f.text, hi && lo ? hi + ' / ' + lo : hi, f.rain_pc !== null && f.rain_pc !== undefined ? 'rain ' + f.rain_pc + '%' : '',
                f.wind_kph !== null && f.wind_kph !== undefined ? 'wind to ' + Math.round(f.wind_kph) + ' km/h' : ''].filter(Boolean);
  const words = bits.join(' · ') + ' — the weather service\\u2019s forecast';
  if (mode === 'line')
    return `<i class="wxi ${kind}">${wxIcon(kind)}</i><span class="wxw">${esc(bits.join(' · '))}</span><small>forecast, weather service</small>`;
  return `<i class="wxi ${kind}" title="${esc(words)}">${wxIcon(kind)}</i><span class="wxt" title="${esc(words)}"><b>${hi}</b>${lo ? `<em>${lo}</em>` : ''}</span><span class="sr">${esc(words)}</span>`;
}
/* paint the forecast onto whatever is drawn, in place - no redraw, nothing moves */
function wxfPaint(){
  document.querySelectorAll('.dwx[data-wx]').forEach(el => { const h = wxDayHtml(el.dataset.wx, 'card'); if (h && el.innerHTML !== h) el.innerHTML = h; });
  document.querySelectorAll('.daywx[data-wxday]').forEach(el => { const h = wxDayHtml(el.dataset.wxday, 'line'); if (h && el.innerHTML !== h) el.innerHTML = h; });
}"""

# a day outside every programme week said so in twenty-three characters, which the card cut off; seventeen fit
OLD_NOWEEK = """const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : 'NOT IN A PROGRAMME WEEK';"""
NEW_NOWEEK = """const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : 'NO PROGRAMME WEEK';"""

# ---------------------------------------------------------------------------------------------------- the look
OLD_END = """/* v6.28 - GC500 in white, not brushed silver (Andrew Fisher, 26 Sep 2026) */
.wordmark .gc{background:none;-webkit-background-clip:initial;background-clip:initial;-webkit-text-fill-color:#fff;color:#fff;text-shadow:0 2px 3px rgba(0,0,0,.85),0 0 16px rgba(0,0,0,.6)}
</style></head>"""
NEW_END = """/* v6.28 - GC500 in white, not brushed silver (Andrew Fisher, 26 Sep 2026) */
.wordmark .gc{background:none;-webkit-background-clip:initial;background-clip:initial;-webkit-text-fill-color:#fff;color:#fff;text-shadow:0 2px 3px rgba(0,0,0,.85),0 0 16px rgba(0,0,0,.6)}
/* ================================================================================================================
   v6.30 - RACE DAY CARDS (Andrew Fisher, 26 Sep 2026, from his mock-up). A carbon strip under an orange hairline along
   the top, the day left and the weather right, a bigger race number, the week and phase, the Due in / Due out plate with
   the on-site bar under it, and a Coates Way value with a chequered flag in the footer. The selected day keeps the livery.
   ================================================================================================================ */
.day{width:192px;min-width:192px}
.day .dface{position:relative;padding:24px 13px 10px;gap:8px}
.day .dface::before{content:"";position:absolute;left:0;top:0;right:0;height:11px;pointer-events:none;
  background:radial-gradient(rgba(255,255,255,.11) 16%,transparent 17%) 0 0/4px 4px,
             radial-gradient(rgba(255,255,255,.11) 16%,transparent 17%) 2px 2px/4px 4px,
             linear-gradient(180deg,#3a3b40,#131315);
  border-bottom:2px solid var(--orange)}
.day.on .dface::before{border-bottom-color:#1b1207}
.dhead{min-height:22px}
.dhr{display:inline-flex;align-items:center;gap:6px;min-width:0;margin-left:auto}
.dtoday{margin-right:0}
.dwx{display:inline-flex;align-items:center;gap:4px;min-height:22px}
.dwx:empty{display:none}
.wxi{display:inline-flex;width:22px;height:22px;flex:0 0 auto;color:var(--slate)}
.wxi svg{width:22px;height:22px;display:block;overflow:visible}
.wxi .s{fill:#ffb347;stroke:#e8862c} .wxi .rays{stroke:#f0932b}
.wxi.sun .rays,.wxi.part .rays{transform-origin:12px 12px;animation:v630rays 48s linear infinite}
.wxi.part .rays{transform-origin:15.2px 9.4px}
.wxi .c{fill:rgba(140,150,160,.22)} .wxi .d{stroke:#3b8fd9} .wxi .b{fill:#f5b21b;stroke:#c98607;stroke-width:1.1}
.wxt{display:inline-flex;align-items:baseline;gap:3px;line-height:1;white-space:nowrap}
.wxt b{font-size:13px;font-weight:800;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.wxt em{font-size:10.5px;font-style:normal;font-weight:600;color:var(--mute);font-variant-numeric:tabular-nums}
.dwx .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.dnum .dd{font-size:66px;text-shadow:0 1px 0 rgba(255,255,255,.7)}
.dprog{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);margin-top:-1px}
.dprog b{font-size:12px;letter-spacing:0;color:var(--green,#1f8a4c);font-variant-numeric:tabular-nums}
.dprog b i{font-style:normal;font-weight:700;font-size:10.5px;color:var(--mute)}
.day .lights{height:7px;gap:0;background:var(--rule);border-radius:5px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.18)}
.day .lights i{height:7px;border-radius:0;min-width:3px;transition:flex .5s cubic-bezier(.2,.7,.2,1)}
.day .lights .n{background:transparent}
.day .lights .g{background:linear-gradient(180deg,#3fd27a,#1f9d4f)}
.dfoot{align-items:center;padding-left:0;min-height:16px}
.dmotto{font-size:8.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dflag{flex:0 0 auto;width:19px;height:12px;border-radius:2px;margin-left:auto;transform:skewX(-10deg);
  background:repeating-conic-gradient(#1b1207 0 25%,#f4f0ea 0 50%) 0 0/6px 6px;box-shadow:0 1px 2px rgba(0,0,0,.28)}
.day:hover .dflag{animation:v630wave .55s ease}
.day.on .dmotto,.day.on .wxt b{color:#1b1207} .day.on .wxt em{color:rgba(27,18,7,.72)} .day.on .wxi{color:#1b1207}
.day.on .wxi .c{fill:rgba(27,18,7,.14)} .day.on .wxi .d{stroke:#1b4f8a}
.day.on .dprog{color:rgba(27,18,7,.7)} .day.on .dprog b{color:#0f5a2c} .day.on .dprog b i{color:rgba(27,18,7,.6)}
.day.on .lights{background:rgba(27,18,7,.16)}
.day.on .dflag{background:repeating-conic-gradient(#1b1207 0 25%,#fff6ef 0 50%) 0 0/6px 6px}
@keyframes v630rays{to{transform:rotate(360deg)}}
@keyframes v630wave{0%,100%{transform:skewX(-10deg)}30%{transform:skewX(-18deg) rotate(-4deg)}65%{transform:skewX(-4deg) rotate(3deg)}}
@media (prefers-reduced-motion:reduce){.wxi.sun .rays,.wxi.part .rays{animation:none} .day:hover .dflag{animation:none} .day .lights i{transition:none}}
/* the selected day's heading: the same reading in words, beside the date */
.dayhead h3 .daywx{display:inline-flex;align-items:center;gap:7px;margin-left:12px;vertical-align:middle;font-size:12.5px;font-weight:600;color:var(--ink2);white-space:normal}
.dayhead h3 .daywx:empty{display:none}
.dayhead h3 .daywx .wxi,.dayhead h3 .daywx .wxi svg{width:24px;height:24px}
.dayhead h3 .daywx small{font-size:10px;font-weight:600;color:var(--mute);letter-spacing:.04em}
@media (max-width:470px){ .day{width:calc(50vw - 28px);min-width:0} .day .dface{padding:20px 10px 9px}
  .dnum .dd{font-size:50px} .dtoday{padding:2px 5px;font-size:8.5px;letter-spacing:.06em} .wxt em{display:none} .wxi,.wxi svg{width:19px;height:19px}
  .dmotto{font-size:8px;letter-spacing:.1em} .dayhead h3 .daywx{display:flex;margin:4px 0 0} }
@media print{ .day .dface::before{background:#222!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style></head>"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_CARD_FN, NEW_CARD_FN, 'card fn')
    t = rep(t, OLD_HEAD, NEW_HEAD, 'card head')
    t = rep(t, OLD_LIGHTS, NEW_LIGHTS, 'card lights/foot')
    t = rep(t, OLD_DAYH, NEW_DAYH, 'day heading')
    t = rep(t, OLD_WIRE, NEW_WIRE, 'timeline wire')
    t = rep(t, OLD_WX, NEW_WX, 'forecast js')
    t = rep(t, OLD_END, NEW_END, 'style end')
    t = rep(t, OLD_NOWEEK, NEW_NOWEEK, 'no-week wording')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
