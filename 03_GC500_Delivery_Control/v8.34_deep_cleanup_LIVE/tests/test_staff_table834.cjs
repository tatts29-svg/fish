// Author: Andrew Fisher. GET-only phone visibility proof; private output required.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page.js');
if(!process.env.PAGE||!process.env.OUT)throw Error('PAGE and private OUT required');
const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',source:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),checks:[],views:[],consoleErrors:[],screenshots:[]};
const save=()=>fs.writeFileSync(path.join(out,'staff-table.json'),JSON.stringify(report,null,2));
const check=(name,pass,detail)=>{report.checks.push({name,pass:!!pass,detail});save();if(!pass)throw Error(name);};
let harness,page,before;
const settle=async()=>{await page.waitForTimeout(250);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
const native=()=>page.evaluate(async()=>{const r=await fetch('/api/state',{headers:{'x-gc500-token':'Coates-GC500-2026'},cache:'no-store'});if(!r.ok)throw Error('Native read failed');return r.json();});
(async()=>{
 harness=await open({pageFile:process.env.PAGE,W:390,H:844,mobile:true,dpr:2});page=harness.page;
 page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text().slice(0,300));});
 await page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 before=await native();fs.writeFileSync(path.join(out,'native-before.json'),JSON.stringify(before));
 for(const width of [390,640]){
  await page.setViewportSize({width,height:844});await page.evaluate(()=>go('costs'));await page.waitForTimeout(1000);
  const fold=page.locator('#pane-costs [data-sfold="costs765|event833"]');
  if(!await fold.evaluate(e=>e.open))await fold.locator(':scope > summary').click();await settle();
  const rows=fold.locator('.event833-table tbody tr'),count=await rows.count();
  check(width+': one row per modelled person',count===await page.evaluate(()=>eventStaffingModel833().rows.length)&&count>0,{count});
  const view={width,rows:[],hours:[]};report.views.push(view);
  for(let index=0;index<count;index++){
   const row=rows.nth(index);
   await row.evaluate(el=>{const wrap=el.closest('.tblwrap');wrap.scrollLeft=wrap.scrollWidth;document.querySelector('main').scrollTop+=el.getBoundingClientRect().top-350;});await settle();
   const result=await row.evaluate((el,index)=>{
    const cell=el.cells[2],name=el.cells[0],wrap=el.closest('.tblwrap'),r=cell.getBoundingClientRect(),w=wrap.getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();
    const expected=eventStaffingModel833().rows[index],cash=expected.knownCost==null?'Unpriced':money(expected.knownCost);
    const point={x:r.left+Math.min(20,r.width/2),y:r.top+Math.min(15,r.height/2)},top=document.elementFromPoint(point.x,point.y);
    return {text:cell.innerText,cash,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},wrapper:{left:w.left,right:w.right,x:wrap.scrollLeft,max:wrap.scrollWidth-wrap.clientWidth},main:{top:main.top,bottom:main.bottom},namePosition:getComputedStyle(name).position,uncovered:top===cell||cell.contains(top)};
   },index);view.rows.push(result);
   check(width+': wage row '+index+' is fully inside the horizontal viewport',result.rect.left>=result.wrapper.left-1&&result.rect.right<=result.wrapper.right+1,result);
   check(width+': wage row '+index+' is uncovered and readable',result.uncovered&&result.namePosition==='static'&&result.text.includes(result.cash)&&result.rect.top>=result.main.top&&result.rect.bottom<=result.main.bottom,result);
   if(index===0||index===count-1){const file=path.join(out,width+'-wage-row-'+index+'.png');await page.screenshot({path:file});report.screenshots.push(file);}
   await row.evaluate(el=>{const cell=el.cells[1],wrap=el.closest('.tblwrap');wrap.scrollLeft+=cell.getBoundingClientRect().left-wrap.getBoundingClientRect().left-8;});await settle();
   const hours=await row.evaluate((el,index)=>{const cell=el.cells[1],wrap=el.closest('.tblwrap'),r=cell.getBoundingClientRect(),w=wrap.getBoundingClientRect(),top=document.elementFromPoint(r.left+15,r.top+15);return{text:cell.innerText,expected:String(eventStaffingModel833().rows[index].paidHours)+' h',left:r.left,right:r.right,wrapLeft:w.left,wrapRight:w.right,uncovered:top===cell||cell.contains(top)};},index);view.hours.push(hours);
   check(width+': planned hours row '+index+' is fully visible and uncovered',hours.left>=hours.wrapLeft-1&&hours.right<=hours.wrapRight+1&&hours.uncovered&&hours.text.includes(hours.expected),hours);
  }
  check(width+': no document overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:641,height:844});await settle();
 check('Wider-screen name-column behaviour is unchanged',await page.locator('.event833-table tbody tr').first().locator('td').first().evaluate(el=>getComputedStyle(el).position==='sticky'));
 check('No browser errors or operational writes',harness.errors.length===0&&report.consoleErrors.length===0&&harness.counts.blocked===0,{errors:harness.errors,consoleErrors:report.consoleErrors,network:harness.counts});
 const after=await native();fs.writeFileSync(path.join(out,'native-after.json'),JSON.stringify(after));
 check('Native record remains unchanged',JSON.stringify(before)===JSON.stringify(after));
})().catch(error=>{report.error=String(error.stack||error);process.exitCode=1;}).finally(async()=>{if(harness){report.errors=harness.errors;report.network=harness.counts;await harness.browser.close();}save();console.log(JSON.stringify({source:report.source,passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,error:report.error}));});
