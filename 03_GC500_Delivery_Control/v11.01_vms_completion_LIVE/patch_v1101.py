"""Author: Andrew Fisher. Native per-board completion without inventing delivery links."""
import hashlib
import os
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA256 = 'd4a10a7fe07637fdfbb97f31ff2a07f48af4a632479acce8fd29aeb9cf9c97d7'  # v11.00 candidate; publisher verifies live before building.


def patch(text, expected_sha=None):
    expected_sha=expected_sha or BASE_SHA256
    if len(expected_sha)!=64 or hashlib.sha256(text.encode()).hexdigest()!=expected_sha:
        raise ValueError('v11.01 requires the exact verified v11.00 predecessor')
    if 'vms-completion1101-script' in text:
        raise ValueError('v11.01 already installed')
    def change(old,new,label):
        nonlocal text
        text=rep(text,old,new,label,'page')
    old=(HERE.parent/'v10.98_vms_arrival_LIVE/vms_arrival1098_src.js').read_text()
    change(old,(HERE/'vms_completion1101_src.js').read_text(),'shared board completion projection')
    change('<script id="vms-arrival1098-script">','<script id="vms-completion1101-script">','completion module identity')
    change('W.VMSArrival1098.prepare(patch, who, recorded1098, old)', 'W.VMSArrival1098.prepare(patch, who, recorded1098, old, W.VMSArrival1098.recordFor(board(pos).board || board(pos).default_board))', 'shared physical board completion preconditions')
    change("function vms1077Mark(b){ return vms1077Up(b) ? '<span class=\"vms1077up\" style=\"color:#1a7f37;font-weight:600;white-space:nowrap\">\\u2713 turned up</span>' : '<span class=\"todo\" style=\"white-space:nowrap\">still to come</span>'; }", "function vms1077Mark(b){ const c=window.VMSArrival1098?.status(b.key); return c?.done ? '<span class=\"vms1077up\" style=\"color:#1a7f37;font-weight:600;white-space:nowrap\">\\u2713 Complete</span>' : vms1077Up(b) ? '<span class=\"vms1077up\" style=\"color:#1a7f37;font-weight:600;white-space:nowrap\">\\u2713 turned up</span>' : '<span class=\"todo\" style=\"white-space:nowrap\">still to come</span>'; }",'register completion label')
    change("function card(b){\n const p = position(b), id = identity(b), r = rec(b.pos) || {}, fr = frame(p);", "function card(b){\n const p = position(b), id = identity(b), r = rec(b.pos) || {}, fr = frame(p), complete1101 = W.VMSArrival1098?.status(id.board), done1101 = !!complete1101?.done, placed1101 = W.VMSArrival1098?.evidence(r, todayIso());",'board card shared status')
    change('  <button type="button" class="btn v1024-pin" data-v1024-pin="${esc(b.pos)}">Pin here with this phone</button>', '  ${id.board ? `<label class="v1024-tick"><input type="checkbox" data-v1024="complete" data-pos="${esc(b.pos)}"${done1101 ? \' checked\' : \'\'}${!done1101 && !complete1101?.installed ? \' disabled\' : \'\'}><span>Complete · checked and ready${complete1101?.completion?.done ? ` <small>${esc(complete1101.completion.by)} · ${esc(when(complete1101.completion.recorded_at))}</small>` : !done1101 && !complete1101?.installed ? \' <small>Confirm in place first</small>\' : \'\'}</span></label>` : \'\'}\n  <button type="button" class="btn v1024-pin" data-v1024-pin="${esc(b.pos)}">Pin here with this phone</button>','native board Complete control')
    change('${esc(r.by)} · ${esc(when(r.at))}', '${esc(placed1101?.by || r.by)} · ${esc(when(placed1101?.recordedAt || r.at))}', 'card retains installation evidence timestamp')
    change("${r.inPlace ? esc(r.by) + ' · ' + esc(when(r.at)) : ''}", "${r.inPlace ? esc(placed1101?.by || r.by) + ' · ' + esc(when(placed1101?.recordedAt || r.at)) : ''}", 'print retains installation evidence timestamp')
    change("  else if (t === 'inplace') ok = write(pos, {inPlace: !!el.checked}, 'the in-place tick');", "  else if (t === 'inplace') ok = write(pos, {inPlace: !!el.checked}, 'the in-place tick');\n  else if (t === 'complete') ok = W.VMSArrival1098.setComplete(pos, !!el.checked);",'native completion action')
    change(" const placed = boards().filter(b => (rec(b.pos) || {}).inPlace).length;", " const placed = boards().filter(b => (rec(b.pos) || {}).inPlace).length, finished1101 = W.VMSArrival1098?.count();",'plan finished count')
    change('${placed} of ${counts.all} positions ticked in place. Each line saves on its own;', "${placed} of ${counts.all} positions ticked in place.${finished1101 ? ` ${finished1101.done} of ${finished1101.total} boards complete.` : ''} Each line saves on its own;", 'plan count label')
    change(" const noteText = notes(b);\n return `<section class=\"ps ps7 fen v1024", " const noteText = notes(b), complete1101 = W.VMSArrival1098?.status(id.board), placed1101 = W.VMSArrival1098?.evidence(r, todayIso());\n return `<section class=\"ps ps7 fen v1024", 'printed shared completion status')
    change(' <div class="v-notes"><b>NOTES · SPECIAL INSTRUCTIONS</b>${noteText ? esc(noteText) : \'\'}', ' <p class="v-sub"><b>Completion:</b> ${complete1101?.done ? \'Complete · checked and ready\' : \'Not marked complete\'}${complete1101?.completion?.done ? \' · \' + esc(complete1101.completion.by) + \' · \' + esc(when(complete1101.completion.recorded_at)) : \'\'}</p>\n <div class="v-notes"><b>NOTES · SPECIAL INSTRUCTIONS</b>${noteText ? esc(noteText) : \'\'}', 'printed completion label')
    change("+' · v11.00'; /* v8.19 release922", "+' · v11.01'; /* v8.19 release922",'release footer')
    return text


if __name__=='__main__':
    target=Path(sys.argv[1]); target.write_text(patch(target.read_text()),encoding='utf-8')
