'use strict';
const fs=require('fs');const {open}=require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000}),p=h.page;
try{await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const c=x=>Math.round(x*100)/100;const m=moneySummary();const b={};try{pl752Rows().forEach(x=>b[x.code]={total:c(x.total),rev:x.revenue!=null?c(x.revenue):undefined})}catch(e){b.err=String(e)}
const refs={};for(const k of ['T0003','T0004','T0005','FL01','FL02','EQ0004','EQ0007','T0085','T0109']){try{const a=allAssets().find(x=>x.key===k);refs[k]=a?c(assetTotal(a).total||0):'none'}catch(e){refs[k]='err'}}
let pl=null;try{const M=pl770Model();pl={rev:(M.rev||M.revenue||[]).map(r=>[r.code,r.line,c(+r.now||0),c(+r.job||0)]),keys:Object.keys(M)}}catch(e){pl=String(e)}return {pl,charge:c(m.charge.total),cost:c(m.cost.known),diff:c(m.difference),branches:b,refs,foot:(document.body.innerText.match(/v12\.\d+\.\d+/)||[])[0],errors:0}});
r.pageErrors=h.errors.length;fs.writeFileSync(process.env.OUT,JSON.stringify(r,null,1));console.log(JSON.stringify(r));}catch(e){console.log('ERR',e.message)}await h.browser.close();})();
