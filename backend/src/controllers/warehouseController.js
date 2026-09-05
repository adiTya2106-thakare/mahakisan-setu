// backend/src/controllers/warehouseController.js
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseJsonBody } = require('../utils/bodyParser');

let warehouses = [];
try {
  const fileContent = fs.readFileSync(path.join(config.DATA_DIR, 'warehouses.json'), 'utf8');
  warehouses = JSON.parse(fileContent);
} catch (e) {
  console.error('Error loading warehouses.json:', e);
}

function getWarehouses(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, warehouses }));
}

async function bookStorage(req, res) {
  try {
    const body = await parseJsonBody(req);
    const wh = warehouses.find(w => w.id === body.warehouseId || w.name === body.warehouseName);
    if (!wh) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Warehouse not found' }));
      return;
    }

    const requestedQty = Number(body.quantityMT) || 20;
    wh.capacityAvailableMT = Math.max(0, wh.capacityAvailableMT - requestedQty);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      booking: {
        bookingId: 'BK-MSWC-' + Math.floor(1000 + Math.random() * 9000),
        warehouse: wh.name,
        allocatedMT: requestedQty,
        estimatedMonthlyCost: requestedQty * 10 * wh.ratePerQuintalMonth,
        status: 'Reserved (Pledge Eligible)'
      }
    }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  getWarehouses,
  bookStorage
};
