## v6.26 — 26 Sep 2026 — Tools in the tab row, the car out of the banner

- Andrew: "Tools can go down next to Coates way. And remove the car." The Tools button sits at the right end of the tab
  row; the strip is rebuilt on every render, so renderTabs takes the button out first and puts it back after. Its menu
  hangs off the body, placed under the button and sized to the window, so the strip's sideways scroll never clips it
  (the reason the old More menu left the strip). The phone's search button stays in the top row. The car is gone from
  the banner; the header is 247 px on a laptop, 346 on a phone.
- Checked at 1400 and 390: the menu opens fully inside the window, survives a tab change, no script errors.
