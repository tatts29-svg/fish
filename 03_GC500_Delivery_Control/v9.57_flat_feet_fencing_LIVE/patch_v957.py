# Author: Andrew Fisher
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1])
raw = p.read_bytes()
s = raw.decode('utf-8-sig')
assert 'function installFlatFeet957' not in s, 'v9.57 is already applied'
assert 'function transport956Demand' in s and " · v9.56'; /* v8.19" in s, 'Requires v9.56 base'
s = rep(s, 'const FCOL = FENCE.columns || [];',
        'const FCOL = FENCE.columns || [];\n' + (HERE / 'flatfeet957.js').read_text(),
        'flat-feet source mapping', str(p))
s = rep(s, 'function fenceInstallationWeeks847() {',
        (HERE / 'ccbreview957.js').read_text() + '\nfunction fenceInstallationWeeks847() {',
        'two source-backed CCB classifications', str(p))
s = rep(s, "const COLLECT_WORDS = {mesh_panel: ['mesh panel', 'mesh panels'],",
        "const COLLECT_WORDS = {flat_feet_ccb: ['flat-feet CCB', 'flat-feet CCBs'], mesh_panel: ['mesh panel', 'mesh panels'],",
        'flat-feet physical component label', str(p))
s = rep(s, "const PAPER_PARTS = [['mesh_panel', 'Mesh panels'],",
        "const PAPER_PARTS = [['flat_feet_ccb', 'Flat-feet CCBs'], ['mesh_panel', 'Mesh panels'],",
        'flat-feet native component field', str(p))
s = rep(s, "const FENCE_GEAR_COLS = ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc'];",
        "const FENCE_GEAR_COLS = ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc', 'flat_feet'];",
        'flat-feet rehire classification', str(p))
s = rep(s, "sum('ccb_event')+sum('ccb_demarc')", "sum('ccb_event')+sum('ccb_demarc')+sum('flat_feet')",
        'flat-feet overview metres', str(p))
s = rep(s, "sum('ccb_event') + sum('ccb_demarc')", "sum('ccb_event') + sum('ccb_demarc') + sum('flat_feet')",
        'flat-feet legacy summary metres', str(p))
s = rep(s, " · v9.56'; /* v8.19", " · v9.57'; /* v8.19", 'footer', str(p))
assert 'const DATA = {' in s
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + s.encode())
