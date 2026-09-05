// backend/src/controllers/lotsController.js
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseJsonBody } = require('../utils/bodyParser');

let lots = [];
try {
  const fileContent = fs.readFileSync(path.join(config.DATA_DIR, 'lots.json'), 'utf8');
  lots = JSON.parse(fileContent);
} catch (e) {
  console.error('Error loading lots.json:', e);
}

function getLots(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, lots }));
}

async function createLot(req, res) {
  try {
    const body = await parseJsonBody(req);
    const newLot = {
      id: 'LOT-MH-' + Math.floor(2405 + Math.random() * 900),
      farmerName: body.farmerName || 'Maharashtra Kisan / FPO Member',
      farmerContact: body.farmerContact || '+91 98' + Math.floor(10000000 + Math.random() * 89999999),
      district: body.district || 'Nashik',
      mandiTaluka: body.mandiTaluka || 'District APMC Yard',
      crop: body.crop || 'Nashik Red Onion (लाल कांदा)',
      variety: body.variety || 'Standard Hybrid',
      harvestDate: body.harvestDate || new Date().toISOString().split('T')[0],
      quantityQuintals: Number(body.quantityQuintals) || 100,
      minPricePerQuintal: Number(body.minPricePerQuintal) || 2400,
      expectedPrice: Number(body.expectedPrice) || 2650,
      grade: body.grade || 'Grade A (AI Assessed)',
      moisturePercent: body.moisturePercent || 11.5,
      uniformSizeMm: body.uniformSizeMm || 'Standard Market Grade',
      qualityBadge: 'Certified AI Verified',
      status: 'Bidding Active',
      highestBid: Number(body.minPricePerQuintal) + 50,
      highestBidder: 'Sahyadri Agro Processing',
      escrowStatus: 'Ready for Escrow',
      offersCount: 1,
      storageLocation: body.storageLocation || 'Farm Gate / Local Mandi Depot',
      isFpoPool: !!body.isFpoPool,
      pooledFarmers: body.isFpoPool ? Number(body.pooledFarmers || 5) : 1
    };

    lots.unshift(newLot);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, lot: newLot }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function submitBid(req, res) {
  try {
    const body = await parseJsonBody(req);
    const targetLot = lots.find(l => l.id === body.lotId);

    if (!targetLot) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Lot not found' }));
      return;
    }

    if (body.action === 'accept') {
      targetLot.status = 'Escrow Locked';
      targetLot.escrowStatus = '20% Advance Locked in Escrow';
    } else if (body.bidAmount) {
      targetLot.highestBid = Number(body.bidAmount);
      targetLot.highestBidder = body.buyerName || 'Verified Institutional Buyer';
      targetLot.offersCount = (targetLot.offersCount || 0) + 1;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, lot: targetLot }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  getLots,
  createLot,
  submitBid
};
