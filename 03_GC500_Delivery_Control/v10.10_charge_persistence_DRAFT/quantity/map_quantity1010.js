/* Author: Andrew Fisher. Compact quantity text with each description kept separate. */
function quantity1010View(input,state,available){
 const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const items=available&&input&&Array.isArray(input.items)?input.items.filter(r=>r&&typeof r.item==='string'&&r.item.trim()).map(r=>({
  item:r.item.trim(),quantity:valid(r.quantity)?r.quantity:null,
  completed:valid(r.completed)&&valid(r.quantity)&&r.completed<=r.quantity?r.completed:null,
  installed:valid(r.installed)&&valid(r.quantity)&&r.installed<=r.quantity?r.installed:null
 })):[];
 if(!items.length)return {summary:available?'Qty to confirm':'',lines:available?['Qty to confirm']:[],all:[],items:[]};
 const words=r=>r.quantity==null?r.item+' · Qty to confirm':state==='partial'&&r.installed!=null?r.item+' · '+r.installed+'/'+r.quantity+' installed':r.quantity+' × '+r.item;
 const all=items.map(words);
 if(items.length===1){const r=items[0],summary=r.quantity==null?'Qty to confirm':state==='complete'&&r.quantity>0&&r.completed===r.quantity?r.completed+'/'+r.quantity:
  state==='partial'&&r.installed!=null?r.installed+'/'+r.quantity+' installed':'Qty '+r.quantity;
  return {summary,lines:[summary],all,items};}
 return {summary:'',lines:all.slice(0,2).concat(items.length>2?'+'+(items.length-2)+(items.length===3?' item type':' item types'):[]),all,items};
}
function quantity1010Html(status){
 const q=status.quantity1010;if(!q)return esc(status.label);
 return '<span class="map1010-words"><span>'+esc(status.label+(q.summary?' · '+q.summary:''))+'</span>'+(!q.summary&&q.lines.length?'<small>'+q.lines.map(esc).join('<br>')+'</small>':'')+'</span>';
}
function quantity1010Card(it){
 const status=mapStatus1009(it),q=status&&status.quantity1010;
 if(!q||q.items.length<3)return '';
 return '<details class="map1010-quantities"><summary>Quantities · '+q.items.length+' item types</summary><ul>'+q.all.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul></details>';
}
function referenceQuantity1010(it,status){
 const code=String(it&&it.code||''),items=status&&status.quantity1010&&status.quantity1010.items;
 return items&&items.length&&items.every(r=>typeof r.quantity==='number'&&Number.isFinite(r.quantity)&&r.quantity>=0)?code+' ('+items.map(r=>r.quantity).join(' + ')+')':code;
}
function fitReference1010(it,status,maxWidth,measure){
 const full=referenceQuantity1010(it,status);if(measure(full)<=maxWidth)return full;
 const items=status&&status.quantity1010&&status.quantity1010.items;
 if(items&&items.length>1&&items.every(r=>r.quantity!=null)){
  for(let n=items.length-1;n>0;n--){const text=it.code+' ('+items.slice(0,n).map(r=>r.quantity).join(' + ')+' + …)';if(measure(text)<=maxWidth)return text;}
 }
 return String(it&&it.code||'');
}
let labelBounds1010=[];
function labelHit1010(x,y){
 for(let i=labelBounds1010.length-1;i>=0;i--){const b=labelBounds1010[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return {it:b.it,c:b.it.cat.c};}
 return null;
}
