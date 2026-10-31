"""Author: Andrew Fisher. v11.46 - the crew card names each line in the crew's words with its symbol: "8 flush toilets", not
"8 × FWF"; "2 toilet blocks on sewer"; "2 sewer tanks"; "1 accessible toilet"; "2 toilet blocks, 16 pans each"; "1 4-person
trailer toilet". The record's own line ("8 × FWF") stays in small print beside the asset numbers, so the card still matches
the printed sheets.

Andrew, 23 Oct 2026: "We want to know is it a toilet flush or sewer tank and toilet block. Or sewer tank toilet. Pee panels.
Or disabled toilets". (No urinal is on the servicing record, so no line reads "pee panel".)

What changes, on the card only (the record and the printed codes untouched):
- a line's title: the kind's symbol (the v11.34 set) and the words, from the line's type and kind on the record; a label's
  place ("at EVL", "at the Coates office") is kept;
- the small line under the title: the record's label, then the asset numbers;
- the same words in the job buttons' spoken labels, the undo question, the "waiting for signal" list, the status page's lines
  and the focused reference under the plan.
Footer v11.44 -> v11.46 (v11.45 is claimed on the board). The crews see it once the trackers are published again.

    python3 patch_v1146.py page.html      (in place, on the live v11.44 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.37_card_zoom_LIVE'))
from rep import rep
import patch_v1137 as V37
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V37.E


def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)


WORDS_FNS = """function lineKind1146(l) {
  /* v11.46 - the symbol a single line takes: the same reading as kindOf1134 gives a reference */
  var t = String(l && l.type || ''), k = String(l && l.kind || '');
  if (/trailer/i.test(t)) return 'trailer'; if (k === 'access') return 'access'; if (k === 'block' || k === 'pan16') return 'block'; if (k === 'sewer') return 'sewer'; if (k === 'tank') return 'tank'; return 'fwf';
}
function words1146(l) {
  /* v11.46 - what the line is, in the crew's words: "8 flush toilets", not "8 × FWF"; the label's place ("at EVL") is kept */
  var t = String(l && l.type || ''), k = String(l && l.kind || ''), lab = String(l && l.label || '');
  var m = /^\\d+\\s*×\\s*.*?\\s(at\\s.+)$/.exec(lab), where = m ? ' ' + m[1] : '';
  var n = Number(l && l.qty) || (/^(\\d+)/.test(lab) ? Number(/^(\\d+)/.exec(lab)[1]) : 1), one, many;
  if (/trailer/i.test(t) && k === 'pump_only') { one = '4-person trailer toilet'; many = '4-person trailer toilets'; }
  else if (/trailer/i.test(t)) { one = 'trailer flush toilet'; many = 'trailer flush toilets'; }
  else if (k === 'access') { one = 'accessible toilet'; many = 'accessible toilets'; }
  else if (k === 'pan16') { one = '16-pan toilet block'; many = 'toilet blocks, 16 pans each'; }
  else if (k === 'sewer') { one = 'toilet block on sewer'; many = 'toilet blocks on sewer'; }
  else if (k === 'block') { one = 'toilet block'; many = 'toilet blocks'; }
  else if (k === 'tank') { one = 'sewer tank'; many = 'sewer tanks'; }
  else if (k === 'fwf' || k === 'pump_only' || /fwf/i.test(t)) { one = 'flush toilet'; many = 'flush toilets'; }
  else return lab || t;
  return n + ' ' + (n === 1 ? one : many) + where;
}
function symInline1146(kind) {
  return '<svg viewBox="0 0 20 20" class="lsym" aria-hidden="true"><circle cx="10" cy="10" r="9" class="disc"/>' + symHtml1134(kind, 10, 10, 9) + '</svg>';
}
"""
MAP_FNS = V37.MAP_FNS
MAP_FNS = once(MAP_FNS, "function symKey1134() {", WORDS_FNS + "function symKey1134() {", 'the words beside the symbols')
MAP_FNS = once(MAP_FNS, "return l.label || l.type || '';", "return words1146(l) || l.label || l.type || '';", 'the focused reference under the plan')
MAP_FNS = once(MAP_FNS, "kindOf: kindOf1134,", "kindOf: kindOf1134, words: words1146, lineKind: lineKind1146,", 'the map handle names the words')
CSS_ADD = ".lsym .disc{fill:#ffb347;stroke:#0e151c;stroke-width:1}.lsym .sym{stroke:#0e151c;stroke-width:1.6}.lsym .sym .dot{fill:#0e151c;stroke:none}.ltitle .lsym{width:28px;height:28px;vertical-align:-4px;margin-right:8px}.oline .lsym{width:16px;height:16px;vertical-align:-3px;margin-right:5px}.nos .rec{color:var(--mute)}\n"
CARD_CSS = V37.CARD_CSS + CSS_ADD

CARD_EDITS = [
    ("'<div class=\"line\"><h3 class=\"ltitle\">' + esc(l.label) + '</h3>' + (l.nos && l.nos.length ? '<p class=\"nos\"><b>Asset nos</b> ' + esc(l.nos.join(', ')) + '</p>' : '') +",
     "'<div class=\"line\"><h3 class=\"ltitle\">' + symInline1146(lineKind1146(l)) + esc(words1146(l)) + '</h3>' + ((l.label || (l.nos && l.nos.length)) ? '<p class=\"nos\">' + (l.label ? '<span class=\"rec\">' + esc(l.label) + '</span>' + (l.nos && l.nos.length ? ' · ' : '') : '') + (l.nos && l.nos.length ? '<b>Asset nos</b> ' + esc(l.nos.join(', ')) : '') + '</p>' : '') +",
     'the line title in words with its symbol, the record label small'),
    ("aria-label=\"' + esc(l.label + ', ' + longDay(day) + '\\'s jobs') + '\">'", "aria-label=\"' + esc(words1146(l) + ', ' + longDay(day) + '\\'s jobs') + '\">'", 'the jobs group spoken label'),
    ("(l ? ' · ' + l.label : '')", "(l ? ' · ' + words1146(l) : '')", 'the tick name'),
    ("', ' + l.label + ', '", "', ' + words1146(l) + ', '", 'the job button spoken label'),
    ("for ' + esc(l.label) + '?", "for ' + esc(words1146(l)) + '?", 'the undo question'),
    ("'<small>' + esc(e.l.label) + ' · '", "'<small>' + esc(words1146(e.l)) + ' · '", 'the status page line'),
    ("'<div class=\"oline\"><b>' + esc(l.label) + '</b><div class=\"chips\">'", "'<div class=\"oline\"><b>' + symInline1146(lineKind1146(l)) + esc(words1146(l)) + '</b><div class=\"chips\">'", 'the status page outstanding line'),
]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.46 requires the live v11.44 page ' + BASE_SHA256)
    if 'words1146' in text: raise ValueError('v11.46 already applied')
    text = rep(text, E(V37.MAP_FNS), E(MAP_FNS), 'card: the words beside the symbols', 'page')
    text = rep(text, E(V37.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    for old, new, what in CARD_EDITS: text = rep(text, E(old), E(new), 'card: ' + what, 'page')
    text = rep(text, "+' · v11.44'; /* v8.19 release922", "+' · v11.46'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle, n in [('function words1146', 1), ('function lineKind1146', 1), ('function symInline1146', 1), ('words1146(', 9), ('esc(l.label)', 1), ('esc(e.l.label)', 0), ('.ltitle .lsym{', 1), ('symInline1146(lineKind1146(l))', 2), ('words: words1146, lineKind: lineKind1146,', 1)]:
        if h.count(needle) != n: raise ValueError('the crew card template did not take v11.46 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print("patch_v1146 applied: the crew card's lines in the crew's words with their symbols, the record label small; footer v11.44 -> v11.46")
