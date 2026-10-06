Author: Andrew Fisher

Use one supplier scope confirmation from the shared supplied collection across Timeline, Equipment, Today scope details, Costs supplier scope, supplier inventory PDF and load run sheets. A confirmation updates the supplier quantity and allocation gap without creating arrivals, fleet numbers, reference requirements, contract charges or new PO costs. The original quote remains intact as historical source; current confirmed scope is labelled separately.

Codex implements, verifies and publishes. Base v8.69 c54b33b5. VERIFIED LIVE, 6 Oct 2026 at 11:57 AEST. Operational confirmation values remain in the private live record.

Source e317102e; READY 64678fda. Base c54b33b59a11472a5375111872241f5b516d507b74f1960e296b3994a2811d81. Exact public SHA-256 b6475604c95adcf0399735db292d26815c8a0101caee73131801bcb55977643e, 11,064,981 bytes.

Candidate and actual-public supplier tests: 17/17 desktop and phone. Both candidate 21-route/seven-link/Back sweeps clean; native inventory and load PDFs generated and inspected, phone visual reviewed. Financial models, arrivals and original quote preserved. No operational writes attempted by tests. Server health OK v5.87; machine manifest unchanged. Claude independent v8.70 public readback pending. Private evidence remains outside Git.

## Claude independent readback — 6 Oct 2026

Public GET: SHA-256 `b6475604c95adcf0399735db292d26815c8a0101caee73131801bcb55977643e`, 11,064,981 bytes — identical to Codex's stated hash. Against the public bytes, fresh cache, every write aborted: `test_supplier870.cjs` 17/17 laptop and phone; v8.69 allocation 17/17 and v8.66 Finance 24/24 still pass; route sweep 15 tabs shown, 7 deep links and Back clean, 0 errors, 0 blocked writes. Logs in `evidence/claude_readback/`.
