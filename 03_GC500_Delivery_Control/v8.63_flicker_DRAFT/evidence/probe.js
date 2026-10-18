// Flicker probe: open each tab by clicking its nav button and record, every animation frame for 2.5 s,
// what the pane does: removed/added nodes, running animations (with target + keyframes), pane height, scroll.
const path='/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page';
const {open}=require(path);
(async()=>{const MOB=!!process.env.MOB;
const s=await open(MOB?{pageFile:process.env.PAGE,W:390,H:844,dpr:2,mobile:true}:{pageFile:process.env.PAGE,W:1440,H:900});
const p=s.page;
await p.waitForFunction(()=>typeof go==='function'&&typeof TABS!=='undefined',null,{timeout:150000});await p.waitForTimeout(4000);
await p.evaluate(()=>{window.__fl={on:false,frames:[],muts:[]};
 const mo=new MutationObserver(list=>{if(!__fl.on)return;for(const m of list){if(m.type==='childList'&&(m.removedNodes.length||m.addedNodes.length)){const t=m.target;__fl.muts.push({t:Math.round(performance.now()-__fl.t0),tgt:(t.id?'#'+t.id:'')+(t.className&&typeof t.className==='string'?'.'+t.className.split(' ').slice(0,2).join('.'):'')+'<'+t.tagName,rm:m.removedNodes.length,add:m.addedNodes.length});}
  else if(m.type==='attributes'){const t=m.target;__fl.muts.push({t:Math.round(performance.now()-__fl.t0),attr:m.attributeName,tgt:(t.id?'#'+t.id:'')+'<'+t.tagName,v:String(t.getAttribute(m.attributeName)).slice(0,60)});}}});
 mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','style']});
 window.__flStart=k=>{__fl={on:true,frames:[],muts:[],t0:performance.now(),k};const pane=()=>document.getElementById('pane-'+k);
  const tick=()=>{if(!__fl.on)return;const pn=pane();const an=document.getAnimations().filter(a=>a.playState==='running');
   __fl.frames.push({t:Math.round(performance.now()-__fl.t0),h:pn?pn.offsetHeight:-1,vis:pn?!pn.hidden:false,sy:Math.round(scrollY),
    op:pn?getComputedStyle(pn).opacity:null,
    an:an.length,anT:[...new Set(an.slice(0,8).map(a=>{const e=a.effect&&a.effect.target;return (a.animationName||a.transitionProperty||'?')+'@'+(e?(e.id||e.className||e.tagName).toString().slice(0,40):'')}))]});
   requestAnimationFrame(tick)};requestAnimationFrame(tick)};
 window.__flStop=()=>{__fl.on=false;return __fl};});
const tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
const only=process.env.TABS?process.env.TABS.split(','):tabs;
const out={};
for(const k of only){ if(k==='map')continue;
 await p.evaluate(()=>go('timeline'));await p.waitForTimeout(1500);if(k==='timeline'){await p.evaluate(()=>go('plant'));await p.waitForTimeout(1500);}
 await p.evaluate(k=>__flStart(k),k);
 await p.evaluate(k=>{const b=[...document.querySelectorAll('[data-tab="'+k+'"],[data-k="'+k+'"]')].find(x=>x.offsetParent);if(b)b.click();else go(k);},k);
 await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>__flStop());
 out[k]=r;}
console.log(JSON.stringify(out));await s.browser.close();})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
