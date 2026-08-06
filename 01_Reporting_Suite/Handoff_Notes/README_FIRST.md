# MyGear K2 visual integration handoff

This pack connects the completed 1,171-thumbnail release to the next MyGear build without guessing filenames or treating an image as product identity.

## What is ready

- 1,171 unique product-variant mappings across the approved 649 and Render GO 522 releases.
- One exact `output_filename` for every `variant_code`.
- A shared 21-category visual-store structure.
- A production-safe Python contract for the current builder.
- An independent verifier for dimensions, format, byte limit, duplicates and missing files.
- A rollout sequence that ties the workbook art brief to the item-card experience.

## The three non-negotiables

1. Join on `variant_code`; never infer or sanitise a thumbnail filename from an item description.
2. Treat the current renders as `FAMILY` picking aids. The recorded item/part number and physical tag control issue.
3. Keep the JPGs external under `thumbs/`; do not base64-embed 1,171 images into the HTML.

## Recommended app payload

Add two fields to each item row while preserving every existing field:

```python
{
    "v": "2TGIRDERCLAMP",          # exact product variant
    "t": "2TGIRDERCLAMP.jpg",      # exact manifest output_filename
    "is": "FAMILY",                # image status
}
```

Render `t` as a lazy-loaded 72–84 px picking image. If the file is unavailable, show a neutral fallback and keep the written identity visible.

## Use this pack

1. Put the two approved thumbnail releases into one `thumbs/` directory.
2. Run `python verify_thumbnail_integration.py --thumb-dir /path/to/thumbs`.
3. Load `MyGear_K2_Thumbnail_Manifest_1171.csv` with `thumbnail_contract.py`.
4. Bind thumbnails to live rows using the row's exact product variant field.
5. Test search, card rendering, printing/offline behaviour and a deliberately missing image.

## Important source note

The previously supplied `My Gear · Coates K2.html` is a browser-saved July snapshot, not the current canonical project. It also contains a person's card in plain text and must not be edited or republished. Supply the current MyGear project ZIP to perform the final in-app merge safely.

The owner-only visual catalogue is the approved interaction and art-direction reference for that merge.

Preview: https://mygear-k2-visual-catalogue.tatts3000.chatgpt.site
