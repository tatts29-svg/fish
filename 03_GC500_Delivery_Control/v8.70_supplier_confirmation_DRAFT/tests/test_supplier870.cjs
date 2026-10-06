// Author: Andrew Fisher. Read-only supplier scope and output checks; values are read from the shared record.
const {open}=require('../../toolchain/harness/open_page');const fs=require('fs');
(async()=>{const mobile=!!process.env.MOB,s=await open({pageFile:process.env.PAGE,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?2:1,mobile}),p=s.page,R=[];
const ok=(n,b)=>{R.push([n,!!b]);};await p.waitForFunction(()=>typeof epSupply870==='function'&&SYNC.status==='live');await p.waitForTimeout(2500);
const x=await p.evaluate(()=>holdAssets(()=>{const c=epConfirmation870(),plan=epPlan870(),fwf=plan.quote.rows.find(r=>/^FWF\b/.test(r.item)),P=epSupply870(),I=epInventory860(),before=JSON.stringify({inventory:inventory(),money:moneySummary(),record:S.units,qty:S.qtys}),snap=JSON.stringify(EP819),live=ep819Html(),sheets=plan.loads.map(l=>epRunSheet819(l));
const key='SUPPLIER-EVENT-PORTABLES-FWF',saved=S.supplied[key];S.supplied[key]={...saved,total:Number(c.total)+7};const changed=epPlan870(),cp=epSupply870();S.supplied[key]=saved;
const after=JSON.stringify({inventory:inventory(),money:moneySummary(),record:S.units,qty:S.qtys});return{c,fwf,P,planning:I.summary.planning,inventorySupply:I.summary.fwfSupply,liveHas:live.includes(c.total+'')&&live.includes('Confirmed supply'),noStaleGap:!live.includes('55 not yet delivered'),sheets:sheets.every(t=>t.includes('FWF confirmed supply '+c.total)),originalSame:snap===JSON.stringify(EP819),preserved:before===after,changed:changed.quote.rows.find(r=>/^FWF\b/.test(r.item)),changedP:cp,scope:epScopeHtml870(),modelCheck:fh866Model().peopleCheck&&fh866Model().costCheck};}));
ok('saved confirmation is valid and labelled supplier scope',x.c&&x.c.scope==='supplier-total'&&Number.isInteger(x.c.total));
ok('plan reads the saved total',x.fwf.quote===x.c.total);
ok('WC allocation is retained, gap recalculated',x.fwf.no_wc_allocation===Math.max(0,x.c.total-x.fwf.allocated_to_wc));
ok('recorded site quantities and remaining supply reconcile',x.P.on===x.P.at+x.P.spare&&x.P.left===Math.max(0,x.P.total-x.P.on));
ok('supplier inventory reads the same scope',x.inventorySupply.total===x.c.total);
ok('inventory planning gap uses confirmed total',x.planning.unallocated.find(r=>/^FWF\b/.test(r.description))?.qty===x.P.unallocated);
ok('Timeline shows confirmed supply without obsolete gap note',x.liveHas&&x.noStaleGap);
ok('all run sheets show supplier confirmation without changing load sizes',x.sheets&&x.P.inLoads>0);
ok('Today supplier scope detail reads the same total',x.scope.includes(x.c.total+' FWF confirmed supply'));
ok('future confirmation changes propagate without mutating original quote',x.changed.quote===x.c.total+7&&x.changedP.total===x.c.total+7&&x.originalSame);
ok('inventory, arrivals, reference quantities and money remain unchanged',x.preserved);
ok('labour and P&L remain reconciled',x.modelCheck);
await p.evaluate(()=>go('timeline'));await p.waitForTimeout(1200);ok('Timeline confirmation is visible',await p.locator('#pane-timeline [data-ep870-supply]').count()>0);
await p.evaluate(()=>go('plant'));await p.waitForTimeout(1200);ok('Equipment confirmation is visible',await p.locator('#pane-plant [data-ep870-supply]').count()>0);
if(process.env.OUT){await p.locator('#pane-plant [data-ep870-supply]').scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUT+'-'+(mobile?'phone':'desktop')+'.png'});}
ok('no runtime errors',s.errors.length===0);ok('no operational writes attempted',s.counts.blocked===0);
for(const [n,b]of R)console.log((b?'PASS ':'FAIL ')+n);console.log((mobile?'phone':'desktop')+': '+R.filter(r=>r[1]).length+'/'+R.length+' pass');await s.browser.close();if(R.some(r=>!r[1]))process.exit(1);
})().catch(e=>{console.error(e.message);process.exit(2)});
