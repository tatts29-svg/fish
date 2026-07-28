# ==========================================================================
#  COATES | MAKE OUTLOOK DRAFTS  (v4 - with the Recipients address book)
#  Turns today's report emails into NATIVE Outlook drafts - saved straight
#  into your Outlook Drafts folder, where the To field has full address
#  book search and autocomplete (unlike .eml files opened standalone).
#
#  RECIPIENTS: if Coates_Report_Recipients*.xlsx exists in this folder (or
#  one folder up), To and CC are pre-filled from it automatically:
#    Include = Yes/No   (No keeps a person on file without adding them)
#    Add As  = To / CC
#    Company = ALL, or a company name (matches that company's reports only)
#    Reports = ALL, or comma list of tags (COMPANY, EXEC, DEMOB, DAILY...)
#  Rows ADD to any recipients a kit already pre-fills - never replace.
#
#  Author: Andrew Fisher | POWERED BY SITEIQ
#  Usage:  double-click 12_MAKE_OUTLOOK_DRAFTS.bat
#          powershell -File MAKE_OUTLOOK_DRAFTS.ps1 [-Date yyyy-MM-dd] [-Test]
# ==========================================================================
param(
    [string]$Date = (Get-Date -Format 'yyyy-MM-dd'),
    [switch]$Test,
    [switch]$Send,  # SEND reports that have a To address from the book;
                    # anything unaddressed stays as a draft for review.
                    # Used by 06_SEND_TODAYS_REPORTS.bat (which confirms first).
    [switch]$Force  # redo reports already drafted this run of the day.
                    # The report kits call this script automatically after
                    # every run; a .done marker beside each manifest stops
                    # the same report being drafted twice. Manual runs of
                    # 12_MAKE_OUTLOOK_DRAFTS.bat / 06_SEND_TODAYS_REPORTS.bat
                    # pass -Force to rebuild everything for the day.
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$outDirs = @($here) + (Get-ChildItem $here -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'output*' } | ForEach-Object { $_.FullName })
# Reports now land in one folder per day: Reports\<yyyy-MM-dd>\ - look there
# first for the requested date (old output* folders still checked for safety).
$dayDir = Join-Path (Join-Path $here 'Reports') $Date
if (Test-Path $dayDir) { $outDirs = @($dayDir) + $outDirs }
$manifests = @()
foreach ($d in $outDirs) {
    # -Recurse: the day folder is organised into Emails\ PDF\ Pages\ -
    # the .eml drafts and their manifests live in Emails\ (24 Jul 2026)
    $manifests += Get-ChildItem $d -Filter '*.draft.json' -Recurse -ErrorAction SilentlyContinue |
        Where-Object { ($_.Name -like "*$Date*") -or
                       ($_.LastWriteTime.ToString('yyyy-MM-dd') -eq $Date) }
}
$manifests = $manifests | Sort-Object FullName -Unique
if (-not $manifests -or $manifests.Count -eq 0) {
    Write-Output "No report emails found for $Date."
    Write-Output "Run the report kit first, then run this again."
    exit 1
}

# ---- load the recipients address book (this folder, then one up) ---------
$bookRows = @()
$bookPath = $null
foreach ($dir in @($here, (Split-Path -Parent $here))) {
    $hit = Get-ChildItem $dir -Filter 'Coates_Report_Recipients*.xlsx' -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($hit) { $bookPath = $hit.FullName; break }
}
if ($bookPath) {
    $xl = $null
    try {
        $xl = New-Object -ComObject Excel.Application
        $xl.Visible = $false; $xl.DisplayAlerts = $false
        $xl.AutomationSecurity = 3
        $wb = $xl.Workbooks.Open($bookPath, 0, $true)
        $ws = $wb.Worksheets.Item('Recipients')
        $arr = $ws.UsedRange.Value2
        $hdrRow = 0; $col = @{}
        for ($r = 1; $r -le [Math]::Min($arr.GetLength(0), 10); $r++) {
            for ($c = 1; $c -le $arr.GetLength(1); $c++) {
                if ([string]$arr[$r, $c] -eq 'Email') { $hdrRow = $r; break }
            }
            if ($hdrRow) { break }
        }
        if ($hdrRow) {
            for ($c = 1; $c -le $arr.GetLength(1); $c++) {
                $h = [string]$arr[$hdrRow, $c]
                if ($h) { $col[$h.Trim()] = $c }
            }
            for ($r = $hdrRow + 1; $r -le $arr.GetLength(0); $r++) {
                $email = [string]$arr[$r, $col['Email']]
                if (-not $email -or $email -notmatch '@') { continue }
                $inc = ([string]$arr[$r, $col['Include']]).Trim()
                if ($inc -notmatch '^(?i)y') { continue }
                $bookRows += [pscustomobject]@{
                    Company = ([string]$arr[$r, $col['Company']]).Trim()
                    Email   = $email.Trim()
                    AddAs   = ([string]$arr[$r, $col['Add As']]).Trim()
                    Reports = ([string]$arr[$r, $col['Reports']]).Trim()
                }
            }
        }
        $wb.Close($false)
    } catch {
        Write-Output ("NOTE: couldn't read the recipients book (" + $_.Exception.Message + ") - drafts still made, unaddressed.")
    } finally {
        if ($xl) { $xl.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) }
    }
    Write-Output ("Recipients book: " + (Split-Path $bookPath -Leaf) + " (" + $bookRows.Count + " active people)")
} else {
    Write-Output "No Coates_Report_Recipients.xlsx found - drafts made without book recipients."
}

function Resolve-Recipients([object]$j) {
    $company = ''
    $report = ''
    if ($j.PSObject.Properties.Name -contains 'company') { $company = ([string]$j.company).Trim() }
    if ($j.PSObject.Properties.Name -contains 'report') { $report = ([string]$j.report).Trim().ToUpper() }
    $to = New-Object System.Collections.Generic.List[string]
    $cc = New-Object System.Collections.Generic.List[string]
    if ($j.PSObject.Properties.Name -contains 'to' -and $j.to) {
        foreach ($a in ([string]$j.to) -split ';') {
            $a = $a.Trim(); if ($a) { $to.Add($a) }
        }
    }
    if ($j.PSObject.Properties.Name -contains 'cc' -and $j.cc) {
        foreach ($a in ([string]$j.cc) -split ';') {
            $a = $a.Trim(); if ($a) { $cc.Add($a) }
        }
    }
    foreach ($row in $bookRows) {
        $compOk = ($row.Company -eq '' -or $row.Company -match '^(?i)ALL$')
        if (-not $compOk -and $company) {
            $compOk = ($row.Company.ToUpper() -eq $company.ToUpper())
        }
        if (-not $compOk -and -not $company -and $row.Company -notmatch '^(?i)ALL$') {
            # untagged manifest: match by company name appearing in subject
            $compOk = ([string]$j.subject).ToUpper().Contains($row.Company.ToUpper())
        }
        if (-not $compOk) { continue }
        $explicit = $false
        if ($report) {
            foreach ($t in $row.Reports -split ',') {
                if ($t.Trim().ToUpper() -eq $report) { $explicit = $true; break }
            }
        }
        $repOk = ($row.Reports -eq '' -or $row.Reports -match '^(?i)ALL$' -or $explicit)
        if (-not $repOk) { continue }
        # Coates-internal reports (BILLING): Reports = ALL is only enough for
        # @coates.com.au addresses - a client contact on ALL must never be
        # auto-addressed onto an internal figure sheet. Listing the tag
        # explicitly is deliberate and always honoured. (Mirrors recipients.py)
        if (@('BILLING') -contains $report -and -not $explicit -and
            -not $row.Email.Trim().ToLower().EndsWith('@coates.com.au')) { continue }
        # Personal emails (MYGEAR): addressed to the person themselves from
        # the People (Email) sheet - Reports = ALL never piles the address
        # book onto someone's personal scorecard. Explicit MYGEAR only.
        if (@('MYGEAR') -contains $report -and -not $explicit) { continue }
        if ($row.AddAs -match '^(?i)cc') { $cc.Add($row.Email) } else { $to.Add($row.Email) }
    }
    $toU = @(); $seen = @{}
    foreach ($a in $to) { $k = $a.ToUpper(); if (-not $seen[$k]) { $seen[$k] = 1; $toU += $a } }
    $ccU = @()
    foreach ($a in $cc) { $k = $a.ToUpper(); if (-not $seen[$k]) { $seen[$k] = 1; $ccU += $a } }
    return @(($toU -join '; '), ($ccU -join '; '))
}

if ($Test) {
    Write-Output ''
    Write-Output 'TEST MODE - no drafts created. Resolved recipients:'
    foreach ($mf in $manifests) {
        $j = Get-Content $mf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        $res = Resolve-Recipients $j
        Write-Output ('  ' + $j.subject)
        Write-Output ('     To: ' + $(if ($res[0]) { $res[0] } else { '(none - add in Outlook)' }))
        if ($res[1]) { Write-Output ('     Cc: ' + $res[1]) }
    }
    exit 0
}

try {
    $ol = New-Object -ComObject Outlook.Application
} catch {
    Write-Output "Couldn't reach Outlook. Open Outlook once, then run this again."
    exit 1
}

$made = 0
$sent = 0
foreach ($mf in $manifests) {
    try {
        $doneFlag = $mf.FullName + ".done"
        if (-not $Force -and (Test-Path $doneFlag) -and
            ((Get-Item $doneFlag).LastWriteTime -ge $mf.LastWriteTime)) {
            continue   # already drafted for this version of the report
        }
        $j = Get-Content $mf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        $dir = $mf.DirectoryName
        $res = Resolve-Recipients $j
        $mail = $ol.CreateItem(0)
        $mail.Subject = [string]$j.subject
        if ($res[0]) { $mail.To = $res[0] }
        if ($res[1]) { $mail.CC = $res[1] }
        $mail.HTMLBody = (Get-Content (Join-Path $dir $j.body) -Raw -Encoding UTF8)
        foreach ($a in @($j.attachments)) {
            $p = Join-Path $dir ([string]$a)
            if (Test-Path $p) { [void]$mail.Attachments.Add($p) }
            else { Write-Host ("  ! attachment not built, left off {0}: {1}" -f $j.subject, [string]$a) }
        }
        # Reports pasted into the body as inline images: attach each image
        # with its Content-ID so it renders in place in the body, and mark
        # it hidden so it doesn't also show on the paperclip.
        if ($j.images) {
            foreach ($im in @($j.images)) {
                $p = Join-Path $dir ([string]$im.file)
                if (Test-Path $p) {
                    $att = $mail.Attachments.Add($p)
                    $att.PropertyAccessor.SetProperty('http://schemas.microsoft.com/mapi/proptag/0x3712001F', [string]$im.cid)
                    try { $att.PropertyAccessor.SetProperty('http://schemas.microsoft.com/mapi/proptag/0x7FFE000B', $true) } catch {}
                }
            }
        }
        if ($Send -and $res[0]) {
            $mail.Send()
            $sent++
            Set-Content -Path $doneFlag -Value (Get-Date) -ErrorAction SilentlyContinue
            Write-Output ("  SENT:  " + $j.subject)
            Write-Output ("         To: " + $res[0])
            if ($res[1]) { Write-Output ("         Cc: " + $res[1]) }
        } else {
            [void]$mail.Save()
            $made++
            Set-Content -Path $doneFlag -Value (Get-Date) -ErrorAction SilentlyContinue
            if ($Send) {
                Write-Output ("  DRAFT (no To address in the book yet): " + $j.subject)
            } else {
                Write-Output ("  DRAFT: " + $j.subject)
            }
            if ($res[0]) { Write-Output ("         To: " + $res[0]) }
            if ($res[1]) { Write-Output ("         Cc: " + $res[1]) }
        }
    } catch {
        Write-Output ("  SKIPPED " + $mf.Name + ": " + $_.Exception.Message)
    }
}
Write-Output ""
if ($Send) {
    Write-Output ("$sent report(s) SENT; $made left in Drafts (no address in the book yet).")
    Write-Output "Add missing emails to Coates_Report_Recipients.xlsx (Include = Yes) and they'll send next time."
} else {
    Write-Output ("$made draft(s) saved to your Outlook Drafts folder.")
    Write-Output "Recipients came from the address book where matched - review and send."
}
