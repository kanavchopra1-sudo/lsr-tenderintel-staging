import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get("PORT", 8550))

class StagingHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and prevent aggressive caching for live demo updates
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    print(f"=== LSR TenderIntel AI Staging Server ===")
    print(f"Directory: {web_dir}")
    print(f"Listening on port: {PORT}")
    
    with socketserver.TCPServer(("", PORT), StagingHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)
