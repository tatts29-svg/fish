/* Author: Andrew Fisher. Visual detail over the existing complete circuit. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.fullLap788)return;
G.fullLap788={version:'v7.88',enabled:true,scope:'Existing complete circuit; visual refinement only'};
const ensure=S=>{
 if(!S||!S.gl||S.lost||!S.detail781Enabled)return;
 if(!S.trackDetail781)G.installTrackDetail781(S);
 if(!S.architecture781&&S.architecture781Source)G.installArchitecture781(S);
 if(!S.vegetation781&&S.vegetation781Source)G.installVegetation781(S);
};
const dispose=S=>{
 if(!S)return;
 G.disposeTrackDetail781(S);G.disposeArchitecture781(S);G.disposeVegetation781(S);G.disposeSky781(S);
};
G.enableFullLap788=function(on){
 G.fullLap788.enabled=!!on;const S=G.S;if(!S)return !!on;
 S.detail781Enabled=!!on;if(on)ensure(S);else dispose(S);
 S.needsRender=true;return !!on;
};
const init=G.init;
G.init=function(){const ok=init.apply(this,arguments);if(ok&&G.S)G.S.detail781Enabled=G.fullLap788.enabled;return ok;};
const render=G.render;
G.render=function(){ensure(G.S);return render.apply(this,arguments);};
const mount=G.mount;
G.mount=function(){
 const result=mount.apply(this,arguments),S=G.S;
 if(S&&S.unmount&&!S.fullLapUnmount788){const unmount=S.unmount;S.fullLapUnmount788=true;S.unmount=function(){dispose(S);return unmount.apply(this,arguments);};}
 return result;
};
G.fullLapReport788=function(){const S=G.S;return {
 author:'Andrew Fisher',version:'v7.88',enabled:!!(S&&S.detail781Enabled),scope:G.fullLap788.scope,
 lapMetres:S&&S.CL?S.CL.L*(G.M_PER_PT||6):null,
 track:S&&S.trackDetail781?S.trackDetail781.stats:null,
 architecture:S&&S.architecture781?S.architecture781.stats:null,
 vegetation:S&&S.vegetation781?S.vegetation781.stats:null,
 graphics:S?G.graphicsReport():null,
 simulationOverride:false,cameraOverride:false,shortSectionReset:false,
 fullCircuitSourcesPreserved:true
};};
})();
