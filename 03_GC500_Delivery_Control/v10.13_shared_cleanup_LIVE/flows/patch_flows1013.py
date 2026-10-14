# Author: Andrew Fisher. Narrow shared navigation and registry-refresh repair.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="flows1013-script"' in html:
        raise ValueError('Flows v10.13 already applied')
    if 'root.Persistence1010={capture,restore,key,get intent(){return intent;}};' not in html or 'root.SelectionSave1012=api;' not in html:
        raise ValueError('Requires the shared v10.10 persistence and v10.12 Save adapters')
    html=rep(html," const changed = tab !== state.tab;\n if(changed&&window.Navigation934)"," const changed = tab !== state.tab;\n if(changed)window.Flows1013?.depart();\n if(changed&&window.Navigation934)",'Capture disclosures before hidden pane disposal','v10.13')
    html=rep(html," GO_CHANGED = changed; try { render(); } finally { GO_CHANGED = false; }\n if (changed) countUpFigures(tab);"," GO_CHANGED = changed; try { render(); } finally { GO_CHANGED = false; }\n if(changed)window.Flows1013?.arrive(tab);\n if (changed) countUpFigures(tab);",'Restore disclosures before native tab scroll','v10.13')
    html=rep(html," INV.drill = {t: v.slice(0, k), col: 'togo'}; render();\n setTimeout(() => { const li =", " INV.drill = {t: v.slice(0, k), col: 'togo'}; const reveal1013=Flows1013.inventoryIntent(); render();\n setTimeout(() => { if(!Flows1013.currentInventory(reveal1013))return; const li =",'Inventory reference reveal yields to later action','v10.13')
    html=rep(html," INV.drill = INV.drill && INV.drill.t === d.t && INV.drill.col === d.col ? null : d; render();\n if (INV.drill) setTimeout(() => { const x =", " INV.drill = INV.drill && INV.drill.t === d.t && INV.drill.col === d.col ? null : d; const reveal1013=Flows1013.inventoryIntent(); render();\n if (INV.drill) setTimeout(() => { if(!Flows1013.currentInventory(reveal1013))return; const x =",'Inventory quantity reveal yields to later action','v10.13')
    html=rep(html," S.open.add('Every reference'); refs.open = true;\n requestAnimationFrame(() => { if (state.tab !== 'plant' || !refs.isConnected) return;", " S.open.add('Every reference'); refs.open = true;\n const reveal1013=window.Flows1013?.intentToken();\n requestAnimationFrame(() => { if (state.tab !== 'plant' || !refs.isConnected || reveal1013&&!Flows1013.current(reveal1013)) return;",'Equipment results reveal yields to user scroll','v10.13')
    return rep(html,'\n</body>\n</html>','\n<script id="flows1013-script">\n'+(HERE/'flows1013.js').read_text()+'\n</script>\n</body>\n</html>','Shared flow safeguards','v10.13')

if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(apply(p.read_text()))
