"""Author: Andrew Fisher. Private manual banner-video repair, no record changes."""
from pathlib import Path
import hashlib,sys
BASE_SHA='a505155e749d35c2231add24762a2db08ae617b9efcd4d06c8aee8507750a414'
def apply(source):
    if 'const canPlayMedia =' in source: raise ValueError('Manual banner-video patch already applied')
    def rep(old,new):
        nonlocal source
        if source.count(old)!=1: raise ValueError('Expected one source match: '+old[:100])
        source=source.replace(old,new,1)
    rep("boardStop(); /* the previous board's resources, released first */\n const fig = pane.querySelector('.bhero[data-board]'); if (!fig) return;", "const fig = pane.querySelector('.bhero[data-board]'); if (!fig) return;\n boardStop(); /* replace resources only when this pane actually contains a board */")
    rep("let generation = 0, requested = false, disposed = false;", "let generation = 0, requested = false, disposed = false, loadTimer = 0, retryLoad = false;\n const clearLoadTimer = () => { if (loadTimer) { clearTimeout(loadTimer); loadTimer = 0; } };")
    rep("generation++; requested = false; vid.pause(); fig.classList.remove('playing');", "generation++; requested = false; clearLoadTimer(); vid.pause(); fig.classList.remove('playing');")
    rep("const showStatus = text => { if (status) { status.textContent = text; status.hidden = !text; } };", "const showStatus = text => { if (status) { status.textContent = text; status.hidden = !text; } };\n const playLabel = text => { if (label) label.textContent = text; play.setAttribute('aria-label', text); play.title = text; };")
    rep("play.hidden = false; if (label) label.textContent = 'Play with sound'; showStatus('');", "play.hidden = false; playLabel('Play with sound'); showStatus('');")
    rep("if (label) label.textContent = 'Retry clip';", "playLabel('Retry clip');")
    rep("stop(); if (disposed || !document.body.contains(fig)) return;", "stop(); retryLoad = true; if (disposed || !document.body.contains(fig)) return;")
    rep("try { if (vid.error) vid.load(); vid.currentTime = 0; } catch (e) {}", "try { if (retryLoad || vid.error || vid.networkState === 3 /* NETWORK_NO_SOURCE */) { retryLoad = false; vid.load(); } vid.currentTime = 0; } catch (e) {}")
    rep("if (disposed || !requested || !canPage()) { vid.pause(); return; }\n fig.classList.add('playing'); play.hidden = true; showStatus('');", "if (disposed || !requested || !canPlayMedia()) { vid.pause(); return; }\n clearLoadTimer(); fig.classList.add('playing'); play.hidden = false; playLabel('Stop clip'); showStatus('');")
    rep("if (motionOff()) { flash('Decorative motion is off. Enable Subtle in Tools to play this clip.'); return; }\n if (!canPage() || disposed) return;", "if (disposed) return;\n if (requested) { stop(); return; }\n if (!canPlayMedia()) return;")
    rep("if (label) label.textContent = 'Loading clip…';", "playLabel('Cancel loading');\n clearLoadTimer();\n loadTimer = setTimeout(() => { if (!disposed && generation === mine && requested) failed(); }, 20000);")
    rep("if (disposed || generation !== mine || !requested || !canPage()) { vid.pause(); return; }", "if (generation !== mine) { if (disposed || !requested) vid.pause(); return; } // do not pause a later explicit Play\n if (disposed || !requested || !canPlayMedia()) { vid.pause(); return; }")
    rep("const canPage = () => document.body.contains(board) && pane.classList.contains('on')\n && !fig.classList.contains('folded') && document.visibilityState !== 'hidden'\n && BOARD_RUN.seen && !motionOff();", "/* Explicit Play is separate from decorative motion. It never enables automatic board or weather animation. */\n const canPlayMedia = () => document.body.contains(board) && pane.classList.contains('on')\n && !fig.classList.contains('folded') && document.visibilityState !== 'hidden' && BOARD_RUN.seen;\n const canPage = () => canPlayMedia() && !motionOff();")
    rep("if (vid && BOARD_RUN.stopMedia) BOARD_RUN.stopMedia();\n } else if (!BOARD_RUN.timer) BOARD_RUN.timer = setInterval(tick, 6000);\n if (play) { play.disabled = motionOff(); play.title = play.disabled ? 'Enable Subtle motion in Tools to play the clip' : 'Play the clip with sound'; }", "} else if (!BOARD_RUN.timer) BOARD_RUN.timer = setInterval(tick, 6000);\n if (!canPlayMedia() && vid && BOARD_RUN.stopMedia) BOARD_RUN.stopMedia();\n if (play) play.disabled = false;")
    rep("@media (prefers-reduced-motion:reduce){ .vmsb{transition:none} .bhero video{display:none} }", "@media (prefers-reduced-motion:reduce){ .vmsb{transition:none} .bhero video{transition:none} }")
    rep('html[data-motion="off"] .vmsb{transition:none} html[data-motion="off"] .bhero video{display:none}', 'html[data-motion="off"] .vmsb{transition:none} html[data-motion="off"] .bhero video{transition:none}')
    return source
if __name__=='__main__':
    src=Path(sys.argv[1]);out=Path(sys.argv[2]);raw=src.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=BASE_SHA: raise SystemExit('Private preview requires verified current live base')
    result=apply(raw.decode());out.write_text(result)
    print(hashlib.sha256(out.read_bytes()).hexdigest())
