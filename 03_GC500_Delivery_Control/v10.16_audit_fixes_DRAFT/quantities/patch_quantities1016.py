"""Author: Andrew Fisher. Count source-only supplier requests once in Today."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep

def apply(html):
    if 'id="supplier-scope1016-script"' in html:
        raise ValueError('Supplier scope already installed')
    for token in ['function todayWorkMetrics840(asOf) {','function requestAsset(id){','Object.assign(api,{context,model,where,inboundLoads,demobRows,demobLoads,requestAsset});']:
        if html.count(token)!=1:
            raise ValueError('Requires current shared supplier request model')
    html=rep(html,'const native = nativeRows.get(row.key);',
      "const native = nativeRows.get(row.key) || (row.sourceOnly1016 ? {st:{in:row.dueDate1016},d:{recorded:false,done:false}} : null);",
      'Known supplier requests use the same current run date','v10.16 quantities')
    html=rep(html,'</body>\n</html>','<script id="supplier-scope1016-script">\n'+(HERE/'quantities1016.js').read_text()+'\n</script>\n</body>\n</html>',
      'Install shared source-only requested scope','v10.16 quantities')
    return html
