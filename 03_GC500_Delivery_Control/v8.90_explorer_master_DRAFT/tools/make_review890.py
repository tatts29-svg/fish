#!/usr/bin/env python3
# Author: Andrew Fisher. The review note that travels with the explorer: how the 2 Oct issue was placed in the 17 Sep frame.
#   python3 make_review890.py <report.json from build_scene890.py> <compare_with_live.json from compare_tiles.py or -> <out json>
import json, sys
rep = json.load(open(sys.argv[1])); cmp_ = json.load(open(sys.argv[2])) if sys.argv[2] != '-' else None
S = rep['shift_pt']; L = rep['labels']
out = {
  'author': 'Andrew Fisher', 'date': '8 Oct 2026', 'drawing': 'D001-26003-03 Master Layout Plan, issued 2 Oct 2026', 'pdf_sha256': rep['new_pdf_sha256'],
  'frame': {'pdf_sha256': rep['old_pdf_sha256'], 'issued': '17 Sep 2026', 'why': 'the fencing lines were traced on it and both satellite registrations were measured on it'},
  'what_moved_on_the_paper_pt': {k: {'new_minus_old': v['mode_offset_new_minus_old'], 'matched_records': v['matched_records'], 'share_at_the_mode': v['mode_share']} for k, v in S.items()},
  'translation_applied_pt': {k: v['applied_translation'] for k, v in S.items()},
  'phase_correlation_check': {'main_drawing_area_pt': rep['phase_correlation_main_2px_per_pt']['pt'], 'inset_pt': rep['phase_correlation_inset_2px_per_pt']['pt'], 'note': 'the two sheets rendered at 2 px per pt; a sub-pixel peak fit; agrees with the vector measurement to 0.03 pt'},
  'viewport_clips': 'kept where the paper has them (the main plan window, the inset window, the legend strip, the border); the drawn content, its soft masks and the small symbol clips move back onto the 17 Sep frame',
  'western_strip': 'the 2 Oct sheet shows 9 mm (25.5 pt) less of the western edge of the main plan; that strip is blank in the explorer, as it is on the page picture',
  'labels': {'live_17_sep': L['live'], 'kept': L['kept'], 'moved': len(L['moved']), 'removed': len(L['removed']), 'added': len(L['added']), 'on_the_2_oct_sheet': L['out'],
             'moved_over_1_m': [{'text': m['text'], 'moved_m': m['moved_m_on_the_ground']} for m in L['moved'] if m['moved_m_on_the_ground'] >= 1.0],
             'removed': [r['text'] for r in L['removed']], 'added': [a['text'] for a in L['added']], 'removed_in_the_western_strip': L['removed_in_the_western_strip']},
  'images': rep['images'], 'scene': rep['scene'], 'records': rep['records'],
  'georeferencing': 'main and inset sheet_to_z18px transforms unchanged; pdf_sha256 updated; frame recorded',
}
if cmp_:
    out['pyramid_against_the_17_sep_tiles'] = {L: {'identical': v['identical'], 'different': v['different'], 'only_live': v['only_live'], 'only_new': v['only_new']} for L, v in cmp_.items()}
json.dump(out, open(sys.argv[3], 'w'), indent=1, ensure_ascii=False); print('written', sys.argv[3])
