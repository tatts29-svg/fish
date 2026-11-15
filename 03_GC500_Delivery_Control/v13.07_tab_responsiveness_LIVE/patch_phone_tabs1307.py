"""Author: Andrew Fisher. v13.07 phone tab captions, for the combined dashboard patch.

Keep the existing one-row tab bar, full desktop captions and accessible tab names.
Compact the active secondary caption at phone widths so it fits beside the primary tabs.
No navigation, pane, permission, record or financial behaviour changes.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    if 'tabCaption1307' in text:
        raise SystemExit('phone tab captions v13.07 are already applied')
    if 'scope1306(' not in text or 'navigation1243' not in text:
        raise SystemExit('phone tab captions require the current v13.06 dashboard base')

    text = rep(text,
        "const TAB_SHORT = {coatesway: 'Coates Way'};",
        """const TAB_SHORT = {coatesway: 'Coates Way'};
/* v13.07 - an active secondary view joins the phone row. Keep its full accessible and desktop name,
   with a short phone caption that fits the same existing column. */
const TAB_PHONE1307 = {map:'Map', docs:'Docs', fencing:'Fence', prestarts:'Pre-starts', servicing:'Service', vms:'VMS', questions:'Questions', about:'About'};
function tabCaption1307(k, label){
 const full = TAB_WORDS[k] || esc(TAB_SHORT[k] || label), phone = TAB_PHONE1307[k];
 return phone ? '<span class="tabcaption1307-wide" aria-hidden="true">' + full + '</span><span class="tabcaption1307-phone" aria-hidden="true">' + esc(phone) + '</span>' : full;
}""",
        'compact phone captions retain full tab names', path)

    text = rep(text,
        'TAB_SHORT[k] ? ' + chr(96) + ' aria-label=',
        'TAB_SHORT[k] || TAB_PHONE1307[k] ? ' + chr(96) + ' aria-label=',
        'full accessible name for compact phone captions', path)

    text = rep(text,
        '<span class="tw">${TAB_WORDS[k] || esc(TAB_SHORT[k] || l)}</span>',
        '<span class="tw">${tabCaption1307(k, l)}</span>',
        'render native tab captions by viewport', path)

    css = (HERE / 'phone_tabs1307.css').read_text(encoding='utf-8')
    text = rep(text, '</head>\n<body>', '<style id="phone-tabs1307-style">\n' + css + '\n</style>\n</head>\n<body>',
               'phone tab caption fit within the existing bar', path)
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('phone tab captions v13.07 applied')

