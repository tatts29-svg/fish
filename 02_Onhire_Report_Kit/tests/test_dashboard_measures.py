import datetime as dt
import sys
import tempfile
import unittest
from pathlib import Path

import openpyxl
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_showcase as data
import catalogue
import utilisation
import variant_history


class DashboardMeasures(unittest.TestCase):
    def test_last_issue_hours_keep_midnight_and_stop_at_dated_pull(self):
        def issue(t, status='On Hire', day='28/11/2026'):
            return dict(ON_HIRE_DATE=day,ON_HIRE_TIME=t,ITEM_STATUS=status)
        measurements=data._issue_hours([issue('12:15 AM'),issue('02:30 AM','Available for Hire'),
                issue('04:30 AM'),issue('07:15:36'),issue('07:16 AM'),issue(None),issue('01:00 AM',day='27/11/2026')],
                dt.datetime(2026,11,28,7,15))
        self.assertEqual(measurements['hours'],[f'{n:02}:00' for n in range(8)])
        self.assertEqual(measurements['counts'],[1,0,1,0,1,0,0,1])
        self.assertEqual(measurements['back'],[0,0,1,0,0,0,0,0])
        self.assertEqual((measurements['issued'],measurements['out'],measurements['unknown']), (5,4,1))

    def test_replenishment_independent_thresholds_or_unknown_balance(self):
        rows=[{'SKU_NUMBER':k,'AVAILABLE_QUANTITY':v} for k,v in [('a',0),('b',2),('c',None),('d',1.25),('e',-1),('f',0)]]
        targets={'a':(2,None),'b':(None,5),'c':(4,8),'d':(1.5,2.75),'e':(1,3),'f':(0,0)}
        low,to_max,evaluated,maximums=data._replenishment(rows,targets)
        self.assertEqual(([r['SKU_NUMBER'] for r,*_ in low], to_max, evaluated,maximums),(['a','d'],4.5,3,3))

    def test_current_and_archived_fleet_use_the_same_distinct_supported_ids(self):
        def row(i,owner,status, variant='VX'):
            return dict(ITEM_NUMBER=i,OWNER=owner,ITEM_STATUS=status,PRODUCT_VARIANT=variant,ITEM_DESCRIPTION='Cordless tool')
        a=row('001','Coates','On Hire'); b=row('002','Other','Available for Hire')
        rows=[a,dict(a),b,row('003','Other','On Hire'),row('003','Other','Available for Hire'),row('','Other','On Hire')]
        self.assertEqual(variant_history.unique_assets(rows),([a,b],1,1))
        model=utilisation.build(rows,dt.datetime(2026,9,3),None,dict(schedule='sample',period=(dt.datetime(2026,9,1),dt.datetime(2026,9,2))), 'sample')
        self.assertEqual(model['totals'],dict(fleet=2,on=1,used=None))
        self.assertEqual(model['excluded_conflicting_id'],1)
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            wb=openpyxl.Workbook(); ref=wb.active;ref.title='REFERENCE_INFO'
            ref.append(['REQUESTED_DATE/TIME']);ref.append(['03/09/2026 06:00 AM'])
            sh=wb.create_sheet('RENTAL_STOCK');sh.append(list(a))
            for r in rows: sh.append([r[k] for k in a])
            filename=root/'stock.xlsx';wb.save(filename);wb.close()
            snap=variant_history.rental_snapshot(filename,root)
        self.assertEqual(snap['counts'],{'v:VX':[2,1]})
        self.assertEqual(snap['owner_counts'],{'v:VX':{'Coates':[1,1],'Other':[1,0]}})
        self.assertEqual(snap['labels']['v:VX']['owner'],'Multiple owners')

    def test_catalogue_carries_unknowns_at_each_level_and_preserves_fractional_units(self):
        rows=[dict(SKU_DESCRIPTION='Part',balance=balance) for balance in (1.25,0,None)]
        category=catalogue.cons_catalogue(rows,lambda r:r['balance'])[0]
        kind=category['kinds'][0];size=kind['sizes'][0]
        for record in (category,kind,size):
            self.assertEqual((record['n'],record['unknown']), (1.25,1))
        measured=catalogue.cons_catalogue(rows[:2],lambda r:r['balance'])[0]
        self.assertNotIn('unknown',measured)
