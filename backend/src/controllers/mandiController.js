// backend/src/controllers/mandiController.js
const fs = require('fs');
const path = require('path');
const config = require('../config');

let mandiRates = [];
try {
  const fileContent = fs.readFileSync(path.join(config.DATA_DIR, 'mandiRates.json'), 'utf8');
  mandiRates = JSON.parse(fileContent);
} catch (e) {
  console.error('Error loading mandiRates.json:', e);
}

function getMandiRates(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, rates: mandiRates }));
}

function calculateSaleWindowAdvisory(req, res, parsedUrl) {
  const cropKey = parsedUrl.searchParams.get('crop') || 'onion';
  const qty = parseFloat(parsedUrl.searchParams.get('qty')) || 100;
  const currentRate = parseFloat(parsedUrl.searchParams.get('rate')) || 2400;
  const days = parseInt(parsedUrl.searchParams.get('days'), 10) || 30;

  let projectedRate = currentRate;
  let storageMonthlyRent = 85;
  let shrinkagePercent = 2.0;

  if (cropKey === 'onion') {
    projectedRate = currentRate * (1 + (days / 30) * 0.18);
    storageMonthlyRent = 85;
    shrinkagePercent = 2.5;
  } else if (cropKey === 'soybean') {
    projectedRate = currentRate * (1 + (days / 30) * 0.06);
    storageMonthlyRent = 60;
    shrinkagePercent = 0.8;
  } else if (cropKey === 'tomato') {
    projectedRate = currentRate * (1 - (days / 30) * 0.14);
    storageMonthlyRent = 95;
    shrinkagePercent = 5.0;
  } else if (cropKey === 'orange') {
    projectedRate = currentRate * (1 + (days / 30) * 0.16);
    storageMonthlyRent = 110;
    shrinkagePercent = 2.0;
  } else {
    projectedRate = currentRate * (1 + (days / 30) * 0.12);
    storageMonthlyRent = 75;
    shrinkagePercent = 2.0;
  }

  const immediateRevenue = qty * currentRate;
  const storageCost = qty * storageMonthlyRent * (days / 30);
  const postShrinkageQty = qty * (1 - shrinkagePercent / 100);
  const futureGrossRevenue = postShrinkageQty * projectedRate;
  const shrinkageLossAmt = (qty - postShrinkageQty) * projectedRate;
  const pledgeLoanSubsidy = (immediateRevenue * 0.75) * (0.03 * (days / 365));

  const netHoldingRevenue = futureGrossRevenue - storageCost + pledgeLoanSubsidy;
  const netGain = netHoldingRevenue - immediateRevenue;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    analysis: {
      cropKey,
      qty,
      days,
      currentRate,
      immediateRevenue,
      projectedRate: Math.round(projectedRate),
      storageCost: Math.round(storageCost),
      shrinkageLossAmt: Math.round(shrinkageLossAmt),
      pledgeLoanSubsidy: Math.round(pledgeLoanSubsidy),
      netGain: Math.round(netGain),
      recommendedAction: netGain > 5000 ? 'HOLD' : 'SELL_NOW'
    }
  }));
}

module.exports = {
  getMandiRates,
  calculateSaleWindowAdvisory
};
