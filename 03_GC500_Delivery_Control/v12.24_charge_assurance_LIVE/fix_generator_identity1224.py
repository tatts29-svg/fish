"""Author: Andrew Fisher. Preserve the approved installation basis after a reference is restored."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(html):
    if 'function restoredGeneratorIdentity1224(' in html:
        raise SystemExit('v12.24 restored-generator identity is already present')
    old = """function gn20Install746Matches(ref, disc, item){
 return ref === GN20_INSTALL746.ref && disc === GN20_INSTALL746.discipline && /^350\\s*kva$/i.test(String(item || '').trim());
}"""
    new = """/* Author: Andrew Fisher. Same approved generator, restored under its current reference.
   This resolves a rate identity only; arrival, ticks, unticks and charge inclusion remain with their existing readers. */
function restoredGeneratorIdentity1224(ref){
 if(ref!=='GN20-A'||typeof assetOf!=='function'||typeof gcModel925!=='function'||typeof ONHIRE_ROWS==='undefined')return false;
 const a=assetOf(ref);
 if(!a||a.discipline!=='Generators'||a._cancelled||a.rest_of||a.relocation||assetOf('GN20')||typeof movedAway==='function'&&movedAway(ref))return false;
 const units=(gcModel925(a,{loading:false}).rows||[]).filter(u=>u.physical);
 if(units.length!==1||units[0].owner!=='coates'||String(units[0].assetNo)!=='1276701'||units[0].identityReview)return false;
 const rows=ONHIRE_ROWS.filter(r=>String(r.rental_contract)==='9961976'&&r.line===6);
 return rows.length===1&&rows[0].kind==='generator'&&rows[0].branch_code==='NVAC'&&rows[0].quantity===1&&String(rows[0].asset_no)==='1276701'&&rows[0].match?.key===ref&&!rows[0].charge_line&&!rows[0].subhired;
}
function gn20Install746Matches(ref, disc, item){
 return (ref===GN20_INSTALL746.ref||restoredGeneratorIdentity1224(ref)) && disc === GN20_INSTALL746.discipline && /^350\\s*kva$/i.test(String(item || '').trim());
}"""
    html = rep(html, old, new, 'Restore the approved generator rate identity', 'GC500 page')
    old_override = """ // Andrew's 13 October direction includes demob as well as the earlier GN20 install.
 const priorGn20Basis1006=gn20Install746;
 gn20Install746=function(ref,disc,item,original){const p=priorGn20Basis1006.apply(this,arguments);if(!gn20Install746Matches(ref,disc,item))return p;
  const install={...p.lines.find(l=>l.key==='install'),year_note:'The supplied workbook retains its original Labour year heading. Existing install basis retained; demob included under the 13 October instruction.'},demob={...install,key:'demob',name:'Demob',heading:'315 kVA Labour — existing equal allocation',money_note:'315 kVA Labour '+GN20_INSTALL746.sourceLabour+' is allocated equally to install and demob under the existing generator calculation. Complete applicable charges included on arrival, Andrew 13 Oct 2026; this does not record physical demob.'};
  return {...p,note:'GN20: 315 kVA Labour basis allocated equally to install and demob; both included once when received.',lines:p.lines.filter(l=>!['install','demob'].includes(l.key)).concat([install,demob])};
 };
 gn20Install746Notice=function(a,l,info){if(!gn20Install746Matches(a.key,l.discipline,l.item))return '';return '<div class="notice" data-install-rate-approved="GN20"><b>Install '+esc(money(GN20_INSTALL746.rate))+' · Demob '+esc(money(GN20_INSTALL746.rate))+' ex GST</b><details><summary>Rate basis</summary><p>315 kVA Labour '+esc(money(GN20_INSTALL746.sourceLabour))+' allocated equally to install and demob under the existing calculation. Included once when received; physical completion is recorded separately.</p></details></div>';};"""
    new_override = """ // The later 16 October generator rule retains installation only; physical work records remain separate.
 const priorGn20Basis1006=gn20Install746;
 gn20Install746=function(ref,disc,item,original){const p=priorGn20Basis1006.apply(this,arguments);if(!gn20Install746Matches(ref,disc,item))return p;
  return {...p,note:'Approved 315 kVA installation component only. Generator demob labour is not charged under the 16 October instruction.',lines:p.lines.filter(l=>l.key!=='demob')};
 };
 gn20Install746Notice=function(a,l,info){if(!gn20Install746Matches(a.key,l.discipline,l.item))return '';const install=(info.lines||[]).find(r=>r.key==='install');if(!install)return '';return '<div class="notice" data-install-rate-approved="'+esc(a.key)+'"><b>Install '+esc(money(install.rate))+' ex GST</b><details><summary>Rate basis</summary><p>The approved installation component uses half of the 315 kVA Labour '+esc(money(GN20_INSTALL746.sourceLabour))+' basis. Generator demob labour is not charged. Arrival and any explicit untick control inclusion; this rate does not record physical work.</p></details></div>';};"""
    return rep(html, old_override, new_override,
               'Keep the restored generator explanation on the current install-only rule', 'GC500 page')
