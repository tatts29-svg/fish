"""Author: Andrew Fisher. Keep the shared-record timestamp readable on narrow phones."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="presentation1016-style"' in html:
        raise ValueError('v10.16 presentation already applied')
    for token in ['function recStrip(waiting, since){', '.recstrip .rsw em{order:2}', 'id="selection-save1012-style"']:
        if html.count(token)!=1:
            raise ValueError('Current record-pod dependency missing: '+token)
    return rep(html,'\n</head>\n<body>\n','\n<style id="presentation1016-style">\n'+(HERE/'presentation1016.css').read_text()+'\n</style>\n</head>\n<body>\n',
               'Keep the shared-record timestamp inside its existing pod','v10.16 presentation')
