#!/bin/bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start redirect server
node -e "
const http = require('http');
http.createServer((req, res) => {
  console.log('Redirecting from port 3000 to 5000:', req.url);
  res.writeHead(302, { Location: 'http://localhost:5000' + req.url });
  res.end();
}).listen(3000, () => console.log('Redirect server running on port 3000'));
" &

echo "Redirect server started on port 3000"