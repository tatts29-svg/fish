/* Author: Andrew Fisher. The map explorer is a separate same-origin document.
   Apply its one field correction when the existing frame finishes loading;
   no polling, observers, record writes or change to map behaviour. */
function contrast1007Map(frame) {
  try {
    const doc = frame && frame.contentDocument;
    if (!doc || !doc.head || !doc.getElementById('q')) return false;
    const url = new URL(doc.URL, location.href);
    if (url.origin !== location.origin || !/\/explorer\/index\.html$/.test(url.pathname)) return false;
    if (!doc.getElementById('contrast1007-map')) {
      const style = doc.createElement('style');
      style.id = 'contrast1007-map';
      style.textContent = '@media screen {#q::placeholder{color:#c5b4a8!important;-webkit-text-fill-color:#c5b4a8!important;opacity:1!important}}';
      doc.head.appendChild(style);
    }
    return true;
  } catch (_) { return false; }
}
