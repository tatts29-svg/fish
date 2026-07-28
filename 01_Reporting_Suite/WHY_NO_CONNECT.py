#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHY CAN'T MY PHONE CONNECT
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "cant reach".
#
#  "Can't reach this site" on a phone is the least useful error message
#  in the world - it is the same words whether the server is off, the
#  firewall is shut, the network is set to Public, or the phone is
#  simply on the wrong Wi-Fi. Four completely different jobs, one
#  message.
#
#  So this walks the chain from this end, in order, and stops at the
#  first thing that is actually wrong:
#
#     1. is the server running at all
#     2. is it listening on the network, or only to itself
#     3. is Windows Firewall letting the port through
#     4. is the ethernet network Private (Public blocks everything in)
#     5. what address should the phone be using
#
#  Everything it checks, it checks by doing - opening the socket,
#  reading the real firewall rules - not by assuming.
# =====================================================================
import os
import socket
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
#  BOTH doors. 8443 is the https server (31_), 8123 the plain http one
#  (05_). Checking only 8443 reported "server not running" at a man who
#  had 05_ open in front of him. (Andrew, 28 Jul 2026: "I can't
#  connect.")
PORTS = [8443, 8123]
PORT = 8443


def can_connect(host, port, timeout=1.5):
    try:
        s = socket.create_connection((host, port), timeout)
        s.close()
        return True
    except Exception:
        return False


def ps(cmd):
    """Ask Windows a question. Empty string if we can't (not Windows,
    or PowerShell is locked down) - never a crash."""
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command", cmd],
            capture_output=True, timeout=25)
        return (out.stdout or b"").decode("utf-8", "replace").strip()
    except Exception:
        return ""


def netsh(args):
    try:
        out = subprocess.run(["netsh"] + args, capture_output=True, timeout=25)
        return (out.stdout or b"").decode("utf-8", "replace")
    except Exception:
        return ""


def main():
    print("=" * 68)
    print(" COATES | WHY CAN'T MY PHONE CONNECT")
    print("=" * 68)
    net_pick = None
    try:
        import net_pick
        ips = [ip for ip, _n, is_net in net_pick.candidates() if not is_net]
        allips = [ip for ip, _n, _b in net_pick.candidates()]
    except Exception:
        ips, allips = [], []
    problems = []

    # ---- 1. is the server even running -------------------------------
    print("")
    live = [p for p in PORTS if can_connect("127.0.0.1", p)]
    up = bool(live)
    globals()["PORT"] = live[0] if live else 8443
    print(" 1. Server running on this laptop      : {}".format(
        "YES on port {}".format(", ".join(str(p) for p in live))
        if up else "NO - nothing on 8443 or 8123"))
    if not up:
        problems.append(
            "The server isn't running. Start ONE of these and LEAVE THE\n"
            "      WINDOW OPEN:\n"
            "        05_START_GEAR_LOOKUP.bat        plain, no warning\n"
            "        31_START_GEAR_LOOKUP_HTTPS.bat  secure, card scanning\n"
            "      Everything else is fine to check after that.")
        for p in problems:
            print("")
            print(" ==> " + p)
        return 1

    # ---- 2. listening on the network, or only to itself --------------
    reach = [ip for ip in allips if can_connect(ip, PORT)]
    print(" 2. Reachable on its network address   : {}".format(
        ", ".join(reach) if reach else "NO - only on localhost"))
    if not reach:
        problems.append(
            "The server is only listening to itself. That is unusual -\n"
            "      send Claude this whole screen.")

    # ---- 3. the firewall ---------------------------------------------
    rules = netsh(["advfirewall", "firewall", "show", "rule",
                   "name=Coates My Gear", "verbose"])
    has_rule = "Coates My Gear" in rules
    #  the rule has to cover the port the server is ACTUALLY on
    port_ok = str(PORT) in rules
    #  netsh pads its values out to about column 38, so a fixed-width
    #  slice after "Enabled:" reads nothing but spaces and every healthy
    #  rule looks disabled. Read the whole line instead. (Told Andrew his
    #  rule was "present but DISABLED" when it was fine - 28 Jul 2026.)
    enabled = False
    for line in rules.splitlines():
        if line.strip().lower().startswith("enabled:"):
            enabled = "yes" in line.lower()
            break
    print(" 3. Firewall rule for port {}        : {}".format(
        PORT, "YES" if has_rule and enabled and port_ok else
        ("rule exists but NOT for port {}".format(PORT))
        if has_rule and enabled and not port_ok else
        ("present but DISABLED" if has_rule else "NOT THERE")))
    if not (has_rule and enabled and port_ok):
        problems.append(
            "Windows Firewall is blocking port {}. Easiest fix: just\n"
            "      double-click 44_ALLOW_PHONES_IN.bat - it opens BOTH\n"
            "      ports (8443 and 8123) and asks Windows for permission\n"
            "      itself.".format(PORT))

    # ---- 4. Public network = nothing gets in -------------------------
    #  ONLY the card the phones come in on matters. Andrew's building
    #  Wi-Fi is Public and should stay that way - you do not want a work
    #  laptop discoverable on a site network. Flagging every Public
    #  profile sent him off to change the wrong setting. So: find which
    #  interface actually holds the store address, and judge that one.
    #  (28 Jul 2026 - Ethernet 2 was already Private; the only real
    #  problem was the firewall.)
    try:
        best_ip = net_pick.best_guess()
    except Exception:
        best_ip = ips[0] if ips else ""
    #  Ask Windows straight out which card holds that address and what
    #  category it is - one question, one answer. Matching the address to
    #  an alias and then the alias to a row of a formatted table was two
    #  chances to get it wrong, and it marked the Wi-Fi as "the one the
    #  phones use" when the store router is on ethernet. (28 Jul 2026.)
    alias, serving_cat = "", ""
    if best_ip:
        out = ps("$a=Get-NetIPAddress -IPAddress '{}' -ErrorAction "
                 "SilentlyContinue; if($a){{$p=Get-NetConnectionProfile "
                 "-InterfaceIndex $a.InterfaceIndex -ErrorAction "
                 "SilentlyContinue; "
                 "'{{0}}|{{1}}' -f $a.InterfaceAlias,$p.NetworkCategory}}"
                 .format(best_ip))
        if out and "|" in out:
            alias, serving_cat = [x.strip()
                                  for x in out.splitlines()[0].split("|", 1)]
    prof = ps("Get-NetConnectionProfile | "
              "Select-Object -Property InterfaceAlias,NetworkCategory | "
              "Format-Table -AutoSize | Out-String")
    if prof:
        print(" 4. Network profiles:")
        for line in [l for l in prof.splitlines() if l.strip()][:8]:
            mark = ""
            if alias and line.strip().lower().startswith(alias.lower()):
                mark = "   <-- the one the phones use ({})".format(best_ip)
            print("      " + line.strip() + mark)
        serving_public = (serving_cat.lower() == "public")
        if serving_public:
            #  Name the card Windows actually reports, and send him to
            #  the matching page. Saying "Ethernet" when the router is
            #  on Wi-Fi sends him to a setting that changes nothing.
            #  (Andrew's router turned out to be on Wi-Fi - 28 Jul 2026.)
            where = ("Wi-Fi > click your network's name"
                     if "wi" in alias.lower().replace("-", "")
                     else "Ethernet")
            problems.append(
                "THIS IS IT. The network the phones come in on is '{a}',\n"
                "      and it is set to PUBLIC. Windows blocks every\n"
                "      incoming connection on a Public network - the\n"
                "      firewall rule does not even apply.\n\n"
                "      Settings > Network & internet > {w} > Private network\n\n"
                "      Set '{a}' to Private, then try the phone again.\n"
                "      Nothing else needs changing."
                .format(a=alias, w=where))
        elif "Public" in prof:
            print("      (a Public network is listed, but it is not the one")
            print("       serving the phones - leave it as it is.)")
    else:
        print(" 4. Network profiles                   : couldn't read them")

    # ---- 5. the address to use ---------------------------------------
    print("")
    print(" 5. Addresses on this machine:")
    try:
        import net_pick
        for line in net_pick.report("      "):
            print(line)
        best = net_pick.best_guess()
    except Exception:
        best = ips[0] if ips else "?"
    print("")
    print("    On the phone, open exactly this:")
    #  8443 is the https server, 8123 the plain one - printing the wrong
    #  scheme sends him to a page that will never load.
    scheme = "https" if PORT == 8443 else "http"
    print("       {}://{}:{}/".format(scheme, best, PORT))

    # ---- verdict ------------------------------------------------------
    print("")
    print("-" * 68)
    if not problems:
        print(" Everything on THIS laptop checks out.")
        print("")
        print(" So the problem is at the phone end. In order:")
        print("   a) Is the phone on the STORE ROUTER's Wi-Fi? Not mobile")
        print("      data, not the office Wi-Fi. This is it, nine times out")
        print("      of ten.")
        print("   b) Did you type https:// and :{} ? Both are needed."
              .format(PORT))
        print("   c) On the security warning, tap through it - iPhone:")
        print("      Show Details > visit this website. Android: Advanced >")
        print("      Proceed. The certificate is self-made, that warning is")
        print("      expected.")
        print("   d) Some routers have 'AP isolation' or 'client isolation'")
        print("      switched on, which stops devices on the Wi-Fi talking")
        print("      to anything on the cable. Turn it OFF in the router.")
        return 0
    print(" FOUND {} THING(S) TO FIX:".format(len(problems)))
    for i, p in enumerate(problems, 1):
        print("")
        print(" {}. {}".format(i, p))
    print("")
    print(" Fix those, then run me again.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
