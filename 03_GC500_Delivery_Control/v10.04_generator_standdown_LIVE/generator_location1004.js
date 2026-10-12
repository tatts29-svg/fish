/* Author: Andrew Fisher. Red pin supplied in GC500 chat, 12 October 2026 (21521.jpg / 21524.jpg). */
function generatorPlace1004(){return {ref:'GN?',lat:-27.984576,lon:153.427700,text:'Concert generators · Macintosh Island Park · lawn beside the path junction near the peacock enclosure',source:'Andrew Fisher · supplied map pin · 12 Oct 2026'};}
function generatorMaster1004(){
 const p=generatorPlace1004(),pt=ptOf782({key:''},{lat:p.lat,lon:p.lon});
 if(!pt||!pt.every(Number.isFinite))throw new Error('Concert generator master registration unavailable');
 MASTER_LOC[p.ref]={ll:[p.lat,p.lon],pt,prec:'unit',confirmed:'the project manager, 12 Oct 2026 · supplied map pin',how:p.source,near:['Peacock enclosure · path junction'],sec:'Concert',generator1004:true};
}
function generatorMapPoint1004(a,m){
 if(a.key!=='GN?')return m.pt;
 const f=(S.fixes||{})[a.key],p=(S.places||{})[a.key],v=f&&Number.isFinite(f.lat)?f:p&&Number.isFinite(p.lat)?p:null;
 return v?ptOf782({key:''},{lat:v.lat,lon:v.lon}):m.pt;
}
