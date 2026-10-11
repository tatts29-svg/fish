"""Author: Andrew Fisher. Native per-description counts in the shared reference drawer."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / 'toolchain'))
from rep import rep


def patch(html):
    if 'const Description998 =' in html:
        raise RuntimeError('Description quantities already applied')
    if 'const ItemPhotos965 =' not in html or 'function panel925(a)' not in html:
        raise RuntimeError('Description quantities require the current shared item drawer')
    html = rep(html, 'const ItemPhotos965 = (() => {',
               (HERE / 'description998.js').read_text() + '\nconst ItemPhotos965 = (() => {',
               'Shared native quantity label', 'quantities998')
    # Explicit option values keep description identity stable when the visible label includes a count.
    html = rep(html,
        '<label class="units925-description">Description<select data-ro data-unit925-description>\'+model.groups.map(x=>\'<option\'+(x.item===choice?\' selected\':\'\')+\'>\'+esc925(x.item)+\'</option>\').join(\'\')+\'</select></label>',
        '<label class="units925-description">Description · planned quantity<select data-ro data-unit925-description>\'+model.groups.map(x=>\'<option value="\'+esc925(x.item)+\'"\'+(x.item===choice?\' selected\':\'\')+\'>\'+esc925(Description998.label(x.item,x.quantity))+\'</option>\').join(\'\')+\'</select></label>',
        'Description choices retain native values and show planned quantity', 'quantities998')
    html = rep(html,
        "(quantityOnly962?'Quantity only':g.units.filter(u=>u.physical).length+' identified')+(g.quantity==null?'':' · '+g.quantity+' planned')",
        "(quantityOnly962?'Quantity only':g.units.filter(u=>u.physical).length+' identified')",
        'Remove repeated planned quantity below the description', 'quantities998')
    html = rep(html,
        '<div class="item933-head"><div><h4>\'+esc925(u.item||\'Description to confirm\')+\'</h4><b class="item933-number">',
        '<div class="item933-head"><div><h4>\'+esc925(Description998.label(u.item,u.physical?1:null))+\'</h4><b class="item933-number">',
        'One physical unit per identified asset card', 'quantities998')
    html = rep(html,
        '<div class="item933-head"><div><h4>\'+esc(g.item)+\'</h4><b class="item933-number">Quantity \'+g.quantity+\'</b><small>No fleet numbers</small>',
        '<div class="item933-head"><div><h4>\'+esc(Description998.label(g.item,g.quantity))+\'</h4><small>No fleet numbers</small>',
        'Quantity-only item count beside description once', 'quantities998')
    return html
