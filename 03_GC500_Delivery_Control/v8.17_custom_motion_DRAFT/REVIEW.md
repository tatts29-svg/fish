# Custom motion review

Author: Andrew Fisher

Status: independent asset and preview source review complete. No remaining blocking findings for this isolated local preview. This is not a live integration or release approval.

## Source inspected

Read the repository's `AGENTS.md`, the current entries in `STATUS.md` and the actual Creator application at `/workspace/private-v809-support/lottie-link/app.js` (SHA-256 `ed4e68f53f84f54c1cc70bcc3733d4b1fc5d3770c3a7bcfc3240830103556f4a`). The source is private support material and is not copied into this draft.

No browser, live application call, operational record write or deployment was used for this independent review.

Final reviewed preview: 251,295 bytes. Exact SHA-256 bindings:

- `preview.template.html`: `c64899043a47298eb480482a2aa6feaede8cec1e5f7bfdfa307406f9d724e7f7`
- `build_preview.py`: `21b2118144b78c4f100b2efa221a34508e9f370dd396de427080e77fe753ccb7`
- `GC500-motion-preview.html`: `8112dfc388c9019f389c47f814c40faef686b551470f5cc07fcc567699b0b6e2`

## Creator constraints established from its implementation

- **Transparent output needs a separate export step.** `normalizeColor` accepts only three- or six-digit hex colours (line 212). `exportLottieObject` always appends an opaque shape called `Canvas background` (lines 890–956). Native project files should retain their editing background; deployable Lottie files should remove only that generated background, and the instructions must say that exporting from Creator adds it back.
- **Keep the editable artwork inside the supported primitive model.** The native project supports rectangle, ellipse and star layers, uniform scale, position, rotation and opacity; it caps projects at 60 layers and each layer at 240 keyframes (lines 120–168). Lottie import accepts only shape layers and the first supported primitive inside the first group (lines 1054–1099). Arbitrary paths, strokes, masks, external images, text, multiple shape groups, anchors and arbitrary group transforms are not faithfully imported. Unsupported layers can disappear while the import reports success for the layers it kept.
- **Preview timing is not exact exported timing.** Creator uses polynomial easing internally (`easeValue`, line 292), whereas its export describes cubic Bézier easing (`lottieEasing`, line 814). Both produce usable motion, but an editor preview alone does not establish the precise runtime appearance. Linear easing avoids this particular discrepancy.
- **Creator itself is not a lightweight embedded player.** Playback replaces SVG layer nodes and redraws the timeline and inspector every frame (lines 348 and 795–811). It also keeps scheduling animation frames while idle. It has no reduced-motion or document-visibility handling. The operational page should use the exported assets and a bounded player, not the editor's rendering loop.
- **Creator's saved state is local.** `markSaved` writes local storage after 120 ms and reports `Saved locally` (line 229). A saved Creator project is not evidence that a GC500 record or photograph was saved.

## Independent asset checks

Executed the actual source functions `sanitizeProject`, `projectFromLottie` and `exportLottieObject` in an isolated Node VM against all three finished asset sets. This runs the Creator implementation itself, without a browser or a substitute exporter.

For every asset, the sanitised native project exports exactly to the supplied unmodified Creator export; removing its single `Canvas background` yields exactly the transparent output; and importing the transparent output into the actual Creator importer then exporting recreates the unmodified export exactly. All three comparisons pass for all three assets, with no lost layers.

| Transparent asset | Layers | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `equipment-selected.json` | 10 | 18,003 | `83aa3b7df2cc642a41fcfd95bba1e7178de52bb9a0e2b914e20791828bd762fc` |
| `equipment-complete.json` | 13 | 15,041 | `222263a03d01275acdd550ac31d63bdffd8f91d3cb81ee7c7b9d6d4b46e69dc7` |
| `photo-saved.json` | 11 | 13,540 | `45e68c68f0734c47713caa0381f8ca86c0d2071204ea2fb0897c1426595404d7` |

The files use only the supported rectangles and ellipses, ordinary transform/opacity keys, and linear easing. They require no linked images, fonts, masks or paths. The 36-frame timeline holds its final appearance before its end, so the player's last-frame stop does not leave a partial tick.

## Preview source findings

Reviewed `preview.template.html`, `build_preview.py`, the original asset generator, both asset notes and the placement guide.

1. **Resolved: incomplete load-failure accounting.** The first implementation only finalised readiness after successful loads; a final failed player could leave successful examples unavailable for replay, while some error messages could be overwritten. The shared `completed(entry, ok)` handler now accounts for success and failure and preserves the failure message.
2. **Resolved: confirmation simulations were implicit.** Both confirmation examples now visibly say `Simulated`. `Delivery confirmed` explicitly keeps installation separate, and photo success describes both the photo and its reference link. There is no service connection or acknowledgement fabricated by this preview.
3. **Resolved: fallback artwork differed from the deliverables.** The builder now inserts the matching final asset SVG into each hero fallback and marker example. The three marker-size examples are still SVGs, avoiding three unnecessary players.
4. **Resolved: static marker SVG dimensions.** The supplied stills declare 128 × 128 dimensions. The preview now applies `.mini svg { width:100%; height:100% }`, keeping the artwork inside its 44 × 44 sample. The owner's browser evidence also checks these dimensions.
5. **Resolved: phone badge/caption spacing.** The phone stage height is now 180 px, providing separation between the large confirmation badge and the nearby marker-size caption. Final card chamfers, orange top edges and italic uppercase heading are presentation-only changes; the playback and status behaviour are unchanged.

The reviewed lifecycle is restrained: three non-looping main players, an opening demonstration followed by explicit Replay, final-frame stops for reduced motion, manual Still view, hidden documents and offscreen cards. Returning to the page or scrolling a card back into view does not replay a success cue. The operating-system reduced-motion setting cannot be overridden. Downloads use object URLs for the reviewed native/Lottie JSON, and unload destroys players and revokes those URLs.

Controls use native buttons, links and a labelled checkbox with visible keyboard focus. Status is conveyed by nearby text; the small copies are decorative. Single-column phone CSS preserves the controls and downloads.

The owner's `evidence.json` records nine browser checks: actual player loading/stopping and Replay, Still view, native project downloads, 390 px phone/offscreen behaviour, 44 px sample dimensions, system reduced motion, no preview HTTP requests, and all three native projects imported into the actual Creator with exact exported layers. It records no captured page/console errors. The original Creator page attempted its separate challenge-script request, which was blocked; that is recorded separately from the preview's zero requests. These checks were run by the preview owner, not repeated by this reviewer.

The owner's `fallback_evidence.json` adds four checks: a failed player retains both matching static forms, the other two players remain usable, Replay preserves the failure message, and the hidden-document handler settles playback. The visibility event is simulated; it does not establish physical-device background performance.

Independently inspected the owner's final desktop and phone reduced-motion captures after the final CSS rebuild. The original equipment/camera forms and small stills are recognisable, labels and downloads fit, and both confirmation examples are visibly simulated. The updated phone capture confirms the hero badge and marker-size caption are separated. The chamfered cards and revised heading introduce no visible clipping in these views.

## Review limits

The placement guide remains an integration proposal. The current delivery tick is not proof of all installation stages; the separate all-required-stages proposal needs authoritative applicability and acknowledgement information before use. Photo confirmation must follow the real photo/reference acknowledgement, not the Creator's local save or the photo outbox.

This local preview uses the actual vendored Lottie SVG runtime. It is not a release of the live page, not a tested production map integration and not approval to create a player for every map marker. The transparent assets total 46,584 bytes; that is a payload measurement, not a claim about CPU speed, memory use or physical-phone frame rate. Final browser evidence belongs to the preview owner. No independent browser or live-record checks were performed in this review.
