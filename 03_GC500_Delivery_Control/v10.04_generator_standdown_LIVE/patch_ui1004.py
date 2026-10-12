# Author: Andrew Fisher
from pathlib import Path
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

def patch_ui1004(s, path="GC500_Delivery_Control_hosted.html"):
    here = Path(__file__).resolve().parent
    if 'function generatorHtml1004(' in s:
        raise ValueError('Generator presentation is already present')
    s = rep(s, 'function financeLinks857() {', (here / 'generator_ui1004.js').read_text() + '\nfunction financeLinks857() {', 'Generator presentation functions', path)
    s = rep(s, '<button class="btn" data-finance888="transport">Transport</button></nav>', '<button class="btn" data-finance888="transport">Transport</button><button class="btn" data-finance857="generators">Generators</button></nav>', 'Generator Finance subtab', path)
    s = rep(s, "function financeSubView857() {\n  const view=state.financeView857;", """function financeSubView857() {
  const view=state.financeView857;
 if(view==='generators'){
  const costs=document.getElementById('pane-costs');
  costs.innerHTML=paneHeadingHtml('costs')+financeLinks857()+'<div id="finance857-section">'+generatorHtml1004()+'</div>';
  generatorBind1004();return true;
 }""", 'Generator Finance view', path)
    s = rep(s, '</head>\n<body>', '<style id="generator1004-style">\n' + (here / 'generator_ui1004.css').read_text() + '\n</style>\n</head>\n<body>', 'Generator presentation style', path)
    return s
