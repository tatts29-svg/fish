#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHICH ADDRESS DO THE PHONES USE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "i'm connected to wifi on my laptop, and
#  then i have the router connected through ethernet."
#
#  That laptop now has TWO addresses, and only one of them is any use.
#
#    Wi-Fi     the building network. Where the laptop gets internet.
#              The phones are NOT on it.
#    Ethernet  the store router. Where the phones ARE.
#
#  Everything so far has picked the address by opening a socket towards
#  the internet and seeing which card answered - which returns the Wi-Fi
#  one, every time. Put that in the QR and every phone on the store
#  router gets "can't reach this site", because it is being sent to an
#  address on a network it isn't joined to.
#
#  So: list every address the machine actually has, and mark which is
#  which. The one to print on the poster is the one that is NOT the
#  internet-facing card.
# =====================================================================
import socket
import subprocess


def wifi_ssid():
    """The Wi-Fi network this laptop is ACTUALLY joined to, straight from
    Windows.

    WHY (Andrew, 28 Jul 2026): his store has 'Tool Store' and 'Tool Store
    2' side by side in the list. The poster builder used to ask him to
    TYPE the network name, and one character between the two of them is
    the difference between a QR that joins the crews to the server and one
    that joins them to nothing. Nobody should have to get that right by
    hand.

    The laptop is already on the right network - that is how it is serving
    the page at all - so ask Windows which one, and offer that. Empty
    string on anything that isn't Windows, or if the machine is on a
    cable only. Never raises."""
    try:
        out = subprocess.run(["netsh", "wlan", "show", "interfaces"],
                             capture_output=True, timeout=15)
        txt = (out.stdout or b"").decode("utf-8", "replace")
    except Exception:
        return ""
    for line in txt.splitlines():
        s = line.strip()
        #  'BSSID' also starts with 'SSID' once you strip the B, and
        #  'SSID' appears inside 'Profile'-style lines on some builds -
        #  so match the field name exactly, left of the colon.
        if ":" not in s:
            continue
        field, _, val = s.partition(":")
        if field.strip().lower() == "ssid":
            return val.strip()
    return ""


def default_route_ip():
    """The card that answers towards the internet - on Andrew's setup
    that is the building Wi-Fi, i.e. the WRONG one for the poster.
    No packet is sent; a UDP connect only sets the destination."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return ""


def all_ipv4():
    """Every IPv4 this machine holds. getaddrinfo on the hostname is the
    portable way - no extra packages, works on a locked-down laptop."""
    found = []
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None,
                                       socket.AF_INET):
            ip = info[4][0]
            if ip and ip not in found:
                found.append(ip)
    except Exception:
        pass
    d = default_route_ip()
    if d and d not in found:
        found.insert(0, d)
    #  127.x is this machine talking to itself - no phone can reach it
    return [ip for ip in found if not ip.startswith("127.")]


def subnet(ip):
    """The /24 an address sits in - close enough for a store network."""
    bits = ip.split(".")
    return ".".join(bits[:3]) if len(bits) == 4 else ip


def match_phone(phone_ip, ips=None):
    """Given the address a PHONE has, say which of this laptop's
    addresses it can actually reach.

    This is the only honest way to answer the question. Everything else
    here is a guess from which card holds the default route - and that
    guess was wrong on Andrew's own setup, where the ethernet carries
    the internet AND the store network. It confidently printed "phones
    CANNOT reach this" beside the one address that would have worked.
    A phone's own IP is not a guess. (28 Jul 2026.)"""
    ips = ips if ips is not None else all_ipv4()
    want = subnet(phone_ip)
    hits = [ip for ip in ips if subnet(ip) == want]
    return hits


def describe(ip, default_ip, shared=False):
    """Plain English for one address.

    'shared' means another card is on the SAME network as this one -
    which happens when the laptop is plugged into the store router AND
    joined to its Wi-Fi. Both addresses then reach the phones, and
    calling either one unreachable is simply wrong. (Andrew's laptop,
    28 Jul 2026: 192.168.0.190 on ethernet and 192.168.0.17 on Wi-Fi -
    one router, two ways in.)"""
    if shared:
        return ("same network as the other card below - either address " \
                "works" if ip != default_ip else
                "same network, and this is the card with internet")
    if ip == default_ip:
        return "the card with the internet - phones may or may not be on " \
               "this one, check with a phone"
    if ip.startswith("169.254."):
        return "no address handed out yet - is the ethernet cable in, and " \
               "the router powered up?"
    if (ip.startswith("192.168.") or ip.startswith("10.")
            or ip.startswith("172.")):
        return "a local network card - phones on this network reach this one"
    return "unusual for a store network - check before you print it"


def candidates():
    """[(ip, note, is_internet_card)] - best first for a store server."""
    d = default_route_ip()
    ips = all_ipv4()
    nets = {}
    for ip in ips:
        nets.setdefault(subnet(ip), []).append(ip)
    out = []
    for ip in ips:
        shared = len(nets.get(subnet(ip), [])) > 1
        out.append((ip, describe(ip, d, shared), ip == d))
    #  the non-internet card first: that is the store router side
    out.sort(key=lambda t: (t[2], t[0]))
    return out


def one_network():
    """True when every address is on the same /24 - one router, and the
    'which one' question does not arise."""
    ips = all_ipv4()
    return len(ips) > 1 and len({subnet(i) for i in ips}) == 1


def best_guess():
    c = candidates()
    for ip, _n, is_net in c:
        if not is_net:
            return ip
    return c[0][0] if c else "192.168.1.50"


def report(prefix="   "):
    """Printed by the server and the poster builder so the two can never
    disagree about which address the crews should be sent to."""
    lines = []
    c = candidates()
    if not c:
        return [prefix + "No network address found - is the laptop on a "
                         "network at all?"]
    same = one_network()
    for i, (ip, note, is_net) in enumerate(c, 1):
        tag = "" if same else ("  <-- NOT this one" if is_net else "")
        lines.append("{}{}  {:<16} {}{}".format(prefix, i, ip, note, tag))
    if same:
        lines.append("")
        lines.append(prefix + "Both cards are on ONE network, so either "
                              "address reaches the phones.")
        lines.append(prefix + "Use the ethernet one - it does not drop out "
                              "the way Wi-Fi does.")
    return lines


if __name__ == "__main__":
    import sys
    ssid = wifi_ssid()
    if ssid:
        print("Wi-Fi this laptop is joined to: {}".format(ssid))
        print("  ^ THIS is the name that must be on the poster. If your")
        print("    store has two similar names in the list, this is the")
        print("    one that works - the page is being served on it.")
        print("")
    print("Addresses on this machine:")
    for line in report():
        print(line)
    print("")
    #  If he tells us the phone's address we stop guessing entirely.
    phone = sys.argv[1] if len(sys.argv) > 1 else ""
    if not phone:
        print("Don't guess - check it properly:")
        print("  On the phone, joined to the STORE Wi-Fi, find its IP")
        print("    iPhone : Settings > Wi-Fi > (i) next to the network")
        print("    Android: Settings > Wi-Fi > tap the network > Details")
        print("  Then run:   42_NETWORK_CHECK.bat  192.168.0.236")
        print("  (with your phone's number instead)")
        print("")
        try:
            phone = input(" Phone's IP address (or press Enter to skip): ").strip()
        except EOFError:
            phone = ""
    if phone:
        hits = match_phone(phone)
        print("")
        if hits:
            print("  Phone is on {} - so it CAN reach:".format(subnet(phone)))
            for h in hits:
                print("     http://{}:8123/     (or https://{}:8443/)"
                      .format(h, h))
            print("")
            print("  Use that on the poster.")
        else:
            print("  Phone is on {}.x and this laptop has nothing on that"
                  .format(subnet(phone)))
            print("  network, so it cannot reach the server at all.")
            print("  Put the laptop on the same network as the phones -")
            print("  cable into the store router, or join its Wi-Fi.")
    else:
        print("Best guess for the poster:", best_guess())
