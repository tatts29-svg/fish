/* Author: Andrew Fisher. Native readonly invariants shared by the independent checks. */
const assert=require('node:assert/strict');
async function capture(page){
 return page.evaluate(()=>holdAssets(()=>({
  record:JSON.stringify(S),specs:JSON.stringify(FLOW891.specs),
  M:moneySummary(),X:cj764Model(),P:pl770Model(),B:pl752Rows(),
  V:transport888View(),R:recon888Model(),RH:rh766Model(),
  quotes:DATA.rehire_quotes,contract:contractFigures(ONHIRE_ROWS),
  toiletBranch:pl760ToiletBranch()
 })));
}
async function guard(page){
 await page.evaluate(()=>{
  // Stop incoming asynchronous record updates only after the complete fresh read.
  // This leaves the product's actual state and model/render functions intact.
  if(Array.isArray(SYNC.unsub)){SYNC.unsub.forEach(fn=>fn());SYNC.unsub=[];}
  window.__independent931Writes=[];
  window.bump=function(){__independent931Writes.push('bump');throw Error('Readonly loading information attempted a native save');};
  if(SYNC.db&&typeof SYNC.db.doc==='function'){
   const native=SYNC.db.doc.bind(SYNC.db);
   SYNC.db.doc=function(...args){const doc=native(...args);for(const method of ['set','update','delete'])if(typeof doc[method]==='function')doc[method]=()=>{__independent931Writes.push(method);throw Error('Readonly loading information attempted a document write');};return doc;};
  }
 });
}
function unchanged(before,after){
 for(const key of Object.keys(before))assert.deepEqual(after[key],before[key],'Readonly loading information changed '+key);
 assert(after.R.ties.length>=17&&after.R.ties.every(t=>t.ok),'Native financial reconciliation failed');
}
async function assertNoWrites(page,session){
 assert.deepEqual(await page.evaluate(()=>__independent931Writes),[],'A native operational save was attempted');
 const attempts=session.counts.blockedPaths||[];
 assert(attempts.every(x=>x.method==='POST'&&x.origin==='https://tile.googleapis.com'&&x.path==='/v1/createSession'),'Unexpected write request: '+JSON.stringify(attempts));
 return attempts;
}
async function inspectReadonly(page,selector){
 return page.locator(selector).evaluateAll(boxes=>boxes.map(box=>({
  text:box.innerText,
  controls:[...box.querySelectorAll('input,select,textarea,[contenteditable="true"]')].map(x=>({tag:x.tagName,type:x.type||'',label:x.getAttribute('aria-label')||x.name||''})),
  saveButtons:[...box.querySelectorAll('button')].map(x=>x.innerText.trim()).filter(t=>/^(save|record|add|use selected|copy reference)\b/i.test(t)),
  overflow:box.scrollWidth>box.clientWidth+2,
  emptyRows:[...box.querySelectorAll('tr')].filter(row=>{const cells=row.querySelectorAll('td');return cells.length===2&&!cells[1].textContent.trim();}).map(row=>row.textContent.trim())
 })));
}
module.exports={capture,guard,unchanged,assertNoWrites,inspectReadonly};
