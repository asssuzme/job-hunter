const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Log the incoming request
  console.log(`[OAuth Redirect] ${req.method} ${req.url}`);
  
  // Always serve the redirect HTML for any path
  const htmlPath = path.join(__dirname, 'oauth-redirect.html');
  
  fs.readFile(htmlPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading redirect page');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`OAuth redirect server running on http://localhost:${PORT}`);
  console.log('This server handles Supabase OAuth redirects and forwards them to port 5000');
});