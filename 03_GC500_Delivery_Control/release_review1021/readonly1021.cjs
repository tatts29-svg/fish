/* Author: Andrew Fisher. Strict GET-only combined page and machine preview; no operational writes. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module');
const harness=path.resolve(__dirname,'../record_14Oct2026_purchase_order/readonly_page.cjs'),mod=new Module(harness,module);
mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
const hook=`
    if(r.method()==='GET'&&new URL(u).origin===HOST&&new URL(u).pathname.startsWith('/w/Coates-GC500-2026/')){
      const rel=new URL(u).pathname.slice('/w/Coates-GC500-2026/'.length), file=process.env.MAP_ROOT&&require('path').join(process.env.MAP_ROOT,rel);
      if(file&&fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({status:200,contentType:rel.endsWith('.html')?'text/html':rel.endsWith('.json')?'application/json':'application/javascript',body:fs.readFileSync(file)});
      if(/\\.(js|html|json)$/.test(rel)){const fresh=new URL(u);fresh.searchParams.set('_review1021',String(Date.now()));return route.fulfill(await curlFetch(fresh.href,r.headers(),'GET'));}
    }
`;
const text=fs.readFileSync(harness,'utf8');if(text.split('    const okPost =').length!==2)throw Error('GET-only harness anchor changed');
mod._compile(text.replace('    const okPost =',hook+'    const okPost ='),harness);module.exports=mod.exports;
