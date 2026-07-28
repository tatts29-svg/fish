# ==========================================================================
#  COATES | GAS MONITOR & RADIO FLEET UTILISATION
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Right-sizing check for the two flat-billed fleets: how many gas monitors
#  and radio handsets we have, how many are currently on hire, and how many
#  times each individual unit has actually gone out - so we know if the
#  fleet is the right size, not just whether it's expensive.
#
#  Dispatch counts come from the SiteIQ TRANSACTIONS export, which is a
#  ROLLING WINDOW (the period shown on each tab), not full shutdown-to-date
#  history. Re-run this whenever a fresh TRANSACTIONS.xlsx lands to widen
#  the picture - it never estimates or backfills what it can't see.
#
#  Usage:  powershell -File REFRESH_GEAR_UTILISATION.ps1
# ==========================================================================
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-Newest([string]$pattern, [string]$what) {
    $dirs = @((Join-Path $here 'Data_SiteIQ'), $here) | Where-Object { Test-Path $_ }
    $hits = @()
    foreach ($d in $dirs) {
        $hits += Get-ChildItem -Path $d -File -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -notlike '~$*' -and
            (($_.Name -replace '[ _]', '') -like (($pattern -replace '[ _]', '')))
        }
    }
    if (-not $hits) {
        throw ("Couldn't find {0}.`n  Looked for: {1}`n  In: {2} (and Data_SiteIQ)" -f $what, $pattern, $here)
    }
    ($hits | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

function Norm([object]$v) { if ($null -eq $v) { '' } else { ([string]$v).Trim() } }

Write-Output "=============================================================="
Write-Output " COATES | GAS MONITOR & RADIO FLEET UTILISATION"
Write-Output " Author: Andrew Fisher | POWERED BY SITEIQ"
Write-Output "=============================================================="

$wbPath = Find-Newest 'Cement_Australia_Report*K2*.xlsm' 'the K2 report workbook'
$stockPath = Find-Newest 'RENTAL_STOCK*.xlsx' 'the RENTAL_STOCK export'
$tranPath = Find-Newest 'TRANSACTIONS*.xlsx' 'the TRANSACTIONS export'

# ==========================================================================
# PHASE 1 - read source data once (read-only, no retries needed in practice;
# this machine's Excel automation only gets flaky on the write-heavy phase)
# ==========================================================================
$app1 = New-Object -ComObject Excel.Application
$app1.Visible = $false
$app1.DisplayAlerts = $false
$app1.AutomationSecurity = 3

$gasFleet = [System.Collections.Generic.List[PSCustomObject]]::new()
$radioFleet = [System.Collections.Generic.List[PSCustomObject]]::new()
$gasByBar = @{}
$radioByBar = @{}

try {
    $wbS = $app1.Workbooks.Open($stockPath, 0, $true)
    $wsS = $wbS.Worksheets.Item('RENTAL_STOCK')
    $arrS = $wsS.UsedRange.Value2
    $hdrS = @{}
    for ($c = 1; $c -le $arrS.GetLength(1); $c++) { $hdrS[(Norm $wsS.Cells(1,$c).Value2)] = $c }
    $suC = $hdrS['STORAGE_UNIT']; $descC = $hdrS['ITEM_DESCRIPTION']; $barC = $hdrS['ITEM_BARCODE']
    $coC = $hdrS['COMPANY_NAME']; $hiC = $hdrS['HIRER_NAME']

    for ($r = 2; $r -le $arrS.GetLength(0); $r++) {
        $su = Norm $arrS[$r, $suC]
        $desc = Norm $arrS[$r, $descC]
        $bar = (Norm $arrS[$r, $barC]).ToUpper()
        $co = Norm $arrS[$r, $coC]
        $hi = Norm $arrS[$r, $hiC]
        $status = if ($co -ne '' -or $hi -ne '') { 'On Hire' } else { 'Available' }
        $holder = if ($status -eq 'On Hire') { ("$co - $hi").Trim(' -') } else { '-' }
        if ($su -eq 'Gas Monitors' -and $bar -ne '' -and -not $gasByBar.ContainsKey($bar)) {
            $obj = [PSCustomObject]@{ Barcode = $bar; Description = $desc; Status = $status; Holder = $holder; TimesOut = 0 }
            $gasFleet.Add($obj)
            $gasByBar[$bar] = $obj
        }
        if ($su -eq 'Radios' -and $desc -match '(?i)DP4801' -and $bar -ne '' -and -not $radioByBar.ContainsKey($bar)) {
            $obj = [PSCustomObject]@{ Barcode = $bar; Description = $desc; Status = $status; Holder = $holder; TimesOut = 0 }
            $radioFleet.Add($obj)
            $radioByBar[$bar] = $obj
        }
    }
    $wbS.Close($false)

    $wbT = $app1.Workbooks.Open($tranPath, 0, $true)
    $ref = $wbT.Worksheets.Item('REFERENCE_INFO')
    $period = Norm $ref.Cells(2,1).Value2
    $parts = $period -split ' - '
    if ($parts.Count -lt 2) { throw "TRANSACTIONS REFERENCE_INFO report period is not in the expected format." }
    $repStart = [datetime]::ParseExact($parts[0].Trim(), 'dd/MM/yyyy HH:mm:ss', $null)
    $repEnd = [datetime]::ParseExact($parts[1].Trim(), 'dd/MM/yyyy HH:mm:ss', $null)

    $txSeen = New-Object System.Collections.Generic.HashSet[string]
    foreach ($sheetName in @('TRANSACTION_CHARGES', 'CUSTOMER_CONTRACTOR_EQUIP')) {
        $ws = $wbT.Worksheets.Item($sheetName)
        $arr = $ws.UsedRange.Value2
        if ($arr -isnot [System.Array] -or $arr.Rank -lt 2) { continue }
        $hdr = @{}
        for ($c = 1; $c -le $arr.GetLength(1); $c++) { $hdr[(Norm $ws.Cells(1,$c).Value2)] = $c }
        $descC2 = $hdr['SKU/ITEM DESCRIPTION']; $barC2 = $hdr['LATEST_BARCODE']; $tidC2 = $hdr['TRANSACTION_ID']
        if (-not $descC2 -or -not $barC2 -or -not $tidC2) { continue }
        for ($r = 2; $r -le $arr.GetLength(0); $r++) {
            $bar = (Norm $arr[$r, $barC2]).ToUpper()
            $tid = Norm $arr[$r, $tidC2]
            if ($bar -eq '' -or $tid -eq '') { continue }
            $key = "$tid|$bar"
            if ($txSeen.Contains($key)) { continue }
            [void]$txSeen.Add($key)
            if ($gasByBar.ContainsKey($bar)) { $gasByBar[$bar].TimesOut++ }
            if ($radioByBar.ContainsKey($bar)) { $radioByBar[$bar].TimesOut++ }
        }
    }
    $wbT.Close($false)
}
finally {
    try { $app1.Quit() } catch {}
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app1) | Out-Null } catch {}
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

$days = [math]::Round(($repEnd - $repStart).TotalDays, 1)
Write-Output ("Report period: {0} to {1} ({2} days)" -f $repStart.ToString('dd MMM'), $repEnd.ToString('dd MMM'), $days)
Write-Output ("Gas fleet: {0}   Radio handset fleet: {1}" -f $gasFleet.Count, $radioFleet.Count)

# Pre-sort and pre-build the exact 2D blocks to write - all pure PowerShell,
# no COM involved, so this never needs to be retried.
function Build-Block($fleetList) {
    $sorted = @($fleetList | Sort-Object -Property @{Expression = 'TimesOut'; Descending = $true}, @{Expression = 'Barcode'; Descending = $false})
    $headers = @('Barcode', 'Description', 'Current Status', 'Current Holder', 'Times Out (Report Period)')
    $totalRows = [int]($sorted.Count + 1)
    $block = [System.Array]::CreateInstance([object], $totalRows, 5)
    for ($j = 0; $j -lt 5; $j++) { $block.SetValue($headers[$j], 0, $j) }
    for ($ri = 0; $ri -lt $sorted.Count; $ri++) {
        $row = $sorted[$ri]
        $block.SetValue([string]$row.Barcode, $ri + 1, 0)
        $block.SetValue([string]$row.Description, $ri + 1, 1)
        $block.SetValue([string]$row.Status, $ri + 1, 2)
        $block.SetValue([string]$row.Holder, $ri + 1, 3)
        $block.SetValue([int]$row.TimesOut, $ri + 1, 4)
    }
    [PSCustomObject]@{
        Block = $block
        RowCount = [int]$sorted.Count
        FleetSize = [int]$sorted.Count
        OnHire = [int](@($sorted | Where-Object { $_.Status -eq 'On Hire' }).Count)
        Dispatched = [int](@($sorted | Where-Object { $_.TimesOut -gt 0 }).Count)
    }
}

$gasResult = Build-Block $gasFleet
$radioResult = Build-Block $radioFleet
$gasResult | Add-Member -NotePropertyName Never -NotePropertyValue ([int]($gasResult.FleetSize - $gasResult.Dispatched))
$radioResult | Add-Member -NotePropertyName Never -NotePropertyValue ([int]($radioResult.FleetSize - $radioResult.Dispatched))

$noteText = "Dispatch count covers the SiteIQ transaction window {0} - {1} ({2} days), not full shutdown-to-date. Re-run REFRESH_GEAR_UTILISATION.ps1 whenever a fresh TRANSACTIONS export lands." -f $repStart.ToString('dd MMM'), $repEnd.ToString('dd MMM'), $days
$subtitleText = "Right-sizing check - so we know if the fleet is the right number. Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009)."

# ==========================================================================
# PHASE 2 - write into the workbook. This machine's Excel COM automation
# intermittently throws spurious cast/RPC errors on individual property
# sets (confirmed: the exact same call succeeds on a bare retry) - so every
# single COM mutation below goes through Set-Com, which retries just that
# one call a few times before giving up.
# ==========================================================================
function Set-Com([scriptblock]$action, [int]$tries = 5, [string]$label = '') {
    for ($t = 1; $t -le $tries; $t++) {
        try { return & $action }
        catch {
            if ($t -eq $tries) { throw }
            Start-Sleep -Milliseconds (60 * $t)
        }
    }
}

function Write-FleetBlock($wb, [string]$sheetName, [string]$title, $result) {
    $ws = Set-Com -label 'wsGet' -action { $wb.Worksheets.Item($sheetName) }
    $c = 18  # column R - clear of both on-hire tables (Radios Onhire runs to column O)

    # Wipe any leftover formatting/merge/table state from earlier failed
    # attempts in this exact region before writing anything fresh into it.
    $loName0 = ($sheetName -replace '[^A-Za-z0-9]', '') + 'FleetTable'
    $loList0 = Set-Com -label 'loList0Get' -action { $ws.ListObjects }
    $loCount0 = Set-Com -label 'loList0Count' -action { $loList0.Count }
    for ($li0 = $loCount0; $li0 -ge 1; $li0--) {
        $li0x = $li0
        $cand0 = Set-Com -label "loItem0_$li0" -action { $loList0.Item($li0x) }
        $cand0Name = Set-Com -label "loItem0Name_$li0" -action { $cand0.Name }
        if ($cand0Name -eq $loName0) { Set-Com -label 'preClearDeleteLo' -action { $cand0.Delete() } }
    }
    $wipeRange = Set-Com -label 'wipeRangeGet' -action { $ws.Range($ws.Cells(1, $c), $ws.Cells(200, $c + 8)) }
    Set-Com -label 'preClearWipe' -action { $wipeRange.Clear() } | Out-Null

    # Banner rows are 5 individually-coloured cells rather than a merged
    # range - Merge()/UnMerge() throw unpredictably through PowerShell's
    # COM binder on this machine (and on a protected/previously-merged
    # sheet); per-cell fill gives the same banner look without it.
    for ($bi = 0; $bi -lt 5; $bi++) {
        $bii = $bi
        $tc = Set-Com -label "titleCellGet$bi" -action { $ws.Cells(1, $c + $bii) }
        if ($bi -eq 0) { Set-Com -label "titleValue$bi" -action { $tc.Value2 = $title } }
        Set-Com -label "titleInterior$bi" -action { $tc.Interior.Color = 0x111111 }
        Set-Com -label "titleFontColor$bi" -action { $tc.Font.Color = 0xFFFFFF }
        Set-Com -label "titleFontBold$bi" -action { $tc.Font.Bold = $true }
        Set-Com -label "titleFontSize$bi" -action { $tc.Font.Size = 12 }

        $sc = Set-Com -label "subCellGet$bi" -action { $ws.Cells(2, $c + $bii) }
        if ($bi -eq 0) { Set-Com -label "subValue$bi" -action { $sc.Value2 = $subtitleText } }
        Set-Com -label "subInterior$bi" -action { $sc.Interior.Color = 0x004EFF }
        Set-Com -label "subFontColor$bi" -action { $sc.Font.Color = 0xFFFFFF }
        Set-Com -label "subFontItalic$bi" -action { $sc.Font.Italic = $true }
    }

    $noteCell = Set-Com -label 'noteCellGet' -action { $ws.Cells(3, $c) }
    Set-Com -label 'noteValue' -action { $noteCell.Value2 = $noteText }
    Set-Com -label 'noteFontItalic' -action { $noteCell.Font.Italic = $true }
    Set-Com -label 'noteFontSize' -action { $noteCell.Font.Size = 9 }

    $labels = @("Fleet Size", "Currently On Hire", "Dispatched This Period", "Never Dispatched This Period")
    $values = @([int]$result.FleetSize, [int]$result.OnHire, [int]$result.Dispatched, [int]$result.Never)
    for ($i = 0; $i -lt 4; $i++) {
        $ii = $i
        $lc = Set-Com -label "statLabelCellGet$i" -action { $ws.Cells(5, $c + $ii) }
        Set-Com -label "statLabel$i" -action { $lc.Value2 = $labels[$i] }
        Set-Com -label "statLabelBold$i" -action { $lc.Font.Bold = $true }
        $vc = Set-Com -label "statValueCellGet$i" -action { $ws.Cells(6, $c + $ii) }
        $vvs = [string]$values[$i]
        Set-Com -label "statValue$i" -action { $vc.Formula = $vvs }
        Set-Com -label "statValueSize$i" -action { $vc.Font.Size = 14 }
        Set-Com -label "statValueBold$i" -action { $vc.Font.Bold = $true }
        Set-Com -label "statValueColor$i" -action { $vc.Font.Color = 0xFF4E00 }
    }

    # Plain formatted range instead of a native Excel Table object -
    # ListObjects.Add and multi-cell Range.Font/.Borders operations don't
    # resolve reliably through PowerShell's COM binder on this machine;
    # every style below is applied cell-by-cell, which does work reliably.
    $headerRow = 8
    $headers2 = @('Barcode', 'Description', 'Current Status', 'Current Holder', 'Times Out (Report Period)')
    for ($j = 0; $j -lt 5; $j++) {
        $jj = $j
        $hc = Set-Com -label "colHeaderCell$j" -action { $ws.Cells($headerRow, $c + $jj) }
        $hh = $headers2[$j]
        Set-Com -label "colHeader$j" -action { $hc.Value2 = $hh }
        Set-Com -label "colHeaderBold$j" -action { $hc.Font.Bold = $true }
        Set-Com -label "colHeaderFontColor$j" -action { $hc.Font.Color = 0xFFFFFF }
        Set-Com -label "colHeaderFill$j" -action { $hc.Interior.Color = 0x374151 }
    }
    $rowsData = $result.Block
    for ($ri = 1; $ri -le $result.RowCount; $ri++) {
        $rr = $headerRow + $ri
        $stripe = if ($ri % 2 -eq 0) { 0xF3F4F6 } else { 0xFFFFFF }
        $statusVal = [string]$rowsData.GetValue($ri, 2)
        $timesOutVal = [int]$rowsData.GetValue($ri, 4)

        for ($cc = 0; $cc -lt 4; $cc++) {
            $ccc = $cc
            $cell = Set-Com -label "dataCell_${ri}_${cc}" -action { $ws.Cells($rr, $c + $ccc) }
            $vv2 = [string]$rowsData.GetValue($ri, $cc)
            Set-Com -label "dataText_${ri}_${cc}" -action { $cell.Value2 = $vv2 }
            Set-Com -label "dataFontSize_${ri}_${cc}" -action { $cell.Font.Size = 10 }
            $stripeCopy = $stripe
            Set-Com -label "dataFill_${ri}_${cc}" -action { $cell.Interior.Color = $stripeCopy }
            if ($cc -eq 2) {
                if ($statusVal -eq 'On Hire') {
                    Set-Com -label "statusColor_$ri" -action { $cell.Font.Color = 0x15803D }
                    Set-Com -label "statusBold_$ri" -action { $cell.Font.Bold = $true }
                } else {
                    Set-Com -label "statusColor_$ri" -action { $cell.Font.Color = 0x9CA3AF }
                }
            }
        }
        $timesCell = Set-Com -label "timesCell_$ri" -action { $ws.Cells($rr, $c + 4) }
        $timesVal = [string]$rowsData.GetValue($ri, 4)
        Set-Com -label "dataTimesOut_$ri" -action { $timesCell.Formula = $timesVal }
        Set-Com -label "dataTimesOutSize_$ri" -action { $timesCell.Font.Size = 10 }
        Set-Com -label "dataTimesOutFill_$ri" -action { $timesCell.Interior.Color = $stripe }
        if ($timesOutVal -gt 0) {
            Set-Com -label "dataTimesOutColor_$ri" -action { $timesCell.Font.Color = 0xFF4E00 }
            Set-Com -label "dataTimesOutBold_$ri" -action { $timesCell.Font.Bold = $true }
        } else {
            Set-Com -label "dataTimesOutColor_$ri" -action { $timesCell.Font.Color = 0x9CA3AF }
        }
    }
    $lastRow = $headerRow + $result.RowCount

    $cols = Set-Com -label 'colsGet' -action { $ws.Columns }
    Set-Com -label 'colWidth0' -action { $cols.Item($c).ColumnWidth = 16 }
    Set-Com -label 'colWidth1' -action { $cols.Item($c + 1).ColumnWidth = 42 }
    Set-Com -label 'colWidth2' -action { $cols.Item($c + 2).ColumnWidth = 14 }
    Set-Com -label 'colWidth3' -action { $cols.Item($c + 3).ColumnWidth = 28 }
    Set-Com -label 'colWidth4' -action { $cols.Item($c + 4).ColumnWidth = 20 }

    Write-Output ("  {0}: fleet={1} onHire={2} dispatched={3} neverDispatched={4}" -f $sheetName, $result.FleetSize, $result.OnHire, $result.Dispatched, $result.Never)
}

$maxAttempts = 3
$attempt = 0
$succeeded = $false

while (-not $succeeded -and $attempt -lt $maxAttempts) {
    $attempt++
    if ($attempt -gt 1) {
        Write-Output ("Retrying write phase (attempt {0} of {1})..." -f $attempt, $maxAttempts)
        Get-Process -Name EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 4
    }

    $app2 = New-Object -ComObject Excel.Application
    $app2.Visible = $false
    $app2.DisplayAlerts = $false
    $app2.EnableEvents = $false
    $app2.AutomationSecurity = 3
    Start-Sleep -Milliseconds 500

    try {
        $wb = Set-Com -label 'wbOpen' -action { $app2.Workbooks.Open($wbPath, 0, $false) }
        Write-FleetBlock $wb 'Gas Monitors Onhire' 'GAS MONITOR FLEET - RIGHT-SIZING CHECK' $gasResult
        Write-FleetBlock $wb 'Radios Onhire' 'RADIO HANDSET FLEET - RIGHT-SIZING CHECK' $radioResult
        Set-Com -label 'calcFull' -action { $app2.CalculateFull() } | Out-Null
        Set-Com -label 'wbSave' -action { $wb.Save() } | Out-Null
        Set-Com -label 'wbClose' -action { $wb.Close($false) } | Out-Null
        Write-Output ""
        Write-Output "Saved. Both tabs updated - who's got one now, and how often each"
        Write-Output "individual unit has actually gone out in this transaction window."
        $succeeded = $true
    }
    catch {
        if ($attempt -lt $maxAttempts) {
            Write-Output ("  (write attempt {0} failed: {1})" -f $attempt, $_.Exception.Message)
        } else {
            Write-Output ""
            Write-Output ("PROBLEM: " + $_.Exception.Message)
            Write-Output "Usual causes: the workbook is open in Excel (close it) or Excel"
            Write-Output "automation is being flaky on this machine - try again shortly."
        }
    }
    finally {
        try { $app2.Quit() } catch {}
        try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app2) | Out-Null } catch {}
        [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    }
}

if (-not $succeeded) {
    Write-Output ""
    Write-Output "Gave up after $maxAttempts attempts."
    exit 1
}
