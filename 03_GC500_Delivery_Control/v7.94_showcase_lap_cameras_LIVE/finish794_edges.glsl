/* Author: Andrew Fisher. v7.94 bounded opaque edge finish.
   Existing scene texture only: four diagonal reads, two more only at an edge.
   Work in premultiplied linear light and retain centre coverage. Sky, fog edges,
   bloom, depth contact shade and the night/baseline path keep their own handling. */
float finishLuma794(vec3 c){
 float y=max(dot(c,vec3(.2126,.7152,.0722)),0.);
 return y/(1.+y);
}
vec4 finishEdges794(vec4 centre){
 if(uDetail781<.5||centre.a<.999)return centre;
 vec4 nw=texture(uScene,vUV+uPixel*vec2(-1.,-1.));
 vec4 ne=texture(uScene,vUV+uPixel*vec2(1.,-1.));
 vec4 sw=texture(uScene,vUV+uPixel*vec2(-1.,1.));
 vec4 se=texture(uScene,vUV+uPixel*vec2(1.,1.));
 if(min(min(nw.a,ne.a),min(sw.a,se.a))<.999)return centre;
 float m=finishLuma794(centre.rgb),a=finishLuma794(nw.rgb),b=finishLuma794(ne.rgb);
 float c=finishLuma794(sw.rgb),d=finishLuma794(se.rgb);
 float lo=min(m,min(min(a,b),min(c,d))),hi=max(m,max(max(a,b),max(c,d)));
 if(hi-lo<max(.022,hi*.18))return centre;
 // Edge tangent, capped at two texels: no frame-wide softening or long searches.
 vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));
 float reduce=max((a+b+c+d)*.03125,.0078125);
 direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-2.),vec2(2.))*uPixel;
 vec4 p=texture(uScene,vUV-direction/3.),q=texture(uScene,vUV+direction/3.);
 if(min(p.a,q.a)<.999)return centre;
 vec3 candidate=(p.rgb+q.rgb)*.5;
 float luma=finishLuma794(candidate);
 if(luma<lo||luma>hi)return centre;
 return vec4(mix(centre.rgb,candidate,.65),centre.a);
}
