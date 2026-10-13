/* Author: Andrew Fisher. Independent source arithmetic and over-allocation regression cases. */
'use strict';
const assert=require('assert/strict'),P=require('./pricing1010'),fs=require('fs'),vm=require('vm');
const checks=[],eq=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);checks.push(name);};
const source={hire:672.1677000000001,daily:9.5996},card=P.price({source}),items=(quantity=6,arrived=6)=>[{ref:'WC09',item:'Pee Panel',quantity,arrived}];
eq('Published D22 rate is kept at source precision',card.fullHireRate,672.1677000000001);
eq('Source daily rate is explanatory, never multiplied into the full hire',card.daily,9.5996);
eq('Six individual panels are not a bundle charged six times',P.pee(items(),[],source,card).amount,4033.01);
eq('No supplier direct cost is added to customer hire',P.pee(items(),[],source,card).supplierCostAdditional,0);
for(const [q,arrived,actual,remaining]of [[6,0,0,4033.01],[6,2,1344.34,2688.67],[6,6,4033.01,0],[5,5,3360.84,0],[0,0,0,0]]){
 const p=P.pee(items(q,arrived),[],source,card);eq(q+'/'+arrived+' receipt partition',[p.actualAmount,p.remainingAmount],[actual,remaining]);eq(q+'/'+arrived+' all amounts count once',P.cents(p.actualAmount+p.remainingAmount),p.amount);
}
for(const [quantity,arrived]of [[null,1],[6,null],[6,7],[-1,0],[2.5,2]])eq('Invalid quantities are not billed '+quantity+'/'+arrived,P.pee(items(quantity,arrived),[],source,card).state,'scope changed');
eq('New contract coverage prevents duplicate fallback hire',P.pee(items(),[{description:'WC09 Pee Panels',quantity:6}],source,card).amount,0);
eq('Transport descriptions do not suppress item hire',P.pee(items(),[{description:'Pee Panels delivery',charge_line:true}],source,card).amount,4033.01);
const edited=P.price({source,fullOverride:'500'});eq('Edited full hire rate applies once',P.pee(items(),[],source,edited).amount,3000);
eq('Edited rate preserves source-rate evidence',edited.sourceRate,source.hire);
eq('Blank restores published source rate',P.price({source,fullOverride:''}).fullHireRate,source.hire);
eq('Zero and below-supplier rates cannot be silently saved',P.validate('449.99').ok,false);
eq('Supplier floor itself is allowed',P.validate('450'),{ok:true,value:450,error:null});
eq('Blank is an explicit card reset',P.validate(''),{ok:true,value:null,error:null});
for(const x of ['text','Infinity','-1','1000001',[500],true])eq('Invalid editor input is rejected '+x,P.validate(x).ok,false);
for(const x of [[500],true,'1000000000000'])eq('Shared model rejects invalid values beyond editor controls '+x,P.price({source,fullOverride:x}).invalid,true);
eq('Older weekly entry retains its explicit weekly basis',P.price({source,weeklyOverride:1050,weeklyDays:3}).fullHireRate,450);
eq('Full-hire entry wins without rewriting older weekly evidence',P.price({source,fullOverride:500,weeklyOverride:1050,weeklyDays:3}).fullHireRate,500);
eq('Stored invalid low rate is surfaced as rejected',P.price({source,fullOverride:400}).underFloor,true);
const row={rental_contract:'9968955',line:102,quantity:10,register_type:'FWF',description:'WC09 Toilet Portable - Fresh Water Flush',asset_no_is_plant_number:false,rate_1:90.07};
eq('Approved site quantity replaces stale Baseplan quantity',P.quantity(row,{quantity:4}).billableQuantity,4);
eq('Source contract evidence remains unchanged',row.quantity,10);
eq('Partial receipt is not mistaken for a reduction in approved scope',P.quantity(row,{quantity:10,arrived:4}),null);
eq('Forecast remaining stays included when ordered quantity is ten',P.quantity(row,{quantity:10,arrived:4}),null);
eq('Numbered historic hires are not capped',P.quantity({...row,asset_no_is_plant_number:true},{quantity:4}),null);
eq('Other contracts are not silently repriced',P.quantity({...row,rental_contract:'OTHER'},{quantity:4}),null);
eq('Changed item identity is not silently repriced',P.quantity({...row,register_type:'Pee Panel'},{quantity:4}),null);
eq('Missing scope is not interpreted as zero',P.quantity(row,{quantity:null}),null);
// Exercise the actual integration wrapper against a minimal independent contract reader.
let scopeQty=4;const c={window:{},S:{rates:{},minDays:{},lineRates:{}},Pricing1010:P,PeeHire979:{source},MAX_MIN_DAYS:365,
 assetOf:()=>({key:'WC09'}),chargeLines:()=>[{item:'FWF',quantity:scopeQty},{item:'Pee Panel',quantity:6}],qtyOf:l=>l.quantity,receivedChargeQty1006:()=>6,chargeSpanOf:()=>({days:3}),chargedDays:()=>({days:3}),
 cardRate:()=>({minimum_hire:null,labour_per_piece:{lines:[]}}),rateFor:()=>({value:1}),contractCharge:r=>({amount:Math.round((r.quantity||1)*r.rate_1*100)/100,basis:'source quantity'}),
 ItemIdentity979:{select:()=>[]},ItemCharges979:{project:(ref,item,rs,read)=>({amount:read(rs[0]).amount,lines:rs.map(r=>({id:r.rental_contract+'|'+r.line,contract:r.rental_contract,line:r.line,quantity:r.quantity,amount:read(r).amount}))})}};
c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/pricing1010.js','utf8'),c);
let priced=c.contractCharge(row);eq('Actual contract wrapper removes exactly six FWF charges',priced.amount,360.28);eq('Excluded revenue is transparent',priced.excludedAmount1010,540.42);
const projected=c.ItemCharges979.project('WC09','FWF',[row],c.contractCharge,{},[]);eq('Drawer receives four billable units, avoiding a second prorating',projected.lines[0].quantity,4);eq('Drawer and contract model charge the same amount',projected.amount,priced.amount);
scopeQty=0;eq('Explicit zero scope never triggers the old default-to-one',c.contractCharge(row).amount,0);
scopeQty=10;eq('Restoring approved scope restores the original contract charge',c.contractCharge(row).amount,900.7);
c.S.lineRates[P.hireKey]='500';eq('Generic reference hire uses the same edited price',c.rateFor('Toilets & amenities','Pee Panel','WC09').value,500);eq('Financial fallback uses the same edited price',c.PeeHire979.forecast(items(),[]).amount,3000);
delete c.S.lineRates[P.hireKey];eq('Reset propagates to financial fallback',c.PeeHire979.forecast(items(),[]).amount,4033.01);
const building=(line,no,status,ref,rate=1426.07)=>({rental_contract:'9968862',line,asset_no:no,asset_no_is_plant_number:true,quantity:1,kind:'building',register_type:'Building 6m',branch_code:'KINP',status_as_written:status,start_date:status==='Delivered'?'2026-09-14':null,rate_1:rate,description:ref+' Building'});
const buildings=[building(7,'1327213','Delivered','P04',1951.46),building(94,'1327213','Del Req','P46',1951.46),building(100,'1327215','Pending','P46',1951.46),building(93,'1189410','Delivered','P36'),building(108,'1189410','Pending','P67'),building(63,'1189412','Delivered','P41',1426.17),building(110,'1189412','Pending','P65')];
let decision;
const oldBuildings=[building(4,'1322579','Delivered','P03',1951.46),building(7,'1327213','Delivered','P04',1951.46),building(94,'1327213','Del Req','P46',1951.46),building(100,'1327215','Delivered','P51',1951.46)];
const oldBuildingsText=JSON.stringify(oldBuildings),mapped=P.sourceRows(oldBuildings);
eq('Updated source resolves all four actual buildings once',mapped.filter(r=>!r.sourceAddition1010).map(r=>[r.line,r.asset_no,r.match?.key]),[[4,'1327212','P03'],[7,'1327213',undefined],[94,'1322579','P51'],[100,'1327215','P46']]);
eq('Identity corrections preserve all four original hire rates',mapped.filter(r=>!r.sourceAddition1010).reduce((n,r)=>n+r.rate_1*r.quantity,0),7805.84);
eq('Raw Baseplan evidence is not mutated',JSON.stringify(oldBuildings),oldBuildingsText);
eq('Source projection is idempotent',JSON.stringify(P.sourceRows(mapped)),JSON.stringify(mapped));
eq('P51 corrected line is not removed as old P46 duplication',P.allocation(mapped[2],mapped,{quantity:1,physicalNumbers:['1322579']}),null);
const p45=mapped.find(r=>r.line===131),identity=require('../../v9.79_item_charges_LIVE/item_identity979.js');
eq('Missing P45 source hire is included once',p45.rate_1*p45.quantity,1426.07);
eq('The blank source asset number is not filled with invented source data',p45.asset_no,null);
eq('P45 current site receipt is not replaced by the source pending date',p45.start_date,null);
eq('P45 explicit reference selects the new source hire for its known physical unit',identity.select('P45','Building 6m',mapped,[{physical:true,item:'Building 6m',owner:'Coates',assetNo:'107135'}]).map(r=>r.line),[131]);
eq('Existing source line 131 prevents a second added hire',P.sourceRows(mapped).filter(r=>r.line===131).length,1);
eq('Existing later updated source line is preserved',P.sourceRows([{...p45,rate_1:1500}]).find(r=>r.line===131).rate_1,1500);
for(const line of [108,110]){decision=P.allocation(buildings.find(r=>r.line===line),buildings,{quantity:1});eq('Pending '+line+' is held outside actual',decision.actualAmount,null);eq('Pending '+line+' keeps one planned building hire',decision.remainingAmount,1426.07);}
eq('Existing primary delivered hire stays charged',P.allocation(buildings[0],buildings,{quantity:1}),null);
eq('Updated genuine asset number is not kept under the old hold',P.allocation({...buildings[4],asset_no:'NEW'},buildings,{quantity:1}),null);
const supplied=P.allocation(buildings[4],buildings,{quantity:1,arrived:1,physicalNumbers:['NEW']});
eq('A newly confirmed physical asset releases its known hire to actual',supplied.state,'current-scope-confirmed');eq('Confirmed arrival removes remaining forecast once',supplied.remainingAmount,0);
eq('Reusing another site asset does not release a hold',P.allocation(buildings[4],buildings,{quantity:1,arrived:1,physicalNumbers:['1189410']}).state,'forecast-allocation-hold');
eq('No confirmed arrival leaves a new number in forecast',P.allocation(buildings[4],buildings,{quantity:1,arrived:0,physicalNumbers:['NEW']}).state,'forecast-allocation-hold');

const history=[{rental_contract:'9961976',line:25,kind:'forklift',asset_no:'1247787',start_date:'2026-09-14',term_date:'2026-09-17'},{rental_contract:'9961976',line:35,kind:'forklift',asset_no:'1247787',booked_delivery_date:'2026-10-09',expected_term_date:'2026-10-28'},{rental_contract:'9961976',line:26,kind:'forklift',asset_no:'1312577',start_date:'2026-09-14',expected_term_date:'2026-10-26'}];
const hire=[{id:'9961976|25',assetNo:'1247787',quantity:1,amount:556.2},{id:'9961976|26',assetNo:'1312577',quantity:1,amount:7786.8},{id:'9961976|35',assetNo:'1247787',quantity:1,amount:3522.6}],input=[{ref:'T0005',item:'Forklift 2.5T RT',arrived:2,hire}],before=JSON.stringify(input);
const periods=P.periods(input,history)[0];eq('T0005 has two physical units after three hire periods',periods.hire.reduce((n,r)=>n+r.quantity,0),2);eq('T0005 includes the legitimate later hire',P.cents(periods.hire.reduce((n,r)=>n+r.amount,0)),11865.6);eq('Historical input remains untouched',JSON.stringify(input),before);
eq('Overlapping dates are not quietly combined',P.periods(input,history.map(r=>r.line===25?{...r,term_date:'2026-10-12'}:r))[0].hire.length,3);
eq('A shared boundary date remains an overlap for review',P.periods(input,history.map(r=>r.line===25?{...r,term_date:'2026-10-09'}:r))[0].hire.length,3);
eq('Missing dates prevent an invented rehire period',P.periods(input,history.filter(r=>r.line!==25))[0].hire.length,3);
const onsite=require('../../v9.79_item_charges_LIVE/onsite_complete979.js');
eq('Actual onsite model retains both periods without adding a third machine',onsite.project(P.periods(input,history),[]).rows[0].hire,11865.6);
eq('A second reference cannot charge these same hire periods again',onsite.project(P.periods(input.concat([{...input[0],ref:'ALIAS'}]),history),[]).known,11865.6);
const p45package=onsite.project([{ref:'P45',item:'Building 6m',arrived:1,hire:[{id:'9968862|131',quantity:1,amount:1426.07}],fallbackHire:1426.07}],[]);
eq('P45 linked hire replaces its fallback without double charging',p45package.known,1426.07);
const review=P.reviewHolds([{ref:'GN?',item:'200kva & cables',arrived:2},{ref:'T0109',item:'2.5T Forklift STD',arrived:1,physicalNumbers:['1281615']}]);
eq('Only the cable parent is a charge hold, not its ten included children',review.filter(r=>r.ref==='GN?').length,1);
eq('Cable bundle children remain included contents',review[0].source.includedChild,47);
eq('Unsettled cable period is not converted to a guessed total',review[0].amount,null);
eq('Conflicting forklift source stays a reconciliation hold',review[1].amount,null);
eq('Items not received do not get onsite reconciliation holds',P.reviewHolds([{ref:'GN?',item:'200kva & cables',arrived:0}]).length,0);
eq('Another physical forklift does not inherit this source discrepancy',P.reviewHolds([{ref:'T0109',item:'2.5T Forklift STD',arrived:1,physicalNumbers:['OTHER']}]).length,0);
for(const [ref,item,asset]of [['AA','Building 6m','142514'],['WC42','FWF','EP0141'],['WC81','FWF','EP0124']]){
 eq(ref+' unmatched card estimate is visibly held',P.reviewHolds([{ref,item,arrived:1,physicalNumbers:[asset]}]).length,1);
 eq(ref+' native asset number without supplier prefix is matched',P.reviewHolds([{ref,item,arrived:1,physicalNumbers:[asset.replace(/^EP/,'')]}]).length,1);
 eq(ref+' an exact later contract clears its coverage hold',P.reviewHolds([{ref,item,arrived:1,physicalNumbers:[asset],exactContract:true}]).length,0);
}
console.log(JSON.stringify({author:'Andrew Fisher',checks:checks.length,pass:true,names:checks}));
