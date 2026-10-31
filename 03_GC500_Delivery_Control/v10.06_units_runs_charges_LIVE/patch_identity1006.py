"""Author: Andrew Fisher. Guarded physical-number controls; no record writes at build time."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'function duplicate1006(' in html:
        raise ValueError('Identity v10.06 already applied')
    if 'function standdown1005' not in html and 'standdown1005' not in html:
        raise ValueError('Expected v10.05 standdown base')
    start=html.index('function form925(');end=html.index('function rowHtml925(',start)
    html=rep(html,html[start:end],(HERE/'identity1006.js').read_text()+'\n','Simplified number form and removal helpers',str(HERE))
    old="const duplicate=env.rows.find(r=>r.physical&&assetNo&&r.assetNo===assetNo&&r.owner===owner&&!(existing&&existing.docKey&&r.docKey===existing.docKey)&&!(input.sourceKey&&r.sourceKey===input.sourceKey));"
    new="const duplicate=duplicate1006(assetNo,env.rows,{docKey:existing&&existing.docKey,sourceKey:input.sourceKey||existing&&existing.sourceKey});"
    html=rep(html,old,new,'Prevent duplicate numbers across owners and entry forms',str(HERE))
    html=rep(html,"if(duplicate)return {ok:false,reason:'That company and fleet number already identify a unit here.'};","if(duplicate)return {ok:false,reason:assetNo+' is already recorded at '+ref+'. Open that item instead.'};",'Clear duplicate result',str(HERE))
    html=rep(html,"Correct this number or owner in the original unit record first. Its work and photos will remain linked.","Remove this number, then add the corrected number or company. Its photos and work history stay saved.",'Correction stays in the same asset area',str(HERE))
    html=rep(html,"rows:model.rows});if(!checked.ok)return checked;","rows:model.rows});if(!checked.ok)return checked;\n const elsewhere=elsewhere1006(ref,checked.values.assetNo,checked.values.owner);if(elsewhere)return {ok:false,reason:checked.values.assetNo+' is already recorded at '+elsewhere.ref+'. Move the existing item first.'};",'Prevent the same supplier fleet at two active references',str(HERE))
    html=rep(html,"S.loads=S.loads||{};S.loads[key]=next;stampIt('loads',key,who);bump();\n const kept=bump.kept!==false;return {ok:true,kept,id:transportId,key,reason:kept?'Unit identification recorded.':'The change is still on this device; the page’s save warning shows what needs attention.'};", "S.loads=S.loads||{};S.loads[key]=next;stampIt('loads',key,who);feedback1006.set(ref,{key,kept:true});if(!docKey&&!input.sourceKey)clearAddedForm1006(ref);bump();\n const kept=bump.kept!==false;feedback1006.get(ref).kept=kept;feedbackDraw1006();return {ok:true,kept,id:transportId,key,reason:feedbackText1006(ref)};",'Save feedback survives redraw and awaits shared acknowledgement',str(HERE))
    old=" native.forEach(base=>{\n  const matches=docs.filter(d=>d.sourceKey===base.sourceKey&&d.active!==false);"
    new=" native.forEach(base=>{\n  const archived=docs.find(d=>d.active===false&&d.suppressNative1006&&d.sourceKey===base.sourceKey&&d.sourceSnapshot===base.sourceToken);\n  if(archived){claimed.add(archived.docKey);rows.push(Object.assign({},base,archived,{id:archived.transportId||base.id,physical:false,source:'history',identityReview:'Number removed',metadata:archived}));return;}\n  const matches=docs.filter(d=>d.sourceKey===base.sourceKey&&d.active!==false);"
    html=rep(html,old,new,'Do not resurrect an archived native source',str(HERE))
    html=rep(html,"identityReview:'Original unit is no longer on the current record'","identityReview:d.active===false?'Number removed':'Original unit is no longer on the current record'",'Retained native removal history',str(HERE))
    # Controls stay with the existing item card; optional data remains folded.
    old="+(!SYNC.readonly&&u.source!=='restraint'?'<details class=\"units925-edit\"><summary>Edit unit details</summary>'+form925(a,u)+'</details>':'')+'</div></details></article>';"
    new="+(!SYNC.readonly&&u.source!=='restraint'&&u.source!=='history'?'<details class=\"units925-edit\"><summary>Edit number / details</summary>'+form925(a,u)+'</details>':'')+actions1006(a,u)+'</div></details></article>';"
    html=rep(html,old,new,'Edit, remove and restore on each number card',str(HERE))
    html=rep(html,'<summary>Identify another physical unit</summary>','<summary>Add asset / fleet number</summary>','Plain add-number wording',str(HERE))
    html=rep(html,"Items933.tidy(a,body);ItemPhotos965.header(a,body);}","Items933.tidy(a,body);ItemPhotos965.header(a,body);tidyIdentity1006(a,body);}",'Consolidate the drawer into one asset entry area',str(HERE))
    html=rep(html,"const contents = holder(all('contents').concat(all('numbers')));","const contents = holder(all('contents'));\n\tall('numbers').filter(el=>el.classList.contains('notice')).forEach(el=>hist.appendChild(el));",'Keep number warnings in history without a second number form',str(HERE))
    old="['contents', 'Inside it and asset numbers', [accN ? accN + ' inside' : '', fire914Sub(key, ed), nos.length ? nos.length + ' asset number' + (nos.length === 1 ? '' : 's') : ''].filter(Boolean).join(' · '), showContents && contents.children.length ? contents : null, ''],"
    new="['contents', 'Accessories', [accN ? accN + ' inside' : '', fire914Sub(key, ed)].filter(Boolean).join(' · '), showContents && contents.children.length ? contents : null, ''],"
    html=rep(html,old,new,'Accessories remain separate from physical asset identities',str(HERE))
    html=rep(html,"\t\t['sub744', 'Sub-hired gear', sub ? sub.co : 'add a supplier\\'s units', sub744, sub ? '' : 'editonly'],\n",'', 'One supplier selector in the asset form',str(HERE))
    html=rep(html,"window.unit925Save=save925;}","window.unit925Save=save925;window.UnitIdentity1006={normal:fleet1006,duplicate:duplicate1006,defaultOwner:defaultOwner1006,token:rowToken1006,remove:remove1006,restore:restore1006,form:form925,status:feedbackText1006};}",'Expose guarded native actions',str(HERE))
    html=rep(html,"if(msg)msg.textContent=result.reason;}});","if(msg)msg.textContent=result.reason;feedbackDraw1006();}});",'Show one save result beside the open form',str(HERE))
    html=rep(html,"if(typeof openAssetDraw!=='function'||typeof renderAbout!=='function')return;\nconst beforeDraw925", "if(typeof openAssetDraw!=='function'||typeof renderAbout!=='function')return;\ninstallIdentity1006();\nconst beforeDraw925",'Guard all existing native number entry routes',str(HERE))
    html=rep(html,'<script id="units925-script">','<style id="identity1006-style">'+(HERE/'identity1006.css').read_text()+'</style>\n<script id="units925-script">','High-contrast asset entry fields',str(HERE))
    return html

if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(apply(p.read_text(encoding='utf-8-sig')))
