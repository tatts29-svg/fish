"""Author: Andrew Fisher. Batch existing Today geometry reads before DOM writes."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

OLD_CONTROLS = """  function controls() {
    const root = board(); if (!root) return;
    runningInstrument = null;
    const off = motionOff();
    root.querySelectorAll('[data-tw840-area]').forEach(node => {
      const id = node.dataset.tw840Area, active = id === running;
      const target = active ? visibleMotionTarget(node) : null, type = target?.closest('[data-tw843-type-id]');
      node.classList.toggle('tw840-selected', id === selected);
      node.classList.toggle('tw840-running', active && !!target && !type);
      node.querySelectorAll('[data-tw843-type-id]').forEach(item => item.classList.toggle('tw843-running', active && item === type));
      if (active && target) runningInstrument = type ? {kind:'type',id:type.dataset.tw843TypeId,cardId:id} : {kind:'parent',id,cardId:id};
      const button = node.querySelector('[data-tw840-motion]'), name = areas.find(area => area.id === id)?.name || id;
      button.disabled = off;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? motionMode === 'auto' ? 'Pause automatic ' : 'Pause ' : 'Play ') + name + ' display animation');
      button.querySelector('span').textContent = off ? 'Off' : active ? motionMode === 'auto' ? 'Auto' : 'Pause' : 'Play';
      button.title = off ? 'Animation follows your reduced motion or Motion Off setting' : active ? (motionMode === 'auto' ? 'Automatic display animation · press to pause' : 'Display animation · press to pause') : 'Play display animation; figures stay unchanged';
      button.querySelector('path').setAttribute('d', active ? 'M7 5H10V19H7ZM14 5H17V19H14Z' : 'M8 5L19 12L8 19Z');
    });
  }"""

CONTROLS = """  function controls() {
    const root = board(); if (!root) return;
    runningInstrument = null;
    const off = motionOff(), nodes = [...root.querySelectorAll('[data-tw840-area]')];
    /* v10.66: measure the active instrument before changing any card's classes or text. */
    const activeNode = nodes.find(node => node.dataset.tw840Area === running);
    const activeTarget = activeNode ? visibleMotionTarget(activeNode) : null;
    const activeType = activeTarget?.closest('[data-tw843-type-id]');
    nodes.forEach(node => {
      const id = node.dataset.tw840Area, active = id === running;
      const target = active ? activeTarget : null, type = active ? activeType : null;
      node.classList.toggle('tw840-selected', id === selected);
      node.classList.toggle('tw840-running', active && !!target && !type);
      node.querySelectorAll('[data-tw843-type-id]').forEach(item => item.classList.toggle('tw843-running', active && item === type));
      if (active && target) runningInstrument = type ? {kind:'type',id:type.dataset.tw843TypeId,cardId:id} : {kind:'parent',id,cardId:id};
      const button = node.querySelector('[data-tw840-motion]'), name = areas.find(area => area.id === id)?.name || id;
      if (button.disabled !== !!off) button.disabled = off;
      attr1066(button, 'aria-pressed', String(active));
      attr1066(button, 'aria-label', (active ? motionMode === 'auto' ? 'Pause automatic ' : 'Pause ' : 'Play ') + name + ' display animation');
      text1066(button.querySelector('span'), off ? 'Off' : active ? motionMode === 'auto' ? 'Auto' : 'Pause' : 'Play');
      const title = off ? 'Animation follows your reduced motion or Motion Off setting' : active ? (motionMode === 'auto' ? 'Automatic display animation · press to pause' : 'Display animation · press to pause') : 'Play display animation; figures stay unchanged';
      if (button.title !== title) button.title = title;
      attr1066(button.querySelector('path'), 'd', active ? 'M7 5H10V19H7ZM14 5H17V19H14Z' : 'M8 5L19 12L8 19Z');
    });
  }"""

OLD_BRICK = """function brick795(boxes){
 const rows = h => String(Math.max(1, Math.ceil((h + 14) / 2)));
 const span = brick795.span = k => { if (k.closest('details:not([open])')) return; /* a closed fold has no height to pack by; it packs as it opens */
k.style.setProperty('--sp95', rows(k.getBoundingClientRect().height)); place799Soon(k.parentElement); };
 const ro = typeof ResizeObserver === 'function' ? (brick795.ro || (brick795.ro = new ResizeObserver(es => es.forEach(e => {
  if (e.target.closest('details:not([open])')) return;
  const b = e.borderBoxSize && e.borderBoxSize[0]; const h = b ? b.blockSize : e.contentRect.height;if (h > 0) { e.target.style.setProperty('--sp95', rows(h)); place799Soon(e.target.parentElement); } })))) : null;
 if (ro) ro.disconnect();
boxes.forEach(b => { b.classList.add('mas95'); [...b.children].forEach(k => { if (ro) ro.observe(k, {box: 'border-box'}); else span(k); }); place799Soon(b); });
}"""

BRICK = """function brick795(boxes){
 const rows = h => String(Math.max(1, Math.ceil((h + 14) / 2)));
 const put = ([k, value]) => { if (k.style.getPropertyValue('--sp95') !== value) k.style.setProperty('--sp95', value); place799Soon(k.parentElement); };
 /* v10.66: measure every open card first; writing a preceding span must not force the next measurement. */
 const batch = brick795.batch = cards => {
  const measured = [...cards].filter(k => !k.closest('details:not([open])')).map(k => [k, rows(k.getBoundingClientRect().height)]);
  measured.forEach(put);
 };
 brick795.span = k => batch([k]);
 const ro = typeof ResizeObserver === 'function' ? (brick795.ro || (brick795.ro = new ResizeObserver(es => {
  const measured = [];
  es.forEach(e => { if (e.target.closest('details:not([open])')) return;
   const b = e.borderBoxSize && e.borderBoxSize[0], h = b ? b.blockSize : e.contentRect.height;
   if (h > 0) measured.push([e.target, rows(h)]);
  });
  measured.forEach(put);
 }))) : null;
 if (ro) ro.disconnect();
 const fallback = [];
 boxes.forEach(b => { b.classList.add('mas95'); [...b.children].forEach(k => { if (ro) ro.observe(k, {box: 'border-box'}); else fallback.push(k); }); place799Soon(b); });
 if (fallback.length) batch(fallback);
}"""

def apply(text, path):
    text = rep(text, OLD_CONTROLS, CONTROLS, 'Today motion reads before writes', path)
    text = rep(text, OLD_BRICK, BRICK, 'Today card spans measured before writes', path)
    text = rep(text,
        "if (d.open && brick795.span) requestAnimationFrame(() => d.querySelectorAll('.mas95 > *').forEach(brick795.span));",
        "if (d.open && brick795.batch) requestAnimationFrame(() => brick795.batch(d.querySelectorAll('.mas95 > *')));",
        'fold opening batches card measurements', path)
    return text
