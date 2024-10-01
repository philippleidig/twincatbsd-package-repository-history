import os
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Anpassung des Request Handlers, um Caching zu deaktivieren
class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Setze Header, um Caching zu verhindern
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

# Verzeichnis und Port definieren
directory = "../"
os.chdir(directory)

port = 8000
server = HTTPServer(("", port), NoCacheHTTPRequestHandler)

print("Open browser with server url")
webbrowser.open(f'http://localhost:{port}/docs/index.html')

print(f"Starting HTTP server on port {port} in directory: {directory}")
server.serve_forever()
