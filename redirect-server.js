const http = require('http');

const server = http.createServer((req, res) => {
  const redirectUrl = `http://localhost:5000${req.url}`;
  console.log(`Redirecting from :3000${req.url} to ${redirectUrl}`);
  res.writeHead(302, { 'Location': redirectUrl });
  res.end();
});

server.listen(3000, () => {
  console.log('Redirect server running on port 3000, forwarding to port 5000');
});