/* Author: Andrew Fisher. GET-only native harness; optional hash-checked offline fixtures. */
const fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const dir=path.resolve(__dirname,'../../toolchain/harness');
function fixture(url,method,headers){
 if(method!=='GET'||!process.env.STATE948)return null;
 const u=new URL(url),state=JSON.parse(fs.readFileSync(process.env.STATE948));
 const json=body=>({status:200,contentType:'application/json',body:JSON.stringify(body)});
 if(u.pathname==='/api/state')return json(state);
 if(u.pathname==='/api/version')return json({version:state.version,level:'view'});
 const manifest=JSON.parse(fs.readFileSync(process.env.MANIFEST948));
 if(u.pathname==='/api/machine')return json({ready:true,version:manifest.version,label:manifest.label,entry:manifest.entry,files:manifest.files.length,sha256:manifest.sha256});
 const prefix='/w/Coates-GC500-2026/';if(!u.pathname.startsWith(prefix))return null;
 const name=decodeURIComponent(u.pathname.slice(prefix.length)),item=manifest.files.find(f=>f.path===name);if(!item)return null;
 const file=name==='explorer/assets/plan_items.json'?process.env.ITEMS948:path.join(process.env.MACHINE948,name),body=fs.readFileSync(file);
 if(body.length!==item.bytes||crypto.createHash('sha256').update(body).digest('hex')!==item.sha256)throw Error('Offline machine fixture mismatch: '+name);
 const out={status:200,headers:{'content-type':item.type,'access-control-allow-origin':'*'},body};
 if(headers.range){const r=/^bytes=(\d+)-(\d+)$/.exec(headers.range);if(!r)throw Error('Unexpected test range');const a=+r[1],b=Math.min(+r[2],body.length-1);out.status=206;out.headers['content-range']=`bytes ${a}-${b}/${body.length}`;out.body=body.subarray(a,b+1);}
 return out;
}
const cp=path.join(dir,'curlfetch.js'),c=new Module(cp,module);c.filename=cp;c.paths=Module._nodeModulePaths(dir);let cs=fs.readFileSync(cp,'utf8');
cs=cs.replace(".update(url).digest('hex')",".update(url+'|'+String((headers||{}).range||(headers||{}).Range||'')).digest('hex')");c._compile(cs,cp);require.cache[cp]=c;
const hp=path.join(dir,'open_page.js'),m=new Module(hp,module);m.filename=hp;m.paths=Module._nodeModulePaths(dir);let source=fs.readFileSync(hp,'utf8');
source='const fixture948=('+fixture.toString()+'); const crypto=require("crypto"),path=require("path");\n'+source;
source=source.replace(/const okPost = [^;]+;/,'const okPost = false;');
source=source.replace('counts.blocked++;',"counts.blocked++; (counts.blockedPaths ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});");
source=source.replace('let res; try {',"const local948=fixture948(u,r.method(),r.headers()); if(local948){counts.fixture=(counts.fixture||0)+1;return route.fulfill(local948);} let res; try {");
m._compile(source,hp);module.exports=m.exports;
