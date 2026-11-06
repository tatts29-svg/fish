import importlib.util, os, sys
spec=importlib.util.spec_from_file_location('p','draft/patch_v1057.py')
# avoid import of rep failing: add toolchain path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
t=open('base.html',encoding='utf8').read()
anchors={'OLD_METADATA':m.OLD_METADATA,'OLD_SCOPE':m.OLD_SCOPE,
'metadata925 call':'docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];',
'completeKeys':'window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };',
'native':" let cachedKey='', cached;\n function native() {",
'reset':"reset:()=>{cached=null;cachedKey='';}",
'align rAF':'requestAnimationFrame(() => { q = false; try { drawer(); costs(); } catch (x) {} });',
'end':'</script>\n</body>\n</html>',
'guard v10.55':'W.align1055 = {scan, DIFFS};',
'syncFooter def':'function syncFooter(',
'holdAssets':'function holdAssets(',
'heldMemo':'function heldMemo(',
'HELD_MEMO':'HELD_MEMO',
}
for k,v in anchors.items(): print(f'{t.count(v):4d}  {k}')
