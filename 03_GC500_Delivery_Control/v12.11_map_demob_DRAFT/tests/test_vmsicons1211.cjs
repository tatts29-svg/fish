/* Author: Andrew Fisher. Numbered vector VMS markers, shared-pin separation and search selection. Read only. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',uhd=process.env.UHD==='1',out=process.env.OUT,h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:mobile?390:uhd?3840:1440,H:mobile?844:uhd?2160:1000,dpr:mobile?2:1,mobile}),p=h.page,checks=[];fs.mkdirSync(out,{recursive:true});const check=(name,ok)=>{checks.push({name,ok:!!ok});fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
try{
 await p.waitForFunction(()=>document.querySelector('#expFrame')?.contentWindow?.GC500VmsIcons1211&&SYNC.status==='live',null,{timeout:180000});const f=p.frames().find(x=>x.url().includes('/explorer/index.html')),before=await p.evaluate(()=>JSON.stringify(S));
 const button=p.getByRole('button',{name:'VMS boards',exact:true});check('VMS quick finder is directly available',await button.count()===1);await button.click();await p.waitForTimeout(650);await p.evaluate(()=>expFullToggle(true));await p.waitForTimeout(400);
 check('VMS quick finder fills correct query',await p.locator('#f1176q').inputValue()==='VMS boards');
 const results=await f.evaluate(()=>{const r=GC500Search1210.search('VMS boards');return r.rows.filter(x=>x.kind==='vms'&&!x.none).length;});await p.waitForTimeout(500);
 check('all placed VMS search results have visible numbered icons',results>0&&await f.evaluate(n=>GC500VmsIcons1211.state.length===n,results));
 check('markers use vector sign graphics and readable labels',await f.evaluate(()=>[...document.querySelectorAll('#vmsicons1211 button')].every(b=>b.querySelector('svg path')&&/^VMS /.test(b.textContent)&&b.getAttribute('aria-label').includes('show board location'))));
 check('shared-coordinate synthetic labels separate without moving anchors',await f.evaluate(()=>{const r=GC500VmsIcons1211.layout([{code:'EXAMPLE-A',x:120,y:180},{code:'EXAMPLE-B',x:120,y:180}],390,500);return r.every(x=>x.x===120&&x.y===180)&&!(r[0].left<r[1].left+76&&r[0].left+76>r[1].left&&r[0].top<r[1].top+64&&r[0].top+64>r[1].top);}));
 check('visible icon labels remain inside map viewport',await f.evaluate(()=>GC500VmsIcons1211.state.every(p=>p.left>=0&&p.top>=0&&p.left+76<=sw&&p.top+64<=sh)));
 await p.screenshot({path:path.join(out,'vms-all.png')});
 await f.locator('#vmsicons1211 button').first().click();await p.waitForTimeout(300);check('clicking a numbered icon selects that native board',await f.evaluate(()=>GC500VmsIcons1211.state.some(p=>p.selected&&selected?.code===p.code)));
 for(const query of ['VMS 2a','VMS 5','VMS 11']){await f.evaluate(q=>GC500Search1210.search(q),query);await p.waitForTimeout(300);check(query+' finds its labelled sign',await f.evaluate(()=>GC500VmsIcons1211.state.length>0&&GC500VmsIcons1211.state.every(p=>document.querySelector('[data-vms1211="'+p.code+'"]'))));}
 await p.screenshot({path:path.join(out,'vms-single.png')});
 await f.evaluate(()=>GC500Search1210.search('first aid'));await p.waitForTimeout(300);check('unrelated search clears VMS overlays',await f.locator('#vmsicons1211 button').count()===0);
 check('no record mutation or runtime errors',before===await p.evaluate(()=>JSON.stringify(S))&&!h.errors.length&&!h.counts.blocked);
}finally{await h.browser.close();}console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
