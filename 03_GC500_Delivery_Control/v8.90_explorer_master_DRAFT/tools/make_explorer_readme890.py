#!/usr/bin/env python3
# Author: Andrew Fisher. The README that travels with the Map explorer in the machine set, brought up to the 2 Oct issue.
#   python3 make_explorer_readme890.py <live explorer README.md> <report.json> <out README.md>
import json, sys, re
src, rep, out = sys.argv[1:4]
t = open(src, encoding='utf-8').read(); r = json.load(open(rep)); S = r['shift_pt']; L = r['labels']
head = """# GC500 Satellite Plan Explorer — review package

Coates Industrial Solutions | GC500 2026 · D001 rev 03 Master Layout Plan (issued 2 Oct 2026) on real satellite imagery.
Built 25 Sep 2026 from the v5.83 source-detail viewer; the drawing brought to the 2 Oct issue on 8 Oct 2026 (v8.90).
Separate from the live dashboard; nothing live was changed by this package.

## The drawing is the 2 Oct 2026 issue (v8.90)
Andrew, 7 Oct 2026: "the attached is the latest map document this is to over write the current master so we need to
remove the current and use this one instead and update all records".

- Source: `D001-26003-03-MASTER.pdf`, SHA-256 `%s` (the 17 Sep issue was `%s`).
- The scene is cut from the PDF the same way as before (MuPDF's SVG, record for record: %s records, %s of them
  images), and **drawn in the frame of the 17 Sep issue**: on its own paper the 2 Oct main plan sits %.2f pt (%.1f mm)
  further left, so its content is moved back by (%.2f, %.2f) pt, the inset by (%.2f, %.2f) pt and the legend by (%.2f, %.2f) pt.
  The viewport windows (main plan, inset, legend strip, border) stay where the paper has them. Measured two ways: the
  mode of the per-record offsets of matched vectors (%d main-plan records, %.0f%% at the mode) and phase correlation
  of the two renders (%.3f pt, %.3f pt). Every unchanged line therefore lands on the pixel it had before, both satellite
  registrations stay exact, and the fencing lines traced on the 17 Sep issue still fit (`meta.frame_sha256`).
- What the 2 Oct issue changes on the ground: P45 moved about 85 m west into the supply compound; WC51 about 18 m;
  WC38 about 13 m; WC39 about 9 m; WC10 is new; WC32 and the second tag WC40a are not drawn; WC69 carries one tag.
- The 2 Oct sheet shows 9 mm less of the western edge of the main plan (Main Beach end); that strip is blank here, as it
  is on the dashboard's picture. The 17 Sep labels that sat in it (%s) are not on the 2 Oct sheet.
- Search labels: %d of the 17 Sep issue's %d labels kept, %d moved, %d removed, %d added — %d labels on the 2 Oct sheet.
- Aerial underlay: the same %d patches of the same photograph, re-exported from the 2 Oct issue with soft mask and viewport
  clip as alpha, placed in the 17 Sep frame. Tile pyramid re-rendered with the explorer's own renderer; tiles away from
  the changed places are pixel-identical to the 17 Sep pyramid (`review/alignment_02oct2026.json`).

""" % (r['new_pdf_sha256'], r['old_pdf_sha256'], format(r['scene']['records'], ','), r['images']['total'],
       S['main']['applied_translation'][0], S['main']['applied_translation'][0] * 25.4 / 72, S['main']['applied_translation'][0], S['main']['applied_translation'][1],
       S['inset']['applied_translation'][0], S['inset']['applied_translation'][1], S['legend']['applied_translation'][0], S['legend']['applied_translation'][1],
       S['main']['matched_records'], S['main']['mode_share'] * 100, r['phase_correlation_main_2px_per_pt']['pt'][0], r['phase_correlation_main_2px_per_pt']['pt'][1],
       ', '.join(sorted(set(L['removed_in_the_western_strip']))), L['kept'], L['live'], len(L['moved']), len(L['removed']), len(L['added']), L['out'], r['images']['aerial_underlay'])
# drop the old first four lines (title, subtitle, built line, blank) and prepend
body = t.split('\n', 4)[4]
body = body.replace("the drawing's own 64 aerial patches", "the drawing's own %d aerial patches" % r['images']['aerial_underlay'])
body = body.replace("- `assets/drawing-scene.bin` — the preserved scene (gzip, 13.6 MB, the same bytes the original viewer carries), loaded once.",
                    "- `assets/drawing-scene.bin` — the scene of the 2 Oct issue (gzip, %.1f MB), cut from the PDF with the same converter as the original viewer's, loaded once." % (r['scene']['gzip_bytes'] / 1048576))
body = body.replace("In short: 253,697 vector records, 555 raster symbols and lettering,\n958 labels and the legend are kept in every mode; 64 aerial patches",
                    "In short (17 Sep issue; the 2 Oct issue has %s vector records, %d raster symbols and lettering and %d labels): 253,697 vector records, 555 raster symbols and lettering,\n958 labels and the legend are kept in every mode; 64 aerial patches" % (format(r['scene']['records'] - r['images']['total'], ','), r['images']['raster_symbol'], L['out']))
open(out, 'w', encoding='utf-8').write(head + body)
print('written', out, len(head + body), 'bytes')
