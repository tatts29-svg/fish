#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec3 vLocal;in vec2 vUV;in float vDistance;
uniform float uDetail781;uniform float uSurface800;uniform vec3 uEye;uniform vec3 uColor;uniform float uRough;uniform float uMetal;uniform float uKind;uniform float uPanel;uniform float uDay;uniform float uBrake;uniform float uOpacity;uniform vec2 uFog;uniform sampler2D uAtlas;
out vec4 o;
${G.raceReflectionGLSL||''}
// Author: Andrew Fisher. Vehicle material response, v8.00.
// Surface IDs come from existing part material names; no new vertex payload.
float vehicleD800(float nh,float rough){
 float a=rough*rough,a2=a*a,d=nh*nh*(a2-1.)+1.;
 return a2/max(3.141593*d*d,.0000001);
}
void main(){
vec3 N=normalize(vNormal),V=normalize(uEye-vWorld),L=normalize(mix(vec3(.45,.8,.4),vec3(-.35,.78,.52),uDetail781));if(dot(N,V)<0.)N=-N;
 // Derivatives precede all material branches. Filter the specular lobe, not
 // the authored surface normals, when a highlight becomes smaller than a pixel.
 vec3 ndx=dFdx(N),ndy=dFdy(N);
 float normalVariance=min(.12,.30*max(dot(ndx,ndx),dot(ndy,ndy)));
 vec3 base=uColor;float rough=uRough,metal=uMetal,alpha=1.;
 if(uKind<1.5){
 base=vec3(.020,.026,.033);float x=vLocal.x,y=vLocal.y,z=abs(vLocal.z);
 vec3 orange=vec3(.87,.045,.0012),ivory=vec3(.78,.81,.82);
 bool bonnet=uPanel<.5&&x>.265&&y>.279&&N.y>.46&&z<.296;
 bool roof=uPanel>.5&&uPanel<1.5&&y>.476&&x<-.039&&x>-.450&&z<.264&&N.y>.48;
 bool sill=z>.315&&y<.084+.010*(x+.5);
 bool nose=x>.925&&y<.246;
 bool rearBand=x<-.962&&y>.108&&y<.137+.017*(1.-z/.38);
 if(bonnet||roof||sill||nose||rearBand||uPanel>1.5)base=orange;
 // Layered angular side graphics follow the actual sculpted panels.
 if(z>.315&&x>-.98&&x<.89&&y<.19){
 float sweep=.095+.063*clamp((.60-x)/1.35,0.,1.);
 if(y>sweep-.023&&y<sweep-.006)base=orange;
 if(y>sweep&&y<sweep+.013)base=ivory;
 float lower=.092+.020*clamp((x+.4)/.9,0.,1.);
 if(x>-.43&&x<.52&&y>lower&&y<lower+.006)base=ivory;
 }
 if(base.r>.5&&base.b<.02){rough=.29;metal=0.;}
 // A fine yellow bonnet-edge accent complements the yellow racing numbers.
 if(x>.32&&x<.98&&y>.285&&N.y>.45&&z>.302&&z<.307)base=vec3(.83,.57,.004);

 }
 if(uKind>4.5&&uKind<5.5){float weave=sin(vUV.x*490.)*sin(vUV.y*490.);float stable=1.-smoothstep(.5,1.7,max(fwidth(vUV.x*490.),fwidth(vUV.y*490.)));base*=1.+weave*.07*stable;}
 if(uKind>7.5&&uKind<9.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}
 // Separate coated machines from tyres and interior trim even though the
 // older renderer assigns all of them kind 3. Preserve every original colour.
 bool coated=uSurface800>.5&&uSurface800<2.5;
 bool tyre=uSurface800>2.5&&uSurface800<3.5;
 bool machined=uSurface800>3.5&&uSurface800<4.5;
 bool glazing=uSurface800>5.5&&uSurface800<6.5;
 if(uSurface800>1.5&&uSurface800<2.5){rough=min(rough,.34);metal=0.;}
 if(tyre){base*=1.16;rough=max(rough,.78);metal=0.;}
 if(machined){base=max(base*1.24,vec3(.15));rough=max(.24,min(rough,.39));}
 rough=clamp(sqrt(rough*rough+normalVariance),.09,.98);
 // Bound all angular terms: a grazing normal must never create NaN bloom.
 vec3 H=normalize(V+L);float nl=clamp(dot(N,L),0.,1.),nv=clamp(dot(N,V),.001,1.),nh=clamp(dot(N,H),0.,1.),vh=clamp(dot(V,H),0.,1.);
 float k=(rough+1.)*(rough+1.)/8.;
 float geom=nl/(nl*(1.-k)+k)*nv/(nv*(1.-k)+k);
 vec3 f0=mix(vec3(.04),base,metal),F=f0+(1.-f0)*pow(1.-vh,5.);
 vec3 spec=vehicleD800(nh,rough)*geom*F/max(4.*nl*nv,.001),fres=f0+(1.-f0)*pow(1.-nv,5.);
 // Reuse the existing single bounded facade/sky lookup for the colour coat,
 // clearcoat and glass. No cubemap, extra scene pass or extra reflection ray.
 vec3 reflected=raceEnvironment(vWorld,reflect(-V,N),rough,uDay)*mix(.92,1.35,uDay);
 vec3 ambient=mix(vec3(.13,.16,.21),vec3(.22,.275,.335),uDay);
 ambient+=vec3(.10,.12,.14)*max(N.y,0.);
 float broadFill=max(dot(N,normalize(vec3(-.55,.65,-.4))),0.);
 ambient+=vec3(.075,.085,.10)*broadFill*uDay;
 vec3 key=mix(vec3(.24,.29,.40),vec3(1.04,.95,.83),uDay);
 vec3 col=base*(1.-metal)*(vec3(1.)-F)*(ambient+key*nl*.82);
 float reflectionWeight=tyre?.20:uSurface800>4.5&&uSurface800<5.5?.38:1.;
 col+=spec*nl*key*.85+reflected*fres*(1.-rough*.55)*reflectionWeight;
 if(coated){
  // A broad dielectric coat gives coloured paint the same continuous form
  // cues as charcoal paint, without turning either into a metal or a mirror.
  float cr=clamp(sqrt(.22*.22+normalVariance),.22,.65),ck=(cr+1.)*(cr+1.)/8.;
  float cg=nl/(nl*(1.-ck)+ck)*nv/(nv*(1.-ck)+ck);
  float cf=.04+.96*pow(1.-vh,5.),edge=.04+.96*pow(1.-nv,5.);
  float strength=uSurface800<1.5?.72:.48;
  vec3 coat=key*(vehicleD800(nh,cr)*cg*cf/max(4.*nv,.001))*.65+reflected*edge*.82;
  col=col*(1.-edge*strength)+coat*strength;
 }
 if(glazing){
  // Opaque interiors are drawn first; this front sheet now tints and reflects
  // over them. Fresnel rises toward the rim while the cabin stays readable.
  if(dot(normalize(vNormal),V)<=0.)discard;
  float rim=pow(1.-nv,3.);
  vec3 tint=mix(vec3(.011,.025,.038),vec3(.025,.052,.071),uDay);
  col=tint*.55+reflected*(.10+.62*rim)+spec*nl*key*.55;
  alpha=.55+.37*rim;
 }
 if(uKind>5.5&&uKind<6.5){
  float lens=.82+.18*nv;
  col=vec3(.82,.91,1.)*lens*mix(.90,1.45,1.-uDay)+reflected*fres*.20;
 }
 if(uKind>6.5&&uKind<7.5){
  col=vec3(.52,.006,.003)*(.68+2.05*uBrake)+reflected*fres*.14;
 }
 if(uKind>7.5)col=base*(.65+.35*nl)*mix(.65,1.,uDay);
 if(uKind>8.5&&uKind<9.5)col=uColor*mix(1.25,2.4,1.-uDay);
 if(uKind>9.5)col=uColor*(.30+2.6*uBrake)*mix(.9,1.7,1.-uDay);
 col*=.70+.30*smoothstep(.015,.18,vLocal.y);
 alpha*=uOpacity*(1.-smoothstep(uFog.x,uFog.y,vDistance));o=vec4(col*alpha,alpha);
}
