# Author: Andrew Fisher. Presentation-only source hooks.
def apply_financial_presentation976(s,rep):
 s=rep(s,"'paid to Advanced on the dockets · Rehire + Installation (external contractors)'","'recorded supplier cost · dockets'")
 start=' <div class="notice warn"><b>What the money means</b>'
 end=' <div class="notice info"><b>What "planned" means</b>'
 a=s.index(start);b=s.index(end,a)
 fragment=s[a:b]
 s=rep(s,fragment,' <details class="units925-edit"><summary>More info · money and rate rules</summary>'+fragment+'</details>\n')
 start='<div class="notice info"><b>What "planned" means</b>'
 a=s.index(start);b=s.index('</div>',a)+len('</div>')
 fragment=s[a:b]
 s=rep(s,fragment,' <details class="units925-edit"><summary>More info · programme basis</summary>'+fragment+'</details>')
 return s
