#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR over HTTPS - so the phone camera scanner works
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 27 Jul 2026): the Scan button on My Gear lets a bloke
#  scan his own ID card instead of typing the number. Every browser on
#  earth refuses camera access on a plain http:// page - so on the
#  store's http://<ip>:8123 the button correctly hides itself. Nothing
#  in the page can change that; the page has to be served over HTTPS.
#
#  This serves the SAME Gear_Lookup folder over https on port 8443,
#  making its own certificate the first time. The certificate is
#  self-signed - the phone will warn once, the crew taps through, and
#  from then on the camera works.
#
#  Nothing about My Gear itself changes. The http server (button 05)
#  still works exactly as it does now; this is an extra door.
# =====================================================================
import os
import shutil
import socket
import ssl
import subprocess
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "Gear_Lookup")
CERT = os.path.join(HERE, "Updates", "gear_https_cert.pem")
PORT = 8443


def lan_ip():
    """The address to SERVE ON and print in the poster.

    Andrew's laptop is on two cards at once: a 4G stick (internet) and the
    store router (no internet, the phones' network). The old code here
    opened a socket towards the internet and took whichever card answered -
    that is the 4G/internet card, exactly the WRONG side to serve My Gear
    on. net_pick.best_guess() returns the store-router card instead (the
    same one the plain-http launcher already binds to), so both paths agree
    and nothing is ever served on the internet-facing card. Falls back to
    the old behaviour only if net_pick can't be read."""
    try:
        import net_pick
        ip = net_pick.best_guess()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def make_cert(ip):
    """A self-signed certificate for this machine. openssl if it is
    here, otherwise Python's cryptography package."""
    os.makedirs(os.path.dirname(CERT), exist_ok=True)
    exe = shutil.which("openssl")
    if exe:
        cnf = ("[req]\ndistinguished_name=dn\nx509_extensions=v3\n"
               "prompt=no\n[dn]\nCN={ip}\nO=Coates\n"
               "[v3]\nsubjectAltName=IP:{ip},DNS:localhost\n"
               "basicConstraints=CA:FALSE\n").format(ip=ip)
        cpath = CERT + ".cnf"
        with open(cpath, "w") as f:
            f.write(cnf)
        r = subprocess.run([exe, "req", "-x509", "-newkey", "rsa:2048",
                            "-keyout", CERT, "-out", CERT, "-days", "365",
                            "-nodes", "-config", cpath],
                           capture_output=True, text=True, errors="replace")
        try:
            os.remove(cpath)
        except OSError:
            pass
        if r.returncode == 0 and os.path.isfile(CERT):
            return True
    try:
        import datetime as dt
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        name = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, ip),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Coates")])
        now = dt.datetime.utcnow()
        cert = (x509.CertificateBuilder()
                .subject_name(name).issuer_name(name)
                .public_key(key.public_key())
                .serial_number(x509.random_serial_number())
                .not_valid_before(now - dt.timedelta(days=1))
                .not_valid_after(now + dt.timedelta(days=365))
                .add_extension(x509.SubjectAlternativeName(
                    [x509.IPAddress(__import__("ipaddress").ip_address(ip)),
                     x509.DNSName("localhost")]), critical=False)
                .sign(key, hashes.SHA256()))
        with open(CERT, "wb") as f:
            f.write(key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption()))
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        return True
    except Exception:
        return False


def main():
    print("=" * 62)
    print(" COATES | MY GEAR over HTTPS - phone camera scanning")
    print("=" * 62)
    if not os.path.isdir(ROOT):
        print(" Gear_Lookup folder not found - run 04_RUN_MY_GEAR.bat first.")
        return 1
    ip = lan_ip()
    if not os.path.isfile(CERT):
        print(" Making this machine a certificate (first run only)...")
        if not make_cert(ip):
            print("")
            print(" Could not make a certificate on this machine.")
            print(" Fix: open Command Prompt and run")
            print("     pip install cryptography")
            print(" then run me again. (Or install openssl.)")
            return 1
        print(" Certificate made: Updates\\gear_https_cert.pem")

    os.chdir(ROOT)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        ctx.load_cert_chain(CERT)
    except Exception as e:
        print(" Certificate would not load ({}) - delete".format(e))
        print(" Updates\\gear_https_cert.pem and run me again.")
        return 1

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    #  Bind to the STORE address only - never 0.0.0.0. 0.0.0.0 would put
    #  My Gear (and everyone's names and IDs) on EVERY card the laptop
    #  holds, including the 4G/internet stick. Binding one address is the
    #  same dual-router isolation the plain-http launcher already does.
    srv = ThreadingHTTPServer((ip, PORT), Quiet)
    srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    print("")
    print(" SERVING - leave this window open.")
    print("")
    try:
        import net_pick
        for line in net_pick.report("     "):
            print("  " + line.lstrip()[0:0] + line)
        print("")
    except Exception:
        pass
    print("   On a phone:      https://{}:{}/".format(ip, PORT))
    print("   On this laptop:  https://localhost:{}/".format(PORT))
    print("")
    print(" FIRST TIME ON EACH PHONE: the browser warns that the")
    print(" certificate is not trusted - that is expected on a site the")
    print(" store runs itself. Tap Advanced, then Proceed / Continue.")
    print(" After that the SCAN button appears and the camera works.")
    print("")
    print(" Tell the crews: scan your card instead of typing your number.")
    print(" Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n Stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
