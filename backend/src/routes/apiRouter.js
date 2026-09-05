// backend/src/routes/apiRouter.js
const mandiController = require('../controllers/mandiController');
const lotsController = require('../controllers/lotsController');
const buyersController = require('../controllers/buyersController');
const warehouseController = require('../controllers/warehouseController');
const disputesController = require('../controllers/disputesController');

async function handleApiRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // System Health
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      architecture: 'modular-mvc',
      platform: 'MahaKisan Setu',
      timestamp: new Date().toISOString()
    }));
    return true;
  }

  // Mandi Rates & Advisory
  if (pathname === '/api/mandi-rates' && method === 'GET') {
    mandiController.getMandiRates(req, res);
    return true;
  }
  if (pathname === '/api/advisory' && method === 'GET') {
    mandiController.calculateSaleWindowAdvisory(req, res, parsedUrl);
    return true;
  }

  // Trade Lots & Bids
  if (pathname === '/api/lots') {
    if (method === 'GET') {
      lotsController.getLots(req, res);
      return true;
    }
    if (method === 'POST') {
      await lotsController.createLot(req, res);
      return true;
    }
  }
  if (pathname === '/api/bids' && method === 'POST') {
    await lotsController.submitBid(req, res);
    return true;
  }

  // Verified Institutional Buyers
  if (pathname === '/api/buyers' && method === 'GET') {
    buyersController.getBuyers(req, res);
    return true;
  }

  // Warehouses & Cold Chain
  if (pathname === '/api/warehouses' && method === 'GET') {
    warehouseController.getWarehouses(req, res);
    return true;
  }
  if (pathname === '/api/warehouses/book' && method === 'POST') {
    await warehouseController.bookStorage(req, res);
    return true;
  }

  // Disputes & Grievance Redressal
  if (pathname === '/api/disputes') {
    if (method === 'GET') {
      disputesController.getDisputes(req, res);
      return true;
    }
    if (method === 'POST') {
      await disputesController.createDispute(req, res);
      return true;
    }
  }
  if (pathname === '/api/disputes/resolve' && method === 'POST') {
    await disputesController.resolveDispute(req, res);
    return true;
  }

  // Route not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `API route ${method} ${pathname} not found` }));
  return true;
}

module.exports = {
  handleApiRequest
};
