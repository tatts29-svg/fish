# v7.05: race day cards with a proper weather panel (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "The weather on the race day cards is great and all. But they are tiny and small and they kind of
look like shit. So we need to up the ante on the Timeline race cards."

**The weather panel** on each card is a dark "Forecast" panel:
- a 32 px icon;
- the top and low (e.g. 20° / 18°);
- the condition word;
- rain chance as a bar and a percentage;
- wind in km/h;
- flags as words on yellow chips: HOT (32° or more), WET (60 % or more), WINDY (40 km/h or more). These are working lines for
  site planning, not weather warnings.

Days past the forecast say "No forecast yet · forecast runs to …", and past days say "No forecast · the day has passed".
One line under the strip names the source and when it was fetched.

**The figures:** Due in and Due out are larger.

**v7.05b:** no empty space inside a card. Each card is as tall as what it holds, with the figures straight under the weather.

**LIVE: 27 Sep 2026, 20:58 AEST.** The page is v7.10 live + `patch_v705.py` + `patch_v705b.py`, verified byte for byte on the view link.

**Checked:**
- no page errors, desktop and phone;
- day selection still drives the Day documents plate;
- Load 4 prints 1 page and Print all prints 7;
- the pre-start is still one page.
