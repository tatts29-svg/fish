/* Author: Andrew Fisher. One current snapshot per synchronous sync-feedback pass.
   Local saves and remote hydration keep their existing invalidation. No retained
   cache, timers, DOM replacement, record writes or change to confirmation text. */
(function(){
 'use strict';
 const before=syncFooter;
 syncFooter=function(){
  const self=this,args=arguments;
  return holdAssets(()=>Reflect.apply(before,self,args));
 };
})();
