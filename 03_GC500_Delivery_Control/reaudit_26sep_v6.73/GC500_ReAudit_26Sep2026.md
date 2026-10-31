# GC500 — deep re-audit of everything that is live

**Date:** 26 Sep 2026, 19:30–20:15 AEST.
**Scope:** the live dashboard (v6.73, after the rollback), the server on Railway, the Satellite Plan Explorer, the Google 3D proof and the Coates Way machine.
**Method:** every view was rendered on desktop (1366 px) and phone (390 px) against a fresh copy of the live record. The live service was probed with read-only requests. Specialist checks were run on the server, the explorer and the machine, and every Critical or High finding was re-checked by hand before being written down.
**Status:** this is an audit only. Nothing was changed on the live page or in the record.

Author: Andrew Fisher

---

## 1. The bottom line

**Overall today: 6 / 10.**
- **What the job has:** strong bones. The numbers add up to the cent, the brand and imagery are excellent, search works, every document link opens, and a view-only link cannot change anything.
- **What holds it back from 10:** four things, in order:
  1. **Some labels claim more than the record proves.** Examples: "Nothing is red", 100% "Fleet utilisation", race-weekend hours "worked" in September, and 790 "units" that include 26 references with no quantity.
  2. **Three demo-breaking faults sit outside the dashboard.** The explorer's Original plan view draws large black areas. The explorer can't be used on a phone. On first open, the machine shows the back of a crew figure instead of the car.
  3. **The first screen makes a reader work.** The header is 273 px on a laptop and 363 px on a phone, so a phone shows no job figures on the first screen.
  4. **Speed and resilience gaps.** Photos are sent full-size although small copies already exist on the server. The machine's first open is 17.7 MB. Some failures show an endless spinner or a green "all good".

None of these is hard to fix. Most can be fixed without changing how the page looks. The look-and-layout ideas are kept separate (section 5) so you can say yes or no to each one.

---

## 2. Scorecard

| Area | Now | What gets it to 10 |
|---|---|---|
| Numbers add up | **9** | Already reconciles to the cent. Keep one fixed snapshot for any presentation |
| Labels say only what the record proves | **5** | Fix the 10 wording/status items in section 3A. None changes a dollar |
| First screen / executive clarity | **4** | A slimmer header option and the key figures above the fold (your call, section 5) |
| Look and brand | **8** | Keep it. Tidy the few things that read as build notes |
| Speed | **6.5** | Use the photo thumbnails, brotli compression, trim the start-up freeze (0.65 s) and slow tabs |
| Phone | **5** | Get the header out of the way; fix the clipped "Coates Wav" tab label |
| Accessibility | **6** | Fix 1 critical and 3 serious automated findings (section 3C) |
| Server security | **6** | Stop the public view link reading costs and rates; fix one input bug; add headers |
| Server reliability and backups | **6.5** | Save before saying "saved"; start-up snapshot and off-site backup; don't boot empty on a bad file |
| Satellite Plan Explorer | **6** | Fix the black patches, the phone layout and the silent imagery failure |
| Google 3D proof | **4** | Friendly fallback, fix the header, label it "experimental" |
| Coates Way machine | **6.5** | Clear first view, load timeout, compress the car model, reword the "Connected" status board |
| Ten-scene showcase | **7** | Fix scene 7's "next scene" wording; consider a short five-scene version (your call) |

---

## 3. Findings

**Severity key:**
- **Critical:** would visibly fail in front of the CEO.
- **High:** wrong or misleading, or likely to fail.
- **Medium:** noticeable.
- **Low:** polish.

### 3A. Dashboard: what the page claims (all confirmed on v6.73 live)

| ID | Sev | What a reader sees | Why it matters | Fix (wording/status only unless noted) |
|---|---|---|---|---|
| D1 | High | Coates Way: "Nothing is red on this job today … no fencing line over its quote" | No quote has been entered, so over/under can't be known. Four fencing types are behind the programme | Show "Not assessed — quote required"; list fencing types behind the programme as red |
| D2 | High | Coates Way: "Fleet time utilisation 100%" and "Redline 0%" | These are job proxies (57/57 delivered, 0 breakdowns typed in), not Coates's fleet measures | "Not measured by this system"; show the job measures under their own names |
| D3 | High | Today: "How far through the job we are — 100%" | It is 196 of 196 units *due by today*, not the whole job | Title it "Deliveries due by today met" |
| D4 | High | "200 of 790 on the job · 25%" | 26 of the 790 are references with no quantity, counted as one each | "764 quantified units + 26 references awaiting quantity"; no % until confirmed |
| D5 | High | Costs: "$181,443 ahead … covers wages up to $83.90 an hour" | Seven cost items are missing; the $/h reads like an allowance | "Difference so far — forecast incomplete"; drop the $/h headline |
| D6 | High | Costs: "Race weekend — worked 159 h" | The event is 23–25 Oct; on 26 Sep those hours are planned | Say "planned" until the day has passed |
| D7 | Medium | Fence plate: "4,342.5 m temporary fence installed" | It is metres of work on dockets; the Cypress Carpark 97.5 m run is on two dockets (36505 clean, then 36539 scrim) | "Fence work on dockets"; list the shortfalls by type: scrim 1,359 m, vehicle gates 34, CCB demarcation 810 m |
| D8 | Medium | Fencing "Cost" columns; rate shown $16.16, charge $1,616.07 | It is the client charge; the stored rate is $16.1607 | "Client charge ex GST"; show the rate to 4 places |
| D9 | Medium | WB02 removal card shows 08:00 | That is the delivery's time; the schedule row says 5.00 pm | Show the removal's own time, or "time to confirm" |
| D10 | Medium | Header "BEFORE THE PROGRAMME" on day 20 of 68; Today "outside every week" | 26 Sep is a gap day inside the build | "Build phase · day 20 of 68" |
| D11 | Medium | Day pod: next delivery day (Mon 28 Sep) shows **"9 NOT RECORDED ON SITE"** with a warning sign | Monday hasn't happened; nothing is wrong yet | Show "9 still to come" without the warning until the day arrives |
| D12 | Medium | "Dockets signed 58 · 58 priced" | 0 of 58 have signed paper uploaded; 1 is partly priced (workbook Week 6 row 3) | "58 recorded · 57 fully priced · 1 part"; show papers separately |
| D13 | Low | Coates Way shows raw text `/* v6.00 … */` and `/* v6.01 … */` | Build notes printing on the page | Remove |
| D14 | Low | "Race day · Fri 23 Oct" and "26 DAYS 05:31" in the pod vs "27 DAYS TO RACE DAY" on the board | Both are right (clock vs calendar days) but look like they disagree | Pick one countdown style for summaries |
| D15 | Low | "nothing removes it" on 148 references | Sounds like a system fault; it means no return date is recorded | "Return date not recorded" |
| D16 | Low | Showcase scene 7: "meet the crew on the next scene" | The crew was scene 6 | Fix the wording |

**Not a finding:** every dollar total reconciles:
- charges $398,541;
- known costs $217,098.24;
- difference $181,443;
- branch totals $332,996.

### 3B. Dashboard: speed and phone

| ID | Sev | Evidence | Fix |
|---|---|---|---|
| P1 | High | The server already holds small webp copies of all 117 drop photos, but the Timeline, Plant and search cards download the full image (avg 0.57 MB each). The small copy is used in one place only | Use the thumbnail on cards; full size only when opened. No visual change |
| P2 | Medium | Page is 6.65 MB, sent gzipped at 1.83 MB. Brotli would be 1.44 MB | Turn on brotli on the server |
| P3 | Medium | A 0.65 s freeze at start-up. Tab switches: Fencing 345 ms, Timeline 271 ms, Costs 254 ms, Progress 250 ms (target under 200 ms) | Defer the heavy parts of those tabs |
| P4 | Medium | Memory grows from 27 to 108 MB (laptop) and 23 to 174 MB (phone) after opening every tab once. Release not measured | Check tab content is freed when you leave a tab; matters on older phones |
| P5 | Medium | Phone: header 363 of 844 px; no job figures on the first screen | Your call (section 5): a slimmer phone header |
| P6 | Low | Phone tab label clipped to "Coates Wav"; "Where we are" wraps | Shorter labels or a smaller font on phones |

**Service location:** the service runs in Singapore (asia-southeast1), which is sensible for the Gold Coast. The volume is 5 GB with about 1 GB used. The custom domain coates26gc500.com responds.

### 3C. Accessibility (automated WCAG 2 A/AA check; a human check is still needed)

| ID | Sev | Evidence | Fix |
|---|---|---|---|
| A1 | Critical (automated) | Header tab list is missing the roles its children need | Correct the tab roles |
| A2 | Serious | Where we are: 17 plates are buttons with buttons inside them | Make the plate a link area with a separate button |
| A3 | Serious | Documents: 63 elements with low text contrast; Where we are 5; Today 1 | Darken those greys |
| A4 | Serious | Pricing and About: a scroll box that a keyboard can't reach | Make it focusable |

### 3D. Server (Railway)

| ID | Sev | Evidence | Plain English | Fix |
|---|---|---|---|---|
| S1 | High | The view link can read the full record and export, including rates, costs and purchase orders, plus all 237 files | Anyone with the shared view link sees the commercial detail | Keep costs, rates and POs behind the edit link, or give view links a trimmed copy |
| S2 | Medium | No rate limit on wrong-token attempts | Only a risk if the edit token is guessable | Make sure the edit token is long and random; limit repeated failures |
| S3 | Medium | A record name of `__proto__` can corrupt the running server (edit link only) | A bad import or bug could crash it until restart | Reject those names |
| S4 | Low | Main page has no HSTS, CSP, Referrer-Policy or nosniff headers (the APIs do) | Defence in depth | Add the headers |
| S5 | Low | `/w/…/server/gc500-server.js` serves the server's own source code (confirmed, 187 KB) | Shows routes and setting names; no secret values | Remove it from the machine file set |
| S6 | Low | Map keys go to any view holder (normal for browser keys) | Keys can be copied | Restrict the Google key to the APIs used; set quotas and budget alerts |
| R1 | Medium | "Saved" is confirmed 150 ms before the write reaches disk; no save-on-shutdown | A redeploy mid-edit could lose the last change | Write before confirming; flush on shutdown |
| R2 | Medium | A damaged `records.json` at start-up is treated as a first run, i.e. an empty record | The next write could overwrite the real record | Refuse to start, or load the latest good snapshot and alert |
| R3 | Medium | Snapshots are hourly only, on the same disk, and the file library is never snapshotted | Frequent deploys reset the timer; losing the volume loses everything | Snapshot at start-up; daily off-site copy |
| R4 | Low | Some upload errors on a full disk aren't caught | Could crash the service | Catch and return "disk full" |

**Checked and fine:**
- A view link cannot write anything.
- Wrong tokens return 401/404.
- Token comparison is timing-safe.
- No path traversal.
- No cross-site reading.
- Page caching with ETags works.
- The health check reports disk trouble.

*Correction to the specialist check: it put the origin in Europe. The Railway config shows Singapore.*

### 3E. Satellite Plan Explorer (the master map)

| ID | Sev | Evidence | Fix |
|---|---|---|---|
| E1 | **Critical** | **Original plan draws large black areas** on high-resolution laptop screens and when zoomed in (to about 1,000%). 58 of the 64 aerial patch images were saved without transparency, so they are 68–100% solid black. Confirmed by opening the files. The PNG export of the same view is correct. See `screens/explorer_original_plan_black.png` vs `explorer_export_correct.jpg` | Re-save the patches with transparency; add a screen-vs-export check. **The page also opens in this mode** |
| E2 | High | Unusable on a 390 px phone: the header is 620 px wide; the modes, zoom, Fit, PNG and the Mapbox credit are off-screen (`explorer_m390x3_first.png`) | Collapse the header on phones |
| E3 | High | If satellite tiles fail, the view goes dark but the status still says "Source detail rendered" with a green dot; failed tiles never retry | Show "Imagery unavailable — retry / switch to plan"; retry |
| E4 | High | At 100% Windows scaling (common laptops) the Fit view renders live: full detail at 17–19 s, with freezes of up to 1.5 s (software rendering here, so a real GPU will be faster) | Add lower pre-rendered levels; test on the presentation laptop |
| E5 | Medium | About 16 MB before the first picture | Show the 2.4 MB preview straight away |
| E6 | Medium | A missing worker file means an endless "Unpacking…"; a missing scene shows raw "scene 404" | Timeout and plain wording |
| E7 | Medium | Mapbox wordmark and "Improve this map" link missing | Add them (licence terms) |
| E8 | Medium | Alignment panel shows green while the file says "unreviewed"; held-out check points may not be fully independent. The QLD 2022 cross-check (mean 0.74 m, worst 1.66 m) is the stronger evidence | Amber until you sign off the alignment |
| E9 | Low | Sliders unlabelled for screen readers; search pulse ignores reduced motion; the repo copy is behind the live `explorer.js` | Tidy; bring the repo up to date |

**What works well:** Satellite + plan at Fit and on Macintosh Island looks excellent, with the plan matching roads and shorelines (`explorer_02_hybrid_fit_dpr2.png`). Search rings each label. The export is correct. The keys aren't in the files.

**Brief coverage:** most requirements are met. Not met:
- usable on a phone;
- plan-only SVG export;
- offline plan;
- a saved or shared view link;
- a test on a Surface-class device;
- your review before publishing (it went live without a recorded sign-off).

### 3F. Google 3D proof

| ID | Sev | Evidence | Fix |
|---|---|---|---|
| G1 | High | With no WebGL it shows Cesium's raw error box on black; with no key it shows "(GOOGLE_MAPS_KEY)" | Friendly fallback |
| G2 | Medium | First full view 33 s here (software), about 20 MB; header cramped at 1440 px and broken on phones; its MB counter always reads 0.0 | Fix the header and counter; label it "experimental" |
| G3 | Info | It shows none of the D001 plan | Either overlay the plan or present it as context only |

### 3G. Coates Way machine (v5.85)

| ID | Sev | Evidence | Fix |
|---|---|---|---|
| M1 | **High** | **On first open the Crew Lead stands between the camera and the car**; the safety officer's "SAFETY" shows through him (confirmed, `screens/machine_first_view_blocked.png`) | Move the crew out of the opening shot |
| M2 | High | If any one of its 55 files fails, it spins on "Building the connections" forever | 30–45 s timeout to the static preview with "Try again" |
| M3 | High | First open is 17.7 MB; the car model (12.9 MB) and lighting file (2.1 MB) are sent uncompressed. Compressed would be about 2.6 MB | Compress them |
| M4 | Medium | "Connected ✓", "310/310 connections engaged", "Drive ready" read like a business status board | Say "Assembled"; add "Illustration — not a performance measure" |
| M5 | Medium | Sidebar calls EBIT 30%, ROCE 20%, NPS 60 "benchmarks"; the source calls them targets; they sit behind a shared link | Say "targets", and confirm they're cleared for this audience |
| M6 | Medium | Builder notes visible: "your supplied cog", "not Camaro factory geometry", "1179 pixels square", an out-of-date help text; the dashboard card shows "build v5.85-dyno … 208 files · 172 MB" | Audience wording; move build details to admin |
| M7 | Medium | Running: "INSPECTION SPEED 33 rpm" beside the dash's 6,081 rpm | Hide or relabel ("Cog speed") while running |
| M8 | Medium | Reduced-motion setting still leaves the crew walking and flames going | Freeze ambient animation |
| M9 | Low | Faceless blocky crew; door writing cut at the cutaway; the dock covers the bottom of the wheel | Polish |

**What works well:**
- The cockpit shot (`machine_cockpit_strong.png`) and the running car look premium.
- Sound is off by default.
- The no-WebGL fallback is good.
- Memory is stable over repeated use.
- The Coates Way values and pillars are word-perfect.

### 3H. Records and files

- **Files:** 237 on the service (785 MB), and all 237 open (HEAD 200).
  - Five groups of byte-identical photos are filed against more than one reference. One drone shot sits on 10 references (HRP, AA, P37, P10–P16) and another on P01, P03 and P04. These may be intended: one aerial covering a compound.
  - Three WC12 "in position" photos are shared between WC12 units, including asset 1211961, the WC11/WC12 conflict. **Worth a look before anyone relies on those photos as proof.**
- **References:** 148 of 202 have no return date recorded.
- **Weather:** works on live (19.4 °C at Surfers Paradise, 19:45).

---

## 4. What to keep exactly as it is

- The Coates look, the car and circuit imagery, and the angular race-card delivery cards.
- The money reconciliation: every figure ties to the cent and says where it came from.
- Search: reference, asset number, callout; it rings the spot on the drawing.
- The view-only / edit split, and every document link working.
- Satellite + plan in the explorer (when not in the broken Original plan mode), and the machine's cockpit.

---

## 5. Your calls (look and layout; not done, just options)

These change how the page looks, which is why they are yours to decide:

1. **Header:** a slimmer header (optional, or phone-only), or leave it as is.
2. **First screen:** a short "where the job stands" summary at the top of Where we are, or leave it.
3. **Today:** fewer summary cards on Today, or leave it.
4. **Showcase:** a short five-scene version for a CEO, alongside the ten-scene showcase, or leave it.
5. **Explorer:** open it in Satellite + plan instead of Original plan.

## 6. Decisions only the owners can make

1. The approved charge basis for the 8 contract lines where the prebill differs ($16,554 by the rule vs $22,986 prebilled).
2. The true quantities for the 26 references with no quantity.
3. Advanced Temporary Fencing's quoted quantities.
4. Wage rates (2,162.5 h), Alfie Harris's nightly rate (39 nights), transport and subhire costs.
5. The effective WB02 removal time (08:00 vs 5.00 pm).
6. The WC11 vs WC12 location for asset 1211961.
7. The 2026 authority for the fencing closure plan, which is drawn on the 2019 base (project 19003 rev 13).
8. Whether the EBIT, ROCE and NPS targets in the machine are cleared for a shared link.
9. Sign-off of the explorer's alignment.

## 7. Suggested order (nothing goes live without your yes)

| Step | What | Changes the look? | Rough effort |
|---|---|---|---|
| 1 | Explorer black patches (E1) + open in Satellite + plan | Fixes a broken view | Half a day |
| 2 | Machine first view, load timeout, compression (M1–M3) | Fixes the opening shot | Half a day |
| 3 | Wording/status fixes D1–D16 | Words only | Half a day |
| 4 | Photo thumbnails, brotli, backups/save-on-shutdown (P1, P2, R1–R3) | No | Half a day |
| 5 | Server: view link can't read costs/rates; `__proto__`; headers (S1, S3–S5) | No | Half a day |
| 6 | Explorer phone layout and imagery-failure message (E2, E3, E6) | Phone only | Half a day |
| 7 | Accessibility A1–A4, phone tab labels (P6) | Barely | A few hours |
| 8 | Your calls from section 5 | Yes: your choice | Per item |

For each step: one before/after screenshot pair, you say yes or no, and only then does it go live.
