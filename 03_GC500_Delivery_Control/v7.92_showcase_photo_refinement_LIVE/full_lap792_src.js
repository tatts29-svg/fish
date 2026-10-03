/* Author: Andrew Fisher. Visual detail over the existing complete circuit. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.fullLap788)return;
G.fullLap788={version:'v7.92',enabled:true,scope:'Existing complete circuit; visual refinement only'};
const dispose=S=>{
 if(!S)return;
 G.disposeTrackDetail781(S);G.disposeArchitecture781(S);G.disposeVegetation781(S);G.disposeSky781(S);
};
const fail=(S,error)=>{
 S.fullLapFailed788=String(error&&error.message||error);S.detail781Enabled=false;dispose(S);S.needsRender=true;
};
const ensure=S=>{
 if(!S||!S.gl||S.lost)return;
 // Preserve the existing performance ladder. Once it gives up the composite,
 // use its original scene rather than send linear-light additions to the display.
 const enabled=G.fullLap788.enabled&&S.bloom!==false&&!S.fullLapFailed788;
 if(!enabled){
  if(S.detail781Enabled||S.trackDetail781||S.architecture781||S.vegetation781||S.sky781)dispose(S);
  S.detail781Enabled=false;return;
 }
 S.detail781Enabled=true;
 try{
  if(!S.trackDetail781)G.installTrackDetail781(S);
  if(!S.architecture781&&S.architecture781Source)G.installArchitecture781(S);
  if(!S.vegetation781&&S.vegetation781Source)G.installVegetation781(S);
 }catch(error){fail(S,error);}
};
G.enableFullLap788=function(on){
 G.fullLap788.enabled=!!on;const S=G.S;if(!S)return !!on;
 if(on)delete S.fullLapFailed788;ensure(S);S.needsRender=true;return !!S.detail781Enabled;
};
const init=G.init;
G.init=function(){const ok=init.apply(this,arguments);if(ok&&G.S)G.S.detail781Enabled=G.fullLap788.enabled;return ok;};
const render=G.render;
G.render=function(){
 const S=G.S;if(!S||S.lost)return;ensure(S);
 let result;
 try{result=render.apply(this,arguments);}
 catch(error){if(!S||!S.detail781Enabled)throw error;fail(S,error);return render.apply(this,arguments);}
 // Allocation failure can disable the composite inside the original render.
 // Redraw once with its original resources, then keep the normal fallback.
 if(S&&S.detail781Enabled&&S.bloom===false){ensure(S);return render.apply(this,arguments);}
 return result;
};
const mount=G.mount;
if(typeof mount==='function')G.mount=function(){
 const result=mount.apply(this,arguments),S=G.S;
 if(S&&S.unmount&&!S.fullLapUnmount788){const unmount=S.unmount;S.fullLapUnmount788=true;S.unmount=function(){dispose(S);return unmount.apply(this,arguments);};}
 return result;
};
G.fullLapReport788=function(){const S=G.S;return {
 author:'Andrew Fisher',version:'v7.92',enabled:!!(S&&S.detail781Enabled),scope:G.fullLap788.scope,
 limitedByDevice:!!(S&&(S.bloom===false||S.fullLapFailed788)),detailError:S&&S.fullLapFailed788||null,
 lapMetres:S&&S.CL?S.CL.L*(G.M_PER_PT||6):null,
 track:S&&S.trackDetail781?S.trackDetail781.stats:null,
 architecture:S&&S.architecture781?S.architecture781.stats:null,
 vegetation:S&&S.vegetation781?S.vegetation781.stats:null,
 graphics:S?G.graphicsReport():null,
 simulationOverride:false,cameraOverride:false,shortSectionReset:false,
 fullCircuitSourcesPreserved:true
};};
})();
