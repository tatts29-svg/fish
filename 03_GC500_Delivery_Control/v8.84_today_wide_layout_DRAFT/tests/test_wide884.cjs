// Author: Andrew Fisher. v8.84 Today wide-screen layout: full width, banner band, card grid, titles, focus, print and record preservation; no live writes.
// W sets the desktop width (default 2560, Andrew's wide screen); MOB=1 runs the phone.
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{let s;try{const mob=!!process.env.MOB,W=mob?390:Number(process.env.W||2560),H=mob?844:Number(process.env.H||1370);s=await open({pageFile:process.env.PAGE,W,H,mobile:mob,dpr:mob?2:1});const p=s.page,R=[];const ok=(n,v)=>R.push({name:n,pass:!!v});
await p.waitForFunction(()=>typeof today876Tidy==='function'&&SYNC.status==='live'&&todayWorkHealth840().ready);await p.evaluate(()=>go('today'));await p.waitForTimeout(500);
const wide=W>=1960,cols=mob?1:wide?3:2,contacts=mob?1:wide?4:3;
const m=await p.evaluate(()=>{window.__before884=JSON.stringify([S,moneySummary(),fh866Model()]);
 const pane=document.getElementById('pane-today'),main=document.querySelector('main'),r=pane.getBoundingClientRect(),cs=getComputedStyle(pane);
 const band=pane.querySelector(':scope > .dsnband'),hero=band&&band.querySelector('.bhero'),win=hero.querySelector('.bwin')||hero,br=band.getBoundingClientRect(),hr=hero.getBoundingClientRect(),bcs=getComputedStyle(band);
 const grid=pane.querySelector('.tw840-grid'),gr=grid.getBoundingClientRect(),cards=[...grid.children].filter(c=>c.matches('.tw848-card'));
 const rows={};cards.forEach(c=>{const b=c.getBoundingClientRect();if(c.matches('.tw841-fence-card'))return;(rows[Math.round(b.top)]=rows[Math.round(b.top)]||[]).push(b.height);});
 const fence=grid.querySelector('.tw841-fence-card'),fr=fence&&fence.getBoundingClientRect();
 const titles=[...pane.querySelectorAll('.tw846-title')].map(t=>{const c=getComputedStyle(t),lh=c.lineHeight==='normal'?parseFloat(c.fontSize)*1.3:parseFloat(c.lineHeight);return {text:t.textContent.trim(),oneLine:t.getBoundingClientRect().height<=lh*1.6,fits:t.scrollWidth<=t.clientWidth+1};});
 const padL=parseFloat(cs.paddingLeft),padR=parseFloat(cs.paddingRight);
 return {groups:pane.querySelectorAll('[data-tw848-group-fold]').length,allOpen:[...pane.querySelectorAll('[data-tw848-group-fold]')].every(d=>d.open),
  fullWidth:r.width>=main.clientWidth-parseFloat(getComputedStyle(main).paddingLeft)-parseFloat(getComputedStyle(main).paddingRight)-2,paneWidth:Math.round(r.width),mainWidth:Math.round(main.clientWidth-parseFloat(getComputedStyle(main).paddingLeft)-parseFloat(getComputedStyle(main).paddingRight)),padL,padR,
  bandFull:br.width>=r.width-padL-padR-2,bandDark:/linear-gradient/.test(bcs.backgroundImage),
  heroCentred:Math.abs((hr.left-br.left)-(br.right-hr.right))<=2,heroHeight:Math.round(win.getBoundingClientRect().height),heroCap:win.getBoundingClientRect().height<=innerHeight*0.42+2&&hr.width<=1762,heroInBand:hr.left>=br.left-1&&hr.right<=br.right+1,
  columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,rows:Object.values(rows),equal:Object.values(rows).every(h=>Math.max(...h)-Math.min(...h)<=2),
  fenceFull:!!fr&&Math.abs(fr.width-gr.width)<=2,titles,contacts:getComputedStyle(pane.querySelector('.tm-list')).gridTemplateColumns.split(' ').length,
  tabStop:pane.tabIndex>=0,overflow:document.documentElement.scrollWidth<=innerWidth+2};});
ok('all seven groups present and open',m.groups===7&&m.allOpen);
ok('Today uses the full content width ('+m.paneWidth+' of '+m.mainWidth+' px)',m.fullWidth);
ok('side gutter kept ('+m.padL+' px)',mob?m.padL===12&&m.padR===12:m.padL>=16&&m.padL<=36&&m.padR===m.padL);
ok('banner sits in a full-width dark band',m.bandFull&&m.bandDark);
ok('banner picture centred inside the band',m.heroCentred&&m.heroInBand);
ok('banner picture capped at 42% of the screen height ('+m.heroHeight+' px)',m.heroCap);
ok('progress cards '+cols+' across',m.columns===cols);
ok('cards in a row share one height',m.equal);
ok('Fencing card spans the full row',m.fenceFull);
ok('gauge titles on one line and not clipped',m.titles.length>=6&&m.titles.every(t=>t.oneLine&&t.fits));
ok('contacts '+contacts+' across',m.contacts===contacts);
ok('Today pane is not a keyboard tab stop',!m.tabStop);
const outline=await p.evaluate(()=>{const pane=document.getElementById('pane-today');pane.setAttribute('tabindex','-1');pane.focus({preventScroll:true});const c=getComputedStyle(pane);const v=c.outlineStyle==='none'||parseFloat(c.outlineWidth)===0;pane.blur();pane.removeAttribute('tabindex');return v;});
ok('no focus outline drawn around the whole pane',outline);
ok('no page-wide horizontal overflow',m.overflow);
const first=p.locator('[data-tw840-area]').first();await first.scrollIntoViewIfNeeded();await p.waitForTimeout(350);await p.waitForFunction(()=>TodayWork840.report().running&&!!TodayWork840.report().runningInstrument,null,{timeout:5000}).catch(()=>{});
ok('native automatic instrument animation',await p.evaluate(()=>TodayWork840.report().mode==='auto'&&!!TodayWork840.report().runningInstrument));
const before=await p.evaluate(()=>document.querySelector('main').scrollTop);await p.evaluate(()=>renderToday());await p.waitForTimeout(350);
ok('redraw retains scroll position',Math.abs(await p.evaluate(()=>document.querySelector('main').scrollTop)-before)<4);
ok('redraw keeps the same layout',await p.evaluate(n=>getComputedStyle(document.querySelector('#pane-today .tw840-grid')).gridTemplateColumns.split(' ').length===n,cols));
ok('redraw does not change data or money',await p.evaluate(()=>window.__before884===JSON.stringify([S,moneySummary(),fh866Model()])));
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});const tag=mob?'phone':String(W);await p.evaluate(()=>document.querySelector('main').scrollTop=0);await p.waitForTimeout(300);await p.screenshot({path:process.env.OUT+'/today-'+tag+'.png'});await p.locator('#pane-today .tw840-grid').scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:process.env.OUT+'/cards-'+tag+'.png'});}
await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
ok('print layout untouched by the screen rules',await p.evaluate(()=>!/linear-gradient\(180deg, rgb\(20, 28, 33\)/.test(getComputedStyle(document.querySelector('#pane-today > .dsnband')).backgroundImage)));
await p.emulateMedia({media:'screen'});
ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);
R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));if(R.some(r=>!r.pass))console.log(JSON.stringify(m.rows)+' '+JSON.stringify(m.titles.filter(t=>!t.oneLine||!t.fits)));console.log((mob?'phone':W+' px')+': '+R.filter(r=>r.pass).length+'/'+R.length);if(R.some(r=>!r.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
