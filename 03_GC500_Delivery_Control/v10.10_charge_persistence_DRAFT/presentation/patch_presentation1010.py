"""Author: Andrew Fisher. Six precise help disclosures; no figures or records change."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep

TODAY = '''<p class="maphint">Press <b>/</b> on a keyboard, or tap Search, to search from anywhere. Every card opens the tab that does the work; a link to any asset, day or tab can be copied and sent —
 <span class="mono">#asset/GN01</span>, <span class="mono">#day/2026-09-14</span>, <span class="mono">#fencing</span>.</p>'''
SUPPLIER = '<p class="sub">Choose a company for its identified units, quantity-only stock, supplier delivery plan and original quotes. Ownership is recorded per item; a location may contain more than one company. Owner and costing branch are recorded separately.</p>'
ORDER = '<p class="flow891-note">Change the order on the list below — drag, or ▲ ▼ (Alt + arrows on the keyboard). The Load numbers renumber on the Drivers and Install PDFs, the messages to install teams and this day. Drivers are told to turn up in this order.</p>'
WINDOW = """const unknown = M.unknownWindows ? '<p class="flow891-note">' + M.unknownWindows + ' load' + (M.unknownWindows === 1 ? ' has' : 's have') + ' no arrival window yet — a Kingston load time on the schedule, a saved Truck flow window, or a planned unloading window in Crew puts ' + (M.unknownWindows === 1 ? 'it' : 'them') + ' in the area check.</p>' : '';"""
INTRO = '''<p class="maphint"><b>This job, laid against the cog.</b> Not a copy of the model — the record's own numbers
 arranged the way The Coates Way arranges them, from Best Service &amp; Value at the centre out to the
 behaviours at the teeth. A measure this record cannot answer is left out, not estimated.</p>'''
MACHINE = '''<p class="sub"><b>The Coates Way sets our direction.</b> The cog is the steering wheel of the Coates #26 — in the driver's hands, on the column, its shaft to the rack: ${esc(parts)}, every one linked to what it drives, the 138 of the wheel's own each with its Coates Way link. Start the V8 on the dyno, open the cutaway, lift the wheel off its quick-release, pull it apart, put it back.</p>'''
INVENTORY = """<div class="hint">Press any number to see which locations are behind it. Total on site = at locations + spares. At locations: the order's quantity once it is ticked on site (or what was recorded as supplied).Mixed-item locations use their recorded item identities; identities with an unresolved item or arrival are not assigned to another type. Cancelled orders are not counted.</div>"""


def apply(page):
    if 'presentation1010|' in page:
        raise ValueError('Presentation help patch is already present')

    def once(old, new, title):
        nonlocal page
        page = rep(page, old, new, title, 'v10.10 presentation')

    once(TODAY, "${moreInfo('presentation1010|today-help', `" + TODAY + "`)}", 'Today search help')
    once(SUPPLIER, "'+moreInfo('presentation1010|subhire-help','" + SUPPLIER + "')+'", 'Supplier ownership help')
    once("const orderNote = X.length > 1 ? '" + ORDER + "' : '';",
         "const orderNote = X.length > 1 ? moreInfo('presentation1010|truck-order-help', '" + ORDER + "') : '';",
         'Truck order help')
    once(WINDOW,
         """const unknown = M.unknownWindows ? '<p class="flow891-note">' + M.unknownWindows + ' load' + (M.unknownWindows === 1 ? ' has' : 's have') + ' no arrival window yet.</p>' + moreInfo('presentation1010|truck-window-help', '<p class="flow891-note">The area check uses a Kingston load time on the schedule, a saved Truck flow window, or a planned unloading window in Crew.</p>') : '';""",
         'Keep missing-window count visible; disclose source explanation')
    once(INTRO, '', 'Move Coates Way introduction into machine help')
    once(MACHINE, "${moreInfo('presentation1010|coatesway-help', `" + INTRO + '\n' + MACHINE + "`)}", 'One machine help disclosure')
    once("const body994=st.closest('#cwmachine')?.querySelector(':scope > details.sfold > .sfoldbody');",
         "const body994=st.closest('#cwmachine')?.querySelector('details[data-sfold=\"presentation1010|coatesway-help\"] > .sfoldbody')||st.closest('#cwmachine')?.querySelector(':scope > details.sfold > .sfoldbody');",
         'Ready machine status uses the same help disclosure')
    once(INVENTORY,
         '<div class="hint">Select a quantity to see locations.</div>\n' +
         "${moreInfo('presentation1010|inventory-help', `<div class=\"hint\">" +
         INVENTORY.split('Press any number to see which locations are behind it. ', 1)[1] + "`)}",
         'Inventory count basis')
    return page


if __name__ == '__main__':
    Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
