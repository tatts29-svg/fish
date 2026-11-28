"""Execute the gauge builders in actual generated client-report HTML."""
from pathlib import Path
import shutil
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_showcase import render


@unittest.skipUnless(shutil.which("node"), "Node.js required for client-side gauge checks")
class HorizontalGaugeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = render({}, {})
        start = cls.page.index('function horizontalStreams(')
        end = cls.page.index('const stats=', start)
        fraction = cls.page.split('function measuredFraction(', 1)[1].split('\n}', 1)[0]
        digits = cls.page[cls.page.index("function gaugeDigits("):cls.page.index("const esc=")]
        cls.builders = digits + 'function measuredFraction(' + fraction + '\n}\n' + cls.page[start:end]
        cls.env = """
const assert=require('node:assert/strict');
const fmt=n=>n.toLocaleString('en-AU'), f1=fmt, esc=String, STATIC=false;
const target={innerHTML:'',classList:{add(){}}};
const fills=html=>[...html.matchAll(/class="(fb|fl)" style="--w:([0-9.e+-]+)%"/g)].map(x=>[x[1],Number(x[2])]);
"""

    def run_js(self, body):
        result = subprocess.run([shutil.which("node")], text=True, input=self.env+self.builders+body,
                                capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_company_is_a_share_of_all_items_and_remains_clickable(self):
        self.run_js("""
companyBars(target,[{name:'Crew A',n:6},{name:'Crew B',n:4}],10);
assert.deepEqual(fills(target.innerHTML),[['fl',60],['fl',40]]);
assert.ok(target.innerHTML.includes('data-open="co:Crew A"')&&target.innerHTML.includes('of 10'));
""")

    def test_per_type_fleet_and_observed_peak(self):
        self.run_js("""
function row(on,site,best){return toolHoldingRow({name:'Pump',on,site,best},'pump',true)}
bars(target,[row(1,4,8),row(2,10,null),row(0,20,0),row(4,2,1)]);
assert.deepEqual(fills(target.innerHTML),[['fb',100],['fl',25],['fl',20],['fb',0],['fl',0],['fb',50]]);
for(const label of ['peak 8 (above current fleet)','peak unavailable','peak 0','verify fleet count','data-open="t:pump"']){
  assert.ok(target.innerHTML.includes(label)||target.innerHTML.replace(/<[^>]+>/g,'').includes(label),label)
}
bars(target,[row(0,0,null),row(0,null,null)]);
assert.deepEqual(fills(target.innerHTML),[]);
assert.ok(target.innerHTML.includes('no current fleet')&&target.innerHTML.includes('fleet size unavailable'));
""")

    def test_measured_width_extremes_and_reference_marks(self):
        self.run_js("""
assert.equal(horizontalPercent(0,100),0);
assert.equal(horizontalPercent(1,30000),100/30000);
assert.equal(horizontalPercent(999999,1000000),99.9999);
assert.equal(horizontalPercent(100,100),100);
assert.equal(horizontalPercent(101,100),100);
for(const v of [null,-1,'3',NaN,Infinity])assert.equal(horizontalPercent(v,4),null);
for(const d of [null,0,-1,NaN])assert.equal(horizontalFill('fl',1,d),'');
assert.ok(!horizontalFill('fl',0,10).includes('tube-stream'));
assert.ok(horizontalFill('fl',1,10).includes('tube-stream'));
assert.ok(markedGauge(50,150,100).includes('calc(100% - 2px)'));
assert.ok(!markedGauge(1,1,0).includes('class="tick"'));
""")

    def test_ranked_counts_explain_the_scale_and_empty_pulls(self):
        self.run_js("""
bars(target,[{name:'A',n:5.5},{name:'B',n:2.75}],{dec:1,rankUnit:'units per shift day'});
assert.ok(target.innerHTML.includes('5.5 units per shift day'));
assert.deepEqual(fills(target.innerHTML),[['fl',100],['fl',50]]);
bars(target,[],{max:0}); assert.ok(target.innerHTML.includes('Nothing to show'));
""")

    def test_catalogues_use_the_total_and_preserve_empty_data(self):
        browser = self.page.split('function catalogueQuantity(', 1)[1].split('function initQrGrid', 1)[0]
        self.run_js('function catalogueQuantity(' + browser + """
const panel={innerHTML:''}, $=()=>panel, $$=()=>[], plural=(n,s)=>n+' '+s+(n===1?'':'s');
const D={cat:{cons:[{name:'A',n:4,kinds:[]},{name:'B',n:12,kinds:[]}],tools:[]}};
browser(target,'cons');
assert.ok(target.innerHTML.includes('Share of 16 units'));
assert.ok(target.innerHTML.includes('--w:25%')&&target.innerHTML.includes('--w:75%'));
assert.ok(panel.innerHTML.includes('<h4>A</h4>'));
browser(target,'tools');assert.ok(target.innerHTML.includes('No categories'));
D.cat.cons.forEach(c=>{c.n=0}); browser(target,'cons');
assert.ok(!target.innerHTML.includes('NaN'));assert.ok(!target.innerHTML.includes('tube-stream'));
D.cat.cons[0].unknown=2;D.cat.cons[0].n=4;
browser(target,'cons');assert.ok(target.innerHTML.includes('4 confirmed · 2 lines pending'));
assert.ok(!target.innerHTML.includes('--w:')&&target.innerHTML.includes('all stock balances are known'));
assert.equal(catalogueQuantity({n:0,unknown:1},'units'),'Quantity unknown · 1 line pending');
""")

    def test_main_report_routes_use_the_measured_series(self):
        for entry in [
            "companyBars($('#cos'),C,K.on)",
            "companyBars($('#oh-cos'),D.companies,K.on)",
            "kinds.slice(6).map(([k,t])=>toolHoldingRow(t,k))",
            "return toolHoldingRow(t,D.tools[k]?k:null,true)",
            "bars($('#cn-draws'),src[k](),{max:dr.units})",
        ]:
            with self.subTest(entry=entry):
                self.assertIn(entry, self.page)
