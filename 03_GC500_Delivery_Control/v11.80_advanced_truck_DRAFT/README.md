# Advanced Temporary Fencing Showcase truck — DRAFT

Author: Andrew Fisher

Refines the existing illustrative Showcase vehicle with the company logo, a white cab-over cab, red/grey lower-cab stripes, one front and one rear axle, and a loaded tray. Horizontal bundles of mesh fence panels sit on bearers; base blocks sit behind the headboard; blue straps restrain the decorative load. No stock counts or vehicle dimensions are operational records.

Public references: [company website](https://advtempfence.com.au/about), its `assets/images/about-1.jpg` load and `about-3.jpg` truck photograph. The logo mesh comes from `https://advtempfence.com.au/assets/images/advanced-fencing-logo.png`, SHA-256 `aeaf02bfc589ca9620352761b4623c88e74e1eb2b078ce6c9ce759b7ffc13a9e`. The body and paint placement are illustrative; this is not an exact fleet specification. Private attachments and original photographs are not included.

`build_logo_mesh.py` converts that public logo to cached, flat geometry (three placements), preserving lettering holes and outward winding. It requires numpy, opencv-python-headless and mapbox-earcut only when regenerating the source; the page has no new texture or runtime dependency. The normal and detailed models remain below 20,000 triangles, with 27 parts, and the existing Close cleanup applies.

Exact base: live v11.79 `52fe0d1a8266bbd91c32bcce7e2f5e86ee05cfed869527ecf44484c3fe623b6d`. Use the shared toolchain and this release's `patch_v1180.py`; its predecessor source in v11.79 is required. The guard refuses a changed base or repeated application. If another page publishes first, reconcile the new live bytes and retest before publication.

The other vehicles, current scene, playback repairs, Maps, broadcast/data, servicing and operational records remain unchanged. Model checks pass (27 assertions); all 174 scripts parse. Desktop/phone rendering and full sweeps are in progress. Not ready to upload and not live.
