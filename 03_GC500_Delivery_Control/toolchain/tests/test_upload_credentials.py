# Author: Andrew Fisher. Credential routing and no-write guards; no network and no secrets.
import importlib.util,io,json,os,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('upload',Path(__file__).parents[1]/'upload_page.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Credentials(unittest.TestCase):
 def invoke(self,args,role='edit',live=b'base'):
  with tempfile.TemporaryDirectory() as td:
   p=Path(td)/'page.html';p.write_bytes(b'candidate');p.with_name('base_live.html').write_bytes(b'base')
   response=unittest.mock.Mock();response.read.return_value=live
   with patch.dict(os.environ,{},clear=True),patch.object(sys,'argv',['upload',str(p)]+args),patch.object(m.urllib.request,'urlopen',return_value=response),patch.object(m,'curl',return_value=(200,json.dumps({'level':role}))) as call,patch('sys.stdout',new=io.StringIO()):
    try:m.main();error=None
    except SystemExit as e:error=str(e)
    return error,call.call_args_list
 def test_no_binding_no_proxy_stops(self):
  e,c=self.invoke(['--dry-run']);self.assertIn('not set',e);self.assertFalse(c)
 def test_proxy_dry_run_reads_only(self):
  e,c=self.invoke(['--credential-proxy','--dry-run']);self.assertIsNone(e);self.assertEqual([x.args[0] for x in c],['GET'])
 def test_view_credential_never_writes(self):
  e,c=self.invoke(['--credential-proxy'],role='view');self.assertIn('not the edit key',e);self.assertEqual([x.args[0] for x in c],['GET'])
 def test_changed_live_base_never_contacts_edit_api(self):
  e,c=self.invoke(['--credential-proxy'],live=b'other release');self.assertIn('live page has changed',e);self.assertFalse(c)
 def test_proxy_does_not_send_dummy_header(self):
  r=unittest.mock.Mock(stdout=b'{}\n200')
  with patch.dict(os.environ,{},clear=True),patch.object(sys,'argv',['upload','--credential-proxy']),patch.object(m.subprocess,'run',return_value=r) as run:
   self.assertEqual(m.curl('GET','/api/version'),(200,'{}'));self.assertEqual(run.call_args.kwargs['input'],b'')
 def test_private_binding_passes_only_stdin(self):
  r=unittest.mock.Mock(stdout=b'{}\n200')
  with patch.dict(os.environ,{'GC500_EDIT_TOKEN':'test-binding'},clear=True),patch.object(m.subprocess,'run',return_value=r) as run:
   m.curl('GET','/api/version');self.assertNotIn('test-binding',str(run.call_args.args));self.assertEqual(run.call_args.kwargs['input'],b'x-gc500-token: test-binding\n')
if __name__=='__main__':unittest.main()
