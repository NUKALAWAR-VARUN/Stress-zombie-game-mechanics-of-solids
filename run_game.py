#!/usr/bin/env python3
"""
STRESS ZOMBIE APOCALYPSE - Game Server Launcher
Launches a high-performance multi-threaded HTTP server and displays
shareable local and network links for playing in Chrome or any browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time
import socket

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

def get_lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    port = PORT
    lan_ip = get_lan_ip()
    local_url = f"http://localhost:{port}/"
    network_url = f"http://{lan_ip}:{port}/"

    print("=" * 70, flush=True)
    print("        ⚡ STRESS ZOMBIE APOCALYPSE - GAME SERVER LAUNCHER ⚡", flush=True)
    print("=" * 70, flush=True)
    print(f"[*] Serving files from:     {script_dir}", flush=True)
    print(f"[*] Local Chrome URL:       {local_url}", flush=True)
    print(f"[*] Shareable Network URL:  {network_url}", flush=True)
    print("=" * 70, flush=True)
    print("  HOW TO SHARE WITH YOUR PROFESSOR / FRIENDS:", flush=True)
    print(f"  1. Same Wi-Fi / Hotspot: Share {network_url}", flush=True)
    print("  2. Remote / Anywhere:    Enable GitHub Pages in your GitHub Repo", flush=True)
    print("     (It generates a permanent live public https:// link instantly!)", flush=True)
    print("=" * 70, flush=True)
    print("[*] Opening game in your default browser...", flush=True)
    print("[*] Press Ctrl+C to stop the game server.\n", flush=True)

    def open_browser():
        time.sleep(1.0)
        try:
            webbrowser.open(local_url)
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    try:
        with socketserver.ThreadingTCPServer(("", port), CustomHandler) as httpd:
            print(f"[*] Server listening on 0.0.0.0:{port}...", flush=True)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server stopped.", flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"\n[!] Error: {e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
