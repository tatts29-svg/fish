"""Author: Andrew Fisher. Exact presentation-only patch boundaries and guarded bases."""
import importlib.util,re,sys
from pathlib import Path
here=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('patch908',here/'patch_v908.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(sys.argv[1]).read_text();candidate=mod.patch(base)
original_footer=re.search(r"\+ ' · v9\.0[4-7]'; /\* v8\.19",base).group()
reverse=candidate.replace('<style id="timeline908-style">'+mod.css()+'</style>\n','').replace('<script id="timeline908-script">\n'+mod.js()+'\n</script>\n','').replace("+ ' · v9.08'; /* v8.19",original_footer)
assert reverse==base,'Unexpected existing source/data change'
for label,text in [('repeat',candidate),('wrong version',base.replace(original_footer,"+ ' · v8.99'; /* v8.19")),('missing native traffic',base.replace('function traffic903Plan(','function missing903Plan('))]:
    try:mod.patch(text)
    except ValueError:pass
    else:raise AssertionError('Accepted '+label)
for version in ['04','05','06','07']:
    out=mod.patch(base.replace(original_footer,"+ ' · v9."+version+"'; /* v8.19"))
    assert "+ ' · v9.08'; /* v8.19" in out
print('PASS exact source/data preservation, repeated/wrong-base refusal and v9.04–v9.07 integration guards')
