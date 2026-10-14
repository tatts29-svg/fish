# Author: Andrew Fisher.
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

def apply(html):
    if 'id="persistence1010-script"' in html:
        raise SystemExit('v10.10 persistence already applied')
    if 'root.Idle1006={capture,restore,redraw,refreshDrawer};' not in html:
        raise SystemExit('v10.10 persistence needs the v10.06 refresh helpers')
    old = 'requestAnimationFrame(() => { if (db && Math.abs(db.scrollTop - held.top) > 1) db.scrollTop = held.top; if (Math.abs(dr.scrollTop - held.dtop) > 1) dr.scrollTop = held.dtop; });'
    new = '''const ref1010=state.sel,intent1010=window.Persistence1010?.intent;
 requestAnimationFrame(() => { if (!dr.classList.contains('on') || state.sel!==ref1010 || !db?.isConnected || dr.querySelector('.db')!==db || window.Persistence1010?.intent!==intent1010) return; if (Math.abs(db.scrollTop - held.top) > 1) db.scrollTop = held.top; if (Math.abs(dr.scrollTop - held.dtop) > 1) dr.scrollTop = held.dtop; });'''
    html = rep(html, old, new, 'yield queued drawer scroll to user navigation', 'v10.10')
    html = rep(html,
        "<div class=\"hint\">${SYNC.on ? 'Saved in the shared record.' : 'Saved in this browser only. Use Export to keep it.'}</div></div>",
        '<div class="hint">Use Save note to record your changes.</div></div>',
        'neutral note guidance instead of an unconditional shared-save claim', 'v10.10')
    html = rep(html,
        "S.notes[a.key] = $('#noteBox').value; stampIt('notes', a.key, who); bump(); flash('Note saved.'); };",
        "S.notes[a.key] = $('#noteBox').value; stampIt('notes', a.key, who); bump(); flash(bump.kept === false ? 'Not saved yet · keep this page open.' : 'Note saved on this device.'); };",
        'note Save feedback follows the local save result', 'v10.10')
    script = Path(__file__).with_name('persistence1010.js').read_text()
    return rep(html, '\n</body>\n</html>', '<script id="persistence1010-script">\n' + script + '\n</script>\n</body>\n</html>', 'preserve open details on refresh', 'v10.10')
