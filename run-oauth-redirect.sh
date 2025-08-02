#!/bin/bash
# Simple OAuth redirect server for port 3000 -> 5000

# Kill any existing process on port 3000
for pid in $(lsof -ti:3000 2>/dev/null); do
  kill -9 $pid 2>/dev/null
done

# Start the redirect server
node -e "
const http = require('http');
http.createServer((req, res) => {
  const redirectUrl = 'http://localhost:5000' + req.url;
  console.log('[OAuth Redirect] Redirecting from :3000' + req.url + ' to ' + redirectUrl);
  res.writeHead(302, { 'Location': redirectUrl });
  res.end();
}).listen(3000, () => {
  console.log('✓ OAuth redirect server running on port 3000 → 5000');
});
" &

echo "OAuth redirect server started"