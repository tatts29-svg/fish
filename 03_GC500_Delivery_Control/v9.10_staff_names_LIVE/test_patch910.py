"""Author: Andrew Fisher. Prove all existing source/data survives the additive selector patch."""
import importlib.util,re,sys
from pathlib import Path
here=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('staff_patch',here/'patch_v910.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(sys.argv[1]).read_text();candidate=mod.patch(base)
footer=re.search(r"\+ ' · v9\.0[89]'; /\* v8\.19",base).group()
reverse=candidate.replace('<style id="staff910-style">'+(here/'staff910.css').read_text()+'</style>\n','').replace('<script id="staff910-script">\n'+(here/'staff910.js').read_text()+'\n</script>\n','').replace("+ ' · v9.10'; /* v8.19",footer)
assert reverse==base,'Existing source/data changed unexpectedly'
for label,text in [('repeat',candidate),('old base',base.replace(footer,"+ ' · v9.07'; /* v8.19")),('newer base',base.replace(footer,"+ ' · v9.11'; /* v8.19")),('missing native',base.replace('function crew883SavePlan(','function removedSavePlan('))]:
    try:mod.patch(text)
    except ValueError:pass
    else:raise AssertionError('Accepted '+label)
for version in ['08','09']:
    assert "+ ' · v9.10'; /* v8.19" in mod.patch(base.replace(footer,"+ ' · v9."+version+"'; /* v8.19"))
print('PASS exact source/data preservation and repeated/old/newer/incompatible base refusal')
