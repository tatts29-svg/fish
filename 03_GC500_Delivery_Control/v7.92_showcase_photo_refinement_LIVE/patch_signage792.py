"""Author: Andrew Fisher. Capture the existing sign lettering without changing its fallback geometry."""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(t, p):
    if 'S.photoLabels792=[]' in t:
        raise ValueError('Sign lettering capture v7.92 is already installed')
    t = rep(t, 'G.dressCircuit=function(S,k){', '''G.dressCircuit=function(S,k){
 S.photoLabels792=[]; /* preserve the source text calls for the optional typeset layer */''',
            'Capture existing Showcase sign labels', p)
    t = rep(t, '''const text=(c,f,str,px,col,lift)=>{const r=[f[1],-f[0]],cols=str.length*6-1,x0=-cols/2*px,y0=3.5*px;''',
            '''const text=(c,f,str,px,col,lift)=>{const indexStart=S.standDecor.i.length;
 const r=[f[1],-f[0]],cols=str.length*6-1,x0=-cols/2*px,y0=3.5*px;''',
            'Capture each original lettering interval start', p)
    t = rep(t, '''stats.letters++;i=e;}}});};''',
            '''stats.letters++;i=e;}}});
 S.photoLabels792.push({centre:c.slice(),face:f.slice(),text:str,px,colour:col.slice(),lift,
 indexStart,indexEnd:S.standDecor.i.length});};''',
            'Capture each original lettering interval end', p)
    return t
