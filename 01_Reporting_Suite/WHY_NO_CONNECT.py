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
    try:
        import net_pick
        ips = [ip for ip, _n, is_net in net_pick.candidates() if not is_net]
        allips = [ip for ip, _n, _b in net_pick.candidates()]
    except Exception:
        ips, allips = [], []
    problems = []

    # ---- 1. is the server even running -------------------------------
    print("")
    up = can_connect("127.0.0.1", PORT)
    print(" 1. Server running on this laptop      : {}".format(
        "YES" if up else "NO"))
    if not up:
        problems.append(
            "The server isn't running. Start 31_START_GEAR_LOOKUP_HTTPS.bat\n"
            "      and LEAVE THAT WINDOW OPEN. Everything else is fine to\n"
            "      check after that.")
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
                   "name=Coates My Gear"])
    has_rule = "Coates My Gear" in rules
    enabled = "Yes" in rules.split("Enabled:")[1][:12] if "Enabled:" in rules \
        else False
    print(" 3. Firewall rule for port {}        : {}".format(
        PORT, "YES" if has_rule and enabled else
        ("present but DISABLED" if has_rule else "NOT THERE")))
    if not (has_rule and enabled):
        problems.append(
            "Windows Firewall is blocking the port. Right-click Command\n"
            "      Prompt, Run as administrator, and paste this ONE line:\n\n"
            '      netsh advfirewall firewall add rule name="Coates My Gear" '
            'dir=in action=allow protocol=TCP localport={}'.format(PORT))

    # ---- 4. Public network = nothing gets in -------------------------
    prof = ps("Get-NetConnectionProfile | "
              "Select-Object -Property InterfaceAlias,NetworkCategory | "
              "Format-Table -AutoSize | Out-String")
    if prof:
        print(" 4. Network profiles:")
        for line in [l for l in prof.splitlines() if l.strip()][:8]:
            print("      " + line.strip())
        if "Public" in prof:
            problems.append(
                "One of your networks is set to PUBLIC, and Windows blocks\n"
                "      incoming connections on Public - no exceptions.\n"
                "      Settings > Network & internet > Ethernet > Private "
                "network")
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
    print("       https://{}:{}/".format(best, PORT))

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
