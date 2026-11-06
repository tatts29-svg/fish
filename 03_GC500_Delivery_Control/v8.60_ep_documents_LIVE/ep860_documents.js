/* Author: Andrew Fisher. Supplier PDFs and email drafts. No automatic email or record writes. */
const EP860={job:0,urls:[],opener:null,file:null};
function epText860(s){return String(s==null?'':s).replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/×/g,'x').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');}
function epClose860(){
 EP860.job++;document.getElementById('ep860-dialog')?.remove();EP860.file=null;
 const urls=EP860.urls.splice(0);setTimeout(()=>urls.forEach(u=>URL.revokeObjectURL(u)),120000);
 const o=EP860.opener;EP860.opener=null;if(o?.isConnected)o.focus({preventScroll:true});
}
function epFile860(blob,name,pages,subject,text){const file=new File([blob],name,{type:'application/pdf',lastModified:Date.now()}),url=URL.createObjectURL(file);EP860.urls.push(url);return{blob,file,url,name,pages,subject,text,size:blob.size};}
async function epLoadPdf860(n,alive){
 const load=EP819.loads.find(l=>l.n===Number(n));if(!load)throw new Error('That load is no longer in the delivery plan.');
 const [lib,css]=await Promise.all([pdf7Lib(),pdf7FontCss(),pdf7Sync()]);if(!alive())return null;
 const wrap=document.createElement('div');wrap.className='ep860-capture';wrap.setAttribute('aria-hidden','true');wrap.innerHTML=epRunSheet819(load);document.body.appendChild(wrap);
 try{await document.fonts.ready;await pdf7Imgs(wrap);const failed=epFit819(wrap);if(failed.length)throw new Error('This load does not fit one A4 sheet. Use the print preview and check its content.');
 const sheet=wrap.querySelector('.rs819');sheet.style.zoom='1';const shot=await pdf7Shot(lib,sheet,css,{ratio:2.5,fmt:'PNG',q:1,qMin:1,maxBytes:4*1048576,vectorQr:true});const encoded=await shot.enc;if(!alive())return null;shot.bytes=encoded.bytes;
 const subject='GC500 - Event Portables - Load '+load.n+' - '+epDay819(load.date,false),doc=pdf7Doc(lib,subject);pdf7Put(doc,shot,true,8);
 return epFile860(doc.output('blob'),'GC500_Event_Portables_Load-'+load.n+'_'+load.date+'.pdf',1,subject,'Hi team,\n\nAttached is the Event Portables run sheet for load '+load.n+' on '+epDay819(load.date)+'. It includes the drop-off references, stop order and location QR codes.\n\nPlease provide this sheet to the driver.\n\nCoates Industrial Solutions\nGC500 2026');
 }finally{wrap.remove();}
}
function epQrPdf860(doc,url,x,y,size){
 if(!url)return;const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),m=4,u=size/(n+2*m);doc.setFillColor(255,255,255);doc.rect(x,y,size,size,'F');doc.setFillColor(0,0,0);
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))doc.rect(x+(c+m)*u,y+(r+m)*u,u+.01,u+.01,'F');doc.link(x,y,size,size,{url});
}
function epInventoryGroups860(model){
 const out=new Map();for(const r of model.rows){const key=JSON.stringify([r.ref,r.description,r.location,r.status,r.url,r.locationBasis,r.warning]);let g=out.get(key);if(!g){g={...r,numbers:[],qty:r.qty==null?null:0};out.set(key,g);}if(r.assetNo&&!g.numbers.includes(r.assetNo))g.numbers.push(r.assetNo);if(r.qty!=null)g.qty=(g.qty||0)+Number(r.qty);}
 return [...out.values()].map(r=>({...r,assetNo:r.numbers.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).join(', ')||'Not recorded'}));
}
async function epInventoryPdf860(alive){
 await pdf7Sync();const model=holdAssets(epInventory860),rows=epInventoryGroups860(model),lib=await pdf7Lib();if(!alive())return null;
 const title='GC500 - Event Portables inventory',doc=new lib.jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});doc.setProperties({title,author:(DATA.brand||{}).author||'',creator:'GC500 Delivery Control'});
 const cols=[{label:'Reference',w:19},{label:'Asset numbers',w:70},{label:'Item / scope',w:37},{label:'Qty',w:11},{label:'Location',w:84},{label:'Status',w:35},{label:'Location QR',w:25}];let y=0,page=0;
 const head=()=>{page++;doc.setFillColor(255,106,19);doc.rect(8,8,281,2,'F');doc.setFont('helvetica','bold');doc.setFontSize(17);doc.setTextColor(20,26,29);doc.text(title,8,20);doc.setFontSize(9);doc.setFont('helvetica','normal');doc.text('As at '+epText860(fmtDate(model.asAt))+' | '+model.summary.numbered+' numbered units | '+model.summary.references+' references | '+model.summary.spares+' spare'+(model.summary.spares===1?'':'s'),8,27);doc.setFontSize(8);doc.text('Recorded unit locations. Supplier delivery plans are separate; an area or unconfirmed position is labelled below.',8,32);y=36;let x=8;doc.setFillColor(30,42,48);doc.rect(8,y,281,8,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(8);for(const c of cols){doc.text(c.label,x+2,y+5);x+=c.w;}y+=8;doc.setTextColor(20,26,29);};
 head();for(const r of rows){
 const where=[r.location,r.locationBasis,r.warning].filter(Boolean).map(epText860).join('\n');const vals=[r.ref||'Unallocated',r.assetNo,r.description||'',r.qty==null?'—':String(r.qty),where,r.status||'',r.url?'Scan for location':'No location QR'];doc.setFont('helvetica','normal');doc.setFontSize(8.4);
 const lines=vals.map((v,i)=>doc.splitTextToSize(epText860(v),cols[i].w-4)),h=Math.max(25,...lines.map(a=>a.length*3.8+5));if(h>142)throw new Error('An inventory entry is too long to print safely.');if(y+h>192){doc.addPage('a4','landscape');head();doc.setFont('helvetica','normal');doc.setFontSize(8.4);}
 let x=8;for(let i=0;i<cols.length;i++){doc.setDrawColor(174,184,189);doc.rect(x,y,cols[i].w,h);if(i===6&&r.url){epQrPdf860(doc,r.url,x+3,y+2,19);doc.setFontSize(6.5);doc.text('Scan location',x+2,y+24);doc.setFontSize(8.4);}else doc.text(lines[i],x+2,y+4.5);x+=cols[i].w;}y+=h;
 }
 if(!rows.length){doc.setFontSize(11);doc.text('No Event Portables units are identified in the shared record.',10,y+12);}
 const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setTextColor(70,80,85);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Author: '+epText860((DATA.brand||{}).author||'')+' | Event Portables | Location basis shown beside each QR',8,201);doc.text('Page '+p+' of '+pages,289,201,{align:'right'});}
 return epFile860(doc.output('blob'),'GC500_Event_Portables_Inventory_'+model.asAt+'.pdf',pages,title+' - '+model.asAt,'Hi team,\n\nAttached is the Event Portables inventory as at '+epDay819(model.asAt)+', showing recorded asset numbers, matched references and locations. Location QR codes and their position basis are included.\n\nCoates Industrial Solutions\nGC500 2026');
}
async function epDraft860(F,alive=()=>true){
 const base64=(await pdf7DataUrl(F.file)).split(',')[1],boundary='GC500_EP_'+Date.now();
 const encoded=await pdf7DataUrl(new Blob([F.text],{type:'text/plain;charset=utf-8'}));const wrap=s=>(s.match(/.{1,76}/g)||[]).join('\r\n');
 const body=['X-Unsent: 1','MIME-Version: 1.0','Subject: '+F.subject.replace(/[\r\n]/g,' '),'Content-Type: multipart/mixed; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(encoded.split(',')[1]),'--'+boundary,'Content-Type: application/pdf; name="'+F.name+'"','Content-Disposition: attachment; filename="'+F.name+'"','Content-Transfer-Encoding: base64','',wrap(base64),'--'+boundary+'--',''].join('\r\n');
 if(!alive())return null;const url=URL.createObjectURL(new Blob([body],{type:'message/rfc822'}));EP860.urls.push(url);return {url,name:F.name.replace(/\.pdf$/,'.eml')};
}
async function epDocuments860(kind,n,opener){
 epClose860();pdf7Close();if(epOpen819())ep819Close();const job=EP860.job;EP860.opener=opener?.isConnected?opener:document.activeElement;
 const box=document.createElement('div');box.id='ep860-dialog';box.className='pdf7';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','ep860-title');
 box.innerHTML='<div class="pdf7-card"><div class="pdf7-hd"><div><span class="pdf7-k">Event Portables</span><h2 id="ep860-title">'+(kind==='inventory'?'Inventory print':'Run sheet - Load '+Number(n))+'</h2></div><button class="pdf7-x" data-ep860-close aria-label="Close">×</button></div><p class="pdf7-say" role="status">Preparing the PDF…</p><div class="pdf7-acts"></div><p class="pdf7-tip"></p></div>';document.body.appendChild(box);box.querySelector('[data-ep860-close]').focus();
 const alive=()=>job===EP860.job&&box.isConnected,note=t=>{if(alive())box.querySelector('.pdf7-say').textContent=t;};box.querySelector('[data-ep860-close]').onclick=epClose860;
 box.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();epClose860();}if(e.key==='Tab'){const all=[...box.querySelectorAll('button,a[href]')].filter(b=>!b.disabled),i=all.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();all.at(-1).focus();}else if(!e.shiftKey&&(i<0||i===all.length-1)){e.preventDefault();all[0].focus();}}});
 try{const F=await(kind==='inventory'?epInventoryPdf860(alive):epLoadPdf860(n,alive));if(!F||!alive())return;EP860.file=F;const draft=await epDraft860(F,alive);if(!draft||!alive())return;
 note(F.pages+' A4 page'+(F.pages===1?'':'s')+' · '+pdf7Size(F.size));const can=pdf7CanShare([F.file]),acts=box.querySelector('.pdf7-acts');acts.innerHTML='<a class="pdf7-btn pdf7-pri" href="'+F.url+'" target="_blank" rel="noopener"'+(pdf7Android()?' download="'+F.name+'"':'')+'>Open / Print PDF</a><button class="pdf7-btn" data-ep860-share>Email with PDF</button><a class="pdf7-btn" href="'+F.url+'" download="'+F.name+'">Save PDF</a><a class="pdf7-btn" href="'+draft.url+'" download="'+draft.name+'">Download email draft</a>';
 box.querySelector('.pdf7-tip').textContent='Choose the recipient in your email app. The email draft includes the PDF attachment. Nothing is sent automatically.';
 acts.querySelector('[data-ep860-share]').onclick=()=>{if(can){navigator.share({files:[F.file],title:F.subject,text:F.text}).then(()=>note('Opened the share sheet. Complete the email in your chosen app.'),e=>note(e?.name==='AbortError'?'Email cancelled. The PDF is still ready.':'Sharing did not open. Use Download email draft, or Save PDF and attach it.'));}else{const a=acts.querySelector('a[download="'+draft.name+'"]');a.click();note('Email draft downloaded with the PDF attached. Open it in your email app, choose recipients and send when ready.');}};
 }catch(e){note('Could not prepare the PDF: '+String(e?.message||e)+'. Close and try again.');}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ep860-email],[data-ep860-inventory]');if(!b)return;e.preventDefault();epDocuments860(b.hasAttribute('data-ep860-inventory')?'inventory':'load',b.dataset.ep860Email,b);});
