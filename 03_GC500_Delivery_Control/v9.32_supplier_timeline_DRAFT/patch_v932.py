#!/usr/bin/env python3
"""Andrew Fisher: dedicated supplier home; no separate supplier panel on Timeline."""
from pathlib import Path
import sys,re
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8-sig');bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'supplier932-style' in s:raise SystemExit('Already applied')
m=re.search(r" · v9\.(28|29|30|31)'; /\* v8.19",s)
if not m:raise SystemExit('Expected release 28–31')
s=rep(s,m.group(0)," · v9.32'; /* v8.19",'footer',p)
s=rep(s,"['timeline','Timeline'],['questions'","['timeline','Timeline'],['subhired','Sub-hired'],['questions'",'supplier route',p)
s=rep(s,"'timeline', 'plant', 'demob'","'timeline', 'plant', 'subhired', 'demob'",'primary navigation',p)
s=rep(s,'const TAB_GLYPH = {','const TAB_GLYPH = {\n subhired: \'<path d="M2 3h12v10H2zM2 7h12M6 3v10" fill="none" stroke="currentColor" stroke-width="1.4"/>\',','supplier glyph',p)
s=rep(s,'<section class="pane" id="pane-about"></section>','<section class="pane" id="pane-subhired"></section>\n<section class="pane" id="pane-about"></section>','supplier pane',p)
s=rep(s,"else if (state.tab === 'timeline') renderTimeline();","else if (state.tab === 'timeline') renderTimeline();\n else if (state.tab === 'subhired') renderSubhired932();",'native render route',p)
old=" ${(() => { try { return typeof ep819Html === 'function' ? ep819Html() : ''; } catch (e) { try { console.warn('v8.19 load plan', e); } catch (x) {} return ''; } })()}"
s=rep(s,old,'','remove separate supplier Timeline append',p)
start=s.index('const beforeAbout925=renderAbout;renderAbout=function()')
end=s.index('\n',start)
s=s[:start]+(here/'supplier932.js').read_text()+s[end:]
old="companyChoice925=e.target.value;e.target.closest('[data-unit925-companies]').outerHTML=companyHtml925();document.querySelector('[data-unit925-company]')?.focus();"
s=rep(s,old,"companyChoice925=e.target.value;renderSubhired932();document.querySelector('[data-unit925-company]')?.focus();",'company selection redraw',p)
s=s.replace('</head>','<style id="supplier932-style">'+(here/'supplier932.css').read_text()+'</style>\n</head>',1)
p.write_bytes((b'\xef\xbb\xbf' if bom else b'')+s.encode())
