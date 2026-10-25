/* Author: Andrew Fisher. Contents/photograph identity boundaries; synthetic fixtures only. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');let n=0;
const ctx={window:{},assetOf:()=>asset,gcModel925:()=>({rows:units}),dropPhotosOf:()=>photos,photoFor:p=>({state:p.broken?'missing':'ready',url:'https://example.test/'+p.id,file:{sha256:p.id}}),filedPhotosOf:()=>({files}),photoIndex:()=>({state:'ready'}),fire914Rows:()=>fire,productPhoto:()=>({key:'fixture',kind:'photo',src:'data:image/png;base64,AA',says:'Example model only'}),S:{photoLinks:{}},SYNC:{backend:{fileUrl:id=>'https://example.test/'+id}},Units925:{photos:(u,rows,ps)=>ps.filter(p=>p.unit===u.id)},ItemPhotos965:{group:()=>({}),photos:(g,ps)=>ps.filter(p=>p.unit==='group')}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../pickup1213_data.js'),'utf8'),ctx);const api=ctx.window.MapPickup1213;
let asset={key:'EXAMPLE',accessories:[{type:'Fridge',qty:1,asset_no:'EX-FRIDGE'},{type:'Air conditioner',qty:2,asset_no:''},{type:'Removed contents',qty:0},{type:'Inactive',qty:1,active:false}]},units=[{id:'SELECTED',assetNo:'EX-001'},{id:'OTHER',assetNo:'EX-002'}],photos=[{id:'chosen',unit:'SELECTED'},{id:'other',unit:'OTHER'},{id:'location'},{id:'broken',unit:'SELECTED',broken:true}],files=[],fire=[{type:'Fire extinguisher',qty:1}];
const rows=[{key:'EXAMPLE',items:[{type:'Building 6m',n:1,units:[{id:'SELECTED',number:'EX-001',owner:'coates'}],unidentified:0}]}];
function check(name,ok){assert(ok,name);n++;console.log('PASS '+name);}
let r=api.read(rows)[0];check('contents retain recorded identities and quantity, omit removed/inactive',r.contents.length===3&&r.contents.find(c=>c.type==='Fridge').asset==='EX-FRIDGE'&&r.contents.find(c=>c.type==='Air conditioner').quantity===2);
check('fire extinguisher has no invented asset identity',r.contents.find(c=>c.type==='Fire extinguisher').asset==='');
check('contents not silently added to selected pickup units',r.items===rows[0].items&&r.items[0].units.length===1);
check('only chosen unit and unassigned location photographs included',r.photos.length===2&&r.photos.some(p=>p.id==='chosen')&&r.photos.some(p=>p.id==='location'));
let t=api.fingerprint([r]);photos[0].caption='new caption';check('photo changes invalidate snapshot',api.fingerprint(api.read(rows))!==t);t=api.fingerprint(api.read(rows));asset.accessories[0].asset_no='CHANGED';check('contents identity changes invalidate snapshot',api.fingerprint(api.read(rows))!==t);
check('non-building pickup does not inherit building contents',api.read([{...rows[0],items:[{...rows[0].items[0],type:'Generator'}]}])[0].contents.length===0);
photos=[];files=[{id:'filed',name:'location.jpg',ref:'EXAMPLE'},{id:'removed',name:'old.jpg',ref:'EXAMPLE'}];ctx.S.photoLinks.removed={removed:true};r=api.read(rows)[0];check('filed photos included and removed pointers excluded',r.photos.length===1&&r.photos[0].id==='filed');
files=[];r=api.read(rows)[0];check('catalogue fallback clearly labelled as product reference',r.photos.length===1&&r.photos[0].caption.startsWith('Product reference only'));
rows[0].items[0].units[0].owner='supplier';check('Coates catalogue picture not substituted for supplier equipment',api.read(rows)[0].photos.length===0);
rows[0].items[0].unidentified=1;check('unidentified equipment does not gain a catalogue identity',api.read(rows)[0].photos.length===0);
console.log(n+'/'+n);
