/* Author: Andrew Fisher. Readable correction notes; retained evidence and editing values stay verbatim. */
function correctionNote947(note){
 if(typeof note!=='string')return null;
 const marker='Original evidence retained exactly below:',at=note.indexOf(marker);
 if(at<0||(at>0&&note[at-1]!=='\n'))return null;
 const start=at+marker.length,lead=/^\s*/.exec(note.slice(start))[0].length,open=start+lead;
 if(!'{['.includes(note[open]||' ') )return null;
 const stack=[];let quoted=false,escaped=false,end=-1;
 for(let i=open;i<note.length;i++){
  const c=note[i];
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"'){quoted=true;continue;}
  if(c==='{'||c==='[')stack.push(c);
  else if(c==='}'||c===']'){
   if(stack.pop()!==(c==='}'?'{':'['))return null;
   if(!stack.length){end=i+1;break;}
  }
 }
 if(end<0)return null;
 const evidence=note.slice(start,end);
 try{JSON.parse(evidence);}catch(_){return null;}
 return {prefix:note.slice(0,at),marker,evidence,suffix:note.slice(end)};
}
function appendNote947(target,note){
 const parts=correctionNote947(note);
 const paragraph=text=>{const p=document.createElement('p');p.className='note816 note947-text';p.textContent=text;target.appendChild(p);};
 if(!parts){paragraph(note);return;}
 if(parts.prefix)paragraph(parts.prefix);
 const details=document.createElement('details');details.className='note947-original';
 const summary=document.createElement('summary');summary.textContent='Original correction evidence';
 const pre=document.createElement('pre');pre.textContent=parts.evidence;
 details.append(summary,pre);target.appendChild(details);
 if(parts.suffix)paragraph(parts.suffix);
}
if(typeof module!=='undefined'&&module.exports)module.exports={split:correctionNote947,append:appendNote947};
