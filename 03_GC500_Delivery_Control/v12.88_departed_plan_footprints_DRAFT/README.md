# Departed equipment follows its plan footprint — v12.88

Author: Andrew Fisher

DRAFT. Implementation and verification are in progress. This is not a release handover.

Departed equipment previously received a separate round symbol at its reference location. Its traced plan footprint appeared only when selected or included in another equipment layer. This change makes eligible departed references use the existing plan geometry automatically, preserving the drawing's position, orientation and recorded door geometry.

The scope is map presentation. Existing completion and departure readers remain authoritative. No operational or financial record is changed. A partial collection remains a reference-level count: the source does not assign every individual asset to a particular polygon. Shared, moved or missing footprints must not be represented as invented exact shapes or door sides. Existing standard/catalogue outlines remain distinguishable from traced geometry.

Starting branch: `ccr-061f77e8-ivjhrv`; claim commit `f018e094895dd0370bf79e615578f81eedf48913`.

Base page v12.86: SHA-256 `92c1a3163ecf76e05e42d47ce4c94c78dea8d60e28d5b506b0cec560c7ce2865`.

Active map machine: `674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a`. This parent-page change is intended to leave that machine and the satellite/3D sources unchanged.

Required evidence before release: actual unselected equipment outlines, sourced door paths, partial/review counts, ambiguous-location fallback, camera transforms and hit testing; phone/tablet screenshots; existing map-adapter and retained-3D regression checks; full desktop and phone sweeps. Tests use the read-only harness, which blocks record writes. Private screenshots and operational evidence remain outside Git.
