/* Author: Andrew Fisher. Synthetic private-source binding behaviour, no job data. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
function fixture(){
 const assets=['A','B'].map((name,i)=>({key:'W-'+name,discipline:'Toilets & amenities',asset_numbers:[],charge_lines:[{item:'FWF',quantity:1,priceable:true}],events:[{task_id:'TASK-'+name,source_range:'SYNTHETIC-'+name,dd:String(97000001+i)}]}));
 const charge={rental_contract:'TEST-CONTRACT',branch_code:'TEST',line:90,kind:'transport',item:'Delivery',description:'Delivery W-A',charge_line:true,quantity:1,price:30,delivery_number:'97000001',location:null};
 const cfg={schema:1,card:{eachWay:true,sha256:'synthetic-current-card'},rateSupplements:[],included:[],heldScopes:[],coverage:[{id:'TEST-CONTRACT|90',charge:{description:charge.description,quantity:1,price:30,delivery_number:charge.delivery_number,location:null},leg:'delivery',quantityBasis:'units',targets:[{kind:'event',ref:'W-A',item:'FWF',taskId:'TASK-A',range:'SYNTHETIC-A',docket:'97000001'}],sourceChecks:[]}]};
 const ctx={DATA:{transport_forecast831:cfg},RM:{rate_card_sha256:'synthetic-current-card'},ONHIRE_ROWS:[charge],allAssets:()=>assets,chargeLines:a=>a.charge_lines,branchOf:()=>({code:'TEST',contracts:['TEST-CONTRACT']}),contractOf:()=>({ids:['TEST-CONTRACT'],id:'TEST-CONTRACT'}),rentalOf:()=>({lines:[]}),contractTreatment747:()=>null,cardRate:()=>({line:'Synthetic FWF',transport:{charge:40}}),qtyOf:l=>l.quantity,CARD_WORD:'street',contractCharge:r=>({amount:r.price==null?null:r.price*r.quantity})};
 vm.createContext(ctx);for(const name of ['building_transport831.js','other_transport831.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx);
 const calc=()=>{const input=ctx.otherTransportInput831();return ctx.buildingTransport831({buildings:input.buildings,coverage:ctx.transportCoverage831(input.buildings,ctx.ONHIRE_ROWS,input.uncertainLines,input.coverageOverrides)});};
 return{assets,charge,cfg,ctx,calc};
}
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const leg=(m,ref,direction)=>m.rows.find(r=>r.ref===ref&&r.leg===direction);
test('exact current movement binding covers one delivery only',()=>{const f=fixture(),m=f.calc();assert.equal(m.uncoveredAdditional,120);assert.equal(leg(m,'W-A','delivery').state,'covered');assert.equal(leg(m,'W-B','delivery').additional,40);});
test('docket match is independent of a replacement physical number',()=>{const f=fixture();f.assets[0].asset_numbers=['REPLACEMENT'];assert.equal(f.calc().uncoveredAdditional,120);});
test('changed charge amount is held pending source reconciliation',()=>{const f=fixture();f.charge.price=31;assert.equal(leg(f.calc(),'W-A','delivery').state,'held');});
test('changed docket binding holds previous affected movement',()=>{const f=fixture();f.assets[0].events[0].dd='97999999';assert.equal(leg(f.calc(),'W-A','delivery').state,'held');});
test('unrelated note does not invalidate source identity',()=>{const f=fixture();f.assets[0].note='Unrelated note';assert.equal(f.calc().uncoveredAdditional,120);});
test('missing reviewed source cannot quietly revive an estimate',()=>{const f=fixture();f.ctx.ONHIRE_ROWS.splice(0,1);assert.equal(leg(f.calc(),'W-A','delivery').state,'held');});
test('each-way authority failure holds numeric additions',()=>{const f=fixture();f.cfg.card.eachWay=false;assert.equal(f.calc().uncoveredAdditional,0);});
test('current-card revision failure holds numeric additions',()=>{const f=fixture();f.ctx.RM.rate_card_sha256='changed';assert.equal(f.calc().uncoveredAdditional,0);});
test('live ordered quantity changes without snapshot ceiling',()=>{const f=fixture();f.assets[1].charge_lines[0].quantity=2;assert.equal(f.calc().uncoveredAdditional,200);});
test('included scope has no fabricated quantity or standalone amount',()=>{const f=fixture();f.cfg.included=[{family:'Fencing',item:'Fence transport',basis:'Included in hire',source:'Synthetic current source'}];const m=f.calc();assert.equal(m.included,1);assert.equal(m.uncoveredAdditional,120);assert.equal(m.rows.find(r=>r.family==='Fencing').quantity,null);});
test('held source-only family stays unpriced',()=>{const f=fixture();f.cfg.heldScopes=[{family:'Other scope',item:'Unpriced unit',reason:'No quoted transport basis',source:'Synthetic source'}];const m=f.calc();assert.equal(m.rows.find(r=>r.family==='Other scope').rate,null);assert.equal(m.uncoveredAdditional,120);});
test('projection does not mutate source records or reviewed specification',()=>{const f=fixture(),before=JSON.stringify({assets:f.assets,cfg:f.cfg,source:f.ctx.ONHIRE_ROWS});f.calc();assert.equal(JSON.stringify({assets:f.assets,cfg:f.cfg,source:f.ctx.ONHIRE_ROWS}),before);});
test('retargeted source holds old and current delivery',()=>{const f=fixture();f.charge.description='Delivery W-B';f.charge.delivery_number='97000002';const m=f.calc();assert.equal(leg(m,'W-A','delivery').state,'held');assert.equal(leg(m,'W-B','delivery').state,'held');assert.equal(m.uncoveredAdditional,80);});
test('changed source direction holds old delivery and current pickup',()=>{const f=fixture();f.charge.description='Pickup W-A';f.charge.item='Pickup';const m=f.calc();assert.equal(leg(m,'W-A','delivery').state,'held');assert.equal(leg(m,'W-A','pickup').state,'held');assert.equal(m.uncoveredAdditional,80);});
console.log(JSON.stringify({author:'Andrew Fisher',passed:count}));
