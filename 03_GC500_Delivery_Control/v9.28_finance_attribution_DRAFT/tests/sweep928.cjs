/* Author: Andrew Fisher. Standard 21-route sweep with every external write denied. */
const fs=require('fs'),path=require('path'),Module=require('module');
const hp=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),hm=new Module(hp,module);hm.filename=hp;hm.paths=Module._nodeModulePaths(path.dirname(hp));hm._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++; (counts.blockedPaths ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});"),hp);require.cache[hp]=hm;
require(path.resolve(__dirname,'../../toolchain/harness/sweep.js'));
