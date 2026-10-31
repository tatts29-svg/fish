"""Author: Andrew Fisher. Compose after other v10.98 patches; no footer change."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep as shared_rep


def rep(text, old, new, what):
    return shared_rep(text, old, new, what, __file__)


def patch(text):
    if 'id="vms-arrival1098-script"' in text:
        raise ValueError('VMS arrival patch already applied')
    if 'function vmsCount1076(day, rows)' not in text or 'W.VMS1024 = ' not in text:
        raise ValueError('Expected current VMS register and native plan')
    text = rep(text, "function vmsCount1076(day, rows){\n day = day || todayIso();", "function vmsCount1076(day, rows){\n if (window.VMSArrival1098) return VMSArrival1098.count(day, rows);\n day = day || todayIso();", 'VMS count projection')
    text = rep(text, "function vms1077Up(b){ const on = vms913OnOf(b).on, d = on ? deliveryOf(on) : null; return !!(d && (d.state === 'on site' || d.done)); }", "function vms1077Up(b){ if(window.VMSArrival1098){const e=VMSArrival1098.evidence(VMSArrival1098.recordFor(b.key),todayIso());if(e&&e.on!==null)return e.on;} const on = vms913OnOf(b).on, d = on ? deliveryOf(on) : null; return !!(d && (d.state === 'on site' || d.done)); }", 'VMS register arrival')
    text = rep(text, 'area.onSite1076 = vms1076.on; area.toCome1076 = vms1076.toCome;', 'area.onSite1076 = vms1076.on; area.toCome1076 = vms1076.toCome; area.installed1098 = vms1076.installed;\n      if (vms1076.installed != null) area.notes.push(vms1076.installed + " installed · " + vms1076.done + " finished.");', 'Today installed distinction')
    text = rep(text, "Object.assign(g.summary,{total:c.total,onSite:c.on,due:c.due,overdue:c.overdue,next:c.nextNotOn,noRecord:c.norecord});", "Object.assign(g.summary,{total:c.total,onSite:c.on,installed1098:c.installed,due:c.due,overdue:c.overdue,next:c.nextNotOn,noRecord:c.norecord});", 'Group installed count')
    text = rep(text, 'it.done=c.done;it.onSite=c.on;it.left=c.left;', 'it.done=c.done;it.onSite=c.on;it.installed1098=c.installed;it.left=c.left;', 'Type installed count')
    text = rep(text, " S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, pos, by: who, at: new Date().toISOString()});", " const recorded1098 = new Date().toISOString();\n if (W.VMSArrival1098) { patch = W.VMSArrival1098.prepare(patch, who, recorded1098, old); if (!patch) { flash('Check the board arrival date and position; nothing written.'); return false; } }\n S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, pos, by: who, at: recorded1098});", 'Native board record schema')
    # The existing position is a plan location; link it to its existing contract board.
    pattern = r'(window\.VMS1024_DATA = )(.*?)(;\s*</script>)'
    found = list(re.finditer(pattern, text, re.S))
    if len(found) != 1:
        raise ValueError('Expected one VMS plan JSON')
    match = found[0]
    data = json.loads(match.group(2))
    positions = [p for p in data['boards'] if p['pos'] == '24']
    if len(positions) != 1 or positions[0].get('board'):
        raise ValueError('Expected existing unmapped position 24')
    positions[0]['board'] = 'VMS24'
    positions[0]['board_basis'] = 'Existing VMS24 contract-board identity; current arrival and position come from the shared record'
    text = text[:match.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + text[match.end(2):]
    source = (HERE / 'vms_arrival1098_src.js').read_text()
    text = rep(text, '<style id="ms1025-style">', '<script id="vms-arrival1098-script">\n' + source + '\n</script>\n<style id="ms1025-style">', 'VMS arrival projection module')
    return text


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: patch_vms_arrival.py INPUT OUTPUT')
    Path(sys.argv[2]).write_text(patch(Path(sys.argv[1]).read_text()))
