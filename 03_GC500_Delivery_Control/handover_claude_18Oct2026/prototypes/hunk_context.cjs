// Author: Andrew Fisher. For each character offset in a page, the inline script it sits in and the named functions
// around it, outermost first (acorn). Read-only.   node hunk_context.cjs page.html 1234 5678 ...
const fs = require('fs');
const path = require('path');
const req = m => { try { return require(m); } catch (e) { return require(path.join('/opt/node-tools/node_modules', m)); } };
const acorn = req('acorn');
const html = fs.readFileSync(process.argv[2], 'utf8');
const offs = process.argv.slice(3).map(Number);
const scripts = [];
const rx = /<script\b([^>]*)>/gi;
let m;
while ((m = rx.exec(html))) {
  const attrs = m[1];
  if (/\bsrc\s*=/.test(attrs)) continue;
  const start = m.index + m[0].length, end = html.indexOf('</script>', start);
  if (end < 0) break;
  const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
  const id = (attrs.match(/\bid\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
  scripts.push({start, end, type, id, n: scripts.length});
  rx.lastIndex = end;
}
const nameOf = (node, parent) => {
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
  if ((node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') && parent) {
    if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;
    if (parent.type === 'Property' || parent.type === 'MethodDefinition') return parent.key.name || parent.key.value || null;
    if (parent.type === 'AssignmentExpression') return src(parent.left);
    if (node.id) return node.id.name;
  }
  if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) {
    let init = node.init;
    while (init.type === 'AssignmentExpression') init = init.right; // const Refresh904 = window.GC500Refresh904 = (() => {...})()
    if (/Call|Object|Class/.test(init.type)) return node.id.name;
  }
  return null;
};
let cur = '';
const src = n => cur.slice(n.start, n.end).replace(/\s+/g, '').slice(0, 60);
const out = {};
for (const s of scripts) {
  const mine = offs.filter(o => o >= s.start && o < s.end);
  if (!mine.length) continue;
  if (s.type && !/javascript|module/i.test(s.type)) { mine.forEach(o => (out[o] = {script: s.id || '#' + s.n, within: ['(' + s.type + ')']})); continue; }
  cur = html.slice(s.start, s.end);
  let ast;
  try { ast = acorn.parse(cur, {ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true}); }
  catch (e) { mine.forEach(o => (out[o] = {script: s.id || '#' + s.n, within: ['(parse error: ' + e.message + ')']})); continue; }
  for (const o of mine) {
    const at = o - s.start, within = [];
    const walk = (node, parent) => {
      if (!node || typeof node.type !== 'string' || node.start > at || node.end <= at) return;
      const nm = nameOf(node, parent);
      if (nm && within[within.length - 1] !== nm) within.push(nm);
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, node));
        else if (v && typeof v.type === 'string') walk(v, node);
      }
    };
    walk(ast, null);
    out[o] = {script: s.id || '#' + s.n, within};
  }
}
process.stdout.write(JSON.stringify(out));
