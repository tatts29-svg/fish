# Pickup pack print presentation

Author: Andrew Fisher.

Andrew asked: “Remember we want this to look good like we care”. The driver PDF retains its Coates branding, selected equipment, recorded contents, source photographs and location-specific navigation. This change reduces repeated header space, adds numbered photo captions and packs photos into consistent rows while preserving their aspect ratios and original detail.

Draft, not live. Base: verified v12.13, SHA-256 `8b524dbcb293d487c04465734d03df5182a74ef75a8214c03559bf674a2066cf`. Only the PDF renderer and release footer change. No source records, map geometry, doors, restrictions, navigation, collection ledger, email sending or tracker publication change.

The v12.13 PDF checker and retained native building assertions exercise checked and unticked restrictions, source photos, contents, navigation QR destinations and stale-export protection. The native test pins one freshly read service snapshot before comparing the record, so ongoing site updates cannot invalidate the local-mutation comparison; every network write remains blocked. This release adds print checks for every photo, caption readability and content margins, plus a five-photo packing example. Exact-source preservation, final desktop/phone navigation sweeps and visual inspection must pass before guarded upload and public read-back.

Raw PDFs, source-record snapshots and screenshots remain in private evidence storage. Only sanitised check summaries belong here.
