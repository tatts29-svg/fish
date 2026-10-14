/* Author: Andrew Fisher. Exact inverse of the published drawing registration.
 * explorer/assets/georeferencing.json SHA256 2487feea8f15fb94c3a435555c50234d29036a5da29b9d1e07f48e5774359ffc.
 * This changes drawing projection only; authorised/native geographic positions stay unchanged. */
const GENERATOR_GEO1017=Object.freeze({
 main:[[0.006209606192736599,-2.678811572270095,124312606.97781198],[2.6899847635931895,0.006687497663555323,77981931.41801661]],
 inset:[[1.7541222535747083e-05,-2.666729858487075,124314492.88684578],[2.6886829616548065,0.01105057213805883,77983319.7610734]],
 insetRegion:[1482.86,873.42,2334.08,1464.24]
});
function generatorSheetPoint1017(ll){
 if(!ll||!Number.isFinite(ll.lat)||!Number.isFinite(ll.lon)||Math.abs(ll.lat)>85.05112878||Math.abs(ll.lon)>180)return null;
 const W=512*Math.pow(2,18),s=Math.sin(ll.lat*Math.PI/180),z=[(ll.lon+180)/360*W,(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*W];
 const inverse=m=>{const [[a,b,c],[d,e,f]]=m,det=a*e-b*d;return det?[(e*(z[0]-c)-b*(z[1]-f))/det,(-d*(z[0]-c)+a*(z[1]-f))/det]:null;};
 const inside=p=>p&&p[0]>=GENERATOR_GEO1017.insetRegion[0]&&p[0]<=GENERATOR_GEO1017.insetRegion[2]&&p[1]>=GENERATOR_GEO1017.insetRegion[1]&&p[1]<=GENERATOR_GEO1017.insetRegion[3];
 let p=inverse(GENERATOR_GEO1017.main);
 // Match the explorer: use the main drawing unless its point is covered by the inset.
 if(inside(p)){p=inverse(GENERATOR_GEO1017.inset);if(!inside(p))return null;}
 if(!p||!p.every(Number.isFinite)||p[0]<-596||p[0]>2980||p[1]<-421||p[1]>2105)return null;
 return [p[0]/2384,p[1]/1684];
}
