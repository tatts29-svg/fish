"""Author: Andrew Fisher. Search current identities and show shared date/branch charge context."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="profile1006-script"' in html: raise ValueError('Profile v10.06 already applied')
    if 'id="transport1006-script"' not in html: raise ValueError('Profile requires charges and transport first')
    return rep(html,'</body>\n</html>\n','<style id="profile1006-style">'+(HERE/'profile1006.css').read_text()+'</style>\n<script id="profile1006-script">\n'+(HERE/'profile1006.js').read_text()+'\n</script>\n</body>\n</html>\n','Shared asset search and charge context','v10.06')
