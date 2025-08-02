#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler

class RedirectHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        redirect_url = f"http://localhost:5000{self.path}"
        print(f"Redirecting from :3000{self.path} to {redirect_url}")
        self.send_response(302)
        self.send_header('Location', redirect_url)
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[Port 3000 Redirect] {format % args}")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 3000), RedirectHandler)
    print("Redirect server running on port 3000, forwarding to port 5000")
    server.serve_forever()