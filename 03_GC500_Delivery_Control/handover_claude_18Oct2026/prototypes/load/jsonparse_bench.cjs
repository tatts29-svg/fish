const fs = require('fs'), vm = require('vm');
const line = fs.readFileSync(__dirname + '/data_line.js', 'utf8').trim();
const lit = line.replace(/^const DATA = /, '').replace(/;\s*$/, '');
const obj = (0, eval)('(' + lit + ')'); const json = JSON.stringify(obj);
const same = JSON.stringify((0, eval)('(' + lit + ')')) === json;
const srcA = 'var DATA_A = ' + lit + ';';
const srcB = 'var DATA_B = JSON.parse(' + JSON.stringify(json) + ');';
const t = (src) => { const t0 = process.hrtime.bigint(); new vm.Script(src, {filename: 'x' + Math.random()}).runInNewContext({JSON}); return Number(process.hrtime.bigint() - t0) / 1e6; };
const ra = [], rb = []; for (let i = 0; i < 5; i++) { ra.push(t(srcA)); rb.push(t(srcB)); }
console.log('literal equals JSON round trip:', same, 'lit bytes', lit.length, 'json-string bytes', srcB.length);
console.log('object literal ms', ra.map(x => x.toFixed(0)).join(' '), ' JSON.parse ms', rb.map(x => x.toFixed(0)).join(' '));
