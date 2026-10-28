/* Author: Andrew Fisher. PRIVATE REVIEW PREVIEW, not a publication candidate.
 * Only the existing edit-authorised tracker reader supplies report data.
 * Public-view capability is deliberately unchanged. */
(function(root){
'use strict';
const DAYS=['2026-10-23','2026-10-24','2026-10-25'];
const LABELS=['Friday 23 October','Saturday 24 October','Sunday 25 October'];
let container=null, reports=[], snapshot=null, flight=null, timer=0, generation=0, lastRead=0;
let observer=null;const frames=new Map();
const pane=()=>document.getElementById('pane-servicing');
const editable=()=>typeof capability==='function'&&capability()==='edit'&&typeof SYNC!=='undefined'&&!SYNC.readonly&&SYNC.claims!=='view'&&SYNC.level==='edit'&&SYNC.backend&&typeof SYNC.backend.ticks==='function';
const visible=()=>!!(pane()&&pane().classList.contains('on')&&!document.hidden);
const reader=SvcAdminReader.create(q=>{if(!editable())throw Error('Connect the edit link to read the night reports.');return SYNC.backend.ticks(q);});
function author(){return typeof DATA==='object'&&DATA&&DATA.brand&&DATA.brand.author||'';}
function reportInput(s,day){return {D:SvcScope1170.active(SVC1067_DATA),S:SvcState,C:typeof SvcCrews1173==='object'?SvcCrews1173:null,crewData:SVC1067_CARD.data,events:s.events,now:Date.parse(s.meta.now),read:Date.parse(s.meta.now),day,meta:{load:s.meta.load,title:s.meta.title,card_withdrawn:!!s.meta.card_withdrawn,expired:!!s.meta.expired}};}
function validTracker(t){
 if(!t||!Array.isArray(t.lines)||!Array.isArray(t.days))return false;
 const want=SVC1067_DATA.areas.flatMap(a=>a.refs.flatMap(r=>r.lines.map(l=>[l.id,r.ref,l.kind,l.qty].join('|')))).sort();
 const got=t.lines.map(l=>[l.id,l.ref,l.kind,l.qty].join('|')).sort();
 const days=d=>d.map(x=>x.id+':'+x.plan).sort().join('|');
 return JSON.stringify(want)===JSON.stringify(got)&&days(SVC1067_DATA.days)===days(t.days)&&Object.keys(SVC1067_DATA.plans).every(k=>t.plans&&t.plans[k]&&Object.keys(SVC1067_DATA.plans[k]).every(p=>Array.isArray(t.plans[k][p])&&t.plans[k][p].join('|')===SVC1067_DATA.plans[k][p].join('|')));
}
function clear(){generation++;clearTimeout(timer);timer=0;reader.clear();reports=[];snapshot=null;lastRead=0;frames.clear();if(observer)observer.disconnect();observer=null;if(container)container.remove();container=null;if(pane()&&pane().classList.contains('svc1252-active'))pane().classList.remove('svc1252-active');}
function faces(){const el=document.getElementById('fonts1066'),css=String(el&&el.textContent||''),out=[],re=/@font-face\{font-family:("[^"]+");font-style:(\w+);font-weight:(\d+);[^}]*?src:url\("\/m\/[^/"]+\/([^"]+)"\)/g;let m;while((m=re.exec(css)))out.push({family:JSON.parse(m[1]),style:m[2],weight:m[3],url:location.origin+'/m/Coates-GC500-2026/'+m[4]});return out;}
function fontsInto(w){return Promise.all(faces().map(f=>root.fetch(f.url,{cache:'force-cache'}).then(r=>r.ok?r.arrayBuffer():null).then(b=>{if(!b||!w.FontFace)return;const ff=new w.FontFace(f.family,b,{style:f.style,weight:f.weight});w.document.fonts.add(ff);return ff.load();}).catch(()=>null))).then(()=>null);}
function writeReport(w,R,noBar){w.document.open();w.__fonts1202=fontsInto(w);w.document.write(report1202.html(R,{author:author(),noBar:!!noBar}));w.document.close();}
function fitFrame(frame){if(!frame.isConnected)return;try{const d=frame.contentDocument;if(!d)return;const sheets=[...d.querySelectorAll('.sheet')];if(!sheets.length)return;const height=Math.ceil(Math.max(...sheets.map(n=>n.getBoundingClientRect().bottom))+16);if(height>0&&Math.abs(frame.offsetHeight-height)>1)frame.style.height=height+'px';}catch(e){}}
function loadReport(card){const day=card.dataset.night1252,R=reports.find(r=>r.day.id===day);if(!R||frames.has(day)||!editable()||!card.open)return;const mount=card.querySelector('.svc1252-report'),f=document.createElement('iframe');f.title='Coates GC500 Night report — '+LABELS[DAYS.indexOf(day)]+' 2026';f.setAttribute('scrolling','no');f.style.height='240px';mount.replaceChildren(f);frames.set(day,f);const w=f.contentWindow;writeReport(w,R,true);Promise.resolve(w.__pg1202).then(()=>{if(!f.isConnected||!editable()||f.contentWindow!==w)return;fitFrame(f);w.addEventListener('resize',()=>requestAnimationFrame(()=>fitFrame(f)));}).catch(()=>{if(f.isConnected&&editable())card.querySelector('.svc1252-status').textContent='The report could not finish loading. Reload this page to retry.';});}
function print(day){if(!editable()){clear();return;}const R=reports.find(r=>r.day.id===day);if(!R)return;const w=root.open('','_blank');const status=container&&container.querySelector('[data-print-status="'+day+'"]');if(!w){if(status)status.textContent='Allow pop-ups for this site, then tap Print / PDF again.';return;}if(status)status.textContent='';writeReport(w,R,false);try{w.focus();}catch(e){}}
function mount(){if(!pane()||!editable())return false;if(!container){container=document.createElement('div');container.id='svc1252';DAYS.forEach((day,i)=>{const card=document.createElement('details');card.className='svc1252-night';card.dataset.night1252=day;card.open=false;card.innerHTML='<summary class="svc1252-heading"><h3>'+LABELS[i]+'<small>2026 · Night report</small></h3><button type="button" class="svc1252-print" data-ro disabled>Print / PDF</button></summary><p class="svc1252-status" data-print-status="'+day+'" role="status"></p><div class="svc1252-report"><p class="svc1252-wait">Reading the saved night report…</p></div>';card.querySelector('button').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();print(day);});card.addEventListener('toggle',()=>{if(card.open)loadReport(card);});container.appendChild(card);});pane().appendChild(container);}if(!pane().classList.contains('svc1252-active'))pane().classList.add('svc1252-active');return true;}
function draw(){if(!editable())return false;if(!visible())return true;return mount();}
function schedule(){clearTimeout(timer);timer=0;if(editable()&&visible())timer=setTimeout(wake,30000);}
async function refresh(){
 const token=generation;
 try{const listing=await SYNC.backend.ticks({});if(token!==generation||!editable())return;const matches=(listing.trackers||[]).filter(t=>t.load==='servicing-tracker:GC500-2026'&&t.tracker&&!t.card_withdrawn);if(matches.length!==1)throw Error(matches.length?'More than one event tracker needs review.':'The event tracker is not available.');const s=await reader.read(matches[0].token);if(token!==generation||!editable())return;if(!validTracker(s.meta.tracker)||s.meta.load!=='servicing-tracker:GC500-2026')throw Error('The event tracker does not match this page.');if(!Number.isFinite(Date.parse(s.meta.now)))throw Error('The service clock could not be verified.');
 const next=DAYS.map(day=>report1202.model(reportInput(s,day)));if(next.some((R,i)=>R.day.id!==DAYS[i]||R.test))throw Error('The three event nights could not be verified.');
 snapshot=s;lastRead=Date.now();const same=JSON.stringify(reports.map(r=>({...r,asAt:0,read:0})))===JSON.stringify(next.map(r=>({...r,asAt:0,read:0})));reports=next;if(!mount())return;
 if(!same){frames.clear();if(observer)observer.disconnect();observer=null;container.querySelectorAll('[data-night1252]').forEach(card=>{card.querySelector('button').disabled=false;const report=card.querySelector('.svc1252-report');report.innerHTML='<p class="svc1252-wait">Night report ready</p>';report.style.minHeight=Math.ceil(2274*Math.min(1,(card.clientWidth-12)/794))+'px';});
 if(typeof IntersectionObserver==='function'){observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){loadReport(e.target);observer.unobserve(e.target);}}),{rootMargin:'600px'});container.querySelectorAll('[data-night1252]').forEach(card=>observer.observe(card));}else container.querySelectorAll('[data-night1252]').forEach(loadReport);
 }container.querySelectorAll('.svc1252-status').forEach(n=>n.textContent='');
 }catch(e){if(container)container.querySelectorAll('.svc1252-status').forEach(n=>n.textContent=(reports.length?'Last verified report retained. ':'')+String(e.message||e));}
 finally{schedule();}
}
function wake(){if(!editable()){clear();return;}if(!visible()){clearTimeout(timer);timer=0;return;}mount();if(flight||Date.now()-lastRead<30000){schedule();return;}flight=refresh().finally(()=>{flight=null;});}
root.ServicingPreview1252=Object.freeze({draw,wake,print,models:()=>editable()?reports:[],reportInput,validTracker});
const oldApply=root.applyCapability;if(typeof oldApply==='function')root.applyCapability=function(){const result=oldApply.apply(this,arguments);if(!editable())clear();else wake();return result;};
root.addEventListener('hashchange',wake);document.addEventListener('visibilitychange',wake);root.addEventListener('pagehide',()=>clearTimeout(timer));
const p=pane();if(p)new MutationObserver(wake).observe(p,{attributes:true,attributeFilter:['class']});wake();
})(window);
