/* Author: Andrew Fisher.
 * v7.92 — smooth lettering in the existing signs, with original wording,
 * positions, face directions, colours and physical label bounds retained.
 * System type is used; this does not reconstruct official sponsor artwork.
 */
(function () {
'use strict';
const G=window.GC3D;
if(!G||G.makeSignAtlas792)return;
const FONT='bold 64px Arial, Helvetica, sans-serif',PAD=16,ROW=112,WIDTH=1024;
G.makeSignAtlas792=function(gl,S){
 const labels=S.photoLabels792||[],strings=[...new Set(labels.filter(q=>q.indexEnd>q.indexStart).map(q=>q.text))];
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=ROW;
 let ctx=canvas.getContext('2d');if(!ctx)throw new Error('Sign lettering canvas is unavailable');
 ctx.font=FONT;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 let x=PAD,y=PAD;const layout=Object.create(null);
 for(const text of strings){
  const m=ctx.measureText(text),left=Math.ceil(m.actualBoundingBoxLeft||0),right=Math.ceil(m.actualBoundingBoxRight||m.width),
   ascent=Math.ceil(m.actualBoundingBoxAscent||49),descent=Math.ceil(m.actualBoundingBoxDescent||1),width=left+right,height=ascent+descent;
  if(width<1||height<1||width+2*PAD>WIDTH||height+2*PAD>ROW)throw new Error('Sign lettering exceeds its atlas cell');
  if(x+width+PAD>WIDTH){x=PAD;y+=ROW;}
  layout[text]={x,y,width,height,left,ascent};x+=width+2*PAD;
 }
 // Reserve a padded opaque white cell for all unchanged material vertices.
 if(x+PAD*2>WIDTH){x=PAD;y+=ROW;}
 const whiteX=x,whiteY=y,required=y+ROW;
 let height=1;while(height<required)height*=2;
 if(WIDTH>gl.getParameter(gl.MAX_TEXTURE_SIZE)||height>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw new Error('Sign lettering atlas exceeds the device texture limit');
 canvas.height=height;ctx=canvas.getContext('2d');
 ctx.font=FONT;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#fff';
 for(const text of strings){const q=layout[text];ctx.fillText(text,q.x+q.left,q.y+q.ascent);q.uv=[q.x/WIDTH,(q.y+q.height)/height,(q.x+q.width)/WIDTH,q.y/height];}
 ctx.fillRect(whiteX,whiteY,PAD*2,PAD*2);
 const pixels=ctx.getImageData(0,0,WIDTH,height).data;
 // Keep transparent texels white as well. Straight alpha filtering then smooths
 // letter edges without dark fringes or colour contamination from neighbours.
 for(let i=0;i<pixels.length;i+=4)pixels[i]=pixels[i+1]=pixels[i+2]=255;
 const texture=gl.createTexture();if(!texture)throw new Error('Sign lettering texture could not be allocated');
 const previousActive=gl.getParameter(gl.ACTIVE_TEXTURE);gl.activeTexture(gl.TEXTURE0);
 const previousTexture=gl.getParameter(gl.TEXTURE_BINDING_2D),previousFlip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL),
  previousPremultiply=gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
 try{
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,WIDTH,height,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
 }catch(error){gl.deleteTexture(texture);throw error;}
 finally{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,previousFlip);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,previousPremultiply);
  gl.bindTexture(gl.TEXTURE_2D,previousTexture);gl.activeTexture(previousActive);}
 return {texture,white:[(whiteX+PAD)/WIDTH,(whiteY+PAD)/height],labels:layout,
  width:WIDTH,height,gpuBytes:Math.ceil(WIDTH*height*4*4/3),font:FONT};
};
G.addTrackLabels792=function(S,D){
 if(D.signDecor)throw new Error('Sign lettering is already installed');
 const labels=(S.photoLabels792||[]).filter(q=>q.indexEnd>q.indexStart),source=S.standDecor,atlas=D.atlas;
 if(!source||source.stride!==9||!Array.isArray(source.v)||!Array.isArray(source.i)||!atlas.labels)throw new Error('Original sign geometry is unavailable');
 let end=0,removed=0;
 // Validate before replacing any drawing resource. A partial or overlapping
 // capture must fall back to the intact original mesh rather than erase panels.
 for(const q of labels){
  if(!Number.isInteger(q.indexStart)||!Number.isInteger(q.indexEnd)||q.indexStart<end||q.indexEnd>source.i.length||q.indexStart%3||q.indexEnd%3||
   !atlas.labels[q.text]||![...q.centre,...q.face,...q.colour,q.px,q.lift].every(Number.isFinite)||q.px<=0)throw new Error('Original sign lettering capture is invalid');
  end=q.indexEnd;removed+=q.indexEnd-q.indexStart;
 }
 const batch=D.signDecor=new G.MeshBatch(S.gl,[3,4,2],false),map=new Int32Array(source.v.length/9);map.fill(-1);
 let range=0;
 for(let i=0;i<source.i.length;){
  const q=labels[range];if(q&&i===q.indexStart){i=q.indexEnd;range++;continue;}
  const old=source.i[i++];if(!Number.isInteger(old)||old<0||old>=map.length)throw new Error('Original sign decoration has an invalid vertex');
  let next=map[old];if(next<0){next=batch.vert(...source.v.slice(old*9,old*9+9));map[old]=next;}
  batch.i.push(next);
 }
 const mesh=D.mesh;
 for(const q of labels){
  const [fx,fz]=q.face,r=[fz,-fx],w=(q.text.length*6-1)*q.px,h=7*q.px,
   point=(a,b)=>[q.centre[0]+r[0]*a+fx*q.lift,q.centre[1]+b,q.centre[2]+r[1]*a+fz*q.lift],
   p=[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)],
   uv=atlas.labels[q.text].uv,coords=[[uv[0],uv[1]],[uv[2],uv[1]],[uv[2],uv[3]],[uv[0],uv[3]]],base=mesh.nv;
  for(let i=0;i<4;i++)mesh.vert(...p[i],fx,0,fz,...coords[i],q.colour[0],q.colour[1],q.colour[2],.67);
  mesh.tri(base,base+1,base+2);mesh.tri(base,base+2,base+3);
 }
 batch.upload();
 const stats=D.signStats792={author:'Andrew Fisher',labels:labels.length,strings:Object.keys(atlas.labels),
  sourcePlacementPreserved:true,sourceWordingPreserved:true,sourceDecorationPreserved:true,
  originalLetterTriangles:removed/3,letterTriangles:labels.length*2,retainedDecorationTriangles:batch.ni/3,
  retainedDecorationVertices:batch.nv,atlasWidth:atlas.width,atlasHeight:atlas.height,
  atlasGpuBytes:atlas.gpuBytes,signDecorGpuBytes:batch.nv*9*4+batch.ni*4,
  font:atlas.font,officialSponsorArtwork:false,newSponsorPlacements:0};
 if(D.stats)D.stats.signage792=stats;
 return stats;
};
})();
