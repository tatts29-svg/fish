G.drawRaceCar=function(S,VP,fog){if(!S.raceCarEnabled||!S.raceCarParts)return;G.syncRaceCarQuality(S);const gl=S.gl,{p,u}=S.raceProgram,M=G.raceCarMatrix(),wheelTransforms=new Map(),sw=G.swayStep?G.swayStep(S):null,brake=Math.max(0,S.sim.brake||0);
 gl.useProgram(p);if(G.bindRaceReflections)G.bindRaceReflections(S,gl,u);gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3fv(u.uEye,S.cam.eye);gl.uniform2f(u.uFog,fog[0],fog[1]);gl.uniform1f(u.uDay,S.look.day);gl.uniform1f(u.uBrake,brake);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,S.carAtlas||null);gl.uniform1i(u.uAtlas,0);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);
 /* v6.61 - the beacon on the plant turns: a bright sweep twice a second */
 const flash=Math.pow(.5+.5*Math.sin(S.clock*12.6),6);
 const drawPart=(part,M0,wa,wt)=>{const mat=materials[part.material]||materials.carbon;let transform=M0;
  if(part.wheel){const w=part.wheel,key=w.x+':'+(w.y||0);transform=wt.get(key);if(!transform){/* v5.71 — THE REARS HAVE THEIR OWN ANGLE. On a burnout and in a slide they turn far faster than the road; the model names the axles — axle>0 is front — so a negative x is a rear. v6.61 — a wheel of another size turns at its own rate. */const t=wa(w),c=Math.cos(t),s=Math.sin(t),y=w.y===undefined?.145:w.y;const R=new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,w.x-c*w.x+s*y,y-s*w.x-c*y,0,1]);transform=G.matMul(M0,R);wt.set(key,transform);}}
  if(part.sway&&sw)transform=G.swayMatrix(transform,part.sway,sw);
  const spokes=part.name.includes('spokes'),spokeAlpha=spokes?1-G.smooth(Math.min(1,Math.max(0,(S.sim.v/S.tune.vmax-.08)/.25))):1;if(spokeAlpha<.005)return;
  if(part.material==='decal'||part.material==='glass'||part.material==='ledAmber'||spokeAlpha<1){gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}
  if(part.vmsFace&&G.vmsTexture)gl.bindTexture(gl.TEXTURE_2D,G.vmsTexture(gl));
  if(part.material==='beacon')gl.uniform1f(u.uBrake,flash);
  gl.uniform1f(u.uPanel,part.name==='wing-endplates'?2:part.name==='roof-and-pillars'?1:0);gl.uniform1f(u.uOpacity,spokeAlpha);gl.uniformMatrix4fv(u.uModel,false,transform);gl.uniform3fv(u.uColor,part.color||mat[0]);gl.uniform1f(u.uRough,mat[1]);gl.uniform1f(u.uMetal,mat[2]);gl.uniform1f(u.uKind,mat[3]);part.batch.draw();
  if(part.vmsFace)gl.bindTexture(gl.TEXTURE_2D,S.carAtlas||null);
  if(part.material==='beacon')gl.uniform1f(u.uBrake,brake);
 };
 const carAngle=w=>-(w.x<0&&S.sim.wheelR!=null?S.sim.wheelR:S.sim.wheel)*(w.r?.142/w.r:1);
 for(const part of S.raceCarParts)drawPart(part,M,carAngle,wheelTransforms);
 /* v6.61 - the VMS trailer, on its own hitch */
 if(S.towVms&&G.vmsModel&&G.trailerStep){const T=G.trailerStep(S);if(T){const lv=S.quality&&S.quality.name==='balanced'?'balanced':'high';
   if(S.trailerQ!==lv||!S.trailerParts){releaseParts(gl,S.trailerParts);S.trailerParts=G.vmsModel(lv).parts.map(q=>{const b=new G.MeshBatch(gl,[3,3,2],false);b.v=q.vertices;b.i=q.indices;b.nv=q.vertices.length/8;b.upload();b.v=[];b.i=[];return {name:q.name,material:q.material,wheel:q.wheel,color:q.color,vmsFace:q.vmsFace,batch:b};});S.trailerQ=lv;}
   const TM=G.trailerMatrix(S),tw=new Map();gl.uniform1f(u.uBrake,brake*.8);
   for(const part of S.trailerParts)drawPart(part,TM,w=>-T.spin*(.19/(w.r||.19)),tw);gl.uniform1f(u.uBrake,brake);}}
 gl.enable(gl.BLEND);gl.depthMask(false);
};
