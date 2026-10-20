// Author: Andrew Fisher. Independent CPU/source audit; no browser, GPU or record writes.
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const [baseFile,pageFile,out]=process.argv.slice(2),base=fs.readFileSync(baseFile,'utf8'),src=fs.readFileSync(pageFile,'utf8');
const checks=[];
function take(text,a,b){const i=text.indexOf(a),j=text.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return text.slice(i,j);}
function pass(label,fn){fn();checks.push(label);}
function compact(x){return x.replace(/\s+/g,'');}
const G={graphicsReport:()=>({}),smooth:x=>x*x*(3-2*x),smoothness792:{targetFps:45,fallbackFps:26,minDetailScale:.60}};
Function('G',take(src,'G.QUALITY={','/* Bound the actual GPU workload'))(G);
Function('G',take(src,'G.stepDown=function(){',' /* v5.49'))(G);
Function('G',take(src,'const canRefine=S=>{','/* Retain the existing expensive-quality'))(G);
Function('G',take(src,'G.installSmoothLadder792=function(){','const mount=G.mount;'))(G);
G.installSmoothLadder792();
const fresh=quality=>(G.S={quality:G.QUALITY[quality],o:{ss:1},bloom:true,shadowOff:false,reflOff:false,clock:12.5,pose:{pos:[1,2,3]},sim:{v:12,steer:.15},sunShadow:{ok:true},needsRender:false});
pass('Balanced disables reflections before resolution/shadows/bloom; physical state retained',()=>{
 const S=fresh('balanced'),physical=JSON.stringify([S.clock,S.pose,S.sim]);
 assert.equal(G.stepDown(),'reflections off');assert.equal(S.reflOff,true);
 assert.equal(S.o.ss,1);assert.equal(S.shadowOff,false);assert.equal(S.bloom,true);
 assert.equal(JSON.stringify([S.clock,S.pose,S.sim]),physical);
 assert.equal(G.stepDown(),'drawn at 85%');assert.equal(G.stepDown(),'drawn at 70%');
 assert.equal(G.stepDown(),'drawn at 60%');assert.equal(G.stepDown(),'shadow map off');
});
pass('Ultra and High retain ordered detail/reflection rungs',()=>{
 const S=fresh('ultra');assert.equal(G.stepDown(),'detail High');assert.equal(S.quality.name,'high');
 assert.equal(S.reflOff,false);assert.equal(G.stepDown(),'reflections off');assert.equal(S.quality.name,'balanced');
});
pass('Manual quality restores reflection, shadow, bloom and full resolution',()=>{
 const S=fresh('balanced');S.reflOff=true;S.shadowOff=true;S.bloom=false;S.o.ss=.6;
 G.setQuality('balanced');assert.equal(S.reflOff,false);assert.equal(S.shadowOff,false);assert.equal(S.bloom,true);assert.equal(S.o.ss,1);
});
pass('Restored Balanced minimum-scale state uses remaining reflection budget',()=>{
 const S=fresh('balanced');S.o.ss=.60;S.fps=35;
 assert.equal(G.shouldReduceQuality792(S),true);S.reflOff=true;assert.equal(G.shouldReduceQuality792(S),false);
 S.fps=25;assert.equal(G.shouldReduceQuality792(S),true);S.fps=NaN;assert.equal(G.shouldReduceQuality792(S),false);
});
const reflectionCode=take(src,'G.bindRaceReflections=function(S,gl,u){','})();\n/* Original surfaced race car.');
Function('G','reflectionTargets','MAX','distance2',reflectionCode)(G,(faces,x,y,z,limit)=>faces.slice(0,limit),12,()=>0);
pass('Reflection off uploads zero, clears fade clock and manual restore repopulates slots',()=>{
 const S=fresh('balanced'),writes=[],gl={uniform1i:(u,n)=>writes.push(n),uniform4fv:()=>{}};
 S.raceReflections={clock:null,faces:Array.from({length:8},(_,i)=>({id:i,x:i,z:0,dx:1,dz:0,y0:0,h:2,seed:0})),slots:[]};
 G.bindRaceReflections(S,gl,{uReflectCount:'count'});assert.equal(writes.at(-1),4);
 S.reflOff=true;G.bindRaceReflections(S,gl,{uReflectCount:'count'});
 assert.equal(writes.at(-1),0);assert.equal(S.raceReflections.activeCount,0);assert.equal(S.raceReflections.clock,null);
 G.setQuality('balanced');G.bindRaceReflections(S,gl,{uReflectCount:'count'});
 assert.equal(writes.at(-1),4);assert.equal(S.raceReflections.slots.length,4);
});
pass('New decal/emissive early return uses exact original final-colour and premultiplied alpha expressions',()=>{
 const tail=take(base,' if(uKind>7.5)col=base*','\n}`;');
 const expected='float decalLight1091=clamp(dot(N,L),0.,1.);'+tail
  .replace('if(uKind>7.5)col=','vec3 decalColour1091=')
  .replace(/\bcol\b/g,'decalColour1091').replace(/\bnl\b/g,'decalLight1091')+'return;';
 const actual=take(src,'  float decalLight1091=','\n }\n // Separate coated machines');
 assert.equal(compact(actual),compact(expected));
 const mask='if(uKind>7.5&&uKind<9.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}';
 assert(base.includes(mask)&&src.includes(mask));
});
pass('Every current early-return material has surface 0, with no skipped tyre/machined/glass base or alpha modification',()=>{
 const materials=Function(take(src,'const materials={paint:','function releaseParts')+';return materials;')();
 const surfaces=Function(take(src,'const vehicleSurfaces800={','const vehicleLayer800=')+';return vehicleSurfaces800;')();
 const early=Object.entries(materials).filter(([name,m])=>m[3]>7.5);
 assert.deepEqual(early.map(([name])=>name),['decal','ledAmber','beacon']);
 for(const [name]of early)assert.equal(surfaces[name]||0,0);
});
pass('Livery derivatives precede divergent paint/material branches and match the band coordinate expressions',()=>{
 const begin=src.indexOf('vec3 base=uColor;float rough=uRough,metal=uMetal,alpha=1.;'),paint=src.indexOf('if(uKind<1.5){',begin);
 const derivatives=src.slice(begin,paint);
 for(const expression of ['fwidth(vLocal.y-.095-.063*clamp((.60-vLocal.x)/1.35,0.,1.))','fwidth(vLocal.y-.092-.020*clamp((vLocal.x+.4)/.9,0.,1.))','fwidth(abs(vLocal.z))'])assert(derivatives.includes(expression));
 assert(src.includes('return smoothstep(lo-aa,lo+aa,x)*(1.-smoothstep(hi-aa,hi+aa,x));'));
});
const result={author:'Andrew Fisher',scope:'Independent source contracts and exact-function CPU fixtures; not GPU compilation or visual/FPS evidence',baseSha256:crypto.createHash('sha256').update(base).digest('hex'),candidateSha256:crypto.createHash('sha256').update(src).digest('hex'),testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),pass:true,checks};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
