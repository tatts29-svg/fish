"""Author: Andrew Fisher. Typed artwork in the existing pickup/departure stamps."""
import base64
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE = '7a745c28b0f66d3d0062255cde90e15b393b111d3b54df8c7dbff18479935e1c'
PREVIOUS = 'v12.66'


def additions():
    js = (HERE / 'artwork1268_src.js').read_text()
    css = (HERE / 'artwork1268.css').read_text()
    for key in 'abcde':
        art = (HERE / 'assets' / ('atlas-' + key + '.webp')).read_bytes()
        if len(art) > 200_000 or art[:4] != b'RIFF' or art[8:12] != b'WEBP':
            raise ValueError('Expected reviewed small WebP atlas ' + key)
        marker = '__ATLAS_' + key.upper() + '__'
        if css.count(marker) != 1:
            raise ValueError('Expected one atlas insertion for ' + key)
        css = css.replace(marker, base64.b64encode(art).decode())
    return '<script id="artwork1268-script">\n' + js + '\n</script>\n', '<style id="artwork1268-style">\n' + css + '</style>\n'


def replacements(text):
    script, style = additions()
    helper = re.search(r'/\* Author: Andrew Fisher\. Decorative equipment-type artwork; no record inference\. \*/\nconst PICKEDUP_ART1266_TOWER = .*?(?=function stampHtml\(c\) \{)', text, re.S)
    old_style = re.search(r'<style id="pickedup1266-style">.*?</style>\n', text, re.S)
    if not helper or not old_style:
        raise ValueError('Expected the complete preceding artwork implementation')
    return [
        (helper.group(0), '', 'replace the former single-type artwork helper'),
        ('pickedupArt1266(c)', "(W.Artwork1268 ? W.Artwork1268.html(c) : '')", 'shared picked-up card artwork'),
        ('<script id="departed1232-script">', script + '<script id="departed1232-script">', 'shared typed artwork helper'),
        ('function html(o) {\n    const p = parts(o && o.at), big = !!(o && o.big);',
         'function html(o, artwork) {\n    const p = parts(o && o.at), big = !!(o && o.big);', 'departure stamp typed context'),
        ("e('Departed ' + when) + '\"><b>Departed</b><em>'", "e('Departed ' + when) + '\">' + (W.Artwork1268 ? W.Artwork1268.html(artwork) : '') + '<b>Departed</b><em>'", 'departure stamp background artwork'),
        ('W.Stamp1232.html({at: x.g.at, date: x.g.date, by: x.g.by})',
         'W.Stamp1232.html({at: x.g.at, date: x.g.date, by: x.g.by}, W.Artwork1268 ? W.Artwork1268.reference(r.key) : null)', 'legacy Demob explicit departure types'),
        ('html({at: g.at, date: g.date, by: g.by, big: true})',
         'html({at: g.at, date: g.date, by: g.by, big: true}, W.Artwork1268 ? W.Artwork1268.reference(a.key) : null)', 'reference drawer explicit departure types'),
        ('root.Stamp1232.html(departure)',
         'root.Stamp1232.html(departure, root.Artwork1268 ? root.Artwork1268.reference(asset.key) : null)', 'Build departure explicit types'),
        ("    function html(model) {\n      if (!model) return '';\n      let detail = '';",
         "    function html(model, item) {\n      if (!model) return '';\n      let detail = '';", 'supplier stamp own-item parameter'),
        ("stamp.html({at: model.event?.departedAt1211 || null, date: model.event?.date || null, by: model.event?.by || ''})",
         "stamp.html({at: model.event?.departedAt1211 || null, date: model.event?.date || null, by: model.event?.by || ''}, {item})", 'supplier stamp own-item context'),
        ('unitHtml: (ref, id, item, physical) => html(unit(ref, id, item, physical)), quantityHtml: (ref, item) => html(quantity(ref, item))',
         'unitHtml: (ref, id, item, physical) => html(unit(ref, id, item, physical), item), quantityHtml: (ref, item) => html(quantity(ref, item), item)', 'supplier unit and quantity render entry points'),
        (old_style.group(0), style, 'replace former artwork style with shared atlas styles'),
        ("+' · " + PREVIOUS + "'; /* v8.19 release922", "+' · v12.68'; /* v8.19 release922", 'release footer')
    ]


def patch(text):
    if 'artwork1268-script' in text:
        raise ValueError('All-type pickup artwork is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE:
        raise ValueError('Expected exact verified predecessor; rebase and retest on a changed live page')
    out = text
    for old, new, label in replacements(text):
        if out.count(old) != 1:
            raise ValueError('Expected one exact replacement: ' + label)
        # Shared uniqueness guard, then exact-byte replacement so adjacent whitespace stays intact.
        rep(out, old, new, label, __file__)
        out = out.replace(old, new, 1)
    return out


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.68 applied: typed orange artwork across existing pickup and departure stamps')
