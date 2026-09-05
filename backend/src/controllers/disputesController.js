// backend/src/controllers/disputesController.js
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseJsonBody } = require('../utils/bodyParser');

let disputes = [];
try {
  const fileContent = fs.readFileSync(path.join(config.DATA_DIR, 'disputes.json'), 'utf8');
  disputes = JSON.parse(fileContent);
} catch (e) {
  console.error('Error loading disputes.json:', e);
}

function getDisputes(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, disputes }));
}

async function createDispute(req, res) {
  try {
    const body = await parseJsonBody(req);
    const newDispute = {
      id: 'DSP-2026-' + Math.floor(100 + Math.random() * 900),
      lotId: body.lotId || 'LOT-MH-2401',
      filedBy: body.filedBy || 'Maharashtra Farmer / FPO',
      respondent: body.respondent || 'Buyer Processing Corp',
      category: body.category || 'Quality Spec Discrepancy',
      amountInDispute: body.amountInDispute || '₹25,000',
      status: 'Submitted to APMC Observer',
      submittedDate: new Date().toISOString().split('T')[0],
      slaTimeLeft: '48 Hours SLA Target',
      evidenceDocs: body.notes || 'Photographic grade proof uploaded to MSInS portal.'
    };

    disputes.unshift(newDispute);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, dispute: newDispute }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function resolveDispute(req, res) {
  try {
    const body = await parseJsonBody(req);
    const disp = disputes.find(d => d.id === body.disputeId);
    if (!disp) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Dispute not found' }));
      return;
    }

    disp.status = 'Resolved';
    disp.slaTimeLeft = 'Resolved via APMC Mediation';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, dispute: disp }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = {
  getDisputes,
  createDispute,
  resolveDispute
};
