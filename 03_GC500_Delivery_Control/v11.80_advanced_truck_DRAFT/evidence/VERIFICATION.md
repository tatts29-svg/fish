# Verification — v11.80 loaded Advanced truck

Author: Andrew Fisher

Implementation: `b7ed19a7042331c60d5374aa0d502a8c8ba20f86` on `ccr-061f77e8-ivjhrv`.
Base: v11.79 `52fe0d1a8266bbd91c32bcce7e2f5e86ee05cfed869527ecf44484c3fe623b6d`.
Candidate: `8d59f9ff6f9801deb509ae2d4a7dd0c0864be7fbf3e1799df3331c578ffdae7e`, 21,843,890 bytes.

- Shared build/check: all 174 inline scripts parse; author and secret checks pass. Wrong-base and repeated-application guards refuse input.
- Model and preservation: 27 assertions. Both quality levels have finite, non-degenerate outward geometry, four independent wheel pivots, stable caching and bounded envelopes; 14,619 / 18,779 triangles, 27 parts, no new textures. The four other plant models remain byte-identical.
- Desktop and phone native browser: 14/14 each. Garage selection, branded loaded model, hero/chase rendering without GL errors, whole-load camera fit, driving, retained Day/scenery and tow choice, Close/cache cleanup, unchanged shared state and zero writes/errors. Front and rear/load screenshots inspected on both sizes.
- Shared full sweeps: both 27 routes, 19 direct panes, seven deep links and Back; zero page/console errors or attempted writes. All route destinations retain the previous release's behaviour. The satellite deep link may retain its satellite address instead of the explorer alias; both show the existing Maps pane.
- Whole-page comparison after removing the truck replacement, selector label and version confirms every other byte unchanged, including the scene, playback, Maps and embedded broadcast/operational data.
- Browser tests ran serially under the shared lock using the read-only harness. Source hash manifest retained privately; source stayed unchanged throughout final checks.
- Shared upload dry run confirmed edit capability and unchanged live base. No upload yet at this READY stage.

No physical-device FPS measurement or second-agent review is claimed. Claude retains the separate v11.81 fencing and broadcast scope; the second publisher must rebase on the first release.
