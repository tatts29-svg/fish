// Author: Andrew Fisher. Map identity projection preserves the canonical unit record and search lifecycle.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../identity996.js'),'utf8');
const a={key:'WC61'},rows=[{ref:'WC61',physical:true,assetNo:'0645',owner:'event-portables'},{ref:'WC61',physical:true,assetNo:'0001',owner:'event-portables'},{ref:'WC61',physical:false,assetNo:'RETIRED',owner:'event-portables'},{ref:'WC09',physical:true,assetNo:'OTHER',owner:'event-portables'}];
const c={Units925:{company:k=>({'event-portables':'Event Portables',coates:'Coates'})[k]||k},JSON,Set,Map};vm.createContext(c);vm.runInContext(src.slice(0,src.indexOf('const planItems996')),c);c.a=a;c.rows=rows;
let checks=0;function check(ok,name){assert(ok,name);checks++}
let v=vm.runInContext('MapIdentity996.project(a,rows,{rows:[]},{known:true,text:"Coates compound"})',c);
check(v.assets==='0645, 0001','Leading zeros and canonical physical identities preserved');check(v.ownership==='SUB-HIRED · Event Portables','Supplier ownership clearly marked');check(v.location==='Coates compound','Known text remains searchable without coordinates');
c.rows=[];v=vm.runInContext('MapIdentity996.project(a,rows,{rows:[{owner:"event-portables",quantityOnly:true,item:"Pee panels",quantity:6}]},{known:false,text:"Toilets"})',c);
check(v.assets==='','Quantity-only equipment gets no invented number');check(v.ownership.includes('quantity 6')&&v.ownership.includes('SUB-HIRED'),'Quantity and owner retained together');check(v.location==='','Unknown destination is not asserted');
const elements={q:{value:'0645'},finder:{hidden:false}};let matches=[{kind:'asset',key:'WC61'}],draws=0;
Object.assign(c,{window:{gc500PlanItems:()=>({items:[],unplaced:[],placed:[]})},holdAssets:fn=>fn(),render:()=>7,document:{getElementById:id=>elements[id]},FINDER:{list:[{kind:'asset',key:'WC61'}],at:0},finderMatches:()=>matches,finderDraw:()=>draws++});
vm.runInContext(src.slice(src.indexOf('const planItems996')),c);
check(vm.runInContext('render()',c)===7&&draws===1,'Open search refresh preserves native return');check(c.FINDER.at===0&&c.FINDER.list[0].key==='WC61','Selected matching reference retained');matches=[];vm.runInContext('render()',c);check(c.FINDER.list.length===0&&c.FINDER.at===-1,'Obsolete result removed on remote redraw');elements.finder.hidden=true;const before=draws;vm.runInContext('render()',c);check(draws===before,'Closed search is not reopened by redraw');
console.log(JSON.stringify({author:'Andrew Fisher',checks,pass:true,recordWrites:0}));
