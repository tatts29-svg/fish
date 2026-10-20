#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce and combine isolated proposals; no browser, network or upload."""
import argparse, difflib, hashlib, json, shutil, subprocess
from pathlib import Path

HERE=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--snapshot',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path,help='New private directory, outside the snapshot')
    args=p.parse_args(); source=(args.snapshot/'03_GC500_Delivery_Control/v8.09_coates_way_machine_DRAFT/work').resolve();out=args.out.resolve()
    assert out!=source and source not in out.parents and out not in source.parents
    assert not out.exists(),'Output must be a new directory to avoid stale or overwritten evidence'
    out.mkdir(parents=True)
    checks=[]
    def run(name,cmd):
        cp=subprocess.run([str(x) for x in cmd],capture_output=True,text=True)
        (out/(name+'.log')).write_text(cp.stdout+cp.stderr)
        checks.append({'name':name,'exitCode':cp.returncode})
        assert cp.returncode==0,name+' failed; see '+str(out/(name+'.log'))
        return cp.stdout
    run('phone_prepare',['python3',HERE/'phone/apply_proposal.py',source,out/'phone'])
    run('camera_prepare',['python3',HERE/'cameras/patch_camera_spawn.py',source/'car-app.js',out/'camera/car-app.js'])
    run('mechanics_prepare',['python3',HERE/'mechanics/patch_clutch.py','--source',source,'--out',out/'mechanics'])
    run('performance_prepare',['python3',HERE/'performance/make_patch.py','--source',source,'--output',out/'performance'])
    proposals={'phone':{'car-app.js':out/'phone/car-app.proposed.js','index.html':out/'phone/index.proposed.html'},
      'camera':{'car-app.js':out/'camera/car-app.js'},
      'mechanics':{k:out/'mechanics'/k for k in ['car-app.js','mech-driveline.js']},
      'performance':{k:out/'performance'/k for k in ['car-app.js','vendor/addons/postprocessing/GTAOPass.js']}}
    edits={};binding={}
    for owner,files in proposals.items():
        for name,proposal in files.items():
            before=(source/name).read_text().splitlines(True);after=proposal.read_text().splitlines(True)
            for op,i,j,x,y in difflib.SequenceMatcher(a=before,b=after,autojunk=False).get_opcodes():
                if op!='equal':edits.setdefault(name,[]).append((i,j,after[x:y],owner))
    combined=out/'combined';shutil.copytree(source,combined)
    for name,rows in edits.items():
        ordered=sorted(rows,key=lambda x:(x[0],x[1]));prev=-1
        for i,j,_,owner in ordered:
            assert i>prev,'Overlapping proposal edits: '+name+' '+owner
            prev=max(i,j-1)
        text=(source/name).read_text().splitlines(True)
        for i,j,replacement,_ in reversed(ordered):text[i:j]=replacement
        (combined/name).write_text(''.join(text))
        binding[name]={'sourceSha256':sha((source/name).read_bytes()),'combinedSha256':sha((combined/name).read_bytes()),
          'hunks':[{'owner':owner,'originalStartLine':i+1,'originalEndLine':j if j>i else None,'insertBeforeLine':i+1 if j==i else None,'insertedLines':len(lines)} for i,j,lines,owner in ordered]}
    appHash=sha((combined/'car-app.js').read_bytes())
    run('phone_cpu',['node',HERE/'phone/check_phone_cpu.cjs',source/'car-app.js',combined/'car-app.js',out/'phone_combined.json'])
    run('phone_names',['python3',HERE/'phone/check_names.py',source,combined/'index.html'])
    run('camera_cpu',['node',HERE/'cameras/camera_cpu.mjs',combined/'car-app.js','patched',appHash])
    run('mechanics_cpu',['node','--experimental-vm-modules',HERE/'mechanics/cpu_tests.cjs','--source',source,'--proposal',combined,'--output',out/'mechanics_combined.json'])
    run('performance_cpu',['node',HERE/'performance/ownership_test.mjs',combined,'--expect-pass'])
    run('integration',['python3',HERE/'check_integration.py','--snapshot',args.snapshot,'--work',combined,'--out',out/'integration'])
    report={'author':'Andrew Fisher','nodeVersion':subprocess.check_output(['node','--version'],text=True).strip(),
      'sourceCommit':'ba9fff7ec48d3d49d037f461c145b1abd6f2c957','files':binding,'checks':checks,
      'scope':'All four optional proposals composed for review only; not accepted implementation, browser evidence or READY',
      'union':json.loads((out/'integration/integration_checks.json').read_text())['unionManifestSha256']}
    (out/'combined_proposals.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
