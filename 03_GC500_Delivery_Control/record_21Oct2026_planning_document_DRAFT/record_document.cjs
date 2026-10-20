// Author: Andrew Fisher. One native planning PDF; private specification, backup, no replacement, exact readback.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), {spawn} = require('child_process');
const G = require('./document_guards.cjs');
const mode = process.argv[2];
if (process.argv.length !== 3 || !['--inventory', '--practice', '--apply'].includes(mode)) throw Error('Use --inventory|--practice|--apply');
const HOST = 'https://gc500-production.up.railway.app', VIEW = 'Coates-GC500-2026', OPERATOR = 'Andrew Fisher via Codex';
const applying = mode === '--apply', token = applying ? process.env.GC500_EDIT_TOKEN : '';
const repo = fs.realpathSync(path.resolve(__dirname, '../..'));
function privatePath(value, directory = false) {
  if (!value || !path.isAbsolute(value)) throw Error('An absolute private path is required');
  const real = fs.realpathSync(value);
  if (real === repo || real.startsWith(repo + path.sep)) throw Error('Private evidence and originals must remain outside Git');
  if (directory && !fs.statSync(real).isDirectory()) throw Error('Private output directory required');
  return real;
}
const specPath = privatePath(process.env.GC500_DOCUMENT_SPEC), rawSpec = fs.readFileSync(specPath);
const spec = JSON.parse(rawSpec), sourcePath = privatePath(spec.source.path), source = fs.readFileSync(sourcePath);
G.validateSpec(spec, source);
// The reviewed native name may omit attachment-transport prefixes. PDF bytes remain exact.
const outRoot = privatePath(process.env.GC500_RECORD_OUT, true);
const OUT = path.join(outRoot, 'record_21Oct2026_planning_document_' + mode.slice(2) + '_' + new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(OUT, {mode: 0o700});
const runnerSha = G.hash(fs.readFileSync(__filename)), guardsSha = G.hash(fs.readFileSync(path.join(__dirname, 'document_guards.cjs')));
const redact = value => token ? String(value).split(token).join('[redacted]') : String(value);
const save = (name, value) => fs.writeFileSync(path.join(OUT, name), redact(JSON.stringify(value, null, 2)) + '\n', {mode: 0o600});
const stateHash = state => G.hash(G.canonical(state));
let seq = 0, browser, page, harness, fatal, gate = false, attempted = false;
let nativeStartState, nativeCheckpoint, nativeSince;
const concurrentPhotoAdditions = [];
const requests = [], errors = [];
const stop = message => { gate = false; fatal = fatal || Error(redact(message)); };
const quote = value => '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
async function fetchSafe(url, headers = {}, method = 'GET', body = null) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-document-' + process.pid + '-'));
  fs.chmodSync(temp, 0o700);
  const hf = path.join(temp, 'headers'), bf = path.join(temp, 'body');
  const config = ['url = ' + quote(url), 'request = ' + quote(method), 'silent', 'show-error', 'compressed',
    'max-time = 60', 'dump-header = ' + quote(hf), 'output = ' + quote(bf)];
  for (const [key, value] of Object.entries(headers)) if (!/^(host|connection|content-length|accept-encoding)$/i.test(key)) config.push('header = ' + quote(key + ': ' + value));
  if (body !== null) {
    if (!Buffer.isBuffer(body)) throw Error('Binary request buffer required');
    const bodyPath = path.join(temp, 'request-body');
    fs.writeFileSync(bodyPath, body, {mode: 0o600});
    config.push('data-binary = ' + quote('@' + bodyPath));
  }
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('curl', ['--config', '-'], {stdio: ['pipe', 'ignore', 'pipe']}); let error = '';
      child.stderr.on('data', data => error += data);
      child.on('error', reject);
      child.on('close', code => code ? reject(Error(redact(error) || 'Request failed')) : resolve());
      child.stdin.end(config.join('\n') + '\n');
    });
    const blocks = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(x => /^HTTP\//.test(x));
    const lines = (blocks.at(-1) || '').split(/\r?\n/), status = Number(lines.shift().split(' ')[1]), hd = {};
    for (const line of lines) {
      const i = line.indexOf(':');
      if (i > 0 && !/^(content-length|content-encoding|transfer-encoding|set-cookie)$/i.test(line.slice(0, i))) hd[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
    }
    return {status, headers: hd, body: fs.readFileSync(bf)};
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
}
async function getJson(endpoint) {
  const response = await fetchSafe(HOST + endpoint, {'x-gc500-token': VIEW, 'cache-control': 'no-cache'});
  if (response.status !== 200) throw Error('Fresh read failed: ' + endpoint + ' (' + response.status + ')');
  return JSON.parse(response.body);
}
function captureNative() {
  return JSON.parse(JSON.stringify({docs: Object.fromEntries(Object.keys(SYNC_COLLS).map(key => [key, toDocs(key)])),
    files: DOCS.files, status: SYNC.status, level: SYNC.level, readonly: SYNC.readonly}));
}
async function freezeNativeWriter() {
  await page.evaluate(() => {
    if (typeof syncSend !== 'function') throw Error('Native writer not available');
    if (!window.__planningDocumentPausedWriter) {
      window.__planningDocumentPausedWriter = syncSend;
      syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); };
    }
  });
}
async function pageRecord() {
  const value = await page.evaluate(captureNative);
  save('page-record-' + (++seq) + '.json', value);
  return value;
}
function preserveNativeState(state, stage) {
  const additions = G.verifyNativeState(nativeCheckpoint, state, {since: nativeSince,
    observedAt: new Date().toISOString(), operator: OPERATOR});
  concurrentPhotoAdditions.push(...additions.map(photo => ({stage, ...photo})));
  nativeCheckpoint = state;
  save('concurrent-photo-additions.json', concurrentPhotoAdditions);
  save('native-checkpoint-' + stage + '.json', state);
  return state;
}
async function requireNativePreserved(record, stage) {
  const options = {since: nativeSince, observedAt: new Date().toISOString(), operator: OPERATOR};
  G.verifyNativeDocs(nativeStartState.docs, record.docs, options);
  const shared = preserveNativeState(await getJson('/api/state'), stage);
  // A page may lag an independent photo addition, but every value it holds must
  // also exist exactly in the fresh shared record. Local-only changes fail.
  G.verifyNativeDocs(record.docs, shared.docs, {...options, observedAt: new Date().toISOString()});
}
async function verifyDownload(id) {
  const result = await fetchSafe(HOST + '/f/' + VIEW + '/' + encodeURIComponent(id) + '?verify=' + Date.now(), {'cache-control': 'no-cache'});
  if (result.status !== 200 || result.body.length !== source.length || G.hash(result.body) !== spec.source.sha256 || !result.body.equals(source)) throw Error('Saved original differs from approved PDF bytes');
  fs.writeFileSync(path.join(OUT, 'verified-original.pdf'), result.body, {mode: 0o600});
  return {bytes: result.body.length, sha256: G.hash(result.body), exactBytes: true};
}
(async () => {
  try {
    const beforeFiles = await getJson('/api/files'), beforeState = await getJson('/api/state');
    save('before-files.json', beforeFiles); save('before-state.json', beforeState);
    nativeStartState = nativeCheckpoint = beforeState; nativeSince = beforeState.updated;
    const duplicate = G.duplicates(beforeFiles, spec);
    const inventory = {author: 'Andrew Fisher', sourceSha256: spec.source.sha256, sourceBytes: source.length,
      indexSha256: G.indexHash(beforeFiles), files: beforeFiles.files.length, duplicates: duplicate,
      runnerSha256: runnerSha, guardsSha256: guardsSha, nativeWrites: 0, uploaded: false};
    save('inventory.json', inventory);
    if (mode === '--inventory') {
      save('result.json', {...inventory, pass: true, mode: 'inventory', newFilePermittedByInventory: duplicate.length === 0});
      console.log(JSON.stringify({pass: true, mode: 'inventory', duplicates: duplicate.length, nativeWrites: 0, out: OUT})); return;
    }
    const expectedId = G.requireNew(beforeFiles, spec);
    let pageSha, syntheticFiles, saved;
    if (applying) {
      if (!token || !/^[a-f0-9]{64}$/.test(process.env.GC500_EXPECTED_SPEC_SHA || '') || G.hash(rawSpec) !== process.env.GC500_EXPECTED_SPEC_SHA) throw Error('Exact reviewed private specification and edit authority required');
      if (process.env.PAGE || process.env.GC500_CANDIDATE_MEDIA) throw Error('Actual save cannot replace the public page or media');
      const practiceDir = privatePath(process.env.GC500_DOCUMENT_PRACTICE, true);
      const practice = JSON.parse(fs.readFileSync(path.join(practiceDir, 'result.json')));
      const requiredChecks = ['oneDocument', 'exactMetadata', 'existingCataloguePreserved', 'noReferenceAssigned',
        'noCurrentMapReplacement', 'existingNativeRecordsPreserved', 'sourceOriginalUnchanged'];
      if (practice.pass !== true || practice.mode !== 'practice' || practice.serverWrites !== 0 || practice.nativeStateWrites !== 0 || practice.interceptedUploads !== 1
        || practice.pageSha256 !== spec.reviewed_page_sha || practice.specSha256 !== G.hash(rawSpec)
        || practice.runnerSha256 !== runnerSha || practice.guardsSha256 !== guardsSha
        || !G.same(Object.keys(practice.checks || {}).sort(), requiredChecks.sort()) || !requiredChecks.every(key => practice.checks[key] === true)
        || !Array.isArray(practice.errors) || practice.errors.length || practice.requests?.blocked !== 0) throw Error('A successful exact-source GET-only practice is required');
      if (G.hash(fs.readFileSync(path.join(practiceDir, 'frozen-spec.json'))) !== G.hash(rawSpec)) throw Error('Practice specification differs');
      if (spec.expected_index_sha !== G.indexHash(beforeFiles)) throw Error('Shared catalogue changed since reviewed practice');
      const practicedState = JSON.parse(fs.readFileSync(path.join(practiceDir, 'after-state.json')));
      if (spec.expected_state_sha !== stateHash(practicedState)) throw Error('Reviewed practice native backup differs');
      nativeCheckpoint = practicedState; nativeSince = practicedState.updated;
      preserveNativeState(beforeState, 'since-reviewed-practice');
      const live = await fetchSafe(HOST + '/v/' + VIEW, {'cache-control': 'no-cache'});
      pageSha = G.hash(live.body);
      if (live.status !== 200 || !/^[a-f0-9]{64}$/.test(spec.reviewed_page_sha || '') || pageSha !== spec.reviewed_page_sha || pageSha !== process.env.GC500_EXPECTED_PAGE_SHA) throw Error('Published page differs from reviewed practice');
      save('page-proof.json', {sha256: pageSha, bytes: live.body.length, publicRead: true});
      const {chromium} = require('playwright');
      browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
      const context = await browser.newContext({viewport: {width: 390, height: 844}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
      await context.route('**/*', async route => {
        const request = route.request(), url = request.url(), method = request.method();
        try {
          if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
          if (method === 'POST' && new URL(url).origin === 'https://tile.googleapis.com' && new URL(url).pathname === '/v1/createSession') return route.abort();
          if (method !== 'GET') {
            if (!gate || attempted) throw Error('Upload gate closed or upload already attempted; no retry');
            const uploadBody = request.postDataBuffer();
            G.verifyRequest(method, url, request.headers(), uploadBody, spec, OPERATOR, HOST);
            attempted = true; gate = false; // Consume the one-request budget before any asynchronous read.
            if (G.indexHash(await getJson('/api/files')) !== G.indexHash(beforeFiles)) throw Error('Shared catalogue changed before upload');
            preserveNativeState(await getJson('/api/state'), 'request-gate');
            if (!fs.readFileSync(sourcePath).equals(source)) throw Error('Original changed before upload');
            if (fatal) throw fatal;
            const receipt = {method, endpoint: '/api/files', sourceSha256: spec.source.sha256, bytes: source.length, started: new Date().toISOString(), status: null};
            requests.push(receipt); save('write-requests.json', requests);
            const response = await fetchSafe(url, request.headers(), method, uploadBody);
            receipt.status = response.status; receipt.finished = new Date().toISOString(); save('write-requests.json', requests);
            if (response.status !== 200) throw Error('Native upload returned ' + response.status + '; inspect catalogue before any further action');
            saved = JSON.parse(response.body); G.verifyFile(saved, spec, OPERATOR); save('upload-response.json', saved);
            return route.fulfill(response);
          }
          const response = await fetchSafe(url, request.headers());
          if (new URL(url).origin === HOST && new URL(url).pathname.startsWith('/e/') && G.hash(response.body) !== pageSha) throw Error('Edit page differs from reviewed public bytes');
          if (new URL(url).origin === HOST && new URL(url).pathname === '/api/state') await freezeNativeWriter();
          return route.fulfill(response);
        } catch (error) { stop(error.message); save('transport-failure.json', {message: fatal.message, requests}); return route.abort(); }
      });
      page = await context.newPage();
      page.on('pageerror', error => { errors.push(redact(error.message)); stop('Page error: ' + error.message); });
      await page.goto(HOST + '/e/' + token + '#docs', {waitUntil: 'load', timeout: 180000});
    } else {
      if (!process.env.PAGE) throw Error('Practice requires the exact local page');
      pageSha = G.hash(fs.readFileSync(process.env.PAGE));
      save('page-proof.json', {sha256: pageSha, bytes: fs.statSync(process.env.PAGE).size, localPractice: true});
      const {open} = require('../record_20Oct2026_fencing_alignment/readonly_page.cjs');
      harness = await open({pageFile: process.env.PAGE, hash: '#docs', mobile: true, W: 390, H: 844, dpr: 2});
      browser = harness.browser; page = harness.page;
    }
    await page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length && photoIndex().state === 'ready' && !DOCS.busy, null, {timeout: 180000});
    await freezeNativeWriter();
    await requireNativePreserved(await pageRecord(), 'page-ready');
    await page.evaluate(input => holdAssets(() => {
      if (docketNoInName(input.name) || docketNoInName(input.title)) throw Error('Source name or title would be filed as an existing docket');
    }), {name: spec.source.name, title: spec.metadata.title});
    if (fatal) throw fatal;
    if (applying) {
      await page.evaluate(operator => {
        if (capability() !== 'edit' || SYNC.level !== 'edit' || SYNC.readonly || SYNC.status !== 'live') throw Error('Native edit authority not confirmed');
        const who = document.getElementById('who'); if (!who) throw Error('Recording-as control missing');
        who.value = operator; who.dispatchEvent(new Event('change', {bubbles: true}));
        if (whoAmI() !== operator) throw Error('Native operator not retained');
      }, OPERATOR);
    } else {
      // Isolated practice capability only: preserve each fresh version/state, but
      // keep its read-only link from removing the native Add form between steps.
      // The shared harness and request interceptor still block every real write.
      await page.route(HOST + '/api/version', async route => {
        try {
          if (route.request().method() !== 'GET') throw Error('Practice version reads must remain GET-only');
          const result = await fetchSafe(route.request().url(), route.request().headers());
          if (result.status !== 200) throw Error('Practice version read failed');
          const version = JSON.parse(result.body);
          return route.fulfill({...result, body: JSON.stringify({...version, level: 'edit'})});
        } catch (error) { stop(error.message); return route.abort(); }
      });
      await page.evaluate(operator => { S.operator = operator; capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; }, OPERATOR);
      await page.route(HOST + '/api/files', async route => {
        const request = route.request();
        if (request.method() === 'GET') {
          if (!syntheticFiles) return route.fallback();
          return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(syntheticFiles)});
        }
        try {
          if (!gate || attempted) throw Error('Practice upload gate closed or repeated');
          G.verifyRequest(request.method(), request.url(), request.headers(), request.postDataBuffer(), spec, OPERATOR, HOST);
          attempted = true; gate = false;
          saved = {id: expectedId, name: spec.source.name, kind: 'map', ref: null, branch: null, invoice_no: null,
            title: spec.metadata.title, note: spec.metadata.note, bytes: source.length, sha256: spec.source.sha256,
            type: 'application/pdf', uploaded: new Date().toISOString(), by: OPERATOR};
          syntheticFiles = {files: [...JSON.parse(JSON.stringify(beforeFiles.files)), saved]};
          requests.push({method: 'POST', endpoint: '/api/files', sourceSha256: spec.source.sha256, bytes: source.length, intercepted: true, serverWrites: 0});
          save('intercepted-request.json', requests[0]);
          return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(saved)});
        } catch (error) { stop(error.message); return route.abort(); }
      });
    }
    await page.evaluate(() => {
      if (capability() !== 'edit' || SYNC.level !== 'edit' || SYNC.readonly) throw Error('Native document form needs confirmed edit capability');
      go('docs'); state.docAdd815 = true; renderDocs();
    });
    await page.locator('#docFile').setInputFiles(sourcePath);
    if (G.indexHash(await getJson('/api/files')) !== G.indexHash(beforeFiles)) throw Error('Pre-upload catalogue changed');
    preserveNativeState(await getJson('/api/state'), 'pre-upload');
    gate = true;
    const response = await page.evaluate(async inputSpec => {
      const input = document.getElementById('docFile');
      if (!input || input.files.length !== 1) throw Error('Exactly one original must be selected');
      const selected = input.files[0];
      const file = new File([selected], inputSpec.name, {type: 'application/pdf', lastModified: selected.lastModified});
      return await SYNC.backend.upload(file, inputSpec.metadata);
    }, {name: spec.source.name, metadata: spec.metadata});
    gate = false;
    if (fatal) throw fatal;
    G.verifyFile(response, spec, OPERATOR);
    if (!attempted || requests.length !== 1) throw Error('Expected exactly one intercepted or native file upload');
    const afterFiles = applying ? await getJson('/api/files') : syntheticFiles;
    G.verifyIndex(beforeFiles, afterFiles, response, spec, OPERATOR);
    save('after-files.json', afterFiles);
    const projectionTimes = {refreshStarted: new Date().toISOString()};
    save('projection-timing.json', projectionTimes);
    await page.waitForFunction(() => !DOCS.busy, null, {timeout: 30000});
    await page.evaluate(async () => { await docsRefresh(true); state.docAdd815 = false; renderDocs(); });
    await page.waitForFunction(id => DOCS.state === 'ready' && DOCS.files && DOCS.files[id], expectedId, {timeout: 30000});
    projectionTimes.refreshFinished = new Date().toISOString();
    save('projection-timing.json', projectionTimes);
    // Match native renderDocs/paintDocs815: classification checks many filenames
    // against assets and must share one held asset list for this synchronous read.
    const displayed = await page.evaluate(id => holdAssets(() => {
      const item = docCollection().items.filter(d => d.id === id);
      if (item.length !== 1) throw Error('Document must appear exactly once');
      const d = item[0];
      return {id: d.id, kind: d.kind, ref: d.ref, title: d.title, note: d.note, category: d.category, availability: d.availability,
        mapChoices: mapChoices('').filter(x => x.kind === 'file' && x.id === id).length};
    }), expectedId);
    projectionTimes.projectionFinished = new Date().toISOString();
    save('projection-timing.json', projectionTimes);
    if (displayed.kind !== 'map' || displayed.ref !== null || displayed.title !== spec.metadata.title || displayed.note !== spec.metadata.note
      || displayed.category !== 'Maps and drawings' || displayed.availability !== 'ready' || displayed.mapChoices !== 1) throw Error('Native Documents projection differs');
    save('document-projection.json', displayed);
    await page.evaluate(title => { state.docQ815 = title; renderDocs(); }, spec.metadata.title);
    await page.screenshot({path: path.join(OUT, 'phone-document.png')});
    await requireNativePreserved(await pageRecord(), 'page-readback');
    const afterState = await getJson('/api/state'); save('after-state.json', afterState);
    preserveNativeState(afterState, 'after-upload');
    const checks = {oneDocument: true, exactMetadata: true, existingCataloguePreserved: true, noReferenceAssigned: true,
      noCurrentMapReplacement: true, existingNativeRecordsPreserved: true, sourceOriginalUnchanged: fs.readFileSync(sourcePath).equals(source)};
    if (!Object.values(checks).every(value => value === true)) throw Error('Final document checks failed');
    if (applying) {
      const download = await verifyDownload(expectedId); save('verified-download.json', download);
      const finalFiles = await getJson('/api/files'); G.verifyIndex(beforeFiles, finalFiles, response, spec, OPERATOR);
      const finalPage = await fetchSafe(HOST + '/v/' + VIEW, {'cache-control': 'no-cache'});
      if (finalPage.status !== 200 || G.hash(finalPage.body) !== pageSha) throw Error('Published page changed during upload verification');
      const finalState = await getJson('/api/state'); save('final-state.json', finalState);
      preserveNativeState(finalState, 'final-verification');
      if (fatal || errors.length) throw fatal || Error('Page errors during final verification');
      save('result.json', {author: 'Andrew Fisher', pass: true, mode: 'apply', serverWrites: 1, pageSha256: pageSha,
        specSha256: G.hash(rawSpec), runnerSha256: runnerSha, guardsSha256: guardsSha, checks, download, errors,
        nativeStateWrites: 0, concurrentPhotoAdditions, recordVersionBefore: beforeState.version, recordVersion: finalState.version});
    } else {
      if (G.hash(fs.readFileSync(process.env.PAGE)) !== pageSha) throw Error('Practice page changed');
      if (harness.errors.length || harness.counts.blocked) throw Error('Practice had page errors or unintended mutation attempts');
      if (G.indexHash(await getJson('/api/files')) !== G.indexHash(beforeFiles)) throw Error('Real file catalogue changed during practice');
      const frozen = {...spec, expected_index_sha: G.indexHash(beforeFiles), expected_state_sha: stateHash(afterState), reviewed_page_sha: pageSha};
      save('frozen-spec.json', frozen);
      save('result.json', {author: 'Andrew Fisher', pass: true, mode: 'practice', serverWrites: 0, interceptedUploads: 1, pageSha256: pageSha,
        specSha256: G.hash(fs.readFileSync(path.join(OUT, 'frozen-spec.json'))), runnerSha256: runnerSha, guardsSha256: guardsSha,
        checks, errors: harness.errors, requests: harness.counts, nativeStateWrites: 0, concurrentPhotoAdditions,
        recordVersionBefore: beforeState.version, recordVersion: afterState.version});
    }
    console.log(JSON.stringify({pass: true, mode: mode.slice(2), serverWrites: applying ? 1 : 0, out: OUT}));
  } catch (error) {
    stop(error.message); save('failure.json', {message: redact(error.stack), requests,
      harness: harness ? {counts: harness.counts, errors: harness.errors} : null,
      note: 'No retry or rollback. If an upload was attempted, inspect the fresh catalogue and original bytes before any further action.'});
    console.error(redact(error.stack)); process.exitCode = 1;
  } finally { gate = false; if (browser) await browser.close(); }
})();
