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
 async function make({blob,rows,centre,packRef,preparedAt}){
  if(!rows?.length||!Number.isFinite(centre?.lat)||!Number.isFinite(centre?.lon))throw new Error('A mapped pickup selection is required.');
  if(!/^GC500-PU-\d{14}-[A-F0-9]{6}$/.test(packRef||''))throw new Error('A valid pickup pack reference is required.');
  const lib=await pdf7Lib(),doc=pdf7Doc(lib,'GC500 pickup pack | '+packRef),bitmap=await createImageBitmap(blob);
  doc.setProperties({author:'Andrew'+' Fisher',subject:'Selected equipment and navigation. Not a collection record.'});
  const prepared=new Date(preparedAt).toLocaleString('en-AU',{timeZone:'Australia/Brisbane',hour12:false})+' AEST';
  const url=directions(centre),coordinates=centre.lat.toFixed(6)+', '+centre.lon.toFixed(6),L=14,R=196,WID=182,BOTTOM=267;
  let y=0,section='',location='',pageCount=0;
  function font(size=10,bold=false,colour=ink){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...colour);}
  function write(t,x,at,size=10,bold=false,colour=ink){font(size,bold,colour);doc.text(clean(t),x,at);}
  function wrap(t,width,size=9){font(size);return doc.splitTextToSize(clean(t),width);}
  function block(t,x,at,width,size=9,bold=false,colour=ink,leading=4.25){const ls=wrap(t,width,size);font(size,bold,colour);ls.forEach((s,i)=>doc.text(s,x,at+i*leading));return at+ls.length*leading;}
  function rect(x,at,w,h,c){doc.setFillColor(...c);doc.rect(x,at,w,h,'F');}
  function header(continued=false){
   if(pageCount++)doc.addPage();
   rect(L,10,WID,23,ink);rect(L,33,WID,2,orange);
   write('coates',20,23,27,true,[255,255,255]);write('INDUSTRIAL SOLUTIONS',20,29,6.5,false,[220,223,226]);
   write('GC500 / 2026',137,21,15,true,[255,255,255]);write('SITE LOGISTICS  /  DEMOB',137,29,7.4,false,[220,223,226]);
   write(continued?section+' / CONTINUED':'PICKUP PACK',L,46,continued?14:21,true);
   write('PACK REF  '+packRef,L,54,8.2,true);write('Prepared '+prepared,L,60,8,false,grey);
   y=70;
   if(continued&&location){y=block(location,L,y,WID,13,true)+4;}
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
  function crop(map,full=false){
   const source=Math.min(bitmap.width,bitmap.height),pts=[...(map?.points||[]),...(map?.parts||[]).flatMap(p=>p.poly||[])];
   let x=0,z=0,right=source,bottom=source;
   if(!full&&pts.length){const xs=pts.map(p=>(p[0]+25)*source/50),ys=pts.map(p=>(p[1]+25)*source/50),pad=source*.07;
    const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,span=Math.min(source,Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),source*.24)+2*pad);
    x=Math.min(source-span,Math.max(0,cx-span/2));z=Math.min(source-span,Math.max(0,cy-span/2));right=x+span;bottom=z+span;
   }
   if(!(right>x&&bottom>z))throw new Error('Map detail could not be prepared.');
   const cv=document.createElement('canvas');cv.width=Math.ceil(right-x);cv.height=Math.ceil(bottom-z);cv.getContext('2d').drawImage(bitmap,x,z,right-x,bottom-z,0,0,cv.width,cv.height);
   const png=cv.toDataURL('image/png');cv.width=cv.height=1;return png;
  }
  function mapAndNavigation(map,full){
   need(117);const top=y;
   rect(L,top,104,104,pale);doc.addImage(crop(map,full),'PNG',L+3,top+6,98,98,undefined,'FAST');
   rect(L,top,104,6,ink);write(full?'PICKUP AREA / 50 m x 50 m':'LOCATION DETAIL / NORTH UP',L+3,top+4.3,7.2,true,[255,255,255]);
   const nx=124;write('SCAN TO NAVIGATE',nx,top+2,9,true);qr(nx,top+6,33);
   block('Camera on phone\nopens Google Maps',160,top+13,35,8.2,false,grey,4);
   font(8.2,true);doc.setTextColor(0,85,150);doc.textWithLink('Open navigation to pickup area',nx,top+44,{url});
   write(coordinates,nx,top+50,8,false,grey);
   rect(nx,top+54,72,12,amber);write('NO TWIN-STEER TRUCKS',nx+3,top+59,9,true);write('Confirmed for this pickup pack',nx+3,top+63.5,7.8,false,grey);
   let at=top+72;
   at=block('Follow site traffic control. Navigation is to the selected area, not an approved truck route.',nx,at,72,8.1,false,ink,3.7)+2;
   at=block('Track, Esplanade and Macintosh Island Park restrictions apply.',nx,at,72,8.1,false,ink,3.7);
   block('NORTH UP  /  Blue arrows: recorded plan door directions. QR: selected area centre.',L,top+109,WID,8,false,grey,3.7);
   y=top+117;
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
   const lines=[doorText,...loading],height=16+lines.reduce((n,t)=>n+wrap(t,WID-8,9).length*4.3+2,0);
   if(rows.length===1&&y+height>BOTTOM){
    header(true);const top=y;doc.addImage(crop(r.map),'PNG',L+3,top+6,86,86,undefined,'FAST');rect(L,top,92,6,ink);write('LOCATION DETAIL / NORTH UP',L+3,top+4.3,7.5,true,[255,255,255]);
    write('DOORS & LOADING',114,top+4,10,true);let at=top+13;
    for(const t of lines){const h=wrap(t,82,9).length*4.3;if(at+h>top+90)break;at=block(t,114,at,82,9,false,ink,4.3)+3;}
    y=top+100;
    // All details also flow below when too long for the diagram's side panel.
    if(lines.reduce((n,t)=>n+wrap(t,82,9).length*4.3+3,0)>77){label('DOORS & LOADING / FULL DETAILS');for(const t of lines)paragraph(t);}
    paragraph('Close-up from the selected area map. Blue arrows show recorded plan doors; exact per-unit placement is not established.',{size:8,colour:grey});
   }else{label('DOORS & LOADING');for(const t of lines)paragraph(t);}
  }
  try{
   if(rows.length>1){
    section='PICKUP OVERVIEW';header();write(rows.length+' LOCATIONS / '+rows.reduce((n,r)=>n+r.items.reduce((s,i)=>s+i.n,0),0)+' SELECTED ITEMS',L,y,14,true);y+=9;
    mapAndNavigation(null,true);label('SITE REFERENCES');
    for(const r of rows){need(14);paragraph(r.key+' | '+r.name,{bold:true});paragraph(r.items.map(i=>i.n+' x '+i.type).join('; ')+(r.hold.length?' | HOLD - see location sheet':''));}
   }
   for(const r of rows){
    section='PICKUP DETAILS';location=r.key+' | '+r.name;header();
    y=block(r.key,L,y,WID,25,true,ink,10)+2;y=block(r.name,L,y,WID,10,false,grey,4.5)+5;
    mapAndNavigation(r.map,rows.length===1);inventory(r.items);locationDetails(r);transportDetails(r);
   }
   location='';section='ACCESS & HANDOVER';label('SITE ACCESS & HANDOVER');
   paragraph('Macintosh Island Park: enter from Gold Coast Highway into the north-west end of pit lane and follow race direction.');
   paragraph('Buildings: on site before 07:00; truck leaves the pickup point before the 07:00-09:00 travel restriction.');
   note('PICKUP REQUEST / NOT A DEPARTURE RECORD','Clear every outstanding hold before collection. This pack does not mark equipment as collected. Record the actual departure separately after the selected equipment leaves site.');
   paragraph('Mapped references are registered to the master plan, not surveyed. A reference may contain several units. Exact per-unit positions are not established by this pack.',{size:8,colour:grey});
   const pages=doc.getNumberOfPages();
   for(let n=1;n<=pages;n++){
    doc.setPage(n);doc.setDrawColor(...orange);doc.setLineWidth(.65);doc.line(L,274,R,274);
    write('Author: Andrew Fisher',L,280,8,true);write('PICKUP REQUEST  /  '+n+' OF '+pages,152,280,8,true);
    write(packRef,L,285,7,false,grey);
   }
   return doc.output('blob');
  }finally{bitmap.close();}
 }
 W.MapDemobPdf1211=Object.freeze({version:'v12.12',make,reference});
})(window);
