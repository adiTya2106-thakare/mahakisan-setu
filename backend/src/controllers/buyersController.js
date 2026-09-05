// backend/src/controllers/buyersController.js
const fs = require('fs');
const path = require('path');
const config = require('../config');

let buyers = [];
try {
  const fileContent = fs.readFileSync(path.join(config.DATA_DIR, 'buyers.json'), 'utf8');
  buyers = JSON.parse(fileContent);
} catch (e) {
  console.error('Error loading buyers.json:', e);
}

function getBuyers(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, buyers }));
}

module.exports = {
  getBuyers
};
