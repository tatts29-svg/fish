"""Author: Andrew Fisher. Reuse the established complete financial parity checks."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().parents[2]/'v10.17_quantity_reference_LIVE'/'financials'/'compare1017.py'),run_name='__main__')
