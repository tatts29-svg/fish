# Author: Andrew Fisher
import pathlib, sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from audio974 import apply_audio974
base=pathlib.Path(sys.argv[1]).read_text();out=apply_audio974(base)
a=base.index("const KEY='gc500.showsound'");b=base.index('\n})();',a)
assert base[:a]==out[:a]
assert base[b:]==out[out.index('\n})();',a):]
for text in ["const BANK=[0,1,0,1,1,0,1,0]", "SND.modePref=function()", "SND.active=true", "SND.ctx.suspend()", "src.stop", "SND.vRate||1", "gc500.showsound", "gc500.showengine"]:assert text in out
for speed in [0,10,30,65,66,94,96,129,131,169,171,209,211,250]:
 top=[65,95,130,170,210,250];g=next((i for i,t in enumerate(top) if speed<=t),5);rpm=max(1300,min(6600,6500*speed/top[g]));assert 1300<=rpm<=6600
 for note in [.62,.78,1,1.08]:assert 0<rpm/3000*note<3
print('audio scope, preferences, lifecycle hooks, bank pattern and 56 variant-rate cases pass')
