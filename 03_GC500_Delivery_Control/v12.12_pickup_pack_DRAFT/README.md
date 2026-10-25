# v12.12 Coates pickup pack — DRAFT

Author: Andrew Fisher

Codex owns the pickup PDF/export redesign on `ccr-061f77e8-ivjhrv`, claimed in `7b2ed36758f36f19668ff254d19ac1b60b7e3113`. Andrew requests Coates styling, a reference number and scan-to-navigate QR. He further clarifies that this flow briefs drivers only; remove its departure-record action and keep actual departure recording in the existing separate Left site workflow.

Current design: native searchable text, orange/charcoal header, consistent pack reference across PDF/text/share/email filenames, site references, vector area-navigation QR, sharp 50 m map and door close-up, selected inventory/ownership, holds and existing access guidance. The document reference is an export identifier, not a completed pickup record. Weights and dimensions are read from the existing identity-bound transport model. Recorded actual values are per unit; nominal/contract footprints stay labelled, catalogue weights and method limits are not substituted, missing values remain explicit. PDF and text carry the same facts, with a fingerprint guard against transport evidence changing during preparation or before export. No live record changes.

Base v12.11 SHA-256 `3b51c50a7766f2f37d222f49c2cad18c03eb868356c8019ce600581eac46915d`. Final candidate `d01878c99c7d8972beb8c6b76e16775d7c53f20551c4c3d41f422404d1616a67`, 15,324,794 bytes. Toolchain 196 scripts PASS; transport boundaries 13/13; preservation 11/11; native pickup/export 36/36 desktop and phone; separate native departure rehearsal 28/28 phone; real PDFs 16/16 each; synthetic single/multiple-long 16/16 and 18/18. QR destinations decoded from 150 dpi page renders; phone, PDF and long inventory images inspected. Single-reference examples fit two A4 pages. Desktop full navigation sweep completed with zero errors/writes; phone sweep is still running. DRAFT, not ready or live. Codex implements/tests/publishes independently; Claude retains Samsung, no second-agent review claimed.

Real PDFs, maps, screenshots and operational fixture details remain private. Repository evidence will contain only sanitised outcomes.
