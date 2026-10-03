#!/usr/bin/env python3
"""Author: Andrew Fisher. Offline manifest union and frozen-source verification; never uploads."""
import argparse, hashlib, importlib.util, json, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
EXPECTED = '65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86'
PROTECTED = {'explorer/explorer.js', 'explorer/explorer-merge.js', 'explorer/index.html', 'poc3d/index.html'}
sha = lambda b: hashlib.sha256(b).hexdigest()
def tree(root):
    return {str(f.relative_to(root)): f for f in sorted(root.rglob('*')) if f.is_file()}
def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--snapshot', type=Path, required=True, help='folder containing source_manifest.json')
    p.add_argument('--live-manifest', type=Path, default=PROJECT/'v8.13_maps_satellite_LIVE/evidence/machine813_manifest.json')
    p.add_argument('--work', type=Path, help='optional complete proposed source tree')
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    for protected in [args.snapshot.resolve(), (args.work or args.snapshot/'03_GC500_Delivery_Control/v8.09_coates_way_machine_DRAFT/work').resolve()]:
        assert args.out.resolve()!=protected and protected not in args.out.resolve().parents,'Output must be outside reviewed source'
    args.out.mkdir(parents=True, exist_ok=True)
    sm=json.loads((args.snapshot/'source_manifest.json').read_text())
    assert sm['sourceCommit']=='ba9fff7ec48d3d49d037f461c145b1abd6f2c957','Unexpected source commit'
    draft=args.snapshot/'03_GC500_Delivery_Control/v8.09_coates_way_machine_DRAFT'
    actual=tree(draft); work=tree(args.work or draft/'work'); base=tree(draft/'base')
    bindingErrors=[k for k,h in sm['files'].items() if k not in actual or sha(actual[k].read_bytes())!=h]
    bindingErrors += [k for k in actual if k not in sm['files']]
    spec=importlib.util.spec_from_file_location('machine_set',PROJECT/'satellite_explorer/tools/machine_set.py')
    machine=importlib.util.module_from_spec(spec);spec.loader.exec_module(machine)
    manifest=json.loads(args.live_manifest.read_text()); live={f['path']:f for f in manifest['files']}
    digest=sha(machine.canonical({k:manifest[k] for k in ('schema','entry','files')}).encode())
    assert digest==manifest['sha256']==EXPECTED,'Retained manifest is not the assigned v8.13 baseline'
    assert len(live)==len(manifest['files'])==219,'Duplicate or unexpected live paths'
    union={k:dict(v) for k,v in live.items()}
    for name,f in work.items():
        assert machine.path_ok(name),'Invalid machine path: '+name
        b=f.read_bytes(); assert 0<len(b)<=machine.MAX_FILE,'Invalid asset size: '+name
        union[name]={'path':name,'bytes':len(b),'sha256':sha(b),'type':machine.TYPES[f.suffix[1:].lower()]}
    changed=sorted(k for k in live.keys() & union.keys() if live[k]!=union[k]); added=sorted(union.keys()-live.keys())
    baseMismatch=sorted(k for k,f in base.items() if k not in live or sha(f.read_bytes())!=live[k]['sha256'])
    arr=[union[k] for k in sorted(union)]
    candidate={'schema':manifest['schema'],'entry':manifest['entry'],'label':manifest['label'],'version':'v8.09-review-only','files':arr}
    candidate['sha256']=sha(machine.canonical({k:candidate[k] for k in ('schema','entry','files')}).encode())
    write(args.out/'union_manifest.json',candidate);write(args.out/'union_paths.json',sorted(union))
    cp=subprocess.run(['node','--experimental-vm-modules',str(HERE/'check_integration_modules.cjs'),str(args.work or draft/'work'),str(args.out/'union_paths.json')],capture_output=True,text=True)
    modules=json.loads(cp.stdout);write(args.out/'module_checks.json',modules)
    # Literal asset references only: template-built audio names require the dedicated audio inventory check.
    literals=[]
    for name,f in work.items():
        if f.suffix not in ('.js','.html','.css') or name.startswith('vendor/'):continue
        for match in re.finditer(r'''["'`]((?:\./)?assets/[^"'`\n<>]+)["'`]''',f.read_text()):
            target=match[1].split('?')[0].removeprefix('./')
            if target.endswith('/') or '${' in target:continue
            literals.append({'from':name,'path':target,'inUnion':target in union,'local':target in work})
    total=sum(f['bytes'] for f in arr)
    result={'author':'Andrew Fisher','sourceCommit':sm['sourceCommit'],'sourceManifestSha256':sha((args.snapshot/'source_manifest.json').read_bytes()),
      'frozenSourceFiles':len(actual),'frozenSourceBindingErrors':bindingErrors,'baseFileCount':len(base),'baseVsLiveMismatches':baseMismatch,
      'localWorkFiles':len(work),'liveManifestSha256':digest,'liveFiles':len(live),'changedExistingFiles':changed,'addedFiles':added,
      'removedLiveFiles':sorted(live.keys()-union.keys()),'preservedExistingFiles':len(live)-len(changed),
      'protectedMapDescriptorsExact':all(union[k]==live[k] for k in PROTECTED),'retainedFilesNotInLocalTree':sorted(live.keys()-work.keys()),
      'unionFiles':len(arr),'unionBytes':total,'unionManifestSha256':candidate['sha256'],'serviceLimitsPass':len(arr)<=machine.MAX_FILES and total<=machine.MAX_TOTAL,
      'localModuleSyntaxAndLinkPass':cp.returncode==0,'assetLiterals':literals,'missingLiteralAssets':[x for x in literals if not x['inUnion']],
      'scope':'Offline preparation only; no browser, service access, publication or READY assessment'}
    result['pass']=not bindingErrors and not baseMismatch and result['protectedMapDescriptorsExact'] and result['serviceLimitsPass'] and cp.returncode==0 and not result['missingLiteralAssets']
    write(args.out/'integration_checks.json',result)
    print(json.dumps({k:result[k] for k in ['pass','changedExistingFiles','addedFiles','unionFiles','unionBytes','unionManifestSha256','localModuleSyntaxAndLinkPass','missingLiteralAssets']},indent=2))
    raise SystemExit(0 if result['pass'] else 1)
if __name__=='__main__':main()
