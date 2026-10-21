/* Author: Andrew Fisher. Test only: deterministic clock and loopback-only server. */
'use strict';
const fs=require('node:fs'),http=require('node:http'),RealDate=Date;
const clock=()=>Number(fs.readFileSync(process.env.FLOW_TEST_CLOCK,'utf8'));
class FixtureDate extends RealDate{constructor(...args){super(...(args.length?args:[clock()]));}static now(){return clock();}}
global.Date=FixtureDate;
const listen=http.Server.prototype.listen;
http.Server.prototype.listen=function(port,callback){
 if(typeof port!=='number'||typeof callback!=='function')throw Error('Unexpected test server listen signature');
 return listen.call(this,port,'127.0.0.1',callback);
};
