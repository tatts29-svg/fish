#!/usr/bin/env python3
"""server v5.83 - THE FORECAST (Andrew Fisher, 26 Sep 2026: "We have a weather api. Use it. We can add weather to the days").
One new route, GET /api/weather/forecast, behind the same link token as /api/weather: the service asks weatherapi.com for
its day-by-day forecast (forecast.json, seven days asked for; the plan decides how many come back) and answers with one
trimmed row per day - the date, the condition code and its words, the high and the low, the chance of rain, the rain in
millimetres, the top wind, sunrise and sunset. Held for an hour so a room full of phones is one call upstream. The key
never leaves the service and no upstream error text is echoed (it can carry the key). Nothing else changes.

  python3 patch_server_v583.py hosting/railway/server.js
"""
import sys

p = sys.argv[1]
s = open(p, encoding='utf-8').read()
n0 = len(s)


def rep(old, new, label):
    global s
    c = s.count(old)
    if c != 1:
        print('FAIL [%s] expected 1 match, found %d: %r' % (label, c, old[:90])); sys.exit(1)
    s = s.replace(old, new)
    print('ok   [%s]' % label)


rep("const BUILD = 'server v5.79 — THE MACHINE SET MAY CARRY THE SATELLITE PLAN EXPLORER AND THE 3D PROOF",
    "const BUILD = 'server v5.83 — THE FORECAST (GET /api/weather/forecast: weatherapi.com forecast.json trimmed to one row a day, held an hour, behind the link token; Andrew Fisher, 26 Sep 2026; nothing else changed) + THE MACHINE SET MAY CARRY THE SATELLITE PLAN EXPLORER AND THE 3D PROOF",
    'V1 the build line says v5.83')

rep("""const WEATHER_TTL = 10 * 60 * 1000;
let weatherCache = { at: 0, body: null };""",
    """const WEATHER_TTL = 10 * 60 * 1000;
let weatherCache = { at: 0, body: null };
/* v5.83 — the day-by-day forecast, held for an hour: a forecast does not change by the minute and the plan's quota is
   finite. Seven days are asked for; the plan decides how many come back and the page shows exactly those. */
const FORECAST_TTL = 60 * 60 * 1000;
let forecastCache = { at: 0, body: null };""",
    'V2 the forecast cache')

rep("""      if (p === '/api/weather' && req.method === 'GET') {
        const key = process.env.WEATHERAPI_KEY || '';""",
    """      if (p === '/api/weather/forecast' && req.method === 'GET') {
        /* v5.83 — the forecast for the day cards (Andrew Fisher, 26 Sep 2026). Same key, same token rule, same
           silence about upstream error text. One trimmed row per day; nothing is worked out here. */
        const key = process.env.WEATHERAPI_KEY || '';
        if (!key) return send(res, 503, { error: 'no weather key is set on this service yet' }, { 'Cache-Control': 'no-store' });
        const now = Date.now();
        if (forecastCache.at && now - forecastCache.at < FORECAST_TTL && forecastCache.body) {
          return send(res, 200, forecastCache.body, { 'Cache-Control': 'public, max-age=900' });
        }
        const q = process.env.WEATHER_Q || 'Surfers Paradise, Queensland, Australia';
        const u = 'https://api.weatherapi.com/v1/forecast.json?key=' + encodeURIComponent(key) + '&q=' + encodeURIComponent(q) + '&days=7&aqi=no&alerts=no';
        try {
          const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
          const r = await fetch(u, { signal: ac.signal });
          clearTimeout(t);
          if (!r.ok) {
            const why = r.status === 401 || r.status === 403 ? 'the weather service refused the key'
                      : 'the weather service answered ' + r.status;
            return send(res, 502, { error: why }, { 'Cache-Control': 'no-store' });
          }
          const j = await r.json();
          const l = (j && j.location) || {}, fd = ((j && j.forecast) || {}).forecastday;
          if (!Array.isArray(fd) || !fd.length) return send(res, 502, { error: 'the weather service answered without a forecast' }, { 'Cache-Control': 'no-store' });
          const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
          const days = fd.map(f => { const d = f.day || {}, a = f.astro || {};
            return { date: f.date || null, code: num((d.condition || {}).code), text: (d.condition || {}).text || null,
                     max_c: num(d.maxtemp_c), min_c: num(d.mintemp_c), avg_c: num(d.avgtemp_c),
                     rain_pc: num(d.daily_chance_of_rain), rain_mm: num(d.totalprecip_mm), wind_kph: num(d.maxwind_kph),
                     humidity: num(d.avghumidity), sunrise: a.sunrise || null, sunset: a.sunset || null }; })
            .filter(d => d.date && d.max_c !== null);
          if (!days.length) return send(res, 502, { error: 'the weather service answered without a reading' }, { 'Cache-Control': 'no-store' });
          const body = { location: { name: l.name || null, region: l.region || null, localtime: l.localtime || null }, days };
          forecastCache = { at: now, body };
          return send(res, 200, body, { 'Cache-Control': 'public, max-age=900' });
        } catch (e) {
          return send(res, 504, { error: 'the weather service did not answer' }, { 'Cache-Control': 'no-store' });
        }
      }
      if (p === '/api/weather' && req.method === 'GET') {
        const key = process.env.WEATHERAPI_KEY || '';""",
    'V3 the forecast route')

open(p, 'w', encoding='utf-8').write(s)
print('server.js', n0, '->', len(s))
