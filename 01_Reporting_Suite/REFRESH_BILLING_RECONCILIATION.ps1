# ==========================================================================
#  COATES | K2 BILLING RECONCILIATION
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Checks our own Daily Tracking Actuals against SiteIQ's real invoiced
#  totals (DAILY_SUMMARY export), day by day, across every category that
#  can legitimately be compared: Hire (Plant+Tooling), Labour, Transport,
#  Damage.
#
#  Radios, gas monitors and subhire (Harvey welders) are EXPECTED to never
#  appear in DAILY_SUMMARY - confirmed by checking the Contracted Rates
#  card: none of the three have a Product Variant rate entry there, so
#  SiteIQ's transaction billing structurally cannot invoice them (they're
#  charged through separate flat-fee / subhire-supplier arrangements).
#  Any OTHER variance is flagged honestly for a manual look - this script
#  does not guess at explanations it can't verify.
#
#  Accommodation isn't compared here - DAILY_SUMMARY has no column that
#  maps to it cleanly yet (it may land under HIRE or OTHER once it starts
#  invoicing; wire it in once that's confirmed rather than guess now).
#
#  This is designed to run daily alongside the 5am prefill: PREFILL always
#  writes today's Actual from the live snapshot immediately, never waiting
#  on SiteIQ. This script is the separate "does the real invoice agree"
#  check that catches up once DAILY_SUMMARY has that day - it never blocks
#  or delays the morning numbers, it just confirms or flags them after the
#  fact.
#
#  DAILY_SUMMARY.xlsx is a rolling window, not full shutdown-to-date -
#  re-run this whenever a fresh export lands to extend the picture.
#
#  Usage:  powershell -File REFRESH_BILLING_RECONCILIATION.ps1
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
Write-Output " COATES | K2 BILLING RECONCILIATION"
Write-Output " Author: Andrew Fisher | POWERED BY SITEIQ"
Write-Output "=============================================================="

$wbPath = Find-Newest 'Cement_Australia_Report*K2*.xlsm' 'the K2 report workbook'
$summaryPath = Find-Newest 'DAILY_SUMMARY*.xlsx' 'the DAILY_SUMMARY export'

# category definitions: label | DAILY_SUMMARY column | Daily Tracking column(s) to sum
$CATEGORIES = @(
    @{ Key = 'Hire'; SummaryCol = 'HIRE'; TrackingCols = @('Plant Equipment Hire Actual', 'Tooling Hire Actual') },
    @{ Key = 'Labour'; SummaryCol = 'LABOUR'; TrackingCols = @('Personnel / Labour Actual') },
    @{ Key = 'Transport'; SummaryCol = 'TRANSPORT'; TrackingCols = @('Transport Actual') },
    @{ Key = 'Damage'; SummaryCol = 'DAMAGE'; TrackingCols = @('Damage Recovery Actual') }
)

# ==========================================================================
# PHASE 1 - read DAILY_SUMMARY once (read-only phase - reliable on this box)
# ==========================================================================
$app1 = New-Object -ComObject Excel.Application
$app1.Visible = $false
$app1.DisplayAlerts = $false
$app1.AutomationSecurity = 3

$dailyBySummaryCol = @{}   # SummaryCol -> { [date] -> $ }
foreach ($cat in $CATEGORIES) { $dailyBySummaryCol[$cat.SummaryCol] = @{} }
$repStart = $null
$repEnd = $null

try {
    $wbD = $app1.Workbooks.Open($summaryPath, 0, $true)
    $ref = $wbD.Worksheets.Item('REFERENCE_INFO')
    $dateFrom = Norm $ref.Cells(2, 2).Value2
    $dateTo = Norm $ref.Cells(2, 3).Value2
    $repStart = [datetime]::ParseExact($dateFrom, 'dd/MM/yyyy hh:mm tt', $null)
    $repEnd = [datetime]::ParseExact($dateTo, 'dd/MM/yyyy hh:mm tt', $null)

    $wsD = $wbD.Worksheets.Item('DAILY_SUMMARY')
    $arrD = $wsD.UsedRange.Value2
    $hdrD = @{}
    for ($c = 1; $c -le $arrD.GetLength(1); $c++) { $hdrD[(Norm $arrD[1, $c])] = $c }

    for ($r = 2; $r -le $arrD.GetLength(0); $r++) {
        $label = Norm $arrD[$r, 1]
        if ($label -notmatch '^TOTAL FOR:\s*(\d{2}/\d{2}/\d{4})') { continue }
        $d = [datetime]::ParseExact($matches[1], 'dd/MM/yyyy', $null)
        foreach ($cat in $CATEGORIES) {
            $col = $hdrD[$cat.SummaryCol]
            if (-not $col) { continue }
            $v = [double]([string]$arrD[$r, $col])
            $dailyBySummaryCol[$cat.SummaryCol][$d.Date] = $v
        }
    }
    $wbD.Close($false)
}
finally {
    try { $app1.Quit() } catch {}
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app1) | Out-Null } catch {}
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

Write-Output ("DAILY_SUMMARY period: {0} to {1}" -f $repStart.ToString('dd MMM'), $repEnd.ToString('dd MMM'))

# ==========================================================================
# PHASE 2 - read Daily Tracking Actuals from the K2 workbook (retried - this
# machine's Excel COM automation occasionally throws a spurious null/RPC
# error on an otherwise-valid read; a bare retry clears it)
# ==========================================================================
$resultsByCat = @{}   # Key -> List[row]
$phase2Attempt = 0
$phase2Done = $false

while (-not $phase2Done -and $phase2Attempt -lt 3) {
$phase2Attempt++
if ($phase2Attempt -gt 1) {
    Write-Output ("Retrying Daily Tracking read (attempt {0} of 3)..." -f $phase2Attempt)
    Get-Process -Name EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}
$app2 = New-Object -ComObject Excel.Application
$app2.Visible = $false
$app2.DisplayAlerts = $false
$app2.AutomationSecurity = 3
Start-Sleep -Milliseconds 500

try {
    $wb = $app2.Workbooks.Open($wbPath, 0, $true)
    $dt = $wb.Worksheets.Item('Daily Tracking').ListObjects.Item('DailyTrackingTable')
    $dtArr = $dt.Range.Value2
    $dHdr = @{}
    for ($c = 1; $c -le $dtArr.GetLength(1); $c++) { $dHdr[(Norm $dtArr[1, $c])] = $c }
    $dateCol = $dHdr['Date']

    foreach ($cat in $CATEGORIES) {
        $trackCols = @()
        foreach ($tc in $cat.TrackingCols) {
            if ($dHdr.ContainsKey($tc)) { $trackCols += $dHdr[$tc] }
        }
        $summaryLookup = $dailyBySummaryCol[$cat.SummaryCol]
        $list = New-Object System.Collections.Generic.List[PSCustomObject]

        for ($r = 2; $r -le $dtArr.GetLength(0); $r++) {
            $dv = $dtArr[$r, $dateCol]
            if ($dv -isnot [double]) { continue }
            $d = [datetime]::FromOADate($dv).Date
            if (-not $summaryLookup.ContainsKey($d)) { continue }

            $anyActual = $false
            $ours = 0.0
            foreach ($tcIdx in $trackCols) {
                $v = $dtArr[$r, $tcIdx]
                if ($v -is [double]) { $ours += $v; $anyActual = $true }
            }
            if (-not $anyActual) { continue }

            $ours = [math]::Round($ours, 2)
            $theirs = [math]::Round($summaryLookup[$d], 2)
            $variance = [math]::Round($ours - $theirs, 2)
            $variancePct = if ($theirs -ne 0) { [math]::Round(($variance / $theirs) * 100, 1) } else { $null }
            $list.Add([PSCustomObject]@{
                Date = $d
                Ours = $ours
                Theirs = $theirs
                Variance = $variance
                VariancePct = $variancePct
            })
        }
        $resultsByCat[$cat.Key] = @($list | Sort-Object Date)
    }
    $wb.Close($false)
    $phase2Done = $true
}
catch {
    if ($phase2Attempt -ge 3) { throw }
    Write-Output ("  (Daily Tracking read failed: {0})" -f $_.Exception.Message)
}
finally {
    try { $app2.Quit() } catch {}
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app2) | Out-Null } catch {}
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
}

if (-not $phase2Done) {
    Write-Output ""
    Write-Output "Could not read Daily Tracking after 3 attempts - try again shortly."
    exit 1
}

$totalRows = 0
foreach ($cat in $CATEGORIES) {
    $n = $resultsByCat[$cat.Key].Count
    $totalRows += $n
    Write-Output ("{0}: {1} day(s) with both an Actual and a SiteIQ invoice total" -f $cat.Key, $n)
    foreach ($row in $resultsByCat[$cat.Key]) {
        Write-Output ("  {0}: ours={1:C2} theirs={2:C2} variance={3:C2} ({4})" -f $row.Date.ToString('dd MMM'), $row.Ours, $row.Theirs, $row.Variance, $(if ($row.VariancePct -ne $null) { "$($row.VariancePct)%" } else { "n/a" }))
    }
}
if ($totalRows -eq 0) {
    Write-Output ""
    Write-Output "No overlapping days found between Daily Tracking Actuals and DAILY_SUMMARY - nothing to write."
    exit 0
}

# ==========================================================================
# PHASE 3 - write the reconciliation blocks into Controls & Exceptions
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

function Note-For($ours, $theirs, $variance, $variancePct) {
    if ([math]::Abs($variance) -lt 5) { return "Matches (within `$5)" }
    if ($theirs -eq 0 -and $ours -gt 0) { return "Not yet invoiced by SiteIQ - normal, this category often lags a day or more" }
    if ($variancePct -ne $null -and [math]::Abs($variancePct) -lt 3) { return "Close - within 3%" }
    return "Variance not explained - worth a manual look"
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

    $app3 = New-Object -ComObject Excel.Application
    $app3.Visible = $false
    $app3.DisplayAlerts = $false
    $app3.EnableEvents = $false
    $app3.AutomationSecurity = 3
    Start-Sleep -Milliseconds 500

    try {
        $wb3 = Set-Com -label 'wbOpen' -action { $app3.Workbooks.Open($wbPath, 0, $false) }
        $ws3 = Set-Com -label 'wsGet' -action { $wb3.Worksheets.Item('Controls & Exceptions') }

        $startRow = 46
        $wipeRange = Set-Com -label 'wipeGet' -action { $ws3.Range($ws3.Cells($startRow, 1), $ws3.Cells($startRow + 200, 6)) }
        Set-Com -label 'wipe' -action { $wipeRange.Clear() } | Out-Null

        $titleCell = Set-Com -label 'titleGet' -action { $ws3.Cells($startRow, 1) }
        Set-Com -label 'titleVal' -action { $titleCell.Value2 = "BILLING RECONCILIATION - DAILY TRACKING vs SITEIQ INVOICED (DAILY_SUMMARY)" }
        Set-Com -label 'titleBold' -action { $titleCell.Font.Bold = $true }
        Set-Com -label 'titleSize' -action { $titleCell.Font.Size = 12 }
        Set-Com -label 'titleFg' -action { $titleCell.Font.Color = 0xFFFFFF }
        Set-Com -label 'titleBg' -action { $titleCell.Interior.Color = 0x111111 }

        $noteText = ("Hire = Plant + Tooling Actual combined. Radios, gas monitors and subhire (Harvey " +
                     "welders) never appear here - confirmed by checking the Contracted Rates card: none " +
                     "have a rate entry, so SiteIQ's transaction billing structurally cannot invoice them. " +
                     "Accommodation isn't compared yet - no confirmed DAILY_SUMMARY column mapping. " +
                     "Period: {0} to {1}. PREFILL always writes today's Actual immediately at 5am from the " +
                     "live snapshot - this check catches up separately once SiteIQ's real invoice lands, " +
                     "usually a day or so later. Re-run whenever a fresh DAILY_SUMMARY export lands.") -f
                     $repStart.ToString('dd MMM'), $repEnd.ToString('dd MMM')
        $noteCell = Set-Com -label 'noteGet' -action { $ws3.Cells($startRow + 1, 1) }
        Set-Com -label 'noteVal' -action { $noteCell.Value2 = $noteText }
        Set-Com -label 'noteItalic' -action { $noteCell.Font.Italic = $true }
        Set-Com -label 'noteSize' -action { $noteCell.Font.Size = 9 }

        $r = $startRow + 3
        foreach ($cat in $CATEGORIES) {
            $catRows = $resultsByCat[$cat.Key]
            if ($catRows.Count -eq 0) { continue }

            $catTitleCell = Set-Com -label "catTitleGet_$($cat.Key)" -action { $ws3.Cells($r, 1) }
            $catLabel = if ($cat.Key -eq 'Hire') { "HIRE (Plant + Tooling)" } else { $cat.Key.ToUpper() }
            Set-Com -label "catTitleVal_$($cat.Key)" -action { $catTitleCell.Value2 = $catLabel }
            Set-Com -label "catTitleBold_$($cat.Key)" -action { $catTitleCell.Font.Bold = $true }
            Set-Com -label "catTitleFg_$($cat.Key)" -action { $catTitleCell.Font.Color = 0xFFFFFF }
            Set-Com -label "catTitleBg_$($cat.Key)" -action { $catTitleCell.Interior.Color = 0x004EFF }
            $r++

            $headers = @('Date', 'Our Actual', 'SiteIQ Invoiced', 'Variance $', 'Variance %', 'Note')
            for ($j = 0; $j -lt $headers.Count; $j++) {
                $jj = $j
                $hc = Set-Com -label "hdrGet_$($cat.Key)_$j" -action { $ws3.Cells($r, 1 + $jj) }
                $hh = $headers[$j]
                Set-Com -label "hdrVal_$($cat.Key)_$j" -action { $hc.Value2 = $hh }
                Set-Com -label "hdrBold_$($cat.Key)_$j" -action { $hc.Font.Bold = $true }
                Set-Com -label "hdrFg_$($cat.Key)_$j" -action { $hc.Font.Color = 0xFFFFFF }
                Set-Com -label "hdrBg_$($cat.Key)_$j" -action { $hc.Interior.Color = 0x374151 }
            }
            $r++

            foreach ($row in $catRows) {
                $dateS = $row.Date.ToString('dd MMM yyyy')
                $oursS = [string]$row.Ours
                $theirsS = [string]$row.Theirs
                $varS = [string]$row.Variance
                $pctS = if ($row.VariancePct -ne $null) { [string]$row.VariancePct } else { $null }
                $noteS = Note-For $row.Ours $row.Theirs $row.Variance $row.VariancePct

                $c1 = Set-Com -label "r${r}c1Get" -action { $ws3.Cells($r, 1) }
                Set-Com -label "r${r}c1Val" -action { $c1.Value2 = $dateS }
                $c2 = Set-Com -label "r${r}c2Get" -action { $ws3.Cells($r, 2) }
                Set-Com -label "r${r}c2Val" -action { $c2.Formula = $oursS }
                $c3 = Set-Com -label "r${r}c3Get" -action { $ws3.Cells($r, 3) }
                Set-Com -label "r${r}c3Val" -action { $c3.Formula = $theirsS }
                $c4 = Set-Com -label "r${r}c4Get" -action { $ws3.Cells($r, 4) }
                Set-Com -label "r${r}c4Val" -action { $c4.Formula = $varS }
                $c5 = Set-Com -label "r${r}c5Get" -action { $ws3.Cells($r, 5) }
                if ($pctS -ne $null) { Set-Com -label "r${r}c5Val" -action { $c5.Formula = $pctS } }
                else { Set-Com -label "r${r}c5Val" -action { $c5.Value2 = 'n/a' } }
                $c6 = Set-Com -label "r${r}c6Get" -action { $ws3.Cells($r, 6) }
                Set-Com -label "r${r}c6Val" -action { $c6.Value2 = $noteS }
                $r++
            }
            $r++  # blank row gap between category blocks
        }

        $cols3 = Set-Com -label 'colsGet' -action { $ws3.Columns }
        Set-Com -label 'colW1' -action { $cols3.Item(1).ColumnWidth = 16 }
        Set-Com -label 'colW2' -action { $cols3.Item(2).ColumnWidth = 14 }
        Set-Com -label 'colW3' -action { $cols3.Item(3).ColumnWidth = 16 }
        Set-Com -label 'colW4' -action { $cols3.Item(4).ColumnWidth = 12 }
        Set-Com -label 'colW5' -action { $cols3.Item(5).ColumnWidth = 12 }
        Set-Com -label 'colW6' -action { $cols3.Item(6).ColumnWidth = 32 }

        Set-Com -label 'wbSave' -action { $wb3.Save() } | Out-Null
        Set-Com -label 'wbClose' -action { $wb3.Close($false) } | Out-Null
        Write-Output ""
        Write-Output "Saved. Billing Reconciliation blocks written to Controls & Exceptions."
        $succeeded = $true
    }
    catch {
        if ($attempt -lt $maxAttempts) {
            Write-Output ("  (write attempt {0} failed: {1})" -f $attempt, $_.Exception.Message)
        } else {
            Write-Output ""
            Write-Output ("PROBLEM: " + $_.Exception.Message)
        }
    }
    finally {
        try { $app3.Quit() } catch {}
        try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($app3) | Out-Null } catch {}
        [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    }
}

if (-not $succeeded) {
    Write-Output ""
    Write-Output "Gave up after $maxAttempts attempts."
    exit 1
}
