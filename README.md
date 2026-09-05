# MahaKisan Setu (महाकिसान सेतू)
### Problem Statement ID: 26132 | Government of Maharashtra (MSInS)
**Strengthening market linkages and price discovery for farmers**

---

## 🏗️ Project Architecture: Frontend & Backend Separation

This project is organized using a clean, multi-tier full-stack architecture with clear decoupling between the **backend API server**, **data models**, and **frontend client**:

```
clerk 2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js              # Server configuration (PORT, directory paths)
│   │   ├── data/                     # Persistent JSON datasets
│   │   │   ├── mandiRates.json       # Maharashtra APMC prices & arrival volumes
│   │   │   ├── buyers.json           # Verified institutional buyers
│   │   │   ├── warehouses.json       # WDRA warehouses & cold storage hubs
│   │   │   ├── lots.json             # Active produce lots & trade state
│   │   │   └── disputes.json         # APMC arbitration cases & claims
│   │   ├── controllers/              # Business logic & request handlers
│   │   │   ├── mandiController.js    # APMC mandi rates & sale-window advisory
│   │   │   ├── lotsController.js     # Lot management, bidding & escrow locks
│   │   │   ├── buyersController.js   # Institutional buyer matching
│   │   │   ├── warehouseController.js# Cold chain booking & logistics
│   │   │   └── disputesController.js # APMC arbitration & 48h SLA redressal
│   │   ├── routes/
│   │   │   └── apiRouter.js          # REST API router & dispatcher
│   │   └── utils/
│   │       ├── staticServer.js       # Static asset server with MIME streaming
│   │       └── bodyParser.js         # HTTP JSON request payload parser
│   └── server.js                     # Backend application entrypoint
│
├── frontend/
│   ├── css/
│   │   └── style.css                 # Premium glassmorphic agricultural UI styling
│   ├── js/
│   │   ├── api.js                    # Client-side API service layer
│   │   ├── data.js                   # Bilingual dictionary (English & मराठी)
│   │   └── app.js                    # UI controller, Chart.js trends, AI grading & calculator
│   └── index.html                    # Responsive semantic HTML5 dashboard
│
├── package.json                      # NPM configuration ("npm start")
├── start.bat                         # 1-click Windows launcher
└── README.md                         # Architecture & operational guide
```

---

## 🚀 How to Run the Project

### Option 1: 1-Click Windows Launcher (Easiest)
Double-click `start.bat` in the root folder. It starts the backend server on port `4173` and automatically opens `http://localhost:4173` in your browser.

### Option 2: Terminal / PowerShell
```powershell
npm start
```
*Or directly via Node:*
```powershell
node backend/server.js
```
Then visit **`http://localhost:4173`**.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/mandi-rates` | Live APMC rates across 8 Maharashtra mandis |
| `GET` | `/api/advisory` | Smart Sale-Window & cold storage ROI calculator |
| `GET` | `/api/lots` | Active farm-gate and FPO trade lots |
| `POST` | `/api/lots` | Create and publish a new produce lot |
| `POST` | `/api/bids` | Submit a counter-offer or accept bid for escrow lock |
| `GET` | `/api/buyers` | Verified institutional buyers with trust ratings |
| `GET` | `/api/warehouses` | Nearby WDRA warehouses & cold storage hubs |
| `POST` | `/api/warehouses/book` | Reserve warehouse storage space |
| `GET` | `/api/disputes` | Grievance claims and APMC arbitration records |
| `POST` | `/api/disputes` | File a new dispute under 48-hour SLA |
| `POST` | `/api/disputes/resolve`| Resolve a grievance via APMC settlement |
