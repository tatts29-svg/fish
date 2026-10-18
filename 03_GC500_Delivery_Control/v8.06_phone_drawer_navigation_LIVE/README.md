# Phone drawer Navigate containment

Author: Andrew Fisher.

**LIVE 2 Oct 2026, 16:22 AEST.** The public page was independently read back byte for byte; all operational collections and record3538 remain unchanged.

On a 390px phone, WC31’s Navigate button extended left out of its action column and covered part of the SHORT badge. Two scoped CSS rules let the existing button and its destination badge wrap inside that column. The component, text, colours and navigation action are retained. WC31’s header remains 156.109px high at 390px; desktop geometry is unchanged.

`patch_v806.py` applies to the fresh live page and adds `drawer_navigation806_src.css` plus the release marker. It refuses repeat application and an incompatible base. Its `--reverse` option removes its own exact style block and restores the previous release marker; the source checks prove this restores every original byte.

Official candidate: `build/GC500_v8.06/GC500_Delivery_Control_hosted.html`, 9,091,870 bytes, SHA-256 `eaf5182106015aa68c06452493c208f6ca9551b7f164d56089e343920b9dc8f9`. Fresh live base: v8.03, `fa32b0a1937b329077923b960688a8927fbaaa2e6283d4d1ce2c6732eb98c213`. All scripts, DATA, existing CSS and other markup remain byte-for-byte unchanged.

Validation:

- 109/109 actual drawer checks at 320, 390, 430 and 1440px: WC31, WC20, P55, AA and WC100. Covers SHORT visibility, button/label containment, unchanged URLs, native Navigate clicks and the existing unavailable-position state. Maps targets were captured before any external request.
- 6/6 exact-source, reversal, reproduction and patch-guard checks; official static build passed.
- Required standard desktop and phone sweeps: each 21 tabs and seven links, zero page or console errors.
- Independent phone sweep: 21 tabs and seven links, zero page or product console errors. Its strict transport wrapper deliberately blocked one Google tile-session POST, producing one matching network console error; this is recorded in the evidence. No operational write was attempted.
- Phone screenshots inspected by the implementer and an independent reviewer. Independent source review confirmed exact preservation.

Reproducible tests, measured rectangles, screenshots and sweep results are in `evidence/`. The saved departure controls in v8.04 are separate and unchanged. No operational records were changed. Root performed guarded publication after final checks.
