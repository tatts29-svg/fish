# Author: Andrew Fisher. Child overlays leave their parent view and focus intact.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def patch(html):
    if 'navigation994-script' in html:
        raise RuntimeError('Navigation v9.94 is already applied')
    html = rep(html,
        "const selector='dialog,.drawer[role=\"dialog\"],.pdf7[role=\"dialog\"],#drv782,#flow891name,#ep819print,.printask';",
        "const selector='dialog,.drawer[role=\"dialog\"],.pdf7[role=\"dialog\"],.mkpick[role=\"dialog\"],#drv782,#flow891name,#ep819print,.printask';", 'Map callout navigation', __file__)
    html = rep(html,
        'window.Navigation934={enhance,depart,layers,top};',
        'window.Navigation934={enhance,depart,layers,top,remember(n,target){enhance(n);const entry=tracked.get(n);if(entry)entry.opener=target;}};', 'Original callout focus target', __file__)
    html = rep(html,
        "if (fullBtn) { fullBtn.setAttribute('aria-pressed', on); fullBtn.title = on ? 'Leave full screen (Esc)' : 'Full screen'; }",
        "if (fullBtn) { fullBtn.setAttribute('aria-pressed', on); fullBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); fullBtn.title = on ? 'Leave full screen (Esc)' : 'Full screen'; }", 'Map fullscreen accessible name', __file__)
    folder = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(folder, 'navigation994.css'), encoding='utf-8') as file:
        css = file.read()
    with open(os.path.join(folder, 'navigation994.js'), encoding='utf-8') as file:
        js = file.read()
    head = "</head>\n<body>\n<!-- The delivery status instrument's materials"
    html = rep(html, head, '<style id="navigation994-style">' + css + '</style>\n' + head, 'Child overlay styles', __file__)
    tail = '</script>\n</body>\n</html>'
    return rep(html, tail, '</script>\n<script id="navigation994-script">' + js + '</script>\n</body>\n</html>', 'Child overlay lifecycle', __file__)
