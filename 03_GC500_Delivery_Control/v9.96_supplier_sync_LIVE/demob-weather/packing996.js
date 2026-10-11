/* Author: Andrew Fisher. Native dated Demob loads, with typed supplier capacity and physical block identity. */
(function(root){'use strict';
const normal=x=>String(x??'').toLowerCase().replace(/[^a-z0-9]/g,''),whole=n=>Number.isInteger(Number(n))&&Number(n)>0;
const family=item=>root.Supplier996.family(item);
function splitBlocks(refs,iso,physical){
 const residual=[],loads=[];
 for(const r of refs){
  if(!r.units.some(u=>!u.unknown&&whole(u.n)&&family(u.type)==='block')){residual.push(r);continue;}
  const units=r.units.map(u=>({...u})),seen=new Set(),pool=physical(r.a).filter(u=>u.physical&&u.owner==='event-portables'&&!u.slot&&u.id&&u.assetNo&&family(u.item)==='block').filter(u=>!seen.has(u.id)&&seen.add(u.id));
  for(const item of units){
   if(item.unknown||!whole(item.n)||family(item.type)!=='block')continue;
   const exact=pool.filter(u=>normal(u.item)===normal(item.type));
   // Conflicting identities cannot establish which physical units are in the requested quantity.
   if(exact.length>item.n||new Set(exact.map(u=>String(u.assetNo))).size!==exact.length)continue;
   for(const u of exact){
    const part={type:item.type,n:1,unknown:false,tank:false,assetNo:String(u.assetNo),unitId:u.id};
    const row={r,n:1,part:false,iso,parts996:[part]};
    const toilet={rows:[row],units:1,stream:'sub',cap:1,free:0,over:false,uncertain:false,n:'B'+(loads.length+1),id:'sub-block:'+JSON.stringify([iso,r.key,u.id]),block996:true,panels996:0};
    loads.push({kind:'supplier',toilet,co:'Event Portables',stops:[{r,n:1,part:false,area:r.zone,parts:[part]}]});item.n--;
   }
  }
  if(units.some(u=>u.n>0||u.unknown))residual.push(units.some((u,i)=>u.n!==r.units[i].n)?{...r,units}:r);
 }
 return {refs:residual,loads};
}
function rowParts(x){
 const items=x.r.units.filter(u=>u.evt&&(u.n>0||u.unknown));
 if(items.length===1&&!items[0].unknown)return [{type:items[0].type,n:x.n,tank:false,unknown:false}];
 const total=items.reduce((n,u)=>n+u.n,0),stream=x.r.streams?.find(s=>s.s==='sub');
 if(!items.some(u=>u.unknown)&&total===x.n&&stream?.n===total)return items.map(u=>({type:u.type,n:u.n,tank:false,unknown:false}));
 // A saved portion specifies a count, not the item mix. Preserve that uncertainty; allow for every possible panel.
 return [{type:items.map(u=>u.type).join(' + ')||'Event portables',n:x.n,tank:false,unknown:!!x.r.evtUnk,composition996:true,panelRisk996:items.some(u=>family(u.type)==='panel')}];
}
function repack(loads){
 return loads.flatMap(source=>{
  if(source.stream!=='sub')return [source];
  const result=[];let current=null;
  function fresh(){const k=result.length;current={...source,rows:[],units:0,panels996:0,cap:24,id:k?source.id+'.p'+(k+1):source.id,n:k?String(source.n)+'.'+(k+1):source.n,packingSplit996:k>0,packingIssue996:false};result.push(current);}
  fresh();
  source.rows.forEach((x,index)=>{
   const parts=rowParts(x);
   for(const p of parts){let left=p.n;if(!whole(left)){current.rows.push({...x,parts996:[{...p,unknown:true}]});current.units+=Math.max(0,Number(left)||0);current.uncertain=true;continue;}
    const panel=family(p.type)==='panel'||p.panelRisk996;
    while(left){const room=Math.min(24-current.units,panel?6-current.panels996:24);if(room<=0){fresh();continue;}
     const n=Math.min(left,room),part={...p,n},last=current.rows.find(y=>y.sourceRow996===index);
     if(last){last.n+=n;last.parts996.push(part);}else current.rows.push({...x,n,part:x.part||n!==x.n,parts996:[part],sourceRow996:index});
     current.units+=n;if(panel)current.panels996+=n;current.packingIssue996 ||= !!p.composition996;left-=n;
    }
   }
  });
  return result.filter(L=>L.rows.length).map(L=>({...L,rows:L.rows.map(x=>x.sourceRow996==null?x:{...x,part:!!source.rows[x.sourceRow996].part||x.n!==source.rows[x.sourceRow996].n}),free:24-L.units,over:L.units>24||L.panels996>6,uncertain:!!source.uncertain||L.uncertain}));
 });
}
function capacity(L){if(L.block996)return '16-pan block · full truck';return L.units+(L.uncertain?' + quantity to confirm':'')+' of '+L.cap+(L.stream==='sub'?' · max 6 pee panels':'')+(L.packingIssue996?' · item split to confirm':'');}
function words(p){return (p.unknown?'quantity to confirm':p.n)+' × '+p.type+(p.assetNo?' · asset '+p.assetNo:'')+(p.tank?' (the tank, after the toilet on it)':'')+(p.composition996?' · item split to confirm':'');}
const api={splitBlocks,repack,rowParts,capacity,words};root.DemobPacking996=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
