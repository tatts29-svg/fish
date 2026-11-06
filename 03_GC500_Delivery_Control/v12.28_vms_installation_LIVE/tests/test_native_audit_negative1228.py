#!/usr/bin/env python3
"""Author: Andrew Fisher. Negative controls for private native financial snapshots.

Usage: python3 test_native_audit_negative1228.py BEFORE AFTER --out PRIVATE_JSON
Only in-memory snapshot copies are changed; no browser or service is contacted.
"""
import argparse
import copy
import json
import os
from pathlib import Path
from compare_native_financial1228 import compare

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('before');parser.add_argument('after');parser.add_argument('--out',required=True)
    args=parser.parse_args();out=Path(args.out).resolve();repo=Path(__file__).resolve().parents[3]
    if out==repo or repo in out.parents:parser.error('OUT must be private and outside the repository')
    before=json.loads(Path(args.before).read_text());after=json.loads(Path(args.after).read_text())
    control=compare(before,after)
    if not control['pass']:parser.error('Unmodified snapshots must pass before running negative controls')
    def current_cent(m):m['models']['money']['charge']['total']+=0.01
    def duplicate_slot(m):
        slot=next(s for s in m['models']['labourSlots'] if s.get('standaloneVms1228'))
        m['models']['labourSlots'].append(copy.deepcopy(slot))
    def changed_version(m):m['version']+=1
    def changed_hire(m):
        row=next(r for r in m['models']['contractRows'] if isinstance(r.get('rate_1'),(int,float)))
        row['rate_1']+=0.01
    def branch_cost(m):m['models']['branchFinancial']['rows'][0]['cost']+=0.01
    def attempted_write(m):m['browser']['counts']['blocked']+=1
    def failed_cent_tie(m):m['models']['assurance']['checks'][0]['variance']=1
    mutations=[('One-cent current charge',current_cent),('Duplicate installation',duplicate_slot),
               ('Different native version',changed_version),('Changed original hire',changed_hire),
               ('Unexplained branch-cost transfer',branch_cost),('Record-write attempt',attempted_write),
               ('Failed independent cent tie',failed_cent_tie)]
    results=[]
    for label,mutate in mutations:
        snapshot=copy.deepcopy(after);mutate(snapshot)
        result=compare(before,snapshot)
        results.append({'label':label,'rejected':not result['pass'],
                        'failed_checks':[r['label'] for r in result['checks'] if not r['pass']]})
    passed=sum(r['rejected'] for r in results)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({'author':'Andrew Fisher','passed':passed,'count':len(results),'checks':results},indent=2))
    os.chmod(out,0o600)
    print(json.dumps({'negative_controls_passed':passed,'checks':len(results)}))
    return 0 if passed==len(results) else 1
if __name__=='__main__':raise SystemExit(main())
