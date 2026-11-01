/* v12.79 - find in the P&L, its own file (spliced into plf1279_src.js at the find slot by patch_v1279.py): xIndex, xKind, xBox, xRender, xBind
   and their helpers. It uses the module's shared helpers (e, f2, c2, dmy, day, n, cents, hrs, norm, words, hit, tight, cpoKey, poText, DASH,
   BRN, BRS, MOS, MOL, XS, LT, PT, IX, XFOCUS, XPOINTER, XSELECTION, DATA) and changes none of them.
   v12.79 - one box that answers a finance question in plain words, from each item's own figures: an answer line, the three cards, the kind's
   tables, then the records that hold it, grouped by register (each group with its count, and a total only where its rows are disjoint parts of
   one register), with a link to the fold, Export CSV and Copy. Money is whole cents from DATA, printed with f2; DATA is never changed. */
var XKEY = false, XLAST = null, XT = [];   /* XKEY: the keyboard listener is on; XLAST: the last result, for Export and Copy; XT: what to highlight */
var STOPW = ' a an and the of on in to at for with by is it vs v or all any my me show find what where who how much many list give please ';
var MOW = {sep: 'Sep', sept: 'Sep', september: 'Sep', oct: 'Oct', october: 'Oct', nov: 'Nov', november: 'Nov'};
var MONI = {sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11};
function C(v) { return Math.round((Number(v) || 0) * 100); }
function f2c(c) { return f2(c / 100); }
function B_(s) { return '\u0001' + s + '\u0002'; }   /* a figure in the answer line: bold on the screen, plain in Export and Copy */
function BC(c) { return B_(f2c(c)); }
function plain(s) { return String(s == null ? '' : s).replace(/[\u0001\u0002]/g, ''); }
function rich(s) { return String(s == null ? '' : s).split('\u0001').map(function (p, i) { if (!i) return e(p); var k = p.split('\u0002'); return '<b>' + e(k[0]) + '</b>' + e(k.slice(1).join('')); }).join(''); }
function sg(c) { return (c > 0 ? '+' : '') + f2c(c); }
function hh(h) { return f2(Math.round(h * 100) / 100); }   /* hours to 0.01 h, as the fold prints them in the totals */
function dmyP(s) { var p = String(s || '').split('/'); return p.length === 3 ? Number(p[0]) + ' ' + MON[Number(p[1]) - 1] + ' ' + p[2] : String(s || ''); }
function dayP(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] : String(iso || ''); }
function moneyIn(t) {   /* every figure written in a text, in cents (not hours, kVA, metres, tonnes or a percentage) */
  var out = [], m, re = /([−-]?)(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(?!\d)(?!\s*(?:h\b|hours|kva|m\b|t\b|%))/gi; t = String(t == null ? '' : t);
  while ((m = re.exec(t))) out.push({c: Number(m[2].replace(/,/g, '') + m[3]) * (m[1] ? -1 : 1), at: m.index, len: m[0].length, s: m[0]});
  return out;
}
function clauseOf(text, re) {   /* the clause of a text that holds a match: split at bracket depth 0 on '; ' and '. ' */
  var t = String(text || ''), parts = [], d = 0, st = 0;
  for (var i = 0; i < t.length; i++) { var ch = t.charAt(i); if (ch === '(') d++; else if (ch === ')') d = Math.max(0, d - 1);
    else if (!d && (ch === ';' || ch === '.') && t.charAt(i + 1) === ' ') { parts.push(t.slice(st, i).trim()); st = i + 2; } }
  parts.push(t.slice(st).trim());
  for (var k = 0; k < parts.length; k++) if (re.test(parts[k])) return parts[k];
  return '';
}
function lc1(t) { t = String(t); return t.charAt(0).toLowerCase() + t.slice(1); }
function whoName(x) { return x && x.kind === 'Salary' ? 'The PM (salary)' : (x ? x.who : ''); }   /* the salaried row is named by its role */
function termsOf(q) { return norm(q).split(/[^a-z0-9&]+/).filter(function (w) { return w && w.length > 1 && STOPW.indexOf(' ' + w + ' ') < 0; }); }
function tokHit(toks, t) { for (var i = 0; i < toks.length; i++) { var k = toks[i]; if (/^\d+$/.test(t) ? k === t : t.length >= 3 ? k.indexOf(t) === 0 : k === t) return true; } return false; }
function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; var d = [], i, j; for (i = 0; i <= a.length; i++) d[i] = [i]; for (j = 0; j <= b.length; j++) d[0][j] = j;
  for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); return d[a.length][b.length]; }
function reTok(tok) { return new RegExp('(^|[^A-Za-z0-9])' + String(tok).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9])', 'i'); }
/* a name folded for comparing: any dash (with its spaces) one '-', no commas, colons or brackets, single spaces (Rehire - fencing = Rehire – fencing) */
function fold(s) { return norm(s).replace(/\s*[–—-]\s*/g, '-').replace(/[,:;()]/g, ' ').replace(/\s+/g, ' ').trim(); }
/* a Schedule 17 change by branch: the change on its own branch, unless its 'before' names another branch (GN26: 651.56 forecast on KINP);
   then its figure on its own branch and the old forecast off the other */
function xS17Eff(x) {
  var o = {}, m = String(x.before || '').match(/([\d,]+\.\d{2}) forecast on (KINP|STPS|NVAC|MEAD)\b/);
  if (m && m[2] !== x.branch) { o[x.branch] = C(x.figure); o[m[2]] = -moneyIn(m[1])[0].c; } else o[x.branch] = C(x.change);
  return o;
}
/* the cost lines that are estimates: the line says so (state, status or basis), or a hire contract carries its cost as ESTIMATE */
function xEstLines() {
  var J = DATA, out = {}, digits = function (t) { return String(t || '').match(/\b\d{7}\b/g) || []; };
  (J.lines || []).forEach(function (l, i) { var t = [l.state, l.status, l.basis].join(' '); if (/estimat/i.test(t)) out[i] = clauseOf(l.status + '. ' + l.basis, /estimat/i) || l.state; });
  (J.contracts || []).forEach(function (c) { (c.costs || []).forEach(function (y) { if (!/ESTIMATE/.test(String(y.status))) return;
    var yp = digits(y.po), sp = norm(String(y.what).split(':')[0]);
    (J.lines || []).forEach(function (l, i) { var hitP = yp.length ? digits(l.po).some(function (p) { return yp.indexOf(p) >= 0; }) : norm(l.supplier).indexOf(sp) === 0;
      if (hitP && (!/accrued/i.test(y.status) || l.accrue > 0) && !(i in out)) out[i] = 'hire contract ' + c.contract + ': ' + y.status; }); }); });
  return out;
}
/* the views a phrase opens (the whole query, as typed); none equals a category, a branch code, a person's name or a word the tests keep as a word search */
var VIEWS = {
  accruals: 'accrual|accruals|accrued|journal|journals|accrual journals|month end accruals|accruals through 31 oct|accruals at 31 oct|accruals by branch|accrual by branch|what to accrue|reversal|reversals|accrual reversal|accrual reversals',
  estimate: 'estimate|estimates|estimated|est|est.|estimated costs|estimates in the costs',
  novlab: 'nov labour|november labour|november s labour|novembers labour|nov labor|november labor|labour in october|november labour in october',
  manual: 'manual accrual|manual accruals|not accrued|accrual candidates|accrual candidate|manual accrual candidates|provision|provisions|manual',
  margin: 'margin|gross margin|gp|profit|gross profit|difference|difference so far|p&l|profit and loss|margin %',
  revenue: 'revenue|sales|income|turnover|billed|charged|charged to the v8s',
  invoices: 'invoices|v8 supercars invoices|v8s invoices|v8 invoices|customer invoices|tax invoices|v8|v8s|v8 supercars|billing',
  status: 'actual vs estimate|actuals|actual|estimate vs actual|actual v estimate|actual vs estimates|invoiced vs accrued|status|state|states|by state',
  forecast: 'forecast|november forecast|nov forecast|cost to complete|ctc|to complete|still to come',
  extra: 'extra revenue|possible extra revenue|unbilled|not billed|upside|missed revenue|revenue leakage|leakage|on no invoice|chase|unbilled revenue|accrued revenue|revenue accrual|wip|work in progress',
  credit: 'credit|credits|credit note|possible credit|query|queries|overcharge|dispute',
  open: 'open items|open|outstanding|to do|todo|issues|calls to make|paperwork',
  recovery: 'labour recovery|labour charged|labour revenue|recovery|labour|labour margin|install labour',
  running: 'running sheet|running sheet variance|variance|bridge|labour hire variance',
  overtime: 'overtime|ot|penalty rates|x1.5|×1.5|x2|×2|time and a half|double time|paid hours',
  wages: 'wages|coates wages|payroll hours|staff hours|hours',
  journaled: 'branch move|branch moves|moves|moved|journaled|journalled|journaled to|journalled to|journal to|labour journals|where hours go',
  s17: 'schedule 17|s17|sched 17',
  pickups: 'pick-ups|pickups|pick ups|pick-up|pickup|transport estimate|demob transport|still on site|on site|ran by 31 oct|trucks that ran',
  carrierinv: 'carrier invoice|carrier invoices|freight invoice|freight invoices|carrier po|carrier pos|cartage invoice',
  grni: 'received not invoiced|grni|not invoiced|goods received|received|uninvoiced',
  nopo: 'no po|no pos|no purchase order|without po|without a po|po compliance|non po',
  ownuse: 'own use|not charged|not charged to the v8s|coates use',
  sold: 'toilet paper|scrim|hand towels|hand towel|stock|consumables sold|no cost',
  quotes: 'quote|quotes|quoted',
  receipts: 'receipts|receipt|receipted',
  glall: 'gl|gl codes|gl code|accounts|by account|gl accounts',
  gst: 'gst|tax|ex gst|inc gst|incl gst|including gst|bas',
  budget: 'budget|tender|tendered|job budget|estimate at completion|eac|budget vs actual',
  paid: 'unpaid|unpaid invoices|paid|payments|overdue|aged debtors|ageing|aging|creditors|payment status',
  meta: 'pack|source|sources|data source|basis|record|about'
};
var CAT_AL = {fencing: 'fencing', fence: 'fencing', toilets: 'toilets', 'toilet hire': 'toilets', portaloos: 'toilets', forklift: 'forklifts', forklifts: 'forklifts', 'forklift rehire': 'forklifts', container: 'container',
  accom: 'accommodation', hotel: 'accommodation', hotels: 'accommodation', meals: 'meals', expenses: 'meals', 'r&m': 'meals', salary: 'salary', salaries: 'salary', consumables: 'consumables', consumable: 'consumables'};
var GRP_AL = ['rehire', 're-hire', 'sub-hire', 'subhire', 'sub hire', 'rehire all', 'all rehire'];
var BR_AL = {traffic: 'STPS', hvac: 'NVAC', 'north power': 'NVAC', mechanical: 'MEAD', 'brisbane mechanical': 'MEAD'};
var SUP_AL = {'qld forklifts': 'queensland forklifts', qld: 'queensland forklifts', trucks: 'carriers', freight: 'carriers', cartage: 'carriers', atf: 'advanced temporary fencing', 'advanced fencing': 'advanced temporary fencing',
  premier: 'premiair services', 'premier hire': 'premiair services', 'premiair hire': 'premiair services'};
var SUPKEY = {advanced: 'advanced', 'event portables': 'event portables', premiair: 'premiair', 'royal wolf': 'royal wolf|united rentals', carriers: 'carrier', 'job connect': 'job connect', accommodation: 'accommodation', meals: 'meals', salary: 'salary allowance', bunnings: 'bunnings', cci: 'cci', bsf: 'bsf', 'event elec': 'event elec', queensland: 'queensland forklifts'};
var GLAB = {sup: 'Supplier', po: 'Purchase orders', nopo: 'Costs with no PO', jn: 'Accrual journals', mv: 'Branch moves', inv: 'Invoices to V8 Supercars', fc: 'November forecast', rem: 'Not in the revenue', con: 'Hire contracts',
  cc: 'Costs tied to a contract', nt: 'Costs not tied to a contract', lc: 'Labour lines charged', lh: 'Labour hire weeks', lj: 'Labour journals (hours)', leg: 'Transport estimate legs', mvd: 'Moved pick-ups', notin: 'Not in the estimate',
  s17: 'Schedule 17 changes', open: 'Open items', bl: 'Branch lines', note: 'Notes', line: 'Cost lines'};
var GORD = ['po', 'nopo', 'jn', 'mv', 'inv', 'fc', 'rem', 'con', 'cc', 'nt', 'lc', 'lh', 'lj', 'leg', 'mvd', 'notin', 's17', 'open', 'bl', 'note'];
var FOLDS = {'pl1267-fp-lines': 'Every cost line', 'pl1267-fp-branch': 'Costs by branch, line by line', 'pl1267-fp-revenue': 'Revenue by invoice', 'pl1267-fp-contracts': 'By hire contract', 'pl1267-fp-pos': 'Every purchase order in the costs',
  'pl1267-fp-labour': 'Every labour line on the invoices', 'pl1267-fp-lj': 'Labour journals', 'pl1267-fp-s17': 'Transport checked against Schedule 17', 'pl1267-fp-gl': 'Costs by GL account', 'pl1267-fp-test': 'Transport estimate',
  'pl1267-fp-journals': 'Journals prepared for Finance', 'pl1267-fp-open': 'Open items'};
var GFOLD = {po: 'pl1267-fp-pos', nopo: 'pl1267-fp-pos', jn: 'pl1267-fp-journals', mv: 'pl1267-fp-journals', inv: 'pl1267-fp-revenue', fc: 'pl1267-fp-revenue', rem: 'pl1267-fp-revenue', con: 'pl1267-fp-contracts', cc: 'pl1267-fp-contracts',
  nt: 'pl1267-fp-contracts', lc: 'pl1267-fp-labour', lh: 'pl1267-fp-lj', lj: 'pl1267-fp-lj', leg: 'pl1267-fp-test', mvd: 'pl1267-fp-test', notin: 'pl1267-fp-test', s17: 'pl1267-fp-s17', note: 'pl1267-fp-s17', open: 'pl1267-fp-open',
  bl: 'pl1267-fp-branch', line: 'pl1267-fp-lines'};
var ASSET = /\b(WC\d{2,3}|GN\d{2}(?:-A)?|LT\d{2}|EQ\d{4}|FL\d{2}|WB\d{2}|VMS\d{2}|AT\d{3}|OP\d{2}|TM\d{2}|T\d{4}|P\d{2})\b/gi;
function xIndex() {
  if (IX) return IX;
  var J = DATA; IX = {po: {}, con: {}, inv: {}, rem: {}, remCon: {}, cpo: {}, people: [], rec: [], own: [], ref: {}, view: {}, catAl: {}, brName: {}, gl: {}, supAl: {}, vocab: []};
  LT = (J.lines || []).map(function (l) { return norm([l.supplier, l.branch, l.account, l.what, l.po, l.invoice, l.contract, l.status, l.basis, l.category].join(' ')); });
  PT = (J.labourJournal || []).map(function (x) { return norm([x.who, x.type, x.home, x.branch, x.contract, x.journal].join(' ')); });
  (J.purchaseOrders || []).forEach(function (x) { IX.po[tight(x.po)] = x; });
  (J.contracts || []).forEach(function (x) { IX.con[tight(x.contract)] = x; });
  (J.invoices || []).forEach(function (x) { IX.inv[tight(x.inv)] = x; var k = cpoKey(x.customerPO); (IX.cpo[k] = IX.cpo[k] || []).push(x); });
  (J.removedInvoices || []).forEach(function (x) { IX.rem[tight(x.inv)] = x; IX.remCon[tight(x.contract)] = x; });
  (J.labourJournal || []).forEach(function (x) { if (IX.people.indexOf(x.who) < 0) IX.people.push(x.who); });
  /* the words: views, category aliases, branch names, supplier aliases */
  Object.keys(VIEWS).forEach(function (v) { VIEWS[v].split('|').forEach(function (p) { IX.view[p] = v; }); });
  var cats = (J.categories || []).map(function (c) { return c.name; });
  Object.keys(CAT_AL).forEach(function (a) { var w = CAT_AL[a], hc = cats.filter(function (c) { return norm(c).indexOf(w) >= 0; }); if (hc.length === 1) IX.catAl[a] = hc[0]; });
  BRS.forEach(function (b) { var nm = norm(String(BRN[b]).split(' · ')[1] || ''); if (nm) IX.brName[nm] = b; });
  IX.brName['north power and hvac'] = 'NVAC'; IX.brName['brisbane mechanical specialist'] = 'MEAD';
  Object.keys(BR_AL).forEach(function (a) { IX.brName[a] = BR_AL[a]; });
  Object.keys(SUP_AL).forEach(function (a) { var sp = (J.suppliers || []).filter(function (x) { return norm(x.name).indexOf(SUP_AL[a]) === 0; })[0]; if (sp) IX.supAl[a] = sp.name; });
  /* the record index: one row per item in each register, with its own figure */
  var R = function (g, i, o) { o.g = g; o.i = i; o.n = norm([o.t, o.d, o.b, o.x || ''].join(' ')); o.k = o.n.split(/[^a-z0-9&]+/).filter(Boolean); o.raw = String(o.t) + ' ' + String(o.d || ''); IX.rec.push(o); return o; };
  var O = function (r, f, v) { if (typeof v === 'number' && isFinite(v) && Math.abs(v) >= 0.005) IX.own.push({r: r, f: f, c: C(v)}); };
  (J.lines || []).forEach(function (l, i) { var r = R('line', i, {t: l.supplier + ' · ' + l.what, d: [poText(l.po), l.invoice, 'hire contract ' + l.contract, l.state || l.status].join(' · '), b: l.branch, c: C(l.sep) + C(l.oct) + C(l.nov), tag: 'whole line', fold: 'pl1267-fp-lines', x: l.account + ' ' + l.basis + ' ' + l.status});
    O(r, 'Sep', l.sep); O(r, 'Oct', l.oct); O(r, 'Nov', l.nov); O(r, 'line total', (C(l.sep) + C(l.oct) + C(l.nov)) / 100); O(r, 'accrual', l.accrue); });
  (J.purchaseOrders || []).forEach(function (x, i) { O(R('po', i, {t: x.po + ' · ' + x.supplier, d: x.what + ' · ' + x.status + ' · ' + x.contract, b: x.branch, c: C(x.amount), at: 'data-po', av: x.po}), 'PO amount', x.amount); });
  (J.noPO || []).forEach(function (x, i) { O(R('nopo', i, {t: x.supplier + ': ' + x.what, d: x.why + ' · ' + x.contract, b: x.branch, c: C(x.amount)}), 'amount', x.amount); });
  (J.journals || []).forEach(function (x, i) { var r = R('jn', i, {t: x.journal, d: 'PO ' + x.po + ' · ' + x.contract + ' · ' + x.account, b: x.branch, c: C(x.amount)}); O(r, 'journal amount', x.amount);
    moneyIn(x.account).forEach(function (m) { IX.own.push({r: r, f: 'account part', c: m.c}); }); moneyIn(x.branch).forEach(function (m) { IX.own.push({r: r, f: 'branch part', c: m.c}); });
    (String(x.journal).match(/Q\d{4} [^·]*?\d[\d,]*\.\d{2}/g) || []).forEach(function (p) { var m = moneyIn(p); if (m.length) IX.own.push({r: r, f: 'quote part', c: m[m.length - 1].c}); }); });
  (J.moves || []).forEach(function (x, i) { O(R('mv', i, {t: x.journal, d: 'PO ' + x.po + ' · ' + x.contract + ' · ' + x.account, b: x.branch, c: C(x.amount), tag: 'a move between branches'}), 'move', x.amount); });
  (J.invoices || []).forEach(function (x, i) { O(R('inv', i, {t: x.inv + ' · ' + dmyP(x.date), d: 'hire contract ' + x.contract + ' · the V8s’ PO ' + x.customerPO + ' · our POs: ' + x.pos, b: x.branch, c: C(x.ex), at: 'data-inv', av: x.inv}), 'invoice ex GST', x.ex); });
  (J.novForecastLines || []).forEach(function (x, i) { O(R('fc', i, {t: 'November forecast · ' + x.contract + ' ' + x.line, d: x.what, b: x.branch, c: C(x.amount), tag: 'in the revenue as forecast'}), 'forecast', x.amount); });
  (J.removedInvoices || []).forEach(function (x, i) { O(R('rem', i, {t: 'Invoice ' + x.inv + ' on ' + x.contract, d: x.why, b: '', c: C(x.ex), tag: 'not in the revenue'}), 'invoice ex GST', x.ex); });
  (J.contracts || []).forEach(function (x, i) { var r = R('con', i, {t: x.contract + ' · ' + (x.onIt || ''), d: 'invoice ' + x.invoice + ' · the V8s’ PO ' + x.customerPO + (x.note ? ' · ' + x.note : '') + ' · costs tied ' + f2(x.costTotal), b: x.branch, c: C(x.revenue), tag: 'charged', at: 'data-c', av: x.contract});
    O(r, 'charged', x.revenue); O(r, 'costs tied', x.costTotal);
    (x.costs || []).forEach(function (y, k) { O(R('cc', i * 100 + k, {t: x.contract + ' · ' + y.what, d: y.status + ' · PO ' + y.po, b: '', c: y.amount == null ? null : C(y.amount), why: 'no figure of its own here: ' + y.status, at: 'data-c', av: x.contract, con: x.contract}), 'tied cost', y.amount); }); });
  (J.notTied || []).forEach(function (x, i) { O(R('nt', i, {t: x.what, d: x.status + ' · PO ' + x.po, b: '', c: C(x.amount), at: 'data-c', av: 'none'}), 'not tied', x.amount); });
  var LC = J.labourCharged || {};
  (LC.lines || []).forEach(function (x, i) { var r = R('lc', i, {t: x.b + ' · ' + x.inv + ' · ' + x.contract + ' L' + x.line + ' · ' + x.what, d: (x.note ? x.note + ' · ' : '') + (x.hours == null ? '' : x.hours + ' h') + (x.rate != null ? ' at ' + f2(x.rate) : ''), b: x.b, c: C(x.amount), x: 'l' + x.line});
    O(r, 'labour line', x.amount); O(r, 'rate', x.rate); });
  (J.labourHireBridge || []).forEach(function (x, i) { var r = R('lh', i, {t: x.week + ' · ' + (x.po === 'none yet' ? 'no PO yet' : 'PO ' + x.po), d: x.invoice + ' · running sheet ' + f2(x.runningSheet) + ' · difference ' + f2(x.difference), b: 'KINP', c: C(x.cost), tag: 'the week’s cost'});
    O(r, 'running sheet', x.runningSheet); O(r, 'week’s cost', x.cost); O(r, 'difference', x.difference); });
  (J.labourJournal || []).forEach(function (x, i) { O(R('lj', i, {t: whoName(x), d: x.type + ' · home ' + x.home + ' · ' + (x.journal === 'stays' ? 'stays on ' + x.branch : 'journal ' + x.journal) + (x.contract ? ' · ' + x.contract : ''), b: x.branch, c: null, h: Math.round(((x.paidSep || 0) + (x.paidOct || 0)) * 100) / 100, why: 'hours, not dollars', at: 'data-who', av: x.who, x: x.who}), 'labour hire $ (running sheet)', x.labourHire); });
  var TE = J.transportEstimate || {};
  (TE.legs || []).forEach(function (x, i) { var r = R('leg', i, {t: x.ref + ' · ' + x.what, d: x.kind + ' ' + dayP(x.date) + ' · ' + x.loads + ' × ' + f2(x.rate) + ' · ' + x.rate_source + ' · ' + (x.group === 'oct_ran' ? 'ran by 31 Oct' : 'still on site'), b: x.branch, c: C(x.amount), tag: 'estimate', grp: x.group});
    O(r, 'leg', x.amount); O(r, 'rate', x.rate); });
  (TE.moved || []).forEach(function (x, i) { O(R('mvd', i, {t: x.ref + ' · pick-up moved to November', d: 'from ' + dayP(x.from) + ' to ' + dayP(x.to) + ' (in the planned loads)', b: '', c: C(x.amount)}), 'moved', x.amount); });
  (TE.notIn || []).forEach(function (x, i) { O(R('notin', i, {t: x.what, d: 'not in the transport estimate: who pays is not on the record', b: '', c: C(x.amount), tag: 'not in the costs'}), 'not in', x.amount); });
  var S7 = J.schedule17 || {};
  (S7.changes || []).forEach(function (x, i) { var r = R('s17', i, {t: x.ref + ' · ' + x.date + ' · ' + x.what, d: x.contractDocket + ' · ' + x.row + ' · before: ' + x.before + ' · change ' + sg(C(x.change)), b: x.branch, c: C(x.figure), tag: 'Schedule 17 figure'});
    O(r, 'Schedule 17 figure', x.figure); O(r, 'change', x.change); });
  (S7.notes || []).forEach(function (x, i) { R('note', i, {t: 'Schedule 17 note ' + (i + 1), d: x, b: '', c: null, why: 'as written'}); });
  (J.open || []).forEach(function (x, i) { R('open', i, {t: 'Open item ' + (i + 1) + ': ' + String(x).split(':')[0].slice(0, 90), d: x, b: '', c: null, why: 'as written; not added'}); });
  BRS.forEach(function (b) { ((J.branchLines || {})[b] || []).forEach(function (x, i) { O(R('bl', b + i, {t: x[0], d: '', b: b, c: C(x[1]), at: 'data-b', av: b}), 'branch line', x[1]); }); });
  /* other own figures: the pack's totals */
  var TOP = function (lbl, v) { O({g: 'tot', t: lbl, d: '', b: '', c: C(v), i: 0, raw: lbl}, 'total', v); };
  var RV = J.revenue || {}, CO = J.costs || {};
  TOP('Revenue, the invoices', RV.invoices); TOP('Revenue, the November forecast', RV.novForecast); TOP('Revenue', RV.total); TOP('Costs, September', CO.sep); TOP('Costs, October', CO.oct); TOP('Costs, November', CO.nov); TOP('Costs, job end', CO.total);
  TOP('Difference so far', J.difference); TOP('Accruals through 31 Oct', J.accrue);
  (J.suppliers || []).forEach(function (x) { ['sep', 'oct', 'nov', 'total', 'accrue'].forEach(function (f) { TOP('Supplier ' + x.name + ', ' + (f === 'accrue' ? 'accruals' : f === 'total' ? 'job end' : f), x[f]); }); });
  (J.categories || []).forEach(function (x) { ['sep', 'oct', 'nov', 'total'].forEach(function (f) { TOP('Category ' + x.name + ', ' + (f === 'total' ? 'job end' : f), x[f]); }); });
  (J.branches || []).forEach(function (x) { ['invoiced', 'revenue', 'costs', 'difference'].forEach(function (f) { TOP('Branch ' + x.b + ', ' + f, x[f]); }); });
  /* the reference index: receipts and supplier invoices (to their PO), quotes, dockets, asset refs, other numbers in the open items, home branches */
  var REF = function (k, o) { k = String(k).toLowerCase().replace(/\s+/g, ''); var L = IX.ref[k] = IX.ref[k] || []; if (!L.some(function (y) { return y.type === o.type && y.i === o.i && y.po === o.po && y.q === o.q; })) L.push(o); };
  (J.purchaseOrders || []).forEach(function (x) { var t = x.status + ' ' + x.what, m, re;
    re = /\b49\d{5}\b/g; while ((m = re.exec(t))) REF(m[0], {type: 'po', po: x.po, how: 'the receipt'});
    re = /\bGC\d{6}\b/g; while ((m = re.exec(t))) REF(m[0], {type: 'po', po: x.po, how: 'the supplier invoice'});
    re = /\bINV (\d{5})\b/g; while ((m = re.exec(t))) REF(m[1], {type: 'po', po: x.po, how: 'the supplier invoice'}); });
  (J.lines || []).forEach(function (l, i) { var p = String(l.po).match(/\b\d{7}\b/g) || [], m = String(l.invoice).match(/\binvoice (\d{5})\b/); if (m && p.length === 1 && IX.po[p[0]]) REF(m[1], {type: 'po', po: p[0], how: 'the supplier invoice'}); });
  (J.journals || []).forEach(function (x, i) { var m, re = /(Q\d{4}) ([^·]*?) (\d[\d,]*\.\d{2})/g; while ((m = re.exec(x.journal))) REF(m[1], {type: 'quote', q: m[1], name: m[2].replace(/\s*\(.*$/, ''), c: moneyIn(m[3])[0].c, i: i}); });
  var dock = function (t, o) { var m, re = /\b26\d{6}\b/g; while ((m = re.exec(String(t)))) REF(m[0], o); };
  (S7.changes || []).forEach(function (x, i) { dock(x.contractDocket, {type: 's17', i: i}); });
  (TE.legs || []).forEach(function (x, i) { dock(x.rate_source + ' ' + x.what, {type: 'leg', i: i}); });
  (J.open || []).forEach(function (x, i) { dock(x, {type: 'open', i: i}); var m, re = /\b\d{5}\b/g; while ((m = re.exec(x))) REF(m[0], {type: 'open', i: i}); });
  (S7.notes || []).forEach(function (x, i) { dock(x, {type: 'note', i: i}); });
  (J.lines || []).forEach(function (l, i) { dock(l.contract, {type: 'line', i: i}); });
  var assets = function (t, o) { var m; ASSET.lastIndex = 0; while ((m = ASSET.exec(String(t)))) { REF(m[1], o); if (/-A$/i.test(m[1])) REF(m[1].replace(/-A$/i, ''), o); } };
  (S7.changes || []).forEach(function (x, i) { assets(x.ref + ' ' + x.what, {type: 's17', i: i, asset: 1}); });
  (TE.legs || []).forEach(function (x, i) { assets(String(x.ref).split('/').join(' '), {type: 'leg', i: i, asset: 1}); });
  (TE.moved || []).forEach(function (x, i) { assets(x.ref, {type: 'mvd', i: i, asset: 1}); });
  (TE.notIn || []).forEach(function (x, i) { assets(x.what, {type: 'notin', i: i, asset: 1}); });
  (J.open || []).forEach(function (x, i) { assets(x, {type: 'open', i: i, asset: 1}); });
  (S7.notes || []).forEach(function (x, i) { assets(x, {type: 'note', i: i, asset: 1}); });
  (J.contracts || []).forEach(function (x, i) { assets(x.onIt + ' ' + (x.costs || []).map(function (y) { return y.what; }).join(' '), {type: 'con', i: i, asset: 1}); });
  (J.lines || []).forEach(function (l, i) { assets(l.what, {type: 'line', i: i, asset: 1}); });
  (J.noPO || []).forEach(function (x, i) { assets(x.what, {type: 'nopo', i: i, asset: 1}); });
  (J.journals || []).forEach(function (x, i) { assets(x.journal + ' ' + x.branch, {type: 'jn', i: i, asset: 1}); });
  BRS.forEach(function (b) { ((J.branchLines || {})[b] || []).forEach(function (x, i) { assets(x[0], {type: 'bl', b: b, i: i, asset: 1}); }); });
  (J.labourJournal || []).forEach(function (x) { if (x.home && BRS.indexOf(x.home) < 0 && !(IX.ref[x.home.toLowerCase()] || []).length) REF(x.home, {type: 'home', code: x.home}); });
  if (J.record) REF(String(J.record), {type: 'meta'});
  /* GL codes on the cost lines and the journals */
  (J.lines || []).concat(J.journals || []).forEach(function (x) { (String(x.account || '').match(/\b[23]\d{3}\b/g) || []).forEach(function (g) { IX.gl[g] = 1; }); });
  /* the words a did-you-mean may offer: views, categories, suppliers, people, branch names */
  IX.vocab = Object.keys(IX.view).concat(cats.map(norm), (J.suppliers || []).map(function (x) { return norm(x.name); }), IX.people.map(norm), Object.keys(IX.brName));
  return IX;
}
/* what the search is: the first rule that matches wins */
function xKind(q, depth) {
  var I = xIndex(), J = DATA, qn = norm(q).replace(/^[#\s]+/, '').replace(/[?!.,;:]+$/, '').trim(), qc = qn.replace(/\s+/g, '');
  if (!qn) return {kind: ''};
  if (!depth) {   /* a type word in front of a key (PO#4647983, inv 25122628, contract 9990776, GL 2126): the key, read without it */
    var pm = qn.match(/^(?:po|p\.o\.|purchase order|inv|invoice|tax invoice|hire contract|contract|hc|gl|gl code|account|acct|a\/c)\s*(?:no\.?|number)?\s*#?\s*(?=\S*\d)/);
    if (pm && pm[0].length < qn.length) { var KP = xKind(qn.slice(pm[0].length), 1); if (/^(po|contract|invoice|removed|cpo|gl|ref)$/.test(KP.kind)) { KP.pfx = qn.slice(pm[0].length); return KP; } }
    /* a figure with a sign or in brackets (−460.78, (460.78), 460.78-): the amount, matched without its sign */
    var sm = qc.match(/^(?:[−-]\$?|\$[−-])(\d[\d,]*(?:\.\d{1,2})?)$/) || qc.match(/^\(\$?(\d[\d,]*(?:\.\d{1,2})?)\)$/) || qc.match(/^\$?(\d[\d,]*(?:\.\d{1,2})?)[−-]$/);
    if (sm) { var KS = xKind(sm[1], 1); if (KS.kind === 'amount') { KS.signed = qn; return KS; } }
  }
  if (BRS.indexOf(qn.toUpperCase()) >= 0) return {kind: 'branch', br: qn.toUpperCase()};
  if (I.brName[qn]) return {kind: 'branch', br: I.brName[qn], named: true};
  var fq = fold(qn), cats = J.categories || [], cat = cats.filter(function (c) { return fold(c.name) === fq; })[0]; if (cat) return {kind: 'category', cat: cat.name};
  /* the pack's own state names (Accrued at 31 Oct, November labour, carried in October (not accrued)): the cost lines in that state */
  var stt = I.view[qn] ? null : (J.states || []).filter(function (x) { return fold(x) === fq; })[0]; if (stt) return {kind: 'view', v: 'status', state: stt};
  /* the job cost in plain words: the choices' own figures and table */
  if (/^(cost|costs|job cost|job costs|total cost|total costs|cost to date|costs to date|spend|spending|total|totals|all costs|the job cost)$/.test(qn)) return {kind: '', typed: 1, costs: 1};
  if (!I.view[qn]) {
    if (I.catAl[qn]) return {kind: 'category', cat: I.catAl[qn], alias: true};
    if ((GRP_AL.indexOf(qn) >= 0 || GRP_AL.indexOf(fq) >= 0 || (J.categoryGroups || []).some(function (g) { return fold(g.name) === fq; })) && (J.categoryGroups || []).length) return {kind: 'cgroup', grp: J.categoryGroups[0]};
    if (/^[a-z]{4,}$/.test(qn)) { var pc = cats.filter(function (c) { return norm(c.name).split(/[^a-z0-9&]+/)[0].indexOf(qn) === 0; }); if (pc.length === 1) return {kind: 'category', cat: pc[0].name, alias: true}; }
  }
  if (MOW[qn]) return {kind: 'month', mo: MOW[qn]};
  if (I.po[qc]) return {kind: 'po', x: I.po[qc]};
  if (I.con[qc]) return {kind: 'contract', x: I.con[qc]};
  if (I.inv[qc]) return {kind: 'invoice', x: I.inv[qc]};
  if (I.rem[qc]) return {kind: 'removed', x: I.rem[qc]};
  if (I.remCon[qc]) return {kind: 'removed', x: I.remCon[qc]};
  if (/^p/.test(qc) && I.cpo[qc.replace(/^p0*/, '')]) return {kind: 'cpo', key: qc, list: I.cpo[qc.replace(/^p0*/, '')]};
  var rf = I.ref[qc];
  if (rf && rf.length) {
    var pr = rf.filter(function (r) { return r.type === 'po'; })[0];
    if (pr) return {kind: 'po', x: I.po[pr.po], via: {tok: String(q).trim(), how: pr.how}};
    if (rf[0].type === 'meta') return {kind: 'view', v: 'meta'};
    return {kind: 'ref', tok: String(q).trim(), list: rf};
  }
  var gm = qn.match(/^201\.(kinp|stps|nvac|mead)\.(\d{4})(\.0)?$/);
  if (gm && I.gl[gm[2]]) return {kind: 'gl', code: gm[2], br: gm[1].toUpperCase()};
  if (/^\d{4}$/.test(qc) && I.gl[qc]) return {kind: 'gl', code: qc};
  var wk = qn.match(/^(?:w\/?e|week ending)\s*(\d{1,2})\s*(sep|sept|september|oct|october|nov|november)$/) || qn.match(/^(?:w\/?e|week ending)\s*(\d{1,2})\/(9|10|11)$/);
  if (wk) return {kind: 'week', d: Number(wk[1]), m: /^\d+$/.test(wk[2]) ? MON[Number(wk[2]) - 1] : MOW[wk[2]]};
  if (/^(31 oct(ober)?( 2026)?|oct(ober)? 31|31\/10(\/2026)?|2026-10-31|month end|month-end|eom|as at|as at 31 oct)$/.test(qn)) return {kind: 'view', v: 'monthend'};
  var dt = xDate(qn); if (dt) return {kind: 'date', d: dt.d, m: dt.m};
  var rg = xRange(qn); if (rg) return {kind: 'range', lo: rg.lo, hi: rg.hi, li: rg.li, hiI: rg.hiI, w: rg.w};
  if (/^\$?\d[\d,]*(\.\d{1,2})?$/.test(qn.replace(/\s+/g, ''))) { var v = C(qn.replace(/[$,\s]/g, '')), am = xAmount(v); if (am.own.length || am.txt.length) return {kind: 'amount', v: v, am: am}; }
  if (I.view[qn]) return {kind: 'view', v: I.view[qn], ph: qn};
  /* a supplier or category with 'accrual': its accrual (its accrued lines and journals), or that it has none */
  var am2 = qn.match(/^(.+?)\s+(?:accrual|accruals|accrued)$/) || qn.match(/^(?:accrual|accruals|accrued)\s+(?:for|of|on)?\s*(.+)$/);
  if (am2) { var who2 = am2[1].trim(), f2q = fold(who2), sps = (J.suppliers || []).filter(function (x) { var nm = norm(x.name); return who2.length >= 3 && (nm === who2 || nm.indexOf(who2 + ' ') === 0 || nm.indexOf(who2) === 0); });
    if (!sps.length && I.supAl[who2]) sps = (J.suppliers || []).filter(function (x) { return x.name === I.supAl[who2]; });
    var ca2 = cats.filter(function (c) { return fold(c.name) === f2q; })[0] || (I.catAl[who2] ? {name: I.catAl[who2]} : null);
    if (ca2) return {kind: 'acc', cat: ca2.name, who: who2};
    if (sps.length === 1) return {kind: 'acc', sup: sps[0].name, who: who2}; }
  if (!depth) {   /* branch codes, branch names and month words inside a longer query act as the choices; the rest is read again */
    var ws = qn.split(' '), br = '', mo = '', rest = ' ' + qn + ' ';
    Object.keys(I.brName).sort(function (a, b) { return b.length - a.length; }).forEach(function (nm) { if (nm.indexOf(' ') > 0 && !br && rest.indexOf(' ' + nm + ' ') >= 0) { br = I.brName[nm]; rest = rest.replace(' ' + nm + ' ', ' '); } });
    ws.forEach(function (w) { if (BRS.indexOf(w.toUpperCase()) >= 0 && !br) { br = w.toUpperCase(); rest = rest.replace(' ' + w + ' ', ' '); } else if (MOW[w] && !mo) { mo = MOW[w]; rest = rest.replace(' ' + w + ' ', ' '); } });
    if ((br || mo) && ws.length >= 2) { var r2 = rest.trim(), K2 = r2 ? xKind(r2, 1) : {kind: ''}; K2.combo = {br: br, mo: mo, rest: r2}; return K2; }
  }
  if (I.supAl[qn] && !(LT || []).some(function (t) { return t.indexOf(qn) >= 0; })) { var K3 = xKind(I.supAl[qn], 1); K3.read = I.supAl[qn]; return K3; }
  var wsp = qn.split(' ').map(function (w) { return w.replace(/^[^a-z0-9&$−-]+/, '').replace(/[^a-z0-9&%]+$/, ''); }).filter(Boolean); if (!wsp.length) wsp = qn.split(' ');
  var who = I.people.filter(function (w) { var nw = norm(w).split(' '); return wsp.every(function (x) { return nw.some(function (y) { return y === x || (x.length >= 3 && y.indexOf(x) === 0); }); }); });
  if (who.length) return {kind: 'person', who: who};
  return {kind: 'text', ws: wsp, q: qn};
}
function xDate(qn) {   /* a date in Sep to Nov 2026, as D Mon, Mon D, D/M, D/M/YYYY or YYYY-MM-DD */
  var m, d, mo;
  if ((m = qn.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+2026)?$/)) && MONI[m[2]]) { d = +m[1]; mo = MONI[m[2]]; }
  else if ((m = qn.match(/^([a-z]+)\s+(\d{1,2})(?:\s+2026)?$/)) && MONI[m[1]]) { d = +m[2]; mo = MONI[m[1]]; }
  else if ((m = qn.match(/^(\d{1,2})\/(\d{1,2})(?:\/(?:20)?26)?$/))) { d = +m[1]; mo = +m[2]; }
  else if ((m = qn.match(/^2026-(\d{2})-(\d{2})$/))) { d = +m[2]; mo = +m[1]; }
  else return null;
  if (mo < 9 || mo > 11 || d < 1 || d > (mo === 10 ? 31 : 30)) return null;
  return {d: d, m: MON[mo - 1]};
}
function xRange(qn) {
  /* over, above, more than, > and under, below, less than, < are strict; at least, >=, at most, <= and between take the bound itself */
  var x = function (s) { var t = String(s).replace(/[$,\s]/g, ''), sg_ = /^[−-]/.test(t) ? -1 : 1, k; t = t.replace(/^[−-]/, '').replace(/^\$/, ''); k = /k$/.test(t); t = t.replace(/k$/, ''); return /^\d+(\.\d{1,2})?$/.test(t) ? sg_ * Math.round(Number(t) * (k ? 1000 : 1) * 100) : null; }, m, N = '([−-]?\\$?[−-]?[\\d,.]+k?)';
  var WD = {'>': 'over', '>=': 'at least', '<': 'under', '<=': 'at most'};
  if ((m = qn.match(new RegExp('^between\\s*' + N + '\\s*and\\s*' + N + '$')))) { var a = x(m[1]), b = x(m[2]); return a !== null && b !== null ? {lo: Math.min(a, b), hi: Math.max(a, b), li: 1, hiI: 1, w: 'between'} : null; }
  if ((m = qn.match(new RegExp('^(over|above|more than|greater than|>=|>|at least|no less than)\\s*' + N + '$')))) { var o = x(m[2]); return o === null ? null : {lo: o, hi: Infinity, li: /^(>=|at least|no less than)$/.test(m[1]) ? 1 : 0, w: WD[m[1]] || m[1]}; }
  if ((m = qn.match(new RegExp('^(under|below|less than|<=|<|at most|no more than|up to)\\s*' + N + '$')))) { var u = x(m[2]); return u === null ? null : {lo: -Infinity, hi: u, hiI: /^(<=|at most|no more than|up to)$/.test(m[1]) ? 1 : 0, w: WD[m[1]] || m[1]}; }
  return null;
}
function xAmount(v) {   /* where a figure is an item's own figure, and where it is only written in a text */
  var I = xIndex(), own = v ? I.own.filter(function (o) { return Math.abs(o.c) === Math.abs(v); }) : [], seen = [], recs = [];
  own.forEach(function (o) { var k = recs.indexOf(o.r); if (k < 0) { recs.push(o.r); seen.push({r: o.r, f: [o.f]}); } else if (seen[k].f.indexOf(o.f) < 0) seen[k].f.push(o.f); });
  var txt = v ? I.rec.filter(function (r) { return recs.indexOf(r) < 0 && moneyIn(r.raw + ' ' + (r.b || '')).some(function (m) { return Math.abs(m.c) === Math.abs(v); }); }) : [];
  return {own: seen, txt: txt};
}
function xBox() {
  if (!DATA.facts || !DATA.revFacts) return '';
  var o = function (v, t) { return '<option value="' + e(v) + '">' + e(t) + '</option>'; };
  /* data-ro: the page's read-only lock (a view-only link disables every field) leaves these alone; they filter what is shown and write nothing */
  return '<div class="plx" id="plx" data-ro role="search" aria-label="Find in the P&amp;L">'
    + '<div class="plx-top"><p class="fin745-eyebrow">FIND IN THE P&amp;L</p><p class="plx-help">Ask in plain words: a PO, hire contract, invoice, V8s PO, receipt, quote, docket, asset, GL code, amount, date, week, supplier or person, or a question such as accruals, margin or no PO. Or choose a category, branch or month. Every figure is the P&amp;L’s own, to the cent; categories group the cost lines for reporting and are not GL codes. Press / to search.</p></div>'
    + '<div class="plx-bar">'
    + '<label class="plx-f"><span>Category</span><select id="plx-cat">' + o('', 'All categories') + (DATA.categories || []).map(function (c) { return o(c.name, c.name); }).join('') + '</select></label>'
    + '<label class="plx-f"><span>Branch</span><select id="plx-br">' + o('', 'All branches') + BRS.map(function (b) { return o(b, BRN[b]); }).join('') + '</select></label>'
    + '<label class="plx-f"><span>Month</span><select id="plx-mo">' + o('', 'Job end (Sep to Nov)') + MOS.map(function (m) { return o(m, MOL[m]); }).join('') + '</select></label>'
    + '<label class="plx-f plx-qf"><span>Search</span><input type="search" id="plx-q" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="e.g. accruals, 4918492, GN20, 3052.60, Kyle"></label>'
    + '<button type="button" class="btn ghost sm plx-clear" id="plx-clear">Clear</button>'
    + '</div><div class="plx-sum" id="plx-sum" aria-live="polite"></div><div class="plx-out" id="plx-out"></div></div>';
}
var KIND = {'Labour hire': 'Labour hire', 'Salary allowance': 'Salary'};   /* a cost category and the labour journal rows that belong to it */
function kpi(label, cents_, small, neg) { return '<div class="plx-k' + (neg ? ' pl1267-neg' : '') + '"><span>' + e(label) + '</span><b>' + (cents_ === null ? DASH : f2(cents_ / 100)) + '</b><small>' + e(small) + '</small></div>'; }
function invRow(x, amt) { return '<tr><td><b>' + e(x.inv) + '</b><small>' + dmy(x.date) + '</small></td><td>' + e(x.contract) + ' · ' + e(x.branch) + '<small>our POs against it: ' + e(/^no PO/.test(x.pos) ? 'none on the record' : x.pos) + '</small></td><td>' + e(x.customerPO) + '</td><td class="num">' + cents(amt) + '</td></tr>'; }
var INV_HEAD = '<thead><tr><th>Invoice · date</th><th>Hire contract · branch</th><th>V8s PO</th><th class="num">AUD ex GST</th></tr></thead>';
/* highlight: split the raw text at the matches, escape each piece, then wrap the matches */
function hl(raw) {
  raw = String(raw == null ? '' : raw); if (!XT.length) return e(raw);
  var low = raw.toLowerCase(), mk = [];
  XT.forEach(function (t) { if (!t.s) return; var i = 0; while ((i = low.indexOf(t.s, i)) >= 0) { var ok = !t.w || i === 0 || !/[a-z0-9]/.test(low.charAt(i - 1)); if (t.n && (/[0-9]/.test(low.charAt(i + t.s.length)) || /[0-9]/.test(low.charAt(i - 1)))) ok = false; if (ok) mk.push([i, i + t.s.length]); i += t.s.length; } });
  if (!mk.length) return e(raw);
  mk.sort(function (a, b) { return a[0] - b[0]; }); var out = '', at = 0;
  mk.forEach(function (m) { if (m[0] < at) { if (m[1] > at) { out += '<mark class="plx-hl">' + e(raw.slice(at, m[1])) + '</mark>'; at = m[1]; } return; } out += e(raw.slice(at, m[0])) + '<mark class="plx-hl">' + e(raw.slice(m[0], m[1])) + '</mark>'; at = m[1]; });
  return out + e(raw.slice(at));
}
function hlFig(c) { return [{s: f2c(Math.abs(c)), n: 1, w: 1}, {s: (Math.abs(c) / 100).toFixed(2), n: 1, w: 1}]; }
/* a group of records: a heading with its count and total (or why there is none), a link to its fold, one row per record */
function grpHTML(g) {
  var fold = g.fold === undefined ? (GFOLD[g.id] || '') : g.fold, rows = g.rows, cnt = rows.length, tot = g.tot, isH = function (r) { return g.hours || (r.g === 'lj' && r.c === null && r.h != null); };
  var fig = function (r) { if (isH(r)) return '<td class="num">' + hrs(r.h) + '<small class="plx-tag">' + e(r.hlab || 'paid h') + '</small></td>';
    return '<td class="num">' + (r.c === null || r.c === undefined ? '<span class="pl1267-dash" title="' + e(r.why || '') + '">—</span>' + (r.why ? '<small>' + e(r.why) + '</small>' : '') : (g.sign ? e(sg(r.c)) : f2c(r.c))) + (r.tag ? '<small class="plx-tag">' + e(r.tag) + '</small>' : '') + '</td>'; };
  var row = function (r) { var f = r.fold || fold;
    return '<tr><td><b>' + hl(r.t) + '</b>' + (r.d ? '<small>' + hl(r.d) + '</small>' : '') + '</td><td>' + e(r.b || '') + '</td>' + fig(r) + '<td>' + (f ? '<button type="button" class="plx-open" data-fold="' + e(f) + '"' + (r.at ? ' data-at="' + e(r.at) + '" data-av="' + e(r.av) + '"' : '') + ' aria-label="Show in ' + e(FOLDS[f] || 'the fold') + '">Show</button>' : '') + '</td></tr>'; };
  var head = '<thead><tr><th>' + e(g.col || 'Item') + '</th><th>Branch</th><th class="num">' + e(g.fcol || (g.hours ? 'Hours' : 'AUD ex GST')) + '</th><th><span class="plx-sr">Link</span></th></tr></thead>';
  var none = tot === null || tot === undefined, totTxt = none ? 'no total: ' + (g.why || 'the rows are not parts of one register') : g.hours ? hh(tot) + ' h' : (g.sign ? sg(tot) : f2c(tot));
  var first = rows.slice(0, 12), more = rows.slice(12);
  return '<section class="plx-g" id="plx-g-' + e(g.id) + '" aria-label="' + e(g.label) + '"><div class="plx-gh"><p class="fin745-eyebrow plf1272-sub">' + e(String(g.label).toUpperCase()) + ' · ' + cnt + ' · ' + e(totTxt) + '</p>'
    + (fold ? '<button type="button" class="plx-open plx-of" data-fold="' + e(fold) + '">Open in ' + e(FOLDS[fold] || 'the fold') + '</button>' : '') + '</div>'
    + (g.note ? '<p class="plf1272-note">' + rich(g.note) + '</p>' : '')
    + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-gt">' + head + '<tbody>' + first.map(row).join('')
    + '<tr class="pl1267-grand"><td>' + n(cnt, g.unit || 'item', g.units || (g.unit || 'item') + 's') + '</td><td></td><td class="num">' + (none ? '<span class="pl1267-dash" title="' + e(g.why || '') + '">—</span>' : (g.hours ? hh(tot) : g.sign ? e(sg(tot)) : f2c(tot))) + '</td><td></td></tr></tbody></table></div>'
    + (more.length ? '<details class="plx-more"><summary>Show ' + more.length + ' more</summary><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-gt">' + head + '<tbody>' + more.map(row).join('') + '</tbody></table></div></details>' : '')
    + '</section>';
}
function chipsHTML(label, list) { return list.length ? '<div class="plx-chips"><span>' + e(label) + '</span>' + list.map(function (c) { return typeof c === 'string' ? '<button type="button" class="plx-go" data-q="' + e(c) + '">' + e(c) + '</button>' : c.cat ? '<button type="button" class="plx-pick plx-chip" data-cat="' + e(c.cat) + '">' + e(c.t) + '</button>' : '<button type="button" class="plx-go" data-q="' + e(c.q) + '">' + e(c.t) + '</button>'; }).join('') + '</div>' : ''; }
var TRY = [['Month end', ['Accruals', 'Manual accrual', '31 Oct', 'Received not invoiced', 'No PO']], ['Result', ['Margin', 'Actual vs estimate', 'Revenue', 'November forecast', 'Extra revenue']],
  ['Labour and transport', ['Labour recovery', 'Overtime', 'Running sheet variance', 'Pick-ups', 'Schedule 17']], ['Look up', ['9990776', 'Event Portables', '3052.60', 'GN20', '4918492', 'STPS October']]];
function tryHTML(withCats) { return '<div class="plx-try"><p class="plx-tryh">Try</p>' + TRY.map(function (r) { return chipsHTML(r[0], r[1]); }).join('')
  + (withCats ? chipsHTML('By category', (DATA.categories || []).map(function (c) { return {cat: c.name, t: c.name}; })) : '') + '</div>'; }
function xRender() {
  var sumEl = D.getElementById('plx-sum'), outEl = D.getElementById('plx-out');
  if (!sumEl || !outEl) return;
  xIndex();
  var J = DATA, K = xKind(XS.q), s = {cat: XS.cat, br: XS.br, mo: XS.mo}, note = '', out = '', qt = String(XS.q || '').trim();
  var GR = [], ANS = '', CH = [];
  XT = [];
  var setAside = function (k, v, what) { return s[k] && s[k] !== v ? ' (the ' + what + ' choice, ' + s[k] + ', is set aside)' : ''; };
  if (K.combo) {   /* typed branch and month words act as the choices */
    var parts = [], sa = '';
    if (K.combo.br) { parts.push('the Branch ' + K.combo.br); sa += setAside('br', K.combo.br, 'Branch'); s.br = K.combo.br; }
    if (K.combo.mo) { parts.push('the Month ' + MOL[K.combo.mo].split(' ')[0]); sa += setAside('mo', K.combo.mo, 'Month'); s.mo = K.combo.mo; }
    if (K.kind === 'category') { parts.unshift('the Category ' + K.cat); sa += setAside('cat', K.cat, 'Category'); s.cat = K.cat; K = {kind: '', typed: 1, combo: K.combo, cat: K.cat}; }
    note = '“' + qt + '” is read as ' + parts.join(' and ') + (K.kind && K.combo.rest ? ', then “' + K.combo.rest + '”' : '') + ', as the choices do' + sa + '.';
  }
  if (K.combo && !K.kind) K.typed = 1;
  if (K.read) note = '“' + qt + '” read as ' + K.read + '.';
  if (K.pfx) note = '“' + qt + '” is read as ' + K.pfx + '.';
  if (K.signed) note = '“' + qt + '” is read as ' + f2c(K.v) + ': an amount is matched without its sign or brackets (a move or credit can print as −' + f2c(K.v) + ').';
  if (K.costs && !K.combo) note = '“' + qt + '” is the job cost: the choices’ own figures and table, as with nothing typed.';
  if (K.kind === 'branch') { note = '“' + qt + '” is a branch' + (K.named ? ' (' + K.br + ')' : '') + ': showing ' + BRN[K.br] + ', as the Branch choice does' + setAside('br', K.br, 'Branch') + '.'; s.br = K.br; K = {kind: '', typed: 1, br: K.br}; }
  if (K.kind === 'category') { note = '“' + qt + '” is a category' + (K.alias ? ' (' + K.cat + ')' : '') + ': showing ' + K.cat + ', as the Category choice does' + setAside('cat', K.cat, 'Category') + '.'; s.cat = K.cat; K = {kind: '', typed: 1, cat: K.cat}; }
  if (K.kind === 'month') { note = '“' + qt + '” is a month: showing ' + MOL[K.mo].split(' ')[0] + ', as the Month choice does' + setAside('mo', K.mo, 'Month') + '.'; s.mo = K.mo; K = {kind: '', typed: 1, mo: K.mo}; }
  if (K.kind === 'view' && /^(forecast|monthend|margin|revenue)$/.test(K.v)) {   /* these views are the choices' own figures and tables, with an answer and groups */
    if (K.v === 'forecast' || K.v === 'monthend') { var vm = K.v === 'forecast' ? 'Nov' : 'Oct', vn = (K.v === 'forecast' ? 'the November forecast' : 'month end, 31 Oct') + ': showing ' + MOL[vm].split(' ')[0] + ', as the Month choice does' + setAside('mo', vm, 'Month') + '.';
      note = note ? note.replace(/\.$/, '') + '; ' + vn : '“' + qt + '” is ' + vn; s.mo = vm; }
    K = {kind: '', typed: 1, vv: K.v, combo: K.combo};
  }
  var jobOnly = function (what) { return s.mo ? what + ' is for the job, not by month: choose Job end' : ''; };
  var cols = s.mo ? [s.mo] : MOS;
  var head = function (first, extra) { return '<thead><tr><th>' + first + '</th>' + (extra || '') + cols.map(function (m) { return '<th class="num">' + e(m) + '</th>'; }).join('') + (s.mo ? '' : '<th class="num">Job end</th>') + '</tr></thead>'; };
  var cells = function (by) { var t = 0; var h = cols.map(function (m) { t += by[m] || 0; return '<td class="num">' + cents(by[m] || 0) + '</td>'; }).join(''); return h + (s.mo ? '' : '<td class="num"><b>' + cents(t) + '</b></td>'); };
  var lineFacts = function (ok) { return (J.facts || []).filter(function (f) { return ok(f[0]) && (!s.br || f[1] === s.br) && (!s.mo || f[2] === s.mo); }); };
  var linesTable = function (facts, caption) {
    var ids = [], seen = {}, tot = {}; MOS.forEach(function (m) { tot[m] = 0; });
    facts.forEach(function (f) { tot[f[2]] += f[3]; if (!seen[f[0]]) { seen[f[0]] = 1; ids.push(f[0]); } }); ids.sort(function (a, b) { return a - b; });
    if (!ids.length) return '';
    var lr = ids.map(function (i) { var l = J.lines[i], by = {}, brs = [], mv = false;
      facts.forEach(function (f) { if (f[0] === i) { by[f[2]] = (by[f[2]] || 0) + f[3]; if (brs.indexOf(f[1]) < 0) brs.push(f[1]); if (f[4]) mv = true; } });
      return '<tr><td><b>' + e(l.supplier) + '</b><small>' + e(l.what) + '</small><small>' + e(poText(l.po)) + ' · Hire contract: ' + e(l.contract) + '</small><small class="plx-cat">' + e(l.category) + '</small></td><td>' + e(brs.join(' · ')) + (mv ? '<small>with the branch move</small>' : '') + '</td>' + cells(by) + '</tr>'; }).join('');
    return (caption ? '<p class="fin745-eyebrow plf1272-sub">' + caption + '</p>' : '') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-lines">' + head('Cost line', '<th>Branch</th>') + '<tbody>' + lr
      + '<tr class="pl1267-grand"><td>' + n(ids.length, 'cost line', 'cost lines') + '</td><td></td>' + cells(tot) + '</tr></tbody></table></div>';
  };
  var journals = function (rowsOk, title) {   /* the labour journals: who, home branch, where the hours are journaled to, by month */
    var lj = (J.labourJournal || []).filter(function (x, i) { return (!s.br || x.branch === s.br) && (!s.cat || x.kind === KIND[s.cat]) && rowsOk(x, i); });
    if (s.mo) lj = lj.filter(function (x) { return s.mo === 'Sep' ? x.sep : s.mo === 'Oct' ? x.oct : true; });
    if (!lj.length) return '';
    var t = '<p class="fin745-eyebrow plf1272-sub">' + (title || 'LABOUR JOURNALS' + (s.br ? ' · TO ' + e(s.br) : '')) + '</p>';
    if (s.mo === 'Nov') return t + '<p class="plf1272-note">November’s hours, to 13 Nov, are counted in October: choose October to see them.</p>';
    var hm = s.mo ? [s.mo] : ['Sep', 'Oct'], hs = {Sep: 0, Oct: 0}, lh = 0;
    var jr = lj.map(function (x) { hs.Sep += x.sep; hs.Oct += x.oct; lh += Math.round(x.labourHire * 100);
      return '<tr><td><b>' + e(x.who) + '</b><small>' + e(x.type) + '</small></td><td>' + e(x.home) + '</td><td>' + e(x.journal === 'stays' ? 'stays on ' + x.branch : x.journal) + (x.contract ? '<small>' + e(x.contract) + '</small>' : '') + '</td>'
        + hm.map(function (m) { return '<td class="num">' + hrs(m === 'Sep' ? x.sep : x.oct) + '</td>'; }).join('') + (s.mo ? '<td class="num"><b>' + hrs(s.mo === 'Sep' ? x.paidSep : x.paidOct) + '</b></td>' : '<td class="num"><b>' + hrs(x.sep + x.oct) + '</b></td><td class="num"><b>' + hrs(x.paidSep + x.paidOct) + '</b><small>' + (x.kind === 'Salary' ? 'all normal' : hrs(x.normal) + ' · ' + hrs(x.x15) + ' · ' + hrs(x.x2)) + '</small></td><td class="num">' + cents(Math.round(x.labourHire * 100)) + '</td>') + '</tr>'; }).join('');
    return t + '<p class="plf1272-note">Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). Worked and paid hours differ: the journals use the paid hours. ' + (s.mo ? '' : 'Labour hire $ here is the running sheet’s; the costs carry Job Connect’s invoices and POs where there are any (the bridge, week by week, is in the Labour journals fold). ') + (s.mo === 'Oct' ? 'October’s hours include November’s, to 13 Nov.' : '') + '</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-lj"><thead><tr><th>Person · type</th><th>Home branch</th><th>Journal</th>' + hm.map(function (m) { return '<th class="num">' + e(m === 'Oct' ? 'Oct worked h (with 1–13 Nov)' : m + ' worked h') + '</th>'; }).join('')
      + (s.mo ? '<th class="num">Paid h (journal basis)</th>' : '<th class="num">Worked h</th><th class="num">Paid h (journal basis)<small>normal · ×1.5 · ×2</small></th><th class="num">Labour hire $ (running sheet)</th>') + '</tr></thead><tbody>' + jr
      + '<tr class="pl1267-grand"><td>' + n(lj.length, 'row', 'rows') + '</td><td></td><td></td>' + hm.map(function (m) { return '<td class="num">' + hrs(hs[m]) + '</td>'; }).join('') + (s.mo ? '<td class="num">' + hrs(lj.reduce(function (a, x) { return a + Math.round((s.mo === 'Sep' ? x.paidSep : x.paidOct) * 100); }, 0) / 100) + '</td>' : '<td class="num">' + hrs(hs.Sep + hs.Oct) + '</td><td class="num">' + hrs(lj.reduce(function (a, x) { return a + Math.round((x.paidSep + x.paidOct) * 100); }, 0) / 100) + '</td><td class="num">' + cents(lh) + '</td>') + '</tr></tbody></table></div>';
  };
  /* shared pieces for the answers and the groups */
  var G = function (id, label, rows, o) { o = o || {}; if (!rows.length && !o.keep) return; GR.push({id: id, label: label, rows: rows, tot: o.tot, why: o.why, fold: o.fold, hours: o.hours, sign: o.sign, note: o.note, unit: o.unit, units: o.units, col: o.col, fcol: o.fcol}); };
  var H = xHelpers(s, G, lineFacts, CH);
  H.linesTable = linesTable; H.journals = journals; H.jobOnly = jobOnly;
  var sum = '', scope = (s.br || s.cat || s.mo) ? '<p class="plf1272-note plx-scope">The table below is the whole ' + '%s' + ', for the job: ' + [s.br ? 'branch ' + s.br : '', s.cat ? 'category ' + s.cat : '', s.mo ? MOL[s.mo] : ''].filter(Boolean).join(', ') + ' is applied in the figures above where the P&amp;L splits it, and not otherwise.</p>' : '';
  if (!K.kind && !qt && !s.cat && !s.br && !s.mo) {   /* nothing typed and nothing chosen: the help line and the suggestions (the face carries the static table) */
    sumEl.innerHTML = ''; XLAST = null;
    outEl.innerHTML = '<p class="plx-empty">Choose a category, branch or month, or type a question: the figures come up here. With nothing chosen, the P&amp;L’s own tables are below.</p>' + tryHTML(true); return;
  }
  if (!K.kind) {   /* the choices alone: the parts in whole cents */
    var facts = lineFacts(function (i) { return !s.cat || J.lines[i].category === s.cat; }), cost = 0, nl = {}; facts.forEach(function (f) { cost += f[3]; nl[f[0]] = 1; });
    var rev = null, rf = [];
    if (!s.cat) { rf = (J.revFacts || []).filter(function (r) { return (!s.br || r[1] === s.br) && (!s.mo || r[2] === s.mo); }); rev = 0; rf.forEach(function (r) { rev += r[3]; }); }
    var nInv = rf.filter(function (r) { return r[2] !== 'Nov'; }).length, fc = rf.some(function (r) { return r[2] === 'Nov'; });
    var revWhy = rev === null ? 'not split by cost category' : s.mo === 'Sep' ? 'none in September: the 18 invoices are dated October' : s.mo === 'Nov' ? (fc ? 'the November forecast, not invoiced yet' : 'none in November: the forecast is on NVAC')
      : ((nInv ? n(nInv, 'invoice', 'invoices') : '') + (nInv && fc ? ' and ' : '') + (fc ? 'the November forecast' : '') || 'none on this branch');
    var diff = !s.cat && !s.mo;   /* job end only, for the job or a branch: the revenue is booked in October, the invoice month */
    sum = kpi('Revenue', rev, revWhy) + kpi('Costs', cost, n(Object.keys(nl).length, 'cost line', 'cost lines') + (s.mo === 'Oct' ? ' · with November’s labour' : s.mo === 'Nov' ? ' · forecast' : ''))
      + kpi('Difference so far', diff ? rev - cost : null, diff ? 'revenue less costs, job end · not a margin yet' : s.cat ? 'for the job or a branch, with no category' : 'at job end only: the revenue is booked in October, the invoice month', diff && rev - cost < 0);
    if (!s.cat) {   /* by category, for the branch and month chosen; each opens its lines */
      var tot = {}; MOS.forEach(function (m) { tot[m] = 0; }); facts.forEach(function (f) { tot[f[2]] += f[3]; });
      var grp = J.categoryGroups || [];   /* v12.79: the rehire groups, with their subtotal (Rehire, all) from the same parts, under the table */
      var rows = (J.categories || []).map(function (c) { var by = {}, t = 0; facts.forEach(function (f) { if (J.lines[f[0]].category === c.name) { by[f[2]] = (by[f[2]] || 0) + f[3]; t += f[3]; } });
        return t ? '<tr><td><button type="button" class="plx-pick" data-cat="' + e(c.name) + '">' + e(c.name) + '</button>' + (c.note ? '<small>' + e(c.note) + '</small>' : '') + '</td>' + cells(by) + '</tr>' : ''; }).join('');
      var gfoot = grp.map(function (g) { var gb = {}, gt = 0;
          facts.forEach(function (f) { if ((g.members || []).indexOf(J.lines[f[0]].category) >= 0) { gb[f[2]] = (gb[f[2]] || 0) + f[3]; gt += f[3]; } });
          return gt ? '<tr class="pl1267-tot plx-grp"><td>' + e(g.name) + '<small>' + e((g.members || []).join(' · ')) + '</small></td>' + cells(gb) + '</tr>' : ''; }).join('');
      out += '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-cats">' + head('Category' + (s.br ? ' · ' + e(s.br) : '')) + '<tbody>' + rows
        + '<tr class="pl1267-grand"><td>' + (s.br ? 'Total costs, ' + e(BRN[s.br]) : 'Total costs') + '</td>' + cells(tot) + '</tr></tbody>' + (gfoot ? '<tfoot>' + gfoot + '</tfoot>' : '') + '</table></div>';
    } else out += linesTable(facts);
    if (s.br || KIND[s.cat]) out += journals(function () { return true; });
    if (qt && K.typed) {   /* typed: the answer and the records behind it */
      if (K.vv) ANS = xView({kind: 'view', v: K.vv, rev: rev, cost: cost}, s, H).ans;
      else if (K.br && !K.combo) ANS = xBranchAns(K.br, s, H, rev, cost);
      else if (K.cat) ANS = xCatAns(K.cat, s, H, cost);
      else if (K.mo && !K.combo) ANS = xMonthAns(K.mo, s, rev, cost);
      else ANS = (H.choiceTxt ? H.choiceTxt + ': ' : '') + 'costs ' + BC(cost) + (rev !== null ? ', revenue ' + BC(rev) : '') + (diff ? ', difference so far ' + BC(rev - cost) : '') + '.';
    }
  } else if (K.kind === 'po') {   /* a purchase order: its own amount, from the purchase orders in the costs */
    var x = K.x, li = J.lines.map(function (l, i) { return (String(l.po).match(/\b\d{7}\b/g) || []).indexOf(x.po) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
    var pf = J.facts.filter(function (f) { return li.indexOf(f[0]) >= 0; }), pb = [], pmv = pf.some(function (f) { return f[4]; });
    pf.forEach(function (f) { if (f[3] && pb.indexOf(f[1]) < 0) pb.push(f[1]); });
    var brOff = !s.br ? '' : pb.indexOf(s.br) < 0 ? 'this PO’s cost is on ' + pb.join(' and ') : (pb.length > 1 || pmv) ? 'not split by branch: its line is on ' + pb.join(' and ') + (pmv ? ', with the branch move' : '') + ': choose All branches' : '';
    var cats = li.map(function (i) { return J.lines[i].category; }), off = brOff || ((s.cat && cats.indexOf(s.cat) < 0) ? 'this PO is ' + (cats[0] || 'in another category') : '');
    var amt = Math.round(x.amount * 100);
    if (K.via) note = '“' + K.via.tok + '” is ' + K.via.how + ' on PO ' + x.po + ': showing the PO, as a PO search does.';
    sum = kpi('Revenue', null, 'a PO is a cost') + kpi('Costs', off || s.mo ? null : amt, off || jobOnly('a PO’s amount') || 'PO ' + x.po + ', as in Every purchase order in the costs') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">PURCHASE ORDER ' + e(x.po) + '</p>' + scope.replace('%s', 'PO') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-po"><thead><tr><th>PO · supplier</th><th>Hire contract</th><th>Branch</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + '<tr><td><b>' + e(x.po) + ' · ' + e(x.supplier) + '</b><small>' + e(x.what) + '</small><small>' + e(x.status) + '</small></td><td>' + e(x.contract) + '</td><td>' + e(x.branch) + '</td><td class="num"><b>' + f2(x.amount) + '</b></td></tr></tbody></table></div>'
      + (li.length ? '<p class="plf1272-note">On the cost line' + (li.length > 1 ? 's' : '') + ' below. A line can carry more than one PO, so a line’s total is not the PO’s amount.</p>' + linesTable(lineFacts(function (i) { return li.indexOf(i) >= 0; })) : '');
    ANS = xPoAns(x, K, H);
  } else if (K.kind === 'contract') {   /* a hire contract: what we charged on it and the costs tied to it, as in By hire contract */
    var c = K.x, inv = (J.invoices || []).filter(function (x) { return x.contract === c.contract; }), fcl = (J.novForecastLines || []).filter(function (x) { return x.contract === c.contract; });
    var offc = s.br && c.branch !== s.br ? 'this hire contract’s invoices are on ' + c.branch : '';
    var costOff = s.br ? 'a hire contract’s costs are not split by branch (some sit on other branches): choose All branches' : s.cat ? 'a hire contract’s costs are not split by category' : '';
    var fcTxt = fcl.length ? ' · plus the November forecast ' + fcl.map(function (x) { return f2(x.amount); }).join(', ') + ', not invoiced yet' : '';
    sum = kpi('Revenue', offc || s.mo || s.cat ? null : Math.round(c.revenue * 100), offc || jobOnly('a hire contract’s charge') || (s.cat ? 'not split by cost category' : n(inv.length, 'invoice', 'invoices') + ' on ' + c.contract + fcTxt))
      + kpi('Costs', costOff || s.mo ? null : Math.round(c.costTotal * 100), costOff || jobOnly('a hire contract’s costs') || n(c.costs.length, 'cost', 'costs') + ' tied to it, as in By hire contract')
      + kpi('Difference so far', null, 'not for one contract: some costs are tied to none');
    out += '<p class="fin745-eyebrow plf1272-sub">HIRE CONTRACT ' + e(c.contract) + ' · ' + e(c.branch) + ' · THE V8S’ PO ' + e(c.customerPO) + '</p>' + scope.replace('%s', 'hire contract')
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>' + inv.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('')
      + '<tr class="pl1267-grand"><td>Charged on ' + e(c.contract) + '</td><td></td><td></td><td class="num">' + f2(c.revenue) + '</td></tr></tbody></table></div>'
      + fcl.map(function (x) { return '<p class="plf1272-note">Not in the charge above: the November forecast on ' + e(x.contract) + ' ' + e(x.line) + ' (' + e(x.branch) + '), ' + f2(x.amount) + ', ' + e(x.what) + '. It is in the revenue as the November forecast.</p>'; }).join('')
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-con"><thead><tr><th>Cost tied to ' + e(c.contract) + '</th><th>PO</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + (c.costs.length ? c.costs.map(function (x) { return '<tr><td><b>' + e(x.what) + '</b><small>' + e(x.status) + '</small></td><td>' + e(x.po) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; }).join('') : '<tr><td>no supplier PO or cost on the record against it</td><td></td><td class="num">' + c2(0) + '</td></tr>')
      + '<tr class="pl1267-grand"><td>Costs against ' + e(c.contract) + '</td><td></td><td class="num">' + c2(c.costTotal) + '</td></tr></tbody></table></div>';
    ANS = xConAns(c, s, H);
  } else if (K.kind === 'invoice' || K.kind === 'cpo') {   /* an invoice, or every invoice on a V8s PO, at its amount */
    var L = K.kind === 'invoice' ? [K.x] : K.list, offi = s.br ? L.filter(function (x) { return x.branch === s.br; }) : L, ra = 0;
    offi.forEach(function (x) { ra += Math.round(x.ex * 100); });
    var moOff = s.mo && s.mo !== 'Oct', inChoice = moOff ? 0 : ra, keyed = L.map(function (x) { return String(x.customerPO).split(' (')[0]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var asKeyed = keyed.join('').replace(/\s/g, '').toUpperCase() !== XS.q.replace(/\s/g, '').toUpperCase();
    var why = s.cat ? 'not split by cost category' : !offi.length ? 'none on ' + s.br + ': ' + L.map(function (x) { return x.inv + ' is on ' + x.branch; }).join(', ') : moOff ? 'none in ' + MOL[s.mo].split(' ')[0] + ': ' + (L.length === 1 ? 'the invoice is' : 'the invoices are') + ' dated October'
      : (K.kind === 'invoice' ? 'invoice ' + L[0].inv + ' on ' + L[0].contract : n(offi.length, 'invoice', 'invoices') + (s.br ? ' on ' + s.br : '') + ' on the V8s’ PO ' + keyed.join(', ') + (asKeyed ? ' (as keyed on the invoice)' : ''));
    var chosen = s.br || moOff, choiceWord = [s.br, moOff ? MOL[s.mo].split(' ')[0] : ''].filter(Boolean).join(', ');
    sum = kpi('Revenue', s.cat ? null : inChoice, why) + kpi('Costs', null, 'an invoice is revenue: its hire contract carries the costs tied to it') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">' + (K.kind === 'invoice' ? 'INVOICE ' + e(L[0].inv) : 'INVOICES ON THE V8S’ PO ' + e(keyed.join(', ').toUpperCase())) + '</p>' + scope.replace('%s', K.kind === 'invoice' ? 'invoice' : 'set of invoices') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>'
      + L.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('') + '<tr class="pl1267-grand"><td>' + (chosen ? 'All ' + n(L.length, 'invoice', 'invoices') + ', every branch and month' : n(L.length, 'invoice', 'invoices')) + '</td><td></td><td></td><td class="num">' + cents(L.reduce(function (a, x) { return a + Math.round(x.ex * 100); }, 0)) + '</td></tr>'
      + (chosen && !s.cat ? '<tr class="pl1267-tot"><td>In the choice (' + e(choiceWord) + ')</td><td></td><td></td><td class="num">' + f2(inChoice / 100) + '</td></tr>' : '') + '</tbody></table></div>'
      + '<p class="plf1272-note">' + L.map(function (x) { return '<button type="button" class="plx-go" data-q="' + e(x.contract) + '">Hire contract ' + e(x.contract) + '</button>'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' ') + '</p>';
    ANS = xInvAns(K, L, keyed, asKeyed, H);
  } else if (K.kind === 'removed') {
    sum = kpi('Revenue', null, 'not in the revenue') + kpi('Costs', null, 'an invoice is revenue') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="plf1272-note">Invoice ' + e(K.x.inv) + ' on ' + e(K.x.contract) + ' (' + f2(K.x.ex) + ') is not in the revenue: ' + e(K.x.why) + '.</p>';
    ANS = 'Invoice ' + K.x.inv + ' on ' + K.x.contract + ', ' + BC(C(K.x.ex)) + ', is not in the revenue: ' + K.x.why + '.';
  } else if (K.kind === 'person') {   /* a person: where their hours go; costs are carried by week and supplier, not by person */
    var firsts = K.who.map(function (w) { return new RegExp('\\b' + norm(w).split(' ')[0] + '\\b'); });
    var pl = lineFacts(function (i) { return (!s.cat || J.lines[i].category === s.cat) && firsts.some(function (r) { return r.test(LT[i]); }); });
    sum = kpi('Revenue', null, 'charged by line, not by person') + kpi('Costs', null, 'not totalled for a person: some lines below are theirs alone (accommodation, meals), others are shared (a week of labour hire); labour hire $ in the journals are the running sheet’s') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += journals(function (x) { return K.who.indexOf(x.who) >= 0; }, 'LABOUR JOURNALS · ' + e(K.who.join(', ').toUpperCase())) + linesTable(pl, 'COST LINES THAT MENTION ' + e(K.who.map(function (w) { return w.split(' ')[0]; }).join(', ').toUpperCase()) + ' (WHOLE LINES; SOME ARE SHARED)');
    if (!out) out = '<p class="plx-none">No hours or cost lines for ' + e(K.who.join(', ')) + ' in that choice.</p>';
    ANS = xPersonAns(K.who, H);
  } else if (K.kind === 'text') {   /* any other words: the cost lines that mention them, whole lines, at their parts in the choice */
    var tf = lineFacts(function (i) { return (!s.cat || J.lines[i].category === s.cat) && hit(LT[i], K.ws); }), tc = 0, tl = {}; tf.forEach(function (f) { tc += f[3]; tl[f[0]] = 1; });
    sum = kpi('Revenue', null, 'search an invoice, hire contract or V8s PO for revenue') + kpi('Matching cost lines', tc, n(Object.keys(tl).length, 'cost line', 'cost lines') + (Object.keys(tl).length === 1 ? ' that mentions “' : ' that mention “') + XS.q.trim() + '”, whole lines: a line can be shared with other items, so this is not one item’s cost') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += linesTable(tf, 'COST LINES THAT MENTION “' + e(XS.q.trim().toUpperCase()) + '”');
    out += journals(function (x, i) { return hit(PT[i], K.ws); });
    ANS = xTextAns(K, s, H, tc, Object.keys(tl).length);
  } else {   /* the new kinds: an answer, three cards and the groups */
    var V = xView(K, s, H);
    sum = V.sum; ANS = V.ans; out += V.out || ''; if (V.note) note = note ? note.replace(/\.$/, '') + '; ' + V.note : V.note;
  }
  /* the result, kept for Export and Copy */
  XLAST = {q: qt, choices: H.choiceTxt || 'Job end, all branches and categories', ans: plain(ANS), kpis: [], rows: []};
  var unesc = function (h) { return String(h).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); };
  (sum.match(/<div class="plx-k[^"]*"><span>[^<]*<\/span><b>[\s\S]*?<\/b><small>[\s\S]*?<\/small><\/div>/g) || []).forEach(function (h) { var m = h.match(/<span>([^<]*)<\/span><b>([\s\S]*?)<\/b><small>([\s\S]*?)<\/small>/); var v = unesc(m[2]).trim(); XLAST.kpis.push({label: unesc(m[1]), v: v === '—' ? null : v, why: unesc(m[3])}); });
  GR.forEach(function (g) { g.rows.forEach(function (r) { var isH = g.hours || (r.g === 'lj' && r.c === null && r.h != null); XLAST.rows.push({group: g.label, item: r.t, detail: r.d || '', branch: r.b || '', c: isH ? null : (r.c === undefined ? null : r.c), h: isH ? r.h : null, basis: isH ? 'hours' : r.tag || 'own figure', note: !isH && (r.c === null || r.c === undefined) ? r.why || '' : ''}); }); });
  var tools = qt && (GR.length || ANS) ? '<div class="plx-tools">' + GR.map(function (g) { return '<button type="button" class="plx-jump" data-g="' + e(g.id) + '">' + e(String(g.label).split(' · ')[0]) + ' ' + g.rows.length + '</button>'; }).join('')
    + '<span class="plx-tsp"></span><button type="button" class="plx-csv">Export CSV</button><button type="button" class="plx-copy">Copy</button></div>' : '';
  sumEl.innerHTML = (note ? '<p class="plx-note">' + e(note) + '</p>' : '') + (qt && ANS ? '<p class="plx-ans">' + rich(ANS) + '</p>' : '') + sum;
  var body = out + GR.map(grpHTML).join(''), nothing = !body && !(ANS && K.kind && K.kind !== 'text' && K.kind !== 'person');
  if (nothing) body = '<p class="plx-none">Nothing in the P&amp;L matches that choice.</p>';
  var after = '';
  if (CH.length) after += chipsHTML('Related', CH);
  if (qt && nothing) { var dym = xDidYouMean(qt); if (dym.length) after += chipsHTML('Did you mean', dym); after += tryHTML(false); }
  else if (!qt) after += tryHTML(false);
  outEl.innerHTML = tools + body + after;
}
/* the pieces every answer shares: the choice, the facts, the groups */
function xHelpers(s, G, lineFacts, CH) {
  var J = DATA, H = {G: G, CH: CH, s: s, lineFacts: lineFacts};
  H.sumF = function (fs) { var t = 0; fs.forEach(function (f) { t += f[3]; }); return t; };
  H.catOk = function (i) { return !s.cat || (J.lines[i] && J.lines[i].category === s.cat); };
  H.lineIn = function (i) { return H.sumF(lineFacts(function (k) { return k === i; })); };
  H.fx = function (i, br, mo) { var t = 0; (J.facts || []).forEach(function (f) { if (f[0] === i && (!br || f[1] === br) && (!mo || f[2] === mo)) t += f[3]; }); return t; };
  H.recs = function (g) { return IX.rec.filter(function (r) { return r.g === g; }); };
  H.naming = function (g, tok) { var re = reTok(tok); return H.recs(g).filter(function (r) { return re.test(r.raw + ' ' + (r.b || '')); }); };
  H.sumC = function (rows) { var t = 0; rows.forEach(function (r) { t += r.c || 0; }); return t; };
  H.recRow = function (r, c, why) { var o = {}; for (var k in r) o[k] = r[k]; if (arguments.length > 1) o.c = c; if (why) o.why = why; return o; };
  H.lineRow = function (i, c, why, tag) { var l = J.lines[i]; return {t: l.supplier + ' · ' + l.what, d: [poText(l.po), 'hire contract ' + l.contract, l.state].join(' · '), b: l.branch, c: c, why: why, tag: tag, fold: 'pl1267-fp-lines', g: 'line'}; };
  H.pct = function (d, r) { return r ? (Math.round(d * 10000 / r) / 100).toFixed(2) + '%' : '—'; };
  H.STATES = (J.states || []).slice(); (J.lines || []).forEach(function (l) { if (H.STATES.indexOf(l.state || 'Not classified') < 0) H.STATES.push(l.state || 'Not classified'); });
  H.stateOf = function (i) { return (J.lines[i] && J.lines[i].state) || 'Not classified'; };
  /* by state, from each line's own state; a line's November part is forecast whatever its state, so it goes to November forecast
     (o.__nov: how much of that came from lines in other states). The other states are then to 31 Oct: Accrued at 31 Oct is the accrual. */
  H.NOVST = (J.states || []).filter(function (k) { return k === 'November forecast'; })[0] || (J.states || []).filter(function (k) { return /^November forecast/.test(k); })[0] || 'November forecast';   /* the forecast state by its own name (another state also starts 'November') */
  H.stKey = function (f) { var k = H.stateOf(f[0]); return f[2] === 'Nov' ? H.NOVST : k; };
  H.byState = function (ok) { var o = {__nov: 0}; lineFacts(function (i) { return ok(i); }).forEach(function (f) { var k = H.stKey(f); o[k] = (o[k] || 0) + f[3]; if (k === H.NOVST && H.stateOf(f[0]) !== H.NOVST) o.__nov += f[3]; }); return o; };
  H.novOf = function (o) { return !o.__nov ? '' : o.__nov === o[H.NOVST] ? ' (the November part of lines in other states)' : ' (of which ' + BC(o.__nov) + ' is the November part of lines in other states)'; };
  H.stateTxt = function (o) { return H.STATES.filter(function (k) { return o[k]; }).map(function (k) { return k + ' ' + BC(o[k]) + (k === H.NOVST ? H.novOf(o) : ''); }).join(' · '); };
  H.moTxt = function (by) { return MOS.filter(function (m) { return by[m]; }).map(function (m) { return m + ' ' + BC(by[m]); }).join(' · '); };
  H.brTxt = function (by) { return BRS.filter(function (b) { return by[b]; }).map(function (b) { return b + ' ' + BC(by[b]); }).join(' · '); };
  H.choiceTxt = [s.br ? 'Branch ' + s.br : '', s.cat ? 'Category ' + s.cat : '', s.mo ? MOL[s.mo] : ''].filter(Boolean).join(' · ');
  H.openRows = function (nums) { return nums.map(function (k) { return H.recs('open')[k - 1]; }).filter(Boolean); };
  H.openNo = function (re) { var k = -1; (J.open || []).some(function (t, i) { if (re.test(t)) { k = i; return true; } return false; }); return k + 1; };
  H.supCard = function (sp) {   /* a supplier: its months, accrual, POs and no-PO rows (which tie to its total), and its lines by state */
    var pos = (J.purchaseOrders || []).filter(function (x) { return x.supplier === sp.name; }), np = (J.noPO || []).filter(function (x) { return x.supplier === sp.name; });
    var pc = 0, nc = 0; pos.forEach(function (x) { pc += C(x.amount); }); np.forEach(function (x) { nc += C(x.amount); });
    var st = {}; (J.facts || []).forEach(function (f) { var l = J.lines[f[0]]; if (l && l.supplier === sp.name) { var k = H.stKey(f); st[k] = (st[k] || 0) + f[3]; } });
    var tot = C(sp.total), acc = C(sp.accrue), inv = st.Invoiced || 0, by = {Sep: C(sp.sep), Oct: C(sp.oct), Nov: C(sp.nov)};
    var a = sp.name + ': ' + BC(tot) + ' job end (' + H.moTxt(by) + '), ' + (!acc ? 'nothing accrued' : acc === tot ? 'all accrued' : 'accrued ' + BC(acc)) + ', '
      + (!pos.length ? 'no PO' : !np.length ? n(pos.length, 'PO', 'POs') + ' ' + BC(pc) : n(pos.length, 'PO', 'POs') + ' ' + BC(pc) + ' · no PO ' + BC(nc)) + ', ' + (!inv ? 'no invoice yet' : inv === tot ? 'all invoiced' : 'invoiced ' + BC(inv)) + '.';
    var rows = [{t: 'Job end', d: plain(H.moTxt(by)), b: '', c: tot, tag: 'the supplier’s total', fold: 'pl1267-fp-lines'}, {t: 'Accruals through 31 Oct', d: 'as in Costs by supplier', b: '', c: acc, fold: 'pl1267-fp-journals'},
      {t: 'With a PO', d: n(pos.length, 'PO', 'POs') + (pos.length ? ': ' + pos.map(function (x) { return x.po; }).join(' · ') : ''), b: '', c: pc, fold: 'pl1267-fp-pos'}, {t: 'No PO', d: n(np.length, 'row', 'rows'), b: '', c: nc, fold: 'pl1267-fp-pos'}].filter(function (r) { return r.t === 'Job end' || r.c; });
    H.STATES.forEach(function (k) { if (st[k]) rows.push({t: k, d: k === H.NOVST ? 'its November parts (forecast)' : 'its cost lines in this state, to 31 Oct', b: '', c: st[k], fold: 'pl1267-fp-lines'}); });
    G('sup' + sp.name.replace(/[^A-Za-z]/g, '').slice(0, 12), 'Supplier · ' + sp.name, rows, {fold: '', why: pc + nc === tot ? 'the rows overlap; with a PO ' + f2c(pc) + ' + no PO ' + f2c(nc) + ' = ' + f2c(tot) + ', its total' : 'the POs and no-PO rows do not add to its total', unit: 'row'});
    return a;
  };
  return H;
}
/* the answers and groups for the kept kinds */
function xBranchAns(b, s, H, rev, cost) {
  var J = DATA, G = H.G, br = (J.branches || []).filter(function (x) { return x.b === b; })[0] || {}, inv = (J.invoices || []).filter(function (x) { return x.branch === b; }), fc = (J.novForecastLines || []).filter(function (x) { return x.branch === b; });
  var acc = H.sumF(H.lineFacts(function (i) { return H.catOk(i) && J.lines[i].accrue > 0; }).filter(function (f) { return f[2] !== 'Nov'; }));   /* the accrued lines' work to 31 Oct, in the choice, after the moves */
  var lcb = ((J.labourCharged || {}).branches || []).filter(function (x) { return x.b === b; })[0];
  var R = C(br.revenue), D_ = C(br.difference), job = !s.cat && !s.mo, chT = [s.cat, s.mo ? MOL[s.mo].split(' ')[0] : ''].filter(Boolean).join(', ');
  var JOB = job ? '' : ' (for the branch at job end, all categories and months)';
  var revT = s.cat ? 'revenue not split by cost category' : 'revenue ' + BC(job ? R : rev || 0) + ' (' + (s.mo === 'Sep' ? 'none in September: the invoices are dated October' : s.mo === 'Nov' ? (fc.length ? 'the November forecast, not invoiced yet' : 'none in November: no forecast on ' + b)
    : n(inv.length, 'invoice', 'invoices') + (fc.length && s.mo !== 'Oct' ? ' and the November forecast ' + BC(C(fc[0].amount)) : '')) + ')';
  var a = BRN[b] + (chT ? ', ' + chT : '') + ': ' + revT + ', costs ' + BC(cost) + (job ? ', difference so far ' + BC(D_) + ' (' + H.pct(D_, R) + ' of revenue; not a margin yet)' : '') + '. '
    + (s.mo === 'Nov' ? 'Accruals hold work to 31 Oct: none in November.' : acc ? 'Accrued ' + BC(acc) + (job ? '' : ' in the choice') + ', after the branch moves.' : 'Nothing accrued' + (job ? '' : ' in the choice') + '.') + ' '
    + (lcb && lcb.charged ? 'Labour charged ' + BC(C(lcb.charged)) + ' on ' + n(lcb.lines, 'line', 'lines') + JOB + '.' : 'Labour charged: none.');
  var pick = function (g, ok) { return H.recs(g).filter(ok); }, L_ = function (lbl) { return job ? lbl : lbl + ' · for the branch at job end, all categories and months'; };
  var trOk = !s.cat || /^Transport$/.test(s.cat);
  if (!s.mo || s.mo === 'Oct') { var iv = pick('inv', function (r) { return r.b === b; }); G('inv', s.cat ? L_(GLAB.inv) : GLAB.inv, iv, {tot: H.sumC(iv)}); }
  if (!s.mo || s.mo === 'Nov') G('fc', s.cat ? L_(GLAB.fc) : GLAB.fc, pick('fc', function (r) { return r.b === b; }), {tot: null, why: 'in the revenue as forecast'});
  var jr = xJournalParts(b).map(function (p) { var r = H.recRow(H.recs('jn')[p.i], p.c); if (p.part) r.tag = 'the ' + b + ' part'; return r; });
  if (s.mo !== 'Nov') G('jn', L_(GLAB.jn), jr, {tot: H.sumC(jr), note: 'As journaled (each journal’s own branch); the branch moves are not in them.' + (job ? '' : ' Journals are not split by month or category.')});
  var bl = pick('bl', function (r) { return r.b === b; }); G('bl', L_(GLAB.bl), bl, {tot: H.sumC(bl)});
  var lc = pick('lc', function (r) { return r.b === b; }); G('lc', L_(GLAB.lc), lc, {tot: H.sumC(lc)});
  if (trOk) { var lg = pick('leg', function (r) { return r.b === b && (!s.mo || (s.mo === 'Oct' ? r.grp === 'oct_ran' : s.mo === 'Nov' ? r.grp !== 'oct_ran' : false)); });
    G('leg', GLAB.leg + (s.mo ? ' · ' + MOL[s.mo].split(' ')[0] : ''), lg, {tot: H.sumC(lg), note: 'Estimates of 1 Nov: the trucks that ran by 31 Oct (October) and the pick-ups still to come (November).'}); }
  if (trOk) xS17Group(b, s, H, s.mo ? ' · for the branch, not by month' : '');
  return a;
}
/* the Schedule 17 changes on a branch, each at its effect there (GN26: +580.00 on NVAC, −651.56 on KINP, where its old forecast was), adding to the pack's figure for the branch */
function xS17Group(b, s, H, lblX) {
  var J = DATA, S7 = J.schedule17 || {}, chs = S7.changes || [], rows = [];
  H.recs('s17').forEach(function (r) { var x = chs[r.i], ef = xS17Eff(x); if (!(b in ef)) return; var o = H.recRow(r, ef[b]);
    o.tag = x.branch === b ? (Object.keys(ef).length > 1 ? 'its figure here' : 'the change') : 'its old forecast, off ' + b; o.b = b; rows.push(o); });
  var t = H.sumC(rows), want = (S7.byBranch || {})[b], ok = want === undefined || C(want) === t;
  H.G('s17', GLAB.s17 + (lblX || ''), rows, {tot: ok ? t : null, sign: true, why: 'the effects do not add to the pack’s figure for ' + b, note: rows.some(function (r) { return /old forecast/.test(r.tag); }) ? 'A change whose old forecast sat on another branch counts there with the forecast taken off.' : ''});
  return {rows: rows, t: t, ok: ok};
}
function xCatAns(cat, s, H, cost) {
  var J = DATA, G = H.G, li = [], by = {}, bb = {};
  H.lineFacts(function (i) { return J.lines[i].category === cat; }).forEach(function (f) { if (li.indexOf(f[0]) < 0) li.push(f[0]); by[f[2]] = (by[f[2]] || 0) + f[3]; bb[f[1]] = (bb[f[1]] || 0) + f[3]; });
  var st = H.byState(function (i) { return J.lines[i].category === cat; });
  var a = cat + ': ' + BC(cost) + (H.moTxt(by) ? ' (' + H.moTxt(by) + ')' : '') + '. By branch: ' + (H.brTxt(bb) || 'none') + '. By state: ' + (H.stateTxt(st) || 'none') + '.';
  var pos = []; li.forEach(function (i) { (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).forEach(function (p) { if (pos.indexOf(p) < 0) pos.push(p); }); });
  var pr = H.recs('po').filter(function (r) { return pos.indexOf(J.purchaseOrders[r.i].po) >= 0; });
  G('po', GLAB.po, pr, {tot: H.sumC(pr), note: 'The POs on the category’s lines, each at its own amount, for the job.'});
  var sups = []; li.forEach(function (i) { if (sups.indexOf(J.lines[i].supplier) < 0) sups.push(J.lines[i].supplier); });
  var keys = sups.map(function (sp) { var k = Object.keys(SUPKEY).filter(function (w) { return norm(sp).indexOf(w) >= 0; })[0]; return k ? SUPKEY[k] : ''; }).filter(Boolean);
  var jr = H.recs('jn').filter(function (r) { return keys.some(function (k) { return new RegExp('\\b(' + k + ')\\b').test(r.n); }); });
  G('jn', GLAB.jn, jr, {tot: null, why: 'the accruals of these lines, for the job'});
  if (/^Transport$/i.test(cat)) { var TE = J.transportEstimate || {}, bbT = TE.byBranch || {}, ranC = s.br ? C((bbT.ranBy31Oct || {})[s.br]) : C(TE.ranBy31Oct), onC = s.br ? C((bbT.stillOnSite || {})[s.br]) : C(TE.stillOnSite);
    var ter = []; if (!s.mo || s.mo === 'Oct') ter.push({t: 'Ran by 31 Oct (October)', d: 'trucks that ran with no figure or row' + (s.br ? ' · ' + s.br : ''), b: s.br || '', c: ranC, fold: 'pl1267-fp-test'});
    if (!s.mo || s.mo === 'Nov') ter.push({t: 'Still on site (November)', d: 'pick-ups still to come' + (s.br ? ' · ' + s.br : ''), b: s.br || '', c: onC, fold: 'pl1267-fp-test'});
    G('leg', 'Transport estimate' + (s.br ? ' · ' + s.br : '') + (s.mo ? ' · ' + MOL[s.mo].split(' ')[0] : ''), ter.filter(function (r) { return r.c; }), {tot: H.sumC(ter), unit: 'row', note: 'ESTIMATE, 1 Nov.'});
    if (TE.ranBy31Oct || TE.stillOnSite) a += ' The transport estimate in it' + (s.br ? ' on ' + s.br : '') + ': ' + (s.mo === 'Sep' ? 'none in September' : ter.map(function (r) { return lc1(r.t.replace(/ \(.*\)$/, '')) + ' ' + BC(r.c); }).join(' + ') + (ter.length > 1 ? ' = ' + BC(H.sumC(ter)) : '')) + ' (ESTIMATE, 1 Nov).';
    if (s.br) xS17Group(s.br, s, H, s.mo ? ' · for the branch, not by month' : '');
    else G('s17', GLAB.s17 + (s.mo ? ' · for the job, not by month' : ''), H.recs('s17'), {tot: null, why: 'Schedule 17 figures replace the record’s'}); }
  if (/^Labour hire$/i.test(cat)) {   /* each week at its part in the choice (the branch move takes 460.78 of w/e 18 Oct to STPS) */
    var lh = H.recs('lh').map(function (r) { var wk = J.labourHireBridge[r.i].week, li = -1; (J.lines || []).forEach(function (l, i) { if (l.what === 'Running sheet ' + wk) li = i; });
      if (!s.br && !s.mo) return r; var o = H.recRow(r, li >= 0 ? H.lineIn(li) : null, 'no cost line for the week'); o.tag = 'in the choice'; return o; }).filter(function (r) { return r.c !== 0; });
    G('lh', GLAB.lh + (s.br || s.mo ? ' · in the choice' : ''), lh, {tot: lh.some(function (r) { return r.c === null; }) ? null : H.sumC(lh), why: 'a week has no cost line'}); }
  if (/^Salary/i.test(cat)) G('lc', GLAB.lc, H.recs('lc').filter(function (r) { return /^Labour Charge Project/.test(J.labourCharged.lines[r.i].what); }), {tot: null, why: 'what the V8s were charged, not the salary’s cost'});
  if (/^Accommodation$/i.test(cat)) {
    G('mv', GLAB.mv, H.recs('mv').filter(function (r) { return /3520/.test(J.moves[r.i].account); }), {tot: null, why: 'moves net to nil'});
    var acr = []; (J.contracts || []).forEach(function (c, ci) { var m = String(c.note || '').match(/ACCOM \/ ETC[^(]*\((L\d+), ([\d,]+\.\d{2})\)/); if (m) { var o = H.recRow(H.recs('con')[ci], moneyIn(m[2])[0].c); o.t = c.contract + ' ' + m[1] + ' · ACCOM / ETC'; o.tag = 'charged to the V8s'; acr.push(o); } });
    if (acr.length) { a += ' Against it, the V8s pay ACCOM / ETC ' + BC(H.sumC(acr)) + ' (' + acr.map(function (r) { return r.t.replace(' · ACCOM / ETC', '') + ' ' + BC(r.c); }).join(' · ') + '; revenue, for the job).';
      G('accom', 'ACCOM / ETC charged to the V8s', acr, {tot: H.sumC(acr), fold: 'pl1267-fp-contracts', unit: 'line', note: 'Revenue on the invoices, for the job: set it against the accommodation above.'}); }
    var mvA = (J.moves || []).filter(function (m) { return /3520/.test(m.account); }); if (mvA.length && !s.mo) a += ' Moved: ' + mvA.map(function (m) { return String(m.journal).replace(/^Branch move · accommodation, /, '') + ', ' + BC(C(m.amount)) + ' (' + m.branch + ')'; }).join('; ') + '.';
  }
  return a;
}
function xMonthAns(mo, s, rev, cost) {
  var J = DATA, nl = (J.monthEnd || {}).novLabourInOct || {};
  if (mo === 'Sep') return 'September: costs ' + BC(cost) + '; no revenue: all ' + n((J.invoices || []).length, 'invoice is', 'invoices are') + ' dated October.';
  if (mo === 'Oct') return 'October: costs ' + BC(cost) + ', with November’s labour to 13 Nov' + (nl.total && !s.br && !s.cat ? ' (' + BC(C(nl.total)) + ')' : '') + (rev !== null ? '; revenue ' + BC(rev) + ' from the invoices' : '') + '.';
  return 'November (forecast): costs ' + BC(cost) + (rev !== null ? '; revenue ' + BC(rev) + ', the November forecast, not invoiced yet' : '') + '.';
}
function xPoAns(x, K, H) {
  var J = DATA, G = H.G;
  XT = [{s: String(x.po), w: 1, n: 1}].concat(K.via ? [{s: K.via.tok.toLowerCase(), w: 1}] : []);
  G('jn', GLAB.jn, H.naming('jn', x.po), {tot: null, why: 'the accrual that holds the PO, at the journal’s amount'}); G('mv', GLAB.mv, H.naming('mv', x.po), {tot: null, why: 'moves net to nil'});
  G('lh', GLAB.lh, H.naming('lh', x.po), {tot: null, why: 'the week, not the PO'}); G('cc', GLAB.cc, H.naming('cc', x.po), {tot: null, why: 'where it is tied'});
  G('s17', GLAB.s17, H.naming('s17', x.po), {tot: null, why: 'Schedule 17 figures'});
  G('open', GLAB.open, H.naming('open', x.po).map(function (r) { return H.recRow(r, null, 'as written'); }), {tot: null, why: 'open items are not added'});
  if (K.via) G('line', 'Where it is written', (J.lines || []).map(function (l, i) { return reTok(K.via.tok).test(l.invoice + ' ' + l.what) ? H.lineRow(i, C(l.sep) + C(l.oct) + C(l.nov), '', 'whole line') : null; }).filter(Boolean), {tot: null, why: 'the whole line, not the PO', unit: 'line'});
  IX.people.forEach(function (w) { if (norm(w).split(' ').some(function (p) { return reTok(p).test(x.what); })) H.CH.push({q: w, t: w}); });
  return 'PO ' + x.po + ' · ' + x.supplier + ' · ' + x.what + ' · ' + BC(C(x.amount)) + ' · ' + x.status + ' · ' + x.branch + ' · hire contract ' + x.contract + '.';
}
function xConAns(c, s, H) {
  var J = DATA, G = H.G, MT = J.matchTotals || {};
  var nullCost = (c.costs || []).filter(function (y) { return y.amount == null; })[0], cdiff = nullCost || s.br || s.cat || s.mo ? null : C(c.revenue) - C(c.costTotal);
  var adv = (c.costs || []).some(function (y) { return /^Advanced/.test(y.what); }) ? (J.notTied || []).filter(function (y) { return /fencing loads/.test(y.status); })[0] : null;
  var fl = adv ? moneyIn((String(adv.status).match(/fencing loads, [\d,]+\.\d{2}/) || [''])[0])[0] : null;
  XT = [{s: c.contract, w: 1, n: 1}];
  G('diff', 'Charge less tied costs', [{t: 'Charged on ' + c.contract + ' less the costs tied to it', d: f2(c.revenue) + ' − ' + f2(c.costTotal) + (nullCost ? ' · ' + nullCost.what + ': ' + nullCost.status : ''), b: c.branch, c: cdiff, why: nullCost ? 'a tied cost has no figure here' : 'for the whole contract only: choose All branches, All categories and Job end', fold: 'pl1267-fp-contracts', at: 'data-c', av: c.contract, tag: cdiff === null ? '' : 'not a margin'}],
    {tot: cdiff, why: 'see the row', unit: 'row', note: cdiff === null ? '' : 'Not a margin: the ' + f2c(C(MT.notTied)) + ' of costs tied to no contract is not set against any one contract.'});
  var lc = H.recs('lc').filter(function (r) { return J.labourCharged.lines[r.i].contract === c.contract; }); G('lc', GLAB.lc, lc, {tot: H.sumC(lc)});
  G('s17', GLAB.s17, H.recs('s17').filter(function (r) { return String(J.schedule17.changes[r.i].contractDocket).indexOf(c.contract) === 0; }), {tot: null, why: 'Schedule 17 figures replace the record’s'});
  var po = H.recs('po').filter(function (r) { return String(J.purchaseOrders[r.i].contract).indexOf(c.contract) === 0; }); G('po', GLAB.po, po, {tot: H.sumC(po)});
  G('jn', GLAB.jn, H.naming('jn', c.contract), {tot: null, why: 'accruals, not the contract’s costs'}); G('mv', GLAB.mv, H.naming('mv', c.contract), {tot: null, why: 'moves net to nil'});
  G('fc', GLAB.fc, H.recs('fc').filter(function (r) { return J.novForecastLines[r.i].contract === c.contract; }), {tot: null, why: 'in the revenue as forecast'});
  G('open', GLAB.open, H.naming('open', c.contract), {tot: null, why: 'open items are not added'});
  return c.contract + ' (' + String(c.onIt || '').split(',')[0] + ', ' + c.branch + '): charged ' + BC(C(c.revenue)) + ' on invoice ' + c.invoice + ' (V8s PO ' + c.customerPO + '). Costs tied ' + BC(C(c.costTotal)) + ' in ' + n((c.costs || []).length, 'cost', 'costs') + '. '
    + (cdiff === null ? 'Charge less tied costs: no figure' + (nullCost ? ' (a tied cost has none here: ' + nullCost.status + ')' : ' under a choice') + '.' : 'Charge less tied costs ' + BC(cdiff) + ': not a margin; the ' + BC(C(MT.notTied)) + ' of costs tied to no contract is not set against any one contract' + (fl ? ' (the fencing carrier loads, ' + BC(fl.c) + ', with no docket, are among them)' : '') + '.');
}
function xInvAns(K, L, keyed, asKeyed, H) {
  var J = DATA, G = H.G, all = L.reduce(function (a, x) { return a + C(x.ex); }, 0);
  if (K.kind === 'cpo') return 'V8s PO ' + keyed.join(', ') + ': ' + n(L.length, 'invoice', 'invoices') + ', ' + BC(all) + (asKeyed ? ' (as keyed on the invoice)' : '') + '.';
  var iv = L[0], lc = H.recs('lc').filter(function (r) { return J.labourCharged.lines[r.i].inv === iv.inv; });
  XT = [{s: iv.inv, w: 1, n: 1}]; G('lc', GLAB.lc, lc, {tot: H.sumC(lc)}); G('open', GLAB.open, H.naming('open', iv.inv), {tot: null, why: 'open items are not added'});
  return 'Invoice ' + iv.inv + ', ' + dmyP(iv.date) + ', ' + iv.branch + ': ' + BC(C(iv.ex)) + ' ex GST on ' + iv.contract + ' (V8s PO ' + iv.customerPO + '). Labour lines on it: ' + lc.length + (lc.length ? ', ' + BC(H.sumC(lc)) : '') + '. Our POs against it: ' + (/^no PO/.test(iv.pos) ? 'none on the record' : iv.pos) + '.';
}
function xPersonAns(who, H) {
  var J = DATA, G = H.G, rows = (J.labourJournal || []).filter(function (x) { return who.indexOf(x.who) >= 0; }), a = [];
  XT = []; who.forEach(function (w) { norm(w).split(' ').forEach(function (p) { if (p.length >= 3) XT.push({s: p, w: 1}); }); });
  who.forEach(function (w) { var r = rows.filter(function (x) { return x.who === w; }); if (!r.length) return;
    var wk = 0, pd = 0, lh = 0; r.forEach(function (x) { wk += Math.round((x.sep + x.oct) * 100); pd += Math.round((x.paidSep + x.paidOct) * 100); lh += C(x.labourHire); });
    a.push(whoName(r[0]) + ': ' + r[0].kind + ', home ' + r[0].home + ' → ' + r.map(function (x) { return x.branch; }).filter(function (v, i, aa) { return aa.indexOf(v) === i; }).join(', ') + ', ' + B_(hrs(wk / 100)) + ' worked h, ' + B_(hrs(pd / 100)) + ' paid h' + (lh ? '; running sheet ' + BC(lh) : '') + '.'); });
  var parts = []; who.forEach(function (w) { norm(w).split(' ').forEach(function (p) { if (p.length >= 3) parts.push(p); }); });
  var nm = function (g) { var o = []; parts.forEach(function (p) { H.naming(g, p).forEach(function (r) { if (o.indexOf(r) < 0) o.push(r); }); }); return o; };
  var others = IX.people.filter(function (w) { return who.indexOf(w) < 0; });
  var mark = function (r) { var sh = others.filter(function (w) { return reTok(norm(w).split(' ')[0]).test(r.raw); }), o = H.recRow(r); if (sh.length) o.tag = 'shared with ' + sh.join(', '); return o; };
  var po = nm('po').map(mark), np = nm('nopo').map(mark), op = nm('open');
  if (po.length) a.push('POs naming them: ' + po.map(function (r) { return J.purchaseOrders[r.i].po + ' ' + BC(r.c) + (r.tag ? ' (' + r.tag + ')' : ''); }).join(' · ') + '.');
  if (op.length) a.push(n(op.length, 'open item names', 'open items name') + ' them.');
  a.push('No person total: costs are not split by person.');
  G('po', GLAB.po, po, {tot: null, why: 'some are shared; no person total'}); G('nopo', GLAB.nopo, np, {tot: null, why: 'some are shared; no person total'});
  G('lh', GLAB.lh, nm('lh'), {tot: null, why: 'whole weeks'}); G('jn', GLAB.jn, nm('jn'), {tot: null, why: 'whole journals'}); G('mv', GLAB.mv, nm('mv'), {tot: null, why: 'moves net to nil'});
  G('cc', GLAB.cc, nm('cc'), {tot: null, why: 'whole tied costs'}); G('open', GLAB.open, op, {tot: null, why: 'open items are not added'});
  return a.join(' ');
}
function xTextAns(K, s, H, tc, nLines) {
  var J = DATA, terms = termsOf(K.q), q0 = plain(String(XS.q || '').trim());
  XT = terms.map(function (t) { return {s: t, w: 1, n: /^\d+$/.test(t) ? 1 : 0}; });
  var t3 = terms.filter(function (t) { return t.length >= 3; });
  var sups = t3.length ? (J.suppliers || []).filter(function (sp) { var nm = norm(sp.name), nk = nm.split(/[^a-z0-9&]+/); return t3.every(function (t) { return tokHit(nk, t); }) || Object.keys(SUPKEY).some(function (k) { return K.q === k && new RegExp('\\b(' + SUPKEY[k] + ')').test(nm); }); }) : [];
  var sa = sups.slice(0, 2).map(H.supCard);
  var lineTxt = n(nLines, 'cost line', 'cost lines') + (nLines ? ' (' + BC(tc) + ', whole lines)' : '');
  if (!terms.length) return '“' + q0 + '”: ' + lineTxt + '.';
  var cnt = [], reg = {po: 1, nopo: 1, inv: 1, lc: 1, leg: 1, bl: 1, s17: 1, con: 1, mvd: 1, notin: 1};
  GORD.forEach(function (g) { var rs = H.recs(g).filter(function (r) { return terms.every(function (t) { return tokHit(r.k, t); }); });
    if (s.br) rs = rs.filter(function (r) { return !r.b || String(r.b).indexOf(s.br) >= 0; });
    if (!rs.length) return;
    cnt.push(lc1(GLAB[g]) + ' ' + rs.length);
    H.G(g, GLAB[g], rs, {tot: reg[g] ? H.sumC(rs) : null, why: g === 'open' || g === 'note' ? 'as written; not added' : g === 'jn' ? 'accruals of the cost lines, not added to them' : g === 'mv' ? 'moves net to nil' : g === 'lj' ? 'hours, not dollars' : g === 'lh' ? 'whole weeks' : 'the rows overlap other registers'}); });
  var a = (sa.length ? sa.join(' ') + ' ' : '') + '“' + q0 + '”: ' + lineTxt + (cnt.length ? ' · ' + cnt.join(' · ') : '') + '.';
  /* lines that match only through their category's name (VMS in 'Rehire – VMS, container and forklifts'): say which, and which line names it itself */
  var mL2 = (J.lines || []).map(function (l, i) { return hit(LT[i], K.ws) ? i : -1; }).filter(function (i) { return i >= 0; });
  var own2 = function (l) { return norm([l.supplier, l.branch, l.account, l.what, l.po, l.invoice, l.contract, l.status, l.basis].join(' ')); };
  var viaCat = mL2.filter(function (i) { return !hit(own2(J.lines[i]), K.ws); });
  if (viaCat.length && mL2.length) { var selfL = mL2.filter(function (i) { return viaCat.indexOf(i) < 0; }), cn2 = J.lines[viaCat[0]].category;
    a += ' ' + viaCat.length + ' of the ' + mL2.length + ' match only through the category name “' + cn2 + '” (' + viaCat.map(function (i) { return 'line ' + i + ' ' + J.lines[i].supplier; }).join(', ') + ')'
      + (selfL.length ? '; the line' + (selfL.length > 1 ? 's' : '') + ' that name' + (selfL.length > 1 ? '' : 's') + ' it: ' + selfL.map(function (i) { return 'line ' + i + ', ' + BC(C(J.lines[i].sep) + C(J.lines[i].oct) + C(J.lines[i].nov)) + ' (' + J.lines[i].supplier + ')'; }).join(', ') : '') + '.'; }
  if (terms.some(function (t) { return /^accru/.test(t); })) { a += ' The accruals through 31 Oct are ' + BC(C(J.accrue)) + ' in ' + n((J.journals || []).length, 'journal', 'journals') + ' (some lines above say “not accrued”).'; H.CH.push({q: 'Accruals', t: 'Accruals'}); }
  if (terms.length === 1) BRS.forEach(function (b) { var nm = norm(String(BRN[b]).split(' · ')[1] || ''); if (nm.split(' ').indexOf(terms[0]) >= 0) H.CH.push({q: b, t: BRN[b]}); });
  return a;
}
function xDidYouMean(q) {
  var I = xIndex(), qn = norm(q), out = [];
  if (qn.length >= 5) I.vocab.forEach(function (v) { if (out.indexOf(v) < 0 && out.length < 4 && v !== qn && lev(qn, v) <= 2) out.push(v); });
  qn.split(' ').forEach(function (w) { if (w.length < 5) return; I.vocab.forEach(function (v) { if (v.split(' ').length > 3) return; v.split(' ').forEach(function (vw) { if (vw.length >= 5 && vw !== w && lev(w, vw) <= 2 && out.indexOf(v) < 0 && out.length < 4) out.push(v); }); }); });
  return out.map(function (v) { return {q: v, t: v.charAt(0).toUpperCase() + v.slice(1)}; });
}
/* the views and the new kinds: each answers one finance question from the pack's own figures, in whole cents */
function xJSplit(j) {   /* a journal's amount by branch, from its own branch text (KINP 2,392.50 · NVAC 130.00), else all of it on the branch it names */
  var t = String(j.branch || ''), re = /\b(KINP|STPS|NVAC|MEAD) ([\d,]+\.\d{2})/g, m, o = {}, any = false;
  while ((m = re.exec(t))) { o[m[1]] = moneyIn(m[2])[0].c; any = true; }
  if (!any) { var f = (t.match(/\b(KINP|STPS|NVAC|MEAD)\b/) || [])[1]; if (f) o[f] = C(j.amount); }
  return o;
}
function xJournalParts(b) { var out = []; (DATA.journals || []).forEach(function (j, i) { var o = xJSplit(j); if (o[b] !== undefined) out.push({i: i, c: o[b], part: o[b] !== C(j.amount)}); }); return out; }
function xAcctParts(j) {   /* a journal's amount by account, from its account text (2126 Rehire 34,568.70 · 2142 Installation 36,591.00), else all of it on its one account */
  var t = String(j.account || ''), ps = [], m, re = /\b([23]\d{3})\b[^·\d]*?([\d,]+\.\d{2})/g;
  while ((m = re.exec(t))) ps.push({k: m[1], c: moneyIn(m[2])[0].c});
  if (!ps.length) ps.push({k: (t.match(/\b[23]\d{3}\b/) || [t])[0], c: C(j.amount)});
  return ps;
}
/* a journal part marked 'Finance to confirm NNNN or MMMM' (Q6844 9,600.00 on 2126, or 3325): which journal, which part, the account it sits on (a) and the other (b) */
function xConfirm() {
  var out = []; (DATA.journals || []).forEach(function (j, i) { var m, re = /(Q\d{4}) ([^·]*?) ([\d,]+\.\d{2}) \(Finance to confirm ([23]\d{3}) or ([23]\d{3})\)/g;
    while ((m = re.exec(String(j.journal)))) { var on = xAcctParts(j).map(function (p) { return p.k; }), a = on.indexOf(m[4]) >= 0 ? m[4] : on.indexOf(m[5]) >= 0 ? m[5] : m[4];
      out.push({i: i, q: m[1], what: m[2].trim(), c: moneyIn(m[3])[0].c, a: a, b: a === m[4] ? m[5] : m[4]}); } });
  return out;
}
function xExtra() {   /* the open item of possible extra revenue, item by item, each at the figure it gives (or none) */
  var J = DATA, t = (J.open || []).filter(function (x) { return /^Possible extra revenue:/.test(x); })[0]; if (!t) return [];
  var k = J.open.indexOf(t) + 1, sents = t.replace(/^Possible extra revenue:\s*/, '').split(/\)\.\s+(?=\d)/), items = [];
  sents.forEach(function (snt, si) { if (si < sents.length - 1) snt += ')';
    if (si) { items.push(snt); return; }
    var d = 0, st = 0; for (var i = 0; i < snt.length; i++) { var ch = snt.charAt(i); if (ch === '(') d++; else if (ch === ')') d = Math.max(0, d - 1);
      else if (!d && ch === ';' && snt.charAt(i + 1) === ' ') { items.push(snt.slice(st, i)); st = i + 2; }
      else if (!d && ch === ',' && snt.charAt(i - 1) === ')' && /^ (?:[A-Z]{1,3}\d{2,4}|\d{7,8})\b/.test(snt.slice(i + 1))) { items.push(snt.slice(st, i)); st = i + 2; } }
    items.push(snt.slice(st)); });
  return items.map(function (it) { it = it.trim().replace(/^and /, '').replace(/\.$/, ''); var m, c = null, about = false;
    if ((m = it.match(/ = ([−-]?[\d,]+\.\d{2})/))) c = moneyIn(m[1])[0].c;
    else if ((m = it.match(/quoted ([\d,]+\.\d{2})/))) c = moneyIn(m[1])[0].c;
    else if ((m = it.match(/about ([\d,]+\.\d{2})/))) { c = moneyIn(m[1])[0].c; about = true; }
    else if ((m = it.match(/([\d,]+\.\d{2}) not billed/))) c = moneyIn(m[1])[0].c;
    else if ((m = it.match(/\(([−-][\d,]+\.\d{2})\)/))) c = moneyIn(m[1])[0].c;
    return {t: it, c: c, about: about, k: k}; });
}
function xQuotes() { var qs = []; Object.keys(IX.ref).forEach(function (k) { IX.ref[k].forEach(function (r) { if (r.type === 'quote' && !qs.some(function (q) { return q.q === r.q; })) qs.push(r); }); }); return qs; }
function xQuote(H, sel) {   /* the quotes in the accrual journals, each at its own part; the selected one in card 2 */
  var J = DATA, qs = xQuotes(), R = {};
  if (!qs.length) { R.sum = kpi('Revenue', null, 'no quote in the pack') + kpi('Costs', null, 'no quote in the pack') + kpi('Difference so far', null, 'for the job or a branch, with no search'); R.ans = 'No quote number is held in the pack.'; return R; }
  var j = J.journals[qs[0].i], tot = 0; qs.forEach(function (q) { tot += q.c; });
  var who = (String(j.journal).match(/^Accrual · ([^,:]+)/) || [])[1] || '';
  var others = (J.journals || []).filter(function (x, i) { return i !== qs[0].i && who && String(x.journal).indexOf(who) >= 0 && !/Q\d{4}/.test(x.journal); });
  var sq = sel ? qs.filter(function (q) { return q.q.toUpperCase() === String(sel).toUpperCase(); })[0] : null;
  var chk = []; (J.lines || []).forEach(function (l, i) { var m, re = /([A-Za-z][\w-]*) (Q\d{4})/g; while ((m = re.exec(l.what))) { var q = qs.filter(function (x) { return x.q === m[2]; })[0]; if (q && (!sel || q === sq) && norm(q.name).indexOf(norm(m[1])) < 0) chk.push('cost line ' + i + ' calls ' + m[2] + ' “' + m[1] + '”; the accrual journal calls it “' + q.name + '”'); } });
  var part = function (q) { var m = String(j.journal).match(new RegExp(q.q + ' ([^·]*?) \\d[\\d,]*\\.\\d{2}')); return m ? m[1] : q.name; };
  H.G('quote', 'Quotes in the accruals', qs.map(function (q) { return {t: q.q + ' · ' + part(q), d: 'accrual journal ' + (q.i + 1) + ' · ' + j.account + ' · ' + who, b: j.branch, c: q.c, fold: 'pl1267-fp-journals'}; }), {tot: tot === C(j.amount) ? tot : null, why: 'the parts do not add to the journal', fold: 'pl1267-fp-journals', unit: 'quote'});
  H.G('jn', GLAB.jn, [qs[0].i].concat(others.map(function (x) { return J.journals.indexOf(x); })).map(function (i) { return H.recs('jn')[i]; }), {tot: null, why: 'the journals of the same supplier'});
  var q0 = sel || qs[0].q, re = reTok(q0);
  H.G('line', 'Cost lines that name it', (J.lines || []).map(function (l, i) { return re.test(l.what) ? H.lineRow(i, C(l.sep) + C(l.oct) + C(l.nov), '', 'whole line') : null; }).filter(Boolean), {tot: null, why: 'whole lines, not the quote', unit: 'line'});
  H.G('nopo', GLAB.nopo, H.naming('nopo', q0), {tot: null, why: 'the whole no-PO row'});
  R.sum = kpi('Revenue', null, 'a quote is a cost') + kpi(sq ? 'Quote ' + sq.q : 'Quotes in the accruals', sq ? sq.c : tot, sq ? 'its part of accrual journal ' + (sq.i + 1) + ' (' + j.account + ')' : n(qs.length, 'quote', 'quotes') + ' in accrual journal ' + (qs[0].i + 1)) + kpi('Difference so far', null, 'for the job or a branch, with no search');
  R.ans = (sq ? sq.q + ': ' + BC(sq.c) + ', ' + sq.name + '. ' : '') + 'The quotes in the accruals: ' + qs.map(function (q) { return q.q + ' ' + BC(q.c); }).join(' · ') + ' = ' + BC(tot) + ' (' + who + ', journal ' + (qs[0].i + 1) + ', ' + j.account + ')'
    + (others.length ? '; ' + others.map(function (x) { return (String(x.journal).split(/: /)[0].replace(/^Accrual · [^,]+, /, '')) + ' ' + BC(C(x.amount)) + ' on ' + String(x.account).split(' ')[0] + ' with no quote number'; }).join('; ') : '') + '.' + (chk.length ? ' As written: ' + chk.join('; ') + '.' : '');
  return R;
}
function xView(K, s, H) {
  var J = DATA, G = H.G, v = K.kind === 'view' ? K.v : K.kind, R = {sum: '', ans: '', out: '', note: ''};
  var dash3 = function (why) { return kpi('Revenue', null, why) + kpi('Costs', null, why) + kpi('Difference so far', null, why); };
  var noDiff = kpi('Difference so far', null, 'for the job or a branch, with no search');
  var RV = J.revenue || {}, ME = J.monthEnd || {}, NL = ME.novLabourInOct || {}, PT_ = J.poTotals || {}, MT = J.matchTotals || {}, TE = J.transportEstimate || {}, S7 = J.schedule17 || {}, LC = J.labourCharged || {};
  var costIn = function (ok) { return H.sumF(H.lineFacts(function (i) { return H.catOk(i) && ok(i); })); };
  var lines = function (ok) { return (J.lines || []).map(function (l, i) { return ok(l, i) ? i : -1; }).filter(function (i) { return i >= 0; }); };
  var brOk = function (r) { return !s.br || r.b === s.br; };
  var o11 = (J.open || []).filter(function (t) { return /^November’s labour in October/.test(t); })[0] || '', h194 = (o11.match(/(\d+) h of Coates wages/) || [])[1];
  var lineTot = function (i) { var l = J.lines[i]; return C(l.sep) + C(l.oct) + C(l.nov); };
  var cm = function (o) { var r = {}; for (var k in o) r[k] = C(o[k]); return r; };
  if (v === 'accruals') {
    var aL = lines(function (l) { return l.accrue > 0; }), aF = H.lineFacts(function (i) { return aL.indexOf(i) >= 0 && H.catOk(i); }).filter(function (f) { return f[2] !== 'Nov'; });
    var card = s.mo === 'Nov' ? null : H.sumF(aF), nlA = {}; aF.forEach(function (f) { nlA[f[0]] = 1; });
    R.sum = kpi('Revenue', null, 'accruals are costs') + kpi('Accruals through 31 Oct', card, card === null ? 'accruals hold work to 31 Oct; November is forecast' : n(Object.keys(nlA).length, 'accrued cost line', 'accrued cost lines') + (H.choiceTxt ? ' in the choice, after the branch moves' : ', their work to 31 Oct')) + noDiff;
    var asJ = {}; (J.journals || []).forEach(function (j) { var o = xJSplit(j); for (var b in o) asJ[b] = (asJ[b] || 0) + o[b]; });
    var aft = {}; (J.facts || []).forEach(function (f) { if (aL.indexOf(f[0]) >= 0 && f[2] !== 'Nov') aft[f[1]] = (aft[f[1]] || 0) + f[3]; });
    var accPO = []; aL.forEach(function (i) { (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).forEach(function (p) { accPO.push(p); }); });
    var mvA = (J.moves || []).filter(function (m) { return accPO.indexOf(String(m.po)) >= 0; });
    var octA = 0; (ME.rows || []).forEach(function (r) { if (/^Accrued/.test(r.state)) octA = C(r.oct); });
    var tot = C(J.accrue), meOk = octA && octA + C(ME.accruedSep) === tot;
    R.ans = 'Accruals through 31 Oct: ' + BC(tot) + ' in ' + n((J.journals || []).length, 'journal', 'journals') + ' prepared for Finance' + (meOk ? ': the accrued lines’ October part ' + BC(octA) + ' and September’s catch-up ' + BC(C(ME.accruedSep)) : '') + '. As journaled: ' + H.brTxt(asJ) + '.'
      + (mvA.length ? ' After the branch move' + (mvA.length > 1 ? 's' : '') + ' (' + mvA.map(function (m) { return String(m.journal).replace(/^Branch move · /, '') + ', ' + f2(m.amount); }).join('; ') + '): ' + H.brTxt(aft) + '.' : '') + ' Each reverses on 1 Nov.'
      + (H.choiceTxt ? ' In the choice (' + H.choiceTxt + '): ' + (card === null ? 'none, November is forecast' : BC(card)) + '.' : '');
    var jrows = (J.journals || []).map(function (j, i) { var o = xJSplit(j), r = H.recRow(H.recs('jn')[i]); if (s.br) { if (o[s.br] === undefined) return null; r.c = o[s.br]; if (o[s.br] !== C(j.amount)) r.tag = 'the ' + s.br + ' part'; } return r; }).filter(Boolean);
    var jt = H.sumC(jrows);
    G('jn', GLAB.jn, jrows, {tot: s.mo || s.cat || (!s.br && jt !== tot) ? null : jt, why: s.mo ? 'journals are not split by month' : s.cat ? 'journals are not split by category' : 'the journals do not add to the accruals', note: s.br ? 'As journaled, on ' + s.br + '; the branch moves below are not in them.' : ''});
    G('mv', GLAB.mv, H.recs('mv').filter(function (r) { return !s.br || String(r.b).indexOf(s.br) >= 0; }), {tot: null, why: 'they net to nil'});
    var alr = aL.filter(H.catOk).map(function (i) { var c = 0; aF.forEach(function (f) { if (f[0] === i) c += f[3]; }); return H.lineRow(i, c, '', 'its accrual'); }).filter(function (r) { return r.c; });
    G('acc', 'Accrued cost lines', alr, {tot: card, why: 'November is forecast', fold: 'pl1267-fp-lines', unit: 'line', note: 'Each line’s work to 31 Oct, ' + (H.choiceTxt ? 'in the choice' : 'for the job') + '.'});
    if (!s.br && !s.mo && !s.cat) {
      var acct = {}, ord = []; (J.journals || []).forEach(function (j) { xAcctParts(j).forEach(function (p) { if (!(p.k in acct)) { acct[p.k] = 0; ord.push(p.k); } acct[p.k] += p.c; }); });
      var fcf = xConfirm(), arows = ord.map(function (k) { var fl = fcf.filter(function (x) { return x.a === k || x.b === k; });
        return {t: k, d: 'from the journals’ account text' + fl.map(function (x) { return ' · ' + (x.a === k ? 'of which ' : 'not in it: ') + x.q + ' ' + x.what + ' ' + f2c(x.c) + ' (journal ' + (x.i + 1) + ', on ' + x.a + '): Finance to confirm ' + x.a + ' or ' + x.b; }).join(''), b: '', c: acct[k], fold: 'pl1267-fp-journals'}; }), at = H.sumC(arows);
      if (fcf.length) R.ans += ' To confirm: ' + fcf.map(function (x) { return x.q + ' ' + BC(x.c) + ' (' + x.what + ', journal ' + (x.i + 1) + ') is on ' + x.a + ', marked “Finance to confirm ' + x.a + ' or ' + x.b + '”'; }).join('; ') + '.';
      G('acct', 'By account', arows, {tot: at === tot ? at : null, why: 'the parts do not add to the accruals', fold: 'pl1267-fp-journals', unit: 'account'});
    }
    H.CH.push({q: 'Manual accrual', t: 'What is not in them: manual accrual'}, {q: 'Branch move', t: 'Branch moves'});
  } else if (v === 'manual') {
    var MS = 'Not accrued: manual accrual candidate', mL = lines(function (l) { return l.state === MS; });
    var mF = H.lineFacts(function (i) { return mL.indexOf(i) >= 0 && H.catOk(i); }).filter(function (f) { return f[2] !== 'Nov'; }), mc = s.mo === 'Nov' ? null : H.sumF(mF);
    var supN = []; mL.forEach(function (i) { if (supN.indexOf(J.lines[i].supplier) < 0) supN.push(J.lines[i].supplier); });
    var noPOinv = mL.every(function (i) { return /^none/i.test(String(J.lines[i].po)) && !/^invoiced/i.test(String(J.lines[i].invoice)); });
    /* the parts and the by-branch split from the same facts as the card (the choice applied) */
    var pc_ = {}; mF.forEach(function (f) { pc_[f[0]] = (pc_[f[0]] || 0) + f[3]; });
    var partsTxt = mL.filter(function (i) { return pc_[i]; }).map(function (i) { return 'line ' + i + ' ' + f2c(pc_[i]); }).join(' · ') || 'none in the choice';
    var mb = {}; mF.forEach(function (f) { mb[f[1]] = (mb[f[1]] || 0) + f[3]; });
    var label = supN.length === 1 && /^Carriers/.test(supN[0]) ? 'carrier loads' : 'manual accrual candidates';
    R.sum = kpi('Revenue', null, 'these are costs') + kpi(label.charAt(0).toUpperCase() + label.slice(1) + ' to 31 Oct', mc, mc === null ? 'to 31 Oct only; November is forecast' : partsTxt + (noPOinv ? '; no PO or invoice on the record' : '')) + noDiff;
    var pnL = lines(function (l) { return l.state === 'PO raised, not invoiced'; }), pnPO = []; pnL.forEach(function (i) { (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).forEach(function (p) { if (pnPO.indexOf(p) < 0) pnPO.push(p); }); });
    var rcvC = function (x) { var st = String(x.status), m = st.match(/partly received \(([\d,]+\.\d{2})\)/); return /received in full/.test(st) ? C(x.amount) : m ? moneyIn(m[1])[0].c : 0; };
    var rcv = function (x) { var st = String(x.status), m = st.match(/partly received \(([\d,]+\.\d{2})\)/); return /received in full/.test(st) ? 'received in full' : m ? 'received ' + m[1] + ' of ' + f2(x.amount) : /nothing received/.test(st) ? 'nothing received' : String(x.status).split(/[:;]/)[0]; };
    /* each PO at its line's cost to 31 Oct in the choice (a PO amount can run into November or not be received yet) */
    var poTo = function (po) { var li = pnL.filter(function (i) { return (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).indexOf(po) >= 0; });
      if (li.some(function (i) { return (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).length > 1; })) return null;
      return s.mo === 'Nov' ? 0 : H.sumF(H.lineFacts(function (i) { return li.indexOf(i) >= 0 && H.catOk(i); }).filter(function (f) { return f[2] !== 'Nov'; })); };
    var pr = H.recs('po').filter(function (r) { return pnPO.indexOf(J.purchaseOrders[r.i].po) >= 0; }).map(function (r) { var x = J.purchaseOrders[r.i], o = H.recRow(r, poTo(x.po), 'its line carries several POs'); o.tag = 'to 31 Oct · ' + rcv(x); o.d = 'PO amount ' + f2(x.amount) + ' · ' + r.d; return o; }).filter(function (r) { return r.c !== 0; });
    var prT = pr.some(function (r) { return r.c === null; }) ? null : H.sumC(pr), prR = 0; pr.forEach(function (r) { prR += rcvC(J.purchaseOrders[r.i]); });
    var sal = lines(function (l) { return l.category === 'Salary allowance'; })[0], salB = sal === undefined ? '' : String(J.lines[sal].branch);
    var nr = lines(function (l) { return l.state === 'November labour, carried in October (not accrued)'; }).filter(H.catOk).map(function (i) { return H.lineRow(i, H.fx(i, s.br, 'Oct'), '', 'November work, in October'); }).filter(function (r) { return r.c; });
    if (NL.salary && (!s.br || s.br === salB) && (!s.cat || s.cat === 'Salary allowance')) nr.push({t: 'Salary allowance, November’s share', d: 'in October (the pack’s month end)', b: salB, c: C(NL.salary), fold: 'pl1267-fp-lines'});
    var nt = H.sumC(nr), nrS = nr.filter(function (r) { return /^Salary/.test(r.t); }), nrJ = nt - H.sumC(nrS);
    var novTxt = s.mo && s.mo !== 'Oct' ? '' : '. Apart from these, not a candidate: November’s labour carried in October' + (s.br || s.cat ? (nt ? ' ' + BC(nt) + ' (' + [nrS.length ? 'salary ' + BC(H.sumC(nrS)) + ', allocated through payroll' : '', nrJ ? 'Job Connect ' + BC(nrJ) + ', November work' : ''].filter(Boolean).join(' · ') + ')' : ': none' + (s.br ? ' on ' + s.br : ' in ' + s.cat))
      : ' ' + BC(C(NL.total)) + ' (salary ' + BC(C(NL.salary)) + ', allocated through payroll · Job Connect ' + BC(C(NL.jobConnect)) + ', November work)' + (h194 ? ' and ' + h194 + ' h of Coates wages, not costed' : '')) + '; whether to provision it is for Finance to confirm (open item 11)';
    R.ans = 'Not in the ' + BC(C(J.accrue)) + ' accruals, for Finance to confirm item by item: ' + label + ' to 31 Oct ' + (mc === null ? '(none in November)' : BC(mc)) + (H.choiceTxt ? ' in the choice' : '') + ' (' + partsTxt + (noPOinv ? '; no PO or invoice on the record' : '') + ')' + (!s.br && mc ? ', by branch ' + H.brTxt(mb) : '')
      + '; POs raised, not invoiced, to 31 Oct ' + (prT === null ? 'no single figure' : BC(prT)) + (pr.length ? ' (' + pr.map(function (r) { return J.purchaseOrders[r.i].po + ' ' + (r.c === null ? '—' : f2c(r.c)) + ', ' + rcv(J.purchaseOrders[r.i]); }).join(' · ') + ')' + (!s.mo ? ', of which received ' + BC(prR) : '') : '')
      + novTxt + '.';
    G('cand', 'Manual accrual candidates', mL.filter(H.catOk).map(function (i) { var c = 0, bb = {}; mF.forEach(function (f) { if (f[0] === i) { c += f[3]; bb[f[1]] = (bb[f[1]] || 0) + f[3]; } }); var r = H.lineRow(i, c, '', 'to 31 Oct'); r.d = plain(H.brTxt(bb)) + ' · ' + r.d; return r; }).filter(function (r) { return r.c; }),
      {tot: mc, why: 'November is forecast', fold: 'pl1267-fp-lines', unit: 'line'});
    G('po', 'POs raised, not invoiced, to 31 Oct', pr, {tot: prT, why: 'a line carries several POs', note: 'Each PO at its line’s cost to 31 Oct' + (H.choiceTxt ? ' in the choice' : '') + '; its PO amount is in the detail.'});
    if (!s.mo || s.mo === 'Oct') G('nov', 'November’s labour in October', nr, {tot: s.br || s.cat || nt === C(NL.total) ? nt : null, why: 'the parts do not add to the pack’s figure', fold: 'pl1267-fp-lines', note: h194 ? 'And ' + h194 + ' h of Coates wages, hours only, not costed.' : ''});
    var og = (J.openGroups || []).filter(function (g) { return /Finance/.test(g.name); })[0];
    if (og) G('open', 'Open items · ' + og.name, H.openRows(og.items || []), {tot: null, why: 'as written; not added'});
    H.CH.push({q: 'Received not invoiced', t: 'Received not invoiced'}, {q: 'Pick-ups', t: 'Pick-ups'});
  } else if (v === 'margin') {
    var rv = K.rev, ct = K.cost, job = rv !== null && !s.mo, o10 = H.openNo(/carry no cost/);
    R.ans = job ? 'Difference so far ' + BC(rv - ct) + ' on revenue of ' + BC(rv) + ': ' + B_(H.pct(rv - ct, rv)) + ' of revenue' + (s.br ? ' on ' + s.br : '') + '. Not a margin yet: Coates wages are hours only, not costed; consumables sold carry no cost' + (o10 ? ' (open item ' + o10 + ')' : '') + '; estimates stand until invoiced; November transport is forecast.'
      : 'The difference is for the job or a branch at job end: choose Job end and All categories. Costs in the choice ' + BC(ct) + '.';
    if (job) {
      var brows = (J.branches || []).filter(function (b) { return !s.br || b.b === s.br; }).map(function (b) { return {t: BRN[b.b], d: 'revenue ' + f2(b.revenue) + ' · costs ' + f2(b.costs) + ' · ' + H.pct(C(b.difference), C(b.revenue)) + ' of revenue', b: b.b, c: C(b.difference), fold: ''}; });
      G('brs', 'By branch', brows, {tot: H.sumC(brows), fold: '', unit: 'branch', units: 'branches'});
      if (!s.br) { var tr = [{t: 'Charged on the ' + n((J.contracts || []).length, 'contract', 'contracts'), d: 'the invoices to V8 Supercars', b: '', c: C(MT.invoices), fold: 'pl1267-fp-contracts'}, {t: 'Less the costs tied to a contract', d: '', b: '', c: -C(MT.tied), fold: 'pl1267-fp-contracts'},
          {t: 'Less the costs tied to no contract', d: '', b: '', c: -C(MT.notTied), fold: 'pl1267-fp-contracts'}, {t: 'Plus the November forecast', d: 'not invoiced yet', b: '', c: C(RV.novForecast), fold: 'pl1267-fp-revenue'}], tt = H.sumC(tr);
        G('tie', 'Tie-out by hire contract', tr, {tot: tt === C(J.difference) ? tt : null, why: 'does not tie to the difference', fold: '', unit: 'row', note: 'Charge less tied costs ' + f2c(C(MT.invoices) - C(MT.tied)) + ', then the costs tied to no contract and the forecast: the difference so far.'}); }
    }
    H.CH.push({q: 'Actual vs estimate', t: 'Actual vs estimate'});
  } else if (v === 'revenue' || v === 'invoices') {
    var IV = J.invoices || [], rem = (J.removedInvoices || [])[0], fl = J.novForecastLines || [], ivs = IV.filter(function (x) { return !s.br || x.branch === s.br; });
    var moOff = s.mo && s.mo !== 'Oct', all = 0; ivs.forEach(function (x) { all += C(x.ex); });
    var cntB = {}, sumB = {}; IV.forEach(function (x) { cntB[x.branch] = (cntB[x.branch] || 0) + 1; sumB[x.branch] = (sumB[x.branch] || 0) + C(x.ex); });
    var byD = {}, dOrd = []; ivs.forEach(function (x) { if (!(x.date in byD)) { byD[x.date] = 0; dOrd.push(x.date); } byD[x.date] += C(x.ex); }); dOrd.sort(function (a, b) { return a.split('/').reverse().join('') < b.split('/').reverse().join('') ? -1 : 1; });
    if (v === 'revenue') {
      var bb = {}; (J.branches || []).forEach(function (b) { bb[b.b] = C(b.revenue); });
      R.ans = 'Revenue ' + BC(C(RV.total)) + ': the ' + n(IV.length, 'invoice', 'invoices') + ' to V8 Supercars, ' + BC(C(RV.invoices)) + (fl.length ? ', and the November forecast, ' + BC(C(RV.novForecast)) + ' (' + fl.map(function (x) { return x.contract + ' ' + x.line; }).join(', ') + ', not invoiced yet)' : '') + '. By branch: ' + H.brTxt(bb) + '.'
        + (rem ? ' Not in it: ' + rem.inv + ', ' + BC(C(rem.ex)) + ', ' + String(rem.why).split(':')[0] + '.' : '') + (H.choiceTxt && K.rev !== null && K.rev !== undefined ? ' In the choice (' + H.choiceTxt + '): ' + BC(K.rev) + '.' : '');
      H.CH.push({q: 'Extra revenue', t: 'Extra revenue'});
    } else {
      var ic = s.cat ? null : moOff ? 0 : all;
      R.sum = kpi('Revenue', ic, s.cat ? 'not split by cost category' : moOff ? 'none in ' + MOL[s.mo].split(' ')[0] + ': the invoices are dated October' : n(ivs.length, 'invoice', 'invoices') + ' to V8 Supercars' + (s.br ? ' on ' + s.br : '') + ', dated October') + kpi('Costs', null, 'invoices are revenue') + noDiff;
      R.ans = n(ivs.length, 'invoice', 'invoices') + ' to V8 Supercars' + (s.br ? ' on ' + s.br : '') + ', ' + BC(all) + ', all dated October: ' + dOrd.map(function (d) { return dmyP(d).replace(/ 2026$/, '') + ' ' + BC(byD[d]); }).join(' · ') + '.' + (!s.br ? ' Per branch: ' + BRS.filter(function (b) { return cntB[b]; }).map(function (b) { return b + ' ' + cntB[b] + ' (' + f2c(sumB[b]) + ')'; }).join(' · ') + '.' : '');
    }
    /* the invoices are dated October: under September or November they are not in the choice, so their groups are left out */
    if (!moOff) { var ir = H.recs('inv').filter(brOk); G('inv', GLAB.inv + (s.cat ? ' · not split by cost category' : ''), ir, {tot: H.sumC(ir)});
      G('date', 'By date', dOrd.map(function (d) { return {t: dmyP(d), d: n(ivs.filter(function (x) { return x.date === d; }).length, 'invoice', 'invoices'), b: s.br || '', c: byD[d], fold: 'pl1267-fp-revenue'}; }), {tot: all, unit: 'date', fold: 'pl1267-fp-revenue'});
      if (!s.br) G('brs', 'By branch', BRS.filter(function (b) { return cntB[b]; }).map(function (b) { return {t: BRN[b], d: n(cntB[b], 'invoice', 'invoices'), b: b, c: sumB[b], fold: 'pl1267-fp-revenue'}; }), {tot: all, unit: 'branch', units: 'branches', fold: 'pl1267-fp-revenue'}); }
    if (!s.mo || s.mo === 'Nov') G('fc', GLAB.fc, H.recs('fc').filter(brOk), {tot: null, why: 'in the revenue as forecast, apart from the invoices'});
    if (!s.mo) G('rem', GLAB.rem, H.recs('rem'), {tot: null, why: 'not in the revenue'});
    if (moOff && v === 'revenue') R.ans += ' The ' + n(IV.length, 'invoice is', 'invoices are') + ' dated October: none in ' + MOL[s.mo].split(' ')[0] + (s.mo === 'Nov' ? '; November’s revenue is the forecast' : '') + '.';
  } else if (v === 'status') {
    var ctS = costIn(function () { return true; }), st = H.byState(H.catOk), cl = {}, jobS = !s.br && !s.mo && !s.cat;
    var MSN = 'Not accrued: manual accrual candidate', AST = (J.states || []).filter(function (k) { return /^Accrued/.test(k); })[0] || 'Accrued at 31 Oct';
    H.lineFacts(H.catOk).forEach(function (f) { if (!f[3]) return; var k = H.stKey(f); (cl[k] = cl[k] || {})[f[0]] = 1; });
    /* the checks: Accrued at 31 Oct is the accruals (to the cent), and the manual candidates to 31 Oct are the manual accrual view's figure */
    var mvF = H.sumF(H.lineFacts(function (i) { return H.catOk(i) && J.lines[i].state === MSN; }).filter(function (f) { return f[2] !== 'Nov'; }));
    var bad = function (k) { return (jobS && k === AST && st[k] !== C(J.accrue)) || (k === MSN && (st[k] || 0) !== mvF); };
    var srows = H.STATES.filter(function (k) { return st[k]; }).map(function (k) { return {t: k, d: n(Object.keys(cl[k] || {}).length, 'line', 'lines') + (k === H.NOVST ? plain(H.novOf(st)) : ', to 31 Oct') + ' · ' + H.pct(st[k], ctS) + ' of the cost', b: '', c: bad(k) ? null : st[k], why: 'does not tie: check', fold: 'pl1267-fp-lines'}; }), stt = H.sumC(srows);
    var stTxt = function (r) { return r.t + ' ' + (r.c === null ? '— (does not tie)' : BC(r.c)) + ' (' + H.pct(r.c || 0, ctS) + ')' + (r.t === H.NOVST ? H.novOf(st) : ''); };
    if (K.state) {   /* one state typed: its lines and their parts in the choice */
      var ks = K.state, kc = st[ks] || 0, kOct = 0, kSep = 0; H.lineFacts(H.catOk).forEach(function (f) { if (H.stKey(f) === ks) { if (f[2] === 'Oct') kOct += f[3]; if (f[2] === 'Sep') kSep += f[3]; } });
      R.note = '“' + String(XS.q).trim() + '” is a state on the cost lines: showing the lines in it.';
      R.sum = kpi('Revenue', null, 'the states are costs') + kpi(ks, bad(ks) ? null : kc, n(Object.keys(cl[ks] || {}).length, 'cost line', 'cost lines') + (ks === H.NOVST ? ', their November parts' : ', to 31 Oct') + (H.choiceTxt ? ' in the choice' : '')) + noDiff;
      R.ans = ks + ': ' + n(Object.keys(cl[ks] || {}).length, 'line', 'lines') + ', ' + BC(kc) + (ks === H.NOVST ? H.novOf(st) : ' to 31 Oct (' + [kSep ? 'September ' + BC(kSep) : '', kOct ? 'October ' + BC(kOct) : ''].filter(Boolean).join(' · ') + ')') + (H.choiceTxt ? ' in the choice' : '') + '.'
        + (ks === AST ? ' These are the accruals: ' + BC(C(J.accrue)) + ' in ' + n((J.journals || []).length, 'journal', 'journals') + (jobS && kc === C(J.accrue) ? ', the same to the cent' : '') + '. A line’s November part is November forecast, not accrued.' : '')
        + (ks === MSN ? ' Not in the accruals: see Manual accrual.' : '') + ' All states: ' + srows.map(stTxt).join(' · ') + '.';
      var kr = []; Object.keys(cl[ks] || {}).map(Number).sort(function (a, b) { return a - b; }).forEach(function (i) { var c = H.sumF(H.lineFacts(function (k) { return k === i && H.catOk(k); }).filter(function (f) { return H.stKey(f) === ks; })); if (c) kr.push(H.lineRow(i, c, '', ks === H.NOVST ? 'its November part' : 'to 31 Oct')); });
      G('line', 'Cost lines · ' + ks, kr, {tot: bad(ks) ? null : H.sumC(kr), why: 'does not tie: check', fold: 'pl1267-fp-lines', unit: 'line'});
      G('state', 'By state', srows, {tot: stt === ctS ? stt : null, why: 'the states do not add to the cost', fold: 'pl1267-fp-lines', unit: 'state'});
      H.CH.push({q: 'Actual vs estimate', t: 'All states'}); if (ks === AST) H.CH.push({q: 'Accruals', t: 'Accruals'}); if (ks === MSN) H.CH.push({q: 'Manual accrual', t: 'Manual accrual'});
      return R;
    }
    R.sum = kpi('Revenue', null, 'the states are costs') + kpi('Costs', ctS, 'split by state below; the states add to the cent') + noDiff;
    R.ans = 'By state, from each cost line’s own state (the pack has no single actual or estimate flag), each to 31 Oct, with every November part as November forecast: ' + srows.map(stTxt).join(' · ') + '. They add to ' + BC(ctS) + (H.choiceTxt ? ' in the choice' : '') + '.'
      + (jobS && st[AST] === C(J.accrue) ? ' Accrued at 31 Oct is the accruals, ' + BC(C(J.accrue)) + ', to the cent.' : '');
    G('state', 'By state', srows, {tot: stt === ctS ? stt : null, why: 'the states do not add to the cost', fold: 'pl1267-fp-lines', unit: 'state'});
    var lr = []; H.STATES.forEach(function (k) { (J.lines || []).forEach(function (l, i) { if (!H.catOk(i)) return; var c = H.sumF(H.lineFacts(function (q) { return q === i; }).filter(function (f) { return H.stKey(f) === k; })); if (c) { var r = H.lineRow(i, c); r.tag = k === H.NOVST && l.state !== k ? k + ' (its November part)' : k; lr.push(r); } }); });
    G('line', 'Cost lines by state', lr, {tot: H.sumC(lr), fold: 'pl1267-fp-lines', unit: 'line'});
    H.CH.push({q: 'Estimate', t: 'Estimates'});
  } else if (v === 'forecast') {
    var bc = {}; H.lineFacts(H.catOk).forEach(function (f) { var c = J.lines[f[0]].category; bc[c] = (bc[c] || 0) + f[3]; });
    var catL = (J.categories || []).map(function (c) { return c.name; }).filter(function (c) { return bc[c]; }).sort(function (a, b) { return bc[b] - bc[a]; }), fls = J.novForecastLines || [];
    R.ans = 'November ' + BC(K.cost) + ': ' + catL.map(function (c) { return c + ' ' + BC(bc[c]) + (/^Transport$/.test(c) && TE.stillOnSite && !s.br ? ' (pick-ups still to come ' + BC(C(TE.stillOnSite)) + ')' : ''); }).join(', ') + '.'
      + (K.rev !== null && K.rev !== undefined ? ' Revenue forecast ' + BC(K.rev) + (fls.length && K.rev ? ' (' + fls.map(function (x) { return x.contract + ' ' + x.line; }).join(', ') + ')' : '') + '.' : '') + ' November’s labour (' + BC(C(NL.total)) + (h194 ? ', and ' + h194 + ' h of Coates wages not costed' : '') + ') is carried in October.';
    G('fc', GLAB.fc, H.recs('fc').filter(brOk), {tot: null, why: 'in the revenue as forecast'});
    var lo = H.recs('leg').filter(function (r) { return r.grp === 'nov_on_site' && brOk(r); }); G('leg', 'Still on site: pick-ups to come', lo, {tot: H.sumC(lo), note: 'ESTIMATE, 1 Nov.'});
    var mvd = H.recs('mvd'); if (!s.br) G('mvd', GLAB.mvd, mvd, {tot: H.sumC(mvd), note: 'In the planned loads, in November.'});
    G('open', GLAB.open, H.recs('open').filter(function (r) { return /^November’s labour in October/.test(J.open[r.i]); }), {tot: null, why: 'as written'});
  } else if (v === 'monthend') {
    var octA2 = 0; (ME.rows || []).forEach(function (r) { if (/^Accrued/.test(r.state)) octA2 = C(r.oct); });
    var jobM = !s.br && !s.cat, stM = H.byState(H.catOk), srM = H.STATES.filter(function (k) { return stM[k]; }).map(function (k) { return {t: k, d: H.pct(stM[k], K.cost) + ' of October', b: '', c: stM[k], fold: 'pl1267-fp-lines'}; }), smt = H.sumC(srM);
    var meSame = jobM && (ME.rows || []).every(function (r) { return C(r.oct) === (stM[r.state] || 0); });
    var nInv = (J.revFacts || []).filter(function (r) { return r[2] === 'Oct' && (!s.br || r[1] === s.br); }).length;
    R.ans = 'As at ' + day(J.asAt) + ' (record ' + J.record + '): October costs ' + BC(K.cost) + (jobM ? ', with November’s labour to 13 Nov (' + BC(C(NL.total)) + ': salary ' + BC(C(NL.salary)) + ' · Job Connect ' + BC(C(NL.jobConnect)) + '); without it ' + BC(C(ME.octWithoutNovLabour)) : '') + '. '
      + (K.rev !== null && K.rev !== undefined ? 'Revenue ' + BC(K.rev) + ' from ' + n(nInv, 'invoice', 'invoices') + '. ' : '')
      + (jobM ? 'Accruals through 31 Oct ' + BC(C(J.accrue)) + (octA2 ? ' (the accrued lines’ October part ' + BC(octA2) + ' + September’s catch-up ' + BC(C(ME.accruedSep)) + ')' : '') + '.'
        : (function () { var aSO = 0; (J.facts || []).forEach(function (f) { if (J.lines[f[0]].accrue > 0 && f[2] !== 'Nov' && (!s.br || f[1] === s.br) && H.catOk(f[0])) aSO += f[3]; });
          return 'Accruals through 31 Oct in the choice (' + [s.br, s.cat].filter(Boolean).join(', ') + '): ' + BC(aSO) + ', the accrued lines’ work to 31 Oct after the branch moves (the job’s are ' + BC(C(J.accrue)) + ').'; })());
    G('state', 'October by state', srM, {tot: smt === K.cost ? smt : null, why: 'the states do not add to October', fold: 'pl1267-fp-lines', unit: 'state', note: jobM ? (meSame ? 'The same as the pack’s month end, state by state.' : 'Not the same as the pack’s month end: check.') : ''});
    H.CH.push({q: 'Accruals', t: 'Accruals'}, {q: 'Manual accrual', t: 'Manual accrual'});
  } else if (v === 'extra' || v === 'credit') {
    var X = xExtra(), k17 = X.length ? X[0].k : 0;
    R.sum = dash3('possible, not in the revenue: each item at its own figure');
    if (v === 'extra') {
      G('extra', 'Possible extra revenue', X.map(function (x, i) { return {t: 'Open item ' + x.k + ', item ' + (i + 1), d: x.t, b: '', c: x.c, why: 'no figure in the pack', tag: x.about ? 'about' : x.c !== null && x.c < 0 ? 'a credit' : '', fold: 'pl1267-fp-open'}; }), {tot: null, why: 'possible items: some have no figure and one is a credit', fold: 'pl1267-fp-open'});
      var k16 = H.openNo(/^On the page but on no invoice/), t16 = k16 ? J.open[k16 - 1] : '', r16 = [], m16, re16 = /\b(KINP|STPS|NVAC|MEAD) ([\d,]+\.\d{2})/g;
      while ((m16 = re16.exec(t16))) r16.push({t: 'Open item ' + k16 + ': ' + m16[1], d: 'on the page but on no invoice: to chase or drop', b: m16[1], c: moneyIn(m16[2])[0].c, fold: 'pl1267-fp-open'});
      G('o16', 'On the page, on no invoice', r16, {tot: null, why: 'as written: to chase or drop', fold: 'pl1267-fp-open', unit: 'branch', units: 'branches'});
      G('fc', GLAB.fc, H.recs('fc'), {tot: null, why: 'in the revenue as forecast'});
      if (/accrued revenue|revenue accrual|unbilled revenue|^wip$|work in progress/.test(K.ph || '')) R.note = '“' + String(XS.q).trim() + '”: the P&L holds no revenue accrual. Revenue not invoiced yet is the November forecast (in the revenue) and the possible items below (not in it).';
      R.ans = n(X.length, 'possible item', 'possible items') + ' of extra revenue in open item ' + k17 + ', each at the figure it gives: ' + X.map(function (x) { return x.c === null ? '—' : (x.about ? 'about ' : '') + BC(x.c); }).join(' · ') + '. Not added: they are possible, some have no figure and one is a credit.'
        + (r16.length ? ' Open item ' + k16 + ', on the page but on no invoice: ' + r16.map(function (r) { return r.b + ' ' + BC(r.c); }).join(' · ') + '.' : '')
        + (C(RV.novForecast) ? ' In the revenue but not invoiced yet: the November forecast, ' + BC(C(RV.novForecast)) + ((J.novForecastLines || []).length ? ' (' + J.novForecastLines.map(function (x) { return x.contract + ' ' + x.line; }).join(', ') + ')' : '') + '.' : '');
    } else {
      var k4 = H.openNo(/possible query or credit/), cr = X.filter(function (x) { return x.c !== null && x.c < 0; }), rows4 = k4 ? [H.recRow(H.recs('open')[k4 - 1], null, 'no figure in the pack')] : [];
      cr.forEach(function (x) { rows4.push({t: 'Open item ' + x.k + ': a possible credit', d: x.t, b: '', c: x.c, tag: 'a credit', fold: 'pl1267-fp-open'}); });
      G('credit', 'Possible credits and queries', rows4, {tot: null, why: 'possible: not in the revenue', fold: 'pl1267-fp-open'});
      R.ans = 'Possible credits: ' + (k4 ? 'open item ' + k4 + ' (“' + String(J.open[k4 - 1]).split(/\. (?=[A-Z])/)[0] + '”; no figure in the pack)' : '') + (cr.length ? (k4 ? ' and ' : '') + cr.map(function (x) { return 'the VMS credit in open item ' + x.k + ', ' + BC(x.c); }).join(', ') : '') + '. Not in the revenue.';
    }
  } else if (v === 'open') {
    R.sum = dash3('figures as written; not added');
    XT = []; (J.open || []).forEach(function (t) { moneyIn(t).forEach(function (m) { var s1 = m.s.replace(/^[−-]/, ''); if (!XT.some(function (x) { return x.s === s1; })) XT.push({s: s1, w: 1, n: 1}); }); });
    var gs = J.openGroups || [], used = {};
    gs.forEach(function (g, gi) { var rows = H.openRows(g.items || []); rows.forEach(function (r) { used[r.i] = 1; }); G('open' + gi, g.name, rows, {tot: null, why: 'as written; not added', fold: 'pl1267-fp-open', unit: 'item'}); });
    var rest = H.recs('open').filter(function (r) { return !used[r.i]; }); G('openx', gs.length ? 'Other open items' : 'Open items', rest, {tot: null, why: 'as written; not added', fold: 'pl1267-fp-open', unit: 'item'});
    R.ans = n((J.open || []).length, 'open item', 'open items') + ', word for word' + (gs.length ? ', in ' + n(gs.length, 'group', 'groups') + ': ' + gs.map(function (g) { return g.name + ' (' + (g.items || []).length + ')'; }).join(' · ') : '') + '. Their figures are as written and are not added.';
  } else if (v === 'recovery') {
    var bbL = (LC.branches || []).filter(function (x) { return x.b === s.br; })[0], moc = s.mo || s.cat, why = 'for the job: choose Job end' + (s.cat ? ' and All categories' : '');
    var c1 = moc ? null : s.br ? (bbL ? C(bbL.charged) : 0) : C(LC.total), c2_ = moc ? null : s.br ? (bbL ? C(bbL.installLabourHire) : 0) : C(LC.installTotal), c3 = moc ? null : s.br ? (bbL ? C(bbL.left) : 0) : C(LC.leftTotal);
    R.sum = kpi('Labour charged', c1, moc ? why : s.br ? n(bbL ? bbL.lines : 0, 'line', 'lines') + ' on ' + s.br : n((LC.lines || []).length, 'invoice line', 'invoice lines') + ' coded LABOUR') + kpi('Labour hire cost', c2_, moc ? why : 'already in Installs') + kpi('Left for people’s cost', c3, moc ? why : 'labour charged less the labour hire', c3 !== null && c3 < 0);
    R.ans = 'Labour charged to the V8s ' + BC(C(LC.total)) + ' on ' + n((LC.lines || []).length, 'invoice line', 'invoice lines') + ' (' + (LC.branches || []).map(function (b) { return b.b + ' ' + BC(C(b.charged)); }).join(' · ') + '). Labour hire cost ' + BC(C(LC.installTotal)) + '. Left ' + BC(C(LC.leftTotal)) + ' (' + (LC.branches || []).filter(function (b) { return b.left; }).map(function (b) { return b.b + ' ' + BC(C(b.left)); }).join(' · ') + ').';
    var bl2 = (LC.branches || []).filter(function (b) { return !s.br || b.b === s.br; }).map(function (b) { return {t: BRN[b.b], d: 'charged ' + f2(b.charged) + ' · labour hire ' + f2(b.installLabourHire) + ' · left ' + f2(b.left), b: b.b, c: C(b.charged), fold: 'pl1267-fp-labour'}; });
    G('brs', 'By branch: labour charged', bl2, {tot: H.sumC(bl2), unit: 'branch', units: 'branches', fold: 'pl1267-fp-labour'});
    var lcr = H.recs('lc').filter(brOk); G('lc', GLAB.lc, lcr, {tot: H.sumC(lcr)});
    /* the cost side in the choice: the categories' facts on the branch and in the month; Coates wages as hours journaled to the branch */
    var cw = 0, cwp = 0, cwJ = 0; (J.labourJournal || []).forEach(function (x) { if (x.kind !== 'Coates wages') return; var pj = C(x.paidSep) + C(x.paidOct); cwJ += pj; if (s.br && x.branch !== s.br) return;
      cw += Math.round((s.mo === 'Sep' ? x.sep : s.mo === 'Oct' ? x.oct : s.mo === 'Nov' ? 0 : x.sep + x.oct) * 100); cwp += s.mo === 'Sep' ? C(x.paidSep) : s.mo === 'Oct' ? C(x.paidOct) : s.mo === 'Nov' ? 0 : pj; });
    var catIn = function (nm) { return H.sumF(H.lineFacts(function (i) { return J.lines[i].category === nm; })); }, catJ = function (nm) { var c = (J.categories || []).filter(function (x) { return x.name === nm; })[0]; return c ? C(c.total) : 0; };
    var inCh = s.br || s.mo ? ' · ' + [s.br, s.mo ? MOL[s.mo].split(' ')[0] : ''].filter(Boolean).join(', ') : '';
    G('cost', 'The cost side' + inCh, [{t: 'Labour hire', d: 'the Labour hire category' + (inCh ? ', in the choice' : ''), b: s.br || '', c: catIn('Labour hire'), fold: 'pl1267-fp-lj'}, {t: 'Salary allowance', d: 'the Salary allowance category' + (inCh ? ', in the choice' : ''), b: s.br || '', c: catIn('Salary allowance'), fold: 'pl1267-fp-lines'},
      {t: 'Coates wages', d: hh(cw / 100) + ' worked h · ' + hh(cwp / 100) + ' paid h' + (s.br ? ' journaled to ' + s.br : ''), b: s.br || '', c: null, why: 'hours only, not costed', fold: 'pl1267-fp-lj'}], {tot: null, why: 'the job’s labour cost is not all costed', unit: 'row'});
    /* what 'Left' is not: the notes' own figures */
    var noteFig = function (re) { var t = (LC.notes || []).filter(function (x) { return re.test(x); })[0]; if (!t) return null; var m = moneyIn(t.slice(t.search(re))); return m.length ? m[0].c : null; };
    var advI = noteFig(/Advanced’s installation/), acE = noteFig(/ACCOM \/ ETC/);
    R.ans += ' Left is not a labour margin: the salary allowance (' + BC(catJ('Salary allowance')) + ') and Coates wages (' + B_(hh(cwJ / 100)) + ' paid h, not costed) are not taken off' + (advI !== null || acE !== null ? '; ' + [advI !== null ? 'Advanced’s installation (' + BC(advI) + ')' : '', acE !== null ? 'ACCOM / ETC (' + BC(acE) + ')' : ''].filter(Boolean).join(' and ') + ' are not counted as labour charged' : '') + '. The notes below say why.';
    G('note', 'Notes', (LC.notes || []).map(function (t, i) { return {t: 'Note ' + (i + 1), d: t, b: '', c: null, why: 'as written', fold: 'pl1267-fp-labour'}; }), {tot: null, why: 'as written', fold: 'pl1267-fp-labour', unit: 'note'});
  } else if (v === 'running') {
    var BR = J.labourHireBridge || [], rs = 0, ctt = 0, df = 0; BR.forEach(function (x) { rs += C(x.runningSheet); ctt += C(x.cost); df += C(x.difference); });
    var ch = s.br || s.mo || s.cat;
    R.sum = kpi('Revenue', null, 'labour hire is a cost') + kpi('Labour hire costs', ch ? null : ctt, ch ? 'the weeks are for the job: choose Job end and All branches' : n(BR.length, 'week', 'weeks') + ': invoices where received, else the PO or the running sheet') + kpi('Running sheet less costs', ch ? null : df, ch ? 'for the job' : 'running sheet ' + f2c(rs));
    R.ans = 'Labour hire: running sheet ' + BC(rs) + ', costs ' + BC(ctt) + ', difference ' + BC(df) + ' over ' + n(BR.length, 'week', 'weeks') + '. Weeks that differ: ' + BR.filter(function (x) { return C(x.difference); }).map(function (x) { return x.week + ' ' + BC(C(x.difference)); }).join(' · ') + '.';
    G('lh', GLAB.lh, H.recs('lh'), {tot: ctt, note: 'Running sheet ' + f2c(rs) + ' · costs ' + f2c(ctt) + ' · difference ' + f2c(df) + '.', unit: 'week'});
  } else if (v === 'overtime') {
    R.sum = dash3('hours, not dollars');
    var kinds = {}, ordK = [], ljr = [];
    (J.labourJournal || []).forEach(function (x, i) { if (s.br && x.branch !== s.br) return; var k = x.kind; if (!kinds[k]) { kinds[k] = {n: 0, a: 0, b: 0, p: 0}; ordK.push(k); }
      kinds[k].n += C(x.normal); kinds[k].a += C(x.x15); kinds[k].b += C(x.x2); kinds[k].p += C(x.paidSep) + C(x.paidOct);
      var r = H.recRow(H.recs('lj')[i]); r.h = s.mo === 'Sep' ? x.paidSep : s.mo === 'Oct' ? x.paidOct : Math.round((C(x.paidSep) + C(x.paidOct))) / 100; r.d = x.kind + ' · normal ' + hh(x.normal) + ' · ×1.5 ' + hh(x.x15) + ' · ×2 ' + hh(x.x2) + ' (job)'; ljr.push(r); });
    var kt = function (k) { var o = kinds[k]; return k === 'Salary' ? 'normal ' + B_(hh(o.n / 100)) : 'normal ' + B_(hh(o.n / 100)) + ' · ×1.5 ' + B_(hh(o.a / 100)) + ' · ×2 ' + B_(hh(o.b / 100)) + ' = ' + B_(hh(o.p / 100)) + ' paid'; };
    R.ans = 'Paid hours, the journal basis' + (s.br ? ', on ' + s.br : '') + ': ' + ordK.map(function (k) { return k + ' ' + kt(k); }).join('; ') + '. Hours only: Coates wages are not costed.';
    var pt = 0; ljr.forEach(function (r) { pt += Math.round(r.h * 100); });
    G('lj', 'Paid hours: normal, ×1.5 and ×2', ljr, {hours: true, tot: pt / 100, unit: 'row', fcol: s.mo ? s.mo + ' paid h' : 'Paid h'});
    G('kind', 'By kind', ordK.map(function (k) { var o = kinds[k]; return {t: k, d: 'normal ' + hh(o.n / 100) + ' · ×1.5 ' + hh(o.a / 100) + ' · ×2 ' + hh(o.b / 100), b: '', h: o.p / 100, fold: 'pl1267-fp-lj'}; }), {hours: true, tot: ordK.reduce(function (t, k) { return t + kinds[k].p; }, 0) / 100, unit: 'kind', fold: 'pl1267-fp-lj'});
  } else if (v === 'wages') {
    var W = (J.labourJournal || []).map(function (x, i) { return i; }).filter(function (i) { var x = J.labourJournal[i]; return x.kind === 'Coates wages' && (!s.br || x.branch === s.br); });
    var ws = 0, wo = 0, wp = 0, wb = {}, nm = [];
    W.forEach(function (i) { var x = J.labourJournal[i]; ws += Math.round(x.sep * 100); wo += Math.round(x.oct * 100); var p = C(x.paidSep) + C(x.paidOct); wp += p; wb[x.branch] = (wb[x.branch] || 0) + p; if (nm.indexOf(whoName(x)) < 0) nm.push(whoName(x)); });
    R.sum = kpi('Revenue', null, 'wages are a cost') + kpi('Coates wages $', null, 'no pay rate is applied: hours only') + noDiff;
    R.ans = 'Coates wages' + (s.br ? ' on ' + s.br : '') + ': ' + n(W.length, 'row', 'rows') + ' (' + nm.join(', ') + '). Worked ' + B_(hh(ws / 100)) + ' h in September + ' + B_(hh(wo / 100)) + ' h in October (with 1–13 Nov) = ' + B_(hh((ws + wo) / 100)) + ' h; paid ' + B_(hh(wp / 100)) + ' h (' + BRS.filter(function (b) { return wb[b]; }).map(function (b) { return b + ' ' + B_(hh(wb[b] / 100)); }).join(' · ') + '). No dollars: no pay rate is applied.';
    G('lj', 'Coates wages: paid hours', W.map(function (i) { var r = H.recRow(H.recs('lj')[i]); r.d = 'worked Sep ' + hh(J.labourJournal[i].sep) + ' · Oct ' + hh(J.labourJournal[i].oct) + ' · ' + r.d; return r; }), {hours: true, tot: wp / 100, unit: 'row'});
    G('ljb', 'Paid hours by branch', BRS.filter(function (b) { return wb[b]; }).map(function (b) { return {t: BRN[b], d: 'the branch the hours are journaled to', b: b, h: wb[b] / 100, at: 'data-b', av: b, fold: 'pl1267-fp-lj'}; }), {hours: true, tot: wp / 100, unit: 'branch', units: 'branches', fold: 'pl1267-fp-lj'});
  } else if (v === 'journaled') {
    R.sum = dash3('hours and moves, not a figure to add');
    var LJ = J.labourJournal || [], mvp = function (j, b) { var m = String(j.branch).match(new RegExp('\\b' + b + ' ([−+-])([\\d,]+\\.\\d{2})')); return m ? (m[1] === '+' ? 1 : -1) * moneyIn(m[2])[0].c : null; };
    var ph = function (x) { return (C(x.paidSep) + C(x.paidOct)) / 100; };
    if (s.br) {
      var into = LJ.filter(function (x) { return x.branch === s.br && x.home !== s.br; }), outo = LJ.filter(function (x) { return x.home === s.br && x.branch !== s.br; });
      var mvs = (J.moves || []).map(function (j, i) { return {j: j, i: i, c: mvp(j, s.br)}; }).filter(function (o) { return o.c !== null; });
      var jp = xJournalParts(s.br), jpt = 0; jp.forEach(function (p) { jpt += p.c; });
      R.ans = 'Journaled to ' + s.br + ': ' + (into.map(function (x) { return whoName(x) + ' ' + x.home + '→' + x.branch + ' ' + B_(hh(ph(x))) + ' h'; }).join(' · ') || 'none') + '. Out of ' + s.br + ': ' + (outo.map(function (x) { return whoName(x) + ' →' + x.branch + ' ' + B_(hh(ph(x))) + ' h'; }).join(' · ') || 'none') + '. Cost moves: '
        + (mvs.map(function (o) { return B_(sg(o.c)) + ' (PO ' + o.j.po + ', ' + String(o.j.contract).split(' ')[0] + ')'; }).join(' · ') || 'none') + '. Accruals journaled to ' + s.br + ' ' + BC(jpt) + '.';
      var hr = function (x) { var r = H.recRow(H.recs('lj')[LJ.indexOf(x)]); r.h = ph(x); return r; };
      G('ljin', 'Labour journaled into ' + s.br, into.map(hr), {hours: true, tot: into.reduce(function (t, x) { return t + C(x.paidSep) + C(x.paidOct); }, 0) / 100, unit: 'row', fold: 'pl1267-fp-lj'});
      G('ljout', 'Labour from ' + s.br + ' journaled out', outo.map(hr), {hours: true, tot: outo.reduce(function (t, x) { return t + C(x.paidSep) + C(x.paidOct); }, 0) / 100, unit: 'row', fold: 'pl1267-fp-lj'});
      G('mv', 'Cost moves on ' + s.br, mvs.map(function (o) { return H.recRow(H.recs('mv')[o.i], o.c); }), {tot: mvs.reduce(function (t, o) { return t + o.c; }, 0), sign: true});
      G('jn', 'Accruals journaled to ' + s.br, jp.map(function (p) { var r = H.recRow(H.recs('jn')[p.i], p.c); if (p.part) r.tag = 'the ' + s.br + ' part'; return r; }), {tot: jpt});
    } else {
      var aw = LJ.filter(function (x) { return x.journal !== 'stays'; });
      R.ans = n((J.moves || []).length, 'cost move', 'cost moves') + ' between branches (' + (J.moves || []).map(function (j) { return f2(j.amount) + ' ' + String(j.branch); }).join('; ') + '), no total: they net to nil; ' + n(aw.length, 'labour journal row', 'labour journal rows') + ' journaled away from home.';
      G('mv', GLAB.mv, H.recs('mv'), {tot: null, why: 'they net to nil'});
      G('lj', 'Labour journaled away from home', aw.map(function (x) { var r = H.recRow(H.recs('lj')[LJ.indexOf(x)]); r.h = ph(x); return r; }), {hours: true, tot: aw.reduce(function (t, x) { return t + C(x.paidSep) + C(x.paidOct); }, 0) / 100, unit: 'row'});
    }
  } else if (v === 's17') {
    var card7 = s.mo || s.cat ? null : s.br ? C((S7.byBranch || {})[s.br]) : C(S7.net), chs = S7.changes || [];
    R.sum = kpi('Revenue', null, 'Schedule 17 is the carriers’ side') + kpi('Net change to transport', card7, card7 === null ? 'not split by month or category here' : n(chs.filter(function (x) { return !s.br || (s.br in xS17Eff(x)); }).length, 'change', 'changes') + (s.br ? ' with an effect on ' + s.br : '') + ': Schedule 17’s figures in place of the record’s') + noDiff;
    R.ans = 'Schedule 17 (1 Nov): ' + n(chs.length, 'change', 'changes') + ', net ' + B_(sg(C(S7.net))) + ': added ' + BC(C(S7.added)) + ', forecasts replaced ' + BC(C(S7.forecastsReplaced)) + '. By branch: ' + BRS.map(function (b) { return b + ' ' + B_(sg(C((S7.byBranch || {})[b]))); }).join(' · ') + '. Forklifts to MEAD ' + BC(C(S7.forkliftsToMead)) + '.';
    if (s.br) xS17Group(s.br, s, H, s.mo || s.cat ? ' · for the branch, not by month or category' : '');
    else { var sr = H.recs('s17').map(function (r) { var o = H.recRow(r, C(chs[r.i].change)); o.d = 'Schedule 17 ' + f2(chs[r.i].figure) + ' · ' + r.d; o.tag = 'the change'; return o; });
      G('s17', GLAB.s17 + (s.mo || s.cat ? ' · for the job, not by month or category' : ''), sr, {tot: H.sumC(sr), sign: true}); }
    G('note', 'Schedule 17 notes', H.recs('note'), {tot: null, why: 'as written', unit: 'note'});
  } else if (v === 'pickups') {
    var bbT = TE.byBranch || {}, ran = cm(bbT.ranBy31Oct || {}), on = cm(bbT.stillOnSite || {});
    var cR = s.br ? ran[s.br] || 0 : C(TE.ranBy31Oct), cO = s.br ? on[s.br] || 0 : C(TE.stillOnSite);
    var cardP = s.cat && !/^Transport$/.test(s.cat) ? null : s.mo === 'Sep' ? 0 : s.mo === 'Oct' ? cR : s.mo === 'Nov' ? cO : cR + cO;
    var lrn = H.recs('leg').filter(function (r) { return r.grp === 'oct_ran' && brOk(r); }), lon = H.recs('leg').filter(function (r) { return r.grp === 'nov_on_site' && brOk(r); }), mv2 = H.recs('mvd'), ni = H.recs('notin');
    R.sum = kpi('Revenue', null, 'the pick-ups are costs') + kpi('Transport estimate', cardP, cardP === null ? 'transport only' : 'ESTIMATE, 1 Nov: ran by 31 Oct (October) and still on site (November)') + noDiff;
    R.ans = 'Transport estimate (ESTIMATE, 1 Nov): ran by 31 Oct, ' + n(lrn.length, 'leg', 'legs') + ' ' + BC(cR) + (s.br ? '' : ' (' + H.brTxt(ran) + ')') + ', in October: a manual accrual candidate; still on site, ' + n(lon.length, 'leg', 'legs') + ' ' + BC(cO) + (s.br ? '' : ' (' + H.brTxt(on) + ')') + ', in November. Moved to November: ' + n(mv2.length, 'pick-up', 'pick-ups') + ' ' + BC(H.sumC(mv2)) + ' (in the planned loads' + (s.br ? '; for the job, all branches' : '') + '). Not in it: ' + ni.length + ', ' + BC(H.sumC(ni)) + ' (not in the costs' + (s.br ? '; for the job, all branches' : '') + ').';
    if (s.mo !== 'Nov' && s.mo !== 'Sep') G('legr', 'Ran by 31 Oct', lrn, {tot: H.sumC(lrn), fold: 'pl1267-fp-test', unit: 'leg'});
    if (s.mo !== 'Oct' && s.mo !== 'Sep') G('lego', 'Still on site', lon, {tot: H.sumC(lon), fold: 'pl1267-fp-test', unit: 'leg'});
    if (!s.br) { G('mvd', GLAB.mvd, mv2, {tot: H.sumC(mv2), note: 'In the planned loads, in November; not added to the estimate.'}); G('notin', 'Not in the estimate (not in the costs)', ni, {tot: H.sumC(ni), note: 'Who pays is not on the record; not added to the estimate.'}); }
  } else if (v === 'carrierinv') {
    var tcat = (J.categories || []).filter(function (c) { return /^Transport$/.test(c.name); })[0], cardC = !tcat || (s.cat && s.cat !== tcat.name) ? null : costIn(function (i) { return J.lines[i].category === tcat.name; });
    var l6 = lines(function (l) { return /by the delivery docket on each load/.test(l.contract); })[0], dp = [], m6, re6 = /(\d{7,8}|no docket on the record) (\d[\d,]*\.\d{2}) \((\d+) loads?\)/g;
    if (l6 !== undefined) while ((m6 = re6.exec(J.lines[l6].contract))) dp.push({t: /^\d/.test(m6[1]) ? 'Hire contract ' + m6[1] : 'No docket on the record', d: n(+m6[3], 'load', 'loads'), b: '', c: moneyIn(m6[2])[0].c, fold: 'pl1267-fp-contracts', at: /^\d/.test(m6[1]) ? 'data-c' : '', av: m6[1]});
    var dpt = H.sumC(dp), ck = l6 !== undefined && dpt === lineTot(l6);
    R.sum = kpi('Revenue', null, 'carriers are a cost') + kpi('Transport', cardC, cardC === null ? 'transport only' : 'the Transport category: the schedule’s figures and the 1 Nov estimate') + noDiff;
    R.ans = 'No carrier PO or invoice is on the record: the transport figures are the schedule’s (the carriers’ minimums) and the 1 Nov estimate. Transport ' + BC(cardC === null ? 0 : cardC) + (H.choiceTxt ? ' in the choice' : '') + '.' + (dp.length ? ' The loads to date, ' + BC(dpt) + (ck ? ' (cost line ' + l6 + ')' : '') + ', by delivery docket: ' + n(dp.length, 'part', 'parts') + '.' : '');
    G('dock', 'Loads to date by delivery docket', dp, {tot: ck ? dpt : null, why: 'the parts do not add to the line', fold: 'pl1267-fp-contracts', unit: 'part'});
    G('leg', 'Legs and notes that name a carrier', H.recs('leg').concat(H.recs('notin')).filter(function (r) { return /\b(sfl|cory|kev)\b/i.test(r.raw); }), {tot: null, why: 'estimates and items not in the costs'});
  } else if (v === 'grni') {
    var POs = J.purchaseOrders || [], rf = function (x) { var st = String(x.status), m = st.match(/partly received \(([\d,]+\.\d{2})\)/); return /received in full/.test(st) ? C(x.amount) : m ? moneyIn(m[1])[0].c : null; };
    var rec = H.recs('po').filter(function (r) { return rf(POs[r.i]) !== null && brOk(r); }).map(function (r) { var x = POs[r.i], o = H.recRow(r, rf(x)); o.tag = o.c === C(x.amount) ? 'received in full' : 'received of ' + f2(x.amount); return o; });
    var cardG = s.mo || s.cat ? null : H.sumC(rec);
    var nr2 = H.recs('po').filter(function (r) { return /nothing received/.test(POs[r.i].status) && brOk(r); }), op = H.recs('po').filter(function (r) { return /^open, nothing invoiced/.test(POs[r.i].status) && brOk(r); });
    var jcp = H.recs('po').filter(function (r) { return /^Job Connect/.test(POs[r.i].supplier) && /not invoiced|until invoiced/.test(POs[r.i].status) && brOk(r); });
    var poSt = function (po) { var st = (J.lines || []).filter(function (l) { return (String(l.po).match(/\b\d{7}\b/g) || []).indexOf(po) >= 0; }).map(function (l) { return l.state; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }); return st.length ? ' (' + st.join('; ') + ')' : ''; };   /* the state of the PO's cost line, as on Every cost line */
    R.sum = kpi('Revenue', null, 'a PO is a cost') + kpi('Received, not invoiced', cardG, cardG === null ? 'POs are for the job: choose Job end and All categories' : n(rec.length, 'PO', 'POs') + ', the received part (Coates’ system, 1 Nov)') + noDiff;
    R.ans = 'Received, not invoiced' + (s.br ? ' on ' + s.br : '') + ': ' + BC(H.sumC(rec)) + (rec.length ? ' (' + rec.map(function (r) { return POs[r.i].po + ' ' + BC(r.c) + (r.c !== C(POs[r.i].amount) ? ' of ' + f2(POs[r.i].amount) : ''); }).join(' + ') + ')' : '') + '. Nothing received: ' + (nr2.map(function (r) { return POs[r.i].po + ' ' + BC(r.c); }).join(', ') || 'none') + '. Open POs with nothing invoiced: '
      + (op.map(function (r) { return POs[r.i].po + ' ' + BC(r.c) + poSt(POs[r.i].po); }).join(', ') || 'none') + '. Job Connect POs not yet invoiced: ' + (jcp.map(function (r) { return POs[r.i].po + poSt(POs[r.i].po); }).join(', ') || 'none') + '.';
    /* where it sits at month end: outside the accruals when none of its lines is accrued; this is the PO register only */
    var recL = (J.lines || []).map(function (l, i) { var p = String(l.po).match(/\b\d{7}\b/g) || []; return rec.some(function (r) { return p.indexOf(POs[r.i].po) >= 0; }) ? i : -1; }).filter(function (i) { return i >= 0; });
    var outAcc = recL.length && recL.every(function (i) { return !(J.lines[i].accrue > 0); }), mSt = 'Not accrued: manual accrual candidate';
    var mTo = 0; (J.facts || []).forEach(function (f) { if (J.lines[f[0]].state === mSt && f[2] !== 'Nov') mTo += f[3]; });
    if (outAcc) R.ans = R.ans.replace('. Nothing received: ', ', not in the ' + BC(C(J.accrue)) + ' accruals: a manual accrual candidate. Nothing received: ');
    R.ans += ' This is the PO register only; other costs not yet invoiced are in Accruals (' + BC(C(J.accrue)) + ') and Manual accrual (' + (/^Carriers/.test(((J.lines || []).filter(function (l) { return l.state === mSt; })[0] || {}).supplier || '') ? 'carriers ' : '') + BC(mTo) + ' to 31 Oct).';
    H.CH.push({q: 'Accruals', t: 'Accruals'}, {q: 'Manual accrual', t: 'Manual accrual'});
    G('grni', 'Received, not invoiced', rec, {tot: H.sumC(rec), fold: 'pl1267-fp-pos', unit: 'PO'});
    G('nrec', 'Nothing received', nr2, {tot: H.sumC(nr2), fold: 'pl1267-fp-pos', unit: 'PO'});
    G('open', 'Open POs, nothing invoiced', op, {tot: H.sumC(op), fold: 'pl1267-fp-pos', unit: 'PO'});
    G('jc', 'Job Connect POs not yet invoiced', jcp, {tot: H.sumC(jcp), fold: 'pl1267-fp-pos', unit: 'PO'});
  } else if (v === 'nopo') {
    var NP = J.noPO || [];
    var whole = function (x) { for (var i = 0; i < (J.lines || []).length; i++) if (J.lines[i].supplier === x.supplier && lineTot(i) === C(x.amount)) return i; return -1; };
    var part = function (x) { var w = (String(x.what).match(/w\/e \d{1,2} (Sep|Oct|Nov)/) || [])[0]; if (!w) return -1; for (var i = 0; i < (J.lines || []).length; i++) if (J.lines[i].supplier === x.supplier && String(J.lines[i].what).indexOf(w) >= 0) return i; return -1; };
    var inC = function (x, br, mo) { var i = whole(x); if (i >= 0) return {c: H.catOk(i) ? H.fx(i, br, mo) : 0, how: 'whole line ' + i};
      var k = part(x); if (k >= 0) { var bs = [], ms = []; (J.facts || []).forEach(function (f) { if (f[0] === k && f[3]) { if (bs.indexOf(f[1]) < 0) bs.push(f[1]); if (ms.indexOf(f[2]) < 0) ms.push(f[2]); } });
        if (bs.length === 1 && ms.length === 1) return {c: H.catOk(k) && (!br || br === bs[0]) && (!mo || mo === ms[0]) ? C(x.amount) : 0, how: 'part of line ' + k}; }
      return {c: null, how: 'no split'}; };
    var nrows = H.recs('nopo').map(function (r) { var o = inC(NP[r.i], s.br, s.mo), q = H.recRow(r, o.c, 'not split in the choice'); q.tag = o.how; return q; }).filter(function (r) { return r.c !== 0; });
    var anyNull = nrows.some(function (r) { return r.c === null; }), cardN = anyNull ? null : H.sumC(nrows);
    var bySup = {}, sOrd = []; nrows.forEach(function (r) { var sp = NP[r.i].supplier; if (!(sp in bySup)) { bySup[sp] = 0; sOrd.push(sp); } bySup[sp] += r.c || 0; }); sOrd.sort(function (a, b) { return bySup[b] - bySup[a]; });
    var byBr = {}; BRS.forEach(function (b) { byBr[b] = 0; NP.forEach(function (x) { var o = inC(x, b, s.mo); byBr[b] += o.c || 0; }); });
    var job = !s.br && !s.mo && !s.cat;
    R.sum = kpi('Revenue', null, 'these are costs') + kpi('No PO on the record', cardN, anyNull ? 'a row is not split in the choice' : n(nrows.length, 'row', 'rows') + (job ? ', against ' + f2c(C(PT_.withPO)) + ' on ' + n(PT_.count, 'PO', 'POs') : ' in the choice')) + noDiff;
    R.ans = 'No PO on the record: ' + (cardN === null ? 'no single figure in the choice' : BC(cardN)) + ' in ' + n(nrows.length, 'row', 'rows') + ', against ' + BC(C(PT_.withPO)) + ' on ' + n(PT_.count, 'PO', 'POs') + (job && cardN + C(PT_.withPO) === C(PT_.total) ? ' (together the job cost, ' + BC(C(PT_.total)) + ')' : '') + '. By supplier: ' + sOrd.map(function (sp) { return sp + ' ' + BC(bySup[sp]); }).join(' · ') + '.' + (!s.br ? ' By branch: ' + H.brTxt(byBr) + '.' : '');
    G('nopo', GLAB.nopo, nrows, {tot: cardN, why: 'a row is not split in the choice'});
    G('sup', 'By supplier', sOrd.map(function (sp) { return {t: sp, d: n(nrows.filter(function (r) { return NP[r.i].supplier === sp; }).length, 'row', 'rows'), b: '', c: bySup[sp], fold: 'pl1267-fp-pos'}; }), {tot: cardN, why: 'a row is not split in the choice', fold: 'pl1267-fp-pos', unit: 'supplier'});
  } else if (v === 'ownuse') {
    var oL = lines(function (l) { return /own use/i.test(l.what + ' ' + l.contract); }), cardO = costIn(function (i) { return oL.indexOf(i) >= 0; }), byM = {};
    H.lineFacts(function (i) { return oL.indexOf(i) >= 0 && H.catOk(i); }).forEach(function (f) { byM[f[2]] = (byM[f[2]] || 0) + f[3]; });
    var oPO = []; oL.forEach(function (i) { (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).forEach(function (p) { if (oPO.indexOf(p) < 0) oPO.push(p); }); });
    var opr = H.recs('po').filter(function (r) { return oPO.indexOf(J.purchaseOrders[r.i].po) >= 0 && brOk(r); }).map(function (r) { var o = H.recRow(r); o.tag = String(J.purchaseOrders[r.i].status).split(/[:;]/)[0]; return o; });
    R.sum = kpi('Revenue', null, 'own use: not charged to the V8s') + kpi('Costs', cardO, n(oL.length, 'cost line', 'cost lines') + ' for Coates’ own use') + noDiff;
    var oIn = oL.filter(function (i) { return H.catOk(i) && H.lineIn(i); });
    R.ans = 'Own use, not charged to the V8s: ' + BC(cardO) + (H.choiceTxt ? ' in the choice' : '') + ' on ' + n(oIn.length, 'line', 'lines') + ': ' + opr.map(function (r) { var x = J.purchaseOrders[r.i]; return x.po + ' ' + BC(r.c) + ' (' + x.branch + ', ' + r.tag + ')'; }).join(' · ') + '. By month: ' + (H.moTxt(byM) || 'none') + '.';
    G('po', 'POs on own-use lines' + (s.br ? ' · ' + s.br : '') + (s.mo || s.cat ? ' · whole POs, not by month or category' : ''), opr, {tot: H.sumC(opr)});
    G('line', 'Own-use cost lines', oL.filter(H.catOk).map(function (i) { return H.lineRow(i, H.lineIn(i)); }).filter(function (r) { return r.c; }), {tot: cardO, fold: 'pl1267-fp-lines', unit: 'line'});
    G('open', GLAB.open, H.recs('open').filter(function (r) { return /own use/i.test(J.open[r.i]); }), {tot: null, why: 'as written'});
  } else if (v === 'sold') {
    var sc = (J.contracts || []).filter(function (c) { return /^(Toilet Paper|Scrim)/i.test(c.onIt || ''); }), sinv = (J.invoices || []).filter(function (x) { return sc.some(function (c) { return c.contract === x.contract; }); });
    var bf = sinv.filter(function (x) { return !s.br || x.branch === s.br; }), moOff2 = s.mo && s.mo !== 'Oct', sAll = 0, sb = 0; sinv.forEach(function (x) { sAll += C(x.ex); }); bf.forEach(function (x) { sb += C(x.ex); });
    var cardS = s.cat ? null : moOff2 ? 0 : sb, o10t = (J.open || []).filter(function (t) { return /carry no cost/.test(t); })[0] || '', o10n = H.openNo(/carry no cost/);
    var scrW = (o10t.match(/scrim[^0-9]*?([\d,]+\.\d{2})/i) || [])[1], scrI = 0; sinv.forEach(function (x) { if (sc.some(function (c) { return c.contract === x.contract && /^Scrim/i.test(c.onIt); })) scrI += C(x.ex); });
    var dn = scrW && moneyIn(scrW)[0].c !== scrI ? ' Open item ' + o10n + ' writes ' + scrW + ' for the scrim; the scrim invoices add to ' + f2c(scrI) + ' (both as written; not changed here).' : '';
    R.sum = kpi('Revenue', cardS, s.cat ? 'not split by cost category' : moOff2 ? 'the invoices are dated October' : n(bf.length, 'invoice', 'invoices') + ' for consumables sold') + kpi('Costs', null, 'their stock or purchase cost is not on the record: Finance to confirm') + noDiff;
    R.ans = 'Consumables sold to the V8s: ' + n(sinv.length, 'invoice', 'invoices') + ', ' + BC(sAll) + ': ' + sinv.map(function (x) { return x.inv + ' ' + BC(C(x.ex)) + ' (' + x.branch + ')'; }).join(' · ') + '. They carry no cost in this P&L.' + dn;
    G('inv', GLAB.inv, H.recs('inv').filter(function (r) { return sinv.indexOf(J.invoices[r.i]) >= 0 && brOk(r); }), {tot: sb});
    G('con', GLAB.con, H.recs('con').filter(function (r) { return sc.indexOf(J.contracts[r.i]) >= 0; }), {tot: null, why: 'shown for what is on them'});
    if (o10n) G('open', GLAB.open, H.openRows([o10n]), {tot: null, why: 'as written'});
  } else if (v === 'quotes') {
    var Rq = xQuote(H, null); R.sum = Rq.sum; R.ans = Rq.ans;
  } else if (v === 'receipts') {
    var rr = []; (J.purchaseOrders || []).forEach(function (x, i) { (String(x.status).match(/\b49\d{5}\b/g) || []).forEach(function (r) { var o = H.recRow(H.recs('po')[i]); o.t = 'Receipt ' + r + ' · PO ' + x.po; o.d = x.supplier + ' · ' + x.what + ' · ' + x.status; rr.push(o); }); });
    var rb = rr.filter(brOk), rt = H.sumC(rb), rpos = rr.map(function (r) { return r.av; }), li0 = lines(function (l) { var p = String(l.po).match(/\b\d{7}\b/g) || []; return p.length && p.every(function (x) { return rpos.indexOf(x) >= 0; }); })[0];
    R.sum = kpi('Revenue', null, 'receipts are costs') + kpi('Costs', s.mo || s.cat ? null : rt, s.mo || s.cat ? 'POs are for the job: choose Job end' : n(rb.length, 'receipt', 'receipts') + ', each at its PO’s amount') + noDiff;
    R.ans = n(rr.length, 'receipt', 'receipts') + ' on the record, each on its PO: ' + rr.map(function (r) { return r.t.split(' · ')[0].replace('Receipt ', '') + ' → ' + r.av; }).join(' · ') + '; together ' + BC(H.sumC(rr)) + (li0 !== undefined && lineTot(li0) === H.sumC(rr) ? ', the whole of cost line ' + li0 + ' (' + J.lines[li0].supplier + ')' : '') + '.';
    G('rcpt', 'Receipts', rb, {tot: rt, fold: 'pl1267-fp-pos', unit: 'receipt'});
  } else if (v === 'glall') {
    var gr = (J.byAccount || []).map(function (g) { return {t: g.code + (g.name ? ' · ' + g.name : ''), d: (g.holds || []).map(function (h) { return h.category + ' ' + f2(h.amount); }).join(' · ') + (g.split === false ? ' · not split on the record' : ''), b: '', c: C(g.total), fold: 'pl1267-fp-gl'}; }), gt = H.sumC(gr), ns = (J.byAccount || []).filter(function (g) { return g.split === false; });
    var chG = s.br || s.mo || s.cat;
    R.sum = kpi('Revenue', null, 'the pack has no revenue by GL') + kpi('Costs', chG ? null : gt, chG ? 'by account for the job only' : 'by the account on each cost line') + noDiff;
    R.ans = 'Costs by GL account, from the account on each cost line: ' + gr.map(function (r) { return r.t.split(' · ')[0] + ' ' + BC(r.c); }).join(' · ') + ' = ' + BC(gt) + '.' + (ns.length ? ' Where a line names two accounts with no split on the record (' + ns.map(function (g) { return g.code; }).join('; ') + '), it sits under both codes together.' : '');
    G('gl', 'By GL account', gr, {tot: gt === C((J.costs || {}).total) ? gt : null, why: 'does not add to the job cost', fold: 'pl1267-fp-gl', unit: 'account'});
  } else if (v === 'gst') {
    R.sum = dash3('GST is not held in the pack');
    R.ans = 'Every figure here is ' + (J.basis || 'AUD ex GST') + ' (the pack’s basis). GST is not held in the pack and is not worked out here: the salary allowance and Coates wages carry no GST, so a flat 10% would be wrong.';
  } else if (v === 'budget') {
    var qb = xQuotes(); R.sum = dash3('not in the pack');
    R.ans = 'No budget, tender or quoted job total is in the pack.' + (qb.length ? ' The only quotes held are ' + qb.map(function (q) { return q.q; }).join(', ') + ', in an accrual journal.' : '');
    qb.forEach(function (q) { H.CH.push({q: q.q, t: q.q}); });
  } else if (v === 'paid') {
    R.sum = dash3('payment status is not in the pack');
    var ph1 = lines(function (l) { return /check how they were paid/.test(l.status); }), ph2 = lines(function (l) { return /paid not evidenced/.test(l.status); }), s1 = 0, s2 = 0; ph1.forEach(function (i) { s1 += lineTot(i); }); ph2.forEach(function (i) { s2 += lineTot(i); });
    R.ans = 'Payment status is not in the pack: the ' + n((J.invoices || []).length, 'invoice carries', 'invoices carry') + ' dates and amounts only. On the supplier side the pack says only “check how they were paid” (' + n(ph1.length, 'line', 'lines') + ', ' + BC(s1) + ') and “paid not evidenced” (' + n(ph2.length, 'line', 'lines') + ', ' + BC(s2) + ').';
    G('line', 'Cost lines that say how they were paid', ph1.concat(ph2).map(function (i) { var r = H.lineRow(i, lineTot(i)); r.tag = J.lines[i].status; return r; }), {tot: null, why: 'whole lines, as written', fold: 'pl1267-fp-lines', unit: 'line'});
  } else if (v === 'meta') {
    R.sum = dash3('about the pack');
    R.ans = 'Pack ' + J.pack + ' · record ' + J.record + ' · as at ' + day(J.asAt) + ' · ' + J.basis + ' · from ' + J.source + '.';
  } else if (v === 'cgroup') {
    var gmem = K.grp.members || [], gf = H.lineFacts(function (i) { return gmem.indexOf(J.lines[i].category) >= 0 && H.catOk(i); }), gc = H.sumF(gf), gl = {}, gcat = {}, gb = {};
    gf.forEach(function (f) { gl[f[0]] = 1; var c = J.lines[f[0]].category; gcat[c] = (gcat[c] || 0) + f[3]; gb[f[1]] = (gb[f[1]] || 0) + f[3]; });
    R.note = '“' + String(XS.q).trim() + '” is the group ' + K.grp.name + ': ' + gmem.join(' · ') + ', as in the by-category table.';
    R.sum = kpi('Revenue', null, 'not split by cost category') + kpi('Costs', gc, n(Object.keys(gl).length, 'cost line', 'cost lines') + ' in ' + n(gmem.length, 'category', 'categories')) + kpi('Difference so far', null, 'for the job or a branch, with no category');
    R.out = H.linesTable(gf, e(String(K.grp.name).toUpperCase()));
    R.ans = K.grp.name + ': ' + BC(gc) + ' (' + gmem.filter(function (c) { return gcat[c]; }).map(function (c) { return c + ' ' + BC(gcat[c]); }).join(' · ') + '). By branch: ' + (H.brTxt(gb) || 'none') + '.';
  } else if (v === 'estimate') {   /* the estimates in the costs: lines whose state, status or basis says estimate, and lines a hire contract carries as ESTIMATE */
    var EL = xEstLines(), eI = Object.keys(EL).map(Number).filter(H.catOk).sort(function (a, b) { return a - b; });
    var eF = H.lineFacts(function (i) { return eI.indexOf(i) >= 0; }), ec = H.sumF(eF), eSt = {__nov: 0}, eAcc = 0, eNot = 0;
    eF.forEach(function (f) { var k = H.stKey(f); eSt[k] = (eSt[k] || 0) + f[3]; if (k === H.NOVST && H.stateOf(f[0]) !== H.NOVST) eSt.__nov += f[3]; if (f[2] !== 'Nov' && J.lines[f[0]].accrue > 0) eAcc += f[3]; else if (f[2] !== 'Nov') eNot += f[3]; });
    var erows = eI.map(function (i) { var c = H.lineIn(i); if (!c) return null; var r = H.lineRow(i, c, '', 'whole line'); r.d = 'line ' + i + ' · ' + EL[i] + ' · ' + r.d; return r; }).filter(Boolean);
    var ecc = []; (J.contracts || []).forEach(function (c, ci) { (c.costs || []).forEach(function (y, k) { if (/ESTIMATE/.test(String(y.status))) { var rr = H.recs('cc').filter(function (r) { return r.i === ci * 100 + k; })[0]; if (rr) ecc.push(rr); } }); });
    /* a line shown whole where its hire contract carries only part of it as ESTIMATE */
    var eDig = function (t) { return String(t || '').match(/\b\d{7}\b/g) || []; }, eParts = [];
    (J.contracts || []).forEach(function (c) { (c.costs || []).forEach(function (y) { if (!/ESTIMATE/.test(String(y.status)) || y.amount == null) return; var yp = eDig(y.po), sp = norm(String(y.what).split(':')[0]);
      eI.forEach(function (i) { var l = J.lines[i], hp = yp.length ? eDig(l.po).some(function (p) { return yp.indexOf(p) >= 0; }) : norm(l.supplier).indexOf(sp) === 0;
        var det = String(y.what).split(':').slice(1).join(':').trim(), ref = (det.match(/^[A-Z]{1,4}\d{2,4}\b/) || [])[0];   /* only where the line itself names that part as the estimate (VMS11 estimate) */
        if (hp && ref && new RegExp('\\b' + ref + '\\s+estimat', 'i').test(l.status + ' ' + l.basis) && (!/accrued/i.test(y.status) || l.accrue > 0) && C(y.amount) < lineTot(i)) eParts.push('Line ' + i + ' is shown whole (' + f2c(lineTot(i)) + '): only ' + ref + ', ' + f2c(C(y.amount)) + ', is an estimate (hire contract ' + c.contract + ')'); }); }); });
    R.sum = kpi('Revenue', null, 'estimates are costs') + kpi('Estimates in the costs', ec, n(erows.length, 'cost line', 'cost lines') + ', whole lines' + (H.choiceTxt ? ' in the choice' : '') + ': each until invoiced') + noDiff;
    R.ans = 'Estimates in the costs' + (H.choiceTxt ? ' (' + H.choiceTxt + ')' : '') + ': ' + BC(ec) + ' on ' + n(erows.length, 'cost line', 'cost lines') + ', whole lines (' + erows.map(function (r) { return String(r.d).split(' · ')[0] + ' ' + f2c(r.c); }).join(' · ') + '). By state: ' + (H.stateTxt(eSt) || 'none')
      + '. To 31 Oct, accrued ' + BC(eAcc) + ' and not accrued ' + BC(eNot) + '.' + (eParts.length ? ' ' + eParts.join('; ') + '.' : '') + ' Each stands until invoiced.';
    G('est', 'Cost lines that are estimates', erows, {tot: ec, fold: 'pl1267-fp-lines', unit: 'line', note: 'Each line’s reason: its state, status or basis, or its hire contract’s ESTIMATE.'});
    G('cc', 'Hire contract costs marked ESTIMATE', ecc, {tot: null, why: 'they overlap the lines above'});
    H.CH.push({q: 'Actual vs estimate', t: 'Actual vs estimate'}, {q: 'Accruals', t: 'Accruals'}, {q: 'Pick-ups', t: 'Transport estimate'});
  } else if (v === 'novlab') {   /* November's labour (1-13 Nov), carried in October */
    var nrr = (J.lines || []).map(function (l, i) { return l.state === 'November labour, carried in October (not accrued)' && H.catOk(i) ? H.lineRow(i, H.fx(i, s.br, 'Oct'), '', 'November work, in October') : null; }).filter(function (r) { return r && r.c; });
    var salI = lines(function (l) { return l.category === 'Salary allowance'; })[0], salB2 = salI === undefined ? '' : String(J.lines[salI].branch);
    if (NL.salary && (!s.br || s.br === salB2) && (!s.cat || s.cat === 'Salary allowance')) nrr.push({t: 'Salary allowance, November’s share', d: 'in October (the pack’s month end)', b: salB2, c: C(NL.salary), fold: 'pl1267-fp-lines'});
    var nlc = s.mo && s.mo !== 'Oct' ? null : H.sumC(nrr), jobN = !s.br && !s.cat;
    R.sum = kpi('Revenue', null, 'these are costs') + kpi('November’s labour, in October', nlc, nlc === null ? 'carried in October: choose October or Job end' : jobN ? 'salary ' + f2c(C(NL.salary)) + ' · Job Connect ' + f2c(C(NL.jobConnect)) + (h194 ? ' · and ' + h194 + ' h of Coates wages, not costed' : '') : 'in the choice') + noDiff;
    R.ans = 'November’s labour, 1–13 Nov, is carried in October' + (H.choiceTxt ? ' (' + H.choiceTxt + ')' : '') + ': ' + (nlc === null ? 'none in ' + MOL[s.mo].split(' ')[0] : BC(nlc) + (nrr.length ? ' (' + nrr.map(function (r) { var p = String(r.t).split(' · '); return /^Salary/.test(r.t) ? 'salary ' + f2c(r.c) : p[0].replace(/ \(.*\)$/, '') + ' ' + p.slice(1).join(' ').replace(/^Running sheet /, '') + ' ' + f2c(r.c); }).join(' · ') + ')' : '')) + (jobN && h194 ? ', and ' + h194 + ' h of Coates wages, not costed' : '') + '. It is not in the accruals through 31 Oct, which hold work to 31 Oct: the salary allowance’s November share is allocated through payroll (Allocated (payroll)), and Job Connect’s is November work, for Finance to confirm whether to provision it (open item 11). October without it: ' + BC(C(ME.octWithoutNovLabour)) + ' (the job).';
    G('nov', 'November’s labour in October', nrr, {tot: nlc, why: 'carried in October', fold: 'pl1267-fp-lines', unit: 'line'});
    H.CH.push({q: 'Open items', t: 'Open items'}, {q: '31 Oct', t: '31 Oct'});
  } else if (v === 'acc') {   /* a supplier's or category's accrual: its accrued lines' work to 31 Oct and the journals that hold them */
    var aIs = lines(function (l) { return (K.sup ? l.supplier === K.sup : l.category === K.cat); }).filter(H.catOk), aAcc = aIs.filter(function (i) { return J.lines[i].accrue > 0; });
    var aF2 = H.lineFacts(function (i) { return aAcc.indexOf(i) >= 0; }).filter(function (f) { return f[2] !== 'Nov'; }), aC = s.mo === 'Nov' ? null : H.sumF(aF2), nm2 = K.sup || K.cat;
    var aPO = []; aAcc.forEach(function (i) { (String(J.lines[i].po).match(/\b\d{7}\b/g) || []).forEach(function (p) { aPO.push(p); }); });
    var aKeys = aAcc.map(function (i) { var sp = norm(J.lines[i].supplier), k = Object.keys(SUPKEY).filter(function (w) { return sp.indexOf(w) >= 0; })[0]; return k ? SUPKEY[k] : ''; }).filter(Boolean);
    var aJ = (J.journals || []).map(function (j, i) { var jp = String(j.po).match(/\b\d{7}\b/g) || []; return (jp.some(function (p) { return aPO.indexOf(p) >= 0; }) || aKeys.some(function (k) { return new RegExp('\\b(' + k + ')\\b', 'i').test(j.journal); })) ? i : -1; }).filter(function (i) { return i >= 0; });
    var aJr = aJ.map(function (i) { return H.recs('jn')[i]; }), aJt = H.sumC(aJr);
    var stA = H.byState(function (i) { return aIs.indexOf(i) >= 0; }), mSt2 = 'Not accrued: manual accrual candidate';
    R.note = '“' + String(XS.q).trim() + '” is the accrual of ' + nm2 + (K.cat ? ' (the category)' : '') + '.';
    R.sum = kpi('Revenue', null, 'accruals are costs') + kpi('Accrued, ' + nm2, aC, aC === null ? 'accruals hold work to 31 Oct' : aAcc.length ? n(aAcc.length, 'accrued line', 'accrued lines') + ', work to 31 Oct' + (H.choiceTxt ? ' in the choice' : '') : 'nothing accrued') + noDiff;
    R.ans = nm2 + ': ' + (aAcc.length ? 'accrued ' + BC(aC || 0) + (H.choiceTxt ? ' in the choice' : '') + ' in the ' + BC(C(J.accrue)) + ' accruals, ' + (aJ.length ? 'in ' + n(aJ.length, 'journal', 'journals') + ' (' + aJ.map(function (i) { return 'journal ' + (i + 1) + ' ' + f2c(C(J.journals[i].amount)); }).join(' · ') + (aJ.length > 1 ? ' = ' + f2c(aJt) : '') + ')' : 'with no journal of its own') + '.'
      : 'nothing accrued in the ' + BC(C(J.accrue)) + ' accruals.') + ' Its cost by state: ' + (H.stateTxt(stA) || 'none') + '.' + (stA[mSt2] ? ' ' + BC(stA[mSt2]) + ' is a manual accrual candidate: see Manual accrual.' : '');
    G('acc', 'Accrued cost lines · ' + nm2, aAcc.map(function (i) { var c = 0; aF2.forEach(function (f) { if (f[0] === i) c += f[3]; }); return H.lineRow(i, c, '', 'its accrual'); }).filter(function (r) { return r.c; }), {tot: aC, why: 'accruals hold work to 31 Oct', fold: 'pl1267-fp-lines', unit: 'line'});
    G('jn', GLAB.jn, aJr, {tot: aJt, note: 'As journaled (for the job); a journal can hold other items.'});
    H.CH.push({q: 'Accruals', t: 'All accruals'}, {q: 'Manual accrual', t: 'Manual accrual'});
  } else if (v === 'ref') {
    xRefView(K, s, H, R);
  } else if (v === 'gl') {
    xGlView(K, s, H, R);
  } else if (v === 'week') {
    xWeekView(K, s, H, R);
  } else if (v === 'date') {
    xDateView(K, s, H, R);
  } else if (v === 'range') {
    var inR = function (c) { return c !== null && c !== undefined && (K.li ? c >= K.lo : c > K.lo) && (K.hiI ? c <= K.hi : c < K.hi); }, sums = {}, cnt = [];
    var txt = K.lo > -Infinity && K.hi < Infinity ? 'between ' + f2c(K.lo) + ' and ' + f2c(K.hi) + ', both included' : K.lo > -Infinity ? (K.w || 'over') + ' ' + f2c(K.lo) : (K.w || 'under') + ' ' + f2c(K.hi);
    ['po', 'nopo', 'inv', 'jn', 'leg', 'lc'].forEach(function (g) { var rs = H.recs(g).filter(function (r) { return inR(r.c) && brOk(r); }).sort(function (a, b) { return b.c - a.c; }); sums[g] = H.sumC(rs);
      if (rs.length) cnt.push(lc1(GLAB[g]) + ' ' + rs.length + ' (' + f2c(sums[g]) + ')'); G(g, GLAB[g], rs, {tot: sums[g]}); });
    R.sum = kpi('Revenue', sums.inv, 'invoices ' + txt) + kpi('Costs', sums.po + sums.nopo, 'POs and no-PO rows ' + txt + ': together they cover the job cost once') + noDiff;
    R.ans = 'Own figures ' + txt + (s.br ? ' on ' + s.br : '') + ': ' + (cnt.join(' · ') || 'none') + '. Each group is one register; only the POs and no-PO rows are added together (card 2).';
  } else if (v === 'amount') {
    xAmountView(K, s, H, R);
  } else { R.sum = dash3('nothing to show'); R.ans = ''; }
  return R;
}
function xRefView(K, s, H, R) {   /* a reference: a receipt, quote, docket, asset, open-item number or home branch, answered by the record that owns it */
  var J = DATA, G = H.G, L = K.list, tok = K.tok, has = function (t) { return L.filter(function (r) { return r.type === t; }); }, noDiff = kpi('Difference so far', null, 'for the job or a branch, with no search');
  XT = [{s: tok.toLowerCase(), w: 1}];
  if (has('quote').length) { var Q = xQuote(H, has('quote')[0].q); R.sum = Q.sum; R.ans = Q.ans; return; }
  if (has('home').length) { var code = has('home')[0].code, rows = (J.labourJournal || []).filter(function (x) { return x.home === code; });
    R.sum = kpi('Revenue', null, 'hours, not dollars') + kpi('Costs', null, 'hours, not dollars') + noDiff;
    R.ans = code + ' is a home branch on the labour journals: ' + rows.map(function (x) { return whoName(x) + ' → ' + x.branch + ' ' + B_(hh((C(x.paidSep) + C(x.paidOct)) / 100)) + ' paid h'; }).join(' · ') + '.';
    G('lj', GLAB.lj, rows.map(function (x) { var r = H.recRow(H.recs('lj')[J.labourJournal.indexOf(x)]); return r; }), {hours: true, tot: rows.reduce(function (t, x) { return t + C(x.paidSep) + C(x.paidOct); }, 0) / 100, unit: 'row'}); return; }
  var isA = L.some(function (r) { return r.asset; }) && !/^\d+$/.test(tok);
  var reA = new RegExp('(^|[^A-Za-z0-9])' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(-A)?(?![A-Za-z0-9])', 'i'), others = function (gs, skip) {
    gs.forEach(function (g) { if (skip.indexOf(g) >= 0) return; var rs = H.recs(g).filter(function (r) { return reA.test(r.raw + ' ' + (r.b || '')); }); G(g, GLAB[g] || 'Cost lines', rs, {tot: null, why: 'one reference, many registers: nothing is added', fold: g === 'line' ? 'pl1267-fp-lines' : undefined}); }); };
  var moOf = function (t) { var m = String(t).match(/\b\d{1,2} (Sep|Oct|Nov)\b/) || String(t).match(/^2026-(\d{2})/); return !m ? '' : /^\d/.test(m[1]) ? MON[Number(m[1]) - 1] : m[1]; };
  if (isA) {
    var S7 = (J.schedule17 || {}).changes || [], TE = J.transportEstimate || {};
    var s7 = H.recs('s17').filter(function (r) { var x = S7[r.i]; return reA.test(x.ref + ' ' + x.what) && (!s.br || r.b === s.br) && (!s.mo || moOf(x.date) === s.mo); });
    var lg = H.recs('leg').filter(function (r) { var x = TE.legs[r.i]; return reA.test(String(x.ref).split('/').join(' ')) && (!s.br || r.b === s.br) && (!s.mo || moOf(x.date) === s.mo); });
    var mv = H.recs('mvd').filter(function (r) { var x = TE.moved[r.i]; return reA.test(x.ref) && !s.br && (!s.mo || moOf(x.to) === s.mo); });
    var card = s.cat && !/^Transport$/.test(s.cat) ? null : H.sumC(s7) + H.sumC(lg) + H.sumC(mv);
    var parts = s7.map(function (r) { return 'Schedule 17 ' + S7[r.i].date + ' ' + f2c(r.c); }).concat(lg.map(function (r) { var x = TE.legs[r.i]; return x.kind + ' ' + dayP(x.date) + ' ' + f2c(r.c) + ' (estimate)'; }), mv.map(function (r) { var x = TE.moved[r.i]; return 'moved ' + dayP(x.from) + ' → ' + dayP(x.to) + ' ' + f2c(r.c); }));
    var cons = H.recs('con').filter(function (r) { var c = J.contracts[r.i]; return reA.test(c.onIt + ' ' + (c.costs || []).map(function (y) { return y.what; }).join(' ')); }), ops = H.recs('open').filter(function (r) { return reA.test(r.raw); });
    R.sum = kpi('Revenue', null, 'the contracts that carry it are below') + kpi('Itemised transport', card, 'itemised in the pack: Schedule 17, the estimate legs and moved pick-ups; other loads may sit in the recorded loads, which the pack does not itemise') + noDiff;
    R.ans = tok.toUpperCase() + ': itemised transport ' + (card === null ? '(none in that category)' : BC(card)) + (parts.length ? ' (' + parts.join(' · ') + ')' : ': none itemised') + '.' + (cons.length ? ' On ' + cons.map(function (r) { return J.contracts[r.i].contract; }).join(', ') + '.' : '') + (ops.length ? ' ' + n(ops.length, 'open item names', 'open items name') + ' it.' : '');
    G('s17', GLAB.s17, s7, {tot: H.sumC(s7)}); G('leg', GLAB.leg, lg, {tot: H.sumC(lg)}); G('mvd', GLAB.mvd, mv, {tot: H.sumC(mv)});
    G('notin', GLAB.notin, H.recs('notin').filter(function (r) { return reA.test(r.raw); }), {tot: null, why: 'not in the costs'});
    G('con', GLAB.con, cons, {tot: null, why: 'the revenue side, whole contracts'});
    others(['cc', 'open', 'note', 'line', 'nopo', 'jn', 'bl'], []); return;
  }
  var pri = ['s17', 'leg', 'mvd', 'lc', 'cc', 'line', 'nopo', 'open', 'note'], own = null;
  pri.some(function (t) { var h = has(t); if (h.length) { own = h[0]; return true; } return false; });
  if (own && own.type === 's17') { var x = J.schedule17.changes[own.i];
    R.sum = kpi('Revenue', null, 'a docket is a load') + kpi('Schedule 17 figure', s.mo || s.cat || (s.br && s.br !== x.branch) ? null : C(x.figure), s.br && s.br !== x.branch ? 'this load is on ' + x.branch : s.mo || s.cat ? 'for the load: choose Job end and All categories' : 'Schedule 17, ' + x.row) + noDiff;
    R.ans = 'Docket ' + tok + ': ' + x.ref + ', ' + x.what + ', ' + x.date + ', ' + x.contractDocket + ', ' + x.row + ', Schedule 17 ' + BC(C(x.figure)) + '; on the record before: ' + x.before + '; change ' + B_(sg(C(x.change))) + ', ' + x.branch + '.'; }
  else if (own && own.type === 'leg') { var lgx = J.transportEstimate.legs[own.i];
    R.sum = kpi('Revenue', null, 'a docket is a load') + kpi('Estimate leg', C(lgx.amount), 'the 1 Nov estimate: ' + lgx.rate_source) + noDiff;
    R.ans = 'Docket ' + tok + ' is named by the estimate leg ' + lgx.ref + ' (' + lgx.what + ', ' + lgx.kind + ' ' + dayP(lgx.date) + '): ' + BC(C(lgx.amount)) + ', ESTIMATE.'; }
  else { var src = own ? (own.type === 'open' ? J.open[own.i] : own.type === 'note' ? J.schedule17.notes[own.i] : own.type === 'line' ? J.lines[own.i].contract + ' ' + J.lines[own.i].what : '') : '', cl = clauseOf(src, reTok(tok));
    R.sum = kpi('Revenue', null, 'as written: not added') + kpi('Costs', null, 'as written: not added') + noDiff;
    R.ans = (own ? (own.type === 'open' ? 'Open item ' + (own.i + 1) : own.type === 'note' ? 'Schedule 17 note ' + (own.i + 1) : 'Cost line ' + own.i) : tok) + ': “' + (cl || src).slice(0, 300) + '”'; }
  others(['s17', 'leg', 'mvd', 'lc', 'cc', 'line', 'nopo', 'po', 'jn', 'open', 'note', 'bl', 'con'], []);
}
function xGlView(K, s, H, R) {   /* a GL code: the cost lines coded to it (a part, the whole line, or no split), and the journals' parts on it */
  var J = DATA, G = H.G, code = K.code, br = K.br || s.br, rows = [], unsplit = [], known = 0;
  if (K.br) R.note = '“' + String(XS.q).trim() + '” is GL ' + code + ' on ' + K.br + ': showing that branch' + (s.br && s.br !== K.br ? ' (the Branch choice, ' + s.br + ', is set aside)' : '') + '.';
  (J.lines || []).forEach(function (l, i) { if (!H.catOk(i)) return; var acc = String(l.account || ''), ents = acc.split(' · ');
    var hitE = ents.filter(function (en) { var cs = en.match(/\b[23]\d{3}\b/g) || []; return cs.length && cs[cs.length - 1] === code; })[0]; if (hitE === undefined) return;
    var fig = moneyIn(hitE), bs = [], ms = [];
    (J.facts || []).forEach(function (f) { if (f[0] === i && f[3]) { if (bs.indexOf(f[1]) < 0) bs.push(f[1]); if (ms.indexOf(f[2]) < 0) ms.push(f[2]); } });
    var r = H.lineRow(i, null); r.li = i;
    if (fig.length) { var c = fig[0].c; r.tag = 'its ' + code + ' part'; r.part = c;
      if (br && bs.indexOf(br) < 0) return;
      if (br && bs.length > 1) { r.c = null; r.why = 'a part of a line on ' + bs.join(' and ') + ': not split by branch'; r.over = 'is on ' + bs.join(' and ') + ' and is not split by branch'; }
      else if (s.mo && ms.indexOf(s.mo) < 0) return; else if (s.mo && ms.length > 1) { r.c = null; r.why = 'a part of a line with several months: not split by month'; r.over = 'spans ' + MOS.filter(function (m) { return ms.indexOf(m) >= 0; }).join(' and ') + ' and is not split by month'; } else r.c = c; }
    else if (ents.length === 1) { r.c = H.fx(i, br, s.mo); r.tag = 'whole line'; if (!r.c) return; }
    else { if (!H.fx(i, br, s.mo)) return; r.c = null; r.why = 'coded “' + acc + '” with no split'; unsplit.push(i); }
    if (r.c !== null) known += r.c; rows.push(r); });
  var card = unsplit.length || rows.some(function (r) { return r.c === null; }) ? null : known;
  var ba = (J.byAccount || []).filter(function (g) { return g.code === code; })[0];
  var jr = [], jt = 0; (J.journals || []).forEach(function (j, i) { if (br) { var o = xJSplit(j); if (o[br] === undefined) return; }
    xAcctParts(j).forEach(function (p) { if (p.k === code) { var r = H.recRow(H.recs('jn')[i], p.c); if (p.c !== C(j.amount)) r.tag = 'its ' + code + ' part'; if (br && xJSplit(j)[br] !== C(j.amount)) { r.c = null; r.why = 'the journal is split by branch'; } jr.push(r); if (r.c !== null) jt += r.c; } }); });
  var named = H.recs('jn').filter(function (r) { return reTok(code).test(J.journals[r.i].journal) && !jr.some(function (q) { return q.i === r.i; }); });
  var seg = function (t) { return String(t).split(' · ').filter(function (x) { return reTok(code).test(x); })[0] || ''; };
  R.sum = kpi('Revenue', null, 'the pack has no revenue by GL') + kpi('Costs on ' + code + (br ? ' · ' + br : ''), card, card === null ? (unsplit.length ? 'line' + (unsplit.length > 1 ? 's ' : ' ') + unsplit.join(', ') + ' coded “' + J.lines[unsplit[0]].account + '” with no split' + (known ? '; the parts the pack splits add to ' + f2c(known) : '') : 'a part is not split in the choice') : n(rows.length, 'cost line', 'cost lines') + ' coded ' + code + (ba && !br && !s.mo && !s.cat && C(ba.total) === card ? ', as in Costs by GL account' : '')) + kpi('Difference so far', null, 'for the job or a branch, with no search');
  /* no single figure: say why, from the lines themselves (coded with two accounts and no split, or a part that spans months or branches) */
  var over = rows.filter(function (r) { return r.c === null && r.over; }), restT = known ? '; the rest, split by the pack, add to ' + BC(known) : '';
  var whyNo = unsplit.length ? n(unsplit.length, 'line is', 'lines are') + ' coded “' + J.lines[unsplit[0]].account + '” with no split (' + unsplit.map(function (i) { return 'line ' + i; }).join(', ') + ', ' + BC(unsplit.reduce(function (t, i) { return t + H.fx(i, br, s.mo); }, 0)) + ')'
    + (over.length ? '; ' : '') : '';
  whyNo += over.map(function (r) { return 'line ' + r.li + '’s ' + code + ' part, ' + BC(r.part) + ', ' + r.over; }).join('; ');
  var cf = xConfirm().filter(function (x) { return x.a === code || x.b === code; });
  R.ans = 'GL ' + code + (br ? ' on ' + br : '') + ': ' + (card !== null ? BC(card) + ' on ' + n(rows.length, 'cost line', 'cost lines') : 'no single figure in the choice: ' + whyNo + restT) + '.'
    + (jr.length ? ' Accrual journals on ' + code + (br ? ' on ' + br : '') + ': ' + BC(jt) + (s.cat ? ' (for the job, all categories: a journal is not split by category; not added to the cost)' : ' (the accruals on ' + code + ', not added to the cost)') + '.' : '') + (named.length ? ' ' + named.map(function (r) { return 'Journal ' + (r.i + 1) + ' names ' + code + (br || s.cat ? ' (for the job)' : '') + ': “' + seg(J.journals[r.i].journal).slice(0, 160) + '”'; }).join(' ') + '.' : '')
    + cf.map(function (x) { var onA = 0, onB = 0; (J.journals || []).forEach(function (j) { xAcctParts(j).forEach(function (p) { if (p.k === x.a) onA += p.c; if (p.k === x.b) onB += p.c; }); });
      return ' To confirm: ' + x.q + ' ' + BC(x.c) + ' (' + x.what + ', journal ' + (x.i + 1) + ') is on ' + x.a + ', marked “Finance to confirm ' + x.a + ' or ' + x.b + '”; on ' + x.b + ' the accruals would be ' + BC(onB + x.c) + ' and on ' + x.a + ' ' + BC(onA - x.c) + (br || s.cat ? ' (for the job)' : '') + '.'; }).join('');
  G('line', 'Cost lines on ' + code, rows, {tot: card, why: 'a line has no split', fold: 'pl1267-fp-lines', unit: 'line'});
  G('jn', 'Accrual journals on ' + code + (s.cat ? ' · for the job, all categories' : ''), jr, {tot: jr.some(function (r) { return r.c === null; }) ? null : jt, why: 'a journal is split by branch'});
  G('jnx', 'Journals that name ' + code, named, {tot: null, why: 'named in the text', fold: 'pl1267-fp-journals'});
  if (ba) G('gl', 'In Costs by GL account', [{t: ba.code + (ba.name ? ' · ' + ba.name : ''), d: (ba.holds || []).map(function (h) { return h.category + ' ' + f2(h.amount); }).join(' · '), b: '', c: C(ba.total), fold: 'pl1267-fp-gl'}], {tot: null, why: 'for the job, all branches', fold: 'pl1267-fp-gl', unit: 'row'});
}
function xWeekView(K, s, H, R) {   /* a labour hire week: its bridge row, its cost line, its POs, and what else names the week */
  var J = DATA, G = H.G, wk = 'w/e ' + K.d + ' ' + K.m, BR = J.labourHireBridge || [], b = BR.filter(function (x) { return x.week === wk; })[0], noDiff = kpi('Difference so far', null, 'for the job or a branch, with no search');
  XT = [{s: wk.toLowerCase(), w: 1}];
  if (!b) { R.sum = kpi('Revenue', null, 'labour hire is a cost') + kpi('Costs', null, 'no labour hire week ends then') + noDiff;
    R.ans = 'No labour hire week ends ' + K.d + ' ' + K.m + (BR.length ? '; the weeks run ' + BR[0].week + ' to ' + BR[BR.length - 1].week : '') + '.'; BR.forEach(function (x) { H.CH.push({q: x.week, t: x.week}); }); return; }
  var li = (J.lines || []).map(function (l, i) { return l.what === 'Running sheet ' + wk ? i : -1; }).filter(function (i) { return i >= 0; })[0];
  var card = li === undefined ? null : H.catOk(li) ? H.lineIn(li) : 0, mvd = li !== undefined && s.br && H.lineFacts(function (i) { return i === li; }).some(function (f) { return f[4]; });
  var pos = String(b.po).match(/\b\d{7}\b/g) || [], pr = H.recs('po').filter(function (r) { return pos.indexOf(J.purchaseOrders[r.i].po) >= 0; });
  var doy = function (d, m) { return d + (m === 'Sep' ? 0 : m === 'Oct' ? 30 : 61); }, end = doy(K.d, K.m);
  var mv = H.recs('mv').filter(function (r) { var m, re = /\b(\d{1,2}) (Sep|Oct|Nov)\b/g, ok = false; while ((m = re.exec(J.moves[r.i].journal))) { var x = doy(+m[1], m[2]); if (x <= end && x > end - 7) ok = true; } return ok; });
  var np = H.recs('nopo').filter(function (r) { return J.noPO[r.i].what.indexOf(wk) >= 0; }), whoNP = function (r) { return String(J.noPO[r.i].what).split(',')[0].replace(/^(\S+) .*$/, '$1'); };
  var full = card !== null && card === C(b.cost) && !s.br && !s.mo && !s.cat, wks = C(b.cost), parts = pr.length + np.length, addUp = H.sumC(pr) + H.sumC(np) === wks;
  var mvA = mv.reduce(function (t, r) { return t + C(J.moves[r.i].amount); }, 0), lineAll = li === undefined ? 0 : C(J.lines[li].sep) + C(J.lines[li].oct) + C(J.lines[li].nov);
  var where = [s.br ? 'on ' + s.br : '', s.mo ? 'in ' + MOL[s.mo].split(' ')[0] : '', s.cat ? 'in ' + s.cat : ''].filter(Boolean).join(', ');
  R.sum = kpi('Revenue', null, 'labour hire is a cost') + kpi('Labour hire, ' + wk, card, (mvd ? 'with the branch move · ' : '') + (full || card === null ? 'the week’s cost line' + (pos.length ? ': POs ' + pos.join(' and ') : '') : 'its part ' + (where || 'in the choice') + ' of the week’s ' + f2c(wks))) + noDiff;
  /* the POs and no-PO rows only beside the whole week; a part is said as a part */
  var brk = full && parts ? ' (' + pr.map(function (r) { return J.purchaseOrders[r.i].po + ' ' + BC(r.c); }).concat(np.map(function (r) { return 'no PO (' + whoNP(r) + ') ' + BC(r.c); })).join(' + ') + (addUp && parts > 1 ? ' = ' + BC(wks) : '') + ')' : '';
  var partT = !full && card !== null ? ' ' + (where || 'in the choice') + (mvd && mvA ? ' (' + (card < lineAll ? 'after' : 'from') + ' the ' + f2c(mvA) + ' branch move)' : '') + ', its part of the week’s ' + BC(wks) : '';
  R.ans = wk + ': ' + (card === null ? 'no cost line' : BC(card)) + brk + partT + '; running sheet ' + BC(C(b.runningSheet)) + ', costs ' + BC(wks) + ', difference ' + BC(C(b.difference)) + '; ' + b.invoice + '.'
    + (mv.length ? ' Branch move: ' + mv.map(function (r) { return String(J.moves[r.i].journal).replace(/^Branch move · /, '') + ', ' + f2(J.moves[r.i].amount); }).join('; ') + '.' : '');
  G('lh', GLAB.lh, H.recs('lh').filter(function (r) { return BR[r.i].week === wk; }), {tot: wks, unit: 'week'});
  G('po', GLAB.po, pr, {tot: H.sumC(pr), note: addUp ? (np.length ? 'The POs and the no-PO rows add to the week’s cost.' : 'The POs add to the week’s cost.') : 'The POs' + (np.length ? ' and the no-PO rows' : '') + ' and the week’s cost differ: the week stays at its basis.'});
  G('nopo', GLAB.nopo, np, {tot: null, why: 'whole rows'});
  G('mv', GLAB.mv, mv, {tot: null, why: 'moves net to nil'});
  G('jn', GLAB.jn, H.naming('jn', wk), {tot: null, why: 'the journal may hold other weeks'});
  G('open', GLAB.open, H.naming('open', wk), {tot: null, why: 'as written'});
}
function xDateView(K, s, H, R) {   /* a date: what is dated that day, then what covers it in its text */
  var J = DATA, G = H.G, d = K.d, m = K.m, ds = d + ' ' + m, mm = {Sep: '09', Oct: '10', Nov: '11'}[m], dd = (d < 10 ? '0' : '') + d, iso = '2026-' + mm + '-' + dd, sl = dd + '/' + mm + '/2026';
  var brOk = function (r) { return !s.br || r.b === s.br; }, noDiff = kpi('Difference so far', null, 'for the job or a branch, with no search');
  XT = [{s: ds.toLowerCase(), w: 1, n: 1}];
  var iv = H.recs('inv').filter(function (r) { return J.invoices[r.i].date === sl && brOk(r); }), lg = H.recs('leg').filter(function (r) { return J.transportEstimate.legs[r.i].date === iso && brOk(r); });
  var s7 = H.recs('s17').filter(function (r) { return J.schedule17.changes[r.i].date === ds && brOk(r); }), mv = H.recs('mvd').filter(function (r) { var x = J.transportEstimate.moved[r.i]; return x.from === iso || x.to === iso; });
  var exact = [].concat(iv, lg, s7, mv);
  var doy = function (x, mo) { return x + (mo === 'Sep' ? 0 : mo === 'Oct' ? 30 : 61); }, D0 = doy(d, m);
  var covers = function (t) { t = String(t); var spans = [], best = null, mt, re;
    re = /(\d{1,2})(?:\s+(Sep|Oct|Nov))?(?:\s+\d{2}:\d{2})?\s*(?:–|-|\bto\b)\s*(\d{1,2})\s+(Sep|Oct|Nov)\b/g;
    while ((mt = re.exec(t))) { var a = doy(+mt[1], mt[2] || mt[4]), b = doy(+mt[3], mt[4]); spans.push([mt.index, mt.index + mt[0].length]); if (a <= D0 && D0 <= b && (best === null || b - a < best)) best = b - a; }
    re = /w\/e (\d{1,2}) (Sep|Oct|Nov)/g; while ((mt = re.exec(t))) { var e2 = doy(+mt[1], mt[2]); spans.push([mt.index, mt.index + mt[0].length]); if (e2 - 6 <= D0 && D0 <= e2 && (best === null || 6 < best)) best = 6; }
    re = /\b(\d{1,2})\s+(Sep|Oct|Nov)\b/g; while ((mt = re.exec(t))) { var at = mt.index; if (spans.some(function (sp) { return at >= sp[0] && at < sp[1]; })) continue; if (doy(+mt[1], mt[2]) === D0) best = 0; }
    return best; };
  var txt = [], cnt = {};
  ['line', 'po', 'nopo', 'jn', 'mv', 'open', 'cc', 'lh', 'note'].forEach(function (g) { H.recs(g).forEach(function (r) { if (exact.indexOf(r) >= 0 || (s.br && r.b && String(r.b).indexOf(s.br) < 0)) return; var w = covers(r.raw); if (w !== null) txt.push({r: r, w: w}); }); });
  txt.sort(function (a, b) { return a.w - b.w; });
  var c1 = s.cat ? null : H.sumC(iv);
  R.sum = kpi('Revenue', c1, s.cat ? 'not split by cost category' : iv.length ? n(iv.length, 'invoice', 'invoices') + ' dated ' + ds : 'no invoice is dated ' + ds) + kpi('Costs', null, 'costs are by month in the pack; the dated legs are below') + noDiff;
  var ex = []; if (iv.length) ex.push(n(iv.length, 'invoice', 'invoices') + ' ' + BC(H.sumC(iv))); if (lg.length) ex.push(n(lg.length, 'estimate leg', 'estimate legs') + ' ' + BC(H.sumC(lg))); if (s7.length) ex.push(n(s7.length, 'Schedule 17 change', 'Schedule 17 changes') + ' ' + BC(H.sumC(s7))); if (mv.length) ex.push(mv.map(function (r) { return J.transportEstimate.moved[r.i].ref + ' moved ' + (J.transportEstimate.moved[r.i].from === iso ? 'from' : 'to') + ' ' + ds + ' (' + f2c(r.c) + ')'; }).join(', '));
  txt.forEach(function (x) { var g = x.r.g; cnt[g] = (cnt[g] || 0) + 1; });
  R.ans = (ex.length ? 'Dated ' + ds + ': ' + ex.join(' · ') + '.' : 'Nothing is dated ' + ds + ' itself.') + ' ' + n(txt.length, 'more covers', 'more cover') + ' ' + ds + ' in their text' + (txt.length ? ': ' + Object.keys(cnt).map(function (g) { return lc1(GLAB[g] || g) + ' ' + cnt[g]; }).join(' · ') : '') + '.';
  G('inv', GLAB.inv, iv, {tot: H.sumC(iv)}); G('leg', GLAB.leg, lg, {tot: H.sumC(lg)}); G('s17', GLAB.s17, s7, {tot: H.sumC(s7)}); G('mvd', GLAB.mvd, mv, {tot: null, why: 'moved pick-ups'});
  var byG = {}; txt.forEach(function (x) { (byG[x.r.g] = byG[x.r.g] || []).push(H.recRow(x.r)); });
  Object.keys(byG).forEach(function (g) { byG[g].forEach(function (r) { r.tag = 'written in the text'; }); G(g + 'x', (GLAB[g] || g) + ' · in the text', byG[g], {tot: null, why: 'found in the text: not added', fold: GFOLD[g]}); });
}
function xAmountView(K, s, H, R) {   /* a figure: where it is an item's own figure, and where it is only written */
  var J = DATA, G = H.G, A = K.am, v = K.v, noDiff = kpi('Difference so far', null, 'for the job or a branch, with no search');
  XT = hlFig(v);
  var byG = {}, ordG = [];
  A.own.forEach(function (o) { var g = o.r.g; if (!byG[g]) { byG[g] = []; ordG.push(g); } var r = H.recRow(o.r); r.tag = 'own figure: ' + o.f.join(', '); if (g === 'tot') { r.fold = ''; r.c = v; } if (r.c === null && g !== 'lj') r.c = v; byG[g].push(r); });
  ordG.forEach(function (g) { G(g, g === 'tot' ? 'Pack totals' : GLAB[g] || 'Cost lines', byG[g], {tot: null, why: 'an amount search adds nothing up', fold: g === 'tot' ? '' : g === 'line' ? 'pl1267-fp-lines' : undefined}); });
  var fre = new RegExp('(^|[^0-9,.])(' + f2c(Math.abs(v)).replace(/[.,]/g, '\\$&') + '|' + (Math.abs(v) / 100).toFixed(2).replace('.', '\\.') + ')(?![0-9])');
  var tg = {}, tOrd = []; A.txt.forEach(function (r) { var g = r.g; if (!tg[g]) { tg[g] = []; tOrd.push(g); } var o = H.recRow(r); o.tag = 'written in the text'; var cl = clauseOf(r.d || r.raw, fre); if (cl) o.d = cl; tg[g].push(o); });
  tOrd.forEach(function (g) { G(g + 'x', (GLAB[g] || 'Cost lines') + ' · written in the text', tg[g], {tot: null, why: 'written in the text: not added', fold: g === 'line' ? 'pl1267-fp-lines' : GFOLD[g]}); });
  var one = A.own.filter(function (o) { return (o.r.g === 'po' && o.f.indexOf('PO amount') >= 0) || (o.r.g === 'nopo' && o.f.indexOf('amount') >= 0) || (o.r.g === 'jn' && o.f.indexOf('journal amount') >= 0); });
  if (one.length !== 1) { one = A.own.filter(function (o) { return o.r.g === 'line' && (o.f.indexOf('line total') >= 0 || o.f.indexOf('accrual') >= 0); }); }
  var card = one.length === 1 ? v : null, nPl = A.own.length + A.txt.length;
  R.sum = kpi('Revenue', null, 'an amount search') + kpi('Costs', card, card !== null ? 'the own figure of ' + one[0].r.t.split(' · ')[0] + (one[0].r.g === 'line' ? ' (cost line ' + one[0].r.i + ')' : '') : 'found in ' + n(nPl, 'place', 'places') + ': an amount search adds nothing up') + noDiff;
  var nm1 = function (r) { return r.g === 'line' ? 'line ' + r.i : r.g === 'tot' ? r.t : r.g === 'open' ? 'open item ' + (r.i + 1) : String(r.t).split(' · ')[0].split(':')[0].slice(0, 40); };
  var cn = ordG.map(function (g) { return (g === 'tot' ? 'pack totals' : lc1(GLAB[g] || 'cost lines')) + ' ' + byG[g].length + ' (' + byG[g].slice(0, 3).map(nm1).join(', ') + (byG[g].length > 3 ? ', …' : '') + ')'; });
  R.ans = A.own.length ? f2c(v) + ' is the own figure of ' + n(A.own.length, 'item', 'items') + ': ' + cn.join(' · ') + '.' + (A.txt.length ? ' It is also written in ' + A.txt.length + ' more.' : '')
    : f2c(v) + ' is not the own figure of any item; it is written in ' + n(A.txt.length, 'place', 'places') + (A.txt.length ? ': “' + (clauseOf(A.txt[0].d || A.txt[0].raw, fre) || A.txt[0].t).slice(0, 220) + '”' : '') + '.';
}
function xBind() {
  var box = D.getElementById('plx'); if (!box || box.__plx) return; box.__plx = true;
  var ids = {cat: 'plx-cat', br: 'plx-br', mo: 'plx-mo', q: 'plx-q'};
  Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = XS[k]; });
  var read = function () { ['cat', 'br', 'mo'].forEach(function (k) { var el = D.getElementById(ids[k]); XS[k] = el ? el.value : ''; }); xRender(); };
  ['plx-cat', 'plx-br', 'plx-mo'].forEach(function (id) { var el = D.getElementById(id); if (el) el.onchange = read; });
  var q = D.getElementById('plx-q'), tq = 0;
  if (!XPOINTER) {   /* an intentional click away cancels a pending redraw restoration */
    D.addEventListener('pointerdown', function (ev) { if (ev.target !== D.getElementById('plx-q')) { XS.f = 0; XFOCUS++; } }, true);
    XPOINTER = true;
  }
  if (!XKEY) {   /* '/' (with no field focused) or Ctrl or Cmd+K goes to this search while the Costs tab is on (ahead of the page's own '/', which stays on the other tabs) */
    var onKey = function (ev) {
      var pane = D.getElementById('pane-costs'), qi = D.getElementById('plx-q'); if (!pane || !qi || !pane.classList.contains('on')) return;
      var a = D.activeElement, tag = a && a.tagName ? a.tagName.toLowerCase() : '', typing = tag === 'input' || tag === 'select' || tag === 'textarea' || (a && a.isContentEditable);
      if ((ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) || ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'k' || ev.key === 'K'))) {
        if (ev.preventDefault) ev.preventDefault(); if (ev.stopPropagation) ev.stopPropagation(); try { qi.focus(); if (qi.select) qi.select(); } catch (er) {} }
    };
    if (W && W.addEventListener) W.addEventListener('keydown', onKey, true); else D.addEventListener('keydown', onKey);
    XKEY = true;
  }
  if (q) {   /* keep the query now; debounce only the figures, never typing or selection */
    var remember = function () { XSELECTION = {value: q.value, start: q.selectionStart, end: q.selectionEnd, direction: q.selectionDirection}; };
    var restore = function (field, selection) { try { field.focus({preventScroll: true}); if (selection && selection.value === field.value) field.setSelectionRange(selection.start, selection.end, selection.direction); } catch (er) {} };
    q.oninput = function () { XS.q = q.value; remember(); clearTimeout(tq); tq = setTimeout(xRender, 120); };
    q.onkeydown = function (ev) {   /* Enter draws at once; Escape clears the search */
      if (!ev) return;
      if (ev.key === 'Enter') { clearTimeout(tq); XS.q = q.value; xRender(); if (ev.preventDefault) ev.preventDefault(); }
      else if (ev.key === 'Escape' && q.value) { clearTimeout(tq); q.value = ''; XS.q = ''; remember(); xRender(); if (ev.preventDefault) ev.preventDefault(); }
    };
    q.onselect = q.onkeyup = q.onclick = remember;
    q.onfocus = function () { XS.f = 1; XFOCUS++; };
    q.onblur = function (ev) {
      var hadFocus = XS.f; remember(); var selection = XSELECTION, ticket = ++XFOCUS; XS.f = 0;
      if (!hadFocus || (ev && ev.relatedTarget)) return;
      /* The page blurs the still-connected old input before replacing it. Recheck after that synchronous redraw.
         Only a replaced field on the same active tab qualifies; another control or a deliberate click wins. */
      setTimeout(function () {
        var current = D.getElementById('plx-q'), pane = D.getElementById('pane-costs'), active = D.activeElement;
        if (ticket !== XFOCUS || q.isConnected || !current || current === q || !current.isConnected || !pane || !pane.classList.contains('on')) return;
        if (active && active !== D.body && active !== current) return;
        if (D.hasFocus && !D.hasFocus()) return;
        if (current.value !== selection.value || XS.q !== selection.value) return;
        restore(current, selection);
      }, 0);
    };
    if (XS.f) { var pane = D.getElementById('pane-costs'); if (pane && pane.classList.contains('on')) restore(q, XSELECTION); else XS.f = 0; }
  }
  var c = D.getElementById('plx-clear'); if (c) c.onclick = function () { XS = {cat: '', br: '', mo: '', q: '', f: 0}; Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = ''; }); xRender(); };
  box.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var b = t.closest('.plx-pick'); if (b) { XS.cat = b.getAttribute('data-cat') || ''; var el = D.getElementById('plx-cat'); if (el) el.value = XS.cat; xRender(); if (el) try { el.focus(); } catch (er) {} return; }
    var g = t.closest('.plx-go'); if (g) { XS.q = g.getAttribute('data-q') || ''; var qi = D.getElementById('plx-q'); if (qi) qi.value = XS.q; xRender(); if (qi) try { qi.focus(); } catch (er) {} return; }
    var o = t.closest('.plx-open'); if (o) { xJump(o.getAttribute('data-fold'), o.getAttribute('data-at'), o.getAttribute('data-av')); return; }
    var j = t.closest('.plx-jump'); if (j) { var sec = D.getElementById('plx-g-' + j.getAttribute('data-g')); if (sec) try { sec.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (er) { sec.scrollIntoView(); } return; }
    if (t.closest('.plx-csv')) { xExport(); return; }
    var cp = t.closest('.plx-copy'); if (cp) xCopy(cp);
  });
  xRender();
}
/* a row link: open the fold, find the row by an attribute it already has (else the fold), bring it to the middle, flash it */
function xJump(fold, at, av) {
  var f = fold ? D.getElementById(fold) : null; if (!f) return;
  if (f.tagName === 'DETAILS') f.open = true;
  var row = null;
  if (at && av != null && /^data-(po|inv|c|who|b)$/.test(at)) { var all = f.querySelectorAll('[' + at + ']'); for (var i = 0; i < all.length; i++) if (all[i].getAttribute(at) === av) { row = all[i]; break; } }
  var el = row || f;
  try { el.scrollIntoView({block: row ? 'center' : 'start', behavior: 'smooth'}); } catch (er) { el.scrollIntoView(); }
  if (row) { row.classList.add('plx-flash'); setTimeout(function () { row.classList.remove('plx-flash'); }, 2000); }
}
function xRows() {   /* the last result as rows of cells: the header lines, the cards, then one row per record */
  var L = XLAST; if (!L) return [];
  var amt = function (c) { return c === null || c === undefined ? '' : (c < 0 ? '-' : '') + (Math.abs(c) / 100).toFixed(2); };
  var kc = function (v) { if (v === null) return ''; var t = String(v).replace(/,/g, '').replace(/−/g, '-'); return /^-?\d+(\.\d+)?$/.test(t) ? t : v; };
  var r = [['Find in the P&L', L.q], ['Choices', L.choices], ['As at', day(DATA.asAt)], ['Basis', DATA.basis || 'AUD ex GST'], ['Pack', (DATA.pack || '') + ' · record ' + (DATA.record || '')], ['Answer', L.ans]];
  L.kpis.forEach(function (k) { r.push([k.label, kc(k.v), k.why]); });
  r.push(['Group', 'Item', 'Detail', 'Branch', 'Figure', 'Basis', 'Note']);
  L.rows.forEach(function (x) { r.push([x.group, x.item, x.detail, x.branch, x.h != null ? String(x.h) : amt(x.c), x.basis, x.note]); });
  /* a text cell that a spreadsheet would read as a formula (= + - @, tab or return first) gets an apostrophe; plain numbers stay numbers */
  var safe = function (c) { var t = String(c == null ? '' : c); return /^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t) ? "'" + t : t; };
  return r.map(function (row) { return row.map(safe); });
}
function xExport() {
  var r = xRows(); if (!r.length) return;
  var csv = '﻿' + r.map(function (row) { return row.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n') + '\r\n';
  var name = 'GC500 find - ' + (String(XLAST.q || 'choices').replace(/[^A-Za-z0-9 ._-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'search') + ' - as at ' + (DATA.asAt || '') + '.csv';
  try { var blob = new Blob([csv], {type: 'text/csv;charset=utf-8'}), url = URL.createObjectURL(blob), a = D.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; D.body.appendChild(a); a.click();
    setTimeout(function () { try { URL.revokeObjectURL(url); a.remove(); } catch (er) {} }, 1000); } catch (er) { try { console.warn('PLX: export', er); } catch (_) {} }
}
function xCopy(btn) {
  var txt = xRows().map(function (row) { return row.map(function (c) { return String(c == null ? '' : c).replace(/[\t\r\n]+/g, ' '); }).join('\t'); }).join('\n');
  var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 2000); };
  var fallback = function () { try { var ta = D.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0'; D.body.appendChild(ta); ta.select(); D.execCommand('copy'); ta.remove(); done(); } catch (er) {} };
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback(); } catch (er) { fallback(); }
}
