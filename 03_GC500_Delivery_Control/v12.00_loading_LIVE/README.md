# Loading and responsiveness

Author: Andrew Fisher

VERIFIED LIVE — 25 Oct 2026 05:14:31 AEST. Independently implemented, tested and
published by Codex; no second-agent review claimed. READY source:
`a5431b396a327077983ca5a654f54a0f968b780d` on `ccr-061f77e8-ivjhrv`.
The guarded upload passed. A separate public GET at 05:14:46 AEST matched every
byte and the v12.00 footer. Actual public UI 7/7, no page errors or writes;
phone screenshot inspected. A further Brotli download at 05:15:54 AEST matched
the exact candidate and measured 2,740,385 bytes, down from 7,844,902 (65.07%).

Andrew requested faster loading, responsive updates, clear high-resolution
rendering and animation, fewer freezes/errors, and easier finding. This release
reduces page weight and repeated work while preserving the source image pixels,
calculation rules, operational record, current Build cards and Showcase animation.

## Exact release

- Base: live v11.99, SHA-256
  `2c653073230aa8533fd2121cf87f3459c6fbde66a0aac22df564dc55161e671e`
  (22,045,297 bytes), archived at `e7788241d4c06f16755730041882f36c13ccb759`.
- Candidate: v12.00, SHA-256
  `2261fdc8c1043bad0ed582fac9240366ef112e1275e4962ced62068089c2de51`
  (15,175,515 bytes, 191 inline scripts).
- Media manifest:
  `41f15c79280eb20cd91a8b14990773facc955b46cff5d71bfe274a819c048fae`
  (1,986 entries). All 56 extracted files have been staged and publicly read back
  with their exact source bytes. The page subsequently published with this exact manifest.

## Change

The page is 31.2% smaller before transfer compression. Fifty-one images and five
fonts move from embedded base64 to existing content-addressed media hosting,
without re-encoding. Every referenced media descriptor remains. Sixty-four unused
descriptors are omitted from this page; server originals and older manifests stay
available. The existing 2,000-file guard and permissions remain unchanged.

The hidden map explorer loads when Map opens. The existing hosted-image loading,
error and retry handling covers the extracted URLs. Print fonts and exported SVG
images still load from absolute public view URLs.

Document rendering reuses its document-book and review identity lists within the
existing synchronous hold. Each paper retains its own source/fingerprint checks.
The finder reuses its index until the record identity/epoch, document registry,
date, event or view changes. Matching, ranking and destinations stay unchanged.
Build definitions still install at script execution and DOMContentLoaded.

## Measured result and limits

Paired read-only Chromium runs used a 390 × 844 viewport at device scale 3, the
same record and exact base/candidate hashes. Each timing is one controlled run,
not a field-device guarantee. The harness serves the HTML at the live address
and reads real service data; its static asset cache is not a mobile network test.

| Measurement | v11.99 | v12.00 |
|---|---:|---:|
| DOMContentLoaded, normal CPU | 4.36 s | 3.65 s |
| Documents navigation to paint, normal CPU | 1.81 s | 0.79 s |
| Four subsequent finder queries, normal CPU | 183–211 ms | 16–20 ms |
| Today navigation to paint, normal CPU | 1.72 s | 2.16 s |
| Costs navigation to paint, normal CPU | 9.35 s | 9.02 s |
| DOMContentLoaded, 6× CPU slowdown | 90.92 s | 17.54 s |
| Documents navigation to paint, 6× CPU slowdown | 28.97 s | 13.63 s |
| Costs navigation to paint, 6× CPU slowdown | 93.06 s | 79.40 s |

The first finder query still builds the index, and legitimate context changes
invalidate it. Today and Costs still have expensive redraws; this release does
not establish instant response everywhere, universal 4K frame rates, or a Samsung
Internet fix. Claude owns the handset investigation and v12.01/v12.02 work.

## Checks and reproduction

Run from `03_GC500_Delivery_Control`, using the shared harness and browser lock.
Set `NODE_PATH` and `CHROMIUM_PATH` for the execution environment. Keep raw pages,
profiles, operational values and screenshots in private storage outside Git.

```sh
bash toolchain/build.sh v12.00 v12.00_loading_LIVE/patch_v1200.py
python v12.00_loading_LIVE/tests/test_preservation1200.py build/GC500_v12.00/base_live.html build/GC500_v12.00/GC500_Delivery_Control_hosted.html
export PAGE=build/GC500_v12.00/GC500_Delivery_Control_hosted.html
flock /tmp/gc500-browser.lock node v12.00_loading_LIVE/tests/test_native1200.cjs
MOB=1 flock /tmp/gc500-browser.lock node v12.00_loading_LIVE/tests/test_native1200.cjs
flock /tmp/gc500-browser.lock node v11.99_build_cards_LIVE/tests/test_native1197.cjs
MOB=1 flock /tmp/gc500-browser.lock node v11.99_build_cards_LIVE/tests/test_native1197.cjs
flock /tmp/gc500-browser.lock node toolchain/harness/sweep.js
MOB=1 flock /tmp/gc500-browser.lock node toolchain/harness/sweep.js
# OUT must name a private directory for the actual 3840 × 2160 truck frame.
flock /tmp/gc500-browser.lock node v12.00_loading_LIVE/tests/test_uhd1200.cjs
```

`stage_media1200.py` uses the existing credential-safe uploader helpers. Its
unchanged-base/access guards, all exact media read-backs and manifest registration
must pass before page publication. `test_native1200.cjs` deliberately intercepts
one image response with HTTP 503 to verify the visible retry recovers; that
expected console message is separate from the clean navigation sweeps.

Release requires both complete sweeps, Build regressions, native preservation and
freshness checks, actual UHD render inspection, the normal guarded upload, a
separate public byte/hash read-back, and `test_live1200.cjs` with PAGE unset.
The read-only P&L crosscheck verifies category totals and deductions without
changing or publishing private financial values. Outstanding unpriced business
inputs remain explicit in the page.

Final acceptance: 18/18 static preservation; 32/32 native desktop and phone;
Claude’s v11.99 Build suite 26/26 desktop and phone; both shared sweeps pass all
27 routes, seven deep links and Back with zero page/console errors and attempted
writes. Actual UHD test 5/5, 3840 × 2160 framebuffer and PNG, four samples, loaded
truck with two grounded wheels and no GL error. Phone and UHD screenshots were
inspected privately. Sanitised receipts are in `evidence/`. The upload dry run
confirmed edit access and the exact unchanged v11.99 base.

The measured wire reduction is for the main HTML, with Brotli on both releases.
Extracted images/fonts download separately when used and retain their original
bytes; 65.07% is not a claim that all full-session traffic falls by that amount.
All figures in the timing table remain the pre-publication paired measurements.

Next ownership: Claude rebuilds v12.01 Build and v12.02 servicing-report drafts
on the verified v12.00 hash after their mock-up holds are cleared. His Samsung
Internet investigation remains separate. The remaining performance target is
Today/Costs redraw cost, especially under CPU stress; no fix for that is claimed
beyond the bounded improvements measured above.
