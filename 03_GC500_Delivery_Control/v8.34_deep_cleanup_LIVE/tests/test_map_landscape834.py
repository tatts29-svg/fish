"""Short-landscape map sizing and shell boundaries. Author: Andrew Fisher."""
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from map_landscape834 import HEAD_ANCHOR, MEDIA, OLD_HEIGHT, REPLACEMENTS, SCOPE, STYLE, apply


# The current sizing routine with synthetic geometry; no private app data.
SIZE_FUNCTION = '''function expSize(){
 const w = document.getElementById('expwrap'); if (!w || !w.getClientRects().length) return;
 expObserve813();
 const vv = window.visualViewport, vh = vv ? vv.height + vv.offsetTop : (window.innerHeight || 800);
 const rect = w.getBoundingClientRect();
 let available;
 if (w.closest('.expfull')) available = vh - rect.top - 10;
 else {
  const mn = w.closest('main'), mr = mn && mn.getBoundingClientRect();
  const foot = document.querySelector('footer.foot'), fr = foot && foot.getBoundingClientRect();
  const pad = mn ? parseFloat(getComputedStyle(mn).paddingBottom) || 0 : 12;
  const bottom = Math.min(vh, mr ? mr.bottom : vh, fr && fr.height ? fr.top : vh);
  // Add scrollTop so resizing cannot progressively enlarge an already scrolled map.
  const top = rect.top + (mn ? mn.scrollTop : 0);
  available = bottom - top - pad;
 }
 const height = Math.max(200, Math.floor(available));
 if (w.style.height !== height + 'px') w.style.height = height + 'px';
}
'''
FIXTURE = '<head></head>\n<body>\n<script>\n' + SIZE_FUNCTION + '\n</script>'


class MapLandscape834Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.patched = apply(FIXTURE)
        patched_script = cls.patched.split('<script>\n', 1)[1].split('\n</script>', 1)[0]
        script = r'''
const vm=require('node:vm');
const [base,patch,query]=JSON.parse(process.argv[1]);
const media=(text,width,height)=>{
 if(text!==query)throw Error('Unexpected media query');
 const minimum=Number(text.match(/min-width:(\d+)px/)[1]);
 const maximum=Number(text.match(/max-width:(\d+)px/)[1]);
 const short=Number(text.match(/max-height:(\d+)px/)[1]);
 return {matches:width>=minimum&&width<=maximum&&height<=short&&width>height};
};
const make=(name,extra={})=>({name,width:844,height:390,top:110,mainBottom:355,footerTop:355,footerHeight:35,pad:8,scroll:0,visible:true,...extra});
const fixtures=[
 make('landscape'),
 make('landscape below old floor',{mainBottom:285,footerTop:285}),
 make('footer wraps',{mainBottom:320,footerTop:320,footerHeight:70}),
 make('scrolled',{top:62,scroll:48}),
 make('keyboard',{visual:{height:240,offsetTop:0}}),
 make('visual offset',{visual:{height:240,offsetTop:20}}),
 make('no available space',{mainBottom:100,footerTop:100}),
 make('fullscreen',{full:true,top:8}),
 make('portrait',{width:390,height:844,top:300,mainBottom:806,footerTop:806,pad:10}),
 make('desktop',{width:1366,height:768,top:250,mainBottom:720,footerTop:720,pad:16}),
 make('portrait below old floor',{width:390,height:844,top:700,mainBottom:806,footerTop:806,pad:10}),
 make('desktop below old floor',{width:1366,height:768,top:630,mainBottom:720,footerTop:720,pad:16}),
 make('wide landscape outside scope',{width:1200,top:260,mainBottom:355,footerTop:355}),
 make('hidden',{visible:false}),
 make('no matchMedia',{noMatch:true})
];
const out=fixtures.map(f=>{
 const run=code=>{
  let observers=0;
  const main={scrollTop:f.scroll,getBoundingClientRect:()=>({bottom:f.mainBottom})};
  const wrapper={style:{height:'unchanged'},getClientRects:()=>f.visible?[{}]:[],getBoundingClientRect:()=>({top:f.top}),closest:s=>s==='.expfull'?(f.full?{}:null):s==='main'?main:null};
  const context={window:{innerHeight:f.height,visualViewport:f.visual||null},document:{getElementById:()=>wrapper,querySelector:()=>({getBoundingClientRect:()=>({top:f.footerTop,height:f.footerHeight})})},getComputedStyle:()=>({paddingBottom:String(f.pad)}),expObserve813:()=>observers++};
  if(!f.noMatch)context.window.matchMedia=q=>media(q,f.width,f.height);
  vm.createContext(context);vm.runInContext(code,context);vm.runInContext('expSize()',context);
  const first=wrapper.style.height;vm.runInContext('expSize()',context);
  return {height:wrapper.style.height,stable:first===wrapper.style.height,observers};
 };
 return {fixture:f,matched:media(query,f.width,f.height).matches,base:run(base),patched:run(patch)};
});
process.stdout.write(JSON.stringify(out));
'''
        result = subprocess.run(['node', '-e', script, json.dumps([SIZE_FUNCTION, patched_script, MEDIA])], check=True, capture_output=True, text=True)
        cls.results = {x['fixture']['name']: x for x in json.loads(result.stdout)}

    def test_required_viewports_select_only_short_landscape(self):
        self.assertTrue(self.results['landscape']['matched'])
        for name in ['portrait', 'desktop', 'wide landscape outside scope']:
            self.assertFalse(self.results[name]['matched'])

    def test_landscape_fits_actual_available_space_even_below_200px(self):
        for name in ['landscape', 'landscape below old floor', 'footer wraps', 'keyboard', 'visual offset']:
            row = self.results[name]
            f = row['fixture']
            vv = f.get('visual')
            viewport_bottom = vv['height'] + vv['offsetTop'] if vv else f['height']
            available = min(viewport_bottom, f['mainBottom'], f['footerTop']) - f['top'] - f['scroll'] - f['pad']
            self.assertEqual(row['patched']['height'], str(available) + 'px')
        self.assertEqual(self.results['landscape']['patched']['height'], '237px')
        self.assertEqual(self.results['landscape below old floor']['patched']['height'], '167px')
        self.assertEqual(self.results['landscape below old floor']['base']['height'], '200px')

    def test_scroll_compensation_and_repeated_resize_remain_stable(self):
        self.assertEqual(self.results['landscape']['patched']['height'], self.results['scrolled']['patched']['height'])
        self.assertTrue(all(row['patched']['stable'] for row in self.results.values()))

    def test_portrait_desktop_and_unavailable_matchmedia_keep_existing_result(self):
        for name in ['portrait', 'desktop', 'portrait below old floor', 'desktop below old floor', 'wide landscape outside scope', 'no matchMedia']:
            self.assertEqual(self.results[name]['base'], self.results[name]['patched'])

    def test_hidden_fullscreen_and_nonnegative_height_cases(self):
        self.assertEqual(self.results['hidden']['patched'], {'height':'unchanged','stable':True,'observers':0})
        self.assertEqual(self.results['fullscreen']['patched']['height'], '372px')
        self.assertEqual(self.results['no available space']['patched']['height'], '0px')

    def test_css_is_screen_only_and_scoped_to_the_visible_map_explorer(self):
        self.assertIn('@media ' + MEDIA + '{', STYLE)
        selectors = re.findall(r'([^{}]+)\{([^{}]*)\}', STYLE)
        self.assertEqual(len(selectors), 13)
        for selector, _ in selectors:
            self.assertTrue(selector.strip().startswith(SCOPE), selector)

    def test_navigation_controls_and_record_footer_remain_reachable(self):
        hidden = [selector.strip() for selector, declarations in re.findall(r'([^{}]+)\{([^{}]*)\}', STYLE) if 'display:none' in declarations]
        self.assertEqual(hidden, [SCOPE + ' header.top .hzcluster', SCOPE + ' header.top #bOrg'])
        self.assertIn('.navback{min-height:44px;min-width:44px}', STYLE)
        self.assertIn('.tools .hmore{min-height:44px}', STYLE)
        self.assertIn('.search input{height:44px}', STYLE)
        self.assertIn('footer.foot > span{display:block;', STYLE)
        self.assertIn('white-space:normal;overflow:visible', STYLE)
        self.assertNotIn('text-overflow:ellipsis', STYLE)

    def test_apply_changes_only_declared_anchors(self):
        restored = self.patched
        for old, new, _ in reversed(REPLACEMENTS):
            self.assertEqual(restored.count(new), 1)
            restored = restored.replace(new, old, 1)
        self.assertEqual(restored, FIXTURE)

    def test_embedded_print_document_head_is_untouched(self):
        embedded = '<script>const paper="</head><body>print document</body>";</script>'
        result = apply(FIXTURE + embedded)
        self.assertTrue(result.endswith(embedded))
        self.assertEqual(result.count('id="map-landscape834"'), 1)

    def test_repeat_missing_and_duplicate_anchors_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'already applied'):
            apply(self.patched)
        with self.assertRaises(SystemExit):
            apply(FIXTURE.replace(OLD_HEIGHT, 'changed'))
        with self.assertRaises(SystemExit):
            apply(FIXTURE + HEAD_ANCHOR)


if __name__ == '__main__':
    unittest.main()
