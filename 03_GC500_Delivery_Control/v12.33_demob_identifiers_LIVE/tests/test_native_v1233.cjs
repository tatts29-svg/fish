// Author: Andrew Fisher. Read-only Demob label checks on the native record.
// PAGE=<candidate> BASE=<verified v12.32> OUT=<private directory> [MOB=1]
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), crypto = require('crypto');
const {open} = require('../../toolchain/harness/open_page');
const base = fs.readFileSync(process.env.BASE, 'utf8');
const source = fs.readFileSync(process.env.PAGE);
const old = base.match(/  function specs\(r\) \{[\s\S]*?(?=  \/\* a chip)/)[0];
const esc = base.split('\n').find(l => l.trim().startsWith('const e1231 ='));
const label = base.split('\n').find(l => l.trim().startsWith('const LABEL = l =>'));
const helper = '(function(){const W=window;' + esc + label + old + ';return {specs,specHtml};})()';
const mobile = process.env.MOB === '1', out = process.env.OUT;
assert(out && path.isAbsolute(out) && !out.startsWith(path.resolve(__dirname, '../../..') + '/'), 'Private OUT required');
fs.mkdirSync(out, {recursive:true, mode:0o700});
(async () => {
  const h = await open({pageFile:process.env.PAGE, hash:'#demob', mobile, W:mobile?390:1440, H:mobile?844:1000, dpr:mobile?2:1});
  const consoleErrors=[];
  h.page.on('console', m => {if(m.type()==='error')consoleErrors.push(m.text());});
  try {
    await h.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status==='live' && window.Ready1231 && typeof demob816==='function', null, {timeout:180000});
    await h.page.evaluate(() => go('demob'));
    const result=await h.page.evaluate(helper => {
      const baseline=eval(helper), checks=[], refs=demob816().refs, stateBefore=JSON.stringify(S);
      const check=(name,ok) => checks.push({name,ok:!!ok});
      let bulk=0,coded=0,ordinary=0,numbered=0,example=null;
      check('references available',refs.length>0);
      for(const r of refs){
        const prev=baseline.specs(r), next=Ready1231.specs(r), holder=document.createElement('div');
        holder.innerHTML=Ready1231.sections([r]);
        const boxes=[...holder.querySelectorAll('.sp1231')];
        check(r.key+' source identifiers unchanged',JSON.stringify(prev.nos)===JSON.stringify(next.nos));
        check(r.key+' specifications unchanged',JSON.stringify(prev.facts)===JSON.stringify(next.facts));
        check(r.key+' specification boxes rendered',boxes.length>0);
        if(next.notNumbered || next.codes.length){
          bulk++;if(next.codes.length)coded++;
          if(!example && next.codes.length && r.iso)example={key:r.key,iso:r.iso};
          for(const box of boxes){
            check(r.key+' recorded codes visible',next.codes.slice(0,6).every(n=>box.textContent.includes(n)));
            check(r.key+' codes labelled separately',!next.codes.length || [...box.querySelectorAll('.an1231')].some(n=>n.textContent.startsWith('Recorded code ')));
            check(r.key+' no false missing asset warning',!next.notNumbered || !box.textContent.includes('Asset no. and size not on record'));
            check(r.key+' no asset label for wholly unnumbered stock',!next.notNumbered || !box.textContent.includes('Asset no.'));
            check(r.key+' empty bulk identifiers say not numbered',!next.notNumbered || next.nos.length || box.textContent.includes('Not numbered'));
          }
        }else{
          ordinary++;if(next.assetNos.length)numbered++;
          const expected=document.createElement('div');expected.innerHTML=baseline.specHtml(r);
          for(const box of boxes)check(r.key+' ordinary rendering unchanged',box.outerHTML===expected.firstElementChild.outerHTML);
        }
      }
      check('bulk records exercised',bulk>0 && coded>0);
      check('ordinary and numbered records exercised',ordinary>0 && numbered>0);
      check('no record changed by rendering',JSON.stringify(S)===stateBefore);
      return {checks,counts:{references:refs.length,bulk,coded,ordinary,numbered},example,recordVersion:SYNC.backend.readVersion821()};
    },helper);
    fs.writeFileSync(path.join(out,'native.json'),JSON.stringify(result,null,2),{mode:0o600});
    assert(result.checks.every(c=>c.ok),'Native identifier or preservation assertion failed');
    if(result.example){
      await h.page.evaluate(x=>{DM816.sel=x.iso;renderDemob816();},result.example);
      const row=h.page.locator('#pane-demob tr[data-row816="'+result.example.key+'"]');
      await row.first().scrollIntoViewIfNeeded();
      await h.page.screenshot({path:path.join(out,'demob-identifiers.png')});
      await row.first().screenshot({path:path.join(out,'bulk-row.png')});
    }
    result.pageErrors=h.errors;result.consoleErrors=consoleErrors;result.network=h.counts;
    result.sourceSha256=crypto.createHash('sha256').update(source).digest('hex');
    fs.writeFileSync(path.join(out,'native.json'),JSON.stringify(result,null,2),{mode:0o600});
    assert.equal(h.errors.length,0);assert.equal(consoleErrors.length,0);assert.equal(h.counts.blocked,0);
    console.log(JSON.stringify({checks:result.checks.length,passed:result.checks.filter(c=>c.ok).length,counts:result.counts,errors:0,consoleErrors:0,blockedWrites:0}));
  }finally{await h.browser.close();}
})().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1;});
