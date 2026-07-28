# ==========================================================================
#  COATES | K2 DAILY TRACKING PREFILL
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Fills TODAY'S shift-day Actuals in the K2 workbook's Daily Tracking from
#  live SiteIQ data. A shift day runs 05:00 to 05:00 the next morning - a
#  run before 05:00 belongs to yesterday's row.
#
#    Plant Equipment Hire Actual  = ALL site plant ON CHARGE - in use by a crew
#                                   AND plant parked in the Site Plant Equipment
#                                   (Coates) pool that is still being charged
#                                   (idle-but-charged; Andrew's direction
#                                   21 Jul 2026) - at contracted/register rates,
#                                   plus barriers, chutes & hoppers at register
#                                   rates (on site whole shutdown). Plant showing
#                                   "Available for Hire" in the plant location is
#                                   OFF charge and is never counted or mentioned.
#    Tooling Hire Actual          = everything else on hire (incl Milwaukee)
#    Radio Hire Actual            = 70 billable handsets x $12.81 (from
#                                   17 Jul 2026; 2 spares unbilled)
#    Gas Monitor Hire Actual      = WHOLE gas fleet x $29.75 from 24 Jul 2026
#                                   until the last forecast day, on hire or
#                                   not (Andrew's direction, 17 Jul 2026)
#    Personnel / Labour Actual    = that day's roster cost from Shutdown
#                                   Costing
#    Accommodation Actual         = that day's Accom Cost from Shutdown
#                                   Costing
#    Subhired welders (SUB...)    = NEVER counted in Plant or Tooling.
#                                   They are invoiced separately and carry
#                                   their own Welders stream in the Cost
#                                   Snapshot (A. Fisher's direction, 24 Jul
#                                   2026). The prefill still reports what it
#                                   sees, but adds $0 for them here.
#
#  Transport and Damage stay MANUAL - never touched.
#  Cells already holding a value are left alone unless -Force is used.
#
#  Usage:  double-click 01_RUN_PREFILL_DAILY.bat
#          powershell -File PREFILL_DAILY_TRACKING.ps1 [-ShiftDate 18/07/2026] [-Force]
# ==========================================================================
param(
    [string]$ShiftDate = "",
    [switch]$Force
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$RADIO_BILLABLE = 70
$RADIO_RATE = 12.81
$RADIO_START = Get-Date '2026-07-17'
$GAS_RATE = 29.75
$GAS_START = Get-Date '2026-07-24'   # gas fleet hire starts Fri 24 Jul 2026

function Find-Newest([string]$pattern, [string]$what) {
    # SiteIQ pulls live in Data_SiteIQ\ (the suite root still works too)
    $dirs = @((Join-Path $here 'Data_SiteIQ'), $here) | Where-Object { Test-Path $_ }
    $hits = @()
    foreach ($d in $dirs) {
        $hits += Get-ChildItem -Path $d -File -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -notlike '~$*' -and
            (($_.Name -replace '[ _]', '') -like (($pattern -replace '[ _]', '')))
        }
    }
    if (-not $hits) {
        throw ("Couldn't find {0}.`n  Looked for: {1}`n  In: {2} (and Data_SiteIQ)`nDrop the file in that folder and run again." -f $what, $pattern, $here)
    }
    ($hits | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

# ---- shift day (05:00 -> 05:00 next day) ---------------------------------
if ($ShiftDate -ne "") {
    $shift = [datetime]::ParseExact($ShiftDate, 'dd/MM/yyyy', $null)
} else {
    $now = Get-Date
    if ($now.Hour -lt 5) { $shift = $now.Date.AddDays(-1) } else { $shift = $now.Date }
}

Write-Output "=============================================================="
Write-Output " COATES | K2 DAILY TRACKING PREFILL"
Write-Output (" Shift day: {0} (05:00 -> 05:00 next day)" -f $shift.ToString('dd MMM yyyy'))
Write-Output " Author: Andrew Fisher | POWERED BY SITEIQ"
Write-Output "=============================================================="

$wbPath    = Find-Newest 'Cement_Australia_Report*K2*.xlsm' 'the K2 report workbook'
$stockPath = Find-Newest 'RENTAL_STOCK*.xlsx' 'the RENTAL_STOCK export'
$ratesPath = Find-Newest 'ImportSample_Contracted*Rates*and*Prices*.xlsx' 'the Contracted Rates file'

$app = New-Object -ComObject Excel.Application
$app.Visible = $false
$app.DisplayAlerts = $false
$app.EnableEvents = $false
$app.AutomationSecurity = 3

function Norm([object]$v) { if ($null -eq $v) { '' } else { ([string]$v).Trim() } }
function NormKey([string]$s) { ($s.ToUpper() -replace '[^A-Z0-9]', '') }

try {
    # ---- contracted rates: variant -> daily rate --------------------------
    $wbR = $app.Workbooks.Open($ratesPath, 0, $true)
    $arr = $wbR.Worksheets.Item('Coates Equipment').UsedRange.Value2
    $rates = @{}
    for ($r = 2; $r -le $arr.GetLength(0); $r++) {
        $v = (Norm $arr[$r,1]).ToUpper()
        $rate = 0.0
        $raw = Norm $arr[$r,2]
        if ($raw -ne '') { $rate = [double](($raw -replace '[$,]', '')) }
        if ($v -ne '' -and $rate -gt 0 -and -not $rates.ContainsKey($v)) { $rates[$v] = $rate }
    }
    $wbR.Close($false)

    # ---- the K2 workbook: register rates + Daily Tracking + labour --------
    $wb = $app.Workbooks.Open($wbPath, 0, $false)
    try { $wb.AutoSaveOn = $false } catch {}

    # plant register: variant -> rate (prefix-tolerant, register truncates)
    $reg = $wb.Worksheets.Item('Plant Equipment').ListObjects.Item('AssetRegisterTable2219')
    $regArr = $reg.Range.Value2
    $hdrMap = @{}
    for ($c = 1; $c -le $regArr.GetLength(1); $c++) { $hdrMap[(Norm $regArr[1,$c])] = $c }
    $regRates = @{}
    for ($r = 2; $r -le $regArr.GetLength(0); $r++) {
        $v = (Norm $regArr[$r, $hdrMap['Product Variant']]).ToUpper()
        $raw = Norm $regArr[$r, $hdrMap['Daily Rate']]
        if ($v -ne '' -and $raw -ne '') {
            $rate = [double](($raw -replace '[$,]', ''))
            if ($rate -gt 0 -and -not $regRates.ContainsKey($v)) { $regRates[$v] = $rate }
        }
    }

    function Get-Rate([string]$variant) {
        if ($variant -eq '') { return $null }
        if ($rates.ContainsKey($variant)) { return $rates[$variant] }
        if ($regRates.ContainsKey($variant)) { return $regRates[$variant] }
        foreach ($k in $regRates.Keys) {
            if ($k.Length -ge 8 -and ($variant.StartsWith($k) -or $k.StartsWith($variant))) { return $regRates[$k] }
        }
        return $null
    }

    # ---- RENTAL_STOCK: live on-hire picture -------------------------------
    $wbS = $app.Workbooks.Open($stockPath, 0, $true)
    $sArr = $wbS.Worksheets.Item('RENTAL_STOCK').UsedRange.Value2
    $sHdr = @{}
    for ($c = 1; $c -le $sArr.GetLength(1); $c++) { $sHdr[(Norm $sArr[1,$c])] = $c }
    $cSU = $sHdr['STORAGE_UNIT']; $cCo = $sHdr['COMPANY_NAME']; $cHi = $sHdr['HIRER_NAME']
    $cStat = $sHdr['ITEM_STATUS']
    $cVar = $null
    foreach ($k in $sHdr.Keys) { if ($k.Trim() -eq 'PRODUCT_VARIANT') { $cVar = $sHdr[$k] } }
    $cBc = $null
    foreach ($k in $sHdr.Keys) { if ($k.Trim() -eq 'ITEM_BARCODE') { $cBc = $sHdr[$k] } }

    $plantVal = 0.0; $plantN = 0; $plantUnpriced = 0
    $plantIdleVal = 0.0; $plantIdleN = 0; $plantIdleUnpriced = 0   # parked in Site Plant Equipment pool, still on charge
    $toolVal = 0.0; $toolN = 0; $toolUnpriced = 0
    $infraVal = 0.0; $infraN = 0; $infraUnpriced = 0
    $gasFleet = 0

    for ($r = 2; $r -le $sArr.GetLength(0); $r++) {
        $su = (Norm $sArr[$r,$cSU]).ToUpper()
        $co = Norm $sArr[$r,$cCo]
        $hi = Norm $sArr[$r,$cHi]
        $status = if ($cStat) { (Norm $sArr[$r,$cStat]).ToUpper() } else { '' }
        $variant = if ($cVar) { (Norm $sArr[$r,$cVar]).ToUpper() } else { '' }
        $idlePool = ((NormKey $hi) -like '*SITEPLANTEQUIPMENT*')   # parked in the Site Plant Equipment (Coates) pool

        if ($su -eq 'CEMENT BARRIERS' -or $su -eq 'CEMENT RUBBISH CHUTES') {
            # site infrastructure - charged for the duration, goes to PLANT
            $rate = Get-Rate $variant
            if ($null -ne $rate) { $infraVal += $rate; $infraN++ } else { $infraUnpriced++ }
            continue
        }
        if ($su -eq 'GAS MONITORS') { $gasFleet++; continue }  # whole fleet charges

        if ($su -eq 'CEMENT SITE PLANT') {
            # Site plant on charge counts whether it is in use by a crew OR parked
            # in the Site Plant Equipment (Coates) pool and still being charged
            # (Andrew's direction 21 Jul 2026). Only plant that is genuinely OFF
            # charge - "Available for Hire", i.e. not On Hire and no company - is
            # excluded, and it is never mentioned.
            # Sub-hired welders (SUB... barcodes) are NEVER priced into Plant -
            # they are invoiced separately and carry their own Welders stream in
            # the Cost Snapshot (A. Fisher, 24 Jul 2026). Skip them even if
            # SiteIQ later gives them a variant that would match a rate.
            $bc = if ($cBc) { (Norm $sArr[$r,$cBc]).ToUpper() } else { '' }
            if ($bc.StartsWith('SUB')) { continue }
            if ($status -eq 'AVAILABLE FOR HIRE' -or ($status -ne 'ON HIRE' -and $co -eq '')) { continue }
            $rate = Get-Rate $variant
            if ($null -ne $rate) {
                $plantVal += $rate; $plantN++
                if ($idlePool) { $plantIdleVal += $rate; $plantIdleN++ }
            } else {
                $plantUnpriced++
                if ($idlePool) { $plantIdleUnpriced++ }
            }
            continue
        }

        if ($co -eq '') { continue }                 # everything else: not on hire
        if ($idlePool) { continue }                  # idle non-plant in the pool - not an in-use charge
        switch ($su) {
            'RADIOS' { }        # radios are the flat 70 x $12.81 - nothing per item
            default {
                $rate = Get-Rate $variant
                if ($null -ne $rate) { $toolVal += $rate; $toolN++ } else { $toolUnpriced++ }
            }
        }
    }
    $wbS.Close($false)

    $radioVal = 0.0
    if ($shift -ge $RADIO_START) { $radioVal = $RADIO_BILLABLE * $RADIO_RATE }
    # Gas: whole fleet, on hire or not, from GAS_START until the last day the
    # forecast column carries a gas charge (the "day stated on forecast").
    $gasVal = 0.0

    # ---- subhired gear (SUBHARVEY...): charged EVERY day between its
    # Start Hire and Off Hire/Finish dates, on hire in SiteIQ or not -------
    $subVal = 0.0; $subN = 0
    $cAsset = $hdrMap['Asset Number']; $cQty = $hdrMap['Qty']
    $cRate2 = $hdrMap['Daily Rate']; $cStart = $hdrMap['Start Hire']
    $cFin = $hdrMap['Finish Hire']; $cOff = $hdrMap['Off Hire Date']
    function Reg-Date([object]$dv) {
        if ($null -eq $dv -or $dv -eq '') { return $null }
        if ($dv -is [double]) { return [datetime]::FromOADate($dv).Date }
        try { return ([datetime]::Parse((Norm $dv))).Date } catch { return $null }
    }
    for ($r = 2; $r -le $regArr.GetLength(0); $r++) {
        $an = (Norm $regArr[$r, $cAsset]).ToUpper()
        if (-not $an.StartsWith('SUB')) { continue }
        $sd = Reg-Date $regArr[$r, $cStart]
        $ed = Reg-Date $regArr[$r, $cOff]
        if ($null -eq $ed) { $ed = Reg-Date $regArr[$r, $cFin] }
        if ($null -ne $sd -and $shift.Date -lt $sd) { continue }
        if ($null -ne $ed -and $shift.Date -gt $ed) { continue }
        $qv = Norm $regArr[$r, $cQty]; $rv = Norm $regArr[$r, $cRate2]
        if ($rv -eq '') { continue }
        $q = 1.0; if ($qv -ne '') { $q = [double](($qv -replace '[$,]', '')) }
        $subVal += $q * [double](($rv -replace '[$,]', ''))
        $subN++
    }
    $subVal = [math]::Round($subVal, 2)

    # Sub-hired welders are NOT added to Plant (or anywhere in this sheet):
    # they are invoiced separately and the Cost Snapshot tracks them in
    # their own Welders stream from SiteIQ movement evidence. $subVal is
    # kept only so the console can say what it saw. (A. Fisher, 24 Jul 2026)
    $plantTotal = [math]::Round($plantVal + $infraVal, 2)

    # ---- labour: Shutdown Costing roster cost for the shift date ----------
    $cost = $wb.Worksheets.Item('Shutdown Costing').ListObjects.Item('ShutdownCostingTable')
    $cArr = $cost.Range.Value2
    $cHdr = @{}
    for ($c = 1; $c -le $cArr.GetLength(1); $c++) { $cHdr[(Norm $cArr[1,$c])] = $c }
    $labourVal = 0.0; $labourN = 0
    $accVal = 0.0; $accN = 0
    $hasAccom = $cHdr.ContainsKey('Accom Cost')
    for ($r = 2; $r -le $cArr.GetLength(0); $r++) {
        $dv = $cArr[$r, $cHdr['Date']]
        if ($null -eq $dv) { continue }
        $d = $null
        if ($dv -is [double]) { $d = [datetime]::FromOADate($dv).Date }
        else { try { $d = ([datetime]::Parse((Norm $dv))).Date } catch { continue } }
        if ($d -eq $shift.Date) {
            $lc = Norm $cArr[$r, $cHdr['Labour Cost']]
            if ($lc -ne '') { $labourVal += [double](($lc -replace '[$,]', '')); $labourN++ }
            if ($hasAccom) {
                $ac = Norm $cArr[$r, $cHdr['Accom Cost']]
                if ($ac -ne '') { $accVal += [double](($ac -replace '[$,]', '')); $accN++ }
            }
        }
    }
    $labourVal = [math]::Round($labourVal, 2)
    $accVal = [math]::Round($accVal, 2)

    # ---- Daily Tracking (read once: gas forecast window + target row) -----
    $dt = $wb.Worksheets.Item('Daily Tracking').ListObjects.Item('DailyTrackingTable')
    $dtArr = $dt.Range.Value2
    $dHdr = @{}
    for ($c = 1; $c -le $dtArr.GetLength(1); $c++) { $dHdr[(Norm $dtArr[1,$c])] = $c }

    function DT-Date([object]$dv) {
        if ($null -eq $dv) { return $null }
        if ($dv -is [double]) { return [datetime]::FromOADate($dv).Date }
        try { return ([datetime]::Parse((Norm $dv))).Date } catch { return $null }
    }

    # gas charges until the last day the FORECAST carries a gas value
    $gasEnd = $null; $maxDate = $null
    for ($r = 2; $r -le $dtArr.GetLength(0); $r++) {
        $d = DT-Date $dtArr[$r, $dHdr['Date']]
        if ($null -eq $d) { continue }
        if ($null -eq $maxDate -or $d -gt $maxDate) { $maxDate = $d }
        $fc = Norm $dtArr[$r, $dHdr['Gas Monitor Hire F/C']]
        if ($fc -ne '') {
            $fcv = 0.0; [void][double]::TryParse(($fc -replace '[$,]', ''), [ref]$fcv)
            if ($fcv -gt 0 -and ($null -eq $gasEnd -or $d -gt $gasEnd)) { $gasEnd = $d }
        }
    }
    if ($null -eq $gasEnd) { $gasEnd = $maxDate }   # no gas forecast yet - use last tracking day
    if ($shift -ge $GAS_START -and $shift -le $gasEnd) { $gasVal = [math]::Round($gasFleet * $GAS_RATE, 2) }

    Write-Output ""
    Write-Output ("Computed for {0}:" -f $shift.ToString('dd MMM yyyy'))
    $plantInUseN = $plantN - $plantIdleN
    Write-Output ("  Plant Equipment Hire Actual : {0,10:C2}  ({1} in use + {2} idle-but-charged + {3} barrier/chute items)" -f $plantTotal, $plantInUseN, $plantIdleN, $infraN)
    if ($plantIdleN -gt 0) {
        Write-Output ("       of which idle pool     : {0,10:C2}  ({1} items parked in Site Plant Equipment, still on charge - cost-saving watch)" -f [math]::Round($plantIdleVal,2), $plantIdleN)
    }
    Write-Output ("  Tooling Hire Actual         : {0,10:C2}  ({1} items on hire)" -f [math]::Round($toolVal,2), $toolN)
    Write-Output ("  Radio Hire Actual           : {0,10:C2}  ({1} billable handsets, 2 spares unbilled)" -f $radioVal, $RADIO_BILLABLE)
    Write-Output ("  Gas Monitor Hire Actual     : {0,10:C2}  ({1}-unit fleet x {2:C2}, on hire or not, {3} to {4})" -f $gasVal, $gasFleet, $GAS_RATE, $GAS_START.ToString('dd MMM'), $gasEnd.ToString('dd MMM'))
    Write-Output ("  Personnel / Labour Actual   : {0,10:C2}  ({1} roster lines)" -f $labourVal, $labourN)
    Write-Output ("  Accommodation Actual        : {0,10:C2}  ({1} roster line(s))" -f $accVal, $accN)
    if ($subN -gt 0) {
        Write-Output ("  Subhired welders (register) : {0,10:C2}  ({1} SUB asset(s)) - NOT added to Plant; they carry their own Welders stream in the Cost Snapshot" -f $subVal, $subN)
    }
    $skipped = $plantUnpriced + $toolUnpriced + $infraUnpriced
    if ($skipped -gt 0) {
        Write-Output ("  NOTE: {0} on-hire item(s) have no rate on file and are excluded - never estimated." -f $skipped)
    }

    # ---- write into Daily Tracking ---------------------------------------
    $rowIx = 0
    for ($r = 2; $r -le $dtArr.GetLength(0); $r++) {
        $d = DT-Date $dtArr[$r, $dHdr['Date']]
        if ($null -ne $d -and $d -eq $shift.Date) { $rowIx = $r; break }
    }
    if ($rowIx -eq 0) {
        throw ("Daily Tracking has no row for {0} - add the date row in the workbook and run again." -f $shift.ToString('dd MMM yyyy'))
    }

    $writes = @(
        @{ Col = 'Plant Equipment Hire Actual'; Val = $plantTotal },
        @{ Col = 'Tooling Hire Actual';         Val = [math]::Round($toolVal,2) },
        @{ Col = 'Radio Hire Actual';           Val = $radioVal },
        @{ Col = 'Gas Monitor Hire Actual';     Val = $gasVal },
        @{ Col = 'Personnel / Labour Actual';   Val = $labourVal },
        @{ Col = 'Accommodation Actual';        Val = $accVal }
    )
    Write-Output ""
    $tlRow = $dt.Range.Row + $rowIx - 1
    foreach ($w in $writes) {
        $tlCol = $dt.Range.Column + $dHdr[$w.Col] - 1
        $cell = $wb.Worksheets.Item('Daily Tracking').Cells.Item($tlRow, $tlCol)
        $existing = $cell.Value2
        if ($null -ne $existing -and (Norm $existing) -ne '' -and -not $Force) {
            Write-Output ("  SKIPPED {0}: already holds {1} (rerun with -Force to overwrite)" -f $w.Col, $existing)
        } else {
            $cell.Value2 = $w.Val
            Write-Output ("  WROTE   {0} = {1:C2}" -f $w.Col, $w.Val)
        }
    }
    $app.CalculateFull()
    $wb.Save()
    $wb.Close($false)
    Write-Output ""
    Write-Output "Saved. Transport and Damage remain manual entries."
    Write-Output "Honest limits: rates are contracted base rates (register fallback);"
    Write-Output "unpriced items are excluded, never estimated. Values reflect the"
    Write-Output "RENTAL_STOCK export as at its file time - refresh the export first"
    Write-Output "for a true end-of-shift picture."
}
catch {
    Write-Output ""
    Write-Output ("PROBLEM: " + $_.Exception.Message)
    Write-Output "Usual causes: the workbook or an export is open in Excel (close it),"
    Write-Output "or a file is missing from this folder - then run again."
    exit 1
}
finally {
    $app.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app) | Out-Null
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
