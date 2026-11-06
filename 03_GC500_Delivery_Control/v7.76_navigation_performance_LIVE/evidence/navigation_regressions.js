#!/usr/bin/env node
'use strict';
// Author: Andrew Fisher. Synthetic records only; no service requests or record writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const release = path.resolve(__dirname, '..');
const basePath = process.env.GC500_NAV_BASE || path.resolve(release,
  '../build/GC500_v7.74/GC500_Delivery_Control_hosted.html');
const base = fs.readFileSync(basePath, 'utf8');
const patch = path.join(release, 'patch_v776.py');
let temp;
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function between(source, start, end) {
  const a = source.indexOf(start);
  assert(a >= 0, 'missing source anchor: ' + start);
  const b = source.indexOf(end, a + start.length);
  assert(b > a, 'missing end anchor: ' + end);
  return source.slice(a, b).trim();
}
const endGo = '\n/* ------------------------------------------------------------------ today';
const endRender = '\n/* A FIGURE ON A TILE IS NEVER BROKEN IN TWO.';
function fixture() {
  return {revision: 1, assets: [{key: 'SYN-A', qty: 2}, {key: 'SYN-B', qty: 1}],
    rentals: {'SYN-A': 'first', 'SYN-B': 'second'}};
}

function harness(source) {
  const pane = id => ({id, childElementCount: 0, attrs: {}, heading: null,
    classList: {toggle() {}, remove() {}, add() {}},
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    getElementsByTagName() { return []; },
    querySelector() { return this.heading; },
    insertBefore(h) { this.heading = h; }, focus() {}, offsetWidth: 1});
  const tabs = ['today', 'progress', 'plant', 'register', 'docs', 'costs', 'about', 'edit'];
  const panes = new Map(tabs.map(k => [k, pane('pane-' + k)]));
  const main = {scrollTop: 0, scrollHeight: 1000};
  const frames = [], microtasks = [];
  const ctx = vm.createContext({console, fixture: fixture(), state: {tab: 'today'},
    TABS: tabs.map(k => [k, k]), TABS_OFF: new Set(), TAB_SCROLL: {},
    RACE_RAN: {}, GI_SEEN: new Set(), GO_CHANGED: false, searchTimer: null,
    RENDER_MEMO: new Map(), LAMP_GEN: 0, DATA: {event: {name: 'Synthetic event'}},
    SYNC: {on: true}, stats: {builds: 0, rentalReads: 0, capabilities: [], draws: [], snapshots: []},
    failure: '', permission: 'view', deferred: false, asyncSeen: [],
    document: {querySelectorAll: () => [...panes.values()], createElement: () => ({})},
    $: sel => sel === 'main' ? main : panes.get(sel.replace('#pane-', '')) || null,
    canEdit() { return ctx.permission === 'edit'; },
    flash() {}, setHash() {}, boardStop() {}, clearTimeout() {},
    countUpFigures() {}, tblFocusSoon() {}, markCards() {}, fitKpis() {},
    foldStories() {}, foldForPhone() {},
    requestAnimationFrame(fn) { frames.push(fn); },
    queueMicrotask(fn) { microtasks.push(fn); }});
  vm.runInContext(`
    function buildAllAssets(){
      stats.builds++;
      return fixture.assets.map(a => ({...a, revision: fixture.revision}));
    }
    ${between(source, 'let ASSETS_HELD = null;', 'function buildAllAssets(){')}
    function readModel(){
      const assets = allAssets();
      stats.snapshots.push(assets);
      return assets.map(a => ({key: a.key, qty: a.qty, revision: a.revision,
        rental: heldMemo('synthetic-rental|' + a.key, () => {
          stats.rentalReads++; return fixture.rentals[a.key];
        })}));
    }
    function renderTabs(){
      if (failure === 'tabs') throw new Error('synthetic tabs error');
      stats.alerts = readModel();
      readModel();
    }
    function draw(){
      stats.draws.push(state.tab);
      stats.content = readModel();
      if (failure === 'render') throw new Error('synthetic render error');
      if (deferred) {
        requestAnimationFrame(() => holdAssets(() => asyncSeen.push(readModel())));
        queueMicrotask(() => holdAssets(() => asyncSeen.push(readModel())));
      }
    }
    function hzTodayPod(){ stats.pod = readModel(); }
    function applyCapability(){ stats.capabilities.push(permission); }
    ${between(source, 'function renderPass(){', endRender)}
    ${source.match(/^function render\(\)\{[^\n]+\}/m)[0]}
    ${between(source, 'function go(tab){', endGo)}
  `, ctx);
  const renderNames = between(source, 'function renderPass(){', endRender)
    .match(/\brender[A-Z]\w*(?=\(\))/g);
  for (const name of new Set(renderNames)) {
    if (name !== 'renderPass') ctx[name] = () => vm.runInContext('draw()', ctx);
  }
  if (source.includes('function cj764Model776Held(){')) {
    vm.runInContext(`
      const modelCalls = {forecast: 0, rehire: 0};
      function cj764Model776Held(){
        modelCalls.forecast++;
        if (failure === 'forecast') throw new Error('synthetic forecast error');
        return {revision: fixture.revision, units: fixture.assets.reduce((n, a) => n + a.qty, 0)};
      }
      function rh766Model776Held(){
        modelCalls.rehire++;
        return {forecast: cj764Model(), references: fixture.assets.length};
      }
      ${source.match(/^function cj764Model\(\)\{[^\n]+\}/m)[0]}
      ${source.match(/^function rh766Model\(\)\{[^\n]+\}/m)[0]}
    `, ctx);
  }
  return {
    ctx, frames, microtasks,
    run: code => vm.runInContext(code, ctx),
    released() {
      assert.equal(vm.runInContext('ASSETS_HELD === null && HELD_MEMO.size === 0', ctx), true);
    },
    models() { return JSON.parse(JSON.stringify({alerts: ctx.stats.alerts,
      content: ctx.stats.content, pod: ctx.stats.pod})); }
  };
}

async function main() {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-navigation-'));
  const copy = path.join(temp, 'candidate.html');
  fs.writeFileSync(copy, base);
  const applied = spawnSync('python3', [patch, copy], {encoding: 'utf8'});
  assert.equal(applied.status, 0, applied.stderr);
  const source = fs.readFileSync(process.env.PAGE || copy, 'utf8');
  check('patch leaves the original navigation body unchanged', () => {
    assert.equal(between(source, 'function go776Held(tab){', endGo)
      .replace('function go776Held(tab){', 'function go(tab){'),
      between(base, 'function go(tab){', endGo));
  });
  check('forecast and Rehire calculation bodies are unchanged', () => {
    const ends = {cj764Model: '\nfunction cj764Card(){', rh766Model: '\n/* v7.69 - does what we charge cover'};
    for (const [name, end] of Object.entries(ends)) {
      assert.equal(between(source, 'function ' + name + '776Held(){', end)
        .replace('function ' + name + '776Held(){', 'function ' + name + '(){'),
        between(base, 'function ' + name + '(){', end));
    }
  });
  check('patch refuses a second application without changing the file', () => {
    const before = fs.readFileSync(copy);
    const twice = spawnSync('python3', [patch, copy], {encoding: 'utf8'});
    assert.notEqual(twice.status, 0);
    assert.match(twice.stderr, /already applied/);
    assert.deepEqual(fs.readFileSync(copy), before);
  });
  check('patch refuses a base without the previous release', () => {
    const wrong = path.join(temp, 'wrong.html');
    fs.writeFileSync(wrong, 'function go(tab){}');
    assert.notEqual(spawnSync('python3', [patch, wrong], {encoding: 'utf8'}).status, 0);
    assert.equal(fs.readFileSync(wrong, 'utf8'), 'function go(tab){}');
  });
  check('navigation shares one asset snapshot and rental lookup per key', () => {
    const h = harness(source); h.run("go('docs')");
    assert.equal(h.ctx.stats.builds, 1);
    assert.equal(h.ctx.stats.rentalReads, 2);
    assert(h.ctx.stats.snapshots.every(s => s === h.ctx.stats.snapshots[0]));
    const m = h.models(); assert.deepEqual(m.alerts, m.content); assert.deepEqual(m.pod, m.content);
    assert.deepEqual(h.ctx.stats.draws, ['docs']); h.released();
  });
  check('baseline and patched navigation produce the same synthetic model', () => {
    const old = harness(base), fresh = harness(source);
    old.run("go('costs')"); fresh.run("go('costs')");
    assert.deepEqual(fresh.models(), old.models());
    assert(old.ctx.stats.builds > fresh.ctx.stats.builds);
  });
  check('record replacement is fresh on the next navigation', () => {
    const h = harness(source); h.run("go('docs')");
    h.ctx.fixture = {revision: 2, assets: [{key: 'SYN-C', qty: 4}], rentals: {'SYN-C': 'new'}};
    h.run("go('costs')");
    assert.deepEqual(h.models().content, [{key: 'SYN-C', qty: 4, revision: 2, rental: 'new'}]);
    assert.equal(h.ctx.stats.builds, 2); h.released();
  });
  check('same-tab redraw sees edited and deleted records', () => {
    const h = harness(source); h.run("go('plant')");
    h.ctx.fixture.assets.pop(); h.ctx.fixture.assets[0].qty = 5;
    h.ctx.fixture.rentals['SYN-A'] = 'edited'; h.ctx.fixture.revision++;
    h.run("go('plant')");
    assert.deepEqual(h.models().content, [{key: 'SYN-A', qty: 5, revision: 2, rental: 'edited'}]);
    h.released();
  });
  check('empty snapshots are held once and later additions appear', () => {
    const h = harness(source); h.ctx.fixture.assets = []; h.run("go('docs')");
    assert.equal(h.ctx.stats.builds, 1); assert.deepEqual(h.models().content, []);
    h.ctx.fixture = fixture(); h.run("go('docs')");
    assert.equal(h.models().content.length, 2); assert.equal(h.ctx.stats.builds, 2); h.released();
  });
  check('alert failure releases the cache and the next navigation recovers', () => {
    const h = harness(source); h.ctx.failure = 'tabs';
    assert.throws(() => h.run("go('docs')"), /synthetic tabs error/); h.released();
    h.ctx.failure = ''; h.ctx.fixture.revision++; h.run("go('docs')");
    assert.equal(h.models().content[0].revision, 2); h.released();
  });
  check('render failure releases the cache and navigation flag', () => {
    const h = harness(source); h.ctx.failure = 'render';
    assert.throws(() => h.run("go('costs')"), /synthetic render error/); h.released();
    assert.equal(h.ctx.GO_CHANGED, false);
    h.ctx.failure = ''; h.run("go('docs')"); h.released();
  });
  check('nested navigation retains its caller hold until the caller returns', () => {
    const h = harness(source);
    assert.equal(h.run(`holdAssets(() => {
      const before = allAssets(); go('docs');
      return ASSETS_HELD === before && allAssets() === before && HELD_MEMO.size === 2;
    })`), true);
    assert.equal(h.ctx.stats.builds, 1); h.released();
  });
  check('scheduled frame and microtask read fresh records outside the navigation hold', () => {
    const h = harness(source); h.ctx.deferred = true; h.run("go('plant')"); h.released();
    h.ctx.fixture.revision = 3; h.ctx.fixture.rentals['SYN-A'] = 'after navigation';
    for (const fn of h.microtasks) fn();
    for (const fn of h.frames) fn();
    assert.equal(h.ctx.asyncSeen.length, 2);
    assert(h.ctx.asyncSeen.every(rows => rows[0].revision === 3 && rows[0].rental === 'after navigation'));
    assert.equal(h.ctx.stats.builds, 3); h.released();
  });
  check('a direct render after a record refresh remains fresh', () => {
    const h = harness(source); h.run("go('docs')");
    h.ctx.fixture.revision++; h.ctx.fixture.rentals['SYN-A'] = 'refresh';
    h.run('render()');
    assert.equal(h.models().content[0].revision, 2);
    assert.equal(h.models().content[0].rental, 'refresh'); h.released();
  });
  check('capability refresh still runs on every draw after permission changes', () => {
    const h = harness(source); h.run("go('docs')");
    h.ctx.permission = 'edit'; h.run("go('edit')");
    h.ctx.permission = 'view'; h.run('render()');
    assert.deepEqual(h.ctx.stats.capabilities, ['view', 'edit', 'view']); h.released();
  });
  check('unknown tabs and register aliases keep their original routes', () => {
    const h = harness(source); h.run("go('missing')");
    assert.equal(h.ctx.state.tab, 'today'); h.run("go('register')");
    assert.equal(h.ctx.state.tab, 'plant'); h.released();
  });
  check('forecast and Rehire builders each run once within a shared hold', () => {
    const h = harness(source);
    assert.equal(h.run(`holdAssets(() => {
      const forecast = cj764Model(), rehire = rh766Model();
      return forecast === cj764Model() && rehire === rh766Model() &&
        rehire.forecast === forecast && modelCalls.forecast === 1 && modelCalls.rehire === 1;
    })`), true);
    h.released();
  });
  check('standalone model calls stay uncached and read later record edits', () => {
    const h = harness(source);
    const first = h.run('rh766Model()');
    h.ctx.fixture.revision = 2; h.ctx.fixture.assets[0].qty = 7;
    const second = h.run('rh766Model()');
    assert.notEqual(first, second);
    assert.equal(second.forecast.revision, 2); assert.equal(second.forecast.units, 8);
    assert.equal(h.run('modelCalls.forecast === 2 && modelCalls.rehire === 2'), true); h.released();
  });
  check('new model holds and standalone calls cannot reuse a completed hold', () => {
    const h = harness(source); h.run('holdAssets(rh766Model)'); h.released();
    h.ctx.fixture.revision = 2; h.ctx.fixture.assets.pop();
    const standalone = h.run('rh766Model()');
    assert.equal(standalone.forecast.revision, 2); assert.equal(standalone.references, 1);
    h.ctx.fixture.revision = 3; h.ctx.fixture.assets = [];
    const next = h.run('holdAssets(rh766Model)');
    assert.equal(next.forecast.revision, 3); assert.equal(next.references, 0);
    assert.equal(h.run('modelCalls.forecast === 3 && modelCalls.rehire === 3'), true); h.released();
  });
  check('failed model construction is not cached and a later hold recovers', () => {
    const h = harness(source); h.ctx.failure = 'forecast';
    assert.throws(() => h.run('holdAssets(rh766Model)'), /synthetic forecast error/); h.released();
    h.ctx.failure = ''; h.ctx.fixture.revision = 2;
    assert.equal(h.run('holdAssets(rh766Model)').forecast.revision, 2); h.released();
  });
  check('a scheduled model calculation reads a fresh snapshot', () => {
    const h = harness(source);
    h.run(`holdAssets(() => {
      rh766Model();
      queueMicrotask(() => asyncSeen.push(holdAssets(rh766Model)));
    })`); h.released();
    h.ctx.fixture.revision = 4;
    for (const fn of h.microtasks) fn();
    assert.equal(h.ctx.asyncSeen[0].forecast.revision, 4);
    assert.equal(h.run('modelCalls.forecast === 2 && modelCalls.rehire === 2'), true); h.released();
  });
  console.log(`${passed}/${passed} navigation regressions passed`);
}
main().catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => { if (temp) fs.rmSync(temp, {recursive: true, force: true}); });
