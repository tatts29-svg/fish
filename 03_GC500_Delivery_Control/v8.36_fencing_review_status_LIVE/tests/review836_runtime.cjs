/* Author: Andrew Fisher. Generic read-only release practice checks.
 * Private inputs/results are supplied through environment variables; no real
 * docket, purchase-order, location, commercial value or source path lives here.
 * Run only after the candidate and source assets are frozen, under the shared
 * browser flock. The standard harness aborts operational writes.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '../..');
const {open} = require(path.join(project, 'toolchain/harness/open_page.js'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const normal = value => Array.isArray(value) ? value.map(normal) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, normal(value[key])])) : value;
const stable = value => JSON.stringify(normal(value));
const env = key => {assert.ok(process.env[key], key + ' is required');return process.env[key];};
const out = path.resolve(env('OUT_DIR'));
assert.ok(!out.startsWith(project + path.sep), 'Results must be outside the repository');
assert.equal(process.env.GC500_ASSETS_READY, '1', 'Wait for the owner to freeze candidate and assets');
const inputs = {
  base:{path:env('BASE'), expected:env('BASE_SHA256')},
  candidate:{path:env('PAGE'), expected:env('PAGE_SHA256')},
  fixture:{path:env('REVIEW_INPUT'), expected:env('REVIEW_SHA256')}
};
const fixture = JSON.parse(fs.readFileSync(inputs.fixture.path));
// Media and page counts come from original bytes, not the implementation under test.
const sourceMedia = JSON.parse(execFileSync('python3',['-c',
  'import json,sys; from pathlib import Path; from pypdf import PdfReader; from PIL import Image\n'+
  'x=json.load(open(sys.argv[1])); result={}\n'+
  'for s in x["sources"]:\n'+
  ' raw=Path(s["path"]).read_bytes()\n'+
  ' if raw.startswith(b"%PDF-"): result[s["id"]]={"media_type":"application/pdf","pages":len(PdfReader(s["path"]).pages)}\n'+
  ' elif raw.startswith(b"\\xff\\xd8\\xff"):\n'+
  '  im=Image.open(s["path"]); assert im.format=="JPEG"; im.verify(); result[s["id"]]={"media_type":"image/jpeg","pages":1}\n'+
  ' else: raise ValueError("Unsupported original media")\n'+
  'print(json.dumps(result))',
  inputs.fixture.path],{encoding:'utf8'}));
const asAt = env('AS_AT');
assert.match(asAt, /^\d{4}-\d{2}-\d{2}$/);
fs.mkdirSync(out, {recursive:true});
const report = {author:'Andrew Fisher', scope:'Candidate practice; all operational writes blocked',
  inputs, asAt, checks:[], runs:[], screenshots:[], pass:false};
const save = () => fs.writeFileSync(path.join(out,'review836-runtime.json'), JSON.stringify(report,null,2)+'\n');
const check = (name, pass, detail) => {report.checks.push({name,pass:!!pass,detail});save();assert.ok(pass,name);};
const privateSave = (name, value) => fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(value,null,2)+'\n');
const compact = value => ({sha256:sha(stable(value))});

async function native(page) {
  return page.evaluate(async () => {
    const response=await fetch('/api/state',{headers:{'x-gc500-token':'Coates-GC500-2026'},cache:'no-store'});
    if(!response.ok)throw Error('Native GET failed: '+response.status);
    const record=await response.json();
    if(!Number.isInteger(record.version)||!record.docs)throw Error('Incomplete native record');
    return record;
  });
}

async function models(page) {
  return page.evaluate(asAt => JSON.parse(JSON.stringify({
    data:DATA, native:S,
    money:moneySummary(asAt), job:cj764Model(), pl:pl770Model(), scope:scopeFigures(),
    finance:Object.fromEntries(['2026-09','2026-10','2026-11'].map(m=>[m,acc761Model(m)])),
    earned:Object.fromEntries(['2026-09','2026-10','2026-11'].map(m=>[m,acc763Sums(acc761Model(m))])),
    wages:fin745Rows(asAt), staff:eventStaffingModel833(), forecast:buildingTransportModel831(),
    fencePaid:fencePaidSplit(), red:allDockets(), green:serviceNoteRows(), blue:collectionRows(),
    source:Object.fromEntries(['costDocket','fenceRateFor','fenceCostFor','allDockets','serviceNoteRows',
      'collectionRows','fencePaidSplit','moneySummary_','cj764Model','pl770Model','acc761Model',
      'scopeFigures','fin745Rows','eventStaffingModel833','buildingTransportModel831',
      'docketPapersOf','docketPapersByName'].map(name=>[name,eval(name).toString()]))
  },(key,value)=>value instanceof Map?Object.fromEntries(value):value instanceof Set?[...value]:value)),asAt);
}

async function boundaries(page,label) {
  const results=await page.evaluate(() => {
    const hash='a'.repeat(64), pageHash='b'.repeat(64), summaryHash='c'.repeat(64);
    const make=()=>{
      const expected={date:'2030-01-02',location:'Synthetic location',quantities:{clean:12.5},components:{mesh_panel:5}};
      const row={record_id:'fixture-record',docket_no:'900001',book:'red',expected,
        reviewed_on:'2030-01-04',original:{source_id:'original.pdf',page:1,page_sha256:pageHash},
        summary:{source_id:'summary.pdf'},po:{number:'89000001',basis:'source_summary',source_id:'summary.pdf'},
        query:{open:true,text:'Synthetic reconciliation query'}};
      return {record:{id:row.record_id,docket_no:row.docket_no,book:row.book,...structuredClone(expected)},
        input:{schema:1,rows:[row],sources:[{id:'original.pdf',sha256:hash,pages:2,media_type:'application/pdf',title:'Original'},
          {id:'summary.pdf',sha256:summaryHash,pages:1,media_type:'application/pdf',title:'Summary'}]},
        files:{'original.pdf':{sha256:hash},'summary.pdf':{sha256:summaryHash}}};
    };
    const cases=[
      ['exact',()=>{},true],
      ['changed location',f=>{f.record.location+=' changed';}],
      ['changed quantity',f=>{f.record.quantities.clean=15;}],
      ['changed components',f=>{f.record.components.mesh_panel=6;}],
      ['changed date',f=>{f.record.date='2030-01-03';}],
      ['wrong record identity',f=>{f.record.id='other';}],
      ['wrong number',f=>{f.record.docket_no='900002';}],
      ['duplicate reviewed identity',f=>{f.input.rows.push(structuredClone(f.input.rows[0]));}],
      ['duplicate native identity',f=>{f.records=[f.record,structuredClone(f.record)];}],
      ['native number collision',f=>{f.records=[f.record,{...structuredClone(f.record),id:'other'}];}],
      ['duplicate source identity',f=>{f.input.sources.push(structuredClone(f.input.sources[0]));}],
      ['unsupported inherited book',f=>{f.record.book=f.input.rows[0].book='__proto__';}],
      ['changed original checksum',f=>{f.files['original.pdf'].sha256='d'.repeat(64);}],
      ['changed summary checksum',f=>{f.files['summary.pdf'].sha256='d'.repeat(64);}],
      ['missing registry',f=>{f.files=null;}],
      ['missing source registry entry',f=>{delete f.files['original.pdf'];}],
      ['missing summary checksum',f=>{delete f.files['summary.pdf'].sha256;}],
      ['non-string checksum',f=>{f.files['original.pdf'].sha256=42;}],
      ['page outside pack',f=>{f.input.rows[0].original.page=3;}],
      ['no documented allocation',f=>{f.input.rows[0].po=null;},true],
      ['no open charge query',f=>{f.input.rows[0].query.open=false;},true]
    ];
    return cases.map(([name,mutate,current=false])=>{
      const f=make();mutate(f);const before=JSON.stringify(f);
      try{
        const model=fencingReview836(f.record,f.input,f.files,f.records||null);
        const success=current?model.state==='current'&&!!model.po===(name!=='no documented allocation')
          :model.state!=='current'&&model.po==null&&model.reviewedOn==null;
        const closed=name!=='no open charge query'||!fenceReviewStatus836(model).includes('Charges: query open');
        return {name,pass:success&&closed&&before===JSON.stringify(f),state:model.state};
      }catch(error){return {name,pass:false,error:String(error)};}
    });
  });
  for(const result of results)check(label+': source boundary '+result.name,result.pass,result);
}

async function cards(page,label,mobile) {
  const rows=await page.evaluate(() => {
    const records=[...allDockets(),...serviceNoteRows(),...collectionRows()];
    return FENCE_REVIEW836.rows.map(row=>{
      const candidates=records.filter(d=>String(d.id)===row.record_id||String(d.docket_no)===row.docket_no);
      const record=candidates.length===1?candidates[0]:null;
      const review=record&&fenceReviewContext836(record);
      return {id:row.record_id,number:row.docket_no,book:row.book,expectedPo:row.po?.number||null,
        matches:candidates.length,state:review?.state,po:review?.po?.number||null,
        reviewedOn:review?.reviewedOn,query:review?.query?.open,expectedQuery:row.query.open,
        page:row.original.page,source:row.original.source_id,media:review?.originalSource?.media_type,
        href:review?.paper?.result?.url||null,paper:fencePrivatePaperState(record||{})};
    });
  });
  privateSave(label+'-review-models-private',rows);
  check(label+': every private fixture row joins exactly once',rows.length===fixture.rows.length&&rows.every(r=>r.matches===1),{count:rows.length});
  check(label+': every source is current and charge-query flags match reviewed scope',rows.every(r=>r.state==='current'&&r.query===r.expectedQuery));
  check(label+': P/O association is exact and no unallocated record inherits one',rows.every(r=>r.po===r.expectedPo),{assigned:rows.filter(r=>r.po).length,unassigned:rows.filter(r=>!r.po).length});
  check(label+': originals use exact PDF page fragments or unchanged JPEG links',rows.every(r=>r.href&&new URL(r.href,'https://gc500-production.up.railway.app').hash===(r.media==='image/jpeg'?'':'#page='+r.page)));
  check(label+': linked original sources retain authorised docket-presence sign-off',rows.every(r=>r.paper.key==='ready'&&r.paper.text==='Approved by Andrew · docket attached'));
  for(const book of ['red','green','blue']) {
    await page.locator('[data-fp-book="'+book+'"]').click();
    await page.waitForTimeout(200);
    const expected=rows.filter(r=>r.book===book);
    const dom=await page.evaluate(expected=>expected.map(row=>{
      const node=[...document.querySelectorAll('#pane-fencing [data-fp-id]')].find(n=>n.dataset.fpId===row.id);
      if(!node)return {id:row.id,missing:true};
      const po=node.querySelector('.fp-review-po'),status=node.querySelector('.fp-review-note');
      const links=[...node.querySelectorAll('a')].map(a=>({href:a.href,text:a.textContent,rel:a.rel,target:a.target}));
      return {id:row.id,heading:node.querySelector('h4')?.textContent,po:po?.textContent||null,
        statuses:status?.textContent,reviewCount:node.querySelectorAll('.fp-review-detail').length,
        linked:links.filter(a=>a.href===new URL(row.href,location.href).href),
        unsafe:links.filter(a=>!/^https?:/.test(a.href)),
        inventedPass:/audit passed|paid in full|charges approved/i.test(node.querySelector('.fp-review-detail')?.textContent||'')};
    }),expected);
    check(label+': '+book+' retains docket heading and exact P/O once',dom.every((r,i)=>!r.missing&&r.heading.startsWith(expected[i].number)&&((!expected[i].po&&!r.po)||(r.po==='P/O '+expected[i].po+'source summary'))));
    check(label+': '+book+' shows source review and only the evidenced query state once',dom.every((r,i)=>r.statuses==='Source reviewed'+(expected[i].expectedQuery?'Charges: query open':'')&&r.reviewCount===1&&!r.inventedPass));
    check(label+': '+book+' safe page links appear once and keep new-tab protection',dom.every(r=>r.unsafe.length===0&&r.linked.length===1&&r.linked.every(a=>a.target==='_blank'&&/noopener/.test(a.rel)&&/noreferrer/.test(a.rel))));
    const sample=expected.find(r=>!r.po)||expected[0];
    if(!sample)continue;
    const card=page.locator('[data-fp-id="'+sample.id+'"]');
    await card.locator('details > summary').click();
    await card.locator('h4').scrollIntoViewIfNeeded();
    const box=await card.boundingBox();
    check(label+': '+book+' card fits viewport',box&&box.x>=-1&&box.x+box.width<=page.viewportSize().width+1,{box});
    check(label+': '+book+' review controls do not overflow card',await card.evaluate(node=>{
      const parent=node.getBoundingClientRect();
      return [...node.querySelectorAll('.fp-review-statuses,.fp-review-po,.fp-review-detail,.fp-paperlinks')].every(el=>{
        const b=el.getBoundingClientRect();return b.width===0||(b.left>=parent.left-1&&b.right<=parent.right+1&&el.scrollWidth<=el.clientWidth+2);
      });
    }));
    const image=path.join(out,label+'-'+book+'-source-review.png');await page.screenshot({path:image});report.screenshots.push(image);save();
    const openBefore=await card.locator('details').evaluate(el=>el.open);
    await page.evaluate(()=>renderFencing());await page.waitForTimeout(100);
    check(label+': '+book+' disclosure survives read-only redraw',await page.locator('[data-fp-id="'+sample.id+'"] details').evaluate(el=>el.open)===openBefore);
  }
  check(label+': no page-level horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}

async function capture(kind,mobile) {
  const label=kind+'-'+(mobile?'phone':'desktop');
  const h=await open({pageFile:inputs[kind].path,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile});
  const page=h.page,consoleErrors=[],httpFailures=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,300));});
  page.on('response',r=>{if(r.status()>=400){const u=new URL(r.url());httpFailures.push({status:r.status(),url:u.origin+u.pathname});}});
  try {
    await page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
    const before=await native(page);privateSave(label+'-native-before',before);
    await page.evaluate(()=>go('fencing'));
    await page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:90000});
    await page.waitForTimeout(400);
    const numeric=await models(page);privateSave(label+'-models-private',numeric);
    if(kind==='candidate') {
      const manifest=await page.evaluate(()=>FENCE_REVIEW836);
      const strip=source=>({id:source.id,title:source.title,sha256:source.sha256,...sourceMedia[source.id]});
      // The standard host build has an established privacy scrub for this author
      // label. Permit only its exact replacement; every evidence field is exact.
      const expectedAuthor=fixture.author==='Andrew Fisher'?'the project manager':fixture.author;
      const expected={schema:1,author:expectedAuthor,sources:fixture.sources.map(strip),rows:fixture.rows.map(row=>({
        record_id:row.record_id,docket_no:row.docket_no,book:row.book,reviewed_on:row.reviewed_on,
        original:{source_id:row.original.source_id,page:row.original.page,page_sha256:row.original.page_sha256},
        summary:row.summary?{source_id:row.summary.source_id}:null,
        po:row.po?{number:row.po.number,basis:row.po.basis,source_id:row.po.source_id}:null,
        expected:row.expected,query:{open:row.query.open,text:row.query.text}
      }))};
      check(label+': embedded manifest equals frozen private projection',stable(manifest)===stable(expected),{actual:compact(manifest),expected:compact(expected)});
      check(label+': build contains no private filesystem input paths',!/\/workspace\/|\/tmp\/|page_path|page_sha256[^]*page_path/.test(JSON.stringify(manifest)));
      await boundaries(page,label);
      await cards(page,label,mobile);
    }
    const after=await native(page);privateSave(label+'-native-after',after);
    check(label+': native record remains byte-equivalent as JSON',stable(before)===stable(after),{before:compact(before),after:compact(after),version:before.version});
    check(label+': no page errors or attempted operational writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,network:h.counts});
    check(label+': no console or failed HTTP responses',consoleErrors.length===0&&httpFailures.length===0,{consoleErrors,httpFailures});
    report.runs.push({label,native:compact(before),models:compact(numeric),errors:h.errors,consoleErrors,httpFailures,network:h.counts});save();
    return {numeric,native:before};
  } finally {await h.browser.close();}
}

(async()=>{
  for(const [name,input] of Object.entries(inputs))check(name+': frozen input hash',sha(fs.readFileSync(input.path))===input.expected);
  const base=await capture('base',false);
  for(const mobile of [false,true]) {
    const candidate=await capture('candidate',mobile),label=mobile?'phone':'desktop';
    check(label+': comparisons share the same fresh native state',stable(base.native)===stable(candidate.native),{base:compact(base.native),candidate:compact(candidate.native)});
    for(const key of Object.keys(base.numeric))check(label+': unchanged '+key,stable(base.numeric[key])===stable(candidate.numeric[key]),{base:compact(base.numeric[key]),candidate:compact(candidate.numeric[key])});
  }
  report.pass=report.checks.every(c=>c.pass);save();
  console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,screenshots:report.screenshots.length}));
})().catch(error=>{report.error=String(error.stack||error);save();console.error(error.message);process.exitCode=1;});
