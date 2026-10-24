# Loading and responsiveness

Author: Andrew Fisher

DRAFT — measurements and bounded fixes under v12.00. Starting shared source
82c26acaca004f27de3e36235737e00add6299ec; live v11.98 SHA-256
6e92bd7e5fb09b86d2d184638a9cea3d41d02509c4fdd4243b8ce5ab273c7dc7.

Measure loading, long tasks, navigation/search, idle redraw and high-DPI rendering
before choosing changes. Preserve source image quality, authoritative data and
existing interactions. No operational record changes. Keep raw records/pages and
screenshots private; publish sanitised timing/error evidence and implementation.

Claude retains v11.99 Build cards with its mock-up hold and the separate Samsung
Internet handset investigation. No browser-specific fix is claimed here.

Required before release: final live-base build, meaningful before/after checks,
focused regressions and both navigation sweeps, phone screenshot inspection,
guarded upload and separate public byte/UI verification.

Implementation in progress, 25 Oct 2026 04:44 AEST:

- Extract 56 existing binary images/fonts without recompression. Additive media
  staging and every public byte/hash read-back passed; no page publication yet.
- Retain all used media entries; omit 64 unreferenced table descriptors only.
  Previously registered originals/manifests remain on the server. New manifest:
  `41f15c79280eb20cd91a8b14990773facc955b46cff5d71bfe274a819c048fae`
  (1986 files, within the existing guarded limit).
- Load the hidden explorer when Map opens. Reuse document-book/review identity
  reads within the existing synchronous hold; preserve each paper's validation.
- Reuse the finder index while record epoch, record identity, documents, date,
  event and view inputs remain current. Matching and ranking stay unchanged.
- Initial static preservation checks pass; final native tests and comparable
  timing runs remain outstanding. Raw evidence stays outside the checkout.
- Latest board puts Claude's v11.99 at READY. v12.00 will rebase onto that release
  and rerun final checks when it is live. Current patch still pins v11.98.

No READY/LIVE claim. Do not publish this draft. No operational record changes.
