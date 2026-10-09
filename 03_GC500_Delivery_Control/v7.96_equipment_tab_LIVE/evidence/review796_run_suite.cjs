// Author: Andrew Fisher. Independent v7.96 review; execute an unchanged suite with private/prefixed result destinations.
const fs = require('fs'), path = require('path'), Module = require('module');
const target = path.resolve(process.argv[2]);
const originalWrite = fs.writeFileSync;
fs.writeFileSync = function(file, data, ...rest) {
  const name = path.basename(String(file));
  if (/^(equipment|packed|one_tab)_(desktop|phone)\.json$/.test(name)) file = path.join(__dirname, 'review796_' + name);
  return originalWrite.call(this, file, data, ...rest);
};
const suite = new Module(target, module); suite.filename = target; suite.paths = Module._nodeModulePaths(path.dirname(target));
suite._compile(fs.readFileSync(target, 'utf8'), target);
