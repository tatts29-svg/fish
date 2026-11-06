#!/usr/bin/env python3
"""Author: Andrew Fisher. Completion icon and exact staff-save feedback; no record changes."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
TOOLCHAIN = HERE.parent / 'toolchain'
sys.path.insert(0, str(TOOLCHAIN))
from rep import rep as guarded_rep


def rep(text, old, new):
    return guarded_rep(text, old, new, 'v10.08 completion/save: ' + old[:60], 'v10.08')


def apply(page):
    if 'complete1008-style' in page or 'function staffStatus1008(' in page:
        raise ValueError('v10.08 completion patch is already present')
    if 'contrast1007css' not in page or 'function drawerSync798Word(' not in page:
        raise ValueError('v10.08 requires the reviewed v10.07 base')

    page = rep(page, 'function doneChip(a){', (HERE / 'complete1008.js').read_text() + '\nfunction doneChip(a){')
    page = rep(page,
        ' return `<span class="tick" title="${esc(title)}" aria-label="${esc(title)}">✓ Complete</span>${shortChip(a)}`;',
        ' const verified1008=completeVerified1008(a.key||a);\n return `<span class="tick${verified1008?\' complete1008-badge\':\'\'}" title="${esc(title)}" aria-label="${esc(title)}">${verified1008?completeGlyph1008():\'✓\'} Complete</span>${shortChip(a)}`;')
    before = '''function doneBtn(key, small){
 const d = deliveryOf(key);
 return `<button type="button" class="tickbtn${small ? ' sm' : ''}${d.done ? ' on' : ''}" data-done="${esc(key)}" aria-pressed="${d.done}"
 title="${d.done ? 'Un-tick complete' : 'Tick complete — in position, set up, checked'}" aria-label="${d.done ? 'Un-tick complete for ' : 'Tick complete for '}${esc(key)}">✓</button>`;
}'''
    after = before.replace('const d = deliveryOf(key);', 'const d = deliveryOf(key),verified1008=d.done&&completeVerified1008(key);').replace('${d.done ? \' on\' : \'\'}"', '${d.done ? \' on\' : \'\'}${verified1008?\' complete1008-done\':\'\'}"').replace('>✓</button>', '>${verified1008?completeGlyph1008():\'✓\'}</button>')
    page = rep(page, before, after)

    before = '''function fenceAreaBtn(name){
 const d = fenceAreaDone(name);
 return `<button type="button" class="tickbtn sm${d.done ? ' on' : ''}" data-fdone="${esc(name)}" aria-pressed="${d.done}"
 title="${d.done ? 'Un-tick — area no longer complete' : 'Tick — the crew say this area is complete'}" aria-label="${d.done ? 'Un-tick area complete for ' : 'Tick area complete for '}${esc(name)}">✓</button>`;
}'''
    after = before.replace("${d.done ? ' on' : ''}", "${d.done ? ' on complete1008-done' : ''}").replace('>✓</button>', ">${d.done?completeGlyph1008():'✓'}</button>")
    page = rep(page, before, after)
    page = rep(page,
        '<span class="tick" title="ticked ${esc(fmtStamp(fd.at))} by ${esc(fd.by || \'unnamed\')}">✓ Complete</span>',
        '<span class="tick complete1008-badge" title="ticked ${esc(fmtStamp(fd.at))} by ${esc(fd.by || \'unnamed\')}">${completeGlyph1008()} Complete</span>')
    page = rep(page,
        "'<span class=\"fik ok897\" title=\"Complete: recorded complete on the record and Finished on the Timeline\">✓ Complete</span><span class=\"fik\">'",
        "'<span class=\"fik ok897 complete1008-badge\" title=\"Complete: recorded complete on the record and Finished on the Timeline\">'+completeGlyph1008()+' Complete</span><span class=\"fik\">'")
    page = rep(page,
        "\tconst lvl = needsLevel(a), stp = mentionsSteps(a) || d.steps, dis = ed ? '' : ' disabled';",
        "\tconst fullComplete1008=!partial962&&completeVerified1008(key);\n\tconst lvl = needsLevel(a), stp = mentionsSteps(a) || d.steps, dis = ed ? '' : ' disabled';")
    before = '''\tconst trow = (go, attr, on, words, at, glyph) => `<button type="button" class="hl${on ? '' : ' off816'}" data-lf-go="${go}" data-${attr}="${esc(key)}" aria-pressed="${on}"${dis}><span class="tick sm${go === 'levelled' ? ' lvl' : go === 'steps' ? ' stp' : ''}" aria-hidden="true">${glyph}</span><b>${on ? '✓' : '–'}</b> ${words}${on ? when(at) : ''}</button>`;'''
    after = before.replace('class="hl${on ? \'\' : \' off816\'}"', 'class="hl${on ? \'\' : \' off816\'}${go===\'done\'&&on&&fullComplete1008?\' complete1008-done\':\'\'}"').replace("<b>${on ? '✓' : '–'}</b>", "<b>${go==='done'&&on&&fullComplete1008?completeGlyph1008():on?'✓':'–'}</b>")
    page = rep(page, before, after)

    # Contain the existing wide Rules table locally; neither its cells nor the page layout changes.
    page = rep(page,
        "const rules = '<details class=\"flow891-rules\"><summary>Rules · ' + esc(FLOW891.source) + '<span class=\"flow891-x\" aria-hidden=\"true\"></span></summary><table>",
        "const rules = '<details class=\"flow891-rules\"><summary>Rules · ' + esc(FLOW891.source) + '<span class=\"flow891-x\" aria-hidden=\"true\"></span></summary><div class=\"flow1008-table\" role=\"region\" aria-label=\"Truck flow rules\" tabindex=\"0\"><table>")
    page = rep(page,
        ".map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table>' +\n  '<p>' + esc(H.name)",
        ".map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div>' +\n  '<p>' + esc(H.name)")

    marker = '<script id="staff988-script">'
    start = page.index(marker)
    end = page.index('</script>', start) + len('</script>')
    original = page[start:end]
    staff = rep(original, 'const api=root.DailyStaff988;\n', 'const api=root.DailyStaff988;\n' + (HERE / 'staff_bridge1008.js').read_text() + '\n')
    staff = rep(staff,
        "  bump();if(bump.kept===false)return false;flash('Day availability saved.');return true;",
        "  const attempt={key,expected:JSON.stringify({...S.loads[key],_k:key}),kept:null};staffAttempts1008.set(day,attempt);\n  bump();attempt.kept=bump.kept!==false;staffFeedback1008();if(!attempt.kept)return false;flash(staffStatus1008(day).text);return true;")
    staff = rep(staff,
        '+\'</div><p role="status" data-staff988-result></p></details>\':\'\';',
        '+\'</div></details>\':\'\';')
    staff = rep(staff,
        "+edit+'</section>';",
        "+edit+'<p role=\"status\" aria-live=\"polite\" data-staff988-result data-save1008=\"'+e(staffStatus1008(day).state)+'\">'+e(staffStatus1008(day).text)+'</p></section>';")
    staff = rep(staff,
        "  mount(pane,day,pane?.querySelector('.flow891'));\n }\n}",
        "  mount(pane,day,pane?.querySelector('.flow891'));\n }\n staffFeedback1008();\n}")
    staff = rep(staff,
        " else{const current=document.querySelector('#pane-'+state.tab+' [data-staff988-day=\"'+day+'\"]')||box,target=current.querySelector('[data-staff988-result]');target.textContent=result.reason;",
        " else{staffAttempts1008.set(day,{error:result.reason});const current=document.querySelector('#pane-'+state.tab+' [data-staff988-day=\"'+day+'\"]')||box,target=current.querySelector('[data-staff988-result]');target.textContent=result.reason;target.dataset.save1008='error';")
    # Reload is explicit: clear stale feedback before the native editor is rebuilt.
    staff = rep(staff,
        "const box=button.closest('[data-staff988-day]');box.outerHTML=html(box.dataset.staff988Day);});",
        "const box=button.closest('[data-staff988-day]');staffAttempts1008.delete(box.dataset.staff988Day);box.outerHTML=html(box.dataset.staff988Day);});")
    page = rep(page, original, '<script id="staff-save1008-script">\n' + (HERE / 'staff_save1008.js').read_text() + '\n</script>\n' + staff)
    page = rep(page, '\n</head>', '\n<style id="complete1008-style">\n' + (HERE / 'complete1008.css').read_text() + '\n</style>\n</head>')
    return page


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: patch_completion1008.py input.html output.html')
    Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
