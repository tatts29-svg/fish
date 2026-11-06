/* Author: Andrew Fisher. Only the five existing footprints moved by the revised iEDM Gate 6 layout.
   Source D001 tiles stay intact. Crossed grey outlines mark superseded unit positions; orange is the revision. */
function gate6Rows1021() {
 try {
  const host=window.parent;
  if(host&&host!==window&&typeof host.gc500Gate6Revision1021==='function')return host.gc500Gate6Revision1021();
 } catch (_) {}
 return GATE6_SNAPSHOT1021;
}
function gate6Projected1021(rows,M,width,height) {
 const project=p=>{const q=toGeo(p[0]*SHEET_W,p[1]*SHEET_H);const z=applyM(M,q.x,q.y);return [z.x,z.y];};
 return rows.map(row=>({ref:row.ref,centre:project(row.pt),polygons:row.polygons.map(p=>p.map(project))}))
  .filter(row=>row.polygons.some(poly=>Math.max(...poly.map(p=>p[0]))>=-80&&Math.max(...poly.map(p=>p[1]))>=-80&&Math.min(...poly.map(p=>p[0]))<=width+80&&Math.min(...poly.map(p=>p[1]))<=height+80));
}
function drawGate6Revision1021(g,M,pixelRatio=1) {
 const rows=gate6Projected1021(gate6Rows1021(),M,g.canvas.width,g.canvas.height);
 const old=gate6Projected1021(GATE6_OLD1021,M,g.canvas.width,g.canvas.height);
 const zoom=Math.hypot(M[0],M[1])/pixelRatio;
 if(!rows.length||zoom<1)return false;
 g.save();g.setTransform(1,0,0,1,0,0);
 const path=poly=>{g.beginPath();poly.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();};
 if(mode!=='satellite')for(const row of old)for(const poly of row.polygons){
  path(poly);g.fillStyle='rgba(240,240,240,.70)';g.fill();
  g.strokeStyle='#59636a';g.lineWidth=pixelRatio;g.setLineDash([3*pixelRatio,3*pixelRatio]);g.stroke();g.setLineDash([]);
  g.beginPath();g.moveTo(...poly[0]);g.lineTo(...poly[2]);g.moveTo(...poly[1]);g.lineTo(...poly[3]);g.stroke();
 }
 for(const row of rows)for(const poly of row.polygons){
  path(poly);g.strokeStyle='#1b1009';g.lineWidth=4*pixelRatio;g.stroke();
  g.strokeStyle='#ff9a4d';g.lineWidth=2*pixelRatio;g.stroke();g.fillStyle='rgba(255,130,31,.14)';g.fill();
 }
 // Reuse the map's labelled markers for selected references. Small labels identify other revised footprints.
 if(zoom>=3){g.font=`700 ${11*pixelRatio}px Inter,sans-serif`;g.textBaseline='bottom';
  for(const row of rows){if(marks.some(m=>m.it.code===row.ref))continue;
   const minY=Math.min(...row.polygons.flat().map(p=>p[1])),x=row.centre[0],y=minY-3*pixelRatio;
   g.textAlign='center';g.lineWidth=3*pixelRatio;g.strokeStyle='#17252d';g.strokeText(row.ref,x,y);g.fillStyle='#ffbd89';g.fillText(row.ref,x,y);
  }
 }
 g.restore();return true;
}
