# Roster costs and toilet run-sheet printing — DRAFT

Author: Andrew Fisher.

Andrew requested one financial area, a forecast salary allowance column after ×2, removal of the extra running-sheet page, corrected toilet run-sheet printing and clear Coates P&L terminology.

The native running-sheet records and controls remain in Costs → Roster costs. Old running-sheet navigation redirects there; the extra menu destination is removed. The whole-job allowance appears in its own column after ×2, is attributed from its native record and included once in displayed roster totals. Daily rows reference that job total without exposing daily allowance rates. The P&L already carries the allowance once; its calculation is preserved. Unknown base salary stays explicit. The redundant allowance card is removed, and outdated forecast captions are corrected.

Toilet printing opens a stable one-A4-page preview for each native supplier load. Print / Save as PDF executes from a deliberate user tap, rather than a delayed timer, and the preview remains for retries after the print dialog closes. The first baseline desktop print was reproducible and generated a readable PDF; a universal failure is not claimed. Tests cover all five loads, print media, repeat taps and closing on laptop and phone. Native exact-reference transit logic is preserved.

Base: verified v8.58, SHA-256 3b37cef6118920d6e518314356de34caeb6e685c878c34a02c6f63317a9f00e7. No shared-record changes. Private financial evidence, PDFs and the Excel remain outside Git. Codex implements and independently reviews; Claude remains intentionally paused.

The roster uses Employment group, Ordinary and Worked hours; weekday per-item installation Revenue is distinguished from event hourly Revenue. Calculation notes are folded.

Build checks pass for the final candidate: SHA-256 71fdff199e5b09e6d67b2716cb6733ef4e69cb8b2fa3f002db5fec992527e888, 10,974,485 bytes. Focused checks and both sweeps are finishing. Early checks caught a build attribution scrub affecting a literal-name match; attribution now follows the native allowance record. Two test assumptions were corrected: CSS uppercase is compared without case, and legacy bookmarks retain their hash while opening the new Costs destination. Original private diagnostics are retained; no failure is suppressed.

Not ready or live until the board records final checks.
