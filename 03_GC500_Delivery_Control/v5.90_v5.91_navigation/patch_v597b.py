#!/usr/bin/env python3
"""v5.97 (part B) - THE FENCING PAGE, TIDIED (Andrew Fisher, 25 Sep 2026: "fencing page needs to be cleaned up").
Long docket notes and the rates table's "where it comes from" prose fold to two lines with a "more" to open them;
the docket's F-number sits beside its docket number instead of on its own line; Variance and Attach signed paper
show only on a link that can edit.  python3 patch_v597b.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)
rep("""      <td>${docketNoLink(d)}<br><span class="mono">${esc(d.id)}</span><br>${whereChipF(d._where)}""",
    """      <td>${docketNoLink(d)} <span class="mono" style="font-size:11px;color:var(--mute)">${esc(d.id)}</span><br>${whereChipF(d._where)}""", 'docket id inline')
rep("""        d.note ? '<br><span class="w" style="font-size:11.5px;color:var(--mute)">' + esc(d.note) + '</span>' : ''}${docketPaperBlock(d)}</td>""",
    """        d.note ? '<div class="w' + (d.note.length > 140 ? ' clamp' : '') + '" style="font-size:11.5px;color:var(--mute)">' + esc(d.note) + '</div>' + (d.note.length > 140 ? '<button type="button" class="linkish clampbtn" data-clamp>more</button>' : '') : ''}${docketPaperBlock(d)}</td>""", 'docket note folds')
rep("""        <button class="btn ghost" data-fvar="${esc(d.id)}">Variance</button>${docketAttachBtn(d)}</td></tr>`).join('')""",
    """        <button class="btn ghost editonly" data-fvar="${esc(d.id)}">Variance</button>${docketAttachBtn(d)}</td></tr>`).join('')""", 'variance edit only')
rep("""    <label class="btn ghost dphpick" for="${id}">${docketPapersOf(d.id).length || docketPapersByName(d).length ? 'Attach another' : 'Attach signed paper'}</label>`;""",
    """    <label class="btn ghost dphpick editonly" for="${id}">${docketPapersOf(d.id).length || docketPapersByName(d).length ? 'Attach another' : 'Attach signed paper'}</label>`;""", 'attach edit only')
rep("""        <td style="font-size:12px;color:var(--mute)">${c.settled_by ? 'settled ' + esc(fmtDate(c.settled_on) || c.settled_on || '') + ': ' + esc(c.settled_said || '') + (c.settled_note ? ' — ' + esc(c.settled_note) : '') + (c.card_why ? ' · ' : '') : ''}${esc(c.card_why || '')}${c.unit_basis ? ' · ' + esc(c.unit_basis) : ''}${c.cost_basis ? ' · ' + esc(c.cost_basis) : ''}</td></tr>`; }).join('')}</tbody></table></div>""",
    """        <td class="fwhy" style="font-size:12px;color:var(--mute)">${(() => { const t = (c.settled_by ? 'settled ' + esc(fmtDate(c.settled_on) || c.settled_on || '') + ': ' + esc(c.settled_said || '') + (c.settled_note ? ' — ' + esc(c.settled_note) : '') + (c.card_why ? ' · ' : '') : '') + esc(c.card_why || '') + (c.unit_basis ? ' · ' + esc(c.unit_basis) : '') + (c.cost_basis ? ' · ' + esc(c.cost_basis) : '');
          return t.length > 160 ? `<div class="clamp">${t}</div><button type="button" class="linkish clampbtn" data-clamp>more</button>` : t; })()}</td></tr>`; }).join('')}</tbody></table></div>""", 'rates prose folds')
rep("""document.addEventListener('click', e => { const b = e.target.closest('[data-mopen],[data-mpage]');""",
    """/* v5.97 - folded prose opens and closes on its own "more" */
document.addEventListener('click', e => { const b = e.target.closest('[data-clamp]'); if (!b) return; const c = b.previousElementSibling; if (!c || !c.classList.contains('clamp') && !c.classList.contains('open')) return; c.classList.toggle('open'); b.textContent = c.classList.contains('open') ? 'less' : 'more'; });
document.addEventListener('click', e => { const b = e.target.closest('[data-mopen],[data-mpage]');""", 'more/less wiring')
rep(""".regsum{margin-top:14px}""", """.clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.clamp.open{display:block;-webkit-line-clamp:unset}.clampbtn{font-size:11px;padding:0;margin-top:2px}.fwhy{max-width:440px}
.regsum{margin-top:14px}""", 'fold css')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.97b', n0, '->', len(s))
