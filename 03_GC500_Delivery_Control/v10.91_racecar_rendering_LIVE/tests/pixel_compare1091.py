"""Author: Andrew Fisher. Compare deterministic RGBA captures, without claiming device FPS.
Usage: pixel_compare1091.py BASE_RGBA CANDIDATE_RGBA WIDTH HEIGHT [OUTPUT_JSON]
"""
import json, sys
from pathlib import Path
import numpy as np
base_path,candidate_path=map(Path,sys.argv[1:3]);width,height=map(int,sys.argv[3:5])
a=np.frombuffer(base_path.read_bytes(),np.uint8).reshape(height,width,4)
b=np.frombuffer(candidate_path.read_bytes(),np.uint8).reshape(height,width,4)
d=np.abs(a.astype(int)-b.astype(int));changed=np.max(d,axis=2)>0;y,x=np.where(changed)
result={'author':'Andrew Fisher','width':width,'height':height,'changedPixels':int(changed.sum()),'changedFraction':float(changed.mean()),'maxChannelDifference':int(d.max()),'meanChannelDifference':float(d.mean()),'changedBounds':None if not len(x) else [int(x.min()),int(y.min()),int(x.max()),int(y.max())]}
if len(sys.argv)>5:Path(sys.argv[5]).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
