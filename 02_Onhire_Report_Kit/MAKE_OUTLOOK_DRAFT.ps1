# ==========================================================================
#  COATES | MAKE A NATIVE OUTLOOK DRAFT
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Turns today's report email into a NATIVE Outlook draft - saved straight
#  into your Outlook Drafts folder, where the To field has full address
#  book search and autocomplete (an .eml opened on its own does not).
#  Reads the .draft.json that 2_MAKE_THE_REPORT.bat writes next to the .eml.
#
#  Usage:  double-click 4_MAKE_OUTLOOK_DRAFT.bat      (the report email)
#          double-click 5_MAKE_COMPANY_DRAFTS.bat    (one draft per company)
#          powershell -File MAKE_OUTLOOK_DRAFT.ps1 [-Date yyyy-MM-dd] [-Companies]
# ==========================================================================
param([string]$Date = "", [switch]$Companies)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$reports = Join-Path $here 'Reports'
if (-not (Test-Path -LiteralPath $reports)) {
    Write-Output "No Reports folder yet. Press 2_MAKE_THE_REPORT.bat first."
    exit 1
}
if ($Date -eq "") {
    $todayName = Get-Date -Format "yyyy-MM-dd"
    $day = Get-ChildItem -LiteralPath $reports -Directory | Where-Object { $_.Name -eq $todayName } | Select-Object -First 1
    if (-not $day) {
        $day = Get-ChildItem -LiteralPath $reports -Directory | Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } | Sort-Object Name | Select-Object -Last 1
        if ($day) { Write-Output ("No report folder for today ($todayName) - using the newest, " + $day.Name + ".") }
    }
} else {
    $day = Get-Item -LiteralPath (Join-Path $reports $Date) -ErrorAction SilentlyContinue
}
if (-not $day) {
    Write-Output "No report folder found for $Date under Reports."
    exit 1
}
$folder = $day.FullName
if ($Companies) { $folder = Join-Path $day.FullName 'By_Company' }
$manifests = Get-ChildItem -LiteralPath $folder -Filter '*.draft.json' -ErrorAction SilentlyContinue
if (-not $manifests -or $manifests.Count -eq 0) {
    Write-Output ("No report email found in " + $day.Name + ". Press 2_MAKE_THE_REPORT.bat first.")
    exit 1
}
try {
    $ol = New-Object -ComObject Outlook.Application
} catch {
    Write-Output "Couldn't reach Outlook. This needs classic Outlook (the desktop app); the new Outlook has no automation and some locked-down laptops block it. Open classic Outlook once and run this again - or open the .html, select all, copy, and paste it into a new message."
    exit 1
}
$made = 0
$failed = 0
foreach ($mf in $manifests) {
    try {
        $j = Get-Content -LiteralPath $mf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        $dir = $mf.DirectoryName
        # Validate the complete report before creating a draft. A missing
        # attachment must not leave a convincing but incomplete email in Drafts.
        $bodyPath = Join-Path $dir ([string]$j.body)
        $html = Get-Content -LiteralPath $bodyPath -Raw -Encoding UTF8
        $attachmentPaths = @()
        foreach ($a in @($j.attachments)) {
            $p = Join-Path $dir ([string]$a)
            if (-not (Test-Path -LiteralPath $p -PathType Leaf)) {
                throw "Missing attachment: $a. Build the report again before creating drafts."
            }
            $attachmentPaths += $p
        }
        $mail = $ol.CreateItem(0)
        $mail.Subject = [string]$j.subject
        $mail.HTMLBody = $html
        foreach ($p in $attachmentPaths) {
            [void]$mail.Attachments.Add($p)
        }
        [void]$mail.Save()
        $made++
        Write-Output ("  DRAFT: " + $j.subject)
    } catch {
        $failed++
        Write-Output ("  SKIPPED " + $mf.Name + ": " + $_.Exception.Message)
    }
}
Write-Output ""
Write-Output ("$made draft(s) saved to your Outlook Drafts folder - " + $day.Name + ".")
Write-Output "Open Outlook > Drafts, add the addresses (the address book works -"
Write-Output "it is a real Outlook message), read it, press Send."

if ($failed -gt 0) {
    Write-Output ("$failed draft(s) could not be created. Fix the skipped reports above and run this button again.")
    exit 1
}
exit 0
