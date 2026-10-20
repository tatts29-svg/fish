// Author: Andrew Fisher. GET-only deterministic GL canvas comparison.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
const OUT=process.env.OUTDIR;if(!OUT)throw Error('OUTDIR is required');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const s=await open({pageFile:process.env.PAGE,gl:true,W:960,H:720,dpr:1,init:"localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showview','hero');localStorage.setItem('gc500.showcarfocus','on');"}),p=s.page,R={author:'Andrew Fisher',label:process.env.LABEL,pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
try{await p.evaluate(()=>{showOpen();if(SHOW.playing)showPause();});await p.waitForFunction(()=>GC3D.startupReport971().shown,null,{timeout:60000});
R.captures=[];
for(const view of ['detail','frontdetail']){
const r=await p.evaluate(view=>{const G=GC3D,S=G.S,gl=S.gl;G.noGuard=true;
const calls=[],old={};for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){old[name]=gl[name];gl[name]=function(...a){calls.push({name,count:name.includes('Elements')?a[1]:a[2],instances:name.includes('Instanced')?a.at(-1):1});return old[name].apply(this,a);};}
S.distK=1;S.distGoal=1;S.shiftGoal=0;S.tune.shiftX=0;S.tune.shiftY=0;G.renderAt(5,view);S.paused=true;S.needsRender=false;
const buf=new Uint8Array(S.cv.width*S.cv.height*4);gl.readPixels(0,0,S.cv.width,S.cv.height,gl.RGBA,gl.UNSIGNED_BYTE,buf);
const glError=gl.getError();for(const k in old)gl[k]=old[k];
const ext=gl.getExtension('EXT_texture_filter_anisotropic');gl.bindTexture(gl.TEXTURE_2D,S.carAtlas);const anisotropy=ext?gl.getTexParameter(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT):null;
return{view,camera:S.cam,pose:S.pose,distK:S.distK,shiftX:S.tune.shiftX,width:S.cv.width,height:S.cv.height,car:S.raceCarStats,drawCalls:calls.length,indices:calls.reduce((a,c)=>a+c.count*c.instances,0),glError,anisotropy,pixels:Array.from(buf),canvas:S.cv.toDataURL('image/png'),report:G.graphicsReport()};},view);
fs.writeFileSync(OUT+'/'+R.label+'-'+view+'.rgba',Buffer.from(r.pixels));delete r.pixels;fs.writeFileSync(OUT+'/'+R.label+'-'+view+'.png',Buffer.from(r.canvas.split(',')[1],'base64'));delete r.canvas;R.captures.push(r);
}
R.errors=s.errors;R.counts=s.counts;fs.writeFileSync(OUT+'/'+R.label+'-compare.json',JSON.stringify(R,null,2));console.log(JSON.stringify(R));
}finally{await s.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
