# Restore map equipment shapes and departure labels

Author: Andrew Fisher.

DRAFT — the exact-base correction is built and focused browser checks pass. Final paired dashboard sweeps, source handover and guarded publication remain.

Andrew reported that map symbols no longer depicted equipment with door swings, and that collected items appeared not complete. v12.85 updated the Explorer scripts but left two parent adapter gates pinned to the previous script identities. The gates rejected the new files without a runtime error. As a result, the equipment-shape/map-unit layer and the departure/search/Demob layer did not mount. Earlier image-loading/navigation checks did not detect this regression.

This correction admits the exact reviewed v12.85 six-script list in both gates, retaining previously accepted builds and rejection of unknown builds. It restores existing equipment outlines, plan-derived door swings, map-unit integration and departure labels derived from the native collection model. It does not mark equipment complete, alter collection records, change source geometry or replace any equipment depiction.

## Exact scope

- Starting source: `a06dd5a5c606f76f7c5b531c850bae39d1521683`, branch `ccr-061f77e8-ivjhrv`.
- Claimed source: `bd140118d193a131fd916d08801d58430b58899c`.
- Live85 base: `be38bdbeffbf82adbb6a6f51b03bba66a1184dd3618b3d0c5504fdb6f7ca196a`.
- Candidate86: `92c1a3163ecf76e05e42d47ce4c94c78dea8d60e28d5b506b0cec560c7ce2865`, 16,949,425 bytes.
- Map machine stays `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`.
- Exactly three parent lines change: the two gates and release footer. Every other parent byte, including operational and financial logic, is identical. The shared replacement helper normalises indentation within one changed gate line.

## Verification

The original85 page fails the new native browser check because its shape, map-unit, spot, departure, search, area and Demob adapters are missing. The corrected86 page mounts all seven, draws equipment with a traced door, and agrees with the existing native collection model for the checked departure statuses. Eight synthetic bridge cases exercise the existing status states and unavailable-source behaviour without writing any record.

Independent review executes both actual mount guards over 32 positive and negative cases. It confirms that mixed, unknown, reordered, additional and missing scripts are still rejected, as are foreign origins, wrong paths and incomplete frame prerequisites. Exact-base and repeat-application guards pass. No additional parent identity gate was missed; the existing three 3D equipment dependencies match their pinned hashes.

The shared build checks all 223 inline scripts. The standard uploader dry run confirms edit access and the unchanged base. Tests block operational writes; private screenshots, runtime results and records remain outside Git.

## Ownership and limits

Codex owns implementation, testing and guarded publication. Claude retains P&L and operational records; fencing82 remains held. No Claude review of this correction is claimed.

The separate 3D-source mismatch is not corrected by these gates: photographic city ground and buildings still come from Google's mesh, whereas satellite uses the approved Mapbox aerial. A flat aerial is not a replacement photographic city model; no new imagery date or 2026 capture is claimed. Existing 3D remains available. A private raster-on-globe experiment did not produce a usable replacement and is not part of this release.
