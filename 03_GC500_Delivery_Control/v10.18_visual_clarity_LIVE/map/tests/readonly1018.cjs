/* Author: Andrew Fisher. Fresh public map assets; every non-GET stays blocked. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module');
const harness=path.resolve(__dirname,'../../../record_14Oct2026_purchase_order/readonly_page.cjs'),mod=new Module(harness,module);
mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
const hook=`
    if(r.method()==='GET'&&new URL(u).origin===HOST&&/\\/explorer\\/[^/]+\\.(js|html)$/.test(new URL(u).pathname)){
      const name=new URL(u).pathname.split('/').pop(),file=process.env.MAP_CODE&&require('path').join(process.env.MAP_CODE,name);
      if(file&&fs.existsSync(file))return route.fulfill({status:200,contentType:name.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(file)});
      const fresh=new URL(u);fresh.searchParams.set('_visual1018',String(Date.now()));return route.fulfill(await curlFetch(fresh.href,r.headers(),'GET'));
    }
`;
mod._compile(fs.readFileSync(harness,'utf8').replace('    const okPost =',hook+'    const okPost ='),harness);
module.exports=mod.exports;
