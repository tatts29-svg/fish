# Author: Andrew Fisher
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '3da4e17980eead5cbf886dbbfab54f60c18aacd48405d92822869a7ce3637205'


def main():
    p = Path(sys.argv[1])
    s = p.read_text()
    if 'presentation994-style' in s:
        raise SystemExit('Already applied')
    if hashlib.sha256(p.read_bytes()).hexdigest() != BASE_SHA:
        raise SystemExit('Wrong base: requires exact live v9.93')
    s = rep(s, "+ ' · v9.93'", "+ ' · v9.94'", 'Release footer', str(p))
    s = rep(s, '>Open on the Timeline</button>', '>Open in Build</button>',
            'Use the current Build name on Change deliveries', str(p))
    s = rep(s, 'data-tr888-day="${esc(p.date)}">Timeline</button>',
            'data-tr888-day="${esc(p.date)}">Build</button>',
            'Use Build in the transport history link', str(p))
    ready_meta = " st.textContent = 'On this service: build ' + j.version + (built && built !== j.version ? ' (this page was built with ' + built + ')' : '') + ' · ' + j.files + ' files · ' + (j.bytes / 1e6).toFixed(0) + ' MB. Opens here, on this link.';"
    s = rep(s, ready_meta, ready_meta + "\n const body994=st.closest('#cwmachine')?.querySelector(':scope > details.sfold > .sfoldbody');if(body994){body994.append(st);}else{const info994=document.createElement('details');info994.className='presentation994-machine-info';const summary994=document.createElement('summary');summary994.textContent='More info';st.replaceWith(info994);info994.append(summary994,st);}",
            'Fold healthy machine build metadata; keep failures visible', str(p))
    # Reuse the approved compact daily-staff component on Demob. Today retains its
    # own missing-record disclosure; neither the roster nor its editor is changed.
    staff_css = (HERE.parent / 'v9.93_compact_today_loads_LIVE' / 'today993.css').read_text()
    s = rep(s, staff_css,
            staff_css.replace('#pane-today > .staff988', ':is(#pane-today,#pane-demob) > .staff988'),
            'Consistent native daily availability panel', str(p))
    from navigation994 import patch as navigation_patch
    from flow994 import patch as flow_patch
    from demob994 import patch as demob_patch
    from fencing994 import patch as fencing_patch
    from generators994 import patch as generators_patch
    s = navigation_patch(s)
    s = flow_patch(s)
    s = demob_patch(s)
    s = fencing_patch(s)
    s = generators_patch(s)
    s = rep(s, '</head>\n<body', '<style id="presentation994-style">' +
            (HERE / 'presentation994.css').read_text() + '</style>\n</head>\n<body',
            'Staff shown once and Equipment header contrast', str(p))
    p.write_text(s)


if __name__ == '__main__':
    main()
