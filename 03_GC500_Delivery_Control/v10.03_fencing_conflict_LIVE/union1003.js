 const union = (field, counter) => { const byId = new Map();
 // Compare meaning, not object-key order. Retain the established hash scheme for existing variants.
 const add = (x0, fromB) => {
  const base=String(x0.id).replace(/·[0-9a-f]{4}$/,''),x=Object.assign({},x0,{id:base}),signature=recordCanonical1003(x);
  const established=String(x0.id)===base+'·'+h4(J(x));
  const cur=byId.get(base)||[],same=cur.find(v=>v.signature===signature);
  if(same){same.held=same.held||!fromB;if((established&&!same.established)||(established===same.established&&J(x)<J(same.x))){same.x=x;same.established=established;}return;}
  cur.push({x,signature,fromB,held:!fromB,established});byId.set(base,cur);
 };
 (A[field]||[]).forEach(x=>add(x,false));(B[field]||[]).forEach(x=>add(x,true));out[field]=[];
 [...byId.keys()].sort().forEach(base=>{
  const vs=byId.get(base);
  if(vs.length===1){out[field].push(vs[0].x);if(vs[0].fromB)rep[counter]++;return;}
  vs.sort((p,q)=>J(p.x).localeCompare(J(q.x)));
  vs.forEach(v=>{out[field].push(Object.assign({},v.x,{id:base+'·'+h4(J(v.x))}));if(v.fromB)rep[counter]++;});
  // A retained disagreement is still available in the records. Reopening it is not a new conflict.
  if(!vs.every(v=>v.held))rep.clashes.push(`${base} is in both copies with different content — both kept, as ${vs.map(v=>base+'·'+h4(J(v.x))).join(' and ')}`);
 }); };
