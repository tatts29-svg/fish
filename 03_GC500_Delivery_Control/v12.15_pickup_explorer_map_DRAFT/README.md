# Pickup maps from Map Explorer

Author: Andrew Fisher.

Andrew asked to use the map he searches in, because separate arrows on the exported master drawing were confusing. Pickup PNGs and PDF location sheets now use the active Explorer map style and orientation, framed around the selected 50 m area. The same underlay, vector worker, satellite imagery, map registration and equipment-symbol reader supply the picture. Clearly labelled pickup dots match the navigation destinations; recorded doors and truck loading remain in the written details.

READY TO UPLOAD, not yet live. Base v12.14: `91f9006070d1269eb6e9ae807076e9146e7e52e6fbfc68a01d840f5666559a11`. Scope is the pickup-map renderer, PDF captions and prepared-pack freshness. No record, collection, quantity, price, ownership, navigation-target or tracker changes. Existing original area-share behaviour is outside this pickup-pack change.

Incomplete satellite imagery stops preparation with an explicit retry message; it never silently substitutes the original plan. The picture is rendered off-screen at 3840 pixels, so the camera and display canvases remain untouched. The three map modes, rotation, viewer preservation, main and inset navigation, missing-coverage failure, stale-view protection and PDF contents have passed verification. The required desktop/phone navigation sweeps and visual inspection also passed.

Private PDFs, screenshots, map pictures and operational snapshots remain outside the repository. Only sanitised verification summaries belong here.

Candidate: `786142f3208a03ac732286e5421e981f8c3b8b9dd77fbd8558f3ec88d760c427` (15,343,444 bytes). Toolchain: 196 scripts; exact preservation 6/6; native map modes 12/12; registration/failure boundaries 6/6; phone building flow 12/12. Checked and unticked PDFs pass 20/20 content/QR and 5/5 print checks each. Synthetic single/long multi-location cases pass 20/20 and 21/21, with print checks 5/5 and 4/4. Both full sweeps pass 27 routes, 19 direct panes, seven deep links and Back with no page/console errors or attempted record writes. Phone, exported maps and rendered PDFs inspected. Upload dry run confirms unchanged base and publication access. See `evidence/checks.json`. Independent implementation/testing; no second-agent review.

The native Explorer dependency remains `e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a`. Its registered drawing and available satellite pixels are retained; a 3840-pixel export does not invent detail absent from the source imagery. No machine assets are republished.
