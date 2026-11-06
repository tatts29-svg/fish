/* Author: Andrew Fisher. Prefer real supported multisampling to a silent 1x fallback.
 * Some WebGL2 contexts expose 4x but no 2x for the actual colour and depth formats.
 * Only the Balanced 2x request may use that common 4x capability; never exceed 4x
 * for this fallback or alter allocation, resolve, adaptive quality or disposal.
 */
G.selectSamples802=function(colour,depth,wanted){
 const shared=Array.from(colour||[]).filter(n=>n>1&&Array.from(depth||[]).includes(n));
 const within=shared.filter(n=>n<=wanted);
 if(within.length)return Math.max(...within);
 return wanted===2&&shared.includes(4)?4:0;
};
