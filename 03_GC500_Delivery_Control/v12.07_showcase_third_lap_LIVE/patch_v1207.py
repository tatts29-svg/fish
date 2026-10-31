"""Author: Andrew Fisher. Update only the existing Showcase scene and release footer."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
def patch(html):
    if 'root.ShowcaseIncident1207=' in html:raise ValueError('v12.07 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=(HERE/'BASE_SHA256').read_text().strip():raise ValueError('Wrong live base; rebuild and retest on current live')
    matches=[m for m in re.finditer(r'<script\b[^>]*>([\s\S]*?)</script>',html) if 'root.ShowcaseIncident1195=' in m[1]]
    if len(matches)!=1 or hashlib.sha256(matches[0][1].encode()).hexdigest()!=(HERE/'SCENE_SHA256').read_text().strip():raise ValueError('Existing scene changed')
    html=rep(html,matches[0][1],'\n'+(HERE/'incident1207_src.js').read_text()+'\n','third-lap scene','page')
    f=re.search(r"\+' · v(\d+\.\d+)'; /\* v8.19 release922",html)
    if not f:raise ValueError('Release footer missing')
    return rep(html,f[0],"+' · v12.07'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.07 third-lap Showcase scene applied')
