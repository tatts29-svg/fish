/* Author: Andrew Fisher. Resolution-preserving Showcase detail. */
(function(root){
'use strict';
const G=root.GC3D;if(!G)return;
G.QUALITY.crisp={name:'crisp',label:'4K clarity',samples:4,shadow:2048,scale:1,ao:false,dpr:4,pixels:8294400};
const size=G.renderSize;
G.renderSize=function(width,height,dpr,Q,ss,max,exportSize){
 if(Q?.name!=='crisp'||exportSize)return size.apply(this,arguments);
 // Fit the visible aspect ratio inside UHD (rotated for portrait). Do not
 // stretch the scene or quietly reduce its resolution under frame load.
 const w=Math.max(2,width||2),h=Math.max(2,height||2),landscape=w>=h;
 const scale=Math.min((landscape?3840:2160)/w,(landscape?2160:3840)/h,(max||4096)/w,(max||4096)/h);
 return [Math.max(2,Math.floor(w*scale)),Math.max(2,Math.floor(h*scale))];
};
const quality=G.setQuality;
G.setQuality=function(name,automatic){
 const S=G.S;
 if(automatic&&S?.qualityChoice==='crisp')return G.graphicsReport();
 const result=quality.apply(this,arguments);
 if(S&&G.S===S&&S.quality?.name==='crisp'){
  S.bloom=false;S.reflOff=true;S.o.ss=1;S.needsRender=true;
 }
 return result===false?false:G.graphicsReport();
};
// Cooperative preparation mounts the completed scene before the old UI sync
// sees it. Apply the preference here too, including paused first openings.
const mount=G.mount;
G.mount=function(){const result=mount.apply(this,arguments);
 if(/^mounted/.test(result)&&G.S)G.setQuality(typeof root.showQualityGet==='function'?root.showQualityGet():'crisp');
 return result;
};
const report=G.graphicsReport;
G.graphicsReport=function(){const r=report.apply(this,arguments);if(G.S?.quality?.name==='crisp'){
 r.resolutionLocked=true;r.drawnAt='4K clarity';
 r.antiAliasing=G.S.rt?.samples||1;
}return r;};
root.ShowcaseClarity1182={version:1182};
})(window);
