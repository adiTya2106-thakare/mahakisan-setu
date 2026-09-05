// backend/src/config/index.js
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const BACKEND_DIR = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.resolve(ROOT_DIR, 'frontend');
const DATA_DIR = path.resolve(__dirname, '../data');

module.exports = {
  PORT: process.env.PORT || 4173,
  ROOT_DIR,
  BACKEND_DIR,
  FRONTEND_DIR,
  DATA_DIR
};
