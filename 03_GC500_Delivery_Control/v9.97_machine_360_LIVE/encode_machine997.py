"""Author: Andrew Fisher. Encode a verified native 4K capture as a 30 fps seamless loop."""
import argparse,hashlib,json,subprocess
from pathlib import Path
import numpy as np


def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):subprocess.run(args,check=True)
def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(p)]))

def main():
 ap=argparse.ArgumentParser();ap.add_argument('capture',type=Path);args=ap.parse_args();root=args.capture
 evidence=json.loads((root/'capture-evidence.json').read_text());shots={s['frame']:s for s in evidence['shots']}
 assert evidence['width']==3840 and evidence['height']==2160 and evidence['fps']==30,'Expected native3840×2160 at30fps'
 assert set(shots)=={0,960,*range(31,661)},'Incomplete capture'
 assert not evidence['missing'] and all(e['kind']=='console' and e['message']=='Failed to load resource: net::ERR_FAILED' and any(url.startswith('https://fonts.googleapis.com/') for url in evidence['blocked']) for e in evidence['errors']),'Runtime/source failure'
 assert all(s['width']==3840 and s['height']==2160 and s['within_frame'] and s['in_front'] for s in shots.values()),'Geometry clipping'
 assert all(s['hidden_parts']==[18] and not s['support_visible'] for s in shots.values()),'Unexpected hidden geometry'
 assert shots[0]['sha256']==shots[960]['sha256'],'Different native loop endpoints'
 assert shots[0]['pose_sha256']==shots[960]['pose_sha256'],'Different full-pose loop endpoints'
 assert shots[300]['pose_sha256']==shots[660]['pose_sha256'] and shots[300]['sha256']==shots[660]['sha256'],'Inspection does not return to the same assembly pose'
 assert abs(shots[660]['channels']['orbitRadians']-shots[300]['channels']['orbitRadians']-2*np.pi)<1e-10,'Incomplete360orbit'
 for item in shots.values():assert digest(Path(item['file']))==item['sha256'],'Source frame hash changed'
 sequence=root/'sequence';sequence.mkdir(exist_ok=True);mapping=[]
 for frame in range(960):
  source=frame if frame<660 else 960-frame
  if source<=30:source=0
  shot=shots[source];dest=sequence/f'{frame:04d}.png'
  if dest.exists() or dest.is_symlink():dest.unlink()
  dest.symlink_to(Path(shot['file']).resolve());mapping.append({'frame':frame,'source':source,'sha256':shot['sha256'],'pose_sha256':shot['pose_sha256']})
 (root/'encoded-frame-map.json').write_text(json.dumps({'author':'Andrew Fisher','fps':30,'frames':mapping,'method':'Native30fps poses; Full360orbit; exact source-frame reverse only for reassembly; identical1second boundary holds; no interpolation'},indent=2))
 outputs=[]
 for label,width,height,crf,maxrate,bufsize in [('4k',3840,2160,'17','7.8M','8M'),('preview',1920,1080,'19','4M','8M')]:
  p=root/f'coates-way-machine-{label}.mp4'
  cmd=['ffmpeg','-hide_banner','-v','warning','-framerate','30','-i',str(sequence/'%04d.png'),'-frames:v','960','-an']
  cmd+=['-vf',f'scale={width}:{height}:flags=lanczos:out_color_matrix=bt709:in_range=pc:out_range=tv,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709']
  cmd+=['-c:v','libx264','-preset','slow','-threads','4','-crf',crf,'-maxrate',maxrate,'-bufsize',bufsize,'-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-profile:v','high','-g','60','-keyint_min','30','-movflags','+faststart','-metadata','artist=Andrew Fisher','-metadata','title=The Coates Way machine —4K original geometry, 32 seconds and 360-degree orbit, no stand','-y',str(p)]
  run(cmd);metadata=probe(p);streams=metadata['streams'];s=streams[0]
  assert len(streams)==1 and s['codec_name']=='h264' and s['pix_fmt']=='yuv420p'
  assert all(s.get(key)=='bt709' for key in ('color_space','color_transfer','color_primaries')) and s.get('color_range')=='tv','Incorrect colour conversion tags'
  assert s['width']==width and s['height']==height and s['r_frame_rate']=='30/1' and s['nb_read_frames']=='960'
  assert abs(float(metadata['format']['duration'])-32)<1e-6 and p.stat().st_size<=32*1024*1024
  # Decoded endpoint test at theactualencodedresolution, not a resizedproxy.
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vf','select=eq(n\\,0)+eq(n\\,959)','-fps_mode','vfr','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])
  pixels=np.frombuffer(raw,np.uint8).reshape(2,height,width,3).astype(np.float32);d=pixels[1]-pixels[0];mse=float(np.mean(d*d));mae=float(np.mean(np.abs(d)))
  assert mae<2,'Visible compression difference at loop seam'
  colour=None
  if label=='4k':
   from PIL import Image
   native=np.asarray(Image.open(shots[0]['file']).convert('RGB'))
   source_rgb=native.astype(np.float32)
   colour={'comparison':'Decoded native4K frame0 versus original rendered RGB PNG; Rec.709 matrix, limited range', 'full_frame_mean_abs_rgb_error':float(np.abs(pixels[0]-source_rgb).mean())}
   orange=(native[:,:,0]>200)&(native[:,:,1]>60)&(native[:,:,1]<150)&(native[:,:,2]<85)&(native[:,:,0].astype(np.int16)-native[:,:,1].astype(np.int16)>80)
   values,counts=np.unique(native[orange],axis=0,return_counts=True)
   assert len(values),'No original orange swatch found'
   swatch=values[int(np.argmax(counts))];mask=np.all(native==swatch,axis=2)
   decoded_median=np.median(pixels[0][mask],axis=0);delta=decoded_median-swatch
   colour.update({'original_orange_rgb':swatch.tolist(),'sample_pixels':int(mask.sum()),'decoded_orange_median_rgb':decoded_median.tolist(),'orange_median_channel_delta':delta.tolist()})
   assert float(np.abs(delta).max())<=4,'Original orange colour shifted'
   readback=root/'decoded-4k-frame0.png'
   Image.fromarray(pixels[0].astype(np.uint8),'RGB').save(readback)
   colour['decoded_frame0_path']=str(readback)
  record={'path':str(p),'bytes':p.stat().st_size,'sha256':digest(p),'mime':'video/mp4','width':width,'height':height,'fps':30,'duration':32,'codec':'h264','decoded_seam_mae':mae,'decoded_seam_psnr':float(10*np.log10(255*255/mse)) if mse else None,'probe':metadata,'colour_readback':colour};outputs.append(record);print(json.dumps({k:v for k,v in record.items() if k!='probe'}),flush=True)
 poster=root/'coates-way-machine-poster.webp'
 run(['ffmpeg','-v','warning','-i',shots[0]['file'],'-vf','scale=1920:1080:flags=lanczos','-frames:v','1','-quality','93','-y',str(poster)])
 outputs.append({'path':str(poster),'bytes':poster.stat().st_size,'sha256':digest(poster),'mime':'image/webp','width':1920,'height':1080})
 report={'author':'Andrew Fisher','status':'Encoded candidate; visual and browser playback verification required','capture_hook_sha256':evidence['hook_sha256'],'source_manifest':evidence['source_manifest'],'outputs':outputs,'native_endpoints_identical':True,'full_pose_endpoints_identical':True,'zero_velocity_at_loop_join':True,'orbit_degrees':360,'native_frames':960,'inspection_returns_home':True,'join_basis':'Original frame0 repeated for opening/closing1second; quintic release ends with zero first and second derivatives; full 360-degree inspection returns every pose home; exact reverse frame map for reassembly only','geometry':'Original176parts; only mountingbase18 hidden; originalgeometry/materials/artwork retained; mesh and instance bounds conservatively enclose all vertices, with exact vertex fallback where needed','limitations':['Original printed artwork native1179×1179;3D output is native4K, original print was not redrawn.','No engineering collision certification is claimed.']}
 (root/'media-verification.json').write_text(json.dumps(report,indent=2))
if __name__=='__main__':main()
