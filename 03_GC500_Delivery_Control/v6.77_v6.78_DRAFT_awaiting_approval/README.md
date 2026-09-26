# v6.77 – v6.78 — DRAFT, awaiting Andrew's approval (NOT live)

Built 26 Sep 2026 on top of the live v6.73, from the re-audit list Andrew asked to proceed with, and his labour,
running-sheet and questions requests the same evening. Nothing here is on the live service. Each item goes live only
after Andrew says yes to it.

Author: Andrew Fisher

## v6.77 (candidate)

| File | What |
|---|---|
| patch_v677.py | Wording fixes D1–D16 from the re-audit, reusing the v6.74 wording only. There is no layout change, and "race day" is kept as Andrew's wording |
| patch_v677b.py | D10 phase/day on gap days; D11 the next delivery day reads "Still to come" (header and Today); D15/D16 wording; P1 photo cards use the server's thumbnails (91% smaller); phone tab labels |
| patch_v677c.py | Accessibility A1–A4: the tab list, the plates, contrast and sideways-scrolling tables. The automated WCAG A/AA check is clean on every page checked |
| patch_v677d.py | **Expected labour** (Andrew: tick when complete; every line, every charge, down to the branch). Details below |

**Expected labour, today:**
- Charged is $9,728.14, equal to Costs to the cent.
- Expected on site is $7,875, to come is $23,126, and later (demob and cleaning) is $32,401.
- It is broken down by charge type and by branch, on Pricing and on each branch plate.

## v6.78 (draft)

| File | What |
|---|---|
| patch_v678.py | **Running sheet** and **Questions** page, both under Tools |

**Running sheet:**
- One row per person per day.
- Start and finish can be edited, and the hours, the normal / ×1.5 / ×2 split, the pay (where a rate is entered), meals, accommodation, R&M, consumables and stationery all work themselves out.
- It adds up by day and across the whole job. It uses the same lines the Costs tab reads.
- **Pay rules (Andrew's), editable on the sheet:**
  - Coates CNA: 7.6 h normal, then 2 h at ×1.5, then ×2.
  - Labour hire: 7.5 h normal, then 2 h at ×1.5, then ×2.
  - Saturday: the first 2 h at ×1.5, then ×2.
  - Sunday: all ×2.
  - Weekday unpaid break of 30 min; weekend breaks are paid.
  - Salary: hours only.
- **Effect on Costs:** build and demob hours go from 2,003.5 h to 1,909 h because of the weekday break, and race-weekend hours from 159 h to 156.5 h.

**Questions page:**
- 59 open questions, grouped by branch, fencing, transport, labour, and schedule and plant.
- Each question has "Open where it lives" and an answer box that keeps the name of whoever answered.

`pack/` holds the before/after pairs and the draft screenshots.

## Server v5.84 (staged, not deployed) — `server_v5.84/`

- Compression: brotli for the page, and gzip/brotli for model and text files.
- A write is saved before it is confirmed, and saves are flushed on shutdown.
- A damaged record recovers from a snapshot. Snapshots are also taken at start-up.
- `__proto__` is rejected.
- HSTS and nosniff headers are added.
- Disk-full returns 507 instead of crashing.
- A wrong-key limiter is added.

Tests: 49/49. DEPLOY.md has the deploy and rollback steps.

**Owner decision:** what the view link can read. NOTES.md sets out the options; the smallest is making export and invoices edit-only.

## Still in progress

- Satellite Plan Explorer fixes (black patches, phone, imagery failure).
- Coates Way machine fixes (first view, load timeout, compression).
