/* Today selected-card motion v8.20. Author: Andrew Fisher. No records or preferences are written. */
(() => {
  'use strict';
  if (window.TodayMotion820) window.TodayMotion820.destroy();
  const pane = document.getElementById('pane-today');
  if (!pane) return;
  const selector = '.inst > .card.lights, .inst > .card.dialcard, .inst > .card.racecard';
  const interactive = 'a,button,input,select,textarea,summary,label,[role="button"],[role="link"],[tabindex],[contenteditable],[data-go],[data-week-day],[data-lf-go],[data-gscope]';
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const listeners = new AbortController();
  const cards = new Map();
  const animations = new Set();
  let selected = null, running = null, disposed = false, queued = false, reason = 'initial';
  let printing = false;
  let motionGuard = 0;
  // Remove an orphaned guard before installing this controller.
  document.getElementById('today-motion-static-guard')?.remove();
  const staticStyle = document.createElement('style');
  staticStyle.id = 'today-motion-static-guard';
  staticStyle.textContent = `
    #pane-today .inst .today-enhanced .gineedle,
    #pane-today .inst .today-enhanced .gifill,
    #pane-today .inst .today-enhanced .gidig b,
    #pane-today .inst .today-enhanced .dled i { animation:none; transition:none; }
    @media print { #pane-today .today-motion-button { display:none!important; } }
  `;
  document.head.appendChild(staticStyle);

  function motionOffHere() {
    if (mq && mq.matches) return true;
    if (document.documentElement.dataset.motion === 'off') return true;
    try { return typeof motionOff === 'function' && !!motionOff(); } catch (_) { return false; }
  }
  function visible(card) {
    if (!card || !card.isConnected || document.hidden || printing) return false;
    if (getComputedStyle(pane).display === 'none' || pane.hidden) return false;
    const rect = card.getBoundingClientRect();
    // The native app scrolls main below a fixed header. Its clipping area is smaller
    // than the window, so a card behind that header is already out of view.
    const main = pane.closest('main');
    const clip = main ? main.getBoundingClientRect() : {top: 0, left: 0, bottom: innerHeight, right: innerWidth};
    return rect.width > 0 && rect.height > 0 && rect.bottom > Math.max(0, clip.top) && rect.right > Math.max(0, clip.left)
      && rect.top < Math.min(innerHeight, clip.bottom) && rect.left < Math.min(innerWidth, clip.right);
  }
  function allowed(card) { return !motionOffHere() && visible(card); }
  function updateControls() {
    const off = motionOffHere();
    for (const [key, rec] of cards) {
      const active = running === key;
      rec.card.classList.toggle('today-selected', selected === key);
      rec.card.classList.toggle('today-running', active);
      rec.button.setAttribute('aria-pressed', String(active));
      rec.button.disabled = off;
      const label = active ? 'Pause animation' : 'Play animation';
      if (rec.button.textContent !== label) rec.button.textContent = label;
      rec.button.setAttribute('aria-label', label + ' — ' + rec.title);
      rec.button.title = off ? 'Animation follows your reduced motion or Motion Off setting' : label + ' for this card';
    }
  }
  function stop(why) {
    if (motionGuard) clearTimeout(motionGuard);
    motionGuard = 0;
    for (const animation of animations) animation.cancel();
    animations.clear();
    running = null;
    reason = why || 'paused';
    updateControls();
  }
  function guardMotion() {
    if (disposed || !running || motionGuard) return;
    // Media-query change delivery can be delayed or missed. While a user-started effect is
    // active, one lightweight guard also reads the current preference. No layout is queried,
    // no idle timer is kept, and every stop/destroy cancels the pending check.
    motionGuard = window.setTimeout(() => {
      motionGuard = 0;
      if (disposed || !running) return;
      if (motionOffHere() || document.hidden || printing || !cards.get(running)?.card.isConnected) {
        stop('motion preference or visibility guard');
      } else guardMotion();
    }, 250);
  }
  function animate(node, frames, options) {
    if (!node || typeof node.animate !== 'function') return;
    const animation = node.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => {
      // Removing the effect reveals the native final reading, already present in the markup.
      animations.delete(animation);
      animation.cancel();
    }, () => { animations.delete(animation); });
  }
  const sweep = {duration: 1450, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'both'};
  function sweepDelivery(card) {
    const gauge = card.querySelector('.cgauge.gi');
    if (!gauge) return;
    const needle = gauge.querySelector('.gineedle');
    const target = parseFloat(gauge.style.getPropertyValue('--gi-to'));
    // The native instrument is calibrated from -130 to +130 degrees. Never overshoot its true reading.
    if (needle && Number.isFinite(target) && target >= -130 && target <= 130) {
      animate(needle, [{transform: 'rotate(-130deg)'}, {transform: 'rotate(' + target + 'deg)'}], sweep);
    }
    const fill = gauge.querySelector('.gifill');
    if (fill) {
      const length = fill.getTotalLength();
      if (Number.isFinite(length) && length > 0) {
        animate(fill, [
          {strokeDasharray: length + ' ' + length, strokeDashoffset: String(length)},
          {strokeDasharray: length + ' ' + length, strokeDashoffset: '0'}
        ], sweep);
      }
    }
    card.querySelectorAll('.dled').forEach(strip => {
      strip.querySelectorAll('i.on').forEach((led, index) => {
        // Reveal only segments the native record already lights; dark segments never switch on.
        animate(led, [{opacity: .18, transform: 'scaleY(.45)'}, {opacity: 1, transform: 'scaleY(1)'}], {
          duration: 440, delay: Math.min(index * 42, 800), easing: 'ease-out', fill: 'both'
        });
      });
    });
  }
  function sweepProgramme(card) {
    card.querySelectorAll('.pgm').forEach(programme => {
      const value = parseFloat(programme.style.getPropertyValue('--p'));
      if (!Number.isFinite(value) || value < 0 || value > 100) return;
      const end = value + '%';
      animate(programme.querySelector('.pfill'), [{width: '0%'}, {width: end}], sweep);
      animate(programme.querySelector('.pdot'), [{left: '0%'}, {left: end}], sweep);
    });
  }
  function ambient(card, key) {
    const loop = {duration: 3400, iterations: Infinity, easing: 'ease-in-out'};
    if (key === 'lights') {
      // Only the already illuminated lens breathes: the selected traffic state never changes.
      card.querySelectorAll('.sighead circle[filter]').forEach(glow => {
        const opacity = Number(glow.getAttribute('opacity')) || .55;
        animate(glow, [{opacity}, {opacity: Math.min(.9, opacity + .22)}, {opacity}], loop);
      });
    } else if (key === 'delivery') {
      animate(card.querySelector('.giglass'), [{opacity: .7}, {opacity: 1}, {opacity: .7}], loop);
    } else if (key === 'programme') {
      const marker = card.querySelector('.pdot');
      if (marker) {
        const original = getComputedStyle(marker).boxShadow;
        animate(marker, [{boxShadow: original}, {boxShadow: '0 0 0 5px rgba(255,106,19,.14), 0 0 18px rgba(255,106,19,.6)'}, {boxShadow: original}], loop);
      }
    }
  }
  function play(key, replay) {
    const rec = cards.get(key);
    if (!rec) return;
    stop('selection');
    selected = key;
    if (!allowed(rec.card)) { reason = 'motion unavailable'; updateControls(); return; }
    running = key;
    reason = 'playing';
    updateControls();
    if (replay) {
      if (key === 'delivery') sweepDelivery(rec.card);
      if (key === 'programme') sweepProgramme(rec.card);
    }
    ambient(rec.card, key);
    guardMotion();
    document.dispatchEvent(new CustomEvent('todaymotionselection', {detail: {card: key, running: true}}));
  }
  function checkVisibility() {
    if (running && !allowed(cards.get(running)?.card)) stop('not visible or motion off');
    else updateControls();
  }
  const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    // IntersectionObserver accounts for ancestor clipping; an old detached target
    // must never stop its newly rendered replacement.
    const active = cards.get(running)?.card;
    if (active && entries.some(entry => entry.target === active && !entry.isIntersecting)) stop('not visible');
    checkVisibility();
  }, {threshold: 0}) : null;
  function mount() {
    if (disposed) return;
    queued = false;
    let replacedRunning = null;
    const found = new Map();
    pane.querySelectorAll(selector).forEach(card => {
      const key = card.classList.contains('lights') ? 'lights' : card.classList.contains('racecard') ? 'programme' : 'delivery';
      found.set(key, card);
    });
    for (const [key, rec] of cards) {
      if (found.get(key) === rec.card) continue;
      if (running === key) { replacedRunning = key; stop('render refreshed'); }
      if (intersection) intersection.unobserve(rec.card);
      cards.delete(key);
    }
    for (const [key, card] of found) {
      // Native giSweeps marks first entry with .sweep. Today remains at its accurate inline endpoint.
      card.querySelectorAll('.cgauge.gi.sweep').forEach(gauge => gauge.classList.remove('sweep'));
      if (cards.has(key)) continue;
      card.classList.add('today-enhanced');
      card.dataset.todayCard = key;
      const head = card.querySelector('.hubtitle, .phead');
      if (!head) continue;
      let button = head.querySelector('.today-motion-button');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'today-motion-button';
        head.appendChild(button);
      }
      const title = head.querySelector('h3')?.textContent.trim() || key;
      cards.set(key, {card, button, title});
      if (intersection) intersection.observe(card);
    }
    if (selected && !cards.has(selected)) selected = null;
    // A record refresh preserves selection, but never reruns the zero-to-reading sweep.
    if (replacedRunning && cards.has(replacedRunning)) play(replacedRunning, false);
    checkVisibility();
  }
  function scheduleMount(records) {
    if (disposed || queued) return;
    if (records && records.every(record => record.target instanceof Element && record.target.closest('.today-motion-button'))) return;
    queued = true;
    queueMicrotask(mount);
  }
  pane.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('[data-today-card]');
    if (!card || !pane.contains(card) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const key = card.dataset.todayCard;
    if (target.closest('.today-motion-button')) {
      event.preventDefault();
      if (running === key) stop('paused by user');
      else play(key, true);
      return;
    }
    if (target.closest(interactive) || window.getSelection()?.toString()) return;
    if (running !== key) play(key, true);
  }, {signal: listeners.signal});
  const mutation = new MutationObserver(scheduleMount);
  mutation.observe(pane, {childList: true, subtree: true});
  const visibility = new MutationObserver(checkVisibility);
  visibility.observe(pane, {attributes: true, attributeFilter: ['class', 'style', 'hidden']});
  visibility.observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
  for (const event of ['visibilitychange', 'gc500motionchange']) document.addEventListener(event, checkVisibility, {signal: listeners.signal});
  for (const event of ['hashchange', 'resize']) window.addEventListener(event, checkVisibility, {passive: true, signal: listeners.signal});
  window.addEventListener('scroll', checkVisibility, {passive: true, capture: true, signal: listeners.signal});
  window.addEventListener('pagehide', () => stop('page hidden'), {signal: listeners.signal});
  window.addEventListener('beforeprint', () => { printing = true; stop('printing'); }, {signal: listeners.signal});
  window.addEventListener('afterprint', () => { printing = false; updateControls(); }, {signal: listeners.signal});
  function mediaChanged(event) {
    // The event's new value is authoritative even if a browser updates matches later.
    if (event.matches) stop('reduced motion');
    else checkVisibility();
  }
  if (mq?.addEventListener) mq.addEventListener('change', mediaChanged);
  else if (mq?.addListener) mq.addListener(mediaChanged);
  window.TodayMotion820 = {
    refresh: mount,
    report: () => ({version: 'v8.20', selected, running, reason, cards: cards.size, animations: animations.size, reduced: motionOffHere(), guardActive: !!motionGuard}),
    destroy() {
      disposed = true;
      stop('destroyed');
      listeners.abort();
      if (mq?.removeEventListener) mq.removeEventListener('change', mediaChanged);
      else if (mq?.removeListener) mq.removeListener(mediaChanged);
      mutation.disconnect();
      visibility.disconnect();
      if (intersection) intersection.disconnect();
      for (const {card, button} of cards.values()) {
        button.remove();
        card.classList.remove('today-enhanced', 'today-selected', 'today-running');
        delete card.dataset.todayCard;
      }
      cards.clear();
      staticStyle.remove();
      delete window.TodayMotion820;
    }
  };
  mount();
})();
