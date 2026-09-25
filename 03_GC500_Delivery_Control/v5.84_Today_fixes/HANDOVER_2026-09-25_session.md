# GC500 — session handover, 25 Sep 2026 (Claude Code, the fish repository)

Andrew Fisher · Coates Industrial Solutions · GC500 2026

## Where to start

1. The v5.84 kit was sent to Andrew in the chat on 25 Sep 2026 (three zips: page and media, the CW3 plan, the
   source). Whether it is up on the site is his to confirm — do not assume either way. **Server v5.77 is unchanged.**
2. The handover package (`GC500_v5.83_handover.tar.gz.part00`–`part23`, 24 parts) was being uploaded to this session
   when it closed: parts 00–19 arrived and every one matched `GC500_v5.83_handover.SHA256SUMS`; **parts 20–23 had
   not arrived.** The tree is therefore NOT in this repository yet. When the last four parts are in a session, follow
   `HANDOVER_CLAUDE_CODE.md` section 1 (check every part, unpack, check every file, commit) — under
   `03_GC500_Delivery_Control/` in this repository, beside the K2 and Ampol suites, unless Andrew says otherwise —
   and then apply `patch_v584.py` to `print/build_asset_app.py` and put the v5.84 CHANGELOG entry at the top of
   `docs/CHANGELOG.md`.
3. Then the gate: `python3 tests/test_v583.py`, the data steps, `python3 build_all.py --only … app app-hosted`, the
   seal. All of it is **PENDING** for v5.84.

## What changed in v5.84

An audit of the live view link's Today view (`GC500_Today_Audit_25Sep2026.md`) read as a reader from outside the job,
and 26 replacements in `print/build_asset_app.py` that answer the nine defects it confirmed (`patch_v584.py`, the
diff, and the CHANGELOG entry beside this file). The live page at the time was pre-v5.83 (no event labour scope in
its data); the kit's page is the v5.83 kit's page with the same 26 replacements, verified in headless Chromium at
1440×900 and 390×844 against the live record.

## Waiting on Andrew

- The last four handover parts (20–23), so the tree can be committed here.
- The v5.84 upload (media, then the page) — his to do on the admin page.
- Wording decisions the audit raised and the fix did not touch: one vocabulary for the counts that disagree on one
  screen (2 due and all recorded · 8 recorded today · behind by 10 units · 58 dockets against 54 lines); whether
  Today should open on the position rather than the picture; one dropdown style for Tools and More.
