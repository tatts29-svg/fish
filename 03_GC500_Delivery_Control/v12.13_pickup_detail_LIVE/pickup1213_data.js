/* Author: Andrew Fisher. Read-only contents and photographs for the selected pickup references. */
(function(W){
 'use strict';
 const building=t=>/\bbuilding\b|ticket box|event container/i.test(t||'');
 const text=x=>String(x??'').trim();
 function contents(a,selected,fire){
  if(!selected.some(i=>building(i.type)))return [];
  return [...(a.accessories||[]),...(fire||[])].filter(x=>x&&x.active!==false&&x.qty!==0).map(x=>({
   type:text(x.type)||'Contents',quantity:Number.isFinite(Number(x.qty))&&Number(x.qty)>0?Number(x.qty):null,asset:text(x.asset_no),
   id:text(x._accId),scope:'Recorded at '+a.key+'; individual building assignment not established'
  }));
 }
 function photos(a,r){
  const all=dropPhotosOf(a.key),model=gcModel925(a),chosen=new Set(r.items.flatMap(i=>i.units.map(u=>u.id))),units=model.rows.filter(u=>chosen.has(u.id));
  const unitPhotos=new Set(units.flatMap(u=>Units925.photos(u,model.rows,all)).map(p=>p.id));
  const groupPhotos=new Set(r.items.filter(i=>i.unidentified).flatMap(i=>{const g=typeof ItemPhotos965!=='undefined'?ItemPhotos965.group(a,i.type,model):null;return g?ItemPhotos965.photos(g,all):[];}).map(p=>p.id));
  const out=[],seen=new Set(),add=(id,src,caption,version)=>{if(!src||seen.has(id))return;seen.add(id);out.push({id,src,caption,version:version||''});};
  for(const p of all){
   if(p.unit&&!unitPhotos.has(p.id)&&!groupPhotos.has(p.id))continue;
   const f=photoFor(p);if(f.state!=='ready')continue;
   const unit=units.find(u=>Units925.photos(u,model.rows,[p]).length);
   add(p.id,f.url,(unit?'Asset '+(unit.assetNo||'number not recorded'):'Location '+a.key)+(p.caption?' | '+p.caption:''),f.file?.sha256||p.at);
  }
  const filed=filedPhotosOf(a.key);
  for(const f of filed.files||[]){
   if(all.some(p=>p.id===f.id)||S.photoLinks?.[f.id]?.removed||((S.dropPhotos?.[a.key]?.photos)||[]).some(p=>p.id===f.id&&p.removed))continue;
   if(!/\.(png|jpe?g|webp)$/i.test(f.name||'')&&!/^image\//.test(f.mime||f.type||''))continue;
   add(f.id,f.url||SYNC.backend.fileUrl(f.id),'Location '+a.key+(f.title?' | '+f.title:''),f.sha256||f.uploaded);
  }
  // A catalogue image is only a labelled product reference, never a photograph of this physical unit.
  if(!out.length)for(const it of r.items){
   if(it.units.some(u=>u.owner!=='coates')||it.unidentified)continue;
   const p=productPhoto({...a,item_types:[it.type]});
   if(p?.kind==='photo')add('product:'+p.key,p.src,'Product reference only | '+it.type+' | '+(p.says||'Not a photograph of the selected asset'),p.key);
  }
  return out;
 }
 function read(rows){return rows.map(r=>{const a=assetOf(r.key);if(!a)throw new Error('The pickup reference is no longer available.');return {...r,contents:contents(a,r.items,fire914Rows(a.key)),photos:photos(a,r),photoState:photoIndex().state};});}
 const fingerprint=rows=>JSON.stringify(rows.map(r=>[r.key,r.contents,r.photos.map(p=>[p.id,p.caption,p.version,p.src.startsWith('data:')?p.id:p.src]),r.photoState]));
 async function image(p){
  let bmp;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const res=await fetch(p.src,{signal:controller.signal});if(!res.ok)throw new Error('image unavailable');const blob=await res.blob();if(blob.size>30*1024*1024)throw new Error('image too large');bmp=await createImageBitmap(blob);
   const scale=Math.min(1,2400/Math.max(bmp.width,bmp.height)),cv=document.createElement('canvas');cv.width=Math.round(bmp.width*scale);cv.height=Math.round(bmp.height*scale);const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(bmp,0,0,cv.width,cv.height);const data=cv.toDataURL('image/jpeg',.92),result={...p,data,width:cv.width,height:cv.height};cv.width=cv.height=1;return result;
  }catch(_){return {...p,unavailable:true};}finally{clearTimeout(timer);bmp?.close();}
 }
 async function load(rows){const out=[];for(const r of rows){const pictures=[];for(let i=0;i<r.photos.length;i+=3)pictures.push(...await Promise.all(r.photos.slice(i,i+3).map(image)));out.push({...r,pictures});}return out;}
 W.MapPickup1213=Object.freeze({read,contents,fingerprint,load});
})(window);
