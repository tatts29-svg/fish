/* Author: Andrew Fisher. Keep the chosen 3D backdrop on screen. Build and GPU
   timing may guide rendering quality, but never choose a different backdrop. */
(function(root){
'use strict';
const KEY='gc500.show3d.mount',BUDGET=1500;
function last(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
// Retain the diagnostic API used by existing tools; no automatic flat fallback.
root.ShowcaseQuick1143={KEY,BUDGET,last,state:()=>({applied:null,lastMs:last()?.ms||null,why:'',want3d:false}),fallback:()=>false};
root.ShowcaseStable1175={version:'11.75',automaticBackdropChange:false,colourPassWithoutGlow:true};
})(window);
