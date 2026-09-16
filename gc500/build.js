#!/usr/bin/env node
/* =====================================================================================================
   Build the GC500 service: server v5.24 as pulled from the running container, plus the v5.25 patches, plus
   the overlay, bundled into one server.js and then into the SERVER_B64 variable Railway's start command
   decodes. Nothing here is hand-edited minified code: every change is a named patch below, applied against
   an exact anchor in the source, and the build refuses to run if an anchor is not found once.

     node gc500/build.js            → gc500/dist/server.js, gc500/dist/SERVER_B64.txt, gc500/dist/build.json,
                                      gc500/dist/chunks/SERVER_B64_01..12.txt + chunks.json

   To deploy: Railway caps one variable at 32,768 characters and the value is longer than that, so it is
   carried in twelve pieces. Set SERVER_B64_01 … SERVER_B64_12 on the service to the twelve files in
   dist/chunks/ (each under the cap), and SERVER_B64 to the reference string in chunks.json, which Railway
   joins at deploy time. The start command prints each piece's length and sha256 as it boots; compare
   them with chunks.json — a piece that does not match is the one to set again. To roll back: build with
   --plain and set those pieces instead, or pick the earlier deployment in Railway's history.
   ===================================================================================================== */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');

const HERE = __dirname;
const SRC = path.join(HERE, 'server.v5.24.js');
const OUT = path.join(HERE, 'dist');
const plain = process.argv.includes('--plain');           /* the pulled server, untouched — the rollback build */

let src = fs.readFileSync(SRC, 'utf8');
const css = fs.readFileSync(path.join(HERE, 'overlay', 'overlay.css'), 'utf8');
const js = fs.readFileSync(path.join(HERE, 'overlay', 'overlay.js'), 'utf8');
if (/<\/(style|script)/i.test(css) || /<\/(style|script)/i.test(js)) throw new Error('the overlay must not contain a closing style or script tag');

/* one anchor, one replacement, and the anchor has to be there exactly once */
function patch(name, anchor, replacement) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('patch "' + name + '": anchor not found');
  if (src.indexOf(anchor, i + 1) >= 0) throw new Error('patch "' + name + '": anchor is not unique');
  src = src.slice(0, i) + replacement + src.slice(i + anchor.length);
  console.log('patched: ' + name);
}

if (!plain) {
  /* ---- 1. the build line */
  patch('build line',
    'const BUILD="server v5.24 — ',
    'const BUILD="server v5.25 — the overlay laid over the page at serve time (visual upgrades + runtime repairs, OVERLAY=off to stop it) + records written one at a time and flushed on shutdown + ');

  /* ---- 2. persist(): one write at a time, a unique temp name, and nothing lost on a redeploy.
     v5.24 debounced writes but did not serialise them: a second write starting before the first had been
     renamed into place truncated the same .tmp the first was about to rename, and a crash in that window
     left a partial records.json. And a SIGTERM inside the 150ms debounce (every Railway redeploy sends one)
     dropped the last write on the floor. */
  patch('persist',
    'let writeTimer=null;function persist(){clearTimeout(writeTimer);writeTimer=setTimeout(()=>{const tmp=FILES.records+".tmp";fs.writeFile(tmp,JSON.stringify(state),err=>{if(err){console.error("persist",err);return}fs.rename(tmp,FILES.records,e2=>{if(e2)console.error("persist rename",e2)})})},150)}',
    [
      'let writeTimer=null,writing=false,writeAgain=false;',
      'function persistNow(){',
      '  if(writing){writeAgain=true;return}',
      '  writing=true;',
      '  const tmp=FILES.records+"."+process.pid+".tmp";',
      '  const done=()=>{writing=false;if(writeAgain){writeAgain=false;persistNow()}};',
      '  fs.writeFile(tmp,JSON.stringify(state),err=>{',
      '    if(err){console.error("persist",err);return done()}',
      '    fs.rename(tmp,FILES.records,e2=>{if(e2)console.error("persist rename",e2);done()})',
      '  })',
      '}',
      'function persist(){clearTimeout(writeTimer);writeTimer=setTimeout(persistNow,150)}',
      '/* a redeploy sends SIGTERM: whatever is still inside the debounce is written before the process goes */',
      'function flushOnExit(sig){',
      '  try{clearTimeout(writeTimer);fs.writeFileSync(FILES.records,JSON.stringify(state))}catch(e){console.error("flush",e.message)}',
      '  console.log("GC500 "+sig+" — record flushed, exiting");',
      '  process.exit(0)',
      '}',
      'process.on("SIGTERM",()=>flushOnExit("SIGTERM"));process.on("SIGINT",()=>flushOnExit("SIGINT"));',
    ].join('\n'));

  /* ---- 3. serveApp(): the uploaded page, with the overlay laid over a served copy */
  const a = src.indexOf('function serveApp(req,res){'), b = src.indexOf('async function uploadApp(req,res){');
  if (a < 0 || b < 0 || b < a) throw new Error('patch "serveApp": anchors not found');
  const overlayBlock = [
    '/* ---------------------------------------------------------------- the overlay (server v5.25)',
    '   The page the build uploads is never changed on disk. At serve time a copy is made with the overlay —',
    '   a stylesheet and a script — laid in before </body>, kept beside the original as app.html.served and',
    '   rebuilt whenever the page or the overlay changes. OVERLAY=off on the service serves the original. */',
    'const OVERLAY={on:String(process.env.OVERLAY||"on").trim().toLowerCase()!=="off",css:' + JSON.stringify(css) + ',js:' + JSON.stringify(js) + '};',
    'OVERLAY.hash=crypto.createHash("sha256").update(OVERLAY.css+"\\n"+OVERLAY.js).digest("hex").slice(0,12);',
    'const SERVED={key:null,path:FILES.app+".served",gz:FILES.appgz+".served"};',
    'function overlayHtml(){',
    '  return "\\n<!-- GC500 overlay "+OVERLAY.hash+" — laid over the uploaded page by the service at serve time (server v5.25). Set OVERLAY=off on the service to serve the page untouched. -->\\n"',
    '    +"<style id=\\"gc500-overlay\\" data-hash=\\""+OVERLAY.hash+"\\">\\n"+OVERLAY.css+"\\n</style>\\n"',
    '    +"<script id=\\"gc500-overlay-js\\" data-hash=\\""+OVERLAY.hash+"\\">\\n"+OVERLAY.js+"\\n</script>\\n"',
    '}',
    'function ensureServed(){',
    '  if(!OVERLAY.on)return false;',
    '  const meta=appMeta()||{};',
    '  const key=String(meta.etag||"")+"|"+OVERLAY.hash;',
    '  if(SERVED.key===key&&fs.existsSync(SERVED.path)&&fs.existsSync(SERVED.gz))return true;',
    '  try{',
    '    if(!fs.existsSync(FILES.app))return false;',
    '    const t0=Date.now();',
    '    const page_=fs.readFileSync(FILES.app,"utf8");',
    '    const at=page_.lastIndexOf("</body>");',
    '    const out=at<0?page_+overlayHtml():page_.slice(0,at)+overlayHtml()+page_.slice(at);',
    '    fs.writeFileSync(SERVED.path+".tmp",out);fs.renameSync(SERVED.path+".tmp",SERVED.path);',
    '    fs.writeFileSync(SERVED.gz+".tmp",zlib.gzipSync(out,{level:6}));fs.renameSync(SERVED.gz+".tmp",SERVED.gz);',
    '    SERVED.key=key;',
    '    console.log("overlay "+OVERLAY.hash+" laid over app "+(meta.etag||"?")+" · "+out.length+" bytes · "+(Date.now()-t0)+" ms");',
    '    return true',
    '  }catch(e){console.error("overlay",e.message);SERVED.key=null;return false}',
    '}',
    'function serveApp(req,res){',
    '  if(!fs.existsSync(FILES.app))return send(res,503,page("Not ready","<p>The app has not been uploaded yet. The owner uploads it on the admin page.</p>"),{"Content-Type":"text/html; charset=utf-8"});',
    '  const meta=appMeta()||{};',
    '  const overlaid=ensureServed();',
    '  const etag=meta.etag?(overlaid?String(meta.etag).replace(/"$/,"-"+OVERLAY.hash+\'"\'):meta.etag):"";',
    '  const h={"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache",ETag:etag,"X-Frame-Options":"SAMEORIGIN","X-GC500-Overlay":overlaid?OVERLAY.hash:"off"};',
    '  if(etag&&req.headers["if-none-match"]===etag){res.writeHead(304,h);return res.end()}',
    '  const plainPath=overlaid?SERVED.path:FILES.app,gzPath=overlaid?SERVED.gz:FILES.appgz;',
    '  if(/\\bgzip\\b/.test(req.headers["accept-encoding"]||"")&&fs.existsSync(gzPath)){h["Content-Encoding"]="gzip";h["Vary"]="Accept-Encoding";res.writeHead(200,h);return fs.createReadStream(gzPath).pipe(res)}',
    '  res.writeHead(200,h);fs.createReadStream(plainPath).pipe(res)',
    '}',
    '',
  ].join('\n');
  src = src.slice(0, a) + overlayBlock + src.slice(b);
  console.log('patched: serveApp');

  /* ---- 4. a fresh upload gets its served copy straight away, off the request */
  patch('upload → served copy',
    'op:"upload-app",bytes:buf.length,build_version:ver});return send(res,200,meta)}',
    'op:"upload-app",bytes:buf.length,build_version:ver});setImmediate(()=>{try{ensureServed()}catch(e){}});return send(res,200,meta)}');

  /* ---- 5. /health says which overlay is on */
  patch('health',
    'if(p==="/health")return send(res,200,{ok:true,',
    'if(p==="/health")return send(res,200,{ok:true,build:"v5.25",overlay:OVERLAY.on?OVERLAY.hash:"off",');

  /* ---- 6. the served copy is made at start-up, not on the first person to open the link */
  patch('startup',
    'server.listen(PORT,()=>console.log("GC500 hosted record on :"',
    'setImmediate(()=>{try{ensureServed()}catch(e){}});server.listen(PORT,()=>console.log("GC500 hosted record on :"');
}

/* ---- syntax check before anything is written */
new Function(src); /* throws on a syntax error */

fs.mkdirSync(OUT, { recursive: true });
const outJs = path.join(OUT, plain ? 'server.plain.js' : 'server.js');
fs.writeFileSync(outJs, src);
const gz = zlib.gzipSync(Buffer.from(src, 'utf8'), { level: 9 });
const b64 = gz.toString('base64');
fs.writeFileSync(path.join(OUT, plain ? 'SERVER_B64.plain.txt' : 'SERVER_B64.txt'), b64);
const info = {
  built: new Date().toISOString(),
  plain: plain,
  server_bytes: Buffer.byteLength(src, 'utf8'),
  gzip_bytes: gz.length,
  b64_chars: b64.length,
  server_sha256: crypto.createHash('sha256').update(src).digest('hex'),
  overlay_hash: plain ? null : crypto.createHash('sha256').update(css + '\n' + js).digest('hex').slice(0, 12),
};
fs.writeFileSync(path.join(OUT, plain ? 'build.plain.json' : 'build.json'), JSON.stringify(info, null, 2) + '\n');
console.log(JSON.stringify(info, null, 2));
if (b64.length > 120000) throw new Error('SERVER_B64 is ' + b64.length + ' characters — Linux caps one environment string at 131072; slim the overlay');

/* ---- the twelve pieces the Railway variables carry (one variable is capped at 32,768 characters) */
const PIECES = 12, CAP = 32000;
const size = Math.ceil(b64.length / PIECES);
if (size > CAP) throw new Error('each of the ' + PIECES + ' pieces would be ' + size + ' characters — over the Railway cap; slim the overlay');
const CHUNKS = path.join(OUT, plain ? 'chunks.plain' : 'chunks');
fs.mkdirSync(CHUNKS, { recursive: true });
const pieces = [];
for (let i = 0; i < PIECES; i++) {
  const name = 'SERVER_B64_' + String(i + 1).padStart(2, '0');
  const piece = b64.slice(i * size, (i + 1) * size);
  fs.writeFileSync(path.join(CHUNKS, name + '.txt'), piece);
  pieces.push({ name: name, chars: piece.length, sha256_16: crypto.createHash('sha256').update(piece).digest('hex').slice(0, 16) });
}
const join = pieces.map(function (p) { return '${{' + p.name + '}}'; }).join('');
fs.writeFileSync(path.join(CHUNKS, 'chunks.json'), JSON.stringify({ SERVER_B64: join, pieces: pieces, b64_sha256: crypto.createHash('sha256').update(b64).digest('hex') }, null, 2) + '\n');
console.log('pieces:', pieces.map(function (p) { return p.name + ' ' + p.chars + ' ' + p.sha256_16; }).join('\n        '));
