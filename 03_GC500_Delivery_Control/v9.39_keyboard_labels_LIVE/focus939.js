/* Author: Andrew Fisher. Native tab order, including expandable summaries. */
function tabStops939(n){
 const selector='a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,audio[controls],video[controls],[contenteditable],[tabindex]';
 const stops=[...n.querySelectorAll(selector)].filter(b=>{
  if(b.disabled||b.matches(':disabled')||b.hidden||b.closest('[hidden],[inert]')||!b.getClientRects().length)return false;
  // Closed details may retain layout boxes; only their first summary is keyboard reachable.
  for(let d=b.parentElement?.closest('details:not([open])');d;d=d.parentElement?.closest('details:not([open])')){const summary=[...d.children].find(x=>x.tagName==='SUMMARY');if(!summary?.contains(b))return false;}
  const style=getComputedStyle(b);if(style.visibility==='hidden'||style.visibility==='collapse')return false;
  return b.tabIndex>=0||(b.isContentEditable&&!b.hasAttribute('tabindex'));
 });
 // A named radio group has one tab stop. Keep its checked member, or the first available member.
 const filtered=stops.filter(b=>{if(b.tagName!=='INPUT'||b.type!=='radio'||!b.name)return true;const group=stops.filter(x=>x.tagName==='INPUT'&&x.type==='radio'&&x.name===b.name&&x.form===b.form);return b===(group.find(x=>x.checked)||group[0]);});
 return filtered.sort((a,b)=>{const x=a.tabIndex>0?a.tabIndex:Infinity,y=b.tabIndex>0?b.tabIndex:Infinity;return x===y?0:x-y;});
}
function tabKey939(e,n){
 const f=tabStops939(n);if(!f.length)return;
 // Older drawers have their own incomplete lists; only one trap should handle this Tab.
 // The browser still performs ordinary interior Tab movement because it is not prevented.
 e.stopImmediatePropagation();
 const active=document.activeElement,i=f.indexOf(active),outside=!n.contains(active);
 if(outside||e.shiftKey&&i===0||!e.shiftKey&&i===f.length-1){
  e.preventDefault();(e.shiftKey?f.at(-1):f[0]).focus();
 }
}
