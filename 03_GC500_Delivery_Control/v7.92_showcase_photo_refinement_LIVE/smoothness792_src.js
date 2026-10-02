/* Author: Andrew Fisher. Bounded rendering work; the original simulation and cameras stay intact. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.smoothness792)return;
const limits=new WeakMap();
const totals={dynamicUploads:0,dynamicBufferGrowths:0,uploadedBytes:0};
G.smoothness792={version:'v7.92',targetFps:45,fallbackFps:26,minDetailScale:.60};

/* These two capabilities belong to the context, not to a rendered frame. */
G.renderLimit792=function(gl,pname){
 let entry=limits.get(gl);if(!entry){entry={values:new Map(),queries:0};limits.set(gl,entry);}
 if(!entry.values.has(pname)){entry.values.set(pname,gl.getParameter(pname));entry.queries++;}
 return entry.values.get(pname);
};
G.resetRenderLimits792=function(gl){if(gl)limits.delete(gl);};

/* Keep CPU drive/director state through a GPU rebuild. No stale GPU object is
   carried into the restored scene, and hidden wall time is discarded. */
const resumeFields=['sim','clock','view','forceShot','paused','cam','camBase','camT','camRoll',
 'dir','dirRnd','fxRnd','camAnchor','camAnchorShot','camYaw','camShake','_forceShotPrev',
 '_forceShotSide','fovKick','shake','shakePhase','shakeSeed','shookAt','shotI','shotName',
 'prevShot','sceneBeat','lastSceneBeat','sceneBeatAt','beatCounts','lastCueCutAt',
 'qualityChoice','qualityStep','reflOff','shadowOff','bloom','bloomWhy','calmDrive','reducedMotion'];
G.captureContextState792=function(S){
 if(!S)return null;
 const back={quality:S.quality&&S.quality.name,scale:S.o&&S.o.ss,look:S.look&&S.look.name,
  detail:!!(G.fullLap788&&G.fullLap788.enabled),state:{}};
 for(const key of resumeFields)back.state[key]=S[key];
 return back;
};
G.restoreContextState792=function(S,back){
 if(!S||!back)return false;
 if(back.quality&&G.setQuality)G.setQuality(back.quality);
 for(const key of resumeFields)S[key]=back.state[key];
 if(S.o)S.o.ss=back.scale==null?1:back.scale;
 S.last=null;S.accum=0;S.needsRender=true;G.resetRenderLimits792(S.gl);
 if(G.pose)G.pose();if(!S.cam&&G.camStep)G.camStep(0);
 return true;
};

/* Smoke and rubber still use their original vertices and indices. Reuse CPU
   staging arrays and GPU storage after their high-water mark has been reached. */
const upload=G.MeshBatch&&G.MeshBatch.prototype.upload;
if(upload)G.MeshBatch.prototype.upload=function(){
 if(!this.dynamic)return upload.apply(this,arguments);
 const gl=this.gl,vl=this.v.length,il=this.i.length;
 let b=this.storage792;
 if(!b)b=this.storage792={v:new Float32Array(0),i:new Uint32Array(0)};
 const grow=n=>{let size=64;while(size<n)size*=2;return size;};
 gl.bindVertexArray(this.vao);
 gl.bindBuffer(gl.ARRAY_BUFFER,this.vb);
 if(vl>b.v.length){b.v=new Float32Array(grow(vl));gl.bufferData(gl.ARRAY_BUFFER,b.v.byteLength,gl.DYNAMIC_DRAW);totals.dynamicBufferGrowths++;}
 if(vl){b.v.set(this.v);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.v,0,vl);}
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ib);
 if(il>b.i.length){b.i=new Uint32Array(grow(il));gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,b.i.byteLength,gl.DYNAMIC_DRAW);totals.dynamicBufferGrowths++;}
 if(il){b.i.set(this.i);gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,0,b.i,0,il);}
 gl.bindVertexArray(null);this.ni=il;
 totals.dynamicUploads++;totals.uploadedBytes+=(vl+il)*4;
};

const canRefine=S=>{
 if(!S||S.bloom===false)return false;
 const Q=S.quality||{};
 return Q.name==='ultra'||(Q.name!=='balanced'&&S.reflOff!==true)||(S.o.ss||1)>G.smoothness792.minDetailScale+.001;
};
G.shouldReduceQuality792=function(S){
 if(!S||!Number.isFinite(S.fps)||S.fps<=0)return false;
 return S.fps<(canRefine(S)?G.smoothness792.targetFps:G.smoothness792.fallbackFps);
};
/* Retain the existing expensive-quality rungs first. Once Balanced is reached,
   smaller targets get a chance before sunlight, the composite or detail goes. */
G.installSmoothLadder792=function(){
 const original=G.stepDown;if(typeof original!=='function'||original.smooth792)return;
 const step=function(){
  const S=G.S;if(!S)return null;
  const Q=S.quality||{},ss=S.o.ss||1;
  const qualityFirst=Q.name==='ultra'||(Q.name!=='balanced'&&S.reflOff!==true);
  if(!qualityFirst&&S.bloom!==false&&ss>G.smoothness792.minDetailScale+.001){
   S.o.ss=ss>.85+.001?.85:ss>.70+.001?.70:G.smoothness792.minDetailScale;
   S.qualityStep='drawn at '+Math.round(S.o.ss*100)+'%';S.needsRender=true;
   return S.qualityStep;
  }
  return original.apply(this,arguments);
 };
 step.smooth792=true;G.stepDown=step;
};
const mount=G.mount;
if(typeof mount==='function')G.mount=function(){const result=mount.apply(this,arguments);G.installSmoothLadder792();return result;};
G.installSmoothLadder792();

/* Hidden time and a lost context are never simulation time. The adapter and
   standalone preview retain ownership of pausing and of rebuilding a context. */
const frame=G.frame;
G.frame=function(t){
 const S=G.S;
 if(S&&(S.lost||document.hidden)){S.last=null;S.needsRender=true;return;}
 return frame.apply(this,arguments);
};
document.addEventListener('visibilitychange',()=>{const S=G.S;if(S){S.last=null;S.needsRender=true;}});

G.smoothnessReport792=function(){
 const S=G.S,entry=S&&S.gl&&limits.get(S.gl);
 return {author:'Andrew Fisher',version:'v7.92',targetFps:G.smoothness792.targetFps,
  fallbackFps:G.smoothness792.fallbackFps,capabilityQueries:entry?entry.queries:0,
  cachedCapabilities:entry?entry.values.size:0,dynamicUploads:totals.dynamicUploads,
  dynamicBufferGrowths:totals.dynamicBufferGrowths,uploadedBytes:totals.uploadedBytes,
  detailScale:S&&S.o?S.o.ss||1:null,quality:S&&S.quality?S.quality.name:null,
  automaticClimb:false,simulationChanged:false,camerasChanged:false};
};
})();
