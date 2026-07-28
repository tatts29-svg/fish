# ==========================================================================
#  COATES | K2 ALIGN EXCEL DATA - one story, both places
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  THE JOB (A. Fisher, 24 Jul 2026): the Excel command centre must show the
#  SAME TRUE DATA as the report suite - every morning, wherever the folder
#  lives. This script:
#
#    1. Backs the workbook up (dated copy, Reports\<date>\Excel_Backups\).
#    2. Writes the folder path into Control Config SOURCE_PATH - the
#       workbook's OWN override cell ("type a folder path over this
#       formula") - so Power Query refreshes from THIS folder, killing the
#       SharePoint/https refresh errors at the root.
#    3. Refreshes ALL data (the same Refresh All you do by hand).
#    4. Trues up the cells the old macros used to write and the pasted
#       zeros that had gone stale:
#         - refresh stamp + status (Dashboard Data H1/H2)
#         - live query error count (Control Config B20, read from the
#           workbook's own live detector on the Controls sheet)
#         - the radio / radio-battery rows on the dashboard (live from
#           the workbook's own refreshed register tables)
#         - the Company Accountability table, rebuilt LIVE for every
#           company holding gear (manual follow-up notes preserved,
#           matched by company name)
#         - the forecast sensitivity figures (computed, not pasted)
#         - replacement costs + display descriptions in the tooling,
#           Milwaukee and plant on-hire tabs from the MASTER file
#           (K2_MASTER_EQUIPMENT_PRICING.xlsx - item number keyed),
#           so the Excel prices match the reports to the cent
#    5. Saves, then the launcher runs the parity check
#       (verify_excel_alignment.py) - proof on screen that Excel = reports.
#
#  NEVER TOUCHED: queries, layouts, tabs, roster, Daily Tracking, your
#  manual entries (transport/damage actuals, HSE approval, receipt dates),
#  radio/gas register descriptions (they carry serial numbers).
#  Formulas are never overwritten EXCEPT the two cells the workbook itself
#  designates for override/system writes (SOURCE_PATH, QUERY_ERROR_COUNT),
#  one label-broken battery-fleet lookup that structurally cannot
#  work (N11), and ONE repaired formula: the critical-returns tile
#  (Dashboard Data H10), which counted radio batteries as critical
#  assets - the reports never have. Repaired to the same COUNTIF pattern
#  with batteries excluded; it stays a live formula.
#  The query-written 'Days On Hire' VALUES are recomputed each run from
#  each row's own On Hire Date ((today - on-hire) + 1, the reports'
#  counting) - armour for any connection that dodges Refresh All.
#  Each write is reported on screen every run.
#
#  Usage:  double-click 13_ALIGN_EXCEL_DATA.bat   (or 00_RUN_EVERYTHING)
#          powershell -ExecutionPolicy Bypass -File ALIGN_EXCEL_DATA.ps1
# ==========================================================================

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$RADIO_RATE = 12.81
$GAS_RATE = 29.75
$SHUT_DAYS = 23

function Find-Newest([string]$pattern, [string]$what, [switch]$Optional) {
    $dirs = @((Join-Path $here 'Data_SiteIQ'), $here) | Where-Object { Test-Path $_ }
    $hits = @()
    foreach ($d in $dirs) {
        $hits += Get-ChildItem -Path $d -File -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -notlike '~$*' -and
            (($_.Name -replace '[ _]', '') -like (($pattern -replace '[ _]', '')))
        }
    }
    if (-not $hits) {
        if ($Optional) { return $null }
        throw ("Couldn't find {0}. Looked for {1} beside this script (and Data_SiteIQ). Drop the file there and run again." -f $what, $pattern)
    }
    ($hits | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

function Set-Com([scriptblock]$action, [int]$tries = 8, [string]$label = '') {
    # Excel can stay 'busy' for a while after a big Refresh All and reject
    # COM calls with mangled cast errors - retry with growing backoff
    # (same battle-proven wrapper as REFRESH_BILLING_RECONCILIATION).
    for ($t = 1; $t -le $tries; $t++) {
        try { return & $action }
        catch {
            if ($t -eq $tries) {
                if ($label -ne '') { Write-Output (' ! COM write failed after retries: {0}' -f $label) }
                throw
            }
            Start-Sleep -Milliseconds (150 * $t)
        }
    }
}

# --- the cell writer -------------------------------------------------------
# History on this machine: plain $range.Value2 = <number> threw 'Unable to
# cast Double to String' after the first TEXT write of the session (the
# PowerShell setter path locks onto the first type it sees), and the
# .PSBase.GetType() reflection detour threw 'Object does not match target
# type' (25 Jul 2026, 05:27 run). So the write now happens inside a tiny
# COMPILED .NET helper - PowerShell hands over the cell and the value and
# is otherwise not involved. If the corporate machine refuses the one-off
# compile, a corrected direct-reflection call takes over. Either way a
# refused write can NEVER kill the run any more: it is reported, counted,
# and the script carries on - the refresh and the save always happen.
$script:XlDirect = $false
try {
    Add-Type -ErrorAction Stop -TypeDefinition @'
using System;
using System.Reflection;
public static class CoatesXl {
    public static void SetV2(object rng, object val) {
        rng.GetType().InvokeMember("Value2", BindingFlags.SetProperty, null, rng, new object[] { val });
    }
    public static void SetFormula(object rng, string f) {
        rng.GetType().InvokeMember("Formula", BindingFlags.SetProperty, null, rng, new object[] { f });
    }
}
'@
    $script:XlDirect = $true
} catch { $script:XlDirect = $false }

$script:wfail = 0
function WSet([object]$target, $val, [string]$label = '') {
    # numbers travel as Double, everything else as-is (strings stay strings)
    if ($val -is [int] -or $val -is [long] -or $val -is [int16] -or
        $val -is [decimal] -or $val -is [single]) { $val = [double]$val }
    try {
        Set-Com {
            if ($script:XlDirect) {
                [CoatesXl]::SetV2($target, $val)
            } else {
                $raw = [System.Management.Automation.PSObject]::AsPSObject($target).BaseObject
                [void]$raw.GetType().InvokeMember(
                    'Value2', [System.Reflection.BindingFlags]::SetProperty,
                    $null, $raw, @($val))
            }
        } -label $label
    } catch {
        $script:wfail++
        Write-Output (' ! write refused ({0}) - carrying on: {1}' -f $label, $_.Exception.Message)
    }
}

function WCell([object]$ws, [string]$a1, $val, [string]$label = '') {
    WSet ($ws.Range($a1)) $val $label
}

function WFormula([object]$target, [string]$f, [string]$label = '') {
    # same direct-dispatch write, but for a FORMULA (used once, for the
    # one dashboard formula whose logic contradicts the reports - below)
    try {
        Set-Com {
            if ($script:XlDirect) {
                [CoatesXl]::SetFormula($target, $f)
            } else {
                $raw = [System.Management.Automation.PSObject]::AsPSObject($target).BaseObject
                [void]$raw.GetType().InvokeMember(
                    'Formula', [System.Reflection.BindingFlags]::SetProperty,
                    $null, $raw, @($f))
            }
        } -label $label
    } catch {
        $script:wfail++
        Write-Output (' ! write refused ({0}) - carrying on: {1}' -f $label, $_.Exception.Message)
    }
}

function Wait-ExcelReady([object]$xl, [int]$maxSec = 90) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $maxSec) {
        $ready = $true
        try { $ready = [bool]$xl.Ready } catch { $ready = $false }
        if ($ready) {
            $busy = $false
            try { if ($xl.CalculationState -ne 0) { $busy = $true } } catch { }
            if (-not $busy) { return }
        }
        Start-Sleep -Milliseconds 500
    }
}

function Norm([object]$v) { if ($null -eq $v) { '' } else { ([string]$v).Trim() } }
function Num([object]$v) { if ($null -eq $v -or $v -eq '') { 0.0 } else { try { [double]$v } catch { 0.0 } } }

Write-Output '=============================================================='
Write-Output ' COATES | K2 ALIGN EXCEL DATA - one story, both places'
Write-Output (' Run: {0}' -f (Get-Date -Format 'dd MMM yyyy HH:mm'))
Write-Output ' Author: Andrew Fisher | POWERED BY SITEIQ'
Write-Output '=============================================================='

$wbPath = Find-Newest 'Cement_Australia_Report*K2*.xlsm' 'the K2 report workbook'
$masterPath = Find-Newest 'K2_MASTER_EQUIPMENT_PRICING*.xlsx' 'the master equipment file' -Optional
$stockPath = Find-Newest 'RENTAL_STOCK*.xlsx' 'the RENTAL_STOCK export' -Optional

# ---- 0. the workbook's queries read its OWN folder - keep the six
#         SiteIQ exports synced from Data_SiteIQ\ to the suite root so
#         the 'K2 source folder not found' box can never appear ---------
$dsq = Join-Path $here 'Data_SiteIQ'
if (Test-Path $dsq) {
    $synced = 0
    foreach ($pat in @('RENTAL_STOCK*.xlsx', 'ON_HIRE*.xlsx',
                       'TRANSACTIONS*.xlsx', 'SALES_STOCK*.xlsx',
                       'STOCKTAKE*.xlsx', 'DAILY_SUMMARY*.xlsx')) {
        foreach ($f in (Get-ChildItem -Path $dsq -Filter $pat -File -ErrorAction SilentlyContinue)) {
            if ($f.Name -like '~$*') { continue }
            $dest = Join-Path $here $f.Name
            if (-not (Test-Path $dest) -or
                ((Get-Item $dest).LastWriteTime -lt $f.LastWriteTime)) {
                Copy-Item -Path $f.FullName -Destination $dest -Force
                $synced++
            }
        }
    }
    if ($synced -gt 0) {
        Write-Output (' Sources  : {0} SiteIQ export(s) synced beside the workbook' -f $synced)
    }
}

# ---- 1. dated backup FIRST - belt and braces ------------------------------
$dayDir = Join-Path $here ('Reports\' + (Get-Date -Format 'yyyy-MM-dd'))
$bakDir = Join-Path $dayDir 'Excel_Backups'
New-Item -ItemType Directory -Force -Path $bakDir | Out-Null
$bakName = ([IO.Path]::GetFileNameWithoutExtension($wbPath) + '_' +
            (Get-Date -Format 'HHmm') + '.xlsm')
Copy-Item -Path $wbPath -Destination (Join-Path $bakDir $bakName) -Force
Write-Output (' Backup   : Reports\{0}\Excel_Backups\{1}' -f (Get-Date -Format 'yyyy-MM-dd'), $bakName)

$app = New-Object -ComObject Excel.Application
# NEW COMPUTER? Set COATES_EXCEL_VISIBLE=1 (20_ALIGN_EXCEL_VISIBLE.bat does
# it for you) and Excel runs ON SCREEN, so first-run dialogs - licence,
# sign-in, Protected View, Power Query credentials - are visible and
# clickable instead of freezing the run behind an invisible window.
# (Andrew's new laptop, 27 Jul 2026.)
$app.Visible = ($env:COATES_EXCEL_VISIBLE -eq '1')
$app.DisplayAlerts = $false
$app.EnableEvents = $false
$app.AutomationSecurity = 3

try {
    # ---- master + barcode map: staged as CSV by _align_prep.py (no COM
    #      reads - corporate Excel dialogs and sensitivity-label prompts
    #      can't wedge this). Missing CSV just skips the price true-up. --
    $master = @{}
    $csvPath = Join-Path $here '_align_master.csv'
    if (Test-Path $csvPath) {
        foreach ($row in (Import-Csv -Path $csvPath)) {
            $rec = @{ item = $row.item; new = $row.new_desc; src = $row.source; price = $null }
            if ($row.price -ne $null -and "$($row.price)" -ne '') {
                try { $rec.price = [double]$row.price } catch { }
            }
            $master[$row.barcode.ToUpper()] = $rec
        }
        Write-Output (' Master   : {0} staged rows loaded (via _align_prep.py - no Excel needed)' -f $master.Count)
    } else {
        Write-Output ' Master   : _align_master.csv not found - run 13_ALIGN_EXCEL_DATA.bat (it stages it first). Price/name true-up skipped this run.'
    }

    function MasterFor([string]$barcode) {
        if ($null -eq $barcode -or $barcode -eq '') { return $null }
        $key = $barcode.Trim().ToUpper()
        if ($master.ContainsKey($key)) { return $master[$key] }
        return $null
    }

    # ---- open the workbook (retry - a wedged hidden Excel or a
    #      sensitivity-label prompt can refuse the first attempt) ----------
    $excelBefore = @(Get-Process EXCEL -ErrorAction SilentlyContinue)
    if ($excelBefore.Count -gt 1) {
        Write-Output (' Note     : {0} Excel process(es) already running - if the open below fails, close EVERY Excel window (Task Manager > EXCEL.EXE if one is hiding) and run this again.' -f $excelBefore.Count)
    }
    $wb = $null
    for ($try = 1; $try -le 3; $try++) {
        try {
            $wb = $app.Workbooks.Open($wbPath, 0, $false)
            break
        } catch {
            if ($try -eq 3) {
                Write-Output ''
                Write-Output ' ! Excel refused to open the K2 workbook three times.'
                Write-Output '   Fix: close EVERY Excel window - including hidden ones'
                Write-Output '   (Task Manager > Details > EXCEL.EXE > End task), then'
                Write-Output '   double-click 13_ALIGN_EXCEL_DATA.bat again.'
                throw
            }
            Start-Sleep -Seconds 3
        }
    }
    Write-Output (' Workbook : {0}' -f [IO.Path]::GetFileName($wbPath))
    if ($wb.ReadOnly) {
        Write-Output ''
        Write-Output ' ! The workbook opened READ-ONLY - it is open in another'
        Write-Output '   Excel window right now. Close EVERY Excel window'
        Write-Output '   (Task Manager > Details > EXCEL.EXE > End task if one'
        Write-Output '   is hiding) and run this again. Nothing was changed.'
        throw 'workbook is open elsewhere'
    }

    # ---- 2. SOURCE_PATH override (the workbook's own input cell) ----------
    $cfg = $wb.Worksheets.Item('Control Config')
    $folder = $here
    if (-not $folder.EndsWith('\')) { $folder = $folder + '\' }
    $w0 = $script:wfail
    WCell $cfg ('B23') ($folder) 'SOURCE_PATH B23'
    if ($script:wfail -eq $w0) {
        Write-Output (' Source   : SOURCE_PATH -> {0}' -f $folder)
    } else {
        Write-Output ' Source   : write refused - no matter, the exports sit beside the workbook (step 0 syncs them), refresh carries on.'
    }

    # ---- 3. Refresh All + wait -------------------------------------------
    # Every connection is forced to FOREGROUND first so the refresh truly
    # finishes before the save. Then - because a connection whose 'include
    # in Refresh All' box is unticked gets silently SKIPPED by RefreshAll
    # (exactly how the tooling day-counts sat frozen on 22 Jul through
    # three 'successful' refreshes, 25 Jul 2026) - every connection is
    # also refreshed INDIVIDUALLY, one by one, errors reported not fatal.
    foreach ($cn in @($wb.Connections)) {
        try { if ($null -ne $cn.OLEDBConnection) { $cn.OLEDBConnection.BackgroundQuery = $false } } catch { }
        try { if ($null -ne $cn.ODBCConnection) { $cn.ODBCConnection.BackgroundQuery = $false } } catch { }
    }
    Write-Output ' Refresh  : Refresh All running (Power Query, foreground)...'
    try { $wb.RefreshAll() } catch {
        Write-Output (' ! Refresh All grumbled - individual refreshes below still run: {0}' -f $_.Exception.Message)
    }
    try { $app.CalculateUntilAsyncQueriesDone() } catch { }
    $tries = 0
    while ($tries -lt 60) {
        Start-Sleep -Milliseconds 500
        $busy = $false
        try { if ($app.CalculationState -ne 0) { $busy = $true } } catch { }
        if (-not $busy) { break }
        $tries++
    }
    #  A DERIVED query (one built on another query rather than on a file)
    #  cannot be refreshed on its own - Excel says "references other
    #  queries or steps". That is not a failure: Refresh All has already
    #  done it through its parent. It used to print eleven '!' lines
    #  every morning and read like eleven broken things, which made the
    #  log easy to ignore - and a log you ignore is worse than no log.
    #  Now the expected ones are counted quietly and only a REAL refusal
    #  gets a '!'. (Andrew, 27 Jul 2026.)
    $nCn = 0; $nCnFail = 0; $nDerived = 0; $derivedNames = @()
    foreach ($cn in @($wb.Connections)) {
        try { $cn.Refresh(); $nCn++ }
        catch {
            try { $cnName = $cn.Name } catch { $cnName = '?' }
            $msg = ''
            try { $msg = $_.Exception.Message } catch { }
            if ($msg -match 'references other queries|rebuild this data combination|data combination') {
                $nDerived++
                $derivedNames += $cnName
            } else {
                $nCnFail++
                Write-Output (' ! connection refused a direct refresh: {0}' -f $cnName)
                if ($msg) { Write-Output ('   reason: {0}' -f ($msg -replace '\s+', ' ').Trim()) }
            }
        }
    }
    Write-Output (' Refresh  : {0} connection(s) refreshed one-by-one.' -f $nCn)
    if ($nDerived -gt 0) {
        Write-Output (' Refresh  : {0} built-on-another query(s) already done via their parent - normal:' -f $nDerived)
        Write-Output ('            {0}' -f ($derivedNames -join ', '))
    }
    if ($nCnFail -gt 0) {
        Write-Output (' Refresh  : {0} connection(s) genuinely refused - see the ! lines above.' -f $nCnFail)
    } else {
        Write-Output ' Refresh  : nothing genuinely refused - every source is in.'
    }
    try { $app.CalculateUntilAsyncQueriesDone() } catch { }
    try { $app.CalculateFullRebuild() } catch { try { $app.CalculateFull() } catch { } }
    Wait-ExcelReady $app
    Start-Sleep -Seconds 2
    Write-Output ' Refresh  : done.'

    # ---- fresh session for the writes: whatever state a big Refresh All
    #      leaves in Excel's COM surface, a clean reopen is EXACTLY the
    #      conditions PREFILL writes under every morning without fail -----
    $wb.Save()
    $wb.Close($false)
    $app.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
    Start-Sleep -Seconds 2
    $app = New-Object -ComObject Excel.Application
    # NEW COMPUTER? Set COATES_EXCEL_VISIBLE=1 (20_ALIGN_EXCEL_VISIBLE.bat does
# it for you) and Excel runs ON SCREEN, so first-run dialogs - licence,
# sign-in, Protected View, Power Query credentials - are visible and
# clickable instead of freezing the run behind an invisible window.
# (Andrew's new laptop, 27 Jul 2026.)
$app.Visible = ($env:COATES_EXCEL_VISIBLE -eq '1')
    $app.DisplayAlerts = $false
    $app.EnableEvents = $false
    $app.AutomationSecurity = 3
    $wb = $null
    for ($try = 1; $try -le 3; $try++) {
        try { $wb = $app.Workbooks.Open($wbPath, 0, $false); break }
        catch { if ($try -eq 3) { throw }; Start-Sleep -Seconds 3 }
    }
    # if any connection is set to refresh-on-open it fires now, in the
    # fresh session - let it finish so the writes never race a query
    try { $app.CalculateUntilAsyncQueriesDone() } catch { }
    Wait-ExcelReady $app
    if ($wb.ReadOnly) {
        Write-Output ' ! Workbook came back READ-ONLY after the refresh save - an Excel window grabbed it in between. Close every Excel window and run again; the refresh IS saved.'
        throw 'workbook reopened read-only'
    }
    $cfg = $wb.Worksheets.Item('Control Config')
    Write-Output ' Session  : reopened fresh for the true-up writes.'

    # ---- 4a. refresh stamp + status + live error count -------------------
    $dd = $wb.Worksheets.Item('Dashboard Data')
    WCell $dd ('H1') ((Get-Date).ToOADate()) 'dd.Range(H1).Value2'
    WCell $dd ('H2') ('READY') 'dd.Range(H2).Value2'
    $ctrl = $wb.Worksheets.Item('Controls & Exceptions')
    $liveErrors = Num $ctrl.Range('D13').Value2   # the sheet's own live detector
    WCell $cfg ('B20') ($liveErrors) 'cfg.Range(B20).Value2'
    Write-Output (' Stamp    : refresh {0}  |  live query errors: {1} (was the dead macro count)' -f (Get-Date -Format 'dd MMM HH:mm'), $liveErrors)

    # ---- helper: read a ListObject into rows of hashtables ----------------
    function TableRows([object]$sheet, [string]$tableName) {
        $lo = $sheet.ListObjects.Item($tableName)
        $out = @()
        if ($null -eq $lo.DataBodyRange) { return , $out }
        $vals = $lo.DataBodyRange.Value2
        $cols = @{}
        for ($c = 1; $c -le $lo.ListColumns.Count; $c++) { $cols[$lo.ListColumns.Item($c).Name] = $c }
        $nR = $lo.DataBodyRange.Rows.Count
        for ($r = 1; $r -le $nR; $r++) {
            $row = @{}
            foreach ($k in $cols.Keys) { $row[$k] = $vals[$r, $cols[$k]] }
            $out += , $row
        }
        return , $out
    }

    function DaysOn([object]$ohDate) {
        if ($null -eq $ohDate -or "$ohDate" -eq '') { return 0 }
        try {
            $d = [datetime]::FromOADate([double]$ohDate)
        } catch {
            try { $d = [datetime]$ohDate } catch { return 0 }
        }
        return ((Get-Date).Date - $d.Date).Days + 1
    }

    # ---- register sheets ---------------------------------------------------
    $toolSheet = $wb.Worksheets.Item('Tooling Onhire.')
    $milwSheet = $wb.Worksheets.Item('Milwaukee Onhire')
    $radSheet = $wb.Worksheets.Item('Radios Onhire')
    $gasSheet = $wb.Worksheets.Item('Gas Monitors Onhire')
    $plantSheet = $wb.Worksheets.Item('Plant Onhire')

    # ---- 4b. master prices + display names FIRST --------------------------
    # ORDER MATTERS: the master prices go into the register tables BEFORE
    # anything reads them, so accountability exposure and the sensitivity
    # figures are built from mastered prices - the same prices the reports
    # use. (25 Jul 2026: exposures were written one step stale.)
    if ($master.Count -gt 0) {
        $nPrice = 0; $nName = 0
        function TrueUpTable([object]$sheet, [string]$tableName, [string]$bcCol,
                             [string]$descCol, [string]$replCol, [string]$basisCol) {
            $lo = $sheet.ListObjects.Item($tableName)
            if ($null -eq $lo.DataBodyRange) { return }
            $cols = @{}
            for ($c = 1; $c -le $lo.ListColumns.Count; $c++) { $cols[$lo.ListColumns.Item($c).Name] = $c }
            $nR = $lo.DataBodyRange.Rows.Count
            for ($r = 1; $r -le $nR; $r++) {
                $bc = Norm $lo.DataBodyRange.Cells.Item($r, $cols[$bcCol]).Value2
                $rec = MasterFor $bc
                if ($null -eq $rec) { continue }
                if ($replCol -ne '' -and $cols.ContainsKey($replCol) -and $null -ne $rec.price) {
                    $rr2 = $r; WSet ($lo.DataBodyRange.Cells.Item($rr2, $cols[$replCol])) ($rec.price) 'master price'
                    if ($basisCol -ne '' -and $cols.ContainsKey($basisCol)) {
                        $rr3 = $r; WSet ($lo.DataBodyRange.Cells.Item($rr3, $cols[$basisCol])) ('master file') 'master basis'
                    }
                    $script:nPrice++
                }
                if ($descCol -ne '' -and $cols.ContainsKey($descCol) -and $rec.new -ne '') {
                    $rr4 = $r; WSet ($lo.DataBodyRange.Cells.Item($rr4, $cols[$descCol])) ($rec.new) 'master name'
                    $script:nName++
                }
            }
        }
        TrueUpTable $toolSheet 'Tooling_Onhire__4' 'Barcode' 'Item Description' 'Replacement Cost' 'Replacement Price Basis'
        TrueUpTable $milwSheet 'RENTAL_STOCK__3' 'Barcode' '' 'Replacement Cost' ''
        TrueUpTable $plantSheet 'Tooling_Onhire__3' 'Barcode' 'Item Description' '' ''
        Write-Output (' Master   : {0} prices + {1} display names trued into the on-hire tabs' -f $nPrice, $nName)
        Write-Output '            (radio / gas rows untouched - their descriptions carry serial numbers)'
    }

    # ---- 4c. day-counts trued to TODAY -------------------------------------
    # The 'Days On Hire' column is query output - values, not formulas -
    # and when a connection dodges the refresh those values keep counting
    # from the day they were last computed (the frozen 22 Jul bands). The
    # dashboard's band COUNTIFs and the critical tile all read this column,
    # so it is recomputed here from each row's own On Hire Date, exactly
    # the way the reports count: (today - on-hire) + 1, day one inclusive.
    # Idempotent when the refresh already did its job.
    function TrueUpDays([object]$sheet, [string]$tableName) {
        $lo = $sheet.ListObjects.Item($tableName)
        if ($null -eq $lo.DataBodyRange) { return 0 }
        $cols = @{}
        for ($c = 1; $c -le $lo.ListColumns.Count; $c++) { $cols[$lo.ListColumns.Item($c).Name] = $c }
        if (-not ($cols.ContainsKey('On Hire Date') -and $cols.ContainsKey('Days On Hire'))) { return 0 }
        $n = 0
        $nR = $lo.DataBodyRange.Rows.Count
        for ($r = 1; $r -le $nR; $r++) {
            $d = DaysOn ($lo.DataBodyRange.Cells.Item($r, $cols['On Hire Date']).Value2)
            if ($d -le 0) { continue }
            $cur = Num ($lo.DataBodyRange.Cells.Item($r, $cols['Days On Hire']).Value2)
            if ($cur -ne $d) {
                $rr5 = $r; WSet ($lo.DataBodyRange.Cells.Item($rr5, $cols['Days On Hire'])) ($d) 'days true-up'
                $n++
            }
        }
        return $n
    }
    $nD = 0
    $nD += TrueUpDays $toolSheet 'Tooling_Onhire__4'
    $nD += TrueUpDays $milwSheet 'RENTAL_STOCK__3'
    $nD += TrueUpDays $radSheet 'Radios_Onhire'
    $nD += TrueUpDays $gasSheet 'Gas_Monitors_Onhire'
    $nD += TrueUpDays $plantSheet 'Tooling_Onhire__3'
    if ($nD -gt 0) {
        Write-Output (' Days     : {0} day-count(s) were still counting from an older day - trued to today (bands + critical tile now honest).' -f $nD)
    } else {
        Write-Output ' Days     : every day-count already counting from today.'
    }

    # ---- 4d. the one broken tile formula -----------------------------------
    # Dashboard Data H10 (the CRITICAL RETURNS 4+ DAYS tile) counted radio
    # BATTERIES as critical assets. The reports never have - critical means
    # tooling, Milwaukee, radio handsets and gas monitors. Repaired once to
    # the same COUNTIF pattern with batteries excluded; still a live
    # formula, so it keeps working on any manual refresh too.
    $fxWant = '=COUNTIF(Tooling_Onhire__4[Days On Hire],">=4")+COUNTIF(RENTAL_STOCK__3[Days On Hire],">=4")+COUNTIFS(Radios_Onhire[Days On Hire],">=4",Radios_Onhire[Asset Type ID],"<>RADIO_BATTERY")+COUNTIF(Gas_Monitors_Onhire[Days On Hire],">=4")'
    $fxNow = ''
    try { $fxNow = [string]$dd.Range('H10').Formula } catch { }
    if ($fxNow -ne $fxWant) {
        WFormula ($dd.Range('H10')) ($fxWant) 'critical tile formula'
        Write-Output ' Tile     : critical-returns tile no longer counts radio batteries (one formula repaired, disclosed).'
    }

    # ---- register tables (mastered + day-trued, read once) -----------------
    $toolRows = TableRows $toolSheet 'Tooling_Onhire__4'
    $milwRows = TableRows $milwSheet 'RENTAL_STOCK__3'
    $radRows = TableRows $radSheet 'Radios_Onhire'
    $gasRows = TableRows $gasSheet 'Gas_Monitors_Onhire'

    $handsets = @($radRows | Where-Object { (Norm $_['Asset Type ID']) -ne 'RADIO_BATTERY' })
    $batts = @($radRows | Where-Object { (Norm $_['Asset Type ID']) -eq 'RADIO_BATTERY' })

    # ---- 4e. dashboard radio / battery rows (were pasted zeros) -----------
    $pe = $wb.Worksheets.Item('Plant Equipment')
    $radioFleetCharge = Num $pe.Range('G187').Value2      # 72 x 12.81 daily fleet charge
    $battFleetQty = Num $pe.Range('E188').Value2          # tracked batteries on site
    $lu = $wb.Worksheets.Item('Live Utilisation')
    $periodDays = Num $lu.Range('C2').Value2
    if ($periodDays -le 0) { $periodDays = 12 }

    WCell $dd ('K10') ($handsets.Count) 'dd.Range(K10).Value2'
    WCell $dd ('L10') ($radioFleetCharge) 'dd.Range(L10).Value2'
    WCell $dd ('M10') ($radioFleetCharge * $periodDays) 'dd.Range(M10).Value2'
    WCell $dd ('K11') ($batts.Count) 'dd.Range(K11).Value2'
    WCell $dd ('L11') (0) 'dd.Range(L11).Value2'
    WCell $dd ('M11') (0) 'dd.Range(M11).Value2'
    # N11's SUMIFS can never match (the bulk row label carries a note) -
    # the true tracked quantity is written as a value, refreshed every run.
    WCell $dd ('N11') ($battFleetQty) 'dd.Range(N11).Value2'
    Write-Output (' Radios   : {0} handsets out | {1} batteries out | fleet charge {2:N2}/day | battery fleet {3}' -f $handsets.Count, $batts.Count, $radioFleetCharge, $battFleetQty)

    # K2 Dashboard return-discipline rows 19 (Radios) / 20 (Radio Batteries)
    function BandCounts($rows) {
        $o2 = 0; $h3 = 0; $c4 = 0
        foreach ($r in $rows) {
            $d = DaysOn $r['On Hire Date']
            if ($d -eq 2) { $o2++ } elseif ($d -eq 3) { $h3++ } elseif ($d -ge 4) { $c4++ }
        }
        return @($o2, $h3, $c4)
    }
    $kd = $wb.Worksheets.Item('K2 Dashboard')
    $rb = BandCounts $handsets
    $radExpo = 0.0
    foreach ($r in $handsets) { $radExpo += Num $r['Replacement Cost'] }
    WCell $kd ('B19') ($handsets.Count) 'kd.Range(B19).Value2'
    WCell $kd ('C19') ($radExpo) 'kd.Range(C19).Value2'
    WCell $kd 'D19' ($rb[0]) 'D19'
    WCell $kd 'E19' ($rb[1]) 'E19'
    WCell $kd 'F19' ($rb[2]) 'F19'
    $bb = BandCounts $batts
    WCell $kd ('B20') ($batts.Count) 'kd.Range(B20).Value2'
    WCell $kd ('C20') (0) 'kd.Range(C20).Value2'
    WCell $kd 'D20' ($bb[0]) 'D20'
    WCell $kd 'E20' ($bb[1]) 'E20'
    WCell $kd 'F20' ($bb[2]) 'F20'

    # ---- 4f. Company Accountability rebuilt LIVE --------------------------
    # (runs AFTER the master price true-up, so every exposure figure here
    #  is built from the same mastered prices the reports use)
    $ca = $wb.Worksheets.Item('Company Accountability')
    $caT = $ca.ListObjects.Item('CompanyAccountabilityTable')
    # preserve manual columns by company (T..X = Action Owner..Notes)
    $manual = @{}
    foreach ($row in (TableRows $ca 'CompanyAccountabilityTable')) {
        $comp = Norm $row['Company']
        if ($comp -ne '') {
            $manual[$comp] = @(
                $row['Action Owner'], $row['Action Due'], $row['Last Contact'],
                $row['Promised Return'], $row['Notes'])
        }
    }
    # gather live per-company figures from the four registers
    $companies = @{}
    function AddReg($rows, [string]$regName, [string]$replCol) {
        foreach ($r in $rows) {
            $comp = Norm $r['Company']
            if ($comp -eq '') { $comp = '(no company)' }
            if (-not $companies.ContainsKey($comp)) {
                $companies[$comp] = @{ Tooling = 0; Milwaukee = 0; Radios = 0; Batteries = 0; Gas = 0; Days = @(); Expo = 0.0 }
            }
            $c = $companies[$comp]
            $c[$regName] = $c[$regName] + 1
            $c.Days += DaysOn $r['On Hire Date']
            if ($replCol -ne '') { $c.Expo = $c.Expo + (Num $r[$replCol]) }
        }
    }
    AddReg $toolRows 'Tooling' 'Replacement Cost'
    AddReg $milwRows 'Milwaukee' 'Replacement Cost'
    AddReg $handsets 'Radios' 'Replacement Cost'
    AddReg $batts 'Batteries' ''
    AddReg $gasRows 'Gas' 'Replacement Fee'

    # score locally (same v11 formulas) just to write rows highest-risk first
    $ordered = $companies.GetEnumerator() | ForEach-Object {
        $c = $_.Value
        $o2 = @($c.Days | Where-Object { $_ -eq 2 }).Count
        $h3 = @($c.Days | Where-Object { $_ -eq 3 }).Count
        $c4 = @($c.Days | Where-Object { $_ -ge 4 }).Count
        $items = $c.Days.Count
        $oldest = 0; foreach ($d in $c.Days) { if ($d -gt $oldest) { $oldest = $d } }
        $age = [Math]::Min(50, 8 * $o2 + 15 * $h3 + 25 * $c4 + 3 * [Math]::Max(0, $oldest - 4))
        $expoRisk = [Math]::Min(30, 30 * $c.Expo / 25000.0)
        $port = 0.0; if ($items -gt 0) { $port = [Math]::Min(20, 20.0 * ($h3 + $c4) / $items) }
        [pscustomobject]@{
            Company = $_.Key; C = $c; O2 = $o2; H3 = $h3; C4 = $c4
            Items = $items; Oldest = $oldest
            Score = [Math]::Min(100, $age + $expoRisk + $port)
        }
    } | Sort-Object -Property @{Expression = 'Score'; Descending = $true }, @{Expression = { $_.C.Expo }; Descending = $true }

    # rebuild the table body IN PLACE: grow first (so the table's own
    # formula columns M..S auto-fill from existing rows), overwrite values
    # in A..L and the manual T..X, then trim any surplus rows off the end.
    # If writes are being refused this run, DON'T touch the table's shape -
    # half a rebuild is worse than none.
    if ($script:wfail -gt 0) {
        Write-Output ' Companies: rebuild skipped (writes are being refused this run - table left untouched).'
    } else {
    $need = @($ordered).Count
    while ($caT.ListRows.Count -lt $need) { Set-Com { [void]$caT.ListRows.Add() } -label 'acct add row' }
    $rIdx = 0
    foreach ($e in $ordered) {
        $rIdx++
        $vr = $caT.ListRows.Item($rIdx).Range
        WSet ($vr.Cells.Item(1, 1)) ($e.Company) 'acct company'
        WSet ($vr.Cells.Item(1, 2)) ($e.C.Tooling) 'acct c2'
        WSet ($vr.Cells.Item(1, 3)) ($e.C.Milwaukee) 'acct c3'
        WSet ($vr.Cells.Item(1, 4)) ($e.C.Radios) 'acct c4'
        WSet ($vr.Cells.Item(1, 5)) ($e.C.Batteries) 'acct c5'
        WSet ($vr.Cells.Item(1, 6)) ($e.C.Gas) 'acct c6'
        WSet ($vr.Cells.Item(1, 7)) ($e.Items) 'acct c7'
        WSet ($vr.Cells.Item(1, 8)) ($e.O2) 'acct c8'
        WSet ($vr.Cells.Item(1, 9)) ($e.H3) 'acct c9'
        WSet ($vr.Cells.Item(1, 10)) ($e.C4) 'acct c10'
        WSet ($vr.Cells.Item(1, 11)) ($e.Oldest) 'acct c11'
        WSet ($vr.Cells.Item(1, 12)) ($e.C.Expo) 'acct c12'
        for ($i = 0; $i -lt 5; $i++) { $ii = $i; WSet ($vr.Cells.Item(1, 20 + $ii)) ('') 'acct manual clear' }
        if ($manual.ContainsKey($e.Company)) {
            $m = $manual[$e.Company]
            for ($i = 0; $i -lt 5; $i++) {
                if ($null -ne $m[$i] -and "$($m[$i])" -ne '') { $ii = $i; $vv = $m[$i]; WSet ($vr.Cells.Item(1, 20 + $ii)) ($vv) 'acct manual' }
            }
        }
    }
    while ($caT.ListRows.Count -gt $need -and $caT.ListRows.Count -gt 1) {
        Set-Com { $caT.ListRows.Item($caT.ListRows.Count).Delete() } -label 'acct trim row'
    }
    Write-Output (' Companies: accountability rebuilt live - {0} companies (manual notes kept)' -f $ordered.Count)
    }

    # ---- 4g. forecast sensitivity (computed, not pasted) ------------------
    $est = 0.0
    foreach ($r in (TableRows ($wb.Worksheets.Item('Tooling to Supply')) 'K2EstimateTable')) { $est += Num $r['Est Total'] }
    $dt = $wb.Worksheets.Item('Daily Tracking')
    $dtRows = TableRows $dt 'DailyTrackingTable'
    $fullDay = 0.0; $transport = 0.0; $labAcc = 0.0
    foreach ($r in $dtRows) {
        $d = $null
        try { $d = [datetime]::FromOADate([double]$r['Date']) } catch { }
        if ($null -eq $d) { continue }   # skips the table's TOTAL row
        $tot = Num $r['Daily Forecast Total']
        if ($d -ge (Get-Date '2026-07-20') -and $d -le (Get-Date '2026-08-11') -and $tot -gt $fullDay) { $fullDay = $tot }
        $transport += Num $r['Transport F/C']
        $labAcc += (Num $r['Personnel / Labour F/C']) + (Num $r['Accommodation F/C'])
    }
    $expoAll = 0.0
    foreach ($r in $toolRows) { $expoAll += Num $r['Replacement Cost'] }
    foreach ($r in $milwRows) { $expoAll += Num $r['Replacement Cost'] }
    $expoAll += $radExpo
    foreach ($r in $gasRows) { $expoAll += Num $r['Replacement Fee'] }
    $bulkDaily = 0.0
    foreach ($rr in 182..186) { $bulkDaily += Num $pe.Range('G' + $rr).Value2 }
    $gasFleetCharge = Num $pe.Range('G189').Value2
    $sens = @(
        @(34, ($est / 0.4 * 0.10)), @(35, $fullDay), @(36, ($transport * 0.10)),
        @(37, ($labAcc * 0.10)), @(38, ($expoAll * 0.20))
    )
    foreach ($s in $sens) {
        WCell $ctrl ('K' + $s[0]) (- [Math]::Round($s[1], 2)) 'ctrl.Range(K + s[0]).Value2'
        WCell $ctrl ('L' + $s[0]) ([Math]::Round($s[1], 2)) 'ctrl.Range(L + s[0]).Value2'
    }
    WCell $ctrl ('K39') (0) 'ctrl.Range(K39).Value2'
    WCell $ctrl ('L39') ([Math]::Round($bulkDaily * $SHUT_DAYS, 2)) 'ctrl.Range(L39).Value2'
    WCell $ctrl ('K40') (0) 'ctrl.Range(K40).Value2'
    WCell $ctrl ('L40') ([Math]::Round(($radioFleetCharge + $gasFleetCharge) * 2, 2)) 'ctrl.Range(L40).Value2'
    Write-Output ' Controls : sensitivity figures recomputed from the live model'

    try { $app.CalculateFull() } catch { }
    $wb.Save()
    if ($script:wfail -gt 0) {
        Write-Output (' Saved    : refreshed data is saved, but {0} true-up write(s) were refused this run - paste this whole output back to Claude.' -f $script:wfail)
    } else {
        Write-Output ' Saved    : workbook aligned.'
    }
}
finally {
    foreach ($w in @($app.Workbooks)) { try { $w.Close($false) } catch { } }
    $app.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}

Write-Output ''
Write-Output ' Done. Run verify_excel_alignment.py (13_ALIGN does it for you)'
Write-Output ' for the cell-by-cell proof that Excel = reports.'
