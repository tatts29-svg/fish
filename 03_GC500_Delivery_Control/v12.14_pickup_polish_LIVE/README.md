# Pickup pack print presentation

Author: Andrew Fisher.

Andrew asked: “Remember we want this to look good like we care”. The driver PDF retains its Coates branding, selected equipment, recorded contents, source photographs and location-specific navigation. This change reduces repeated header space, adds numbered photo captions and packs photos into consistent rows while preserving their aspect ratios and original detail.

LIVE — 25 Oct 2026 at 12:45:49 AEST. Base: verified v12.13, SHA-256 `8b524dbcb293d487c04465734d03df5182a74ef75a8214c03559bf674a2066cf`. Only the PDF renderer and release footer change. No source records, map geometry, doors, restrictions, navigation, collection ledger, email sending or tracker publication change.

The v12.13 PDF checker and retained native building assertions exercise checked and unticked restrictions, source photos, contents, navigation QR destinations and stale-export protection. The native test pins one freshly read service snapshot before comparing the record, so ongoing site updates cannot invalidate the local-mutation comparison; every network write remains blocked. This release adds print checks for every photo, caption readability and content margins, plus a five-photo packing example. Exact-source preservation, final desktop/phone navigation sweeps and visual inspection passed before guarded publication.

Raw PDFs, source-record snapshots and screenshots remain in private evidence storage. Only sanitised check summaries belong here.

Live build: `91f9006070d1269eb6e9ae807076e9146e7e52e6fbfc68a01d840f5666559a11` (15,338,612 bytes). The five-photo layout example is three pages, retaining all photos and handover text. Compact headers and numbered captions use native PDF text; photos keep their aspect ratio, and the final handover panel uses the spare column alongside an odd final photo.

Checks passed: toolchain 196 scripts; exact preservation 5/5; native building flow 10/10; checked/unticked PDF content and QR checks 20/20 each; synthetic five-photo single 20/20 and long multi-location 21/21; print checks 5/5, 5/5, 5/5 and 4/4. Both desktop and phone sweeps covered 27 routes, 19 direct panes, seven deep links and Back, with no page errors, console errors or attempted record writes. Phone and rendered PDF images inspected. Upload dry run confirmed access and unchanged live base. Sanitised results are in `evidence/checks.json`. Independent implementation/testing; no second-agent review.

Published from READY source `f8d2d6239ea39426ace45d0e49e4f217481d10d5` through the unchanged-base guard. Separate public GET at 12:46:01 AEST matched every byte, footer and renderer version. A fresh actual-public-phone export passed 10/10; checked and unticked PDFs each passed 20/20 content/QR checks and 5/5 print checks, with live images inspected. See `evidence/live.json`. No operational records or tracker were changed.
