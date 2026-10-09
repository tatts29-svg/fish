# GC500 v6.30 — race day cards, with the weather on them · service v5.83

26 Sep 2026. Applied on top of v6.28 (see `../v6.28_gc500_white/`). Andrew's mock-up: day cards with a carbon strip along the
top, the day top-left, a weather icon top-right, a big date numeral, the month and year, the week and phase, a Due in / Due out
plate with a green progress bar, and a motto with a chequered flag in the footer. "We have a weather api. Use it."

## The delivery page (v6.30)
- `patch_v630.py` — the card markup, the forecast fetch and the look. The forecast (`wxfLoad`) follows the same rules as the
  board's reading: the hosted copy asks its own service, a laptop copy with a key in the browser asks weatherapi.com itself,
  nothing is guessed, and a day the forecast does not cover shows nothing. Held in the browser for an hour (`gc500.weather.forecast`),
  shown up to twelve hours old, painted onto the cards in place (`wxfPaint`) so nothing redraws. Eight drawn skies
  (`wxKind`/`wxIcon`) from weatherapi.com's condition codes; anything unknown is a cloud. The footer rotates the five Coates Way
  values; the selected card says "Selected" instead, because the orange is where you are looking, not work that is done.
- `build_asset_app.py.v630` — the builder with the same changes.
- `test_v630.js` + `wx_mock_forecast.json` — the check at 1400, 1366 and a 390 px phone: cards draw with no forecast (the local
  service has no key), with a mocked seven-day forecast (every icon), and with the live forecast saved from the service; a click on
  another day re-draws the strip with the weather already on it; no script errors. `shots/` holds the pictures — the two
  "live_forecast" ones carry the real reading from 26 Sep 2026 09:58, the phone one the mock.

## The service (v5.83) — `server_v5.83/`
- `patch_server_v583.py` — `GET /api/weather/forecast` behind the link token: weatherapi.com `forecast.json`, seven days asked for,
  trimmed to one row a day, held for an hour. The key never leaves the service; no upstream error text is echoed. `server.js` is
  the patched file, `README.md` the hosting notes with the route added.
- Deployed by uploading the machine set with `server.js` at `server/gc500-server.js` (`machine_set.py … --version v5.83-forecast`)
  and setting `SERVER_FILE` to its SHA-256; the service printed "server v5.83 — THE FORECAST …" on restart and the route answered
  three days (the plan's allowance).
