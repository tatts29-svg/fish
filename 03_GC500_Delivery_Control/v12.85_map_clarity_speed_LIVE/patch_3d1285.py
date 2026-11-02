"""Author: Andrew Fisher. Start independent 3D prerequisites together, on demand."""
import argparse
import hashlib
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'f8403834a1336ce15e9e296f46413bbf3dfd132bc5011a02a49813340c694efb'


def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('3D startup patch requires the exact restored v12.81 child')
    label = 'poc3d/index.html'
    text = rep(text,
        "async function key() {\n  const m = /^\\/w\\/([A-Za-z0-9_-]{16,128})\\//.exec(location.pathname);\n  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);\n  try {",
        "async function key(signal1285) {\n  const m = /^\\/w\\/([A-Za-z0-9_-]{16,128})\\//.exec(location.pathname);\n  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);\n  const cancel1285 = () => controller.abort();\n  if (signal1285) {\n    if (signal1285.aborted) cancel1285();\n    else signal1285.addEventListener('abort', cancel1285, {once: true});\n  }\n  try {",
        'make the access request cancellable with its 3D opening', label)
    text = rep(text,
        "return j.google.key;\n  } finally { clearTimeout(timer); }\n}",
        "return j.google.key;\n  } finally {\n    clearTimeout(timer);\n    if (signal1285) signal1285.removeEventListener('abort', cancel1285);\n  }\n}",
        'release the access cancellation hook', label)
    text = rep(text,
        "async function boot() {\n  try {\n    await loadCesiumLibrary();",
        """async function boot() {
  /* Author: Andrew Fisher. v12.85: this page is opened by an explicit 3D action.
     Fetch its independent access/configuration and viewer library together.
     No Google 3D request starts until both succeed; a failed/left opening cancels
     access, and every rejection is handled even if the library fails first. */
  const accessScope1285 = new AbortController();
  const leave1285 = () => accessScope1285.abort();
  window.addEventListener('pagehide', leave1285, {once: true});
  const accessJob1285 = key(accessScope1285.signal).then(
    value => ({value}), () => ({failed: true}));
  try {
    await loadCesiumLibrary();
    if (accessScope1285.signal.aborted) return;""",
        'start the library and access prerequisites in parallel', label)
    text = rep(text,
        "const k = await key(); $('loadText').textContent = 'Starting the 3D scene…';",
        """const access1285 = await accessJob1285;
    if (accessScope1285.signal.aborted) return;
    if (access1285.failed) throw new Error('Map access unavailable');
    const k = access1285.value; $('loadText').textContent = 'Starting the 3D scene…';""",
        'join prerequisites before opening the billed scene', label)
    text = rep(text,
        "} catch (e) { bootProblem813(terminalProblem813 || (graphicsLost813 ? 'context' : bootPhase813)); }\n}\nfunction perfText()",
        """} catch (e) {
  if (!accessScope1285.signal.aborted) bootProblem813(terminalProblem813 || (graphicsLost813 ? 'context' : bootPhase813));
} finally {
  accessScope1285.abort();
  window.removeEventListener('pagehide', leave1285);
}
}
function perfText()""",
        'cancel access after a failed or completed opening', label)
    return text


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('source')
    p.add_argument('output')
    a = p.parse_args()
    raw = Path(a.source).read_bytes()
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise SystemExit('STOP: unexpected 3D base bytes')
    target = Path(a.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(apply(raw.decode()))
    print('3D candidate SHA-256:', hashlib.sha256(target.read_bytes()).hexdigest())
