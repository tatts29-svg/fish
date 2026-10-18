"""Author: Andrew Fisher. Calculate the hidden Today report panel when printing.

The embedded report's header is already hidden by the native screen stylesheet;
its action row is moved into Today. Keep those controls and the native report
calculations, but do not build its hidden financial instrument on every tab visit.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep


RUNTIME = r"""/* Author: Andrew Fisher. v10.66: only the already-hidden embedded Today report is deferred. */
const TodayReport1066 = (() => {
 let printing=false, last=null;
 function embedded() {
  const pane=document.getElementById('pane-progress');
  return state.tab==='today' && pane && pane.parentElement?.id==='pane-today'
   && pane.classList.contains('wwa793') ? pane : null;
 }
 function defer() {
  return !!embedded() && !printing && !document.body.classList.contains('printing-progress')
   && !document.body.classList.contains('showing') && !window.matchMedia('print').matches;
 }
 function stopHidden() {
  cancelAnimationFrame(WIP.raf); WIP.raf=0;
  clearTimeout(WIP.swapT); WIP.swapT=0;
  if(WIP.ro) { WIP.ro.disconnect(); WIP.ro=null; }
  WIP.model=null;
 }
 function html(asOf) {
  if(!defer()) return '<div class="chero">'+wipPanel(asOf)+'</div>';
  stopHidden();
  return '<div class="chero" data-wip1066-day="'+esc(asOf)+'"></div>';
 }
 function settle(pane) {
  const root=pane?.querySelector('section.wip'), model=WIP.model;
  if(!root || !model?.mode?.[root.dataset.mode]) return;
  cancelAnimationFrame(WIP.raf); WIP.raf=0;
  clearTimeout(WIP.swapT); WIP.swapT=0;
  wipDraw(root,model.mode[root.dataset.mode].v);
  root.classList.remove('enter','moving');
  wipShell(root);
 }
 function flush() {
  const pane=embedded(); if(!pane) return false;
  const host=pane.querySelector(':scope > .dsn > .head > .chero[data-wip1066-day]');
  if(!host) { settle(pane); return false; }
  const day=host.dataset.wip1066Day;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) throw new Error('Deferred report date is invalid');
  // The native button and beforeprint can run in the same print request. Reuse
  // only an unchanged record/configuration; a received save invalidates this.
  const context=carryContext1066();
  if(!last || last.host!==host || last.day!==day || !sameCarry1066(last.context,context)) {
   holdAssets(()=>{host.innerHTML=wipPanel(day);wipWire(pane);});
   last={host,day,context:carryContext1066()};
  }
  settle(pane);
  return true;
 }
 return {html,flush,begin:()=>{printing=true;},end:()=>{printing=false;last=null;}};
})();
window.addEventListener('beforeprint',()=>{TodayReport1066.begin();TodayReport1066.flush();});
window.addEventListener('afterprint',()=>TodayReport1066.end());

"""

HEAD_ANCHOR = 'function dsnHead(asOf){'
PANEL = '<div class="chero">${wipPanel(asOf)}</div>'
PANEL_NEW = '${TodayReport1066.html(asOf)}'
EARLY_PRINT = """window.addEventListener('beforeprint', () => { /* registered before v7.95's, so the folds it opens for paper are already drawn */
 const pp = document.getElementById('pane-progress');"""
EARLY_PRINT_NEW = """window.addEventListener('beforeprint', () => { /* registered before v7.95's, so the folds it opens for paper are already drawn */
 TodayReport1066.begin(); /* v10.66: a native print redraw must build its full report. */
 const pp = document.getElementById('pane-progress');"""
BUTTON = """ pane.querySelector('#printProgress').onclick = () => {
 /* Where we are on paper:"""
BUTTON_NEW = """ pane.querySelector('#printProgress').onclick = () => {
 TodayReport1066.flush(); /* v10.66: prepare the native report synchronously. */
 /* Where we are on paper:"""


def apply(text, path):
    text = rep(text, HEAD_ANCHOR, RUNTIME + HEAD_ANCHOR, 'defer hidden Today report only', path)
    text = rep(text, PANEL, PANEL_NEW, 'retain report header and action row', path)
    text = rep(text, EARLY_PRINT, EARLY_PRINT_NEW, 'print redraws always construct full report', path)
    text = rep(text, BUTTON, BUTTON_NEW, 'native Print prepares current hidden report', path)
    return text
