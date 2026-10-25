"""Author: Andrew Fisher. Bounded card reconciliation through the shared charge reader."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(html):
    if 'function contractCardCorrection1224(' in html:
        raise SystemExit('v12.24 card reconciliation is already present')
    helper = """/* Author: Andrew Fisher. Reconcile one retained source rate to its published card line.
   Work on a calculation copy; explicit rates and the source record remain intact. */
function contractCardCorrection1224(r){
 if(!r||String(r.rental_contract)!=='9968862'||r.line!==63||r.branch_code!=='KINP'||r.kind!=='building'||r.register_type!=='Building 6m'||r.quantity!==1||r.charge_line||r.subhired||String(r.asset_no)!=='1189412'||r.match?.key!=='P41'||r.rate_type!=='W'||r.rate_1!==1426.17)return r;
 if(typeof lr748Typed==='function'&&lr748Typed('c|'+r.rental_contract+'|'+r.line)!=null)return r;
 const typed=typeof S!=='undefined'&&S.rates?.['Portable buildings|Building 6m'];
 if(typed!=null&&String(typed).trim()!=='')return r;
 const card=typeof cardRate==='function'?cardRate('Portable buildings','Building 6m','P41'):null;
 if(card?.source!=='card'||card.line!=='Portable Building - 6m x 3m'||!Number.isFinite(card.hire_rate))return r;
 const rate=Math.round((card.hire_rate+Number.EPSILON)*100)/100;
 if(Math.round(r.rate_1*100)-Math.round(rate*100)!==10)return r;
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
    return html
