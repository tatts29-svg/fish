# ============================================================
#  COATES - AMPOL TOOL STORE - MAKE OUTLOOK DRAFTS
#  Author: Andrew Fisher - POWERED BY SITEIQ
#
#  Finds every *.draft.json manifest under Reports\<today> (every
#  report family writes one) and turns each into a native Outlook
#  DRAFT: subject, HTML body, attachments, and the To line when the
#  manifest carries one. It NEVER sends anything - drafts wait in
#  Outlook until Andrew reads them and presses Send himself.
#
#  WHY (12 Aug 2026): the old per-kit copies of this script scanned
#  folders inherited from the MMG suite (Output_Company_Reports /
#  Output_Story_Reports), so the tooling and radio drafts were never
#  found. One shared script, one place reports land, no mismatch.
#
#  A .done marker beside each manifest stops the same report being
#  drafted twice; -Force re-drafts anyway; -Test shows what would
#  happen without touching Outlook.
# ============================================================
param([switch]$Test, [switch]$Force)

$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$today = (Get-Date).ToString('yyyy-MM-dd')
$dayDir = Join-Path (Join-Path $here 'Reports') $today

if (-not (Test-Path $dayDir)) {
    Write-Host "No reports built today ($today) yet."
    Write-Host "Run 00_RUN_EVERYTHING.bat (or one report button) first."
    exit 0
}

$manifests = @(Get-ChildItem -Path $dayDir -Recurse -Filter '*.draft.json' | Sort-Object FullName)
if ($manifests.Count -eq 0) {
    Write-Host "No email manifests found under Reports\$today."
    Write-Host "Run a report button first - each one writes its own manifest."
    exit 0
}

$outlook = $null
if (-not $Test) {
    try { $outlook = New-Object -ComObject Outlook.Application }
    catch {
        Write-Host ""
        Write-Host "  ============================================================"
        Write-Host "   WARNING - Outlook is not reachable on this machine, so NO"
        Write-Host "   drafts were created. Open Outlook (classic desktop) and run"
        Write-Host "   08_MAKE_OUTLOOK_DRAFTS.bat again, or open the .eml files in"
        Write-Host "   today's Reports folder by double-clicking them instead."
        Write-Host "  ============================================================"
        exit 0
    }
}

$made = 0; $skipped = 0; $problems = 0
foreach ($m in $manifests) {
    $done = "$($m.FullName).done"
    if (-not $Force -and (Test-Path $done) -and ((Get-Item $done).LastWriteTime -ge $m.LastWriteTime)) {
        $skipped++
        Write-Host ("  already drafted: " + $m.Name)
        continue
    }
    try {
        $j = Get-Content $m.FullName -Raw | ConvertFrom-Json
    } catch {
        $problems++
        Write-Host ("  PROBLEM - could not read " + $m.Name + " : " + $_.Exception.Message)
        continue
    }
    $bodyHtml = ""
    if ($j.body) {
        $bodyPath = Join-Path $m.DirectoryName $j.body
        if (Test-Path $bodyPath) { $bodyHtml = Get-Content $bodyPath -Raw -Encoding UTF8 }
        else {
            $problems++
            Write-Host ("  PROBLEM - body file missing for " + $m.Name + " : " + $j.body)
            continue
        }
    }
    $subject = if ($j.subject) { [string]$j.subject } else { $m.BaseName }
    $attach = @()
    if ($j.attachments) {
        foreach ($a in $j.attachments) {
            $p = Join-Path $m.DirectoryName $a
            if (Test-Path $p) { $attach += $p }
            else { Write-Host ("  note - attachment not found, draft goes without it: " + $a) }
        }
    }
    if ($Test) {
        Write-Host ("  WOULD DRAFT: " + $subject)
        if ($j.to) { Write-Host ("     To: " + $j.to) } else { Write-Host "     To: (blank - address it in Outlook)" }
        foreach ($p in $attach) { Write-Host ("     Attach: " + (Split-Path $p -Leaf)) }
        continue
    }
    try {
        $mail = $outlook.CreateItem(0)
        $mail.Subject = $subject
        if ($bodyHtml) { $mail.HTMLBody = $bodyHtml }
        if ($j.to) { $mail.To = [string]$j.to }
        foreach ($p in $attach) { [void]$mail.Attachments.Add($p) }
        $mail.Save()   # Save = Outlook Drafts folder. This script never calls Send.
        Set-Content -Path $done -Value (Get-Date).ToString('s')
        $made++
        Write-Host ("  drafted: " + $subject)
    } catch {
        $problems++
        Write-Host ("  PROBLEM - could not draft " + $m.Name + " : " + $_.Exception.Message)
    }
}

Write-Host ""
Write-Host ("  Drafts made: {0}   already done: {1}   problems: {2}" -f $made, $skipped, $problems)
Write-Host "  Every draft is sitting in Outlook Drafts. NOTHING has been sent."
if ($problems -gt 0) { exit 1 }
exit 0
