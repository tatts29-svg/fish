/* Author: Andrew Fisher. Optional source regeneration: npm ci, then node derive_constructors.cjs base_live.html. */
// Build-time only: preserve each constructor's lexical scope and original synchronous API.
const fs=require('fs'),acorn=require('acorn');
const names=new Set(['init','loadPack','setBuildings','setStands','dressCircuit','buildTrackDetail','raceCarModel','syncRaceCarQuality','makePrograms']);
const input=fs.readFileSync(process.argv[2],'utf8'),scripts=[...input.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/g)].map(x=>x[1]);
const edits=[];const crypto=require('crypto');
for(const filename of ['script5.js','script8.js','script30.js']){
 const s=scripts[Number(filename.match(/\d+/)[0])],ast=acorn.parse(s,{ecmaVersion:'latest'});
 const children=n=>Object.values(n).flatMap(v=>Array.isArray(v)?v.filter(x=>x&&typeof x.type==='string'):v&&typeof v.type==='string'?[v]:[]).sort((a,b)=>a.start-b.start);
 const raw=n=>s.slice(n.start,n.end);
 let currentName='';function transform(n,root=false){
  if(!n)return '';
  if(/Function/.test(n.type)&&!root)return raw(n);
  if(n.type==='VariableDeclarator'&&currentName==='buildTrackDetail'&&n.id.name==='run')return 'run=function*('+n.init.params.map(raw).join(',')+')'+transform(n.init.body);
  if(n.type==='CallExpression'&&currentName==='buildTrackDetail'&&n.callee.name==='run')return '(yield* run('+n.arguments.map(x=>transform(x)).join(',')+'))';
  if(n.type==='CallExpression'){
   const c=n.callee;
   if(c.type==='MemberExpression'&&c.property.name==='forEach'&&n.arguments.length===1&&/Function/.test(n.arguments[0].type)&&n.arguments[0].body.type==='BlockStatement'){
    const f=n.arguments[0];return '(yield* G.eachSteps1157('+transform(c.object)+', function*('+f.params.map(raw).join(',')+')'+transform(f.body)+', this))';
   }
   if(c.type==='MemberExpression'&&c.object.name==='G'&&names.has(c.property.name))return '(yield* G.'+c.property.name+'Steps1157('+n.arguments.map(x=>transform(x)).join(',')+'))';
   if(c.type==='Identifier'&&['init','load'].includes(c.name))return '(yield* '+c.name+'Steps1157('+n.arguments.map(x=>transform(x)).join(',')+'))';
   if(c.type==='MemberExpression'&&['original','init','load','setBuildings'].includes(c.object.name)&&['apply','call'].includes(c.property.name))return '(yield* '+c.object.name+'Steps1157.'+c.property.name+'('+n.arguments.map(x=>transform(x)).join(',')+'))';
  }
  if(n.type==='BlockStatement')return '{\n'+n.body.map(x=>transform(x)+(!['ReturnStatement','ThrowStatement','BreakStatement','ContinueStatement','FunctionDeclaration'].includes(x.type)?'\nif(G.due1157())yield;':'')).join('\n')+'\n}';
  if(['ForStatement','ForOfStatement','ForInStatement','WhileStatement','DoWhileStatement'].includes(n.type)){
   const body=transform(n.body);return generic(n,new Map([[n.body,'{if(G.due1157())yield;'+body+'}']]));
  }
  return generic(n);
 }
 function generic(n,over=new Map()){
  let out='',pos=n.start;
  for(const c of children(n)){if(c.start<pos)continue;out+=s.slice(pos,c.start)+(over.has(c)?over.get(c):transform(c));pos=c.end;}
  return out+s.slice(pos,n.end);
 }
 function scan(n){
  if(filename==='script30.js'&&n.type==='FunctionDeclaration'&&n.id.name==='prepare'){currentName='visibility';const before=raw(n),gen='G.visibilitySteps1157=function*('+n.params.map(raw).join(',')+')'+transform(n.body)+';';edits.push({label:'visibility preparation',head:'function prepare(mesh){',length:before.length,sha256:crypto.createHash('sha256').update(before).digest('hex'),prefix:'',generator:gen});}

  if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.name==='G'&&names.has(n.left.property.name)&&n.right.type==='FunctionExpression'){
   const name=n.left.property.name,f=n.right;currentName=name;let body=transform(f.body);
   if(name==='makePrograms'){
    const obj=f.body.body.find(x=>x.type==='ReturnStatement').argument;
    body='{const programs={};'+obj.properties.map(p=>'programs.'+p.key.name+'=(yield* G.programSteps1157('+p.value.arguments.map(raw).join(',')+'));yield;').join('\n')+'return programs;}';
   }
   if(name==='init'&&body.includes('S.raceProgram=program(S.gl)'))body=body.replace('S.raceProgram=program(S.gl)',"S.raceProgram=(yield* G.programSteps1157(S.gl,VS,FS,['uVP','uModel','uEye','uColor','uRough','uMetal','uKind','uPanel','uDay','uBrake','uOpacity','uFog','uAtlas','uDetail781','uSurface800',...(G.raceReflectionUniformNames||[])]))");
   const gen='G.'+name+'Steps1157=function*('+f.params.map(raw).join(',')+')'+body+';';
   let before=raw(n)+';',after=before+'\n'+gen;
   const aliases={};for(const a of ['init','load','original','setBuildings'])if(new RegExp('(?<![.\\w])'+a+'Steps1157').test(gen))aliases[a]=true;
   if(Object.keys(aliases).length){
    // Capture the previous generator beside the existing synchronous wrapper.
    const prefix=Object.keys(aliases).map(a=>'const '+a+'Steps1157=G.'+(a==='load'?'loadPack':['original','setBuildings'].includes(a)?'setBuildings':'init')+'Steps1157;').join('\n');
    after=prefix+'\n'+after;
   }
   new Function(gen.replace('G.','var __unused=')); // syntax checked independently below
   edits.push({label:name+' '+filename+' '+n.start,head:before.slice(0,before.indexOf('{')+1),length:before.length,sha256:crypto.createHash('sha256').update(before).digest('hex'),prefix:after.slice(0,after.indexOf(before)),generator:gen});
  }
  for(const c of children(n))scan(c);
 }
 scan(ast);
}
fs.writeFileSync(__dirname+'/constructors1157.json',JSON.stringify(edits,null,1));console.log(edits.map(x=>[x.label,x.generator.length]));
