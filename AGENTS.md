# Working on Andrew Fisher's repo — for Claude and Codex alike

Author: Andrew Fisher · Shutdown Manager, Coates · last updated 30 Sep 2026

Two AI agents work on this repo: **Claude (Claude Code)** and **Codex (ChatGPT Codex cloud)**. Same jobs, same
rules, same tools. One day one of you does a job, the next day the other picks it up. Everything either of you needs
is in this repo; nothing lives only in one agent's session. Read this file first, then
`03_GC500_Delivery_Control/STATUS.md`.

## Who you are working for

Andrew Fisher, Shutdown Manager at Coates. Call him Andrew. Plain Australian English, warm and practical, no
corporate jargon. Lead with the answer, then the reasons, then next steps. Metric units, 24-hour time, dates like
29 Sep 2026, times in AEST (Brisbane, UTC+10, no daylight saving). Never invent facts, figures or policies; say
plainly what you could not check. Every deliverable says "Author: Andrew Fisher".

## What is in the repo

| folder | what it is |
|---|---|
| `03_GC500_Delivery_Control/` | **the live job**: the GC500 Delivery Control page for the Gold Coast 500 (Coates event hire) |
| `03_GC500_Delivery_Control/toolchain/` | build, check, test and upload a release — use these, not copies |
| `03_GC500_Delivery_Control/vX.YY_<what>_LIVE/` | one folder per release: the patch, its source, tests, evidence, README with the LIVE time |
| `03_GC500_Delivery_Control/STATUS.md` | **the shared board**: what is live, who is working on what, open questions for Andrew |
| `01_Reporting_Suite/`, `02_Ampol_Reporting_Suite/`, `Skill_coates-site-suite/` | other Coates reporting work |
| `HANDOVER.md` | the older handover (25 Sep 2026); history, not the current state |

## The GC500 page in one paragraph

A single self-contained HTML page (about 8.3 MB) served by a small Node service on Railway at
`https://gc500-production.up.railway.app`. The public **view link** is `/v/Coates-GC500-2026` (read only). The
**edit link** is `/e/<edit key>` and the key is secret. The page keeps a shared record (deliveries, pins, photos,
units, fencing dockets and more) on the service, synced document by document. The page on the service **is** the
source: every release starts from the live page, applies a patch, and goes back up.

## How a release goes (both agents, every time)

1. **Pull** the shared branch and read `STATUS.md`. If the other agent has claimed something, do not touch it.
2. **Claim** the next version on `STATUS.md` (one line: version, what, who, when) and push that before you start.
   If the push is rejected, somebody else just claimed: pull, take the next number.
3. **Write the patch** as `patch_vNNN.py` plus a `<name>NNN_src.js` / `.css` if needed. Patches use the shared
   helper, which insists every replacement matches exactly once:
   ```python
   import os, sys
   sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
   from rep import rep
   ```
   A patch refuses to run twice (look for a function it adds) and refuses to run on the wrong base (look for a
   function the previous release added).
4. **Build** from the live page: `toolchain/build.sh v7.44 path/to/patch_v744.py` → `build/GC500_v7.44/`.
   It scrubs name attributions out of the page text and runs `check_page.py` (every inline script parses, no new
   keys, no edit key, author line present).
5. **Test** with the harness (read only — every write the page tries is aborted):
   - practice tests for the change: `harness/open_page.js` opens the build at the live address reading the live
     record. For edit-mode practice, override in the page: `window.capability = () => 'edit'; window.mayWrite = () => true;
     SYNC.readonly = false; SYNC.level = 'edit'` and replace `SYNC.db.doc` with a capture so nothing is sent. The page
     polls the service every 4 s and will flip back to view-only unless the `/api/version` answer is also overridden
     (see `v7.41_photos_stick_LIVE/evidence/practice_tests.js`).
   - both sweeps: `PAGE=... node harness/sweep.js` and `MOB=1 PAGE=... node harness/sweep.js`. Pass is 21 tabs,
     0 errors, 0 console errors. `GC500_DEBUG=1` prints any request the rig could not fetch.
   - look at a phone screenshot of what you changed before calling it done.
6. **Upload**: `python3 toolchain/upload_page.py build/GC500_v7.44/GC500_Delivery_Control_hosted.html`. It refuses
   if the live page changed since your build started (the other agent released in between): pull, rebuild, retest.
   It proves the view link serves your build byte for byte and prints the LIVE time.
7. **Record it**: `vX.YY_<what>_LIVE/` with the patch, source, tests, evidence and a README (Andrew's words, what
   changed, checks, the LIVE time); update `STATUS.md`; commit; push.

**Never leave work only on your own machine.** Whenever you stop — waiting on Andrew's approval, a question, or the
end of a session — push the patch, its source and its tests in `vX.YY_<what>_DRAFT/` with a short README saying
where it is up to. The other agent may be the one who finishes it, and can only do that from what is in the repo.
Rename the folder to `_LIVE` when it goes live.

**The other agent does not hear your chat with Andrew.** Anything he decides that matters beyond the one job — a
rule, a price, a yes or no — goes into `STATUS.md` (or into the rules below if it is lasting), in his words.

Andrew asks for changes and expects them live once tested — that has been the way since 25 Sep. Anything he
marks as a draft, or anything risky to the record, waits for his yes.

## Rules that are never broken

- **The edit key never goes in a file, a commit, a log, a screenshot or a message.** It lives only in the
  environment variable `GC500_EDIT_TOKEN`. The toolchain reads it from there and redacts it. Links and QR codes
  always use the view link `Coates-GC500-2026`, never the edit key.
- **Tests only read the live service** (GET). Never write to the live record in a test.
- **Record changes only when Andrew asks**, and then only through the page's own functions on the edit link, named
  "Andrew Fisher via <Claude or Codex>", with a backup of what you are changing first and a fresh read afterwards to
  prove it. Keep the backup and the log in a `record_<date>_<what>/` folder. Example:
  `record_29Sep2026_master_plan_positions/`.
- **No pre-bill amounts for anything.**
- **Email: drafts only, never send.** PDFs are attached, not linked ("we are emailing the PDFs, no link").
- Anything shown to partners or sub-hire companies: no mention of the hidden tabs, and never "sub-hire partners" or
  "our partners".
- A rule on the page never hides a record: data already recorded is always shown somewhere.
- Do not kill processes by pattern (`pkill -f`); stop only what you started, by its id.
- Commits: plain English subject saying what changed and whether it is live. No AI model names in READMEs, code or
  the page. Author "Andrew Fisher". Each agent adds only the attribution trailer its own platform requires.

## Rules the page lives by (settled with Andrew — do not undo)

- **Master plan wins** (v6.85, confirmed 29 Sep 2026): a reference the master plan D001-26003-03 tags on the unit
  takes its position from the plan, always. Pins are used only where the plan has no unit tag.
- **The pit lane is the way in** (v7.42): everything in Macintosh Island Park comes off the Gold Coast Highway into
  the pit lane at its north-west end and drives it the way the race cars go.
- **Photos: one document per photograph** (v7.41), sent from an outbox on the phone until the service has them.
  Never go back to one list per reference; that is what lost photographs.
- **Sub-hired locations say so first** (v7.43) and carry no Coates contract, branch or Rental ID.
- **What a reference is decides what its drawer offers** (v7.43): no accessories on generators, towers, barriers.
- Track mat and water-filled barriers have no asset numbers (v7.38). Fencing purchase orders use the Receipt ID No.
  (v7.39). Fencing hire agreements and service notes are typed on the Fencing tab (v7.40).

## Setting up a machine to do this

Needs `python3`, `node` 20 or later, `curl`, and a Chromium for the tests:
```bash
cd 03_GC500_Delivery_Control/toolchain
npm install
npx playwright install --with-deps chromium    # or set CHROMIUM_PATH to an existing Chromium
```
Network: `gc500-production.up.railway.app` is required; the sweeps also load map tiles and fonts from the usual
public hosts. For uploads, `GC500_EDIT_TOKEN` must be set in the environment.
