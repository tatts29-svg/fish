/* Author: Andrew Fisher. Synthetic review identities only; no commercial records. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

global.esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[ch]);
const componentPath = path.join(__dirname, '..');
const sourcePath = path.join(componentPath, 'fencing_review836_src.js');
const api = require(sourcePath);
const {fencingReview836} = api;
assert.equal(typeof fencingReview836, 'function');

const HASH_ORIGINAL = 'a'.repeat(64);
const HASH_SUMMARY = 'b'.repeat(64);
const HASH_PAGE = 'c'.repeat(64);
const clone = value => structuredClone(value);

function fixture(book = 'red') {
  const expected = book === 'green'
    ? {date:'2030-01-02', location:'Fixture work area', labour_hours:0.75, crew_note:'Three people, fifteen minutes each', metres:null}
    : book === 'blue'
      ? {date:'2030-01-02', location:'Fixture collection area', collected:{mesh_panel:2, base:3}, hire_agreements_written:['900009']}
      : {date:'2030-01-02', location:'Fixture fence area', quantities:{clean:12.5}, components:{mesh_panel:5, base:4}};
  const row = {
    record_id:'fixture-record-1', docket_no:'900001', book,
    reviewed_on:'2030-01-04',
    original:{source_id:'fixture-original.pdf', page:7, page_sha256:HASH_PAGE},
    summary:{source_id:'fixture-summary.pdf'},
    po:{number:'89000001', basis:'source_summary', source_id:'fixture-summary.pdf'},
    expected:clone(expected), query:{open:true, text:'Synthetic charge basis still needs reconciliation.'}
  };
  const input = {schema:1, sources:[
    {id:'fixture-original.pdf', title:'Synthetic original pack', sha256:HASH_ORIGINAL, pages:40},
    {id:'fixture-summary.pdf', title:'Synthetic numbered summary', sha256:HASH_SUMMARY, pages:1}
  ], rows:[row]};
  const record = {id:row.record_id, docket_no:row.docket_no, book, ...clone(expected)};
  const files = {
    'fixture-original.pdf':{sha256:HASH_ORIGINAL},
    'fixture-summary.pdf':{sha256:HASH_SUMMARY}
  };
  return {record,input,row,files};
}

function jpegFixture() {
  const f = fixture();
  Object.assign(f.input.sources[0], {id:'fixture-original.jpg',media_type:'image/jpeg',pages:1});
  Object.assign(f.row.original, {source_id:'fixture-original.jpg',page:1,page_sha256:HASH_ORIGINAL});
  f.files['fixture-original.jpg'] = f.files['fixture-original.pdf'];
  delete f.files['fixture-original.pdf'];
  return f;
}

function expectWithheld(model, state) {
  assert.equal(model.state, state);
  assert.ok(model.po == null, 'A non-current review cannot claim a docket P/O');
  assert.ok(model.reviewedOn == null, 'A non-current review cannot claim the current record was reviewed');
}

// This generic fixture is the existing approval function, with no source DATA.
// Apply the product helper's actual guarded insertion so a regression in the
// integration is caught as well as a regression in the independent view model.
const originalApprovalFunction = `function fenceSourceState829(d){
 const ps=fencePrivatePapers(d),ready=ps.filter(p=>p.result.state==='ready'),support=fenceSupportSources829(d);
 if(ready.length)return{key:'ready',text:'Approved by Andrew · docket attached',papers:ready,support};
 const idx=photoIndex();
 if(idx.state==='loading'||ps.some(p=>p.result.state==='checking'))return{key:'loading',text:'Docket recorded · checking links',papers:[],support};
 if(idx.state==='failed'||idx.state==='none'||ps.some(p=>p.result.state==='none'))return{key:'unavailable',text:'Docket recorded · links unavailable',papers:[],support};
 if(ps.some(p=>p.result.state==='ambiguous'))return{key:'ambiguous',text:'Docket recorded · review link',papers:[],support};
 if(support.length)return{key:'summary',text:'Docket recorded · summary linked',papers:[],support};
 return{key:'recorded',text:d.docket_no?'Docket recorded':'Workbook source',papers:[],support};
}`;
let approvalInsertion;
function patchedApprovalFunction() {
  if (!approvalInsertion) {
    // These guarded Python replacement literals use JSON-compatible escapes.
    // Read the literal pair directly; no child process or private build input.
    const helper = fs.readFileSync(path.join(componentPath, 'fencing_review836.py'), 'utf8');
    const matches = [...helper.matchAll(/\((" const ps=fencePrivatePapers\(d\),ready=(?:[^"\\]|\\.)*"),\s*("(?:[^"\\]|\\.)*")/g)];
    assert.equal(matches.length, 1, 'Exactly one product approval insertion exists');
    approvalInsertion = [JSON.parse(matches[0][1]), JSON.parse(matches[0][2])];
  }
  const [old,replacement] = approvalInsertion;
  assert.equal(originalApprovalFunction.split(old).length, 2, 'The original approval boundary remains an exact match');
  return originalApprovalFunction.replace(old, replacement);
}

function runtime(f, options = {}) {
  const globals = {
    FENCE_REVIEW836:f.input,
    DOCS:{files:f.files},
    FCOM:{dockets:options.records || [f.record], service_notes:[], collections:[]},
    S:{fenceDockets:[], serviceNotes:[]},
    tombedHere:() => false,
    URL,
    location:{href:'https://fixture.invalid/v/synthetic', origin:'https://fixture.invalid'},
    esc:global.esc,
    photoIndex:() => options.index || {state:'ready',files:f.files},
    photoFor:() => ({state:'ready',url:options.url ?? 'https://fixture.invalid/api/files/fixture-original.pdf'}),
    fencePrivatePapers:() => options.direct || [],
    fenceSupportSources829:() => [],
    ...options.globals
  };
  const context = vm.createContext(globals);
  const existingUrlGuard = `function webLink(u){
 if (typeof u !== 'string' || !u.trim()) return false;
 try { const x = new URL(u, location.href);
 return (x.protocol === 'http:' || x.protocol === 'https:') && !x.username && !x.password; } catch (e) { return false; }
}`;
  vm.runInContext(existingUrlGuard + '\n' + fs.readFileSync(sourcePath, 'utf8') + '\n' + patchedApprovalFunction(), context, {filename:sourcePath});
  return {
    context:record => context.fenceReviewContext836(record),
    approval:record => context.fenceSourceState829(record)
  };
}

function docketLinkLabel(paper) {
  const oldLabel = "${i?'Docket file '+(i+1):'Open docket'}";
  const helper = fs.readFileSync(path.join(componentPath, 'fencing_review836.py'), 'utf8');
  const pairs = [...helper.matchAll(/\(("(?:[^"\\]|\\.)*"),\s*("(?:[^"\\]|\\.)*")/g)]
    .map(match => [JSON.parse(match[1]),JSON.parse(match[2])])
    .filter(([old]) => old === oldLabel);
  assert.equal(pairs.length, 1, 'Exactly one product docket-link label replacement exists');
  return vm.runInNewContext('`' + pairs[0][1] + '`', {p:paper,i:0,esc:global.esc});
}

test('an exact red identity and reviewed field snapshot returns the documented P/O', () => {
  const f = fixture();
  const result = fencingReview836(f.record, f.input, f.files);
  assert.equal(result.state, 'current');
  assert.equal(result.po.number, '89000001');
  assert.equal(result.reviewedOn, '2030-01-04');
});

test('omitted record book defaults to red', () => {
  const f = fixture();
  delete f.record.book;
  assert.equal(fencingReview836(f.record, f.input, f.files).state, 'current');
});

test('each supported book binds its own reviewed fields', () => {
  for (const book of ['red','green','blue']) {
    const f = fixture(book);
    assert.equal(fencingReview836(f.record, f.input, f.files).state, 'current', book);
    f.record.location += ' changed';
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('no recorded review gives no status or inferred P/O', () => {
  const f = fixture();
  f.input.rows = [];
  f.record.week = 'Fixture week';
  f.record.programme_sheet = 'FIXTURE WEEK';
  f.record.po_no = '89000002';
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'none');
  expectWithheld(fencingReview836(f.record, null, f.files), 'none');
});

test('an unrelated identity cannot acquire a review through its week or source', () => {
  const f = fixture();
  f.record.id = 'fixture-unrelated';
  f.record.docket_no = '900099';
  f.record.week = 'Fixture week';
  f.row.expected.week = 'Fixture week';
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'none');
});

test('a single partial identity match is stale, never a best-effort join', () => {
  for (const [field,value] of [['id','fixture-other-id'],['docket_no','900002'],['book','green']]) {
    const f = fixture();
    f.record[field] = value;
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('identity whitespace is not silently normalised into an exact match', () => {
  const f = fixture();
  f.record.docket_no += ' ';
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
});

test('duplicate exact identities are ambiguous even when their values agree', () => {
  const f = fixture();
  f.input.rows.push(clone(f.row));
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'ambiguous');
});

test('sharing only the record ID or only the docket number is also ambiguous', () => {
  for (const [field,value] of [['record_id','fixture-other-id'],['docket_no','900002'],['book','green']]) {
    const f = fixture();
    const collision = clone(f.row);
    collision[field] = value;
    f.input.rows.push(collision);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'ambiguous');
  }
});

test('canonical nested objects ignore key order and equate undefined with null', () => {
  const f = fixture();
  f.row.expected.quantities = {clean:12.5, optional:null};
  f.record.quantities = {optional:undefined, clean:12.5};
  f.row.expected.components = {mesh_panel:5, base:4};
  f.record.components = {base:4, mesh_panel:5};
  assert.equal(fencingReview836(f.record, f.input, f.files).state, 'current');
  const green = fixture('green');
  delete green.record.metres;
  assert.equal(fencingReview836(green.record, green.input, green.files).state, 'current');
});

test('numeric strings are not equivalent to reviewed numeric quantities', () => {
  const f = fixture();
  f.record.quantities.clean = '12.5';
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
});

test('a changed quantity, component, date or note invalidates the relevant review', () => {
  const mutations = [
    f => { f.record.quantities.clean = 15; },
    f => { f.record.components.base = 5; },
    f => { f.record.date = '2030-01-03'; }
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
  const green = fixture('green');
  green.record.crew_note = 'Changed crew instruction';
  expectWithheld(fencingReview836(green.record, green.input, green.files), 'stale');
});

test('nested arrays retain their written order and exact identities', () => {
  const f = fixture('blue');
  f.row.expected.hire_agreements_written = ['900008','900009'];
  f.record.hire_agreements_written = ['900009','900008'];
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
});

test('a current row without a documented P/O stays reviewed and unallocated', () => {
  const f = fixture();
  f.row.po = null;
  f.record.week = 'Fixture week';
  const result = fencingReview836(f.record, f.input, f.files);
  assert.equal(result.state, 'current');
  assert.ok(result.po == null);
  assert.equal(result.reviewedOn, '2030-01-04');
});

test('an original-only review legitimately has neither a summary nor a P/O', () => {
  const f = fixture();
  f.row.summary = null;
  f.row.po = null;
  const result = fencingReview836(f.record, f.input, f.files);
  assert.equal(result.state, 'current');
  assert.equal(result.po, null);
  assert.equal(result.summarySource, null);
  assert.equal(result.originalSource.id, 'fixture-original.pdf');
  assert.equal(result.reviewedOn, '2030-01-04');
});

test('PO source must be the reviewed numbered summary, with the supported basis', () => {
  for (const mutate of [
    f => { f.row.po.source_id = 'fixture-original.pdf'; },
    f => { f.row.po.basis = 'week'; },
    f => { f.row.summary.source_id = 'missing-summary.pdf'; }
  ]) {
    const f = fixture(); mutate(f);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('original source identity and page range bind the review to a specific source page', () => {
  for (const mutate of [
    f => { f.row.original.source_id = 'missing-original.pdf'; },
    f => { f.row.original.page = 0; },
    f => { f.row.original.page = 41; },
    f => { f.row.original.page = 7.5; },
    f => { f.row.original.page_sha256 = 'not-a-page-hash'; }
  ]) {
    const f = fixture(); mutate(f);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('missing reviewed fields or source fingerprints cannot produce a current claim', () => {
  for (const mutate of [
    f => { delete f.row.expected.components; },
    f => { f.row.expected.unreviewed = 'extra'; },
    f => { delete f.row.original.page_sha256; },
    f => { f.input.sources[0].sha256 = 'invalid'; },
    f => { f.input.sources[1].sha256 = 'invalid'; }
  ]) {
    const f = fixture(); mutate(f);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('duplicate source IDs are ambiguous rather than resolved by first match', () => {
  for (const index of [0,1]) {
    const f = fixture();
    f.input.sources.push(clone(f.input.sources[index]));
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'ambiguous');
  }
});

test('a known changed original or summary file invalidates reviewed status and P/O', () => {
  for (const id of ['fixture-original.pdf','fixture-summary.pdf']) {
    const f = fixture();
    f.files[id].sha256 = 'd'.repeat(64);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('an unavailable file registry withholds P/O and the current review claim', () => {
  for (const files of [null, {}]) {
    const f = fixture();
    const result = fencingReview836(f.record, f.input, files);
    expectWithheld(result, 'unavailable');
    assert.ok(!result.paper, 'A source name cannot invent an attached docket');
  }
});

test('both required source registry entries must have valid exact fingerprints', () => {
  for (const id of ['fixture-original.pdf','fixture-summary.pdf']) {
    for (const value of [undefined, null, {}, {sha256:null}, {sha256:''}, {sha256:'invalid'}]) {
      const f = fixture();
      if (value === undefined) delete f.files[id];
      else f.files[id] = value;
      expectWithheld(fencingReview836(f.record, f.input, f.files), 'unavailable');
    }
  }
});

test('an original-only row requires its original registry entry but no summary entry', () => {
  const f = fixture();
  f.row.summary = null;
  f.row.po = null;
  delete f.files['fixture-summary.pdf'];
  assert.equal(fencingReview836(f.record, f.input, f.files).state, 'current');
  delete f.files['fixture-original.pdf'];
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'unavailable');
});

test('inherited object names cannot act as supported book definitions', () => {
  for (const book of ['constructor','toString','__proto__']) {
    const f = fixture();
    f.row.book = book;
    f.record.book = book;
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('native record collisions block review even when the manifest identity is unique', () => {
  for (const mutate of [
    record => { record.id = 'fixture-other'; },
    record => { record.docket_no = '900002'; },
    record => { record.book = 'green'; }
  ]) {
    const f = fixture();
    const other = clone(f.record);
    mutate(other);
    expectWithheld(fencingReview836(f.record, f.input, f.files, [f.record,other]), 'ambiguous');
  }
  const f = fixture();
  const unrelated = {...f.record, id:'fixture-other', docket_no:'900099'};
  assert.equal(fencingReview836(f.record, f.input, f.files, [f.record,unrelated]).state, 'current');
});

test('native sign-off and commercial fields are neither rewritten nor used as review evidence', () => {
  const f = fixture();
  Object.assign(f.record, {signed_by:'Fixture signer', approved:true, approval:{by:'Fixture approver'}, paid_total:45, confirmed:true});
  const before = clone(f);
  assert.equal(fencingReview836(f.record, f.input, f.files).state, 'current');
  assert.deepEqual(f, before, 'The view model is read-only');
  f.record.components.base += 1;
  const changed = clone(f);
  expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  assert.deepEqual(f, changed, 'Stale review does not revoke or rewrite the existing sign-off');
});

test('current HTML keeps source review separate from sign-off, reconciliation and payment', () => {
  const f = fixture();
  const result = fencingReview836(f.record, f.input, f.files);
  const status = api.fenceReviewStatus836(result);
  const details = api.fenceReviewDetails836(result, {papers:[]});
  assert.match(status, /Source reviewed/);
  assert.match(status, /Charges: query open/);
  assert.doesNotMatch(status, /approved|audit passed|passed audit|paid/i);
  assert.match(details, /docket sign-off remains separate from charge reconciliation, formal audit and payment/);
  assert.doesNotMatch(details, /<a\b/, 'Missing live registry link is not fabricated from a source name');
});

test('a row without an individual charge query remains reviewed without implying financial approval', () => {
  const f = fixture();
  f.row.query = {open:false,text:'Synthetic scope records source checks only; charge reconciliation remains separate.'};
  const model = fencingReview836(f.record, f.input, f.files);
  assert.equal(model.state, 'current');
  assert.equal(model.po.number, '89000001');
  const status = api.fenceReviewStatus836(model);
  const details = api.fenceReviewDetails836(model, {papers:[]});
  assert.match(status, /Source reviewed/);
  assert.doesNotMatch(status, /Charges:|query|approved|paid|passed|reconciled/i);
  assert.match(details, /Charge review scope/);
  assert.ok(details.includes(global.esc(f.row.query.text)));
  assert.doesNotMatch(details, /Charges: query open|audit passed|passed audit|financially approved/i);
});

test('charge query scope requires an explicit boolean and explanatory text', () => {
  for (const query of [null, {}, {open:'false',text:'Synthetic explanation'}, {open:0,text:'Synthetic explanation'}, {open:true,text:''}, {open:false,text:' '}]) {
    const f = fixture();
    f.row.query = query;
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
  }
});

test('stale and ambiguous presentation hides the P/O and current review claim', () => {
  for (const state of ['stale','ambiguous']) {
    const model = {state, reason:'Synthetic mismatch'};
    assert.equal(api.fenceReviewHeading836(model), '');
    assert.doesNotMatch(api.fenceReviewStatus836(model), /Source reviewed/);
    assert.match(api.fenceReviewDetails836(model, {papers:[]}), /Existing docket sign-off is unchanged/);
  }
  for (const render of [api.fenceReviewHeading836,api.fenceReviewStatus836,api.fenceReviewDetails836]) {
    assert.equal(render({state:'none'}, {papers:[]}), '');
  }
});

test('unavailable source presentation hides claims without calling the record stale', () => {
  const f = fixture();
  const model = fencingReview836(f.record, f.input, null);
  assert.equal(api.fenceReviewHeading836(model), '');
  const html = api.fenceReviewStatus836(model) + api.fenceReviewDetails836(model, {papers:[]});
  assert.match(html, /review links (?:checking|unavailable)/i);
  assert.doesNotMatch(html, /Source reviewed|Source review needed|P\/O 89000001|have changed since review/i);
});

test('HTML renderers escape source titles, query text, labels and stale reasons', () => {
  const f = fixture();
  const dangerous = '<img src=x onerror="fixture()"> & "quoted"';
  f.input.sources[0].title = dangerous;
  f.input.sources[1].title = dangerous;
  f.row.query.text = dangerous;
  const model = fencingReview836(f.record, f.input, f.files);
  const html = api.fenceReviewDetails836(model, {papers:[]});
  assert.doesNotMatch(html, /<img\b|<script\b|onerror="/i);
  assert.ok(html.includes(global.esc(dangerous)));
  const heading = api.fenceReviewHeading836({...model, po:{number:dangerous}});
  assert.ok(heading.includes(global.esc(dangerous)));
  assert.doesNotMatch(heading, /<img\b|onerror="/i);
  const stale = api.fenceReviewDetails836({state:'stale', reason:dangerous}, {papers:[]});
  assert.ok(stale.includes(global.esc(dangerous)));
  assert.doesNotMatch(stale, /<img\b|onerror="/i);
});

test('a reviewed page link is shown once and its attribute is escaped', () => {
  const f = fixture();
  const model = fencingReview836(f.record, f.input, f.files);
  model.paper = {
    paper:{id:'fixture-original.pdf', reviewedPage:7},
    result:{url:'/fixture.pdf?name="synthetic"&view=1#page=7'}
  };
  const once = api.fenceReviewDetails836(model, {papers:[]});
  assert.equal((once.match(/<a\b/g) || []).length, 1);
  assert.ok(once.includes('href="' + global.esc(model.paper.result.url) + '"'));
  const alreadyShown = api.fenceReviewDetails836(model, {papers:[model.paper]});
  assert.doesNotMatch(alreadyShown, /<a\b/);
});

test('changed physical fields hide current review while the verified original retains docket approval', () => {
  const f = fixture();
  f.record.components.base += 1;
  f.record.quantities.clean += 2.5;
  const before = clone(f);
  const original = api.fenceReviewOriginal836(f.record, f.input, f.files);
  assert.equal(original.originalSource.id, 'fixture-original.pdf');
  assert.equal(original.row.original.page, 7);
  const host = runtime(f);
  const review = host.context(f.record);
  expectWithheld(review, 'stale');
  assert.equal(review.paper.paper.reviewedPage, 7);
  assert.equal(new URL(review.paper.result.url).hash, '#page=7');
  assert.equal(api.fenceReviewHeading836(review), '');
  assert.doesNotMatch(api.fenceReviewStatus836(review), /Source reviewed/);
  const paper = host.approval(f.record);
  assert.equal(paper.key, 'ready');
  assert.equal(paper.text, 'Approved by Andrew · docket attached');
  assert.equal(paper.papers.length, 1);
  assert.equal(paper.papers[0].paper.id, 'fixture-original.pdf');
  assert.deepEqual(f, before, 'Neither source verification nor approval rendering writes to records');
});

test('summary unavailability or replacement cannot revoke an independently verified original docket', () => {
  for (const hash of [null, 'd'.repeat(64)]) {
    const f = fixture();
    f.files['fixture-summary.pdf'].sha256 = hash;
    const host = runtime(f);
    const review = host.context(f.record);
    expectWithheld(review, hash ? 'stale' : 'unavailable');
    assert.ok(review.paper);
    assert.equal(host.approval(f.record).text, 'Approved by Andrew · docket attached');
  }
});

test('identity, original source or page mismatches cannot retain fallback approval', () => {
  for (const mutate of [
    f => { f.record.id = 'fixture-other'; },
    f => { f.record.docket_no = '900002'; },
    f => { f.record.book = 'green'; },
    f => { f.input.rows.push(clone(f.row)); },
    f => { f.files['fixture-original.pdf'].sha256 = 'd'.repeat(64); },
    f => { delete f.files['fixture-original.pdf']; },
    f => { f.row.original.page = 41; },
    f => { f.row.original.page_sha256 = 'invalid'; },
    f => { f.input.sources.push(clone(f.input.sources[0])); }
  ]) {
    const f = fixture();
    mutate(f);
    assert.equal(api.fenceReviewOriginal836(f.record, f.input, f.files), null);
    const host = runtime(f);
    assert.ok(!host.context(f.record).paper);
    assert.notEqual(host.approval(f.record).key, 'ready');
  }
});

test('native identity collisions also block the original-paper fallback', () => {
  const f = fixture();
  const records = [f.record, {...f.record, id:'fixture-other'}];
  assert.equal(api.fenceReviewOriginal836(f.record, f.input, f.files, records), null);
  const host = runtime(f, {records});
  expectWithheld(host.context(f.record), 'ambiguous');
  assert.ok(!host.context(f.record).paper);
  assert.notEqual(host.approval(f.record).key, 'ready');
});

test('direct ready docket papers retain priority over the reviewed pack fallback', () => {
  const f = fixture();
  const direct = [{paper:{id:'fixture-direct.pdf',byName:false},result:{state:'ready',url:'/api/files/fixture-direct.pdf'}}];
  const host = runtime(f, {direct});
  assert.ok(host.context(f.record).paper, 'A valid pack is available but only acts as fallback');
  const paper = host.approval(f.record);
  assert.equal(paper.text, 'Approved by Andrew · docket attached');
  assert.equal(paper.papers.length, 1);
  assert.equal(paper.papers[0], direct[0]);
  const stale = runtime(f, {direct,index:{state:'failed'}});
  assert.equal(stale.approval(f.record).text, 'Approved by Andrew · docket attached');
  assert.equal(stale.approval(f.record).papers[0], direct[0]);
});

test('a fallback approved pack page is not linked again in source details', () => {
  const f = fixture();
  const host = runtime(f);
  const review = host.context(f.record);
  const paper = host.approval(f.record);
  assert.equal(paper.papers.length, 1);
  assert.doesNotMatch(api.fenceReviewDetails836(review, paper), /<a\b/);
});

test('only safe same-origin document URLs can supply the original-paper fallback', () => {
  const f = fixture();
  for (const url of [
    'javascript:fixture()', 'data:application/pdf,fixture',
    'https://other.invalid/fixture.pdf', '//other.invalid/fixture.pdf',
    'https://name:password@fixture.invalid/fixture.pdf',
    'https://name@fixture.invalid/fixture.pdf',
    'http://fixture.invalid/fixture.pdf', 'https://[invalid'
  ]) {
    const host = runtime(f, {url});
    assert.ok(!host.context(f.record).paper, url);
    assert.notEqual(host.approval(f.record).key, 'ready', url);
  }
  for (const url of ['https://fixture.invalid/fixture.pdf#old', '/fixture.pdf', 'fixture.pdf']) {
    const host = runtime(f, {url});
    const paper = host.context(f.record).paper;
    assert.equal(new URL(paper.result.url).origin, 'https://fixture.invalid');
    assert.equal(new URL(paper.result.url).hash, '#page=7');
  }
});

test('loading and failed registry states use friendly unavailable review status', () => {
  const f = fixture();
  for (const state of ['loading','failed','none']) {
    const host = runtime(f, {index:{state}});
    const review = host.context(f.record);
    expectWithheld(review, 'unavailable');
    assert.ok(!review.paper, 'Built-in DOCS cannot bypass the live registry check');
    const status = api.fenceReviewStatus836(review);
    assert.match(status, state === 'loading' ? /Review links checking/ : /Review links unavailable/);
    assert.doesNotMatch(status, /Source reviewed|Source review needed/);
  }
});

test('a verified JPEG original has no PDF fragment or page-number label', () => {
  const f = jpegFixture();
  const model = fencingReview836(f.record, f.input, f.files);
  assert.equal(model.state, 'current');
  assert.equal(model.originalSource.media_type, 'image/jpeg');
  const host = runtime(f, {url:'https://fixture.invalid/api/files/fixture-original.jpg#page=9'});
  const review = host.context(f.record);
  const paper = host.approval(f.record);
  assert.equal(paper.text, 'Approved by Andrew · docket attached');
  assert.equal(paper.papers.length, 1);
  assert.equal(new URL(review.paper.result.url).hash, '');
  assert.doesNotMatch(docketLinkLabel(paper.papers[0]), /page\s*1/i);
  const details = api.fenceReviewDetails836(review, {papers:[]});
  assert.equal((details.match(/<a\b/g) || []).length, 1);
  assert.doesNotMatch(details, /#page=|page\s*1/i);
});

test('an existing direct JPEG paper is not linked again in source details', () => {
  const f = jpegFixture();
  const direct = [{paper:{id:'fixture-original.jpg',byName:false},result:{state:'ready',url:'/api/files/fixture-original.jpg'}}];
  const host = runtime(f, {direct,url:'/api/files/fixture-original.jpg'});
  const paper = host.approval(f.record);
  const review = host.context(f.record);
  assert.equal(paper.papers.length, 1);
  assert.equal(paper.papers[0], direct[0]);
  assert.doesNotMatch(api.fenceReviewDetails836(review, paper), /<a\b|page\s*1/i);
});

test('a fallback JPEG original is linked once and still approves a changed physical record', () => {
  const f = jpegFixture();
  const host = runtime(f, {url:'/api/files/fixture-original.jpg'});
  assert.doesNotMatch(api.fenceReviewDetails836(host.context(f.record), host.approval(f.record)), /<a\b/);
  f.record.components.base += 1;
  const review = host.context(f.record);
  expectWithheld(review, 'stale');
  assert.equal(api.fenceReviewHeading836(review), '');
  assert.doesNotMatch(api.fenceReviewStatus836(review), /Source reviewed/);
  assert.equal(host.approval(f.record).text, 'Approved by Andrew · docket attached');
  assert.equal(new URL(review.paper.result.url).hash, '');
});

test('JPEG originals require the one-page image range', () => {
  for (const mutate of [
    f => { f.row.original.page = 0; },
    f => { f.row.original.page = 2; },
    f => { f.input.sources[0].pages = 2; },
    f => { f.input.sources[0].pages = '1'; }
  ]) {
    const f = jpegFixture();
    mutate(f);
    expectWithheld(fencingReview836(f.record, f.input, f.files), 'stale');
    assert.equal(api.fenceReviewOriginal836(f.record, f.input, f.files), null);
    assert.ok(!runtime(f, {url:'/api/files/fixture-original.jpg'}).context(f.record).paper);
  }
});

test('explicit PDF type and the backwards-compatible default retain page navigation', () => {
  for (const mediaType of [undefined, 'application/pdf']) {
    const f = fixture();
    if (mediaType) f.input.sources[0].media_type = mediaType;
    const host = runtime(f);
    const review = host.context(f.record);
    assert.equal(review.state, 'current');
    assert.equal(new URL(review.paper.result.url).hash, '#page=7');
    assert.match(docketLinkLabel(host.approval(f.record).papers[0]), /page\s*7/i);
    assert.match(api.fenceReviewDetails836(review, {papers:[]}), /page\s*7/i);
  }
});
