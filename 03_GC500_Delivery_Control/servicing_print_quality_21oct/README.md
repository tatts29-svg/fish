# Servicing print quality

Author: Andrew Fisher

The A4 pack uses the original registered PDF as reusable vector forms. Fine drawing
lines and labels remain vector content; original embedded photography stays as
supplied. Each form uses the exact existing crop rectangle and coordinate
transform, with the sheet's equipment symbols and labels drawn above it. Lossless
stream compression keeps the pack small without rasterising the maps.

`print_quality.py` loads the exact reviewed sheet generator and applies print-only
changes: readable Pump and Area 14 contrast, text inside 5 mm printer margins,
cover/footer clearance, and map-label clearance around the north arrow, scale and
credit panels. `vector_print.py` adds the verified original PDF form and lossless
compression. Dependencies: the generator's existing Python packages, `pdfrw` and
PyMuPDF.

References, asset numbers, quantities, service plans, recorded pins, page order,
QR dimensions, quiet zones, lane positions and permanent QR destinations are
unchanged. The existing bundle/data/URL checks and physical-paper-scan readiness
guard remain in force. Neither utility creates a tracker, generates signatures,
contacts the service, changes a completion or writes a job record.

Source PDFs, source hashes, map metadata, signed links, generated PDFs and detailed
receipts remain private and outside the repository. An explicit expected hash is
required for the registered original PDF.

```sh
python vector_print.py --generator ../servicing_tracker_DRAFT/print/make_sheets.py \
  --source-pdf /private/registered-master.pdf --source-sha256 "$MASTER_SHA256" \
  --maps /private/existing-maps --links /private/existing-links.json \
  --mode test --out /private/servicing-scan-check.pdf
```

`--mode test` retains the signed-code scan-check markings. Do not fabricate a
readiness receipt or label software emulation as a physical phone/paper scan.
Check every final PDF code against the same existing bundle, including reference
and role, at both 150 and 300 dpi. Inspect every final page for A4 layout, print
margins, contrast and label clearance. Original PDF text outside each clipped map
may still be exposed by text extractors: audit the unchanged print-overlay stream
separately, bound by hashes to the actual final file, and render the actual full
PDF for visual review and QR decoding.

`verify_print_contracts.py` also compares actual final PDF map transforms with the
existing registered crop layout and checks that protected data, QR, readiness and
page-plan functions remain identical. Supply the previous and final fully decoded
QR arrays as private files; the receipt contains counts and hashes, never codes.
This contract check supplements the full-page raster decode and visual review.

```sh
python verify_print_contracts.py \
  --generator ../servicing_tracker_DRAFT/print/make_sheets.py \
  --maps /private/existing-maps --links /private/existing-links.json \
  --pdf /private/servicing-scan-check.pdf \
  --previous-decoded /private/previous-decoded.json \
  --final-decoded /private/final-decoded.json --out /private/contracts.json
```
