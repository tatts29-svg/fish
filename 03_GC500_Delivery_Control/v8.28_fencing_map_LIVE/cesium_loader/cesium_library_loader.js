/* Author: Andrew Fisher. Load the existing 3D library without blocking recovery.
   One attempt per page. Only the existing Retry button starts a fresh page;
   a late CDN response must never start map access after this attempt failed. */
let cesiumLibraryPromise = null;
function loadCesiumLibrary() {
  if (cesiumLibraryPromise) return cesiumLibraryPromise;
  cesiumLibraryPromise = new Promise((resolve, reject) => {
    if (window.Cesium) { resolve(window.Cesium); return; }
    const script = document.createElement('script');
    let settled = false, timer = 0;
    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      window.removeEventListener('pagehide', stopped);
      if (ok) resolve(window.Cesium);
      else {
        script.remove();
        reject(new Error('3D viewer library unavailable'));
      }
    };
    const stopped = () => finish(false);
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/npm/cesium@1.131.0/Build/Cesium/Cesium.js';
    script.onload = () => finish(!!window.Cesium);
    script.onerror = () => finish(false);
    window.addEventListener('pagehide', stopped, {once: true});
    timer = setTimeout(() => finish(false), 30000);
    try { document.head.appendChild(script); } catch (e) { finish(false); }
  });
  return cesiumLibraryPromise;
}
