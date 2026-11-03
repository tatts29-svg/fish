# Still on site — Map Explorer v12.90

Author: Andrew Fisher

DRAFT — implementation and verification in progress. No new release is claimed.

A visible Still on site button highlights equipment remaining to collect using the native departure projection. Partly collected groups retain their remaining quantities; missing quantities and review cases stay explicit. It preserves the source plan footprints and recorded door geometry introduced in v12.88. The toggle changes presentation only, with no operational or financial writes.

Base: v12.89, SHA-256 `89993cbd62c29f0a28b3dc5edc4365e8baab03a0af4858633441acc6faacab40`, 16,958,973 bytes. Source `a46705013397cf92d634ab374a5ba8dfdf26a586`. The preceding fencing release was completed before this build and is retained.

Machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`, intended unchanged. Existing map modes, records and financial calculations remain authoritative.

Before release: verify native inclusion/exclusion and quantities, partial/unknown/review cases, actual orange map ink and button behaviour, source geometry, location/list handling, refresh, mode changes and restoration; inspect actual phone/tablet screenshots; run the existing departed-map regression plus full desktop/phone sweeps. Use the shared read-only harness and guarded release toolchain. Keep private operational evidence outside Git.
