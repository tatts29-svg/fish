/* Author: Andrew Fisher. Portable media lifecycle tests; no browser, network or record data. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const sourcePath = path.join(__dirname, '..', 'cog_film835_src.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const marker = '/* Browser integration */';
const boundary = source.indexOf(marker);
assert.ok(boundary > 0, 'source declares a pure factory before the browser integration');
assert.equal(source.indexOf(marker, boundary + marker.length), -1, 'integration boundary is unique');
const createCogMedia835 = vm.runInNewContext(
  source.slice(0, boundary) + '\n;createCogMedia835;',
  {Event, EventTarget, queueMicrotask, setTimeout, clearTimeout},
  {filename: sourcePath, timeout: 1000}
);
assert.equal(typeof createCogMedia835, 'function');

class TestVideo extends EventTarget {
  constructor() {
    super();
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.plays = [];
    this.pauseCalls = 0;
    this.listeners = new Map();
    this.throwNext = null;
  }

  addEventListener(type, callback, options) {
    super.addEventListener(type, callback, options);
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }

  removeEventListener(type, callback, options) {
    super.removeEventListener(type, callback, options);
    this.listeners.get(type)?.delete(callback);
  }

  play() {
    if (this.throwNext) {
      const error = this.throwNext;
      this.throwNext = null;
      throw error;
    }
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    this.paused = false;
    this.ended = false;
    this.plays.push({promise, resolve, reject});
    return promise;
  }

  pause() {
    this.pauseCalls += 1;
    const changed = !this.paused;
    this.paused = true;
    if (changed) this.emit('pause');
  }

  emit(type) {
    this.dispatchEvent(new Event(type));
  }

  resolvePlay(index = this.plays.length - 1, emitPlaying = true) {
    assert.ok(this.plays[index], 'requested play exists');
    // A delayed browser play may become active after the owner already cancelled it.
    this.paused = false;
    this.ended = false;
    if (emitPlaying) this.emit('playing');
    this.plays[index].resolve();
  }

  rejectPlay(index = this.plays.length - 1) {
    assert.ok(this.plays[index], 'requested play exists');
    this.plays[index].reject(new Error('synthetic media unavailable'));
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((n, callbacks) => n + callbacks.size, 0);
  }
}

function setup(initialAllowed = true) {
  let permitted = initialAllowed;
  const video = new TestVideo();
  const states = [];
  const media = createCogMedia835(video, () => permitted, state => states.push(state));
  return {video, media, states, allow(value) { permitted = value; }};
}

async function settle() {
  // Flush play continuations and any rejection-handler continuation they enqueue.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test('desired playback waits for permission and one pending request is reused', async () => {
  const f = setup(false);
  assert.equal(f.media.desired(), true);
  f.media.sync();
  f.media.sync();
  assert.equal(f.video.plays.length, 0);
  assert.equal(f.media.status(), 'paused');

  f.allow(true);
  f.media.sync();
  assert.equal(f.media.status(), 'loading');
  for (let i = 0; i < 6; i += 1) f.media.sync();
  assert.equal(f.video.plays.length, 1, 'sync never creates parallel play requests');
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.sync();
  assert.equal(f.video.plays.length, 1, 'playing media is not restarted by reconciliation');
  assert.ok(f.states.includes('loading'));
  assert.ok(f.states.includes('playing'));
  assert.ok(f.states.every(state => ['paused', 'loading', 'playing', 'unavailable'].includes(state)));
  f.media.dispose();
});

test('fulfilled play is observed even when no playing event is delivered', async () => {
  const f = setup();
  f.media.sync();
  f.video.resolvePlay(0, false);
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('manual pause survives visibility changes until explicit Play', async () => {
  const f = setup();
  f.media.sync();
  f.video.resolvePlay();
  await settle();
  f.media.pause();
  assert.equal(f.media.desired(), false);
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.video.paused, true);
  f.allow(false);
  f.media.sync();
  f.allow(true);
  f.media.sync();
  assert.equal(f.video.plays.length, 1);
  assert.equal(f.media.desired(), false);
  f.media.play();
  assert.equal(f.media.desired(), true);
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('visibility suspension preserves automatic playback intent', async () => {
  const f = setup();
  f.media.sync();
  f.video.resolvePlay();
  await settle();
  f.allow(false);
  f.media.sync();
  assert.equal(f.video.paused, true);
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.media.desired(), true, 'programmatic suspension is not a user pause');
  f.allow(true);
  f.media.sync();
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('late fulfilled play cannot revive a hidden video', async () => {
  const f = setup();
  f.media.sync();
  f.allow(false);
  f.media.sync();
  const pauses = f.video.pauseCalls;
  f.video.resolvePlay();
  await settle();
  assert.equal(f.video.paused, true);
  assert.ok(f.video.pauseCalls > pauses, 'late playback is stopped again');
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.media.desired(), true);
  assert.equal(f.video.plays.length, 1);
  f.media.dispose();
});

test('rejection is handled without a retry storm and explicit Play retries', async () => {
  const f = setup();
  f.media.sync();
  f.video.rejectPlay();
  await settle();
  assert.equal(f.media.status(), 'unavailable');
  for (let i = 0; i < 8; i += 1) f.media.sync();
  assert.equal(f.video.plays.length, 1);
  f.media.play();
  assert.equal(f.video.plays.length, 2);
  assert.equal(f.media.status(), 'loading');
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('leaving and re-entering the allowed state permits one recovery attempt', async () => {
  const f = setup();
  f.media.sync();
  f.video.rejectPlay();
  await settle();
  f.allow(false);
  f.media.sync();
  assert.equal(f.media.status(), 'paused');
  f.allow(true);
  f.media.sync();
  assert.equal(f.video.plays.length, 2);
  for (let i = 0; i < 4; i += 1) f.media.sync();
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('a stale resolved request cannot pause newer legitimate playback', async () => {
  const f = setup();
  f.media.sync();
  f.allow(false);
  f.media.sync();
  f.allow(true);
  f.media.sync();
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay(1);
  await settle();
  const pauses = f.video.pauseCalls;
  f.video.resolvePlay(0);
  await settle();
  assert.equal(f.video.pauseCalls, pauses);
  assert.equal(f.video.paused, false);
  assert.equal(f.media.status(), 'playing');
  assert.equal(f.media.desired(), true);
  f.media.dispose();
});

test('a stale rejection cannot replace the state of newer playback', async () => {
  const f = setup();
  f.media.sync();
  f.media.pause();
  f.media.play();
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay(1);
  await settle();
  const pauses = f.video.pauseCalls;
  f.video.rejectPlay(0);
  await settle();
  assert.equal(f.video.pauseCalls, pauses);
  assert.equal(f.media.status(), 'playing');
  assert.equal(f.media.desired(), true);
  f.media.dispose();
});

test('manual pause also cancels a pending request and late playback', async () => {
  const f = setup();
  f.media.sync();
  f.media.pause();
  f.video.resolvePlay();
  await settle();
  assert.equal(f.video.paused, true);
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.media.desired(), false);
  f.media.sync();
  assert.equal(f.video.plays.length, 1);
  f.media.dispose();
});

test('native pause and ended events preserve the reader’s playback choice', async () => {
  const f = setup();
  f.media.sync();
  f.video.resolvePlay();
  await settle();
  f.video.pause();
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.media.desired(), false, 'native fullscreen controls can pause the film');
  f.media.sync();
  assert.equal(f.video.plays.length, 1);
  f.media.play();
  f.video.resolvePlay();
  await settle();
  f.video.ended = true;
  f.video.paused = true;
  f.video.emit('ended');
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.media.desired(), false);
  f.media.sync();
  assert.equal(f.video.plays.length, 2, 'an ended non-looping video awaits explicit replay');
  f.media.dispose();
});

test('media error is visible, bounded and recoverable', async () => {
  const f = setup();
  f.media.sync();
  f.video.resolvePlay();
  await settle();
  f.video.emit('error');
  assert.equal(f.media.status(), 'unavailable');
  for (let i = 0; i < 5; i += 1) f.media.sync();
  assert.equal(f.video.plays.length, 1);
  f.media.play();
  assert.equal(f.video.plays.length, 2);
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('a synchronous play failure follows the same bounded recovery path', async () => {
  const f = setup(false);
  f.video.throwNext = new Error('synthetic synchronous play failure');
  f.allow(true);
  assert.doesNotThrow(() => f.media.sync());
  await settle();
  assert.equal(f.media.status(), 'unavailable');
  for (let i = 0; i < 5; i += 1) f.media.sync();
  assert.equal(f.video.plays.length, 0);
  f.media.play();
  assert.equal(f.video.plays.length, 1);
  f.video.resolvePlay();
  await settle();
  assert.equal(f.media.status(), 'playing');
  f.media.dispose();
});

test('disposal removes listeners and late completion cannot revive playback', async () => {
  const f = setup();
  f.media.sync();
  assert.ok(f.video.listenerCount() > 0);
  f.media.dispose();
  assert.equal(f.video.listenerCount(), 0);
  assert.equal(f.video.paused, true);
  assert.equal(f.media.status(), 'paused');
  const notifications = f.states.length;
  f.media.dispose();
  f.media.sync();
  f.media.play();
  f.media.pause();
  f.video.resolvePlay();
  await settle();
  assert.equal(f.video.paused, true);
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.video.plays.length, 1);
  f.video.emit('error');
  f.video.emit('ended');
  assert.equal(f.states.length, notifications, 'disposed consumers receive no late notifications');
  assert.equal(f.video.listenerCount(), 0);
});

test('disposal also handles a late rejected promise without notification', async () => {
  const f = setup();
  f.media.sync();
  f.media.dispose();
  const notifications = f.states.length;
  f.video.rejectPlay();
  await settle();
  assert.equal(f.media.status(), 'paused');
  assert.equal(f.video.paused, true);
  assert.equal(f.states.length, notifications);
  assert.equal(f.video.listenerCount(), 0);
});
