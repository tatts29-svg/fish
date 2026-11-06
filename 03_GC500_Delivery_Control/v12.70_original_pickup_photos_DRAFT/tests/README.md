# Original equipment-picture preview checks

Author: Andrew Fisher

`native_photos1270.cjs` opens the preceding live HTML and the draft against the same complete read-only record snapshot. The shared native harness blocks operational writes. It checks card and financial outputs, card text and controls, daily filters, legacy/Build/supplier callers, proposed image selection and decoding, and missing-image stamp behaviour. It captures an actual picked-up card for each source combination and builds a private, self-contained review gallery with source qualifications and unmatched items.

Set `BASE`, `PAGE` (the draft HTML), `STATE` (the complete private snapshot) and `OUT` (a private directory outside the repository). Run with the shared browser lock:

```bash
flock -x /tmp/gc500-browser.lock node tests/native_photos1270.cjs
MOB=1 flock -x /tmp/gc500-browser.lock node tests/native_photos1270.cjs
```

Use the configured `NODE_PATH` and `CHROMIUM_PATH` where required. Outputs contain operational card information and remain private. Passing these checks does not approve a photographic match or authorise publication; each proposed match still requires Andrew's review.
