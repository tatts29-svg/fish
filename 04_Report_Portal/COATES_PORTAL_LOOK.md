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

Coates slate and orange carry everything. No blues, teals or violets as feature colours.

| Token | Dark | Light | Used for |
|---|---|---|---|
| `--bg` | `#0D1116` | `#F2F4F7` | page |
| `--panel` / `--panel2` | `#161B22` / `#1C222B` | `#FFFFFF` / `#F6F7F9` | cards, inset tiles |
| `--line` | `#262E39` | `#E0E4EA` | borders |
| `--tx` / `--mu` / `--dim` | `#E6EBF2` / `#97A3B3` / `#66717F` | `#1B2028` / `#5A6472` / `#8B94A1` | text, secondary, labels |
| `--head` | `#2A313C` | same | top bar (Coates slate) |
| `--or` / `--ortx` | `#F26222` / `#FF8A50` | `#F26222` / `#C2440D` | Coates orange, orange text |
| `--ok` / `--warn` | `#5FCB9A` / `#F2B544` | `#1B8755` / `#9A6400` | status only, never decoration |

Second and third chart series: pastel blue `#8FB2E0`, pastel sand `#F5DDAA`, slate `#6E7987`. Orange is always the first series.
Test tag colours by quarter: Dec-Feb red `#E5322D`, Mar-May green `#2FA84F`, Jun-Aug blue `#2F6FE0`, Sep-Nov yellow `#F5C518`.

## Type

Inter, embedded (never loaded from the web). Tabular figures. Body 14px, card titles 16px/600, page titles 26px/700 with -0.02em tracking, eyebrow labels 11-13px uppercase with 0.14-0.2em tracking. Big numbers are 700-800 weight.

## The frame

1. **Sign-in page**: near-black page with an orange glow at the top; "COATES | <name>"; one rounded card (26px radius) with a 4px glowing orange top edge; lock icon and "PROJECT ACCESS"; username, password, one full-width orange button; author line underneath.
2. **Top bar**: slate, sticky, "COATES" wordmark, client logo, job name, search bar, SiteIQ pull time with a live dot, theme switch. A flowing orange line under it.
3. **Tabs** under the top bar with a sliding orange ink bar. Count badges on tabs that need attention.
4. **Overview first**: eyebrow, one-line headline, day strip, four or five KPI tiles (each clickable to its tab), "Three things to know right now", then "Why Coates is on site".
5. **Everything is clickable**: any person, company, tool or line opens the side drawer with the detail. Tiles go to their tab.
6. **Search anything** in the top bar: people, companies, tools, item numbers, consumables, codes.
7. **Footer**: author line, job line, copyright line.

## Components

- **Cards**: 14-16px radius, 1px border, soft shadow, title + one-line plain sub-heading that says what the reader is looking at.
- **Cylinders** for counts over time or by group (never square 3D blocks), with the orange gradient first.
- **Dials** for a share of a whole; **bars with a track** for rankings; a tick mark on the bar for a minimum or a record.
- **Stats row** for 3-5 headline numbers; numbers count up on first view.
- **Pictures**: black stage, orange floor glow, bright orange outline, reflection, thin orange rounded frame, 512 x 512.
- **Pills and chips**: rounded, small, status colours only.
- **Reminder boxes**: orange left edge, pale orange fill, bold first line.
- **Progress**: a rounded orange bar with the percentage in large type and the stage in words.

## Motion

Lively but never in the way: staggered rise on entry, count-up numbers, a slow orange ember field and soft orbs behind the page, an orbiting border on the lead KPI, a pulse along process lines. All of it switches off under `prefers-reduced-motion` and in the print/PDF view. No animated blur filters (they wreck frame rate).

## Paper

`?static` gives the light theme with every tab open, for the PDF. Printed documents are white, slate header band with the orange rule, Coates and client logos, a stats strip, tables with small uppercase headers, alphabetical order with sizes smallest to largest, and page numbers.

## Where a job differs

Change the tabs, the charts and the words to fit the job's data. Keep the frame, the tokens, the components and the rules. If a job needs a new kind of chart, build it from the same tokens and add it here.
