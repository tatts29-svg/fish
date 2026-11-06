# GC500 Delivery Control — v5.84 Today fixes (25 Sep 2026)

The GC500 page (gc500-production.up.railway.app) is built from Andrew's GC500 handover package, which is not in
this repository (1.5 GB of tiles, models and sources). This folder keeps the record of the 25 Sep 2026 audit of
the view link's Today view and the fix that came out of it.

| File | What it is |
|---|---|
| `GC500_Today_Audit_25Sep2026.md` | The audit: nine confirmed defects, the disagreeing counts, mobile, accessibility, and the CEO-lens visual changes |
| `patch_v584.py` | Applies the 26 fixes to a v5.83 `print/build_asset_app.py` or to a built v5.83 page: `python patch_v584.py <file>`; it stops and changes nothing if any replacement does not match exactly once |
| `build_asset_app_v5.83_to_v5.84.diff` | The same change as a unified diff against the v5.83 builder |
| `CHANGELOG_v5.84_entry.md` | The entry for the package's `docs/CHANGELOG.md` |
| `HANDOVER_2026-09-25_session.md` | Where this session left things, and what the next one does first |

The deployable page (`GC500_Delivery_Control_hosted.html`, 5.9 MB) and the patched builder were sent to Andrew as
`GC500_v5.84_page_fix_kit.zip`; they are not committed here. Upload is one file on the service's admin page; no
server change, no media import.
