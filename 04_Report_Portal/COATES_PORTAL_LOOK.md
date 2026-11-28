# The Coates portal look

Author: Andrew Fisher | POWERED BY SITEIQ

One look for every job's portal and report. Each job has different data, so
tabs and charts differ; the frame, colours, type, motion and manners below do
not. The working reference is this repo:

- `04_Report_Portal/server.py` - the sign-in page, session, upload page
- `02_Onhire_Report_Kit/showcase_page.html` - the report page (tabs, charts, drawer, search, on-hire paper report)
- `02_Onhire_Report_Kit/style_pictures.py` - the picture look

Copy from those files rather than re-drawing from this description.

## Rules that never change

- "Author: Andrew Fisher | POWERED BY SITEIQ" and the SiteIQ pull time on every page and every PDF page.
- "Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. Not to be copied or reproduced without permission." in the footer, sign-in page, PDFs and file properties.
- Real data only. A gap is shown as a gap and named; nothing is estimated unless it is labelled an estimate.
- A sign-in before any real data. Nothing sends itself.
- Cleaned-up names in the house style ("Socket - Impact - Long - 30mm - 3/4 Inch Drive"); the raw SiteIQ description is never shown, the product variant is.
- Client-owned gear takes the same format with "(<Client> Owned)" after the name.
- Plain Australian English, dates as 27 Nov 2026, 24-hour time, metric.

## Colour

Coates slate frames the report. Coates orange identifies the portal, the selected tab and the primary action. Keep names, headline counts and five-star ratings in the main text colour.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--bg` | `#0D1116` | `#F2F4F7` | page |
| `--panel` / `--panel2` | `#161B22` / `#1C222B` | `#FFFFFF` / `#F6F7F9` | cards, inset tiles |
| `--line` | `#262E39` | `#E0E4EA` | borders |
| `--tx` / `--mu` / `--dim` | `#E6EBF2` / `#97A3B3` / `#66717F` | `#1B2028` / `#5A6472` / `#8B94A1` | text, secondary, labels |
| `--head` | `#2A313C` | same | top bar (Coates slate) |
| `--or` / `--ortx` | `#F26222` / `#FF8A50` | `#F26222` / `#C2440D` | Coates orange, orange text |
| Pistachio | `#B5EB84` | use a darker edge on white | issued or on-hire liquid |
| Silver | `#CFD8E4` | steel grey on white | returned gear |
| Lavender | `#C2B3F4` | deep lavender on white | named historical comparison |
| Amber | `#F3C77D` | dark amber on white | a specific follow-up due |
| Coral | `#F39B92` | deep red on white | a confirmed exception |

Give statuses a plain-language label. Gear held across a shift is an observation. Flag it for action when a recorded due time or an agreed site rule warrants it. Keep unrelated measurements neutral and give chart series labels or distinguishable marks on paper.

Test tag colours by quarter: Dec-Feb red `#E5322D`, Mar-May green `#2FA84F`, Jun-Aug blue `#2F6FE0`, Sep-Nov yellow `#F5C518`.

## Type

Inter, embedded (never loaded from the web). Tabular figures. Body 14px, card titles 16px/600, page titles 26px/700 with -0.02em tracking, eyebrow labels 11-13px uppercase with 0.14-0.2em tracking. Big numbers are 700-800 weight.

## The frame

1. **Sign-in page**: use a shared MyGear HQ and client masthead, labelled fields and one orange primary action. Use the same hierarchy for worker badge entry and company selection.
2. **Top bar** uses the MyGear HQ masthead with Coates, the client logo, the job name, search, the SiteIQ pull time and the theme switch. An orange rule identifies the header.
3. **Tabs** under the top bar with a sliding orange ink bar. Count badges on tabs that need attention.
4. **Overview first**: eyebrow, one-line headline, day strip, four or five KPI tiles (each clickable to its tab), "Three things to know right now", then "Why Coates is on site".
5. **Everything is clickable**: any person, company, tool or line opens the side drawer with the detail. Tiles go to their tab.
6. **Search anything** in the top bar: people, companies, tools, item numbers, consumables, codes.
7. **Footer**: author line, job line, copyright line.

## Components

- **Cards**: 14-16px radius, 1px border, soft shadow, title + one-line plain sub-heading that says what the reader is looking at.
- **Cylinders** for counts over time or by group (never square 3D blocks), with liquid clipped to the measured amount.
- **Dials** for a share of a whole; **bars with a track** for rankings; a tick mark on the bar for a minimum or a record.
- **Stats row** for 3-5 headline numbers; use steady, tabular figures.
- **Pictures**: load a thumbnail in lists. On enlargement, use the best available source up to 3840px. Fit smaller originals at their natural size.
- **Pills and chips**: rounded, small, status colours only.
- **Reminder boxes**: use a named amber follow-up with a text label.
- **Progress**: show the measured percentage and stage in words. Keep unavailable and measured zero distinct.

## Motion

Keep glow inside the measured liquid or along a control’s edge. Use the same glass in upright tubes, pills, rings and arcs. Bubbles rise and break at the surface. A measured zero stays empty and still. Keep text, ratings, and primary numbers steady. Respect reduced motion, stop work when a view is inactive and render a static print copy.

## Paper

`?static` gives the light theme with every tab open, for the PDF. Printed documents are white, slate header band with the orange rule, Coates and client logos, a stats strip, tables with small uppercase headers, alphabetical order with sizes smallest to largest, and page numbers.

## Where a job differs

Change the tabs, the charts and the words to fit the job's data. Keep the frame, the tokens, the components and the rules. If a job needs a new kind of chart, build it from the same tokens and add it here.
