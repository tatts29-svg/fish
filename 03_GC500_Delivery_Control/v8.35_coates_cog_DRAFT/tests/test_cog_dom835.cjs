/* Author: Andrew Fisher. Synthetic DOM lifecycle checks; no browser or private media. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const sourcePath = path.join(__dirname, '..', 'cog_film835_src.js');
// stdin permits a before/after check against an in-memory source snapshot.
const source = fs.readFileSync(process.env.COG_SOURCE835_STDIN === '1' ? 0 : sourcePath, 'utf8');

async function settle() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

function fixture() {
  const mutationObservers = [];
  const intersectionObservers = [];

  class Target extends EventTarget {
    constructor() { super(); this.listeners = new Map(); }
    addEventListener(type, callback, options) {
      super.addEventListener(type, callback, options);
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
      if (options?.signal) options.signal.addEventListener('abort', () => {
        this.listeners.get(type)?.delete(callback);
      }, {once:true});
    }
    removeEventListener(type, callback, options) {
      super.removeEventListener(type, callback, options);
      this.listeners.get(type)?.delete(callback);
    }
    listenerCount(type) { return this.listeners.get(type)?.size || 0; }
  }

  class Element extends Target {
    constructor(tagName, parent = null) {
      super();
      this.tagName = tagName.toUpperCase();
      this.nodeType = 1;
      this.parentElement = parent;
      this.parentNode = parent;
      this.children = [];
      if (parent) parent.children.push(this);
      this.attributes = new Map();
      this.isConnected = true;
      this.textContent = '';
    }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      for (const observer of mutationObservers) observer.notify(this, name);
    }
    removeAttribute(name) {
      if (!this.attributes.delete(name)) return;
      for (const observer of mutationObservers) observer.notify(this, name);
    }
    hasAttribute(name) { return this.attributes.has(name); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    get hidden() { return this.hasAttribute('hidden'); }
    set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
    contains(other) {
      for (let node = other; node; node = node.parentElement) if (node === this) return true;
      return false;
    }
    closest(selector) {
      assert.equal(selector, '[inert],[hidden]');
      for (let node = this; node; node = node.parentElement) {
        if (node.hasAttribute('inert') || node.hasAttribute('hidden')) return node;
      }
      return null;
    }
    getBoundingClientRect() { return {top:0,left:0,right:800,bottom:450,width:800,height:450}; }
  }

  class MutationObserver {
    constructor(callback) { this.callback = callback; this.watches = []; this.records = []; this.scheduled = false; mutationObservers.push(this); }
    observe(target, options) { this.watches.push({target,options}); }
    disconnect() { this.watches = []; this.records = []; }
    notify(target, attributeName) {
      if (!this.watches.some(w => w.options.attributes &&
          (w.target === target || w.options.subtree && w.target.contains(target)) &&
          (!w.options.attributeFilter || w.options.attributeFilter.includes(attributeName)))) return;
      this.records.push({type:'attributes',target,attributeName});
      if (this.scheduled) return;
      this.scheduled = true;
      queueMicrotask(() => {
        this.scheduled = false;
        const records = this.records.splice(0);
        if (records.length && this.watches.length) this.callback(records, this);
      });
    }
  }

  class IntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); intersectionObservers.push(this); }
    observe(target) { this.targets.add(target); }
    disconnect() { this.targets.clear(); }
    intersect(target, ratio) {
      if (this.targets.has(target)) this.callback([{target,isIntersecting:ratio > 0,intersectionRatio:ratio}], this);
    }
  }

  class Video extends Element {
    constructor(parent) {
      super('video', parent);
      this.paused = true;
      this.error = null;
      this.plays = 0;
      this.loads = 0;
      this.sourceNodes = [];
      this.innerHTML = '<source src="fixture-preview.mp4" type="video/mp4">';
    }
    play() { this.plays += 1; this.paused = false; return Promise.resolve(); }
    pause() {
      const changed = !this.paused;
      this.paused = true;
      if (changed) queueMicrotask(() => this.dispatchEvent(new Event('pause')));
    }
    load() { this.loads += 1; }
    querySelector(selector) {
      assert.equal(selector, 'source[src]');
      return this.sourceNodes.find(node => node.hasAttribute('src')) || null;
    }
    querySelectorAll(selector) { assert.equal(selector, 'source'); return this.sourceNodes; }
    set innerHTML(value) {
      this.sourceNodes = [...String(value).matchAll(/<source\s+src="([^"]*)"\s+type="([^"]*)">/g)].map(match => {
        const node = new Element('source');
        node.setAttribute('src', match[1]); node.setAttribute('type', match[2]);
        return node;
      });
    }
  }

  const document = new Target();
  const window = new Target();
  document.hidden = false;
  document.documentElement = new Element('html');
  document.body = new Element('body', document.documentElement);
  const main = new Element('main', document.body);
  const pane = new Element('section', main);
  const pic = new Element('div', pane);
  const video = new Video(pic);
  const open = new Element('button', pic);
  const toggle = new Element('button', pic);
  pic.querySelector = selector => { assert.equal(selector, 'video'); return video; };
  window.IntersectionObserver = IntersectionObserver;
  window.MutationObserver = MutationObserver;
  const elements = {'#cwHero':pic,'#cwFilmOpen':open,'#cwFilmPreview':toggle,'main':main};
  const context = vm.createContext({
    window,document,Event,EventTarget,AbortController,MutationObserver,IntersectionObserver,
    queueMicrotask,Promise,innerWidth:1000,innerHeight:800,
    DATA:{machine:{hero:{mp4:'fixture-preview.mp4',full_mp4:'fixture-full.mp4'}}},
    state:{tab:'coatesway'},motionOff:() => false,esc:String,
    $:selector => elements[selector] || null
  });
  vm.runInContext(source, context, {filename:sourcePath,timeout:1000});
  const run = expression => vm.runInContext(expression, context, {timeout:1000});
  const show = () => intersectionObservers.forEach(observer => observer.intersect(pic, 1));
  const activeIntersections = () => intersectionObservers.filter(observer => observer.targets.size).length;
  const activeMutations = () => mutationObservers.filter(observer => observer.watches.length).length;
  return {document,window,main,pane,pic,video,toggle,run,show,activeIntersections,activeMutations};
}

async function playingFixture(t) {
  const f = fixture();
  t.after(() => f.run('cogFilmUnmount835()'));
  f.run('cogFilmMount835()');
  f.show();
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.plays, 1);
  return f;
}

test('ancestor inert and hero hidden changes suspend and resume an already visible preview', async t => {
  const f = await playingFixture(t);
  f.main.setAttribute('inert', ''); // The current machine opener changes this, with no geometry change.
  await settle();
  assert.equal(f.video.paused, true, 'An overlay must suspend the visible preview without an IO event');
  f.main.removeAttribute('inert');
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.plays, 2);
  f.pic.hidden = true;
  await settle();
  assert.equal(f.video.paused, true);
  f.pic.hidden = false;
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.plays, 3);

  f.toggle.onclick();
  await settle();
  f.main.setAttribute('inert', '');
  await settle();
  f.main.removeAttribute('inert');
  await settle();
  assert.equal(f.video.paused, true, 'An overlay closing cannot override a manual pause');
  assert.equal(f.video.plays, 3);
});

test('a native pause updates the preview control and one click resumes playback', async t => {
  const f = await playingFixture(t);
  f.video.pause();
  await settle();
  assert.equal(f.run('COG_FILM835.inline.player.desired()'), false);
  assert.equal(f.toggle.textContent, 'Play preview');
  assert.equal(f.toggle.getAttribute('aria-pressed'), 'false');
  f.toggle.onclick();
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.plays, 2, 'One action resumes a native pause');
  assert.equal(f.toggle.textContent, 'Pause preview');
  assert.equal(f.toggle.getAttribute('aria-pressed'), 'true');
});

test('pagehide releases observers, listeners and sources; pageshow rehydrates once and preserves manual pause', async t => {
  const f = await playingFixture(t);
  f.run('cogFilmMount835()'); // Rewiring the same node must not create another owner.
  assert.equal(f.activeIntersections(), 1);
  assert.equal(f.document.listenerCount('visibilitychange'), 1);
  assert.equal(f.window.listenerCount('pagehide'), 1);
  f.toggle.onclick();
  await settle();
  f.window.dispatchEvent(new Event('pagehide'));
  await settle();
  assert.equal(f.run('COG_FILM835.inline'), null);
  assert.equal(f.activeIntersections(), 0);
  assert.equal(f.activeMutations(), 0);
  for (const event of ['visibilitychange','gc500motionchange']) assert.equal(f.document.listenerCount(event), 0, event);
  for (const event of ['pagehide','beforeprint','afterprint']) assert.equal(f.window.listenerCount(event), 0, event);
  assert.equal(f.window.listenerCount('pageshow'), 1, 'The single global restore hook remains');
  assert.equal(f.video.listenerCount('playing'), 0);
  assert.equal(f.video.listenerCount('pause'), 0);
  assert.equal(f.video.querySelector('source[src]'), null);
  assert.equal(f.video.loads, 1);
  const plays = f.video.plays;
  f.main.setAttribute('inert', '');
  f.main.removeAttribute('inert');
  f.document.dispatchEvent(new Event('visibilitychange'));
  await settle();
  assert.equal(f.video.plays, plays, 'Released callbacks cannot restart media');

  f.window.dispatchEvent(new Event('pageshow'));
  f.show();
  await settle();
  assert.equal(f.video.querySelector('source[src]').getAttribute('src'), 'fixture-preview.mp4');
  assert.equal(f.activeIntersections(), 1);
  assert.equal(f.document.listenerCount('visibilitychange'), 1);
  assert.equal(f.window.listenerCount('pagehide'), 1);
  assert.equal(f.video.paused, true);
  assert.equal(f.video.plays, plays, 'A cache restore respects the prior manual pause');
  assert.equal(f.toggle.textContent, 'Play preview');
  f.toggle.onclick();
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.plays, plays + 1);
});
