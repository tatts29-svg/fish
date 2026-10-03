/* Author: Andrew Fisher. One pending request, cancelled on navigation or after 30 seconds. */
function expCancel3d813(){
 if (EXP.mode3dTimer) clearTimeout(EXP.mode3dTimer);
 EXP.mode3dTimer = 0; EXP.mode3dTries = 0; EXP.mode3d = false;
}
function expFlush3d(){
 if (!EXP.mode3d || EXP.mode3dTimer) return;
 if (state.tab !== 'map' || state.sheet !== SAT_EXPLORER) { expCancel3d813(); return; }
 try {
  const w = EXP.frame && EXP.frame.contentWindow;
  if (w && w.__ready && w.GC500Explorer && typeof w.GC500Explorer.mode3d === 'function') {
   w.GC500Explorer.mode3d(true); expCancel3d813(); return;
  }
 } catch (e) {}
 EXP.mode3dTries = (EXP.mode3dTries || 0) + 1;
 if (EXP.mode3dTries >= 120) {
  expCancel3d813();
  flash('The map is taking longer to open. Choose 3D again to retry.');
  return;
 }
 EXP.mode3dTimer = setTimeout(() => { EXP.mode3dTimer = 0; expFlush3d(); }, 250);
}
