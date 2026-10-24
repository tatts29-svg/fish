const fs=require('fs'),vm=require('vm');
const t=fs.readFileSync(process.argv[2],'utf8');
const d=t.match(/<script id="shapes915-data" data-sha256="[0-9a-f]{64}">const MASTER_SHAPES915_DATA = ([\s\S]*?);<\/script>\n<script id="shapes915-script">([\s\S]*?)<\/script>/);
const ctx={window:{},JSON,Math,Object,Number,String,Array,Set,Infinity,isNaN};vm.createContext(ctx);
vm.runInContext('const MASTER_SHAPES915_DATA = '+d[1]+';\n'+d[2]+'\n;this.__api=MasterShapes915;',ctx);
const A=ctx.__api; console.log(JSON.stringify(A.meta()));
let n=0,bad=[];
for(const r of A.refs()){ for(const o of [{pxPerPt:7.75,number:1},{pxPerPt:0.3,selected:true,rot:1.1},{pxPerPt:30,door:0}]){ try{const s=A.svg(r,o); if(!s) bad.push([r,'null']); n++;}catch(e){bad.push([r,String(e)]);} }
  for(const u of A.units(r)){ if(u.cancelled&&!u.components.length) continue; try{const s=A.svg(r,{unit:u.n,pxPerPt:7.75}); if(!s) bad.push([r,u.n,'unit null']);}catch(e){bad.push([r,u.n,String(e.stack)]);} } }
console.log('svgs',n,'bad',bad.slice(0,8));
const out=[];
for (const [r,o] of [['WC20',{pxPerPt:7.75}],['WC20',{unit:3,pxPerPt:7.75}],['WC20',{pxPerPt:0.8}],['WB06',{pxPerPt:2}],['WB06',{pxPerPt:0.4}],['WB14',{pxPerPt:30}],['WB02',{pxPerPt:2}],['GN23',{pxPerPt:7.75}],['WC45',{pxPerPt:7.75}],['T0158',{pxPerPt:4}],['WC01',{pxPerPt:12}],['GN13',{pxPerPt:12}],['T0266',{pxPerPt:12}],['T0025',{pxPerPt:7.75}],['WC57',{pxPerPt:7.75}],['WC59',{pxPerPt:7.75}],['P27',{pxPerPt:7.75}],['P27',{pxPerPt:7.75,unit:1}],['WC05',{pxPerPt:7.75,unit:2}],['WC05',{pxPerPt:7.75,selected:true}]]) out.push('<div style="display:inline-block;margin:8px;padding:6px;border:1px solid #ccc;background:#fff;vertical-align:top"><b>'+r+' '+JSON.stringify(o)+'</b><br>'+A.svg(r,o)+'</div>');
fs.writeFileSync(process.argv[3],'<!doctype html><meta charset=utf-8><body style="background:#e9eef0;font:12px system-ui">'+out.join('')+'</body>');
console.log(JSON.stringify(A.units('WC20')).slice(0,900));
console.log(JSON.stringify(A.unit('WC20','u1327228')).slice(0,400));
console.log(A.reason('P47'), JSON.stringify(A.units('P47')).slice(0,300));
