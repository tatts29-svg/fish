/* Author: Andrew Fisher. A read-only picture of the selected servicing night.
   SvcState remains the only task/completion rule. No record or message is written here. */
var SvcShare1164 = (function () {
'use strict';
var active = null;
function stamp(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'Time unavailable';
  return new Date(ms + 10 * 3600000).toISOString().slice(0,16).replace('T',' ') + ' AEST';
}
function pinUrl(pin) {
  return Array.isArray(pin) && pin.length === 2 && pin.every(Number.isFinite) && Math.abs(pin[0]) <= 90 && Math.abs(pin[1]) <= 180
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(pin.join(',')) : '';
}
function snapshot(M, G, target) {
  var S = M.S || SvcState, D = M.D, day = M.day || S.autoDay(D,M.now), d = S.dayOf(D,day);
  if (!d) throw new Error('Choose a servicing night first.');
  var st = S.jobStates(M.events || [],M.now), refs = [], title = '', total = 0, done = 0;
  D.areas.forEach(function(a) {
    var area = (String(a.n) === '0' ? '' : 'Area ' + a.n + ' · ') + a.name;
    a.refs.forEach(function(r) {
      if (!(target.kind === 'area' ? String(a.n) === String(target.id) : r.ref === target.id)) return;
      title = target.kind === 'area' ? area : r.ref;
      var g = G && G.refs && G.refs[r.ref], rows = [], points = [], nav = [], missing = false;
      r.lines.forEach(function(l) {
        var gl = g && g.lines && g.lines[l.id], p = gl && gl.point, tasks = [];
        S.tasksFor(D,l,day).forEach(function(t) {
          var s = st[S.jobKey(l.id,t,day)];
          total += l.qty;
          if (s && !s.local) done += l.qty;
          else tasks.push({label:D.tasks[t] || t, pending:!!s, optional:S.isExtra(D,t)});
        });
        if (!tasks.length) return;
        rows.push({label:gl && gl.label || l.label || l.kind, qty:l.qty, tasks:tasks});
        if (p && G && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= G.rect[0] && p.x <= G.rect[2] && p.y >= G.rect[1] && p.y <= G.rect[3]) {
          if (!points.some(function(q){return q.x === p.x && q.y === p.y;})) points.push({x:p.x,y:p.y});
        } else missing = true;
        var pin = gl && gl.pin || g && g.pin, url = pinUrl(pin);
        if (url && !nav.some(function(n){return n.url === url;})) nav.push({label:gl && gl.label || l.label || r.ref,url:url,coordinates:pin.join(', ')});
      });
      refs.push({ref:r.ref,area:area,title:g && g.title || r.ref,rows:rows,points:points,nav:nav,missing:missing});
    });
  });
  if (!refs.length) throw new Error('That location is no longer in this tracker.');
  return {kind:target.kind,title:title,day:day,night:d.label + (d.to ? ' → ' + d.to : '') + ' · ' + day,
    prepared:stamp(M.now),verified:stamp(M.lastRead),stale:!!M.readStatus,
    test:!!M.test1164 || !!d.practice,total:total,done:done,refs:refs,
    outstanding:refs.filter(function(r){return r.rows.length;})};
}
function taskText(t) { return t.label + (t.optional ? ' (optional)' : '') + (t.pending ? ' — waiting to save' : ''); }
function shareText(s) {
  var out = ['GC500 · ' + s.title, (s.test ? 'TEST / PRACTICE · ' : '') + 'Servicing night: ' + s.night,
    'Saved progress verified: ' + s.verified];
  if (s.stale) out.push('Last verified progress only — refresh unavailable.');
  if (!s.outstanding.length) out.push('No unfinished jobs recorded for this selection.');
  s.outstanding.forEach(function(r) {
    out.push('',r.ref + ' · ' + r.title, r.area);
    r.rows.forEach(function(l){out.push(l.label + ' · Qty ' + l.qty + ': ' + l.tasks.map(taskText).join('; '));});
    if (r.missing) out.push('Some equipment is outside the drawing or has no recorded map position.');
    r.nav.forEach(function(n){out.push('Directions · ' + n.label + ': ' + n.url);});
    if (!r.nav.length) out.push('Navigation pin not recorded.');
  });
  out.push('Use approved event access routes.','Snapshot prepared: ' + s.prepared,'Author: Andrew Fisher');
  return out.join('\n');
}
function cropFor(points, rect, width, height) {
  var p = points.map(function(q){return {x:(q.x-rect[0])/(rect[2]-rect[0])*width,y:(q.y-rect[1])/(rect[3]-rect[1])*height,ref:q.ref};});
  if (!p.length) return {x:0,y:0,w:width,h:height,points:p};
  var xs=p.map(function(q){return q.x;}),ys=p.map(function(q){return q.y;}),loX=Math.min.apply(null,xs),hiX=Math.max.apply(null,xs),loY=Math.min.apply(null,ys),hiY=Math.max.apply(null,ys);
  var w=Math.max(width*.17,(hiX-loX)*1.4+width*.08),h=Math.max(height*.22,(hiY-loY)*1.4+height*.08),ratio=1000/600;
  w=Math.max(w,h*ratio);h=w/ratio;
  w=Math.min(width,w);h=Math.min(height,h);
  return {x:Math.max(0,Math.min(width-w,(loX+hiX)/2-w/2)),y:Math.max(0,Math.min(height-h,(loY+hiY)/2-h/2)),w:w,h:h,points:p};
}
function imageReady(G, I) {
  if (I && I.detailImage && I.detailImage.complete && I.detailImage.naturalWidth) return Promise.resolve(I.detailImage);
  return new Promise(function(resolve,reject){
    var img = new Image(), timer = setTimeout(function(){img.src='';reject(new Error('The map picture did not load. Try again.'));},12000);
    img.onload=function(){clearTimeout(timer);resolve(img);};
    img.onerror=function(){clearTimeout(timer);reject(new Error('The map picture could not load. Try again.'));};
    img.src=G.detailImage || G.image;
  });
}
async function picture(s, G, I) {
  var img=await imageReady(G,I), canvas=document.createElement('canvas'), c=canvas.getContext('2d'), width=1080, blocks=[], y=38;
  function text(value,size,color,bold,space) {
    c.font=(bold?'700 ':'')+size+'px Arial';
    var words=String(value).split(/\s+/), line='';
    words.forEach(function(word){
      // Split long unbroken reference/location strings too; never clip saved wording.
      var chunks=[];while(c.measureText(word).width>1000){var n=word.length;while(n>1&&c.measureText(word.slice(0,n)).width>1000)n--;chunks.push(word.slice(0,n));word=word.slice(n);}chunks.push(word);
      chunks.forEach(function(part){if(line&&c.measureText(line+' '+part).width>1000){blocks.push({text:line,x:40,y:y,size:size,color:color,bold:bold});y+=size*1.3;line='';}line+=(line?' ':'')+part;});
    });
    if(line){blocks.push({text:line,x:40,y:y,size:size,color:color,bold:bold});y+=size*1.3;}
    y+=space || 0;
  }
  text('GC500 · '+s.title,38,'#14242b',true,6);
  if(s.test)text('TEST / PRACTICE',28,'#9d3a00',true,5);
  text('Servicing night: '+s.night,26,'#344750',true,3);
  text('Saved progress verified: '+s.verified,24,'#455965',false,4);
  if(s.stale)text('LAST VERIFIED PROGRESS ONLY — refresh unavailable',26,'#9d3a00',true,6);
  text('Where on site',25,'#14242b',true,4);
  var overviewY=y,overviewH=1000*img.naturalHeight/img.naturalWidth; y+=overviewH+24;
  text('Closer view · marked references match the jobs below',25,'#14242b',true,4);
  var mapY=y; y+=630;
  text(s.outstanding.length ? 'Still to do · '+s.outstanding.length+' location'+(s.outstanding.length===1?'':'s') : 'No unfinished jobs recorded for this selection.',32,'#14242b',true,12);
  s.outstanding.forEach(function(r){
    text(r.ref+(r.title!==r.ref?' · '+r.title:''),32,'#14242b',true,2);
    if(s.kind!=='area')text(r.area,25,'#455965',false,4);
    r.rows.forEach(function(l){text(l.label+' · Qty '+l.qty,27,'#14242b',true,1);text(l.tasks.map(taskText).join(' · '),27,'#8a3900',false,10);});
    if(r.missing)text('Some equipment is outside this drawing / location not recorded.',24,'#8a3900',false,3);
    r.nav.forEach(function(n){text('Navigation pin: '+n.coordinates,23,'#455965',false,1);});
    if(!r.nav.length)text('Navigation pin not recorded.',24,'#455965',false,3);
    y+=16;
  });
  text('Directions links accompany the shared picture. Use approved event access routes.',24,'#455965',false,6);
  text('Snapshot prepared: '+s.prepared+' · Author: Andrew Fisher',22,'#455965',false,0);
  if(y>16000)throw new Error('This area has too much detail for one picture. Share one reference at a time.');
  canvas.width=width;canvas.height=Math.ceil(y+28);c.fillStyle='#fff';c.fillRect(0,0,width,canvas.height);c.textBaseline='top';
  blocks.forEach(function(b){c.font=(b.bold?'700 ':'')+b.size+'px Arial';c.fillStyle=b.color;c.fillText(b.text,b.x,b.y);});
  var points=[];s.outstanding.forEach(function(r){r.points.forEach(function(p){points.push({x:p.x,y:p.y,ref:r.ref});});});
  var crop=cropFor(points,G.rect,img.naturalWidth,img.naturalHeight);
  var scale=1000/img.naturalWidth,ow=1000,oh=overviewH,ox=40;
  c.drawImage(img,ox,overviewY,ow,oh);
  c.strokeStyle='#de491c';c.lineWidth=4;c.strokeRect(ox+crop.x*scale,overviewY+crop.y*scale,crop.w*scale,crop.h*scale);
  var closeScale=Math.min(1000/crop.w,600/crop.h),dw=crop.w*closeScale,dh=crop.h*closeScale,dx=40+(1000-dw)/2,dy=mapY+(600-dh)/2;
  c.fillStyle='#eef2f3';c.fillRect(40,mapY,1000,600);c.drawImage(img,crop.x,crop.y,crop.w,crop.h,dx,dy,dw,dh);
  c.strokeStyle='#c1cdd2';c.lineWidth=2;c.strokeRect(40,mapY,1000,600);
  crop.points.forEach(function(p,i){
    var x=dx+(p.x-crop.x)*closeScale,py=dy+(p.y-crop.y)*closeScale;
    c.beginPath();c.arc(x,py,12,0,Math.PI*2);c.fillStyle='#de491c';c.fill();c.lineWidth=3;c.strokeStyle='#fff';c.stroke();
    c.font='700 24px Arial';var label=p.ref,w=c.measureText(label).width+16,lx=Math.max(44,Math.min(1036-w,x+17)),ly=Math.max(mapY+4,Math.min(mapY+565,py+(i%2?-34:10)));
    c.fillStyle='#14242b';c.fillRect(lx,ly,w,32);c.fillStyle='#fff';c.fillText(label,lx+8,ly+3);
  });
  if(!points.length){c.fillStyle='#14242b';c.fillRect(55,mapY+15,970,45);c.fillStyle='#fff';c.font='25px Arial';c.fillText(s.outstanding.length?'No recorded position on this drawing — see location details.':'No unfinished locations to highlight.',70,mapY+25);}
  return new Promise(function(resolve,reject){canvas.toBlob(function(b){canvas.width=1;canvas.height=1;b?resolve(b):reject(new Error('Could not prepare the picture. Try again.'));},'image/png');});
}
function close(I) {
  if(!active || I && active.I!==I)return;
  var a=active;active=null;a.serial++;if(a.url)URL.revokeObjectURL(a.url);a.dialog.close();a.dialog.remove();
  if(a.focus&&a.focus.isConnected)a.focus.focus({preventScroll:true});
}
function context(I) {
  if(active && active.I===I && (I.dead || !I.M || active.context!==I.M.context1164 || active.day!==(I.M.day||(I.M.S||SvcState).autoDay(I.M.D,I.M.now))))close(I);
}
function element(tag,text,attrs) {var e=document.createElement(tag);if(text)e.textContent=text;Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,attrs[k]);});return e;}
function open(I,target) {
  if(!I.M||I.dead)return;close();
  var dialog=element('dialog','',{'class':'svc-share1164','aria-labelledby':'svc-share1164-title','data-ro':''}), head=element('div','',{'class':'svc-share1164-head'});
  var title=element('h3','Map + unfinished jobs',{id:'svc-share1164-title'}), cancel=element('button','Close',{type:'button','data-ro':''}), status=element('p','Preparing picture…',{role:'status'});
  var preview=element('img','',{alt:'Map location and unfinished servicing jobs'}), actions=element('div','',{'class':'svc-share1164-actions'}), nav=element('details','',{'class':'svc-share1164-nav'});
  head.append(title,cancel);dialog.append(head,status,actions,nav,preview);document.body.appendChild(dialog);
  var a={I:I,dialog:dialog,context:I.M.context1164,day:I.M.day||(I.M.S||SvcState).autoDay(I.M.D,I.M.now),focus:document.activeElement,serial:0,url:null,file:null,s:null};active=a;
  function button(label,fn){var b=element('button',label,{type:'button','data-ro':''});b.onclick=fn;actions.appendChild(b);return b;}
  function save(){if(!a.file)return;var link=element('a','',{href:a.url,download:a.file.name,'data-ro':''});dialog.appendChild(link);link.click();link.remove();status.textContent='Picture download requested. Share it from your saved files; copy the directions below as well.';}
  var share=button('Share picture',async function(){
    if(!a.file)return;
    if(!navigator.share || !navigator.canShare || !navigator.canShare({files:[a.file]})){save();return;}
    share.disabled=true;
    try{await navigator.share({title:'GC500 · '+a.s.title,text:shareText(a.s),files:[a.file]});status.textContent='Share menu closed. Delivery is handled by the app you chose.';}
    catch(e){status.textContent=e&&e.name==='AbortError'?'Sharing cancelled. Your picture is ready.':'Sharing was not available. Use Save picture and Copy jobs + directions.';}
    finally{if(active===a)share.disabled=false;}
  });
  var download=button('Save picture',save), copy=button('Copy jobs + directions',async function(){
    if(!a.s)return;try{await navigator.clipboard.writeText(shareText(a.s));status.textContent='Jobs and directions copied.';}catch(e){var box=nav.querySelector('textarea');if(!box){box=element('textarea','',{'aria-label':'Jobs and directions to copy',readonly:''});nav.appendChild(box);}nav.open=true;box.value=shareText(a.s);box.focus();box.select();status.textContent='Select and copy the jobs and directions below.';}
  }), refresh=button('Refresh picture',prepare);
  cancel.onclick=function(){close(I);};dialog.addEventListener('cancel',function(e){e.preventDefault();close(I);});dialog.showModal();cancel.focus();
  async function prepare(){
    var seq=++a.serial;[share,download,copy,refresh].forEach(function(b){b.disabled=true;});status.textContent='Refreshing progress and preparing picture…';preview.hidden=true;nav.textContent='';
    a.file=null;a.s=null;if(a.url){URL.revokeObjectURL(a.url);a.url=null;}preview.removeAttribute('src');
    var readFailed=false;
    try{
      if(I.M.refresh)try{await I.M.refresh();}catch(e){readFailed=true;}
      context(I);if(active!==a||seq!==a.serial)return;
      var s=snapshot(I.M,I.G,target);if(readFailed)s.stale=true;
      var blob=await picture(s,I.G,I);if(active!==a||seq!==a.serial)return;
      a.s=s;a.file=new File([blob],'GC500-'+target.kind+'-'+String(target.id).replace(/[^a-z0-9_-]/gi,'-')+'-'+s.day+'.png',{type:'image/png'});a.url=URL.createObjectURL(blob);preview.src=a.url;preview.hidden=false;
      title.textContent=s.title+' · map + jobs';status.textContent=(s.stale?'Last verified progress only. ':'')+'Saved progress verified '+s.verified+'. Choose where to share.';
      var canFiles=false;try{canFiles=!!navigator.share&&!!navigator.canShare&&navigator.canShare({files:[a.file]});}catch(e){}
      share.hidden=!canFiles;
      nav.appendChild(element('summary','Open directions',{'data-ro':''}));
      s.outstanding.forEach(function(r){r.nav.forEach(function(n){nav.appendChild(element('a','Directions · '+r.ref+' · '+n.label,{href:n.url,target:'_blank',rel:'noopener noreferrer','data-ro':''}));});});
      nav.appendChild(element('p','Directions links are included in the shared text. If your messaging app keeps only the picture, use Copy jobs + directions. Use approved event access routes.'));
      [share,download,copy].forEach(function(b){b.disabled=false;});
    }catch(e){if(active===a)status.textContent=e.message||'Could not prepare the picture. Try again.';}
    finally{if(active===a&&seq===a.serial)refresh.disabled=false;}
  }
  prepare();
}
return {snapshot:snapshot,shareText:shareText,cropFor:cropFor,picture:picture,open:open,close:close,context:context};
})();
