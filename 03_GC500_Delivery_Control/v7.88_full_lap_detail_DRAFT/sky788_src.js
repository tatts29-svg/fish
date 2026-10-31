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
uniform vec3 uForward,uRight,uUp;
uniform vec2 uLens,uShift;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.52;mat2 m=mat2(1.62,1.18,-1.18,1.62);for(int i=0;i<5;i++){v+=noise(p)*a;p=m*p+vec2(8.3,2.1);a*=.48;}return v;}
void main(){
 vec2 screen=vUV*2.-1.+uShift;
 vec3 ray=normalize(uForward+uRight*screen.x*uLens.x+uUp*screen.y*uLens.y);
 vec3 sun=normalize(vec3(-.55,.45,.70));float h=max(0.,ray.y),sd=max(0.,dot(ray,sun));
 vec3 col=mix(vec3(.70,.66,.57),vec3(.19,.40,.65),pow(h,.52));
 col+=vec3(.32,.19,.075)*pow(sd,7.)+vec3(.9,.64,.30)*pow(sd,220.);
 col+=vec3(1.,.87,.59)*smoothstep(.99965,.99996,sd)*1.8;
 if(ray.y>.015){
  vec2 q=ray.xz/(ray.y+.14)*1.7;
  float broad=fbm(q),detail=fbm(q*3.1+vec2(12,31));
  float density=smoothstep(.46,.72,broad*.80+detail*.20);
  float rim=max(0.,fbm(q+sun.xz*.085)-broad);
  vec3 cloud=mix(vec3(.42,.47,.53),vec3(.96,.85,.69),clamp(broad*.9+sd*.52,0.,1.));
  cloud+=vec3(.75,.45,.20)*rim*3.;
  col=mix(col,cloud,density*smoothstep(.015,.10,ray.y)*.93);
 }
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
   const u={};['uForward','uRight','uUp','uLens','uShift'].forEach(n=>u[n]=gl.getUniformLocation(p,n));
   vao=gl.createVertexArray();if(!vao)throw Error('Track sky: vertex array allocation failed');
   S.sky781={p,u,vao};
  }catch(error){
   if(vao)gl.deleteVertexArray(vao);if(p)gl.deleteProgram(p);throw error;
  }finally{for(const shader of shaders)gl.deleteShader(shader);}

 }
 const {p,u,vao}=S.sky781,V=G.V,f=V.norm(V.sub(cam.tgt,cam.eye)),r=V.norm(V.cross(f,G.camUp(cam,S.camRoll||0))),up=V.cross(r,f);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);gl.useProgram(p);gl.bindVertexArray(vao);
 gl.uniform3fv(u.uForward,f);gl.uniform3fv(u.uRight,r);gl.uniform3fv(u.uUp,up);
 gl.uniform2f(u.uLens,Math.tan(fov/2)*aspect,Math.tan(fov/2));gl.uniform2f(u.uShift,sx,sy);
 gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
};
G.disposeSky781=function(S){if(!S.sky781)return;S.gl.deleteProgram(S.sky781.p);S.gl.deleteVertexArray(S.sky781.vao);S.sky781=null;};
})();
