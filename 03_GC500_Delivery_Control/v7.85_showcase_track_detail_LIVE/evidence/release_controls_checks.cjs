// Author: Andrew Fisher.
// Run: node evidence/release_controls_checks.cjs [preview781_src.js]
// No browser, GPU, network, live records or messages. Exercise the actual control
// code with an isolated DOM and renderer, including the ordinary View handler.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../preview781_src.js'));
const checks=[];
function check(name,fn){fn();checks.push({name,pass:true});}
function fixture(){
 const nodes=new Map(),observers=[];
 class Element{
  constructor(id){this.id=id;this.attrs=new Map();this.listeners=[];this.options=[];this.value='';this.hidden=false;this.parentNode={appendChild:el=>nodes.set(el.id,el)};}
  setAttribute(k,v){this.attrs.set(k,String(v));}getAttribute(k){return this.attrs.has(k)?this.attrs.get(k):null;}removeAttribute(k){this.attrs.delete(k);}
  addEventListener(name,handler,capture=false){this.listeners.push({name,handler,capture});}
  dispatch(name){const e={stopped:false,stopImmediatePropagation(){this.stopped=true;}};
   for(const l of this.listeners.filter(x=>x.name===name&&x.capture)){l.handler(e);if(e.stopped)return;}
   if(this['on'+name])this['on'+name](e);if(e.stopped)return;
   for(const l of this.listeners.filter(x=>x.name===name&&!x.capture)){l.handler(e);if(e.stopped)return;}
  }
 }
 for(const id of ['showQualityL','showBackdrop','showView','showcase'])nodes.set(id,new Element(id));
 const view=nodes.get('showView');view.options=['hero','auto','onboard','chase','heli','top','wide','detail','frontdetail'].map(value=>({value,hidden:value==='frontdetail',disabled:value==='detail'}));
 view.value='hero';view.setAttribute('aria-label','Camera — which view of the circuit');
 const originalOptions=()=>view.options.map(({value,hidden,disabled})=>({value,hidden,disabled}));
 const optionSnapshot=originalOptions(),store=new Map([['gc500.showback','circuit3d_day'],['gc500.showview','hero']]);
 const storage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const G={GRID:0,M_PER_PT:6,step(){},camStep(){},framedFov(){return 1;},render(){},pose(){},disposeSky781(){},
  V:{lerp:(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t)},
  S:{clock:0,sim:{s:0,v:0},tune:{tc:1},cv:{clientWidth:1280,clientHeight:720},pose:{pos:[0,0,0],fwd:[0,0,1],rt:[1,0,0]},gridS:0,view:'hero',paused:true,calmDrive:false},
  simReset(){this.S.clock=0;this.S.paused=false;},setView(v){this.S.view=v;},
  installTrackDetail781(){},installArchitecture781(){},disposeTrackDetail781(){},disposeArchitecture781(){}};
 const c={window:{GC3D:G},Set,Array,Math,localStorage:storage,SHOW:{playing:false},
  document:{readyState:'complete',getElementById:id=>nodes.get(id)||null,createElement:()=>new Element()},
  MutationObserver:class{constructor(cb){observers.push(cb);}observe(){}},
  showBackPref:()=>storage.getItem('gc500.showback')||'circuit3d',showViewGet:()=>storage.getItem('gc500.showview')||'hero',
  showSetBack(v){storage.setItem('gc500.showback',v);view.value=c.showViewGet();G.setView(view.value);}};
 // Reproduce the existing handler that would otherwise persist a temporary tour camera.
 view.addEventListener('change',()=>{storage.setItem('gc500.showview',view.value);G.setView(view.value);});
 nodes.get('showBackdrop').onchange=()=>c.showSetBack(nodes.get('showBackdrop').value);
 vm.runInNewContext(fs.readFileSync(source,'utf8'),c,{filename:source});
 const button=nodes.get('detail781Button');
 return {G,c,view,store,button,nodes,observers,optionSnapshot,options:originalOptions,
  enter(){button.onclick();},choose(v){view.value=v;view.dispatch('change');},
  assertRestored(){assert.deepEqual(originalOptions(),optionSnapshot);assert.equal(view.value,'hero');assert.equal(view.getAttribute('aria-label'),'Camera — which view of the circuit');assert.equal(store.get('gc500.showview'),'hero');assert.equal(button.textContent,'Track detail');assert.equal(button.getAttribute('aria-pressed'),'false');}};
}
check('entry names the released feature and exposes only four tour cameras',()=>{
 const f=fixture();assert.equal(f.button.textContent,'Track detail');assert.equal(f.button.className,'shbtn');f.enter();
 assert.equal(f.button.textContent,'Leave track detail');assert.equal(f.view.value,'chase');
 assert.deepEqual(f.view.options.filter(o=>!o.hidden&&!o.disabled).map(o=>o.value),['hero','onboard','chase','heli']);
});
check('every supported camera changes the tour frame without persisting a preference',()=>{
 const f=fixture();f.enter();const eyes=new Set();
 for(const name of ['hero','onboard','chase','heli']){f.choose(name);assert.equal(f.G.preview781.camera,name);assert.equal(f.G.S.view,name);eyes.add(JSON.stringify(f.G.S.cam.eye));assert.equal(f.store.get('gc500.showview'),'hero');}
 assert.equal(eyes.size,4);f.button.onclick();f.assertRestored();assert.equal(f.G.S.view,'hero');assert.equal(f.G.S.paused,true);
});
check('ordinary View behaviour resumes after leaving track detail',()=>{
 const f=fixture();f.enter();f.button.onclick();f.choose('top');assert.equal(f.store.get('gc500.showview'),'top');assert.equal(f.G.S.view,'top');
});
check('a deliberate backdrop selection exits detail and restores the prior camera',()=>{
 const f=fixture();f.enter();f.choose('heli');const backdrop=f.nodes.get('showBackdrop');backdrop.value='black';backdrop.dispatch('change');
 f.assertRestored();assert.equal(f.store.get('gc500.showback'),'black');assert.equal(f.G.S.view,'hero');assert.equal(f.G.S.previewLoop781,false);
});
check('closing restores options and preserves an absent backdrop preference',()=>{
 const f=fixture();f.store.delete('gc500.showback');f.enter();f.choose('onboard');f.nodes.get('showcase').hidden=true;for(const cb of f.observers)cb();
 f.assertRestored();assert.equal(f.store.has('gc500.showback'),false);assert.equal(f.G.S.previewLoop781,false);
});
check('repeated tours do not lose the original option visibility or disabled state',()=>{
 const f=fixture();for(let i=0;i<3;i++){f.enter();f.choose('heli');f.button.onclick();f.assertRestored();}
});
console.log(JSON.stringify({author:'Andrew Fisher',source:path.basename(source),checks,passed:checks.length,total:checks.length},null,2));
