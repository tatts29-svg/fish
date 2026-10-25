/* Author: Andrew Fisher. Native text and sharp map pictures in an attachable pickup PDF. */
(function(W){
 'use strict';
 const clean=s=>String(s??'').replace(/[–—]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/×/g,'x').replace(/→/g,'to').replace(/↑/g,'north');
 async function make({blob,rows,text,centre}){
  const lib=await pdf7Lib(),doc=pdf7Doc(lib,'GC500 Demob pickup pack');doc.setProperties({author:'Andrew Fisher'});
  const png=await pdf7DataUrl(blob),bitmap=await createImageBitmap(blob);let y=18;
  function title(t){doc.setFont('helvetica','bold');doc.setFontSize(17);doc.setTextColor(20,43,60);doc.text(clean(t),14,18);y=29;}
  function line(t){doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(20,43,60);for(const s of doc.splitTextToSize(clean(t),180)){if(y>261){doc.addPage();title('Demob pickup details · continued');}doc.text(s,14,y);y+=5;}y+=1;}
  function link(url,label){if(y>255){doc.addPage();title('Demob navigation');}doc.setTextColor(0,80,170);doc.textWithLink(label,14,y,{url});doc.setTextColor(20,43,60);y+=8;}
  title('GC500 · Demob pickup area');line('50 m x 50 m · north up · selected reference locations');
  doc.addImage(png,'PNG',14,40,182,182*4160/3840,'area1211','FAST');y=244;
  line('Blue arrows show recorded plan door directions. Full selection and holds follow.');
  link('https://www.google.com/maps/dir/?api=1&destination='+centre.lat.toFixed(6)+','+centre.lon.toFixed(6),'Open navigation to this area');
  doc.addPage();title('Pickup selection and access details');
  for(const l of text.split('\n')){if(/^https:\/\//.test(l))link(l,'Open location');else line(l);}
  for(const r of rows){
   doc.addPage();title(r.key+' · location detail');
   line(r.items.map(i=>i.n+' x '+i.type).join('; '));
   const map=r.map,pts=[...map.points,...map.parts.flatMap(p=>p.poly)];
   if(pts.length){
    const xs=pts.map(p=>(p[0]+25)*3840/50),ys=pts.map(p=>(p[1]+25)*3840/50),pad=200;
    const x=Math.max(0,Math.min(...xs)-pad),z=Math.max(0,Math.min(...ys)-pad),right=Math.min(3840,Math.max(...xs)+pad),bottom=Math.min(3840,Math.max(...ys)+pad);
    if(right>x&&bottom>z){const cv=document.createElement('canvas');cv.width=Math.ceil(right-x);cv.height=Math.ceil(bottom-z);cv.getContext('2d').drawImage(bitmap,x,z,right-x,bottom-z,0,0,cv.width,cv.height);const scale=Math.min(182/cv.width,170/cv.height),w=cv.width*scale,h=cv.height*scale;doc.addImage(cv.toDataURL('image/png'),'PNG',14,y,w,h,'ref1211-'+r.key,'FAST');y+=h+7;cv.width=cv.height=1;}
   }
   line('Detail cropped from the north-up area map. Reference footprint shown; exact per-unit placement is not established.');
   for(const h of r.hold)line('HOLD: '+h);
   for(const it of r.items){line(it.n+' x '+it.type);for(const u of it.units)line('Asset '+u.number+' · '+u.company);if(it.unidentified)line(it.unidentified+' without individual asset IDs - identity/owner to confirm.');}
  }
  bitmap.close();const pages=doc.getNumberOfPages();
  for(let n=1;n<=pages;n++){doc.setPage(n);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(70,85,95);doc.text('Author: Andrew Fisher · Pickup selection · '+n+' / '+pages,14,276);}
  return doc.output('blob');
 }
 W.MapDemobPdf1211=Object.freeze({make});
})(window);
