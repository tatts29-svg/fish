"""Author: Andrew Fisher. Link the supplied Concert pin to the shared map/master/reference."""
from pathlib import Path
from rep import rep
HERE=Path(__file__).resolve().parent
def patch_location1004(s):
    if 'function generatorPlace1004(' in s: raise ValueError('Generator location already applied')
    edits=[
      ('function buildAllAssets(){',(HERE/'generator_location1004.js').read_text()+'\nfunction buildAllAssets(){','Shared supplied-map location'),
      ('locations: moved ? [moved] : asPlanned,',"locations: moved ? [moved] : a.key==='GN?' ? [generatorPlace1004().text] : asPlanned,\n _generatorPosition1004: a.key==='GN?'&&!moved,",'Concert destination across the master record'),
      ('(function masterSheet(){','generatorMaster1004();\n(function masterSheet(){','Place the supplied pin before master markers are built'),
      ("function masterUnit(ref){ const m = MASTER_LOC[ref];", "function masterUnit(ref){ if(ref==='GN?'&&((S.fixes||{})[ref]||(S.places||{})[ref]))return null;const m = MASTER_LOC[ref];",'Later native Concert positions take precedence'),
      ("pt: m.pt, sec: m.sec || '', assets:","pt: generatorMapPoint1004(a,m), sec: m.sec || '', assets:",'Live Concert master position'),
      ("  if (!a || a.key !== 'GN13' || a._locationMoved) return destination;", "  if(a&&a.key==='GN?'&&!a._locationMoved)return Object.assign({},destination,{text:generatorPlace1004().text,raw:generatorPlace1004().text,known:true,quoted:false,confidence:'confirmed',source:generatorPlace1004().source,fallback:''});\n  if (!a || a.key !== 'GN13' || a._locationMoved) return destination;",'Generator map source is explicit'),
      ("Concert generators: two 200 kVA units. Original schedule reference GN?. The asset numbers and delivery dockets are matched; the issued plans do not identify their exact position.","Concert generators: 2 × 200 kVA. Macintosh Island Park, beside the path junction near the peacock enclosure. Position supplied by Andrew Fisher on 12 Oct 2026; confirm individual asset numbers on site.",'Replace superseded location question'),
      ("['R11', QH_OPEN, 'Concert generators — exact map position', 'Two synced 200 kVA units: 1316182 on DD 26121298, loading 11:00; 1316183 on DD 26121310, loading 11:30. Scheduled 12 Oct.', 'Match the exact Concert generator position to the issued plan. Asset identities and delivery dockets are known; no arrival is inferred from a booking.', 'plant']", "['R11', QH_DONE, 'Concert generators — position confirmed', '2 × 200 kVA at Macintosh Island Park. Andrew supplied the map pin on 12 Oct: -27.984576, 153.427700.', 'Map, master reference and generator costing share this position. Individual asset numbers remain subject to confirmation.', 'plant']", 'Close the answered location question'),
    ]
    for old,new,label in edits:s=rep(s,old,new,label,'location1004')
    return s
