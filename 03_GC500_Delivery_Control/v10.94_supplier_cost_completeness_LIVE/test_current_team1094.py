"""Author: Andrew Fisher. Current display membership and exact source preservation."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import installer_order1094 as helper

if len(sys.argv) != 4:
    raise SystemExit('Usage: test_current_team1094.py BASE.html PRIVATE_INPUT.json PRIVATE_OUTPUT_DIR')
base, private_input, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
original = base.read_text()
patched = helper.apply(original, str(private_input), str(base))
checks = {}


def reject(label, fn):
    try:
        fn()
    except (ValueError, SystemExit):
        checks[label] = True
    else:
        raise AssertionError(label)


def input_of(page):
    return json.loads(re.search(helper.INPUT_PATTERN, page, re.M).group(1))


def data_line(page):
    return next(line for line in page.splitlines() if line.startswith('const DATA = '))


prior, after = input_of(original), input_of(patched)
native = json.loads(data_line(original)[len('const DATA = '):-1])
assert data_line(original) == data_line(patched)
checks['historical DATA, TEAM, labour and original media remain exact'] = True
old_statement = re.search(helper.INPUT_PATTERN, original, re.M).group(0)
new_statement = re.search(helper.INPUT_PATTERN, patched, re.M).group(0)
marker = '/* ' + helper.MARKER + ': supplied names and roles for current cards only. */\n'
restored = patched.replace(marker + new_statement, old_statement, 1).replace(helper.NEW_FALLBACK_LABEL, helper.OLD_FALLBACK_LABEL, 1)
assert restored == original
assert patched.count(helper.NEW_FALLBACK_LABEL) == 1 and helper.OLD_FALLBACK_LABEL not in patched
checks['only approved display input and inclusive fallback label change'] = True
reject('repeat application rejected', lambda: helper.apply(patched, str(private_input)))
reject('wrong projection rejected', lambda: helper.apply(original.replace('var AboutContacts1089 = (function(){', 'var OtherContacts = (function(){'), str(private_input)))
reject('changed predecessor input rejected', lambda: helper.apply(original.replace(old_statement, old_statement.replace('Installer', 'Changed', 1)), str(private_input)))
with tempfile.NamedTemporaryFile(suffix='.json') as tmp:
    tmp.write(private_input.read_bytes() + b'\n')
    tmp.flush()
    reject('unapproved input bytes rejected', lambda: helper.apply(original, tmp.name))

for label, mutate in [
    ('contact field rejected', lambda v: v['people'][-1].update(phone='not approved')),
    ('role promotion rejected', lambda v: v['people'][-1].update(lead=True)),
    ('new group rejected', lambda v: v['people'][-1].update(group='unapproved')),
    ('duplicate historical identity rejected', lambda v: v['people'][-1].update(name=native['team']['people'][0]['name'])),
    ('duplicate addition rejected', lambda v: v['people'][-1].update(name=v['people'][0]['name'])),
    ('existing order change rejected', lambda v: v['people'].reverse()),
]:
    value = json.loads(json.dumps(after))
    mutate(value)
    reject(label, lambda value=value: helper.checked_input(value, prior, native['team']['people']))

start = original.index('var AboutContacts1089 = (function(){')
end = original.index('\nif(typeof module', start)
module = original[start:end]
assert module in patched
payload = {'module': module, 'team': native['team'], 'before': prior, 'after': after}
script = r"""
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const x=JSON.parse(fs.readFileSync(0,'utf8'));
function run(input){const c={ABOUT_CONTACT_INPUT1089:input};vm.createContext(c);vm.runInContext(x.module,c);return JSON.parse(JSON.stringify(c.AboutContacts1089.current(x.team.people)));}
const saved=JSON.stringify(x),a=run(x.before),b=run(x.after),ia=a.filter(p=>p.group==='install'),ib=b.filter(p=>p.group==='install');
assert.equal(ia.length,7);assert.equal(ib.length,9);assert.deepEqual(ib.slice(0,7),ia);
assert(ib.slice(0,7).every(p=>p.event_role==='Installer'));
assert.deepEqual(ib.slice(7).map(p=>p.event_role),['Mechanic/Fitter','Electrician']);
assert.deepEqual(b.slice(0,a.length),a);assert.equal(new Set(b.map(p=>p.name.trim().toLowerCase())).size,b.length);
assert.deepEqual(ib[0],ia[0]);assert.equal(JSON.stringify(x),saved);
for(const p of ib.slice(7))assert.deepEqual(Object.keys(p).sort(),['event_role','group','name']);
console.log(JSON.stringify({pass:true,currentCrew:9,installers:7,supportRoles:ib.slice(7).map(p=>p.event_role),firstInstallerPreserved:true,historicalUnchanged:true}));
"""
result = subprocess.run(['node', '-e', script], input=json.dumps(payload), text=True, capture_output=True, check=True)
projection = json.loads(result.stdout)
checks['nine current cards retain seven installer identities and order'] = projection['pass']
checks['new cards contain supplied roles without contacts, branches or promotion'] = True
candidate = output / 'current-team-only-candidate.html'
candidate.write_text(patched)
candidate.chmod(0o600)
report = {'author': 'Andrew Fisher', 'pass': all(checks.values()), 'checks': checks,
          'projection': projection, 'base_sha256': hashlib.sha256(base.read_bytes()).hexdigest(),
          'candidate_sha256': hashlib.sha256(candidate.read_bytes()).hexdigest(),
          'approved_input_sha256': hashlib.sha256(private_input.read_bytes()).hexdigest()}
(output / 'source-tests.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
