# Author: Andrew Fisher. Approved frozen v9.17 pins published after v9.20.
import os,sys,runpy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
runpy.run_path(str(Path(__file__).resolve().parent.parent/'v9.17_pins_master_DRAFT'/'patch_v917_pins.py'),run_name='__main__')
p=Path(sys.argv[1]);s=p.read_text();s=rep(s,' · v9.20',' · v9.21','Advance public pins footer',str(p));p.write_text(s)
