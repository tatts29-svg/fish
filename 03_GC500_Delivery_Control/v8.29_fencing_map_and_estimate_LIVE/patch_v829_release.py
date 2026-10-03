#!/usr/bin/env python3
"""Author: Andrew Fisher. Compose verified map and Fencing presentation bytes offline.
Private catalogue/source-map/view inputs remain outside the public source package.
No network, operational mutation, machine registration or page upload occurs here.
"""
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,tempfile
HERE=Path(__file__).resolve().parent
NAMES={'map_patch','map_host','map_catalogue','support_map','estimate_view'}
def sha(b):return hashlib.sha256(b).hexdigest()
def checked(entry,root):
 if not isinstance(entry,dict) or set(entry)!={'path','sha256'}:raise ValueError('Expected path and exact hash for each input')
 if not re.fullmatch('[a-f0-9]{64}',entry['sha256'] or ''):raise ValueError('Invalid input hash')
 p=Path(entry['path']);p=p if p.is_absolute() else root/p
 b=p.read_bytes()
 if sha(b)!=entry['sha256']:raise ValueError('Input changed: '+p.name)
 return b

def main():
 if len(sys.argv) not in (2,3):raise SystemExit('Usage: patch_v829_release.py INPUT.html [OUTPUT.html]')
 value=os.environ.get('GC500_V829_PRIVATE_CONFIG','')
 if not value:raise ValueError('GC500_V829_PRIVATE_CONFIG is required')
 cfgpath=Path(value).resolve();cfg=json.loads(cfgpath.read_text())
 if set(cfg)!={'expected_base_sha256','expected_map_sha256','inputs'} or set(cfg['inputs'])!=NAMES:raise ValueError('Unexpected private input manifest shape')
 for key in ('expected_base_sha256','expected_map_sha256'):
  if not re.fullmatch('[a-f0-9]{64}',cfg[key] or ''):raise ValueError('Invalid expected component hash')
 original=Path(sys.argv[1]).read_bytes()
 if sha(original)!=cfg['expected_base_sha256']:raise ValueError('Expected the reviewed final live base')
 lock=json.loads((HERE/'SOURCE_MANIFEST.json').read_text())
 public={name:checked({'path':name,'sha256':v['sha256']},HERE) for name,v in lock['files'].items()}
 required={'patch_v829_release.py','patch_fencing829.py','coverage829_src.js','estimate_model.js','estimate829.css','README.txt'}
 if set(public)!=required:raise ValueError('Unexpected public source inventory')
 toolchain=Path(os.environ.get('GC500_TOOLCHAIN',str(HERE.parent/'toolchain')))
 helper=checked({'path':str(toolchain/'rep.py'),'sha256':lock['shared_rep_sha256']},HERE)
 private={k:checked(v,cfgpath.parent) for k,v in cfg['inputs'].items()}
 for name in ('map_host','estimate_view'):
  if '</script' in private[name].decode().lower():raise ValueError('Unexpected closing script in '+name)
 if '</style' in public['estimate829.css'].decode().lower():raise ValueError('Unexpected closing style')
 # Staging copies only the bytes checked above; the component cannot reread a moving owner source.
 with tempfile.TemporaryDirectory(prefix='gc500-final829-') as d:
  root=Path(d);component=root/'component';(component/'source').mkdir(parents=True);tools=root/'toolchain';tools.mkdir()
  (tools/'rep.py').write_bytes(helper);(component/'patch_v828.py').write_bytes(private['map_patch']);(component/'source/fencing-map-host.js').write_bytes(private['map_host'])
  cat=root/'catalogue.json';cat.write_bytes(private['map_catalogue']);page=root/'page.html';page.write_bytes(original)
  env={**os.environ,'GC500_TOOLCHAIN':str(tools),'GC500_FENCING_INPUT':str(cat),'GC500_FENCING_INPUT_SHA256':sha(private['map_catalogue'])}
  subprocess.run([sys.executable,str(component/'patch_v828.py'),str(page)],env=env,check=True,capture_output=True,text=True)
  mapped=page.read_bytes()
 if sha(mapped)!=cfg['expected_map_sha256']:raise ValueError('Map component output differs from the reviewed freeze')
 h={'__name__':'verified_replacement_helper'};exec(compile(helper,'<verified rep>','exec'),h)
 core={'__name__':'verified_fencing_presentation'};exec(compile(public['patch_fencing829.py'],'<verified fencing patch>','exec'),core)
 result=core['apply'](mapped.decode(),support_json=private['support_map'].decode(),coverage_js=public['coverage829_src.js'].decode(),model_js=public['estimate_model.js'].decode(),view_js=private['estimate_view'].decode(),css=public['estimate829.css'].decode(),shared_rep=h['rep'])
 pairs=[('<meta name="gc500-release" content="v8.28">','<meta name="gc500-release" content="v8.29">'),("+ ' · v8.28'; /* v8.19 - the footer names the release once */","+ ' · v8.29'; /* v8.19 - the footer names the release once */")]
 for old,new in pairs:
  if result.count(old)!=1:raise ValueError('Expected one map-component release label')
  result=result.replace(old,new,1)
 # The working copy is untouched until all hash, component, anchor and label guards succeed.
 out=Path(sys.argv[-1]);out.write_text(result)
 print(sha(out.read_bytes()))
if __name__=='__main__':main()
