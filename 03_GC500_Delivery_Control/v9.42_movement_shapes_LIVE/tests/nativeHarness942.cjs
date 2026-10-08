// Author: Andrew Fisher. GET-only native harness, optional same-record baseline replay.
const fs=require('fs'),path=require('path'),Module=require('module');
const hp=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),m=new Module(hp,module);m.filename=hp;m.paths=Module._nodeModulePaths(path.dirname(hp));let source=fs.readFileSync(hp,'utf8');
if(!source.includes('const okPost =')||!source.includes('counts.blocked++;'))throw Error('Review harness');
source=source.replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++; (counts.blockedPaths ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});");
source=source.replace("if (u.startsWith('data:')",`if(process.env.RECORD942&&r.method()==='GET'&&['/api/state','/api/version'].includes(new URL(u).pathname)){const snap=JSON.parse(fs.readFileSync(process.env.RECORD942));const data=new URL(u).pathname==='/api/state'?snap:{version:snap.version,level:'view'};counts.fixture=(counts.fixture||0)+1;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});} if (u.startsWith('data:')`);
m._compile(source,hp);module.exports=m.exports;
