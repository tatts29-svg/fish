// Author: Andrew Fisher. Independent CPU checks for the render-error-only follow-up.
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync(__dirname+'/review_checks.cjs','utf8');
const prefix=source.slice(0,source.indexOf('\n(async()=>{'));
const harness=new Function('require','process','setImmediate',prefix+'\nreturn {makeBoot,checks,check,settle,html,merge,hash};')(require,process,setImmediate);
const {makeBoot,checks,check,settle,html,merge,hash}=harness;
(async()=>{
 let b=makeBoot();await b.c.boot();check('built-in Cesium error panel disabled',b.calls.viewerOptions.showRenderLoopErrors===false);
 b.canvasEvents.renderError();check('running render failure invalidates ready and offers manual retry',b.c.__bootError==='render'&&!b.c.__ready&&b.c.viewer.useDefaultRenderLoop===false&&b.e.es.retry3d813.hidden===false&&b.calls.failed>0);
 check('render failure does not reload session automatically',b.calls.reload===0&&b.calls.imagery===1);
 b.canvasEvents.webglcontextlost({preventDefault(){}});b.canvasEvents.renderError();check('context loss keeps its more specific recovery text',b.c.__bootError==='context');
 b=makeBoot();let resolve;b.c.Cesium.Cesium3DTileset.fromUrl=()=>new Promise(r=>resolve=r);const pending=b.c.boot();await settle();b.canvasEvents.renderError();resolve(b.tile);await pending;
 check('render failure before imagery completion cannot be cleared by late imagery',b.c.__bootError==='render'&&!b.c.__ready&&b.c.viewer.useDefaultRenderLoop===false&&b.e.es.retry3d813.hidden===false,{bootError:b.c.__bootError,ready:b.c.__ready,renderLoop:b.c.viewer.useDefaultRenderLoop,retryHidden:b.e.es.retry3d813.hidden,added:b.calls.added});
 check('late imagery is disposed after terminal render failure',b.calls.destroy===1&&b.calls.added===0&&b.calls.ready===0);
 b=makeBoot();let reject;b.c.Cesium.Cesium3DTileset.fromUrl=()=>new Promise((resolve,r)=>reject=r);const rejected=b.c.boot();await settle();b.canvasEvents.renderError();reject(Error('later imagery failure'));await rejected;check('late imagery rejection preserves original render failure',b.c.__bootError==='render'&&!b.c.__ready&&b.e.es.retry3d813.hidden===false);
 b=makeBoot();let slowResolve;b.c.Cesium.Cesium3DTileset.fromUrl=()=>new Promise(r=>slowResolve=r);const slow=b.c.boot();await settle();b.t.fire(30000);slowResolve(b.tile);await slow;check('nonterminal slow warning still permits late success',b.c.__bootError===null&&b.c.__ready===true&&b.c.viewer.useDefaultRenderLoop&&b.calls.destroy===0&&b.calls.ready===1);
 const out={author:'Andrew Fisher',poc_sha256:hash(html),merge_sha256:hash(merge),checks,passed:checks.filter(x=>x.pass).length,total:checks.length,limits:'CPU exact boot/helper functions; no browser, GPU, network or service calls.'};
 fs.writeFileSync(__dirname+'/render_delta_checks.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));process.exitCode=checks.every(x=>x.pass)?0:1;
})().catch(e=>{console.error(e);process.exitCode=2;});
