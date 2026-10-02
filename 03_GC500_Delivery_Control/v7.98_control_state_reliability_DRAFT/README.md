# v7.98 — current drawer connection state and optional font preflight

Author: Andrew Fisher · 2 Oct 2026

**DRAFT — implementation and focused checks complete; combined build, independent final review and release checks are still pending. Not uploaded.**

An open asset drawer kept saying “Live · view only” after the service stopped answering. Reopening it during the outage gave it an Offline badge that then stayed Offline after recovery. The main record indicator was already correct; the drawer's badge was only calculated when it opened.

The existing `syncFooter()` now updates just that badge's text when the status or capability changes. It does not rebuild the drawer or its fields and introduces no timer. Repeated confirmation of the same status does not mutate the badge. On a view link the offline badge says “Offline · view only”, without promising a send.

The drop-sheet print preflight also handles browsers without `document.fonts` or `document.fonts.ready`. The old optional-API branch dereferenced null. The replacement uses the page's existing correct sibling pattern: wait when fonts are available, retain the image verdicts when fonts reject, and continue those same verdicts when the API is absent. The preparation and missing-image checks remain in force.

## Patch and integration

`patch_v798.py` uses the shared replacement helper. It requires `eq796` from v7.96, so it also applies after a later page carrying v7.96. It refuses a second run and a base without Equipment. The only changes are the small helpers in `control798_src.js`, their calls in `precisionTags` and `syncFooter`, and the one print promise fragment. No layout, storage key, record or Showcase changes.

Add this patch after v7.96 and any other independently owned patches in the official build command. The release coordinator owns the current live base, combined candidate and full regression checks.

## Focused verification

Private frozen base: **02eceb13bfc8113a4914f6779d95b6843b47713796036c8a03ec42cebfe3e643**, 8,907,616 bytes.

Patched focus candidate: **e430552d4788d052320773e90675fd93345db89c43a8e8d0625da8191d5e6bdb**, 8,908,140 bytes. These results apply to this focused candidate, not an unbuilt final release.

| Check | Result |
| --- | --- |
| Exact-source CPU cases | **13/13** |
| Browser — desktop 1440 × 900 | **15/15** |
| Browser — phone 390 × 844 | **15/15** |
| Official static page check | **Pass**, all six inline scripts parse; no added keys or credential |
| Wrong base and repeat application | Both refused before writing |
| Phone and desktop screenshots | Visually inspected; existing drawer layout retained |

The CPU cases cover absent, missing-ready, resolved, rejected and pending font APIs while retaining successful/failed/unknown image results. They also check both connection directions, capability wording, unchanged-status mutation avoidance and a closed drawer.

The browser cases use the actual page, hosted GET reads and test-only 503/version responses. They prove an outage and recovery update the same open drawer while preserving the same field and badge nodes, an unsubmitted draft, focus, caret selection and both drawer scroll containers. They also cover capability downgrade/upgrade and read-only outage/recovery.

Disabling a focused field on a capability downgrade already blurs it and can adjust the phone's scroll. An A/B test repeats the transition with the new badge refresh suppressed and enabled; the new refresh adds no focus or scroll change. It leaves the existing permission handling in control.

Every non-GET browser request is aborted. A second mock rejects any attempted shared-document write before transport. No record write was attempted. Console resource errors from the deliberately injected 503 responses and blocked Google tile-session POST are identified in the evidence; there are no page exceptions or unexpected console errors.

Run the focused cases on the final combined build:

```bash
PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
  node v7.98_control_state_reliability_DRAFT/evidence/control798_unit.js

PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
PRIVATE_OUT=/workspace/private-gc500-audit/control798-final \
CHROMIUM_PATH=/usr/bin/chromium \
  node v7.98_control_state_reliability_DRAFT/evidence/control798_browser.js
```

Use the environment's installed Playwright through `NODE_PATH` when it is not installed in this checkout. Chromium needs the usual network-enabled execution permission for the official GET path.

The JSON results and executable tests are under `evidence/`. Screenshots remain private at `/workspace/private-gc500-audit/control798/` because they show operational record details. The original browser audit and failure reproduction remain under `/workspace/private-gc500-audit/appaudit794/`.

## Remaining review

Implementation, focused tests and visual inspection are complete. A separate agent must review the final patch/candidate and the release coordinator must run the final combined checks before this becomes ready to upload. No independent final review or publication is claimed here.
