# ==========================================================================
#  COATES | START GEAR LOOKUP  (QR at the window)  -  DUAL ROUTER EDITION
#  Serves the Gear_Lookup page on YOUR OWN router's network (the tool store
#  private wifi), NOT the work wifi. Phones join your router's wifi, scan
#  the window poster, enter their ID, and see ONLY their own on-hire list.
#
#  HOW THE ISOLATION WORKS (don't change this back):
#    - First run: you pick which network to serve on (pick your router).
#      The choice is saved to MY_GEAR_NETWORK.txt and reused every morning.
#    - The web server binds to THAT address only - not 0.0.0.0 - so the
#      page is unreachable from the work wifi side of the laptop. People
#      on the work network cannot tap in; only phones on your router can.
#
#  Run order each morning: refresh exports -> run the report kit (option G
#  or --lookup rebuilds the page) -> double-click START_GEAR_LOOKUP.bat.
#  Leave the black window open while the store is open; close it to stop.
#
#  Author: Andrew Fisher | POWERED BY SITEIQ
# ==========================================================================
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$lookupDir = Join-Path $here 'Gear_Lookup'
$cfgPath = Join-Path $here 'MY_GEAR_NETWORK.txt'
$port = 8123

if (-not (Test-Path (Join-Path $lookupDir 'index.html'))) {
    Write-Output 'No lookup page found. Run the report kit first (option G or --lookup).'
    exit 1
}

# ---- read saved network choice (created on first run) --------------------
$cfg = @{}
if (Test-Path $cfgPath) {
    Get-Content $cfgPath | ForEach-Object {
        if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.+?)\s*$') { $cfg[$Matches[1]] = $Matches[2] }
    }
}
if ($cfg['PORT'] -match '^\d+$') { $port = [int]$cfg['PORT'] }
$wifiName = $cfg['WIFI_NAME']

# ---- what wifi is this laptop's wireless adapter on? (label only) --------
$curSsid = ''
try {
    $wl = netsh wlan show interfaces 2>$null
    foreach ($ln in $wl) {
        if ($ln -match '^\s+SSID\s+:\s+(.+)$') { $curSsid = $Matches[1].Trim(); break }
    }
} catch { $curSsid = '' }

# ---- list every live network this laptop is on ---------------------------
$cands = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' -and
                   $_.PrefixOrigin -ne 'WellKnown' })
if (-not $cands -or $cands.Count -eq 0) {
    Write-Output 'No live network found on this laptop.'
    Write-Output 'Plug the ethernet cable from your OWN router into the laptop'
    Write-Output '(LAN port on the router, not the Internet/WAN port) and run this again.'
    exit 1
}

# ---- pick the network: saved choice first, otherwise ask once ------------
$ip = $null
if ($cfg['PREFIX']) {
    $hit = $cands | Where-Object { $_.IPAddress.StartsWith($cfg['PREFIX']) } | Select-Object -First 1
    if ($hit) { $ip = $hit.IPAddress }
    else {
        Write-Output ('Saved My Gear network ' + $cfg['PREFIX'] + 'x is not live right now.')
        Write-Output 'Is your router powered on and the cable plugged in? Pick again below.'
        Write-Output ''
    }
}
if (-not $ip) {
    Write-Output '=================================================================='
    Write-Output ' FIRST-TIME PICK: which network is YOUR router (the tool store one)?'
    Write-Output ' Tip: your own router is usually the Ethernet/USB line. If a line'
    Write-Output ' below is the work wifi, do NOT pick it.'
    Write-Output '=================================================================='
    for ($i = 0; $i -lt $cands.Count; $i++) {
        $c = $cands[$i]
        $note = ''
        if ($c.InterfaceAlias -match 'Wi-?Fi|WLAN') {
            $note = if ($curSsid) { ' (this laptop''s wifi - connected to: ' + $curSsid + ')' }
                    else { ' (this laptop''s wifi adapter)' }
        } elseif ($c.InterfaceAlias -match 'Ethernet|USB|LAN') {
            $note = ' (cabled - likely your router)'
        }
        Write-Output ('   ' + ($i + 1) + '.  ' + $c.IPAddress.PadRight(16) + $c.InterfaceAlias + $note)
    }
    Write-Output ''
    $pick = $null
    while ($null -eq $pick) {
        $raw = Read-Host ('Type the number of YOUR router''s line (1-' + $cands.Count + ')')
        if ($raw -match '^\d+$' -and [int]$raw -ge 1 -and [int]$raw -le $cands.Count) { $pick = [int]$raw }
        else { Write-Output 'Just the number, e.g. 1' }
    }
    $chosen = $cands[$pick - 1]

    # Guard: picking the laptop's wifi adapter usually means the WORK wifi.
    if ($chosen.InterfaceAlias -match 'Wi-?Fi|WLAN') {
        Write-Output ''
        Write-Output '  CAREFUL: that is this laptop''s wifi adapter. If that wifi is the'
        Write-Output '  work network, the page would be served to the work wifi - the'
        Write-Output '  thing we are avoiding. Only continue if this wifi IS your own router.'
        $sure = Read-Host '  Serve on this wifi anyway? (Y/N)'
        if ($sure -notmatch '^[Yy]') { Write-Output 'Stopped. Run again and pick the router line.'; exit 1 }
    }
    $ip = $chosen.IPAddress

    if (-not $wifiName) {
        $wifiName = Read-Host 'Wifi name (SSID) of YOUR router that phones will join, e.g. K2 TOOL STORE'
        if (-not $wifiName) { $wifiName = 'the tool store' }
    }
    # Save prefix (first three octets) so every later morning is automatic.
    $prefix = ($ip -split '\.')[0..2] -join '.'
    $prefix = $prefix + '.'
    $body = "PREFIX=$prefix`r`nWIFI_NAME=$wifiName`r`nPORT=$port`r`n"
    [System.IO.File]::WriteAllText($cfgPath, $body, [System.Text.Encoding]::UTF8)
    Write-Output ''
    Write-Output ('Saved. Next time this picks ' + $prefix + 'x automatically (delete')
    Write-Output 'MY_GEAR_NETWORK.txt if you ever change routers).'
}
if (-not $wifiName) { $wifiName = 'the tool store' }

$url = "http://{0}:{1}/" -f $ip, $port
Write-Output ''
Write-Output '=================================================================='
Write-Output (' MY GEAR is serving on YOUR router''s network only: ' + $url)
Write-Output (' Phones must be on the "' + $wifiName + '" wifi to see it.')
Write-Output ' The work wifi side of this laptop is NOT served - nobody on the'
Write-Output ' work network can reach this page.'
Write-Output '=================================================================='

# ---- build the QR window poster ------------------------------------------
# (Needs the little qrcode library once. If the store has no internet and
#  it was never installed, the poster falls back to the address in big text
#  - still works fine. To get the QR square, run this once anywhere with
#  internet and it installs and is kept for good.)
$qrB64 = ''
try {
    $py = @"
import base64, io as _io
try:
    import qrcode
except ImportError:
    import subprocess, sys
    subprocess.run([sys.executable, '-m', 'pip', 'install', '--user', '--quiet', 'qrcode', 'pillow'], timeout=180)
    import qrcode
img = qrcode.make('$url')
buf = _io.BytesIO()
img.save(buf, format='PNG')
print(base64.b64encode(buf.getvalue()).decode())
"@
    $qrB64 = (& python -c $py 2>$null | Select-Object -Last 1)
} catch { $qrB64 = '' }

$qrHtml = if ($qrB64 -and $qrB64.Length -gt 100) {
    '<img src="data:image/png;base64,' + $qrB64 + '" style="width:340px;height:340px;">'
} else {
    '<div style="font-size:40px;font-weight:900;border:6px solid #1D1D1B;padding:30px;border-radius:12px;">' + $url + '</div>'
}
$poster = @"
<!DOCTYPE html><html><head><meta charset='utf-8'><title>SiteIQ My Gear - Window Poster</title></head>
<body style='font-family:Segoe UI,Arial,sans-serif;text-align:center;margin:0;padding:34px 40px;color:#1D1D1B;'>
<div style='height:10px;background:#F26222;border-radius:5px;margin:-10px -16px 26px -16px;'></div>
<div style='font-size:17px;font-weight:800;color:#F26222;letter-spacing:4px;'>COATES &middot; K2 TOOL STORE</div>
<div style='font-size:56px;font-weight:900;margin-top:6px;'>SiteIQ <span style='color:#F26222;'>My Gear</span></div>
<div style='font-size:24px;font-weight:700;color:#555;margin:6px 0 26px 0;'>Scan the window. See your gear. <span style='color:#F26222;'>Your list, nobody else's.</span></div>
$qrHtml
<div style='font-size:22px;margin-top:26px;line-height:1.6;'><b>1.</b> Join the <b>$wifiName</b> Wi-Fi (password at the counter)<br><b>2.</b> Scan with your phone camera &nbsp;&nbsp;<b>3.</b> Enter your ID number - your list appears in seconds</div>
<div style='font-size:15px;color:#555;margin-top:24px;'>Finished with gear? Over the counter - off your name in seconds.<br>Updated each morning from SiteIQ &bull; Two scans. Two looks. One standard.</div>
<div style='font-size:12px;color:#999;margin-top:18px;'>$url &bull; SiteIQ My Gear &bull; POWERED BY SITEIQ &bull; Author: Andrew Fisher</div>
</body></html>
"@
$posterPath = Join-Path $lookupDir 'QR_Window_Poster.html'
[System.IO.File]::WriteAllText($posterPath, $poster, [System.Text.Encoding]::UTF8)
Write-Output ''
Write-Output ("Window poster written: " + $posterPath)
Write-Output "  (open it and print - it carries the QR for today's address)"

# ---- firewall hint --------------------------------------------------------
Write-Output ''
Write-Output 'If phones cannot reach the page: when Windows asks about Python,'
Write-Output 'tick PRIVATE networks and Allow. No admin rights on this laptop?'
Write-Output 'The setup guide has a one-line ask for IT (TCP 8123, python.exe,'
Write-Output 'Private profile only).'
Write-Output ''
Write-Output 'Serving now - leave this window open. Ctrl+C or close to stop.'
Set-Location $lookupDir
# Bound to $ip on purpose - THIS is the dual-router isolation. 0.0.0.0
# would serve every network on the laptop, including the work wifi.
python -m http.server $port --bind $ip
