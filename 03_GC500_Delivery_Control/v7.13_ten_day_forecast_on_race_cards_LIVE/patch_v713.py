#!/usr/bin/env python3
"""v7.13 - A TEN-DAY FORECAST ON THE RACE DAY CARDS (DRAFT).
The project manager, 27 Sep 2026: "I'm pretty sure you can do a 7 day or 10 day forecast."

- The page's own weather service (WeatherAPI.com, key held on Railway) asks for seven days but the free plan answers three.
  Open-Meteo (free, no key, open to any page) carries the forecast out to ten days from today, for the job's own spot at
  Surfers Paradise, using its best-match blend of weather models.
- Each day comes from one source and says which: WeatherAPI wherever it answers (today and the next two days on the
  current plan, more if the plan grows), Open-Meteo for the rest. Each fills in for the other: if WeatherAPI is not
  reached, Open-Meteo carries all ten days; if Open-Meteo is not reached, the WeatherAPI days stay. Neither blanks the
  other.
- Open-Meteo's weather codes (the WMO's) are drawn with the page's own pictures and short words.
- Days 8 to 10 are an outlook - further out and less certain - and the plate says so in small text.
- The ten days run from today; a day past the tenth says "No forecast yet · forecast runs to <day>", as before.
- The same cache and stale rules for both sources (held an hour, shown up to twelve hours), each with its own fetched
  time in the source line (in Gold Coast time). No key is involved on the Open-Meteo side; the WeatherAPI key stays
  where it was.
- The day heading (hidden on the Timeline since v7.04) names the source too. The pre-start's START TIME · WEATHER · WIND
  box stays blank for the supervisor on the morning (the sheet is printed days ahead, when the forecast would be stale),
  and the day sheets and Today's board carry no forecast, so nothing else changes.
Build on v7.11 (live).   python3 patch_v713.py <page.html>"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

JS_LOAD = r"""/* v7.13 - A TEN-DAY FORECAST (the project manager, 27 Sep 2026: "I'm pretty sure you can do a 7 day or 10 day
 forecast"). WeatherAPI's free plan answers three days however many are asked for, so a second source carries the rest:
 Open-Meteo, free, with no key and open to any page (so a laptop copy gets a forecast too). It is asked for the job's own
 spot at Surfers Paradise, in Gold Coast time, for ten days from today, from its best-match blend of weather models.
 The Bureau's own model feed through Open-Meteo was checked on 27 Sep 2026 and came back empty for this spot, so it is
 not used.

 ONE SOURCE PER DAY, AND IT SAYS WHICH. WeatherAPI wherever it answers - it is the service the page already uses, and
 Today's reading comes from it - and Open-Meteo for the days it does not reach. Each fills in for the other: if one is
 not reached the other's days still show, and if it has an earlier answer under twelve hours old that still shows.
 Nothing is blended, averaged or filled in; a figure is on the plate only if the source gave it.

 DAYS 8 TO 10 ARE AN OUTLOOK. They are shown plainly, with the same figures and flags, and the plate and the source
 line say "outlook": further out, less certain. */
const WX_LL = {lat: -27.985, lon: 153.428}; /* the job's centre, Surfers Paradise (the circuit's placemarks sit round it) */
const WX_DAYS = 10, WX_OUTLOOK = 7; /* ten days from today; the eighth day on is the outlook */
const WXO_CACHE = 'gc500.weather.forecast.om';
const WXO_FIELDS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max';
let WXO = {state: 'idle', days: null, at: null, why: null, q: []};
function wxAddDays(iso, n){ const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function wxLastDay(){ return wxAddDays(todayIso(), WX_DAYS - 1); }
function wxOutlook(iso){ return String(iso || '').slice(0, 10) >= wxAddDays(todayIso(), WX_OUTLOOK); }
/* the fetched time in Gold Coast time, whatever the laptop's clock is set to */
function wxHM(at){ const t = at ? new Date(at) : null; if (!t || isNaN(t)) return '';
 try { return new Intl.DateTimeFormat('en-GB', {timeZone: EVENT_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(t); }
 catch (e) { return two(t.getHours()) + ':' + two(t.getMinutes()); } }
/* the WMO's weather codes (Open-Meteo's), in the page's own pictures and short words */
const WX_WMO = {0: ['sun', 'Sunny'], 1: ['sun', 'Mostly sunny'], 2: ['part', 'Part cloud'], 3: ['cloud', 'Cloudy'],
 45: ['fog', 'Fog'], 48: ['fog', 'Fog'], 51: ['rain', 'Drizzle'], 53: ['rain', 'Drizzle'], 55: ['rain', 'Drizzle'],
 56: ['sleet', 'Sleet'], 57: ['sleet', 'Sleet'], 61: ['rain', 'Light rain'], 63: ['rain', 'Rain'], 65: ['pour', 'Heavy rain'],
 66: ['sleet', 'Sleet'], 67: ['sleet', 'Sleet'], 71: ['sleet', 'Snow'], 73: ['sleet', 'Snow'], 75: ['sleet', 'Snow'], 77: ['sleet', 'Snow'],
 80: ['rain', 'Showers'], 81: ['rain', 'Showers'], 82: ['pour', 'Heavy showers'], 85: ['sleet', 'Snow'], 86: ['sleet', 'Snow'],
 95: ['storm', 'Storms'], 96: ['storm', 'Storms'], 99: ['storm', 'Storms']};
/* Open-Meteo's answer, cut down to the same row the page already draws - nothing computed, nothing filled in */
function wxoTrim(j){
 const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
 const d = j && j.daily, u = (j && j.daily_units) || {};
 if (!d || !Array.isArray(d.time)) return null;
 if (u.temperature_2m_max && u.temperature_2m_max !== '°C') return null; /* the page speaks Celsius and km/h only */
 const windOk = !u.wind_speed_10m_max || u.wind_speed_10m_max === 'km/h';
 const col = k => Array.isArray(d[k]) ? d[k] : [];
 const days = {};
 d.time.forEach((t, i) => {
  const max = num(col('temperature_2m_max')[i]); if (!t || max === null) return;
  const code = num(col('weather_code')[i]), w = code !== null ? WX_WMO[code] : null, iso = String(t).slice(0, 10);
  days[iso] = {date: iso, src: 'om', code, text: w ? w[1] : null, max_c: max, min_c: num(col('temperature_2m_min')[i]),
   rain_pc: num(col('precipitation_probability_max')[i]), rain_mm: num(col('precipitation_sum')[i]),
   wind_kph: windOk ? num(col('wind_speed_10m_max')[i]) : null};
 });
 return Object.keys(days).length ? days : null;
}
function wxoCacheRead(){ try { const r = JSON.parse(localStorage.getItem(WXO_CACHE) || 'null'); return r && r.days && r.at ? r : null; } catch (e) { return null; } }
function wxoCacheWrite(days){ try { localStorage.setItem(WXO_CACHE, JSON.stringify({days, at: new Date().toISOString()})); } catch (e) {} }
/* fetch the ten days from Open-Meteo. The same hour's hold and twelve hours' grace as the WeatherAPI forecast; onDone
   runs whether it worked or not, and a failure here leaves the WeatherAPI days exactly as they are. */
function wxoLoad(onDone){
 const done = () => { const q = WXO.q.splice(0); if (onDone) q.push(onDone); q.forEach(f => { try { f(); } catch (e) {} }); };
 if (WXO.state === 'loading') { if (onDone) WXO.q.push(onDone); return; }
 const cached = wxoCacheRead();
 if (cached && wxAgeMin(cached.at) < WXF_FRESH_MIN) { WXO = {state: 'ok', days: cached.days, at: cached.at, why: null, q: WXO.q}; return done(); }
 WXO = {state: 'loading', days: WXO.days, at: WXO.at, why: null, q: WXO.q};
 const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + WX_LL.lat + '&longitude=' + WX_LL.lon + '&daily=' + WXO_FIELDS
  + '&timezone=' + encodeURIComponent(EVENT_TZ) + '&forecast_days=' + WX_DAYS;
 let over = false;
 const fail = why => { if (over) return; over = true; const c = wxoCacheRead();
  WXO = {state: 'error', days: c && wxAgeMin(c.at) < WXF_STALE_MIN ? c.days : null, at: c ? c.at : null, why, q: WXO.q}; done(); };
 const timer = setTimeout(() => fail('Open-Meteo did not answer'), 9000);
 fetch(url, {cache: 'no-store', credentials: 'omit'}).then(r => {
  if (!r.ok) throw new Error('Open-Meteo answered ' + r.status);
  return r.json();
 }).then(j => {
  if (over) return; clearTimeout(timer);
  const days = wxoTrim(j);
  if (!days) return fail('Open-Meteo answered without a forecast');
  over = true; WXO = {state: 'ok', days, at: new Date().toISOString(), why: null, q: WXO.q};
  wxoCacheWrite(days); done();
 }).catch(e => { clearTimeout(timer); fail(wxPlainWhy(String(e && e.message || e), 'Open-Meteo')); });
}
/* a browser's own network words ("Failed to fetch") said plainly */
function wxPlainWhy(s, who){ return !s || /failed to fetch|networkerror|load failed|network request failed/i.test(s) ? who + ' could not be reached' : s; }
/* whose figures a day's are, in a word or two for the plate, and in full for its title and spoken label */
function wxSrcTag(f){ return (f && f.src === 'om' ? 'Open-Meteo' : 'WeatherAPI') + (f && wxOutlook(f.date) ? ' · outlook' : ''); }
function wxSrcWords(f){ const ol = f && wxOutlook(f.date);
 return (f && f.src === 'om' ? 'Open-Meteo ' + (ol ? 'outlook' : 'forecast') + ' (best-match models)' : 'WeatherAPI ' + (ol ? 'outlook' : 'forecast') + ', via the weather service')
  + (ol ? ': further out, less certain' : ''); }
"""

WXFDAY_OLD = """function wxfDay(iso){
 if (!WXF.days || wxAgeMin(WXF.at) >= WXF_STALE_MIN) return null;
 return WXF.days[String(iso || '').slice(0, 10)] || null;
}"""
WXFDAY_NEW = """function wxfDay(iso){
 /* v7.13 - ten days from today, one source per day: WeatherAPI where it answers, Open-Meteo for the rest */
 const k = String(iso || '').slice(0, 10), t = todayIso();
 if (!k || k < t || k > wxLastDay()) return null;
 const a = WXF.days && wxAgeMin(WXF.at) < WXF_STALE_MIN ? WXF.days[k] : null;
 if (a) { if (!a.src) a.src = 'wapi'; if (!a.date) a.date = k; return a; }
 const b = WXO.days && wxAgeMin(WXO.at) < WXF_STALE_MIN ? WXO.days[k] : null;
 return b || null;
}"""

WXFDATES_OLD = "function wxfDates(){ return WXF.days && wxAgeMin(WXF.at) < WXF_STALE_MIN ? Object.keys(WXF.days).sort() : []; }"
WXFDATES_NEW = """function wxfDates(){ /* v7.13 - both sources, today to the tenth day */
 const t = todayIso(), z = wxLastDay(), ks = new Set();
 [WXF, WXO].forEach(s => { if (s.days && wxAgeMin(s.at) < WXF_STALE_MIN) Object.keys(s.days).forEach(k => { if (k >= t && k <= z) ks.add(k); }); });
 return [...ks].sort(); }"""

NONE_OLD = """ if (WXF.state === 'loading' || WXF.state === 'idle') return 'asking the weather service';
 if (WXF.state === 'off') return 'laptop copy: no weather service';
 return 'weather service not reached';"""
NONE_NEW = """ if ([WXF, WXO].some(s => s.state === 'loading' || s.state === 'idle')) return 'asking the weather services';
 return 'weather services not reached';"""

SIG_OLD = "function wxSig(iso){ const f = wxfDay(iso); return f ? 'f' + [f.code, f.text, f.max_c, f.min_c, f.rain_pc, f.wind_kph].join('|') : 'n' + wxNoneWhy(iso); }"
SIG_NEW = "function wxSig(iso){ const f = wxfDay(iso); return f ? 'f' + [wxSrcTag(f), f.code, f.text, f.max_c, f.min_c, f.rain_pc, f.wind_kph].join('|') : 'n' + wxNoneWhy(iso); }"

WORDS_OLD = "return bits.join(' · ') + (fl.length ? ' · flagged ' + fl.join(', ') : '') + ' — the weather service’s forecast';"
WORDS_NEW = " return bits.join(' · ') + (fl.length ? ' · flagged ' + fl.join(', ') : '') + ' — ' + wxSrcWords(f);"

CARD_OLD = """ const kind = wxKind(f.code), words = wxWords(f), flags = wxFlags(f);"""
CARD_NEW = """ const kind = wxKind(f.code, f.src), words = wxWords(f), flags = wxFlags(f);"""
CARD_TAIL_OLD = """: ''}</span><span class="sr">${esc(words)}</span></span>`;"""
CARD_TAIL_NEW = """: ''}</span><span class="wxo${wxOutlook(f.date) ? ' ol' : ''}">${esc(wxSrcTag(f))}</span><span class="sr">${esc(words)}</span></span>`;"""

KIND_OLD = """function wxKind(code){
 const c = Number(code);"""
KIND_NEW = """function wxKind(code, src){
 if (src === 'om') { const w = typeof code === 'number' ? WX_WMO[code] : null; return w ? w[0] : 'cloud'; } /* v7.13 - the WMO's codes */
 const c = Number(code);"""

LINE_KIND_OLD = """ const f = wxfDay(iso); if (!f) return '';
 const kind = wxKind(f.code);"""
LINE_KIND_NEW = """ const f = wxfDay(iso); if (!f) return '';
 const kind = wxKind(f.code, f.src);"""
LINE_WORDS_OLD = "const words = bits.join(' · ') + ' — the weather service\\u2019s forecast';"
LINE_WORDS_NEW = " const words = bits.join(' · ') + ' — ' + wxSrcWords(f);"
LINE_SMALL_OLD = "<small>forecast, weather service</small>"
LINE_SMALL_NEW = "<small>forecast, ${esc(wxSrcTag(f))}</small>"

SRC_START = "function wxSrcLine(){"
SRC_END = "function wxfPaint(){"
SRC_NEW = r"""function wxSrcLine(){
 /* v7.13 - which source each run of days came from and when it was fetched, which days are the outlook, and why a
    source is missing when one is */
 const ks = wxfDates();
 const th = 'Site-work flags: HOT at ' + WX_FLAG.hot + '° or more, WET at a ' + WX_FLAG.wet + '% chance of rain or more, WINDY at ' + WX_FLAG.wind + ' km/h or more (working lines for planning, not weather warnings).';
 const fw = WXF.why ? wxPlainWhy(WXF.why, 'the weather service') : '', ow = WXO.why ? wxPlainWhy(WXO.why, 'Open-Meteo') : '';
 const why = [fw ? 'WeatherAPI: ' + fw : '', ow ? 'Open-Meteo: ' + ow : ''].filter(Boolean).join('; ');
 if (!ks.length) return `<b>Weather on the cards:</b> forecast: none to show yet${why ? ' (' + esc(why) + ')' : ''}. A day without a forecast says so. ${th}`;
 const span = (a, z) => { const x = fmtDay(a), y = fmtDay(z); return a === z ? x.dow + ' ' + x.dm : x.dow + ' ' + x.dm + ' to ' + y.dow + ' ' + y.dm; };
 const runs = [];
 ks.forEach(k => { const f = wxfDay(k), s = f ? f.src : ''; const r = runs[runs.length - 1];
  if (r && r.s === s && wxAddDays(r.z, 1) === k) r.z = k; else runs.push({s, a: k, z: k}); });
 const NM = {wapi: ['WeatherAPI, via the weather service', WXF.at], om: ['Open-Meteo (best-match models)', WXO.at]};
 const parts = runs.map(r => { const n = NM[r.s] || ['forecast', null], hm = wxHM(n[1]);
  return `${esc(span(r.a, r.z))}: ${n[0]}${hm ? ', fetched ' + hm : ''}`; });
 const ol = ks.filter(k => wxOutlook(k)), z = fmtDay(ks[ks.length - 1]);
 const olw = ol.length ? ` · ${esc(span(ol[0], ol[ol.length - 1]))} ${ol.length === 1 ? 'is' : 'are'} an outlook: further out, less certain` : '';
 const has = s => runs.some(r => r.s === s);
 const miss = [!has('wapi') && fw ? 'WeatherAPI not used: ' + fw : '', !has('om') && ow ? 'Open-Meteo not used: ' + ow : ''].filter(Boolean);
 return `<b>Weather on the cards:</b> forecasts, each day labelled with its source · ${parts.join(' · ')}${olw} · a day past ${esc(z.dow + ' ' + z.dm)} says “No forecast yet”.${
  miss.length ? ' ' + esc(miss.join('; ')) + '.' : ''} ${th}`;
}
"""

CALL_OLD = "wxfLoad(wxfPaint); /* v6.30 - the forecast onto the day cards, in place, when it arrives */"
CALL_NEW = " wxfLoad(wxfPaint); wxoLoad(wxfPaint); /* v6.30 - the forecast onto the day cards, in place, when it arrives; v7.13 - and the days past it, from Open-Meteo */"

CSS = r"""
/* v7.13 - the ten-day forecast: every plate names its source in a small line at its foot, and days 8 to 10 add
   "outlook". The plate is one line taller on every card, forecast or not, so the strip keeps one height. */
.day .wxp{grid-template-rows:11px 32px 13px 9px;height:91px}
.day .wxo{grid-column:1/-1;display:block;min-width:0;height:9px;margin-top:-1px;font-size:7.5px;line-height:9px;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;text-align:right;color:#8a939c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.day .wxo.ol{color:#a9b1b9}
@media (max-width:470px){ .day .wxp{grid-template-rows:11px 28px 13px 9px;height:87px} .day .wxo{letter-spacing:.06em} }
"""


def swap(t, a, b, new, what):
    if t.count(a) != 1: sys.exit('%s start: %d' % (what, t.count(a)))
    i = t.index(a); j = t.find(b, i)
    if j < 0: sys.exit('%s end not found' % what)
    return t[:i] + new + t[j:]


def patch(path, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function wxoLoad(' in t: sys.exit('v7.13 already applied')
    if 'function wxCardHtml(' not in t: sys.exit('apply v7.05 first')
    for name, src in (('JS', JS_LOAD), ('DAY', WXFDAY_NEW), ('DATES', WXFDATES_NEW), ('NONE', NONE_NEW), ('SIG', SIG_NEW),
                      ('WORDS', WORDS_NEW), ('CARD', CARD_TAIL_NEW), ('KIND', KIND_NEW), ('LINE', LINE_WORDS_NEW + LINE_SMALL_NEW),
                      ('SRC', SRC_NEW), ('CALL', CALL_NEW)):
        bad = re.findall(r" \.", src)
        if bad: sys.exit('%s holds a space before a dot, which the attribution scrub folds' % name)
        if 'Andrew' in src: sys.exit('%s names the project manager, which the scrub rewrites' % name)
    # 1. the second source, beside the first
    t = rep(t, "/* the forecast row for a day, or null - a day outside the forecast is simply not known */",
            JS_LOAD + "/* the forecast row for a day, or null - a day outside the forecast is simply not known */", 'loader', path, need)
    # 2. a day's row: ten days from today, one source per day
    t = rep(t, WXFDAY_OLD, WXFDAY_NEW, 'wxfDay', path, need)
    t = rep(t, WXFDATES_OLD, WXFDATES_NEW, 'wxfDates', path, need)
    t = rep(t, NONE_OLD, NONE_NEW, 'wxNoneWhy', path, need)
    t = rep(t, SIG_OLD, SIG_NEW, 'wxSig', path, need)
    # 3. the WMO's codes into the same pictures
    t = rep(t, KIND_OLD, KIND_NEW, 'wxKind', path, need)
    # 4. the plate, its title and spoken label name the source
    t = rep(t, WORDS_OLD, WORDS_NEW, 'wxWords', path, need)
    t = rep(t, CARD_OLD, CARD_NEW, 'card kind', path, need)
    t = rep(t, CARD_TAIL_OLD, CARD_TAIL_NEW, 'card source', path, need)
    # 5. the day heading's line (hidden on the Timeline, kept consistent)
    t = rep(t, LINE_KIND_OLD, LINE_KIND_NEW, 'line kind', path, need)
    t = rep(t, LINE_WORDS_OLD, LINE_WORDS_NEW, 'line words', path, need)
    t = rep(t, LINE_SMALL_OLD, LINE_SMALL_NEW, 'line source', path, need)
    # 6. the source line under the strip
    t = swap(t, SRC_START, SRC_END, SRC_NEW, 'source line')
    # 7. ask both when the Timeline draws
    t = rep(t, CALL_OLD, CALL_NEW, 'call', path, need)
    k = t.find('</style>')
    if k < 0: sys.exit('no </style>')
    t = t[:k] + CSS.lstrip('\n') + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1])
