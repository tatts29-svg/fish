// Author: Andrew Fisher. Parse and link local ES modules without evaluating or drawing them.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(process.argv[2]), known = new Set(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')));
const modules = new Map(), syntaxErrors = [], dependencies = [], importsMissing = [], linkingErrors = [];
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
for (const file of walk(root).filter(f => /\.m?js$/.test(f))) {
  const name = path.relative(root,file).replaceAll(path.sep,'/');
  try { modules.set(name,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{identifier:name})); }
  catch(e) { syntaxErrors.push({path:name,error:e.message}); }
}
function resolve(specifier, parent) {
  if (specifier === 'three') return 'vendor/three.module.js';
  if (specifier.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(parent),specifier));
  return specifier;
}
for (const [name,mod] of modules) for(const spec of mod.dependencySpecifiers) {
  const target=resolve(spec,name), row={path:name,specifier:spec,target,inUnion:known.has(target),local:modules.has(target)};
  dependencies.push(row); if(!row.inUnion) importsMissing.push(row);
}
(async()=>{
  for(const rootName of ['car-app.js','app.js']) {
    const mod=modules.get(rootName); if(!mod) continue;
    try { if(mod.status==='unlinked') await mod.link((spec,parent)=>{
      const target=resolve(spec,parent.identifier), child=modules.get(target);
      if(!child) throw Error('Missing local module '+target+' imported by '+parent.identifier);
      return child;
    }); } catch(e) { linkingErrors.push({root:rootName,error:e.message}); }
  }
  process.stdout.write(JSON.stringify({author:'Andrew Fisher',modules:modules.size,syntaxErrors,dependencies,importsMissing,linkingErrors,evaluated:false},null,2)+'\n');
  if(syntaxErrors.length||importsMissing.length||linkingErrors.length) process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
