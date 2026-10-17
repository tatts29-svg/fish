# v7.13: 10-day forecast on the race day cards (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "I'm pretty sure you can do a 7 day or 10 day forecast."

- **WeatherAPI** (the service the page already used; its free plan answers 3 days) keeps the days it answers.
- **Open-Meteo** (best-match models, no key) covers the rest, out to 10 days from today.
- Each card names its source. Days 8–10 are marked "outlook".
- Either source fills in if the other can't be reached.
- The Bureau ACCESS-G model returned no data for this spot, so it isn't used.
- The flags are the same for both sources: HOT 32°+, WET 60 %+, WINDY 40 km/h+.

**LIVE: 27 Sep 2026, 21:27 AEST.** The page is v7.05 live + `patch_v713.py`, verified byte for byte on the view link.

**Tests:**
- 27 Sep to 6 Oct show weather, and 7 Oct onwards says "No forecast yet".
- Checked each source failing on its own.
- No key appears on the page.
- The pre-start is still one page, and printing still works.
- No errors.
