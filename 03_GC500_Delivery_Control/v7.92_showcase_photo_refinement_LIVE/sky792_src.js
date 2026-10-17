/* Author: Andrew Fisher. Procedural atmosphere for full-lap detail, with failure-safe resource cleanup. */
(function(){
'use strict';
const G=window.GC3D;
const VS=`#version 300 es
precision highp float;
out vec2 vUV;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUV=p;gl_Position=vec4(p*2.-1.,1.,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec2 vUV;out vec4 frag;
uniform vec3 uForward,uRight,uUp,uSun;
uniform vec2 uLens,uShift;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 screen=vUV*2.-1.+uShift;
 vec3 ray=normalize(uForward+uRight*screen.x*uLens.x+uUp*screen.y*uLens.y);
 // The supplied photographs show clear coastal daylight. A sparse, stable
 // three-octave horizon cloud field replaces fifteen full-screen noise octaves.
 // Direction and shading use the same sun as the scene's shadow map.
 vec3 sun=normalize(uSun);float h=max(0.,ray.y),sd=max(0.,dot(ray,sun));
 vec3 col=mix(vec3(.64,.78,.85),vec3(.08,.37,.69),pow(h,.43));
 col+=vec3(.13,.12,.09)*pow(sd,16.);
 col+=vec3(1.,.95,.83)*smoothstep(.99965,.99996,sd)*1.3;
 vec2 q=ray.xz/max(ray.y+.20,.20)*1.4;
 float cloud=noise(q)*.62+noise(q*2.03+vec2(13.,7.))*.27+noise(q*4.07)*.11;
 float density=smoothstep(.68,.86,cloud)*smoothstep(.01,.10,h)*(1.-smoothstep(.24,.58,h));
 col=mix(col,vec3(.91,.94,.95),density*.66);
 // Linear output: the scene's existing composite owns the display transfer.
 frag=vec4(pow(max(col,vec3(0.)),vec3(2.2)),1.);
}`;
G.drawSky781=function(S,cam,fov,aspect,sx,sy){
 if(!S.detail781Enabled||!S.look.day)return;
 const gl=S.gl;
 if(!S.sky781){
  let p=null,vao=null;const shaders=[];
  try{
   p=gl.createProgram();if(!p)throw Error('Track sky: program allocation failed');
   const compile=(type,source)=>{
    const shader=gl.createShader(type);if(!shader)throw Error('Track sky: shader allocation failed');
    shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Track sky: '+gl.getShaderInfoLog(shader));
    return shader;
   };
   const vs=compile(gl.VERTEX_SHADER,VS),fs=compile(gl.FRAGMENT_SHADER,FS);
   gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
   if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Track sky: '+gl.getProgramInfoLog(p));
   const u={};['uForward','uRight','uUp','uSun','uLens','uShift'].forEach(n=>u[n]=gl.getUniformLocation(p,n));
   vao=gl.createVertexArray();if(!vao)throw Error('Track sky: vertex array allocation failed');
   S.sky781={p,u,vao};
  }catch(error){
   if(vao)gl.deleteVertexArray(vao);if(p)gl.deleteProgram(p);throw error;
  }finally{for(const shader of shaders)gl.deleteShader(shader);}

 }
 const {p,u,vao}=S.sky781,V=G.V,f=V.norm(V.sub(cam.tgt,cam.eye)),r=V.norm(V.cross(f,G.camUp(cam,S.camRoll||0))),up=V.cross(r,f);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);gl.useProgram(p);gl.bindVertexArray(vao);
 gl.uniform3fv(u.uForward,f);gl.uniform3fv(u.uRight,r);gl.uniform3fv(u.uUp,up);
 gl.uniform3fv(u.uSun,G.sunDirection||G.detail781Sun);
 gl.uniform2f(u.uLens,Math.tan(fov/2)*aspect,Math.tan(fov/2));gl.uniform2f(u.uShift,sx,sy);
 gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
};
G.disposeSky781=function(S){if(!S.sky781)return;if(!S.lost){S.gl.deleteProgram(S.sky781.p);S.gl.deleteVertexArray(S.sky781.vao);}S.sky781=null;};
})();
