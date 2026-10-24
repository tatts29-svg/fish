/* Author: Andrew Fisher. Static visual dressing on the existing schematic circuit.
 * Illustrative scenery bands; source walls, registered crossings and tree anchors remain fixed. */
(function(){
'use strict';const G=window.GC3D;if(!G||G.scenery1179)return;
G.scenery1179={version:1179,author:'Andrew Fisher',static:true,newDrawCalls:0,newTextures:0};
const ink=[.024,.029,.034,1],white=[.95,.96,.95,1],orange=[.93,.19,.024,1],red=[.70,.025,.055,1],blue=[.025,.30,.66,1],yellow=[.97,.66,.02,1];
G.sceneryStyle1179=function(s,L,side,index){
 const u=((s%L)+L)%L/L*490.1192415321561;
 if(u<11||u>=462)return {name:'Pizza Hut',paper:red,ink:white};
 if(u<43)return side>0?{name:'DUNLOP',paper:yellow,ink}:{name:'Century Batteries',paper:[.024,.055,.17,1],ink:white};
 if(u<71)return index%3?{name:'',paper:[.71,.72,.70,1],ink}:{name:'FIREBALL',paper:yellow,ink:red};
 if(u<103)return {name:'TITANIUM CARAVANS',paper:ink,ink:white};
 if(u<179)return {name:'Thrifty',paper:blue,ink:white};
 if(u<209)return {name:'TOYOTA GAZOO Racing',paper:ink,ink:white};
 if(u<231)return {name:'',paper:[.71,.72,.70,1],ink};
 if(u<276)return {name:side>0&&u>254?'EquipSuper':'Coates',paper:ink,ink:side>0&&u>254?white:orange};
 if(u<329)return index%4===0?{name:'WORKS ITS ARSE OFF',paper:orange,ink}:{name:'boostmobile',paper:ink,ink:white};
 if(u<419)return side<0?{name:'GOLDCOAST.',paper:red,ink:white}:{name:'Queensland',paper:[.025,.23,.56,1],ink:white};
 if(u<446)return {name:'TRAEGER',paper:[.45,.085,.035,1],ink:white};
 return {name:side<0?'XPRESS FLEET':'Queensland',paper:side<0?ink:red,ink:white};
};
G.sceneryBanners1179=function(S,k){for(const step of G.sceneryBannersSteps1179(S,k)){} };
G.sceneryBannersSteps1179=function*(S,k){
 const {loops,sampleLoop,panel,text,H,M,stats}=k,P=S.CL.p,cum=S.CL.cum;
 const nearest=p=>{let best=Infinity,along=0,side=0;
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;if(l2<1e-12)continue;
   const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2)),x=p[0]-a[0]-dx*t,z=p[1]-a[1]-dz*t,d=x*x+z*z;
   if(d<best){best=d;along=cum[i]+Math.sqrt(l2)*t;side=dx*z-dz*x;}}
  return {s:along,side:Math.sign(side)};
 };
 const report=S.scenery1179={version:1179,panels:0,labels:0,triangles:0,triangleBudget:60000,sourcePathsPreserved:true,labelsByName:{}};
 const begin=S.standDecor.i.length,step=12/M;
 for(const [li,[loop,sg,hgt]] of loops.entries()){const pts=sampleLoop(loop,sg,step);
  for(let i=0;i<pts.length;i++){
   if(G.due1157&&G.due1157())yield;
   const a=pts[i],b=pts[(i+1)%pts.length],dx=b.p[0]-a.p[0],dz=b.p[1]-a.p[1],len=Math.hypot(dx,dz);
   if(len<step*.88||len>step*1.12)continue;
   const t=[dx/len,dz/len],n=[-t[1]*sg,t[0]*sg],off=.45-.012/M,m=[(a.p[0]+b.p[0])/2+n[0]*off,(a.p[1]+b.p[1])/2+n[1]*off],q=nearest(m),style=G.sceneryStyle1179(q.s,S.CL.L,q.side,i),f=[-n[0],-n[1]],hb=hgt*.86,c=[m[0],H+hgt*.48,m[1]];
   const drawName=i%2===0&&(S.standDecor.i.length-begin)/3<report.triangleBudget-1200?style.name:'';
   const vertexStart=S.standDecor.nv,labelStart=S.photoLabels792.length,indexStart=S.standDecor.i.length;
   panel(c,f,len*.90,hb,style.paper,.004);
   text(c,f,drawName||' ',Math.min(hb*.70/7,len*.86/Math.max(1,drawName.length*6-1)),style.ink,.009);
   // Wall-facing quads need one outward face. Keep label ranges exact for the existing atlas path.
   const indices=S.standDecor.i,tail=indices.slice(indexStart);indices.length=indexStart;
   for(let j=0;j<tail.length;j+=12)indices.push(...tail.slice(j,j+6));
   S.photoLabels792[labelStart].indexStart=indexStart+6;S.photoLabels792[labelStart].indexEnd=indices.length;
   S.bannerRanges794.push({vertexStart,vertexEnd:S.standDecor.nv,labelStart,labelEnd:S.photoLabels792.length,loop:li,centre:m.slice(),tangent:t.slice(),outward:n.slice(),wallFace1179:true});
   report.panels++;stats.banners++;if(drawName){report.labels++;report.labelsByName[drawName]=(report.labelsByName[drawName]||0)+1;}
  }
 }report.triangles=(S.standDecor.i.length-begin)/3;
};
G.sceneryPine1179=function(mesh,q){const {x,z,r,h,y0,tint,phase}=q;
 for(let j=0;j<8;j++){const t=j/8,cy=y0+h*(.23+.72*t),radius=r*(.89-.72*t),top=cy+h*.16,bottom=cy-h*.035;
  for(let i=0;i<9;i++){const a=phase+i*Math.PI*2/9,b=phase+(i+1)*Math.PI*2/9,colour=[.030*tint*(.72+.20*Math.sin(a)),.086*tint*(.78+.22*Math.cos(a)),.052*tint,1],p=[[x,top,z],[x+Math.cos(a)*radius,cy,z+Math.sin(a)*radius],[x+Math.cos((a+b)/2)*radius*.74,bottom,z+Math.sin((a+b)/2)*radius*.74],[x+Math.cos(b)*radius,cy,z+Math.sin(b)*radius]],base=mesh.nv;
   for(const v of p)mesh.vert(...v,...colour,0,0);mesh.tri(base,base+1,base+2);mesh.tri(base,base+2,base+3);
  }
 }
};
})();
