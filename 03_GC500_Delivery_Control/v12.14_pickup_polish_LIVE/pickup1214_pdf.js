/* Author: Andrew Fisher. Coates-style driver pickup sheets: native text, vector QR and sharp plan imagery. */
(function(W){
 'use strict';
 const ink=[36,38,41],orange=[255,106,19],grey=[89,98,107],pale=[243,245,246],amber=[255,242,220];
 const clean=s=>String(s??'').replace(/[–—]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/×/g,'x').replace(/→/g,'to').replace(/↑/g,'north');
 const directions=ll=>'https://www.google.com/maps/dir/?api=1&destination='+ll.lat.toFixed(6)+','+ll.lon.toFixed(6)+'&travelmode=driving';
 function reference(at=new Date()){
  const day=new Date(at.getTime()+36000000).toISOString().slice(0,19).replace(/[-:T]/g,'');
  return 'GC500-PU-'+day+'-'+crypto.randomUUID().slice(0,6).toUpperCase();
 }
 async function make({blob,rows,centre,packRef,preparedAt,noTwin=false}){
  if(!rows?.length||!Number.isFinite(centre?.lat)||!Number.isFinite(centre?.lon))throw new Error('A mapped pickup selection is required.');
  if(!/^GC500-PU-\d{14}-[A-F0-9]{6}$/.test(packRef||''))throw new Error('A valid pickup pack reference is required.');
  const lib=await pdf7Lib(),doc=pdf7Doc(lib,'GC500 pickup pack | '+packRef),bitmap=await createImageBitmap(blob);
  doc.__ts1053=true; // This pickup document prints only its own selected restriction.
  doc.setProperties({author:'Andrew'+' Fisher',subject:'Selected equipment and navigation. Not a collection record.'});
  const prepared=new Date(preparedAt).toLocaleString('en-AU',{timeZone:'Australia/Brisbane',hour12:false})+' AEST';
  let url=directions(centre),coordinates=centre.lat.toFixed(6)+', '+centre.lon.toFixed(6);
  const L=14,R=196,WID=182,BOTTOM=267;
  let y=0,section='',location='',pageCount=0,handoverDone=false;
  const accessText='Roads are open and travel is permitted in either direction. Navigate to the marked location on its pickup sheet and follow current signs and site traffic control.',windowText='Check the current collection window and access with site before dispatch.',recordTitle='PICKUP REQUEST / NOT A DEPARTURE RECORD',recordText='Clear every outstanding hold before collection. This pack does not mark equipment as collected. Record the actual departure separately after the selected equipment leaves site.';
  function font(size=10,bold=false,colour=ink){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...colour);}
  function write(t,x,at,size=10,bold=false,colour=ink){font(size,bold,colour);doc.text(clean(t),x,at);}
  function wrap(t,width,size=9){font(size);return doc.splitTextToSize(clean(t),width);}
  function block(t,x,at,width,size=9,bold=false,colour=ink,leading=4.25){const ls=wrap(t,width,size);font(size,bold,colour);ls.forEach((s,i)=>doc.text(s,x,at+i*leading));return at+ls.length*leading;}
  function rect(x,at,w,h,c){doc.setFillColor(...c);doc.rect(x,at,w,h,'F');}
  function header(continued=false){
   if(pageCount++)doc.addPage();
   const top=continued?26:33;
   rect(L,10,WID,top-10,ink);rect(L,top,WID,2,orange);
   write('coates',20,continued?21:23,continued?23:27,true,[255,255,255]);
   if(!continued)write('INDUSTRIAL SOLUTIONS',20,29,6.5,false,[220,223,226]);
   write('GC500 / 2026',137,continued?18:21,continued?12:15,true,[255,255,255]);write('SITE LOGISTICS  /  DEMOB',137,continued?23:29,7.4,false,[220,223,226]);
   write(continued?section+' / CONTINUED':'PICKUP PACK',L,top+13,continued?12:21,true);
   write('PACK REF  '+packRef,L,top+21,8.2,true);
   font(8,false,grey);doc.text('Prepared '+prepared,R,top+21,{align:'right'});
   y=top+29;
   if(continued&&location){y=block(location,L,y,WID,10,true,grey,4.3)+3;}
  }
  function need(height){if(y+height>BOTTOM)header(true);}
  function paragraph(t,{size=9,bold=false,colour=ink,gap=2}={}){
   const ls=wrap(t,WID-8,size);for(const s of ls){need(4.3);write(s,L+4,y,size,bold,colour);y+=4.3;}y+=gap;
  }
  function label(t){need(13);rect(L,y-4,2,7,orange);write(t,L+5,y+1,10,true);y+=10;}
  function note(title,content,colour=pale){
   const ls=wrap(content,WID-12,9),height=10+ls.length*4.2;
   if(height<BOTTOM-90){need(height+3);rect(L,y-4,WID,height,colour);write(title,L+5,y+1,9,true);ls.forEach((s,i)=>write(s,L+5,y+7+i*4.2,9));y+=height+2;}
   else{label(title);paragraph(content);}
  }
  function qr(x,at,size){
   if(typeof qrcode!=='function')throw new Error('Navigation QR could not be prepared. Please try again.');
   const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),m=4,u=size/(n+2*m);
   rect(x,at,size,size,[255,255,255]);doc.setFillColor(0,0,0);
   for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))doc.rect(x+(c+m)*u,at+(r+m)*u,u+.01,u+.01,'F');
   doc.link(x,at,size,size,{url});
  }
  const pictures=new Map();
  async function mapImage(r){
   if(!r)return bitmap;
   if(!pictures.has(r.key))pictures.set(r.key,await createImageBitmap(r.mapBlob));
   return pictures.get(r.key);
  }
  function mapPng(b){const cv=document.createElement('canvas'),n=Math.min(b.width,b.height);cv.width=cv.height=n;cv.getContext('2d').drawImage(b,0,0,n,n,0,0,n,n);const png=cv.toDataURL('image/png');cv.width=cv.height=1;return png;}
  async function mapAndNavigation(r){
   need(117);const top=y,b=await mapImage(r),target=r?.target;
   if(target){url=directions(target.ll);coordinates=target.ll.lat.toFixed(6)+', '+target.ll.lon.toFixed(6);}
   rect(L,top,104,104,pale);doc.addImage(mapPng(b),'PNG',L+3,top+6,98,98,undefined,'FAST');
   rect(L,top,104,6,ink);write(r?'LOCATION DETAIL / UPRIGHT PLAN':'SELECTED 50 m x 50 m AREA',L+3,top+4.3,7.2,true,[255,255,255]);
   const nx=124;
   if(r){write('SCAN TO THIS LOCATION',nx,top+2,9,true);qr(nx,top+6,33);block('Camera on phone\nopens Google Maps',160,top+13,35,8.2,false,grey,4);
    font(8.2,true);doc.setTextColor(0,85,150);doc.textWithLink('Navigate to '+r.key,nx,top+44,{url});write(coordinates,nx,top+50,8,false,grey);
   }else{block('Each location sheet has its own marked pickup destination and navigation QR.',nx,top+12,72,11,true,ink,5);}
   rect(nx,top+54,72,12,noTwin?amber:pale);write(noTwin?'NO TWIN-STEER TRUCKS':'TRUCK RESTRICTION',nx+3,top+59,9,true);write(noTwin?'Selected for this pickup pack':'No local restriction selected',nx+3,top+63.5,7.8,false,grey);
   let at=block('Roads open: travel in either direction. Follow current signs and site traffic control.',nx,top+72,72,8.5,false,ink,4)+2;
   block(r?'Orange dot = QR destination. Google Maps may finish on the nearest road; use this plan for the final approach.':'Dashed outline is the original selection. Upright context extends beyond the 50 m square.',nx,at,72,8.1,false,grey,3.7);
   block('EQUIPMENT-ALIGNED PLAN / North arrow shown. Blue arrows: recorded plan door directions.',L,top+109,WID,8,false,grey,3.7);y=top+117;
  }
  function tableHeader(){need(17);rect(L,y-4,WID,8,ink);write('QTY / EQUIPMENT',L+4,y+1,8,true,[255,255,255]);write('ASSET / OWNER',104,y+1,8,true,[255,255,255]);y+=10;}
  function inventory(items){
   label('SELECTED FOR PICKUP');tableHeader();let stripe=0;
   for(const it of items){
    const a=wrap(it.n+' x '+it.type,80,9.2),details=it.units.map(u=>'Asset '+(u.number||'not recorded')+' | '+(u.company||'Owner not recorded'));
    if(it.unidentified)details.push(it.unidentified+' without individual asset IDs - identity/owner to confirm.');
    if(!details.length)details.push('Individual asset details not recorded.');
    const b=details.flatMap(t=>wrap(t,87,9.2)),len=Math.max(a.length,b.length);let pos=0;
    while(pos<len){
     if(y+9>BOTTOM){header(true);label('SELECTED FOR PICKUP / CONTINUED');tableHeader();}
     const count=Math.min(len-pos,Math.floor((BOTTOM-y-4)/4.4)),height=count*4.4+4;
     if(stripe%2===0)rect(L,y-3,WID,height,pale);
     for(let j=0;j<count;j++){const left=pos>=a.length?a[j]:a[pos+j];if(left)write(left,L+4,y+1+j*4.4,9.2,true);if(b[pos+j])write(b[pos+j],104,y+1+j*4.4,9.2);}
     doc.setDrawColor(218,223,226);doc.line(L,y+height-3,R,y+height-3);y+=height;pos+=count;
    }
    stripe++;
   }
   y+=4;
  }
  function transportDetails(r){
   label('WEIGHTS & DIMENSIONS');
   for(const it of r.items){const specs=it.specs?.length?it.specs:[{labels:['Selected '+it.n+' items'],lines:W.MapPickupSpecs1212.describe(null)}];
    for(const spec of specs){need(20);paragraph(it.type+' | '+spec.labels.join(', '),{bold:true});for(const line of spec.lines)paragraph(line,{size:9,colour:grey,gap:1});y+=3;}
   }
  }
  function locationDetails(r){
   if(r.hold.length)for(const h of r.hold)note('HOLD / CLEAR BEFORE COLLECTION',h,amber);
   const doorText=r.doors||'Plan door position/direction not recorded.',loading=(r.pickupLoading||[]).map(l=>'Truck loading | '+(l.asset?l.asset+' | ':'')+l.item+': '+({driver:'door to driver side',passenger:'door to passenger side',na:'door side not applicable'}[l.side]||'door side not recorded'));
   const doorLines=[doorText,...loading];need(Math.min(100,13+doorLines.reduce((n,t)=>n+wrap(t,WID-8,9).length*4.3+2,0)));label('DOORS & LOADING');for(const t of doorLines)paragraph(t);
  }
  function contentsDetails(r){
   if(!r.contents?.length)return;
   label('RECORDED BUILDING CONTENTS');
   paragraph('Contents recorded at '+r.key+'. These are a check list for the driver, not additional pickup selections. Where this reference contains several buildings, confirm which building holds each item.',{size:8.5,colour:grey});
   for(const c of r.contents){need(15);paragraph((c.quantity??'?')+' x '+c.type+' | Asset '+(c.asset||'number not recorded'),{bold:true});}
  }
  function handoverSide(x,top,width,draw=false){
   const parts=[['SITE ACCESS & HANDOVER',9.5,true,ink], [accessText,9,false,ink], [windowText,9,false,ink], [recordTitle,9,true,ink], [recordText,9,false,grey]];
   let at=top+5;
   for(const [text,size,bold,colour] of parts){const lines=wrap(text,width-10,size);if(draw){font(size,bold,colour);lines.forEach((line,i)=>doc.text(line,x+5,at+i*4.3));}at+=lines.length*4.3+4;}
   return at-top;
  }
  function photoDetails(r,last=false){
   const good=(r.pictures||[]).filter(p=>!p.unavailable),col=87,gap=8;
   const caption=(p,i)=>'PHOTO '+String(i+1).padStart(2,'0')+' | '+p.caption;
   const row=(pair,start)=>{
    const heights=pair.map(p=>Math.min(76,col*p.height/p.width)),captions=pair.map((p,j)=>wrap(caption(p,start+j),col,9));
    return {heights,captions,imageHeight:Math.max(...heights),height:Math.max(...heights)+Math.max(...captions.map(c=>c.length))*4.3+11};
   };
   section='EQUIPMENT PHOTOS';
   need(good.length?Math.min(160,row(good.slice(0,2),0).height+10):28);
   label('EQUIPMENT & LOCATION PHOTOS');
   if(!r.pictures?.length){paragraph(r.photoState==='ready'?'No matching equipment or location photograph available for this selection.':'Photo availability could not be confirmed. No photograph is substituted.',{colour:grey});return;}
   for(const p of r.pictures.filter(p=>p.unavailable))paragraph(p.caption+' | Photo could not be loaded; open the location record to view it.',{colour:grey});
   for(let i=0;i<good.length;i+=2){
    const pair=good.slice(i,i+2),{heights,imageHeight,height}=row(pair,i),side=last&&pair.length===1&&height<=175,sideHeight=side?handoverSide(0,0,col):0;
    if(height>175){
     for(const [j,p] of pair.entries()){need(118);const ht=Math.min(108,174*p.height/p.width),wd=ht*p.width/p.height;doc.addImage(p.data,'JPEG',L+(WID-wd)/2,y,wd,ht,undefined,'FAST');y+=ht+5;paragraph(caption(p,i+j),{size:9,colour:grey});}
    }else{
     need(Math.max(height,sideHeight));pair.forEach((p,j)=>{const x=L+j*(col+gap),ht=heights[j],wd=ht*p.width/p.height;rect(x,y-2,col,imageHeight+3,pale);doc.addImage(p.data,'JPEG',x+(col-wd)/2,y+(imageHeight-ht)/2,wd,ht,undefined,'FAST');block(caption(p,i+j),x,y+imageHeight+6,col,9,false,grey,4.3);});
     if(side){const x=L+col+gap;rect(x,y-2,col,sideHeight,pale);rect(x,y-2,2,7,orange);handoverSide(x,y,col,true);handoverDone=true;}
     y+=Math.max(height,sideHeight);
    }
   }

  }

  try{
   if(rows.length>1){
    section='PICKUP OVERVIEW';header();write(rows.length+' LOCATIONS / '+rows.reduce((n,r)=>n+r.items.reduce((s,i)=>s+i.n,0),0)+' SELECTED ITEMS',L,y,14,true);y+=9;
    await mapAndNavigation(null);label('SITE REFERENCES');
    for(const r of rows){need(14);paragraph(r.key+' | '+r.name,{bold:true});paragraph(r.items.map(i=>i.n+' x '+i.type).join('; ')+(r.hold.length?' | HOLD - see location sheet':''));}
   }
   for(const [index,r] of rows.entries()){
    section='PICKUP DETAILS';location=r.key+' | '+r.name;header();
    y=block(r.key,L,y,WID,25,true,ink,10)+2;y=block(r.name,L,y,WID,10,false,grey,4.5)+5;
    await mapAndNavigation(r);if(r.target?.basis)paragraph(r.target.basis,{size:8,colour:grey});inventory(r.items);locationDetails(r);transportDetails(r);contentsDetails(r);photoDetails(r,index===rows.length-1);
   }
   if(!handoverDone){location='';section='ACCESS & HANDOVER';need(60);label('SITE ACCESS & HANDOVER');paragraph(accessText);paragraph(windowText);note(recordTitle,recordText);}
   const pages=doc.getNumberOfPages();
   for(let n=1;n<=pages;n++){
    doc.setPage(n);doc.setDrawColor(...orange);doc.setLineWidth(.65);doc.line(L,274,R,274);
    write('Author: Andrew Fisher',L,280,8,true);write('PICKUP REQUEST  /  '+n+' OF '+pages,152,280,8,true);
    write(packRef,L,285,7,false,grey);
    block('Mapped references are registered to the master plan, not surveyed. A reference may contain several units. Exact per-unit positions are not established by this pack.',L,290,WID,7,false,grey,3);
   }
   return doc.output('blob');
  }finally{bitmap.close();for(const b of pictures.values())b.close();}
 }
 W.MapDemobPdf1211=Object.freeze({version:'v12.14',make,reference});
})(window);
