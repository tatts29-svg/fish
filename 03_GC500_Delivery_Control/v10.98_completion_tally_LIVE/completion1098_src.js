/* Author: Andrew Fisher. Completion scope is separate from the asset and charge registers. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports) module.exports=factory;
 else root.CompletionScope1098=factory(COMPLETION_SCOPE1098_DATA);
})(typeof globalThis==='object'?globalThis:this,function(config){
 'use strict';
 if(!config||config.schema!==1||!Array.isArray(config.excluded_references)) throw new Error('Invalid completion scope');
 const excluded=new Set(config.excluded_references);
 function key(value){return typeof value==='string'?value:value&&value.key;}
 function includes(value){return !excluded.has(key(value));}
 function note(values){
  const keys=[...new Set((values||[]).map(key).filter(k=>excluded.has(k)))];
  return keys.length ? 'Outside the completion count: '+keys.join(', ')+'.' : '';
 }
 return Object.freeze({includes,note});
});
