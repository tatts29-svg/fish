/* Author: Andrew Fisher. Recovery is an explicit press; never open or reload a billed 3D session automatically. */
let bootPhase813 = 'library', bootTimer813 = 0, graphicsLost813 = false, terminalProblem813 = null;
function bootProblem813(kind) {
  clearTimeout(bootTimer813);
  const words = {
    library: 'The 3D viewer could not load. Check the connection, then press Retry 3D.',
    access: '3D map access could not be loaded. Check the connection, then press Retry 3D.',
    graphics: 'This browser could not start 3D graphics. Retry, or use the 2D map on this device.',
    imagery: 'The 3D imagery could not load. Check the connection, then press Retry 3D.',
    slow: '3D is taking longer to load. You can wait, or press Retry 3D to start again.',
    context: 'The browser stopped 3D graphics. Press Retry 3D, or return to the 2D map.',
    render: 'The 3D picture stopped drawing. Press Retry 3D, or return to the 2D map.'
  };
  if (kind !== 'slow') terminalProblem813 = kind;
  window.__bootError = kind; window.__ready = false;
  try { if (EMBED3D && window.parent.gc500Explorer3DFailed813) window.parent.gc500Explorer3DFailed813(window); } catch (e) {}
  $('loadText').textContent = words[kind] || words.imagery;
  $('retry3d813').hidden = false;
  $('loader').classList.remove('done');
  if (kind !== 'slow' && viewer) { stopMotion813(); viewer.useDefaultRenderLoop = false; }
}
function stopMotion813() {
  stopOrbit(); stopFace();
  if (viewer && viewer.camera) viewer.camera.cancelFlight();
}
$('retry3d813').onclick = () => { $('retry3d813').disabled = true; location.reload(); };
