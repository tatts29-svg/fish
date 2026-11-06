G.render=function(){
 const S=G.S,gl=S.gl,cv=S.cv,T=S.tune,pr=S.prog;
 const L=S.look||G.LOOKS.day;
const Q=S.quality||G.QUALITY.high;
 const detail781=S.detail781Enabled&&L.day?1:0;
 G.sunDirection=detail781?G.detail781Sun:G.default781Sun;
const max=G.renderLimit792(gl,gl.MAX_RENDERBUFFER_SIZE);
 const [w,h]=G.renderSize(cv.clientWidth||2,cv.clientHeight||2,window.devicePixelRatio||1,Q,S.o.ss||1,max,S.exportSize);
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
 if(!S.cam)G.camStep(0);
 G.buildDynamic();
 const cam=S.cam,fov=G.framedFov(cam.fov||T.fov,w/h,S.shotName);
 const shiftX=/wide|top|heli|hero/.test(S.shotName||'')?T.shiftX:T.shiftX*.35;
 /* Close rigs pass through the car's visual envelope. A one-point near plane was large enough
 to chop the cockpit and wheel geometry, which reads as parts breaking apart. */
 const close=isClose(S.shotName),near=close?Math.max(.035,T.carS*.05):1;
 const P=G.persp(fov,w/h,near,4000,shiftX,T.shiftY),VP=G.matMul(P,G.lookAt(cam.eye,cam.tgt,G.camUp(cam,S.camRoll||0)));
S.visibilityVP918=VP;
 const dist=V.len(V.sub(cam.eye,cam.tgt)),fog=[dist*L.fogScale+L.fogNear,dist*L.fogScale+L.fogFar],px=h/(2*Math.tan(fov/2));
 /* the scene is drawn into a buffer of its own so the bright parts can be bloomed before it reaches the page */
 if(L.day||!S.sunShadow)G.updateSunShadow(S);
 // Author: Andrew Fisher. Tone mapping belongs to the look, not the optional
 // glow effect. Low-cost 3D keeps one scene target and one colour pass.
 if(!S.rt||S.rt.w!==w||S.rt.h!==h||S.rt.quality!==Q.name){
  [S.rt,S.b1,S.b2,S.c1,S.c2].forEach(t=>G.freeTarget(gl,t));
  S.rt=G.makeTarget(gl,w,h,true);S.b1=S.b2=S.c1=S.c2=null;
  if(S.rt){S.rt.quality=Q.name;if(S.bloom!==false)G.addMSAA(gl,S.rt,Q.samples);}
 }
 if(S.bloom!==false&&S.rt&&!S.b1){
  const bw=Math.max(2,w>>2),bh=Math.max(2,h>>2),cw=Math.max(2,w>>4),ch2=Math.max(2,h>>4);
  S.b1=G.makeTarget(gl,bw,bh);S.b2=G.makeTarget(gl,bw,bh);S.c1=G.makeTarget(gl,cw,ch2);S.c2=G.makeTarget(gl,cw,ch2);
  if(!S.b1||!S.b2||!S.c1||!S.c2)S.bloom=false;
 }
 const post=S.rt,glow=post&&S.bloom!==false&&S.b1&&S.b2&&S.c1&&S.c2;
 gl.bindFramebuffer(gl.FRAMEBUFFER,post?(S.rt.msfb||S.rt.fb):null);
 gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clearStencil(0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);

 if(G.drawSky781)G.drawSky781(S,cam,fov,w/h,shiftX,T.shiftY);

 /* 1. buildings: opaque, fogged to transparent so the page shows through at distance */
 gl.disable(gl.BLEND);gl.depthMask(true);
 gl.useProgram(pr.mesh.p);gl.uniformMatrix4fv(pr.mesh.u.uVP,false,VP);gl.uniform2f(pr.mesh.u.uFog,fog[0],fog[1]);
 const sun=G.sunDirection;gl.uniform3f(pr.mesh.u.uSun,sun[0],sun[1],sun[2]);gl.uniform2f(pr.mesh.u.uWin,S.o.winU||.72,S.o.winV||.52);gl.uniform1f(pr.mesh.u.uWinGain,L.winGain);gl.uniform1f(pr.mesh.u.uDay,L.day);
gl.uniform3fv(pr.mesh.u.uEye,cam.eye);gl.uniform1f(pr.mesh.u.uDetail781,detail781);G.bindSunShadow(S,pr.mesh,!!L.day);
 /* v5.65 — the look's own building material, where it names one. Absent means absent. */
 {const B=(L.mat&&L.mat.building)||{tint:[1,1,1],lift:[0,0,0]};
 gl.uniform3fv(pr.mesh.u.uBTint,B.tint||[1,1,1]);gl.uniform3fv(pr.mesh.u.uBLift,B.lift||[0,0,0]);}
 if(S.bMesh)S.bMesh.draw();

 gl.enable(gl.BLEND);gl.depthMask(false);
 const lines=(soft,gain,max,bias)=>{gl.useProgram(pr.line.p);const u=pr.line.u;gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform2f(u.uView,w,h);gl.uniform1f(u.uPx,px);gl.uniform1f(u.uNear,close?Math.max(.05,T.carS*.07):1.2);gl.uniform2f(u.uFog,fog[0],fog[1]);
 const alpha=!!L.day&&!soft;gl.uniform1f(u.uAlpha,alpha?1:0);
 gl.uniform1f(u.uGain,gain);gl.uniform1f(u.uBias,bias?.01:0);gl.uniform1f(u.uSoft,soft?1:0);
 /* v5.65 — the look's own line colour, or nothing at all. Absent means absent: the three looks that came
 before this one pass no tint and are drawn byte for byte as they were. */
 {const T=L.lines&&L.lines.tint;gl.uniform3fv(u.uTint,T||[1,1,1]);gl.uniform1f(u.uTintMix,T?(L.lines.tintMix==null?1:L.lines.tintMix):0);}
 gl.uniform1f(u.uThin,L.lines&&L.lines.thinFloor!=null?L.lines.thinFloor:.3); /* v5.79 — see LINE_VS;.3 is what every look had */
 gl.blendEquationSeparate(max&&!alpha?gl.MAX:gl.FUNC_ADD,gl.FUNC_ADD);
 if(alpha)gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 else gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ZERO,gl.ONE);};
 const flat=(mode,mat,receiveShadow=true)=>{const M=mat||{tint:[1,1,1],lift:[0,0,0]};gl.useProgram(pr.flat.p);gl.uniformMatrix4fv(pr.flat.u.uVP,false,VP);gl.uniform2f(pr.flat.u.uFog,fog[0],fog[1]);gl.uniform1f(pr.flat.u.uMode,mode);gl.uniform1f(pr.flat.u.uTime,S.reducedMotion?0:S.clock);gl.uniform3fv(pr.flat.u.uTint,M.tint);gl.uniform3fv(pr.flat.u.uLift,M.lift);gl.uniform1f(pr.flat.u.uDay,L.day);gl.uniform1f(pr.flat.u.uDetail781,detail781);gl.uniform3fv(pr.flat.u.uEye,cam.eye);
 if(detail781){
  /* Cache by the registered centreline, not camera or clock: held and moving
     frames sample precisely the same surface and rendering stays reproducible. */
  if(!S.surfaceFrame781||S.surfaceFrame781.source!==S.CL||S.surfaceFrame781.grid!==S.gridS){
   const a=S.CL.at(S.gridS),b=S.CL.at(S.gridS+.2),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
   S.surfaceFrame781={source:S.CL,grid:S.gridS,value:new Float32Array([a[0],a[1],dx/len,dz/len])};
  }
  gl.uniform4fv(pr.flat.u.uSurfaceFrame781,S.surfaceFrame781.value);
 }G.bindSunShadow(S,pr.flat,!!L.day&&receiveShadow);gl.blendEquation(gl.FUNC_ADD);
 if(mode===0||mode>=3)gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);else gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ZERO,gl.ONE);};

 /* 2. the ground: real surroundings remain, while night-only road/city light is profile-gated. */
 if(S.ground)S.ground(VP,fog,px,w,h,lines,flat,L);
 if(L.lines.streets>0){lines(false,L.lines.streets,true,0);S.streets.draw();}
 if(L.lines.halo>0){lines(true,L.lines.halo,true,0);S.halo.draw();}
 /* Physical track and city detail are shared by both lighting modes. */
 gl.depthMask(true);
 /* v5.65 — and the city's own detail shells take the look's word too, where it names one. Same fault as the
 buildings and the track surface before them: a hardcoded night material that no appearance could reach. */
if(S.cityDetail&&!(S.detail781Enabled&&S.architecture781)){flat(5,L.day?null:((L.mat&&L.mat.cityDetail)||{tint:[.19,.24,.31],lift:[.004,.007,.012]}));S.cityDetail.draw();}
 flat(5,L.mat.walls);S.walls.draw();
 flat(4,L.mat.deck);S.deck.draw();
 /* v5.48 — THE PIT LANE, carried across when this scene became the deck's backdrop: OpenStreetMap's service
 road on Macintosh Island tagged for motor sport, which iEDM's key plan draws in the same place. The lane's
 surface takes the deck's own material a shade lighter; the wall on the track side is solid and the edges
 are lit. Its garages are a nominal row and the credit line says so. */
 if(S.pitLane){flat(4,L.mat.deck);S.pitLane.draw();}
if(S.kerb){flat(detail781?14:0,L.mat.kerb);const paint788=S.detail781Enabled&&S.trackDetail781&&S.trackDetail781.paint;(paint788||S.kerb).draw();}
if(S.pitWallMesh&&S.pitWallMesh.ni){flat(S.detail781Enabled?5:0,S.detail781Enabled?{tint:[.17,.17,.17],lift:[.003,.003,.003]}:L.mat.walls);S.pitWallMesh.draw();}
if(S.standMesh&&S.standMesh.ni){flat(0,L.mat.walls);S.standMesh.draw();}
if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);const lettering792=S.detail781Enabled&&S.trackDetail781&&S.trackDetail781.signDecor;(lettering792||S.standDecor).draw();}
if(S.crowdMesh&&S.crowdMesh.ni){flat(12,L.day?null:{tint:[.46,.48,.56],lift:[.004,.004,.006]});S.crowdMesh.draw();} /* v6.64 - the crowd, bouncing */ /* v6.52 - roofs, bands, huts, the gantry: their own colours */
 /* v5.63 — THE TRACK SURFACE BELONGS TO THE LOOK. This was hardcoded for every non-day look, so the
 road under the car was the same blue-grey concrete whichever look was chosen and no look could say
 otherwise — found on 20 Sep 2026 while the LED look's own darker surface was being ignored without
 any sign that it was. The value below stays exactly what it was, as the fallback, so After Dark is
 unchanged; a look that wants its own track surface can now name one. */
 const trackMat=L.day?null:((L.mat&&L.mat.track)||{tint:[.22,.28,.36],lift:[.006,.008,.012]});
 if(S.trackConcrete){flat(5,trackMat);S.trackConcrete.draw();flat(5,trackMat);S.trackFencePosts.draw();}
 else if(S.barrier){flat(5,L.mat.barrier);S.barrier.draw();}
 if(S.detail781Enabled){G.drawTrackDetail781(S,VP,fog);G.drawArchitecture781(S,VP,fog);gl.enable(gl.BLEND);}
 /* v5.66 — rubber first: it lies ON the road, under the car's own shadow, and writes no depth so the
 strips of a long slide overlap without fighting each other */
 if(S.marks&&S.marks.ni){
 /* A DECAL IS PULLED TOWARDS THE LENS, NOT LIFTED OFF THE GROUND. Laid at a fixed height above the deck the
 rubber vanished wherever the car had crossed a kerb — the kerb stands proud of the road, so a mark at
 +3.5 mm sat inside it and the depth test threw the mark away. Found by drawing the marks in magenta at
 six times their width: three dashes on the grey between the kerb blocks and nothing at all across them.
 Raising them further would only make them float at a grazing angle. A polygon offset moves them in DEPTH
 while leaving them exactly where the tyre put them, which is what a decal wants. */
 gl.depthMask(false);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2.2,-3.0);
 flat(10,null,false);S.marks.draw();
 gl.disable(gl.POLYGON_OFFSET_FILL);}
 gl.depthMask(false);flat(0,null,false);if(S.shade)S.shade.draw();
 gl.depthMask(true);flat(0,null,false);if(S.carBody)S.carBody.draw();
 gl.depthMask(false);if(S.carGlass)S.carGlass.draw();
 if(G.drawRaceCar)G.drawRaceCar(S,VP,fog);
 /* and the smoke after the car, because it comes off the back of it and drifts between the car and the lens */
 if(S.puffs&&S.puffs.ni){gl.depthMask(false);flat(11,null,false);S.puffs.draw();}
 if(S.trackScuffs){flat(0,null,false);S.trackScuffs.draw();}
 if(S.trackFenceWire){flat(8,null,false);S.trackFenceWire.draw();}
 flat(1,null,false);S.decals.draw();
 /* 4. edges of the track, building edges, then everything that moves */
 if(L.lines.edgeGlow>0){lines(true,L.lines.edgeGlow,true,0);S.edgeGlow.draw();}
 if(L.lines.edgeCore>0){lines(false,L.lines.edgeCore,true,.0006);S.edgeCore.draw();}
 if(S.bEdges&&L.lines.bEdges>0){lines(false,L.lines.bEdges,true,.0006);S.bEdges.draw();}
 if(L.lines.dynGlow>0){lines(true,L.lines.dynGlow,true,.0004);S.dynGlow.draw();}
if(L.lines.dynAdd>0){lines(true,L.lines.dynAdd,false,.0004);S.dynAdd.draw();}
 if(S.fwLines&&S.fwLines.n){lines(true,1,false,0);gl.uniform1f(pr.line.u.uAlpha,1);gl.blendEquationSeparate(gl.FUNC_ADD,gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ONE,gl.ONE);S.fwLines.draw();} /* v6.64 - fireworks */
 /* the lit edges that come with the pit lane and the stands (v5.48). They follow the look's own edge gain, so
 by day they are a line on concrete and after dark they glow like everything else. */
 /* v5.65 — the pit wall, the pit edge and the stands' treads have followed the ROUTE's core gain since they
 were carried across in v5.48, which is fine while the two want the same brightness and wrong when they do
 not. The Coates orange look is the case where they do not: its route core is the circuit and must read,
 while its pit wall is a single unbroken line at wall height down the whole main straight — and under
 bloom that line stops being a line and becomes a lit wall across the middle of the picture, hiding the
 barrier, the catch fence and the city behind. Found by zeroing each family of lines in turn in the
 browser against the same frame. They get their own gain now; a look that names none is drawn exactly as
 it was, on the route's. */
 {const eg=L.lines.edgeCore==null?1:L.lines.edgeCore;
 const tg=L.lines.trackside==null?eg:L.lines.trackside;
 if(tg>0){lines(false,tg,true,.0006);
 if(S.pitEdge)S.pitEdge.draw();if(S.pitWall)S.pitWall.draw();if(S.standEdge)S.standEdge.draw();}
 /* v6.52 - the crowd: solid by day; at night drawn quietly, lit by the stands and not glowing like a sign */
if(S.people&&S.people.n&&tg>0){lines(false,L.day?tg:tg*.22,true,.0006);S.people.draw();}
if(S.crowd&&(L.lines.dynAdd==null?1:L.lines.dynAdd)>0){lines(true,(L.lines.dynAdd==null?1:L.lines.dynAdd)*.5,false,.0005);S.crowd.draw();}}
 if(L.lines.dynCore>0){lines(false,L.lines.dynCore,true,.0008);S.dynCore.draw();}
 gl.depthMask(true);gl.bindVertexArray(null);

 if(post){
 G.resolveMSAA(gl,S.rt);
 /* bright pass, two blurred sizes, then composite back over the page */
 const P2=pr,tri=()=>gl.drawArrays(gl.TRIANGLES,0,3);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.STENCIL_TEST);
 if(!S.postVao)S.postVao=gl.createVertexArray();
 gl.bindVertexArray(S.postVao);
 const pass=(dst,fn)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,dst.fb);gl.viewport(0,0,dst.w,dst.h);fn();tri();};
 if(glow){
 gl.useProgram(P2.bright.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.rt.tex);
 pass(S.b1,()=>{gl.uniform1i(P2.bright.u.uTex,0);gl.uniform2f(P2.bright.u.uTexel,1/w,1/h);gl.uniform1f(P2.bright.u.uThresh,L.bloomCut);});
 const blur=(src,dst,dx,dy)=>{gl.useProgram(P2.blur.p);gl.bindTexture(gl.TEXTURE_2D,src.tex);
 pass(dst,()=>{gl.uniform1i(P2.blur.u.uTex,0);gl.uniform2f(P2.blur.u.uDir,dx/dst.w,dy/dst.h);});};
 blur(S.b1,S.b2,1,0);blur(S.b2,S.b1,0,1);
 gl.useProgram(P2.bright.p);gl.bindTexture(gl.TEXTURE_2D,S.b1.tex);
 pass(S.c1,()=>{gl.uniform1i(P2.bright.u.uTex,0);gl.uniform2f(P2.bright.u.uTexel,1/S.b1.w,1/S.b1.h);gl.uniform1f(P2.bright.u.uThresh,0);});
 blur(S.c1,S.c2,1,0);blur(S.c2,S.c1,0,1);
 }
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.useProgram(P2.comp.p);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.rt.tex);gl.uniform1i(P2.comp.u.uScene,0);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,glow?S.b1.tex:S.rt.tex);gl.uniform1i(P2.comp.u.uBloom,1);
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,glow?S.c1.tex:S.rt.tex);gl.uniform1i(P2.comp.u.uBloom2,2);
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,S.rt.depthTex);gl.uniform1i(P2.comp.u.uDepth,3);
 gl.uniform4f(P2.comp.u.uProjection,P[0],P[5],P[8],P[9]);gl.uniform2f(P2.comp.u.uClip,near,4000);
 gl.uniform2f(P2.comp.u.uPixel,1/w,1/h);
 gl.uniform1f(P2.comp.u.uAO,Q.ao&&L.day?1:0);
 const forward=V.norm(V.sub(cam.tgt,cam.eye)),right=V.norm(V.cross(forward,[0,1,0])),up=V.cross(right,forward);
 gl.uniform3fv(P2.comp.u.uCamRight,right);gl.uniform3fv(P2.comp.u.uCamUp,up);gl.uniform3fv(P2.comp.u.uCamForward,forward);
gl.uniform1f(P2.comp.u.uK,glow?L.bloom:0);gl.uniform1f(P2.comp.u.uDay,L.day);gl.uniform1f(P2.comp.u.uDetail781,detail781);
 /* v5.79 — the far cameras open up: a look may name nightFar {from,to,gain}, and the night gain rises
 smoothly to gain× as the camera's distance from its target goes from 'from' to 'to' scene units */
 let ng=L.nightGain==null?1:L.nightGain;
 if(L.nightFar&&!L.day){const F=L.nightFar,k=G.smooth((dist-F.from)/Math.max(1e-6,F.to-F.from));ng*=1+((F.gain||1)-1)*k;}
 gl.uniform1f(P2.comp.u.uNightGain,ng);gl.uniform1f(P2.comp.u.uNightGamma,L.nightGamma==null?2.4:L.nightGamma);gl.uniform1f(P2.comp.u.uNightKnee,L.nightKnee==null?.6:L.nightKnee);
 tri();
 gl.activeTexture(gl.TEXTURE0);gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
 }
};
