# Live servicing map — v10.99

Author: Andrew Fisher.

Adds a map beside the saved Servicing progress for the selected night. Each reference uses the same `SvcState` totals as the crew card and existing panel. Saved-complete references receive a green ring/tick; a fully completed area's mapped locations receive green halos, a grouped-location outline and a completion badge. The short completion pulse respects reduced motion. The existing background image and registered positions are retained byte for byte and coordinate for coordinate.

The map includes toilet, toilet-block, 16-pan, accessible-toilet, pee-panel and tank symbols. Closely spaced references remain available through a grouped marker. Separate line locations stay separate; references outside the drawing remain in the totals and reference list with their supplied directions. Grouped outlines identify servicing locations, not surveyed boundaries. The image is the existing raster source; zooming does not invent further drawing detail.

The map retains its viewport, selected area and keyboard focus across verified progress reads. It supports touch dragging/pinch, keyboard panning, zoom controls up to 16000%, fit and explicit refresh. Polling runs every five seconds only while Servicing is visible, uses the existing serial reader, retains the last verified snapshot on error and backs off to sixty seconds. The existing tracker access boundary is preserved. No completion codes, crew template, service duties, record fields or charges are written by this patch.

## Build

The patch requires the exact verified v10.98 predecessor SHA-256 `6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64`.

Keep the full source JSON, registered map metadata and original master JPEG outside Git. Set these file paths privately:

- `GC500_SERVICING_DATA`
- `GC500_SERVICING_MAPS`
- `GC500_SERVICING_MASTER_IMAGE`

`patch_v1099.py` checks that the full private source projects exactly to the existing native panel configuration, validates map/reference membership, separate line locations, crop aspect ratio and actual JPEG dimensions, then embeds only the map's necessary geometry/labels. Original JPEG bytes are unchanged. It refuses a different predecessor, repeated application, mismatched data or unregistered separate line pins.

Use the shared `toolchain/build.sh` and `check_page.py`. The publisher owns final desktop/phone route sweeps, guarded upload and exact public read-back.

## Verification

- `test_patch1099.py`: ten synthetic build/geometry guards.
- `test_model1099.cjs`: twelve synthetic shared-state/registration checks, including mixed positions, coincident references, off-drawing locations, pending progress, optional tasks, undo and equipment symbols.
- `test_map1099.cjs`: private candidate geometry with synthetic progress; desktop/phone rendering, viewport retention, overlap selection, keyboard zoom, 16000% cap, reduced motion and access clearing. Runs with no network requests; Chromium receives a credential-free environment. `PAGE` selects the private candidate and `MAP_EVIDENCE` selects private screenshots.
- `test_servicing_flow.cjs` and `test_servicing_flow_runtime.cjs`: actual local service, crew card, saved-event reader and map integration. The final exact-candidate run passed 182 checks, including five-second refresh, failure backoff, hidden-pane pause, access clearing and keyboard focus across native redraws. No production writes or physical paper-scan claim. Set `FLOW_EVIDENCE` to a private directory and `FLOW_CONTROLLER_CANDIDATE` to the candidate when running this test under `flock /tmp/gc500-browser.lock`; omitting the candidate explicitly skips the native-controller boundary checks.

State: source frozen after local verification: geometry guards 10/10, model checks 12/12, layout checks 38/38 and local-server flow/controller checks 182/182. The final local candidate is 19,918,495 bytes, SHA-256 `fddc937937d41bc0a1651556b4ef28749085789271fc61c3145ed044db22f8cf`; all 150 inline scripts parse, with no new credential markers. Desktop and phone map screenshots were inspected. Final full-page sweeps and guarded publication are recorded below. Private screenshots, source maps, operational data and test receipts stay outside GitHub.

Published 21 Oct 2026 at 10:50 AEST through the guarded uploader. Source commit `017a9cff13972edf5f1bbc393fa4f71d855aa9dd`; independent public GET matches the candidate bytes exactly. Both final desktop/phone sweeps passed 25 routes, seven links and Back with no errors or write attempts. Final native live-map read-back passed at 11:02 AEST: saved reference/area/overall figures match the server across selected days, refresh retains the viewport and automatic reads retain focus. All printed task codes passed on iPhone and Android emulation; all printed location codes match the supplied destinations. Full job record, tracker configuration, codes and saved completions stayed unchanged. The delivered private PDF passes both decode resolutions. Physical paper scans remain unverified; the PDF is a scan-check copy.
