/* Author: Andrew Fisher. Boundary, physical width and north-up door direction checks. */
const assert=require('assert'),C=require('../area1206_core')(),checks=[];
function test(name,fn){fn();checks.push({name,ok:true});}
test('square includes all four edges and corners',()=>{for(const p of [[25,25],[-25,-25],[25,-25],[-25,25],[0,25]])assert(C.inside(p));});
test('square excludes points immediately beyond either axis',()=>{for(const p of [[25.001,0],[0,-25.001],[-25.001,24]])assert(!C.inside(p));});
test('long run crossing area is included when endpoints are outside',()=>assert(C.intersects([[-80,0],[80,0]],false)));
test('nearby run outside the square is excluded',()=>assert(!C.intersects([[-80,26],[80,26]],false)));
test('footprint surrounding square is included',()=>assert(C.intersects([[-30,-30],[30,-30],[30,30],[-30,30]])));
test('footprint whose edge crosses square is included',()=>assert(C.intersects([[24,23],[40,23],[40,40],[24,40]])));
test('remote diagonal footprint is excluded',()=>assert(!C.intersects([[26,26],[40,26],[40,40],[26,40]])));
test('polyline does not claim the empty interior of an unclosed loop',()=>assert(!C.intersects([[-30,-30],[30,-30],[30,30],[-30,30]],false)));
test('single point at centre is included',()=>assert(C.intersects([[0,0]],false)));
test('invalid point cannot enter selection',()=>assert(!C.inside([NaN,0])));
test('geographic centre is exactly the square centre',()=>{const ll={lat:-27.99,lon:153.43};assert.deepEqual(C.frame(ll).local(C.merc(ll)),[0,0]);});
test('all four square sides measure 50 metres',()=>{const f=C.frame({lat:-27.99,lon:153.43}),p=[[-25,-25],[25,-25],[25,25],[-25,25]].map(p=>f.local(f.world(p)));for(let i=0;i<4;i++)assert(Math.abs(Math.hypot(p[i][0]-p[(i+1)%4][0],p[i][1]-p[(i+1)%4][1])-50)<1e-6);});
test('same width at north and south latitudes',()=>{for(const lat of [-60,-28,0,28,60]){const f=C.frame({lat,lon:153});const a=f.local(f.world([-25,0])),b=f.local(f.world([25,0]));assert(Math.abs(b[0]-a[0]-50)<1e-6);}});
test('door directions follow north-up coordinates',()=>{for(const [p,w] of [[[0,-1],'north'],[[1,-1],'north-east'],[[1,0],'east'],[[1,1],'south-east'],[[0,1],'south'],[[-1,1],'south-west'],[[-1,0],'west'],[[-1,-1],'north-west']])assert.equal(C.direction([0,0],p),w);});
test('same door direction away from the origin',()=>assert.equal(C.direction([11,9],[12,9]),'east'));
test('plan chevron edge produces outward door normal',()=>{const d=C.edgeDoor([[0,0],[2,0],[2,2],[0,2]],1);assert.deepEqual(d.mid,[2,1]);assert.equal(C.direction(d.mid,[d.mid[0]+d.out[0],d.mid[1]+d.out[1]]),'east');});
test('reversed footprint winding keeps outward door normal',()=>{const d=C.edgeDoor([[0,0],[0,2],[2,2],[2,0]],2);assert.equal(C.direction(d.mid,[d.mid[0]+d.out[0],d.mid[1]+d.out[1]]),'east');});
test('missing or invalid chevron edge never invents a door',()=>{assert.equal(C.edgeDoor([[0,0],[1,1],[0,1]],null),null);assert.equal(C.edgeDoor([[0,0],[1,1],[0,1]],5),null);});
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:checks.length}));
