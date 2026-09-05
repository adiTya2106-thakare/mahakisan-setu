// backend/server.js - MahaKisan Setu Backend Server Entrypoint
const http = require('http');
const { exec } = require('child_process');
const config = require('./src/config');
const { handleApiRequest } = require('./src/routes/apiRouter');
const { serveStaticFile } = require('./src/utils/staticServer');

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route API requests
  if (pathname.startsWith('/api/')) {
    await handleApiRequest(req, res, parsedUrl);
    return;
  }

  // Serve Frontend static assets
  serveStaticFile(req, res, pathname);
});

server.listen(config.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🌾 MAHA-KISAN SETU (महाकिसान सेतू)`);
  console.log(`  Govt. of Maharashtra | MSInS Platform`);
  console.log(`  Backend Architecture: Modular Node.js API`);
  console.log(`  Serving Frontend from: ${config.FRONTEND_DIR}`);
  console.log(`  Server live at: http://localhost:${config.PORT}`);
  console.log(`======================================================\n`);

  if (process.platform === 'win32' && !process.env.NO_AUTO_OPEN && process.env.NODE_ENV !== 'production') {
    exec(`start http://localhost:${config.PORT}`);
  }
});
