/* Author: Andrew Fisher. Exercise the actual bridge and viewer visibility gate. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),cp=require('child_process'),path=require('path');
const source=fs.readFileSync(process.argv[2],'utf8'),viewer=fs.readFileSync(process.argv[3],'utf8');
const script=path.join(__dirname,'patch_hidden1065.py');
const patched=cp.execFileSync('python3',['-c',`import sys;sys.path.insert(0,${JSON.stringify(__dirname)});from patch_hidden1065 import apply;print(apply(sys.stdin.read()),end='')`],{input:source,encoding:'utf8'});
const expr=s=>{const m=s.match(/active: \(\) => ([^,\n]+),/);assert(m);return m[1];};
const gate=viewer.match(/const live = \(\) => ([^;]+);/)[1];
let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const live=(text,in3d,shown,hidden=false,embedded=true)=>{
 const window={GC500Explorer:{shown:()=>shown}},bridge={active:()=>Function('in3d','window','return '+expr(text))(in3d,window)};
 return Function('document','EMBED3D','bridge','return '+gate)({hidden},embedded,()=>bridge);
};
check('original reproduces hidden embedded viewer staying active',()=>assert.equal(live(source,true,false),true));
check('patched visible selected 3D remains active',()=>assert.equal(live(patched,true,true),true));
check('patched hidden host suspends equipment work',()=>assert.equal(live(patched,true,false),false));
check('returning to host resumes equipment work',()=>assert.equal(live(patched,true,true),true));
check('2D mode keeps equipment suspended',()=>assert.equal(live(patched,false,true),false));
check('hidden browser document stays suspended',()=>assert.equal(live(patched,true,true,true),false));
check('standalone 3D keeps existing visibility behaviour',()=>assert.equal(live(patched,false,false,false,false),true));
check('missing explorer during startup does not activate viewer',()=>assert.equal(Function('in3d','window','return '+expr(patched))(true,{}),false));
check('partial explorer during startup does not activate viewer',()=>assert.equal(Function('in3d','window','return '+expr(patched))(true,{GC500Explorer:{}}),false));
check('patch refuses to repeat',()=>assert.throws(()=>cp.execFileSync('python3',[script,'/dev/stdin'],{input:patched,stdio:['pipe','pipe','pipe']})));
console.log(checks+' lifecycle checks passed');
