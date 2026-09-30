#!/usr/bin/env python3
"""Author: Andrew Fisher.

v7.45: monthly labour actuals, forecasts, billing and Finance journal requests.
Starts from live v7.44. Adds an empty, separately synced financial-review event
map; never confirms a shift, sets a rate, posts a journal or changes a charge.
The page's Tools export/import includes this map. The legacy server /api/export
has its own fixed collection list and is not changed by this page-only patch.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
with open(path, encoding='utf-8') as source:
    text = source.read()
if 'fin745ModelMarker' in text:
    sys.exit('v7.45 already applied')
if 'function missingInstall744(' not in text:
    sys.exit('v7.45 needs the live v7.44 base')

with open(os.path.join(HERE, 'finance745_model.js'), encoding='utf-8') as source:
    model = source.read()
with open(os.path.join(HERE, 'finance745_ui.js'), encoding='utf-8') as source:
    ui = source.read()
with open(os.path.join(HERE, 'finance745.css'), encoding='utf-8') as source:
    css = source.read()
if 'fin745ModelMarker' not in model:
    sys.exit('v7.45 model source is missing its release marker')
if 'function fin745Html(' not in ui or 'function fin745Bind(' not in ui:
    sys.exit('v7.45 user interface source is incomplete')


def change(old, new, label):
    global text
    text = rep(text, old, new, label, path, True)


# Start empty. No date-based confirmation or migration of existing cost lines.
change('runRules:{}, answers:{},',
       'runRules:{}, answers:{},\n'
       ' /* v7.45 - append-only monthly financial review events, separate from charges and costs */\n'
       ' finance745:{},', 'empty financial event map')
change(" answers: {kind: 'value', get: () => S.answers, set: v => S.answers = v},",
       " answers: {kind: 'value', get: () => S.answers, set: v => S.answers = v},\n"
       " finance745: {kind: 'map', get: () => S.finance745, set: v => S.finance745 = v},",
       'share one financial event per document')

# The full records envelope already copies S. Also preserve records-less files.
change('answers: (j && j.answers) || {},',
       'answers: (j && j.answers) || {}, finance745: (j && j.finance745) || {},',
       'read financial events from the import envelope')
change('answers: S.answers || {},',
       'answers: S.answers || {}, finance745: S.finance745 || {},',
       'include financial events in the export envelope')
change("'runRules','answers', 'spares', 'subhire'].forEach(f => { out[f] = {};",
       "'runRules','answers', 'spares', 'subhire', 'finance745'].forEach(f => { out[f] = {};",
       'merge financial event documents with their named stamps')
change("pos:0, pins:0, clashes:[]};",
       "pos:0, pins:0, finance745:0, clashes:[]};",
       'count financial events in import results')
change("f === 'rental' ? 'rental' : f === 'branch' ? 'branch' : null);",
       "f === 'rental' ? 'rental' : f === 'branch' ? 'branch' : f === 'finance745' ? 'finance745' : null);",
       'report newly merged financial events')
change("['pins', 'recorded positions']]",
       "['pins', 'recorded positions'], ['finance745', 'financial review events']]",
       'name financial events in the import summary')

# Shape validation is mandatory before importing any event. The model validates
# the kind-specific payload and its evidence; the wrapper also checks identity.
change("'givenRefs', 'runRules', 'answers'];",
       "'givenRefs', 'runRules', 'answers', 'finance745'];",
       'recognise financial events in record files')
change("'minDays', 'runRules', 'answers'].forEach(k => {",
       "'minDays', 'runRules', 'answers', 'finance745'].forEach(k => {",
       'validate the financial event map shape')
change(' /* a labour tick is only ever true; hours are a number of hours in a day */',
       ''' /* v7.45 - malformed financial evidence never reaches the shared record through Import. */
 Object.entries(isObj(rec.finance745) ? rec.finance745 : {}).forEach(([key, event]) => {
 if (!key || key.length > 180 || /^(?:__proto__|constructor|prototype)$/i.test(key)) {
 bad.push('financial event has an invalid key'); return;
 }
 if (!isObj(event) || event.id !== key) bad.push('financial event ' + key + ' does not match its document id');
 try { fin745ValidateRecordEvent(event).forEach(why => bad.push('financial event ' + key + ': ' + why)); }
 catch (e) { bad.push('financial event ' + key + ' could not be validated'); }
 });
 /* a labour tick is only ever true; hours are a number of hours in a day */''',
       'validate every imported financial event')

cost_wrapper = ('function renderCosts(){ return holdAssets(renderCosts_held); } '
                '/* v6.69 - one asset list for the whole draw */')
change(cost_wrapper,
       model.rstrip() + '\n\n' + ui.rstrip() + '\n\n'
       'function renderCosts(){\n'
       ' const result = holdAssets(renderCosts_held);\n'
       ' fin745Bind();\n'
       ' return result;\n'
       '} /* v7.45 - bind monthly financial controls after the costs pane is drawn */',
       'install monthly financial model and interface')
change(' ${marginCard()}\n <h3 class="sec" style="margin-top:6px">Direct costs',
       ' ${fin745Html()}\n ${marginCard()}\n <h3 class="sec" style="margin-top:6px">Direct costs',
       'show monthly financial control before the existing financial totals')

# Bare </style> is not unique: the page contains embedded print styles too.
style_anchor = ('</style></head>\n<body>\n'
                '<!-- The delivery status instrument\'s materials, defined once')
change(style_anchor, css.rstrip() + '\n' + style_anchor,
       'add financial control styles to the main page stylesheet')

change('<button class="btn ghost" data-rsday="${todayIso()}">Today</button></div>',
       '<button class="btn ghost" data-rsday="${todayIso()}">Today</button></div>\n'
       ' <p class="sub"><button class="btn" type="button" id="rsFin745Open">Monthly financial control →</button> '
       'Review actual hours, remaining labour forecast, billing months and Finance journal requests on Costs.</p>',
       'make monthly financial control reachable from the running sheet')
change(" const pane = $('#pane-runsheet');\n pane.querySelectorAll('[data-rsday]')",
       " const pane = $('#pane-runsheet');\n"
       " const financeLink = pane.querySelector('#rsFin745Open');\n"
       " if (financeLink) financeLink.onclick = () => {\n"
       " go('costs');\n"
       " setTimeout(() => { const section = document.getElementById('finance745'); if (section) section.scrollIntoView({block: 'start'}); }, 0);\n"
       " };\n"
       " pane.querySelectorAll('[data-rsday]')",
       'open the monthly financial section from the running sheet')

# Andrew approved the 315 basis. Its source amount is still unavailable: this
# is wording only, not a rate entry, install tick or live-record mutation.
change('The rate card has no 350 kVA install amount. Confirm the agreed install charge excluding GST before it can be added.',
       '315 kVA install basis approved · source amount still required. Hire and demob unchanged.',
       'state the approved 315 kVA install basis without inventing an amount')

with open(path, 'w', encoding='utf-8') as target:
    target.write(text)
print('ok', path)
