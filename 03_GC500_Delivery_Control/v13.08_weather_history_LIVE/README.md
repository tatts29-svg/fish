# v13.08 — historical weather through final demob — LIVE 15 Nov 2026 19:58 AEST

Author: Andrew Fisher.

The saved weather archive stopped at 4 November, with that day incomplete. Once later forecasts expired, the final demob cards showed “History unavailable”. Andrew asked where the previous weather was, then instructed “Update and go live” in the dashboard review chat on 15 Nov 2026.

This update completes the published 4 November maximum temperature and gust and adds 5–13 November from the same official Bureau of Meteorology Gold Coast Seaway station, 040764. The archive now covers 68 consecutive dates, 7 September–13 November. All 58 other earlier rows, including their original partial flags, and their source metadata stay unchanged.

Only embedded weather observations, their provenance and the release footer change. The pinned race-weekend weather statistics remain identical against both archives. The native card rendering, observation periods, operational records, financial calculations, maps, media and complete v13.05 machine manifest are preserved. No automatic weather-history ingestion is introduced; the import ends at the last programme day.

## Source

- [Official November CSV](https://www.bom.gov.au/climate/dwo/202611/text/IDCJDW4050.202611.csv) and [published table](https://www.bom.gov.au/climate/dwo/202611/html/IDCJDW4050.202611.shtml), prepared 15 Nov 2026 06:26 UTC. Frozen source files, retrieval times and hashes are in `weather_sources/`.
- CSV SHA-256: `b4223475528e54018653ac753ab229cf3acdea6f8e2edb853d1fd76b2498a325`. Independent reads of CSV and HTML agree. Previously completed 1–3 November rows match, and every previously published non-null 4 November value is preserved.
- Uses the existing v12.99 converter: minimum and rainfall cover the period to 09:00, maximum the period from 09:00, and strongest gust the daily period to midnight. Sampled winds stay distinct from the strongest gust. Unpublished sky/cloud conditions remain unknown.
- `weather_updates1308.json` is a reproducible fixture of the ten completed/added rows and source provenance.

## Candidate and checks

Base live v13.07: `e632b5bbe5aaab781bb7242b892d102e1e8e8894dd973223d6a57e1839443428`.

Candidate v13.08: `7aecf0c1e80f88b702ed802f65e08b6401e099d49b4af2823e91068d1848329f`, 17,080,013 bytes. Shared static checks pass for all 225 scripts. Independent source acceptance passes 12 tests, including original-row preservation, independent CSV-header conversion, exact candidate reproduction, provenance, wrong-base/repeat guards and an exact whole-HTML boundary limited to archive JSON plus footer.

Native desktop and phone checks pass for all ten changed observation days and all eight affected programme cards, earlier Build weather, unchanged native financial outputs/documents and zero errors/writes. Both shared sweeps pass all 27 routes, seven deep links and Back, with zero runtime/console errors or attempted writes. Four desktop/phone weather screenshots were inspected. Published through the guarded uploader on 15 Nov 2026 at 19:58 AEST from source `b874f61e90e870b25400530fee74b870450a2b8a`, after READY board `439ac03c`. Uploader verification and an independent cache-busted public read match the candidate byte for byte. Actual-public phone verification, with no HTML substitution, passes all ten observation dates, eight affected programme cards and earlier Build weather; zero runtime/console errors or writes, record 13404 unchanged. The live phone screenshot was inspected. Sanitized results and source hashes are in CHECKS.json; detailed native evidence stays outside the repository.

The archive contains 64 complete days and four earlier partial days (24 September and 4–6 October). Fresh official September/October sources still omit those individual observations; their existing partial flags remain accurate.

## Reproduce

Build through `toolchain/build.sh v13.08 v13.08_weather_history_LIVE/patch_v1308.py` from the exact v13.07 base. Run `python3 -B v13.08_weather_history_LIVE/tests/test_weather1308.py BASE CANDIDATE` for source acceptance.

`tests/weather_ui1308.cjs` uses BASE, PAGE, STATE, private absolute OUT and MOB=0/1. STATE is a private frozen native service snapshot. It checks all ten native weather readings, all eight affected programme cards and earlier Build weather, native values/provenance, financial outputs, documents and zero writes. The existing Demob programme excludes weekends; 7–8 November observations are retained in the archive without adding new day cards. LIVE=1 omits all HTML substitution and requires EXPECTED_SHA. Use both unchanged shared sweeps and the v13.07 sweep validator. All browser runs use `/tmp/gc500-browser.lock`.
