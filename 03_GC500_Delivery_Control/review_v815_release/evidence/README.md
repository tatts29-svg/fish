# Portable source reproduction

Author: Andrew Fisher.

`probe.cjs` reproduces the five review findings in seven checks using **invented documents, uploads, notes and references only**. It does not need the original private file-index snapshot, attachments, a browser, dependencies beyond Node, network access or credentials.

`baseline_v813.json` contains only the relevant JavaScript functions from the verified v8.13 HTML, with original line numbers and individual hashes. It contains no `DATA` object, live file index or operational records. The full base hash is `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`; the bundled excerpt hash is `6ff6b78ac55daf080952bd3792d1e192158db60a9dbffa2207e62cd7056c76f7`.

Run from the repository root with Node 18 or newer and Git. The reviewed commit must already be available locally:

```bash
SNAPSHOT815="$(mktemp -d)"
git archive 968aefba33abd387b7b646b71340d41775679b25 \
  03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT \
  | tar -x -C "$SNAPSHOT815"
node 03_GC500_Delivery_Control/review_v815_release/evidence/probe.cjs \
  --source-dir "$SNAPSHOT815/03_GC500_Delivery_Control/v8.15_documents_clean_DRAFT" \
  --baseline 03_GC500_Delivery_Control/review_v815_release/evidence/baseline_v813.json \
  --out "$SNAPSHOT815/results.json"
```

All source locations are explicit command-line arguments. `--source-dir` and `--baseline` are required; `--out` is optional because JSON is always printed to stdout. The script reads those files and writes only the requested result. It refuses source/CSS/patch bytes that differ from the frozen audit, and checks the baseline excerpt's overall and per-function hashes. There are no private path defaults.

Expected output is `regressionReproductions: 7` and `allFrozenFindingsReproduced: true`, matching [results_968aefb.json](results_968aefb.json). **Exit 0 means the reported defects reproduced; it does not mean the draft passes release checks.** The checks cover native-print source preparation, map and invoice references, the plan link, merged and missing header results, and lost twin notes.

The real reviewed row, body, catalogue and header functions execute with small helper/DOM doubles. The catalogue hook is inserted at the exact unchanged anchor and is checked against the frozen patch. Print evidence comes from generated HTML and CSS; no PDF is produced. Docket classification, drop-photo parsing, pixel layout, focus behaviour and physical printing are outside these probes. A corrected source needs new bindings and positive regression assertions rather than relabelling this frozen defect-reproduction result.
