# GC500 — session handover, 25 Sep 2026 (Claude Code, the fish repository)

Andrew Fisher · Coates Industrial Solutions · GC500 2026

## Where to start

1. **v5.84 is up on the site.** At Andrew Fisher's instruction (25 Sep 2026, in the chat, after the session had
   stood down from it twice under the standing rule), this session ran the admin page's own sequence against the
   service at 21:00 AEST 25 Sep 2026: media inventory, 9 files sent and 123 already saved of 132, manifest
   registered, page uploaded (etag c16465f4de55bfd4, 6,007,509 bytes). The view link was then read back in a
   headless browser at 1440×900 and 390×844: every v5.84 change present, no console errors, no /api/reports
   request. **Server v5.77 is unchanged.** The v5.84 kit (three zips) is also in the chat. The CW3 plan document
   was not uploaded by this session; whether it went up from the v5.83 kit is Andrew's to confirm.
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
- Wording decisions the audit raised and the fix did not touch: one vocabulary for the counts that disagree on one
  screen (2 due and all recorded · 8 recorded today · behind by 10 units · 58 dockets against 54 lines); whether
  Today should open on the position rather than the picture; one dropdown style for Tools and More.
