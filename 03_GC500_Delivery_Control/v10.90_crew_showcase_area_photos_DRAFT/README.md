# Crew achievements and optional area photos

Author: Andrew Fisher.

Status: READY TO UPLOAD. Required checks passed; guarded publication and public read-back are next.

The official candidate is `b447b32ee6afe9d1a64f45a8c53a67e7d01f4d11a5a04bbdcd04bf9ec2b13111` (18,595,391 bytes). It passes the shared page checker and protected-source checks. Independent reviews cover physical metric meanings, narration order, photograph identity and context labels. Final native phone practice passed 48 checks. Desktop and phone sweeps each passed 25 routes, seven links and Back with no errors or attempted native writes. The earlier isolated status-GET 403 is retained in private evidence; the unchanged candidate passed its rerun. See `validation.json` for exact checks and limits.

Andrew requested a fuller account of both crews' recorded work in Showcase, allowing additional pages. He also requested an optional photograph of a whole area containing several items, linked consistently to the relevant references and assets.

The release starts from verified live v10.89, pinned by `base.json`. The two scopes share the existing native record, photo storage, sync and visual components. Area photos support explicit individual-unit and reference-level links, including unnumbered items, without inventing unit identities. There are no bulk record changes, fabricated quantities or completion inferred from photographs.

`patch_v1090.py` composes the area-photo and Showcase patches, then changes the release footer. Each implementation has its own focused tests and scope notes. Final publication requires the official build, affected focused tests, both route sweeps, phone screenshot inspection, the guarded uploader and exact public read-back.

Private source material, actual records, screenshots, contact details and raw logs remain outside Git. Existing audio and servicing content are preserved. Additional narration is outside this implementation until an authorised working audio connection is available.
