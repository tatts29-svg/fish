// Author: Andrew Fisher. Bind browser checks to the exact existing machine manifest.
'use strict';
const {prepareMachine,prepareMedia,installAssets}=require('../../toolchain/harness/release_sweep.cjs');
module.exports=async session=>{
 const machine=prepareMachine(process.env),{media}=prepareMedia(process.env.PAGE,process.env);
 const result={failures:[]};
 await installAssets(session,{machine,media,poc:null,tileFiles:0},result);
 return result;
};
