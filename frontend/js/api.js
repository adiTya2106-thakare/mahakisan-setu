// frontend/js/api.js - Frontend API Client Layer
window.MahaAPI = (function () {
  'use strict';

  const BASE_URL = window.location.origin;

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  return {
    // Health
    getHealth: () => request('/api/health'),

    // Mandi Rates
    getMandiRates: () => request('/api/mandi-rates'),

    // Advisory
    getAdvisory: (crop, qty, rate, days) =>
      request(`/api/advisory?crop=${encodeURIComponent(crop)}&qty=${qty}&rate=${rate}&days=${days}`),

    // Lots
    getLots: () => request('/api/lots'),
    createLot: (lotData) => request('/api/lots', { method: 'POST', body: JSON.stringify(lotData) }),

    // Bids & Escrow
    submitBid: (bidData) => request('/api/bids', { method: 'POST', body: JSON.stringify(bidData) }),

    // Buyers
    getBuyers: () => request('/api/buyers'),

    // Warehouses
    getWarehouses: () => request('/api/warehouses'),
    bookStorage: (bookingData) => request('/api/warehouses/book', { method: 'POST', body: JSON.stringify(bookingData) }),

    // Disputes
    getDisputes: () => request('/api/disputes'),
    createDispute: (disputeData) => request('/api/disputes', { method: 'POST', body: JSON.stringify(disputeData) }),
    resolveDispute: (disputeId) => request('/api/disputes/resolve', { method: 'POST', body: JSON.stringify({ disputeId }) })
  };
})();
