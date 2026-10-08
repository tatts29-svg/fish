#!/usr/bin/env python3
"""Author: Andrew Fisher. Coates by default, with named supplier ownership retained."""
from pathlib import Path
import argparse,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=argparse.ArgumentParser(description=__doc__);p.add_argument('page',type=Path);p.add_argument('--preview-base-941',action='store_true');args=p.parse_args()
raw=args.page.read_bytes();s=raw.decode('utf-8-sig')
assert 'id="ownership944-marker"' not in s and 'Ownership944.model(' not in s,'Already applied'
prior='9.41' if args.preview_base_941 else '9.43'
assert " · v"+prior+"'; /* v8.19" in s,'Wrong prior release'
assert 'Rate941.formula(l)' in s and 'projection938-script' in s,'Expected rate and physical identity releases'
def change(old,new,why):
 global s
 s=rep(s,old,new,why,str(args.page))
change('const MONEY_FMT = new Intl.NumberFormat(', (HERE/'ownership944.js').read_text()+'\nconst MONEY_FMT = new Intl.NumberFormat(', 'ownership rule helper')
change('function subOf(key){ try {','function ownership944RawSubs(key){ try {','retain original supplier evidence projection')
change("function subCompanies(){ const s = new Set(['Event Portables']);", "function subOf(key){ return ownership944RawSubs(key).filter(x=>Ownership944.named(x.co)); }\nfunction subCompanies(){ const s = new Set(['Event Portables']);",'current named suppliers only')
change("function subhireOf(key){ const r = (S.subhire || {})[key]; return r && r.co ? r : null; }", "function subhireOf(key){ const r = (S.subhire || {})[key]; return r && Ownership944.named(r.co) ? r : null; }",'current reference supplier')
change("extras=subOf(r).filter(s=>s.source754).map(s=>s.u)","extras=ownership944RawSubs(r).filter(s=>s.source754).map(s=>s.u)",'retain original unnamed fleet identity')
change("return {ref:a.key,rows,groups};", "return Ownership944.model({ref:a.key,rows,groups});",'default projected physical ownership')
change("const id=identity925(a.key,base.owner==='unknown'?d.owner:base.owner,base.id?(base.nativeId||''):d.nativeId,d.assetNo,env.identity),review=", "const id=base.id&&d.transportId===base.id&&base.owner==='unknown'&&d.owner==='coates'&&base.assetNo===d.assetNo?base.id:identity925(a.key,base.owner==='unknown'?d.owner:base.owner,base.id?(base.nativeId||''):d.nativeId,d.assetNo,env.identity),review=",'preserve existing identity through default-owner metadata')
change("const transportId=identity925(ref,checked.values.owner,nativeId,checked.values.assetNo);", "const transportId=source&&source.id&&Ownership944.unspecified(source.recordedOwner944)&&checked.values.owner==='coates'&&checked.values.assetNo===source.assetNo?source.id:identity925(ref,checked.values.owner,nativeId,checked.values.assetNo);",'preserve unit link on detail edits')
change("registration:r.registration||'',docKey:r.docKey||''", "registration:r.registration||'',docKey:r.docKey||'',recordedOwner944:r.recordedOwner944",'preserve stored loading fingerprint owner')
change("JSON.stringify([u.id,u.ref,ownerKey(u.owner),txt(u.assetNo),txt(u.item)])", "JSON.stringify([u.id,u.ref,ownerKey(u.recordedOwner944!==undefined?u.recordedOwner944:u.owner),txt(u.assetNo),txt(u.item)])",'retain existing loading evidence fingerprints')
change("source=u&&u.source==='native'?u:null,owner=u?u.owner:'unknown';", "source=u&&u.source==='native'?u:null,owner=u?u.owner:'coates';",'default new-unit form to Coates')
change("const companies=[...new Set(['unknown','coates','event-portables','prem-air-hire',owner].concat(subCompanies().map(owner925)))];", "const companies=[...new Set(['coates','event-portables','prem-air-hire',owner].concat(subCompanies().map(owner925)))].filter(c=>!Ownership944.unspecified(c));",'remove ownership confirmation option')
change("const owner=owner925(name);if(owner!=='coates'", "const owner=Ownership944.owner(owner925(name));if(owner!=='coates'",'no unnamed company bucket')
change("const api={owner:owner925,company:company925,", "const api={owner:v=>Ownership944.owner(owner925(v)),company:v=>company925(Ownership944.owner(v)),",'public ownership labels')
# Keep source evidence unchanged. Only its current ownership display follows Andrew's latest instruction.
change("${source.co === 'Supplier not named' ? 'The supplier is not named in that source. ' : ''}Source:", "${Ownership944.unspecified(source.co) ? 'Coates ownership confirmed by Andrew, 9 Oct 2026. ' : ''}Original source:",'latest ownership provenance beside original note')
change("return ((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).map(String).filter(x => /^\\d{5,8}$/.test(x) && !subNos.has(x));", "return [...new Set(((a._buildingNumbers && a._buildingNumbers.length) ? a._buildingNumbers : (a.asset_numbers || [])).concat(ownership944RawSubs(a.key).filter(x=>Ownership944.unspecified(x.co)).map(x=>x.no)).map(String))].filter(x => /^\\d{5,8}$/.test(x) && !subNos.has(x));",'inventory counts the corrected Coates fleet')
change("if (misc) return 'The hire contract has no Coates number for ' + misc + ' line' + (misc === 1 ? '' : 's') + ' here (MISCITEM) - likely a sub-hire. Check the sticker.';", "if (misc) return 'The hire contract has no asset number for ' + misc + ' line' + (misc === 1 ? '' : 's') + ' here (MISCITEM). Coates ownership applies unless a named supplier is recorded.';",'remove supplier inference from missing number')
change("if (none === L.length) return 'The hire contract has not allocated a number here yet - the sticker on the unit tells you whose it is.';", "if (none === L.length) return 'The hire contract has not allocated a number here yet. Coates ownership applies unless a named supplier is recorded.';",'separate missing number from ownership')
change("u&&u.owner&&u.owner!=='unknown'?u.owner:typeof epLine909==='function'&&epLine909(a,original)?'event-portables':'unknown'", "u&&u.owner?Ownership944.owner(u.owner):((typeof epLine909==='function'&&epLine909(a,original))||(a.key==='WC31'&&/^16\\s*pan\\s*block$/i.test(original)))?'event-portables':'coates'",'loading product default')
# Current financial attribution only; source rates, amounts and contract flags remain intact.
change("if(named&&row.subhired)return {owner:named,basis:'explicit contract supplier',rehire:true};", "if(Ownership944.named(named)&&(row.subhired||row.subhired_machine))return {owner:named,basis:'explicit contract supplier',rehire:true};",'named contract supplier classification')
change("return {owner:'unknown',basis:'supplier ownership not established',rehire:false};", "return {owner:'coates',basis:'Andrew confirmed default Coates ownership, 9 Oct 2026',rehire:false};",'default financial ownership')
change("if (r.subhired) { b.subLines++;", "if (r.subhired && finance928ContractOwner(r).rehire) { b.subLines++;", 'named SUB branch line classification')
change("if (r.subhired) { b.rehire =", "if (r.subhired && finance928ContractOwner(r).rehire) { b.rehire =", 'named SUB branch Revenue classification')
change("const subs = take(r => r.subhired);", "const subs = take(r => r.subhired && finance928ContractOwner(r).rehire);", 'named SUB Rehire group classification')
change("else if (r.subhired_machine && !r.subhired) { b.plantLines++;", "else if (r.subhired_machine && !r.subhired && finance928ContractOwner(r).rehire) { b.plantLines++;",'branch unnamed machine classification')
change("const forks = take(r => r.branch_code === 'NVAC' && /forklift/.test(r.family || '') && (!r.asset_no_is_plant_number || r.subhired_machine))", "const forks = take(r => r.branch_code === 'NVAC' && /forklift/.test(r.family || '') && finance928ContractOwner(r).rehire)", 'Rehire forklift classification')
change("take(r => r.subhired_machine).forEach(r =>", "take(r => r.subhired_machine && finance928ContractOwner(r).rehire).forEach(r =>",'other named machine classification')
change("addRev((r.subhired ? 'Rehire' : 'Hire') + ' Revenue — daily contract allocation'", "addRev((finance928ContractOwner(r).rehire ? 'Rehire' : 'Hire') + ' Revenue — daily contract allocation'",'daily account ownership label')
change("addRev(r.family === 'toilet' ? 'Toilet Rehire Revenue — event allocation' : r.subhired ? 'Rehire Revenue — event allocation' : 'Hire Revenue — event allocation'", "addRev((r.family === 'toilet'?'Toilet ':'')+(finance928ContractOwner(r).rehire?'Rehire':'Hire')+' Revenue — event allocation'",'event account ownership label')
change("A contract line is rehire here when every toilet line is Event Portables gear (the toilets stream’s rule), when its item code starts with SUB, when the project manager marked the machine hired in, or — the NVAC forklifts — on Andrew’s word of 1 Oct 2026.", " A contract line is Rehire when its contract or current unit record identifies a supplier. Andrew confirmed on 9 Oct 2026 that unassigned ownership is Coates; older unnamed supplier assumptions are superseded.", 'current financial ownership explanation')
change("sub-hired contract lines and the 5 t forklift hired in — supplier cost", " sub-hired contract lines — supplier cost",'remove superseded unnamed forklift cost prompt')
change("Unidentified ownership remains outside confirmed supplier revenue.", "Coates is the default owner; named supplier allocations remain Rehire.", 'supplier ownership provenance')
# Preserve named supplier plans and recorded counts; unassigned ownership is the Coates run.
old="""if (evtUnk) { const s = subs.length || site ? 'sub' : coatesNums ? 'coates' : null; return {streams: s ? [{s, n: evtN}] : [], ownerUnk: s ? 0 : Math.max(evtN, 1), co}; }
 const sub = Math.min(subs.length, evtN), coates = Math.min(coatesNums, evtN - sub), unk = evtN - sub - coates;
 return {streams: [sub ? {s: 'sub', n: sub} : null, coates ? {s: 'coates', n: coates} : null].filter(Boolean), ownerUnk: unk, co};"""
new="""const planned = u.filter(x=>x.evt&&typeof epLine909==='function'&&epLine909(a,x.type));
 return Ownership944.runOwners(evtN,evtUnk,subs,site,coatesNums,planned);"""
change(old,new,'Demob known supplier runs and Coates default')
change("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta id=\"ownership944-marker\" name=\"gc500-owner-default\" content=\"9.44\">",'release marker')
change(" · v"+prior+"'; /* v8.19", " · v9.44'; /* v8.19",'release footer')
args.page.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('Applied v9.44 Coates ownership default'+(' (private941 preview)' if args.preview_base_941 else ''))
