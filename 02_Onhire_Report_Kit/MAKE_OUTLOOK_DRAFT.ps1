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
if (-not (Test-Path $reports)) {
    Write-Output "No Reports folder yet. Press 2_MAKE_THE_REPORT.bat first."
    exit 1
}
if ($Date -eq "") {
    $day = Get-ChildItem $reports -Directory | Sort-Object Name | Select-Object -Last 1
} else {
    $day = Get-Item (Join-Path $reports $Date) -ErrorAction SilentlyContinue
}
if (-not $day) {
    Write-Output "No report folder found for $Date under Reports."
    exit 1
}
$folder = $day.FullName
if ($Companies) { $folder = Join-Path $day.FullName 'By_Company' }
$manifests = Get-ChildItem $folder -Filter '*.draft.json' -ErrorAction SilentlyContinue
if (-not $manifests -or $manifests.Count -eq 0) {
    Write-Output ("No report email found in " + $day.Name + ". Press 2_MAKE_THE_REPORT.bat first.")
    exit 1
}
try {
    $ol = New-Object -ComObject Outlook.Application
} catch {
    Write-Output "Couldn't reach Outlook. Open Outlook once, then run this again."
    exit 1
}
$made = 0
foreach ($mf in $manifests) {
    try {
        $j = Get-Content $mf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        $dir = $mf.DirectoryName
        $mail = $ol.CreateItem(0)
        $mail.Subject = [string]$j.subject
        $mail.HTMLBody = (Get-Content (Join-Path $dir $j.body) -Raw -Encoding UTF8)
        foreach ($a in @($j.attachments)) {
            $p = Join-Path $dir ([string]$a)
            if (Test-Path $p) { [void]$mail.Attachments.Add($p) }
        }
        [void]$mail.Save()
        $made++
        Write-Output ("  DRAFT: " + $j.subject)
    } catch {
        Write-Output ("  SKIPPED " + $mf.Name + ": " + $_.Exception.Message)
    }
}
Write-Output ""
Write-Output ("$made draft(s) saved to your Outlook Drafts folder - " + $day.Name + ".")
Write-Output "Open Outlook > Drafts, add the addresses (the address book works -"
Write-Output "it is a real Outlook message), read it, press Send."
