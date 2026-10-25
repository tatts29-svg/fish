"""Author: Andrew Fisher. Bounded card reconciliation through the shared charge reader."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(html):
    if 'function contractCardCorrection1224(' in html:
        raise SystemExit('v12.24 card reconciliation is already present')
    helper = """/* Author: Andrew Fisher. Reconcile verified retained source rates to their published card line.
   Work on a calculation copy; explicit rates and the source record remain intact. */
function contractCardCorrection1224(r){
 if(!r||String(r.rental_contract)!=='9968862'||r.branch_code!=='KINP'||r.kind!=='building'||r.register_type!=='Building 6m'||r.quantity!==1||r.charge_line||r.subhired||r.rate_type!=='W')return r;
 const correction=r.line===63&&String(r.asset_no)==='1189412'&&r.match?.key==='P41'&&r.rate_1===1426.17?10:r.line===73&&String(r.asset_no)==='1327216'&&r.match?.key==='P39'&&r.rate_1===1426.08?1:0;
 if(!correction)return r;
 if(typeof lr748Typed==='function'&&lr748Typed('c|'+r.rental_contract+'|'+r.line)!=null)return r;
 const typed=typeof S!=='undefined'&&S.rates?.['Portable buildings|Building 6m'];
 if(typed!=null&&String(typed).trim()!=='')return r;
 const card=typeof cardRate==='function'?cardRate('Portable buildings','Building 6m',r.match.key):null;
 if(card?.source!=='card'||card.line!=='Portable Building - 6m x 3m'||!Number.isFinite(card.hire_rate))return r;
 const rate=Math.round((card.hire_rate+Number.EPSILON)*100)/100;
 if(Math.round(r.rate_1*100)-Math.round(rate*100)!==correction)return r;
 return {...r,rate_1:rate,cardCorrection1224:{sourceRate:r.rate_1,rate,source:'Published street card full hire rate'}};
}

"""
    html = rep(html, 'function contractCharge_747(r){',
               helper + 'function contractCharge_747(r){',
               'Shared card reconciliation helper', 'GC500 page')
    html = rep(html,
               " approved_by: treatment.approved_by, approved_on: treatment.approved_on});\n if (r.charge_line)",
               " approved_by: treatment.approved_by, approved_on: treatment.approved_on});\n r=contractCardCorrection1224(r);if(r.cardCorrection1224)out.cardCorrection1224=r.cardCorrection1224;\n if (r.charge_line)",
               'Use the shared calculation copy after existing treatments', 'GC500 page')
    basis_end = """ out.basis = `${money(r.rate_1)}${q !== 1 ? ' × ' + q : ''}, once — the rate is the whole-event bill`;
 }
 return out;
}"""
    html = rep(html, basis_end, basis_end.replace(
        ' return out;',
        " if(out.cardCorrection1224)out.basis += '. Source Rate 1 '+money(out.cardCorrection1224.sourceRate)+'; charge reconciled to the published card full hire '+money(out.cardCorrection1224.rate)+'.';\n return out;"),
        'Explain the retained source rate in the shared charge basis', 'GC500 page')
    html = rep(html,
               " if (typeof r.billed_amount === 'number') bits.push('billed ' + esc(money(r.billed_amount)));",
               " if(ch.cardCorrection1224)bits.push('<span class=\"contract-card1224\">'+esc(ch.basis)+'</span>');\n if (typeof r.billed_amount === 'number') bits.push('billed ' + esc(money(r.billed_amount)));",
               'Show the existing reconciliation basis in contract details', 'GC500 page')
    html = rep(html,
               ' const cf = contractFigures(rowsC);\n const units = rowsC.reduce',
               ' const cf = contractFigures(rowsC);\n const reconciled = rowsC.map(r=>({r,ch:contractCharge(r)})).filter(x=>x.ch.cardCorrection1224);\n const units = rowsC.reduce',
               'Read shared charge explanations for grouped contract rates', 'GC500 page')
    cell_end = """${sub ? ` ·<span class="chip cand">${sub} sub-hired</span>` : ''}</div>`; };"""
    html = rep(html, cell_end, cell_end.replace('</div>`; };',
               '</div>${reconciled.map(x=>`<div class="w contract-card1224" style="font-size:11px;color:var(--mute)">${esc(x.r.match?.key||String(x.r.rental_contract)+\' line \'+x.r.line)}: ${esc(x.ch.basis)}</div>`).join(\'\')}`; };'),
               'Show the same charge basis beside grouped source rates', 'GC500 page')
    return html
