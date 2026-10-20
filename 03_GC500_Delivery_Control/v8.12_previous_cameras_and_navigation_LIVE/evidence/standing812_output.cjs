// Author: Andrew Fisher. Redirect only inherited suite result files; keep historical evidence intact.
const fs=require('fs'),original=fs.writeFileSync;
fs.writeFileSync=function(file,...args){
 if(typeof file==='string'&&/(?:packed|equipment)_(?:desktop|phone)\.json$/.test(file)&&process.env.GC500812_RESULT)file=process.env.GC500812_RESULT;
 return original.call(this,file,...args);
};
