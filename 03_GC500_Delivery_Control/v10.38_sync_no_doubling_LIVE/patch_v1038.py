"""Author: Andrew Fisher. v10.38 - opening the page can no longer double the fencing papers (Andrew, 16 Oct 2026:
"Need to get this sorted, not acceptable on the level we are on").

When a browser opens the page it folds the copy of the record it kept from last time into the shared record
(syncFirst -> mergeRecords). For the paper lists (hire agreements, service notes, collection forms) mergeRecords
kept BOTH versions of any id the two copies held differently, re-keyed id·hash, and the page then wrote both back.
So a phone or laptop that last had the page before an edit brought the old version back beside the new one: 36592 on
14 Oct, all sixteen of 36601-36616 at 10:12 AEST on 16 Oct. Keep-both is right for importing two people's files; it is
wrong for the shared record, where every paper carries its own stamp.

Now, on opening only (mergeRecords(S, theirs, {live: true}) from syncFirst):
  - two versions of the SAME paper (same docket, note or collection number under the same base id) are one record:
    the version with the later stamp stands, and on a tie the shared record's version stands. A browser's later
    edit still goes up, under the shared record's id; a browser's older copy is dropped quietly, not written back.
  - a record the shared record holds under id·hash keeps that id (no renaming on load, which is what let a
    tombstone on the plain id swallow 36592 at 10:34).
  - two DIFFERENT papers that happen to share an id are still both kept, as before, and still written down.
  - duplicates the shared record itself holds are left for a person, as before.
Imports of a file and the two-laptop folder sync keep the keep-both rule unchanged. No record changes; no rate
changes. Footer v10.37 -> v10.38.

    python3 patch_v1038.py path/to/page.html   (on the live v10.37 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.38 - live-merge-1038 */'

REPLACEMENTS = [
    ('mergeRecords takes the live option', "function mergeRecords(mine, theirs){",
     "function mergeRecords(mine, theirs, opts){"),
    ('live flag and the paper keys', " const A = Object.assign(blank(), JSON.parse(JSON.stringify(mine || {})));\n const B = Object.assign(blank(), JSON.parse(JSON.stringify(theirs || {})));\n const out = blank();",
     " " + MARK + " const LIVE = !!(opts && opts.live); /* opening the page: the shared record is B */\n"
     " const NAT1038 = {fenceDockets: d => d && d.docket_no, serviceNotes: n => n && n.note_no, fenceCollections: c => c && c.collection_no};\n"
     " const A = Object.assign(blank(), JSON.parse(JSON.stringify(mine || {})));\n const B = Object.assign(blank(), JSON.parse(JSON.stringify(theirs || {})));\n const out = blank();"),
    ('union remembers each side\'s id', "  if(same){same.held=same.held||!fromB;if((established&&!same.established)||(established===same.established&&J(x)<J(same.x))){same.x=x;same.established=established;}return;}\n  cur.push({x,signature,fromB,held:!fromB,established});byId.set(base,cur);",
     "  if(same){if(fromB)same.bId=String(x0.id);else same.aId=String(x0.id);same.held=same.held||!fromB;if((established&&!same.established)||(established===same.established&&J(x)<J(same.x))){same.x=x;same.established=established;}return;}\n  cur.push({x,signature,fromB,held:!fromB,established,aId:fromB?null:String(x0.id),bId:fromB?String(x0.id):null});byId.set(base,cur);"),
    ('live: one version per paper, ids kept', "  const vs=byId.get(base);\n  if(vs.length===1){out[field].push(vs[0].x);if(vs[0].fromB)rep[counter]++;return;}",
     "  let vs=byId.get(base);\n"
     "  if(LIVE&&vs.length>1&&NAT1038[field]){ /* v10.38 - two versions of one paper between this browser and the shared record: the later stamp stands, the shared record on a tie */\n"
     "   const nat=v=>{const k=NAT1038[field](v.x);return k==null||k===''?null:String(k);};\n"
     "   const sA=v=>v.aId?st(A,field+'/'+v.aId):'',sB=v=>v.bId?st(B,field+'/'+v.bId):'';\n"
     "   const groups=new Map();vs.forEach(v=>{const g=nat(v);if(g===null)return;if(!groups.has(g))groups.set(g,[]);groups.get(g).push(v);});\n"
     "   let keep=vs.slice();\n"
     "   groups.forEach((gv,g)=>{const inB=gv.filter(v=>v.bId),onlyA=gv.filter(v=>!v.bId);if(!inB.length||!onlyA.length)return;\n"
     "    const newestB=inB.reduce((m,v)=>sB(v)>m?sB(v):m,'');\n"
     "    onlyA.forEach(v=>{if(inB.length===1&&sA(v)>newestB){const b=inB[0];v.bId=b.bId;keep=keep.filter(x=>x!==b);}else{keep=keep.filter(x=>x!==v);rep.liveOlder1038=(rep.liveOlder1038||0)+1;}});});\n"
     "   vs=keep;}\n"
     "  if(vs.length===1){const v=vs[0];out[field].push(LIVE?Object.assign({},v.x,{id:v.bId||v.aId||v.x.id}):v.x);if(v.fromB)rep[counter]++;return;}"),
    ('syncFirst merges in live mode', " const {merged, report} = mergeRecords(S, theirs);\n S = merged;\n sharedCache975();",
     " const {merged, report} = mergeRecords(S, theirs, {live: true}); /* v10.38 - opening the page: an older copy kept by this browser never doubles a paper */\n S = merged;\n sharedCache975();"),
    ('the truck-load wrapper passes the live option through', "mergeRecords=function(mine,theirs){\n // Avoid reporting this private cache as a second, conflicting truck-load record.",
     "mergeRecords=function(mine,theirs,opts){ /* v10.38 - live-merge-1038: the opening-the-page option goes through to the merge */\n // Avoid reporting this private cache as a second, conflicting truck-load record."),
    ('the wrapper hands it on', " const result=merge0({...a,loads:without(a.loads)},{...b,loads:without(b.loads)});",
     " const result=merge0({...a,loads:without(a.loads)},{...b,loads:without(b.loads)},opts);"),
    ('Release footer', "+ ' · v10.37'", "+ ' · v10.38'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1038 refuses a repeat')
    if "+ ' · v10.37'" not in html: sys.exit('patch_v1038: not the v10.37 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1038 applied: opening the page keeps one version of each paper (later stamp, shared record on a tie) and keeps the shared record\'s ids; footer v10.37 -> v10.38')


if __name__ == '__main__':
    main()
