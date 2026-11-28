import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

from openpyxl import Workbook

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
import shutdown_history as history


class ShutdownHistory(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        self.root = Path(folder.name)
        self.job = self.root / "job"
        (self.job/"kit").mkdir(parents=True)
        state = {"stocktake":{"arrival":"2026-11-22","schedule":history.MMG_SCHEDULE}}
        (self.root/"report.html").write_text("const D="+json.dumps(state)+";")
        self.file = self.root/"source.xlsx"

    def make(self, mode="SALES_STOCK", schedule="MMG Shutdown July 2026", site=None, pulled="17/07/2026 10:09 PM"):
        wb=Workbook(); ref=wb.active;ref.title="REFERENCE_INFO"
        ref.append(["PROJECT SCHEDULE","REQUESTED_DATE/TIME (LOCAL TIME)","REPORT_PERIOD","PROJECT"])
        ref.append([schedule,pulled,"09/07/2026 05:00:00 - 17/07/2026 04:59:59",site])
        tab=wb.create_sheet(mode)
        if mode=="SALES_STOCK":
            tab.append(["SKU_NUMBER","UOM","SALES_QUANTITY","RETURN_QUANTITY","SALES_DATE","SALES_TIME","HIRER","SKU_DESCRIPTION"])
            tab.append(["stock-sku","each",3,1,"11/07/2026","07:30 AM","Example person","Duct tape"])
            tab.append(["stock-sku","each",1,0,"12/07/2026","07:30 AM","Different person","Duct tape"])
        elif mode=="TRANSACTION_WITHOUT_CHARGES":
            tab.append(["PRODUCT_CATEGORY","SKU/ITEM_NUMBER","QUANTITY","TRANSACTION_ID","ITEM_OWNER","PRODUCT_VARIANT_ID","TRAN_START_DATE","TRAN_START_TIME","TRAN_END_DATE","TRAN_END_TIME","HIRER_NAME"])
            tab.append(["Rental","asset-serial",1,462,"COATES","DRILL","11/07/2026","06:00:00","13/07/2026","06:00:00","Private worker"])
        wb.save(self.file);wb.close()

    def run_import(self, *, start="2026-07-09",end="2026-07-16",complete="0",label="Jul 2026"):
        return history.import_workbook(self.job,self.root,self.file,{k:[v] for k,v in dict(start=start,end=end,complete=complete,label=label).items()})

    def test_sales_partial_replay_completion_and_provenance(self):
        self.make();store=self.root/history.SALES_FILE
        store.write_text(json.dumps({"job":history.JOB,"shuts":[],"current_closeout":{"sales_as_at":"known"}}))
        self.assertTrue(self.run_import()["changed"]);self.assertFalse(self.run_import()["changed"])
        archive=json.loads(store.read_text());entry=archive["shuts"][0]
        self.assertEqual(archive["current_closeout"],{"sales_as_at":"known"})
        self.assertEqual(entry["status"],"partial")
        self.assertEqual(entry["rows"],[dict(sku="stock-sku",unit="each",issued=4,credited=1,net=3)])
        self.assertNotIn("person",store.read_text().lower())
        self.assertEqual(self.run_import(complete="1")["status"],"complete")
        previous=store.read_bytes()
        for q in ({"start":"2026-07-10"},{"complete":"0"},{"end":"2026-07-17","complete":"1"}):
            with self.assertRaises(ValueError):
                self.run_import(**q)
        self.assertEqual(previous,store.read_bytes())

    def test_rental_uses_actual_window_and_does_not_store_ids(self):
        self.make("TRANSACTION_WITHOUT_CHARGES");r=self.run_import();self.assertTrue(r["changed"])
        self.assertFalse(self.run_import()["changed"]);self.assertEqual(r["end"],"2026-07-17T04:59:59")
        saved=(self.root/history.HIRE_FILE).read_text();a=json.loads(saved)["periods"][0]
        self.assertEqual(a["total"],{"average":.25,"peak":1});self.assertEqual(a["quality"],"partial")
        self.assertNotIn("asset-serial",saved);self.assertNotIn("Private worker",saved)
        self.assertFalse((self.root/history.SALES_FILE).exists())
        with self.assertRaisesRegex(ValueError,"sales|SALES"):self.run_import(complete="1")

    def test_other_job_ambiguous_generic_current_and_mixed_sheets(self):
        for schedule,site in (("Another Mining","Another site"),("September Shutdown 2025",None),
                              ("MMG Shutdown July 2026","Different site"),(history.MMG_SCHEDULE,None)):
            self.make(schedule=schedule,site=site)
            with self.assertRaises(ValueError):self.run_import()
        self.make(mode="ON_HIRE",site="Dugald River Mine")
        with self.assertRaises(ValueError):self.run_import()
        self.make()
        with self.assertRaises(ValueError):self.run_import(start="2026-11-24",end="2026-11-26",label="Nov 2026")
        with self.assertRaises(ValueError):self.run_import(start="2026-07-01",end="2026-07-02")
        self.assertFalse((self.root/history.SALES_FILE).exists())

    def test_fuller_or_newer_preserved_and_identified_new_site_schedule_supported(self):
        self.make(schedule="Earlier named event",site="MMG Dugald River Mine");self.assertTrue(self.run_import()["changed"])
        previous=(self.root/history.SALES_FILE).read_bytes()
        self.make(schedule="Earlier named event",site="MMG Dugald River Mine",pulled="16/07/2026 10:00 PM")
        with self.assertRaises(ValueError):self.run_import()
        self.assertEqual(previous,(self.root/history.SALES_FILE).read_bytes())

    def test_manager_role_portal_header_and_build_lock(self):
        self.make();payload=self.file.read_bytes()
        for role,header,busy,want in [("store","1",False,403),("client","1",False,403),("manager","",False,403),
                                       ("manager","1",True,409),("manager","1",False,200)]:
            req=Mock();req._role.return_value=role;req._body.return_value=payload;req.headers={"X-Portal":header,"Host":"mmg.test","Origin":"http://mmg.test"}
            req.path="/upload/shutdown-history?label=Jul%202026&start=2026-07-09&end=2026-07-16&complete=0"
            with patch.object(server,"DATA_DIR",str(self.root)),patch.object(server,"JOB_DIR",str(self.job)):
                if busy:server._build_lock.acquire()
                try:server.Handler._put_shutdown_history(req)
                finally:
                    if busy:server._build_lock.release()
            self.assertEqual(req._send.call_args.args[0],want)
            if want==200:
                self.assertEqual(json.loads(req._send.call_args.args[1])["kind"],"SALES_STOCK")


if __name__=="__main__":
    unittest.main()
