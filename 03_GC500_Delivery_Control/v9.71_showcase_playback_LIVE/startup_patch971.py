# Author: Andrew Fisher. Scoped preparation integration; imported by the v9.71 release patch.
from pathlib import Path
HERE=Path(__file__).resolve().parent
def apply_startup971(s,replace):
 def edit(old,new,why):
  nonlocal s
  s=replace(s,old,new,why)
 assert 'const ShowcaseStartup971 =' not in s,'Startup preparation already applied'
 edit('/* Author: Andrew Fisher. Visual detail over the existing complete circuit. */',
      (HERE/'startup971.js').read_text()+'\n/* Author: Andrew Fisher. Visual detail over the existing complete circuit. */',
      'static-detail startup controller before the first heavy scene render')
 edit('if(!S.architecture781&&S.architecture781Source){G.installArchitecture781(S);return;}',
      'if(!S.architecture781&&S.architecture781Source?.length){G.installArchitecture781(S);return;}',
      'empty optional architecture sources cannot stall preparation')
 edit('if(!S.vegetation781&&S.vegetation781Source){G.installVegetation781(S);return;}',
      'if(!S.vegetation781&&S.vegetation781Source?.length){G.installVegetation781(S);return;}',
      'empty optional vegetation sources need no upload')
 old='''G.render=function(){
 const S=G.S;if(!S||S.lost)return;ensure(S);
 let result;
 try{result=render.apply(this,arguments);}
 catch(error){if(!S||!S.detail781Enabled)throw error;fail(S,error);return render.apply(this,arguments);}
 // Allocation failure can disable the composite inside the original render.
 // Redraw once with its original resources, then keep the normal fallback.
 if(S&&S.detail781Enabled&&S.bloom===false){ensure(S);return render.apply(this,arguments);}
 return result;
};'''
 new='''G.render=function(){
 const S=G.S;if(!S||S.lost)return;
 if(!G.prepareStatic971(S,ensure,fail))return;
 const self=this,args=arguments;
 return G.drawPrepared971(S,()=>{
 let result;
 try{result=render.apply(self,args);}
 catch(error){if(!S||!S.detail781Enabled)throw error;fail(S,error);return render.apply(self,args);}
 // Allocation failure can disable the composite inside the original render.
 // Redraw once with its original resources, then keep the normal fallback.
 if(S&&S.detail781Enabled&&S.bloom===false){ensure(S);return render.apply(self,args);}
 return result;
 });
};'''
 edit(old,new,'prepare static meshes before drawing and reveal the canvas only after a successful draw')
 return s
