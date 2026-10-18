// Author: Andrew Fisher. Preserve standing suites; redirect output and block every non-GET request.
const fs=require('fs'),path=require('path'),Module=require('module');
const scrub=s=>String(s).replace(/([?&](?:key|token|access_token)=)[^&\s"'\\]*/gi,'$1REDACTED');
const stdoutWrite=process.stdout.write.bind(process.stdout);process.stdout.write=(chunk,...args)=>stdoutWrite(typeof chunk==='string'?scrub(chunk):chunk,...args);
const target=path.resolve(process.argv[2]),out=process.env.FINAL798_OUT;
if(!out)throw Error('FINAL798_OUT required');
const write=fs.writeFileSync;fs.writeFileSync=function(file,data,...rest){if(/^(equipment|packed|one_tab)_(desktop|phone)\.json$/.test(path.basename(String(file))))file=out;return write.call(this,file,data,...rest);};
const {chromium}=require('playwright'),launch=chromium.launch.bind(chromium);
chromium.launch=async opts=>{const browser=await launch(opts),create=browser.newContext.bind(browser);browser.newContext=async options=>{const ctx=await create(options),route=ctx.route.bind(ctx);ctx.route=async(pattern,handler,options)=>route(pattern,async r=>{if(r.request().method()!=='GET'){if(process.env.FINAL798_TRANSPORT_LOG)fs.appendFileSync(process.env.FINAL798_TRANSPORT_LOG,JSON.stringify({method:r.request().method(),host:new URL(r.request().url()).hostname,path:new URL(r.request().url()).pathname})+'\n');return r.abort();}return handler(r);},options);return ctx;};return browser;};
const suite=new Module(target,module);suite.filename=target;suite.paths=Module._nodeModulePaths(path.dirname(target));suite._compile(fs.readFileSync(target,'utf8'),target);
