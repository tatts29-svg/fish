# Coates | Fleet Listing by Availability Status

HTML dashboard built from the SiteIQ export *MyBranch Metric Details for: Fleet
Listing by Availability Status*.

## Files

| File | What it is |
|---|---|
| `build_fleet_availability_report.py` | Builder. Reads the .xlsx export, writes the dashboard. |
| `Coates_Fleet_Listing_by_Availability_Status.html` | The report — single self-contained file, opens offline in any browser. |

## Rebuild against a fresh export

```
python build_fleet_availability_report.py <export.xlsx> [output.html]
```

Requires `openpyxl`. Every figure is computed from the export — nothing is
hard-coded, so a new extract regenerates the whole report including the RAG
ratings, exceptions and executive summary.

## Definitions used

- **Redline** (unavailable fleet, Coates Way target <15%): Inspection Pending,
  In Service, Off Site for Repair, Wait for config job.
- **On hire**: On Hire, On Hire In Service, Reserved In Service.
- **Available**: Available, Reserved.
- **In transit**: Off Hired, In Transfer.

The export's own trailing `Total` row is excluded from the record set and used
only to reconcile the computed totals; the reconciliation result is printed in
the report footer.

Author: Andrew Fisher · POWERED BY SITEIQ
