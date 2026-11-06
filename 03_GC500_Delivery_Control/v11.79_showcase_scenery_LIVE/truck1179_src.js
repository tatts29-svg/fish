/* Author: Andrew Fisher. Decorative fencing carrier in the existing vehicle system. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.fencingTruck1179)return;
G.fencingTruck1179={version:1179,author:'Andrew Fisher',illustrative:true,newTextures:0};
G.PLANT.fencing_truck={label:'Advanced Fencing truck',speed:.62,grip:.68,note:.55};
const previous=G.plantModel;
const models=()=>G._fencingTrucks1179||(G._fencingTrucks1179=Object.create(null));
G.plantModel=function(kind,quality){
 if(kind!=='fencing_truck')return previous.apply(this,arguments);
 const level=quality==='balanced'?'balanced':'high',cache=models();if(cache[level])return cache[level];
 const K=G.plantKit(level),{group,box,rbox,quad,bar,tube,wheel,guard}=K;
 const white=group('cab panels','plantWhite'),dark=group('chassis and trim','plantBlack'),steel=group('tray and fence frames','steel'),
  blue=group('carrier blue','plantBlack',{color:[.025,.075,.24]}),glass=group('cab glazing','glass'),
  lamps=group('headlamps','lampWhite'),tail=group('tail lamps','lampRed'),amber=group('side reflectors','hivisPanel'),
  straps=group('secured load straps','plant',{color:[.90,.19,.018]});
 // One steering axle; tandem rear axles. Geometry is illustrative, never a fleet specification.
 for(const z of [-.25,.25])box(dark,-1.54,1.15,.22,.34,z-.035,z+.035);
 for(const x of [-1.33,-.83,-.23,.42,1.02])box(steel,x-.025,x+.025,.25,.32,-.36,.36);
 box(steel,-1.63,.35,.36,.43,-.48,.48);
 for(const z of [-.47,.47])box(steel,-1.63,.35,.43,.49,z-.012,z+.012);
 box(steel,-1.64,-1.60,.36,.49,-.48,.48);
 // Rounded cab lower panels, visible pillars, split windscreen and dark interior.
 rbox(white,.81,.58,0,.49,.22,.435,.25);
 box(dark,.36,1.25,.74,1.10,-.40,.40);
 rbox(white,.78,1.15,0,.46,.055,.445,.24);
 box(white,.33,.41,.73,1.15,-.435,.435);
 for(const z of [-.424,.424]){
  box(white,1.15,1.22,.73,1.14,z-.018,z+.018);
  box(white,.39,1.18,.72,.77,z-.016,z+.016);
  quad(glass,[.42,.78,z*1.025],[1.145,.78,z*1.025],[1.145,1.09,z*1.025],[.42,1.09,z*1.025],[0,0,Math.sign(z)]);
  box(blue,.42,1.14,.58,.72,z*1.03-.004,z*1.03+.004);
  box(dark,.48,.59,.70,.715,z*1.045-.008,z*1.045+.008);
  box(steel,.47,.80,.27,.32,z*1.10-.05,z*1.10+.05);
  box(dark,.46,.81,.32,.34,z*1.10-.048,z*1.10+.048);
  tube(steel,[1.04,.98,z],[1.06,.98,z*1.37],.009,8);
  rbox(dark,1.06,.97,z*1.38,.035,.085,.018,.2);
  box(amber,1.235,1.25,.52,.56,z*.82-.04,z*.82+.04);
 }
 for(const z of [-1,1])quad(glass,[1.225,.79,z*.018],[1.225,.79,z*.385],[1.225,1.09,z*.385],[1.225,1.09,z*.018],[1,0,0]);
 box(white,1.22,1.24,.77,1.13,-.012,.012);
 rbox(dark,1.282,.49,0,.018,.075,.31,.22);
 for(let j=0;j<4;j++)box(steel,1.299,1.307,.438+j*.031,.446+j*.031,-.28,.28);
 box(dark,1.22,1.33,.30,.37,-.445,.445);
 for(const z of [-.35,.35]){box(lamps,1.287,1.31,.405,.48,z-.065,z+.065);box(tail,-1.67,-1.64,.29,.35,z-.06,z+.06);}
 // Headboard, side pockets and stacked mesh panels restrained by two straps.
 for(const z of [-.44,.44])bar(steel,[.25,.43,z],[.25,1.23,z],.026,.026);
 for(const y of [.54,.91,1.21])bar(steel,[.25,y,-.44],[.25,y,.44],.026,.026);
 box(dark,-.31,.20,.27,.355,-.445,.445);
 for(const z of [-.35,-.19,.19,.35])box(steel,-1.47,-1.05,.445,.54,z-.055,z+.055);
 const mesh=group('fence wire','steel',{color:[.40,.43,.47]});
 for(const z of [-.26,-.13,0,.13,.26]){
  for(const x of [-1.45,.10])bar(steel,[x,.55,z],[x,1.12,z],.018,.018);
  for(const y of [.55,1.12])bar(steel,[-1.45,y,z],[.10,y,z],.018,.018);
  // Outer panels carry the visible wire; inner panels share the load silhouette.
  if(Math.abs(z)>.2){
   for(let i=1;i<16;i++){const x=-1.45+i*1.55/16;quad(mesh,[x-.002,.57,z],[x+.002,.57,z],[x+.002,1.10,z],[x-.002,1.10,z],[0,0,1]);}
   for(let i=1;i<6;i++){const y=.55+i*.57/6;quad(mesh,[-1.43,y-.002,z],[.08,y-.002,z],[.08,y+.002,z],[-1.43,y+.002,z],[0,0,1]);}
  }
 }
 for(const x of [-1.18,-.24]){
  for(const z of [-.285,.285])box(straps,x-.018,x+.018,.47,1.145,z-.005,z+.005);
  box(straps,x-.018,x+.018,1.135,1.145,-.29,.29);
  box(dark,x-.027,x+.027,.48,.55,.29,.31);
 }
 function roadWheel(x,z){
  const y=.205,R=.205,meta={wheel:{x,y,z,r:R}},tyre=group('road tyre','rubber',meta),rim=group('pressed rim','steel',meta),hub=group('wheel recess','plantBlack',meta),n=level==='high'?24:16,
   profile=[[.11,-.072],[.18,-.072],[.202,-.055],[.205,-.025],[.205,.025],[.202,.055],[.18,.072],[.11,.072]],base=tyre.vertices.length/8;
  for(let j=0;j<profile.length;j++){
   const [r,d]=profile[j],a=profile[Math.max(0,j-1)],b=profile[Math.min(profile.length-1,j+1)],dr=b[0]-a[0],dd=b[1]-a[1],l=Math.hypot(dr,dd)||1;
   for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,c=Math.cos(t),sn=Math.sin(t);tyre.vertices.push(x+r*c,y+r*sn,z+d,dd/l*c,dd/l*sn,-dr/l,i/n,j/(profile.length-1));}
  }
  for(let j=0;j+1<profile.length;j++)for(let i=0;i<n;i++){const a=base+j*(n+1)+i,b=a+n+1;tyre.indices.push(a,b+1,b,a,a+1,b+1);}
  tube(rim,[x,y,z-.063],[x,y,z+.063],.113,n);
  const sd=Math.sign(z),outer=z+sd*.068;
  tube(hub,[x,y,outer-sd*.004],[x,y,outer+sd*.006],.050,12);
  for(let i=0;i<6;i++){const t=i/6*Math.PI*2,c=Math.cos(t)*.077,sn=Math.sin(t)*.077;tube(rim,[x+c,y+sn,outer],[x+c,y+sn,outer+sd*.008],.008,6);}
 }
 for(const x of [-1.29,-.78,1.00])for(const z of [-.43,.43]){
  roadWheel(x,z);guard(dark,x,.205,z,.24,.17,.08,Math.PI-.08,.018);
 }
 for(const z of [-.44,.44]){box(dark,-1.57,-1.54,.10,.34,z-.075,z+.075);for(const x of [-1.55,-.55,.20])box(amber,x-.027,x+.027,.40,.425,z-.012,z+.012);}
 // Typeset lettering, not a reproduction of a supplier logo. No texture allocation.
 const font={A:['01110','10001','10001','11111','10001','10001','10001'],D:['11110','10001','10001','10001','10001','10001','11110'],V:['10001','10001','10001','10001','10001','01010','00100'],N:['10001','11001','10101','10101','10011','10001','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],I:['11111','00100','00100','00100','00100','00100','11111'],G:['01111','10000','10000','10111','10001','10001','01110']};
 const ink=group('Advanced Fencing lettering','plantWhite');
 function label(str,x0,x1,y0,y1,z,side){const px=Math.min((x1-x0)/(str.length*6-1),(y1-y0)/7),w=(str.length*6-1)*px,c=(x0+x1)/2;
  [...str].forEach((ch,i)=>{const rows=font[ch];if(!rows)return;rows.forEach((row,j)=>{for(let k=0;k<5;){if(row[k]!=='1'){k++;continue;}let e=k+1;while(e<5&&row[e]==='1')e++;const X=q=>c+side*(-w/2+(i*6+q)*px),a=X(k),b=X(e),top=y1-j*px;quad(ink,[a,top-px,z],[b,top-px,z],[b,top,z],[a,top,z],[0,0,side]);k=e;}});});}
 for(const sd of [-1,1]){label('ADVANCED',.43,1.12,.655,.710,sd*.442,sd);label('FENCING',.49,1.06,.588,.638,sd*.442,sd);}
 // Merge compatible solids but preserve independent wheel pivots and glass ordering.
 const merged=G.compactRaceCarParts1091(K.parts.map(p=>({...p,vertices:new Float32Array(p.vertices),indices:new Uint32Array(p.indices)})));
 const finished=G.finishModel(merged,level,'Advanced Fencing truck');
 const model={...finished,stats:{kind:'Advanced Fencing truck',quality:level,triangles:merged.reduce((n,p)=>n+p.indices.length/3,0),parts:merged.length,newTextures:0,geometryBuiltOnce:true,illustrative:true}};
 if(model.stats.triangles>20000)throw Error('Fencing truck exceeds its geometry budget');
 return cache[level]=model;
};
})();
