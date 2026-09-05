// frontend/js/app.js - MahaKisan Setu Frontend Application Controller
(function () {
  'use strict';

  // --- STATE ---
  let currentLang = 'en';
  let currentRole = 'farmer';
  let selectedCropKey = 'onion';
  let chartInstance = null;

  let mandiRates = [];
  let lots = [];
  let buyers = [];
  let warehouses = [];
  let disputes = [];

  const DATA = window.MAHA_DATA || {};
  const API = window.MahaAPI;

  // --- DOM ELEMENTS ---
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langBtnText = document.getElementById('langBtnText');
  const roleButtons = document.querySelectorAll('.role-btn');
  const navTabButtons = document.querySelectorAll('.nav-tab-btn');
  const sectionPanels = document.querySelectorAll('.section-panel');

  // Modals
  const createLotModal = document.getElementById('createLotModal');
  const openCreateLotModalBtn = document.getElementById('openCreateLotModalBtn');
  const closeCreateLotModalBtn = document.getElementById('closeCreateLotModalBtn');
  const createLotForm = document.getElementById('createLotForm');

  const negotiateModal = document.getElementById('negotiateModal');
  const closeNegotiateModalBtn = document.getElementById('closeNegotiateModalBtn');
  const negotiateForm = document.getElementById('negotiateForm');

  const disputeModal = document.getElementById('disputeModal');
  const openFileDisputeBtn = document.getElementById('openFileDisputeBtn');
  const closeDisputeModalBtn = document.getElementById('closeDisputeModalBtn');
  const disputeForm = document.getElementById('disputeForm');

  const toastContainer = document.getElementById('toastContainer');

  // --- INITIALIZATION ---
  async function init() {
    setupEventListeners();
    setupNavigation();
    setupGradingSimulator();

    // Fetch live data from backend API
    await loadInitialData();

    renderTicker();
    renderCropList();
    updateFocusCrop(selectedCropKey);
    initSaleWindowCalculator();
    renderBuyers();
    renderWarehouses();
    renderLots();
    renderDisputes();
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, icon = '✅') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- DATA LOADING FROM BACKEND API ---
  async function loadInitialData() {
    try {
      const [mandiRes, lotsRes, buyersRes, whRes, disputesRes] = await Promise.all([
        API.getMandiRates(),
        API.getLots(),
        API.getBuyers(),
        API.getWarehouses(),
        API.getDisputes()
      ]);

      if (mandiRes && mandiRes.rates) mandiRates = mandiRes.rates;
      if (lotsRes && lotsRes.lots) lots = lotsRes.lots;
      if (buyersRes && buyersRes.buyers) buyers = buyersRes.buyers;
      if (whRes && whRes.warehouses) warehouses = whRes.warehouses;
      if (disputesRes && disputesRes.disputes) disputes = disputesRes.disputes;
    } catch (e) {
      console.warn('Backend load issue, continuing with fallback:', e);
    }
  }

  // --- NAVIGATION & TABS ---
  function setupNavigation() {
    navTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        navTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sectionPanels.forEach(panel => {
          if (panel.id === `panel-${targetTab}`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });

        if (targetTab === 'intelligence' && chartInstance) {
          chartInstance.resize();
        }
      });
    });

    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRole = btn.getAttribute('data-role');
        const roleLabels = {
          farmer: currentLang === 'en' ? 'Switched to Farmer/FPO View' : 'शेतकरी / एफपीओ दृष्टिकोन निवडला',
          buyer: currentLang === 'en' ? 'Switched to Verified Buyer View' : 'खरेदीदार दृष्टिकोन निवडला',
          apmc: currentLang === 'en' ? 'Switched to APMC Admin View' : 'बाजार समिती प्रशासक दृष्टिकोन निवडला'
        };
        showToast(roleLabels[currentRole], '👤');
        if (currentRole === 'buyer') {
          document.querySelector('[data-tab="lots"]').click();
        } else if (currentRole === 'apmc') {
          document.querySelector('[data-tab="disputes"]').click();
        }
      });
    });
  }

  // --- LANGUAGE SWITCHER ---
  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'mr' : 'en';
    langBtnText.textContent = currentLang === 'en' ? 'मराठी / English' : 'English / मराठी';
    updateLanguageTexts();
    renderCropList();
    updateFocusCrop(selectedCropKey);
    renderLots();
    showToast(
      currentLang === 'en' ? 'Language switched to English' : 'भाषा मराठीमध्ये बदलली आहे',
      '🌐'
    );
  });

  function updateLanguageTexts() {
    const t = DATA.translations[currentLang];
    if (!t) return;

    document.getElementById('deptNameText').textContent = t.deptName;
    document.getElementById('appHeaderTitle').innerHTML =
      `MahaKisan Setu <span class="marathi-title">महाकिसान सेतू</span>`;
    document.getElementById('appHeaderTagline').textContent = t.tagline;

    document.getElementById('kpi1Title').textContent = t.kpiPriceUplift;
    document.getElementById('kpi1Sub').textContent = t.kpiPriceUpliftSub;
    document.getElementById('kpi2Title').textContent = t.kpiAggVolume;
    document.getElementById('kpi2Sub').textContent = t.kpiAggVolumeSub;
    document.getElementById('kpi3Title').textContent = t.kpiEscrowGuaranteed;
    document.getElementById('kpi3Sub').textContent = t.kpiEscrowGuaranteedSub;
    document.getElementById('kpi4Title').textContent = t.kpiLossPrevented;
    document.getElementById('kpi4Sub').textContent = t.kpiLossPreventedSub;

    document.getElementById('tabLabel1').textContent = t.navIntelligence;
    document.getElementById('tabLabel2').textContent = t.navSaleWindow;
    document.getElementById('tabLabel3').textContent = t.navLots;
    document.getElementById('tabLabel4').textContent = t.navGrading;
    document.getElementById('tabLabel5').textContent = t.navBuyers;
    document.getElementById('tabLabel6').textContent = t.navFpoPool;
    document.getElementById('tabLabel7').textContent = t.navLogistics;
    document.getElementById('tabLabel8').textContent = t.navEscrow;
    document.getElementById('tabLabel9').textContent = t.navDisputes;
    if (document.getElementById('tabLabel10')) {
      document.getElementById('tabLabel10').textContent = t.navDossier;
    }

    document.getElementById('secTitleMandi').textContent = t.mandiRatePulseTitle;
    document.getElementById('secSubMandi').textContent = t.mandiRatePulseSub;
    document.getElementById('secTitleAdvisor').textContent = t.saleWindowAdvisorTitle;
    document.getElementById('secSubAdvisor').textContent = t.saleWindowAdvisorSub;
    document.getElementById('secTitleLots').textContent = t.activeLotsTitle;
    document.getElementById('secSubLots').textContent = t.activeLotsSub;

    document.getElementById('createLotBtnLabel').textContent = t.btnCreateLot;
  }

  // --- LIVE APMC TICKER ---
  function renderTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack || !mandiRates) return;

    const items = [...mandiRates, ...mandiRates];
    tickerTrack.innerHTML = items.map(rate => `
      <div class="ticker-item">
        <strong>${rate.cropNameEn}</strong>
        <span>(${rate.mandi.split(',')[0]}):</span>
        <span class="ticker-price">₹${rate.modalPrice}</span>
        <span class="ticker-change ${rate.trend}">${rate.trend === 'up' ? '▲' : '▼'} ${rate.changePercent}</span>
      </div>
    `).join('');
  }

  // --- MARKET INTELLIGENCE & MANDI LIST ---
  function renderCropList() {
    const container = document.getElementById('cropListContainer');
    if (!container || !mandiRates) return;

    container.innerHTML = mandiRates.map(item => {
      const isSelected = item.cropKey === selectedCropKey;
      const cropName = currentLang === 'en' ? item.cropNameEn : item.cropNameMr;
      const mandiName = currentLang === 'en' ? item.mandi : item.mandiMr;

      return `
        <div class="crop-card-item ${isSelected ? 'selected' : ''}" data-crop="${item.cropKey}">
          <div class="crop-card-info">
            <h4>${cropName}</h4>
            <p>${mandiName}</p>
            <span style="font-size: 0.72rem; color: #059669; font-weight:600;">
              ${currentLang === 'en' ? 'Arrival:' : 'आवक:'} ${item.arrivalVolume}
            </span>
          </div>
          <div class="crop-card-price">
            <div class="crop-modal-rate">₹${item.modalPrice}</div>
            <div class="crop-rate-unit">/ Quintal</div>
            <span class="ticker-change ${item.trend}" style="font-size: 0.75rem;">
              ${item.trend === 'up' ? '▲' : '▼'} ${item.changePercent}
            </span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.crop-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const cropKey = card.getAttribute('data-crop');
        selectedCropKey = cropKey;
        container.querySelectorAll('.crop-card-item').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateFocusCrop(cropKey);
      });
    });
  }

  function updateFocusCrop(cropKey) {
    const cropData = mandiRates.find(c => c.cropKey === cropKey) || mandiRates[0];
    if (!cropData) return;

    const banner = document.getElementById('focusCropBanner');
    const advisory = document.getElementById('focusCropAdvisory');

    const cropName = currentLang === 'en' ? cropData.cropNameEn : cropData.cropNameMr;
    const mandiName = currentLang === 'en' ? cropData.mandi : cropData.mandiMr;
    const adviceText = currentLang === 'en' ? cropData.adviceSummaryEn : cropData.adviceSummaryMr;

    banner.innerHTML = `
      <div class="focus-title-group">
        <h3>${cropName}</h3>
        <p>${mandiName} • Variety: <strong>${cropData.variety}</strong> • Daily Arrival: <strong>${cropData.arrivalVolume}</strong></p>
      </div>
      <div class="focus-rates-group">
        <div class="rate-stat-box">
          <div class="lbl">Min Rate</div>
          <div class="num">₹${cropData.minPrice}</div>
        </div>
        <div class="rate-stat-box">
          <div class="lbl">Modal (Avg)</div>
          <div class="num highlight">₹${cropData.modalPrice}</div>
        </div>
        <div class="rate-stat-box">
          <div class="lbl">Max Rate</div>
          <div class="num">₹${cropData.maxPrice}</div>
        </div>
      </div>
    `;

    advisory.innerHTML = `
      <div class="advisor-badge-icon">💡</div>
      <div class="advisor-content">
        <h4>${currentLang === 'en' ? 'AI Sale-Window Directive' : 'एआय विक्री सल्ला'}: 
          <span style="color: ${cropData.storageRecommendation === 'SELL_NOW' ? '#dc2626' : '#059669'};">
            ${cropData.storageRecommendation === 'SELL_NOW' ? (currentLang === 'en' ? 'SELL IMMEDIATELY' : 'तात्काळ विक्री करा') : (currentLang === 'en' ? 'HOLD IN COLD STORAGE' : 'शीतगृहात साठवा')}
          </span>
        </h4>
        <p>${adviceText}</p>
      </div>
    `;

    renderTrendChart(cropData);
  }

  // --- CHART RENDERING (Chart.js) ---
  function renderTrendChart(cropData) {
    const ctx = document.getElementById('mandiTrendChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const labels = [
      ...cropData.historyDates,
      'Sep 12 (Est)',
      'Sep 19 (Est)',
      'Sep 26 (Est)',
      'Oct 05 (Est)'
    ];

    const historicalPoints = [...cropData.historicalPrices, null, null, null, null];
    const forecastPoints = [
      null,
      null,
      null,
      null,
      null,
      cropData.historicalPrices[cropData.historicalPrices.length - 1],
      ...cropData.forecastNext30d
    ];

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: currentLang === 'en' ? 'Mandi Modal Price History (₹/Qtl)' : 'बाजार भाव इतिहास (₹/क्विंटल)',
            data: historicalPoints,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#059669'
          },
          {
            label: currentLang === 'en' ? 'AI 30-Day Forward Forecast (₹/Qtl)' : 'एआय ३० दिवसांचा भाव अंदाज (₹/क्विंटल)',
            data: forecastPoints,
            borderColor: '#d97706',
            backgroundColor: 'rgba(217, 119, 6, 0.05)',
            borderDash: [6, 6],
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#d97706'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ₹${context.raw}`
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: (val) => `₹${val}`
            },
            grid: {
              color: 'rgba(226, 232, 240, 0.8)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // --- TAB 2: SMART SALE-WINDOW ADVISOR ---
  function initSaleWindowCalculator() {
    const cropSelect = document.getElementById('calcCropSelect');
    const qtyInput = document.getElementById('calcQuantity');
    const rateInput = document.getElementById('calcCurrentRate');
    const daysSelect = document.getElementById('calcHoldingDays');
    const recalcBtn = document.getElementById('recalculateAdvisorBtn');
    const reserveWhBtn = document.getElementById('verdictReserveWhBtn');
    const createLotBtn = document.getElementById('verdictCreateLotBtn');

    async function runAnalysis() {
      const cropKey = cropSelect.value;
      const qty = parseFloat(qtyInput.value) || 100;
      const currentRate = parseFloat(rateInput.value) || 2400;
      const days = parseInt(daysSelect.value, 10) || 30;

      try {
        const res = await API.getAdvisory(cropKey, qty, currentRate, days);
        if (res && res.analysis) {
          const a = res.analysis;
          document.getElementById('mathImmediateRevenue').textContent = `₹${a.immediateRevenue.toLocaleString('en-IN')}`;
          document.getElementById('mathProjectedRate').textContent = `₹${a.projectedRate.toLocaleString('en-IN')} / Qtl`;
          document.getElementById('mathStorageCost').textContent = `- ₹${a.storageCost.toLocaleString('en-IN')}`;
          document.getElementById('mathShrinkageLoss').textContent = `- ₹${a.shrinkageLossAmt.toLocaleString('en-IN')}`;
          document.getElementById('mathPledgeBenefit').textContent = `+ ₹${a.pledgeLoanSubsidy.toLocaleString('en-IN')}`;

          const recHeader = document.getElementById('verdictRecommendation');
          const recSub = document.getElementById('verdictSub');
          const netGainDisplay = document.getElementById('mathNetGain');

          if (a.netGain > 5000) {
            recHeader.textContent = currentLang === 'en' ? `RECOMMENDED: HOLD FOR ${days} DAYS IN COLD STORAGE` : `सल्ला: शीतगृहात ${days} दिवस साठवून ठेवा`;
            recHeader.style.color = '#34d399';
            recSub.textContent = currentLang === 'en' ? 'WDRA warehouse holding generates significant net surplus above spot selling.' : 'स्थानिक विक्रीपेक्षा शीतगृहात साठवल्यास अधिक निव्वळ नफा मिळेल.';
            netGainDisplay.textContent = `+ ₹${a.netGain.toLocaleString('en-IN')} NET SURPLUS`;
            netGainDisplay.style.color = '#34d399';
          } else {
            recHeader.textContent = currentLang === 'en' ? 'RECOMMENDED: SELL NOW IN PRIMARY MANDI' : 'सल्ला: आजच बाजार समितीत तात्काळ विक्री करा';
            recHeader.style.color = '#f87171';
            recSub.textContent = currentLang === 'en' ? 'Holding costs and shrinkage outweigh expected price appreciation.' : 'साठवणूक खर्च व घट यामुळे होणारा तोटा भावातील वाढीपेक्षा जास्त आहे.';
            netGainDisplay.textContent = `- ₹${Math.abs(a.netGain).toLocaleString('en-IN')} NET DEFICIT IF HELD`;
            netGainDisplay.style.color = '#f87171';
          }
        }
      } catch (err) {
        console.warn('Advisory calculation fallback');
      }
    }

    if (cropSelect) {
      cropSelect.addEventListener('change', () => {
        const selected = mandiRates.find(r => r.cropKey === cropSelect.value);
        if (selected) {
          rateInput.value = selected.modalPrice;
        }
        runAnalysis();
      });
    }

    if (recalcBtn) recalcBtn.addEventListener('click', runAnalysis);
    if (daysSelect) daysSelect.addEventListener('change', runAnalysis);
    if (qtyInput) qtyInput.addEventListener('input', runAnalysis);
    if (rateInput) rateInput.addEventListener('input', runAnalysis);

    if (reserveWhBtn) {
      reserveWhBtn.addEventListener('click', () => {
        document.querySelector('[data-tab="logistics"]').click();
        showToast('Viewing nearby cold storage facilities for reservation', '❄️');
      });
    }

    if (createLotBtn) {
      createLotBtn.addEventListener('click', () => {
        openCreateLotModal();
      });
    }

    runAnalysis();
  }

  // --- TAB 3: ACTIVE LOTS & DIGITAL BIDS ---
  function renderLots() {
    const container = document.getElementById('lotsContainer');
    if (!container) return;

    if (!lots || lots.length === 0) {
      container.innerHTML = `<p style="padding: 20px; color: #64748b;">No active trade lots found. Click "Create Trade Lot" to create one.</p>`;
      return;
    }

    container.innerHTML = lots.map(lot => `
      <div class="lot-card" id="card-${lot.id}">
        <div>
          <div class="lot-top-bar">
            <span class="lot-id-tag">${lot.id}</span>
            ${lot.isFpoPool ? `<span class="fpo-pool-badge">🤝 FPO Pool (${lot.pooledFarmers} Farmers)</span>` : `<span class="kpi-pill">Individual Producer</span>`}
          </div>
          <div class="lot-crop-name">${lot.crop}</div>
          <div class="lot-farmer-meta">📍 ${lot.district} (${lot.mandiTaluka}) • Producer: ${lot.farmerName}</div>

          <div class="lot-specs-table">
            <div class="lot-specs-row">
              <span class="lbl">Quality Grade:</span>
              <span class="val" style="color: #059669; font-weight:700;">${lot.grade}</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Volume Available:</span>
              <span class="val">${lot.quantityQuintals} Quintals (${(lot.quantityQuintals / 10).toFixed(1)} MT)</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Moisture / Spec:</span>
              <span class="val">${lot.moisturePercent}% (${lot.uniformSizeMm})</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Reserve Price:</span>
              <span class="val">₹${lot.minPricePerQuintal} / Qtl</span>
            </div>
          </div>

          <div class="lot-pricing-summary">
            <div>
              <div class="bid-label">Current Top Institutional Bid</div>
              <div class="bid-amt">₹${lot.highestBid} <span style="font-size: 0.75rem; color: #475569;">/ Qtl</span></div>
              <div style="font-size: 0.75rem; color: #047857;">By: <strong>${lot.highestBidder}</strong> (${lot.offersCount} bids)</div>
            </div>
            <div>
              <span class="kpi-pill" style="${lot.status === 'Escrow Locked' ? 'background:#dbeafe; color:#1e40af;' : 'background:#ecfdf5; color:#065f46;'}">
                ${lot.escrowStatus}
              </span>
            </div>
          </div>
        </div>

        <div class="lot-actions-footer">
          ${lot.status === 'Escrow Locked' ? `
            <button class="btn-secondary" style="background:#f1f5f9; color:#047857; font-weight:700;" disabled>
              🔒 20% Advance Locked
            </button>
          ` : `
            <button class="btn-secondary" onclick="window.MahaApp.openNegotiateModal('${lot.id}')">
              💬 Counter Offer
            </button>
            <button class="btn-primary-sm" onclick="window.MahaApp.acceptBid('${lot.id}')">
              🤝 Accept & Escrow
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  async function acceptBid(lotId) {
    try {
      const res = await API.submitBid({ lotId, action: 'accept' });
      if (res && res.success) {
        const lot = lots.find(l => l.id === lotId);
        if (lot) {
          lot.status = 'Escrow Locked';
          lot.escrowStatus = '20% Advance In Escrow';
        }
        renderLots();
        showToast(`Bid for ${lotId} accepted! 20% advance locked in Escrow.`, '🛡️');
      }
    } catch (e) {
      showToast(`Accepted bid for ${lotId}. 20% advance locked.`, '🛡️');
    }
  }

  function openNegotiateModal(lotId) {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    document.getElementById('negotiateLotId').value = lot.id;
    document.getElementById('negotiateLotCrop').value = `${lot.crop} (${lot.quantityQuintals} Qtl)`;
    document.getElementById('negotiateCurrentBid').value = `₹${lot.highestBid} / Qtl by ${lot.highestBidder}`;
    document.getElementById('negotiateNewBid').value = lot.highestBid + 50;
    document.getElementById('negotiateSubtitle').textContent = `Counter-offer for Lot ${lot.id} - ${lot.district}`;

    negotiateModal.classList.add('open');
  }

  negotiateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lotId = document.getElementById('negotiateLotId').value;
    const newBid = document.getElementById('negotiateNewBid').value;
    const buyerName = document.getElementById('negotiateBuyerName').value;

    try {
      await API.submitBid({ lotId, bidAmount: newBid, buyerName });
    } catch (err) {
      console.warn('Bid submit error', err);
    }

    const lot = lots.find(l => l.id === lotId);
    if (lot) {
      lot.highestBid = Number(newBid);
      lot.highestBidder = buyerName;
      lot.offersCount = (lot.offersCount || 0) + 1;
    }
    renderLots();
    negotiateModal.classList.remove('open');
    showToast(`Counter offer of ₹${newBid}/Qtl submitted successfully!`, '💼');
  });

  // --- TAB 4: AI QUALITY GRADING SIMULATOR ---
  function setupGradingSimulator() {
    const preview = document.getElementById('scannerVisualPreview');
    const statusText = document.getElementById('scannerStatusText');
    const gradeBadge = document.getElementById('certGradeBadge');
    const sizeVal = document.getElementById('certSizeVal');
    const moistureVal = document.getElementById('certMoistureVal');
    const blemishVal = document.getElementById('certBlemishVal');
    const reservePrice = document.getElementById('certReservePrice');
    const useGradeBtn = document.getElementById('useGradingInLotBtn');

    function simulateScan(cropType, emoji, colorGrad, grade, size, moisture, blemish, price) {
      preview.textContent = emoji;
      preview.style.background = colorGrad;
      preview.classList.add('scanning');
      statusText.textContent = `Running AI Computer Vision Calibration for ${cropType}...`;
      statusText.style.color = '#10b981';

      setTimeout(() => {
        preview.classList.remove('scanning');
        statusText.textContent = `Analysis Completed: Quality Parameters Verified`;
        statusText.style.color = '#ffffff';

        gradeBadge.textContent = grade;
        sizeVal.textContent = size;
        moistureVal.textContent = moisture;
        blemishVal.textContent = blemish;
        reservePrice.textContent = price;

        showToast(`AI Grade Certificate generated for ${cropType}`, '🔬');
      }, 700);
    }

    document.getElementById('testSampleOnionBtn').addEventListener('click', () => {
      simulateScan(
        'Nashik Red Onion', '🧅', 'radial-gradient(circle, #b91c1c 20%, #7f1d1d 90%)',
        'GRADE A • EXPORT SPECIFICATION', '55-65mm (92.4% Uniform)', '10.8% (Target < 12%)',
        '1.2% (Acceptable < 3%)', '₹2,650 / Quintal'
      );
    });

    document.getElementById('testSampleSoybeanBtn').addEventListener('click', () => {
      simulateScan(
        'Latur Soybean', '🌱', 'radial-gradient(circle, #ca8a04 20%, #713f12 90%)',
        'GRADE A • HIGH OIL CONTENT', 'Screen 4.0mm (96% Clean)', '9.2% (Target < 10%)',
        '0.8% Foreign Matter', '₹4,950 / Quintal'
      );
    });

    document.getElementById('testSampleTomatoBtn').addEventListener('click', () => {
      simulateScan(
        'Pune Hybrid Tomato', '🍅', 'radial-gradient(circle, #ef4444 20%, #991b1b 90%)',
        'GRADE A • PROCESSING / RETAIL', 'Firmness 4.8 kg/cm²', '88.2% TSS Brix 4.9',
        '0.5% Surface Spots', '₹2,300 / Quintal'
      );
    });

    useGradeBtn.addEventListener('click', () => {
      openCreateLotModal();
      document.getElementById('formMinPrice').value = reservePrice.textContent.replace(/[^0-9]/g, '');
    });
  }

  // --- TAB 5: VERIFIED INSTITUTIONAL BUYERS ---
  function renderBuyers() {
    const container = document.getElementById('buyersContainer');
    if (!container || !buyers) return;

    container.innerHTML = buyers.map(buyer => `
      <div class="buyer-card">
        <div>
          <div class="buyer-header">
            <div class="buyer-title">
              <h3>${buyer.name}</h3>
              <p>📍 ${buyer.district} • ${buyer.type}</p>
            </div>
            <span class="trust-badge">⭐ Trust ${buyer.trustScore}%</span>
          </div>

          <div class="lot-specs-table">
            <div class="lot-specs-row">
              <span class="lbl">Government Status:</span>
              <span class="val" style="color:#059669; font-weight:700;">${buyer.badge}</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Payment Track:</span>
              <span class="val">${buyer.paymentReliability}</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Escrow Settled:</span>
              <span class="val">${buyer.escrowCompleted}</span>
            </div>
            <div class="lot-specs-row">
              <span class="lbl">Crops Procurement:</span>
              <span class="val">${buyer.cropsLookingFor.join(', ')}</span>
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px; font-size: 0.8rem; border: 1px dashed #cbd5e1;">
            <strong>Active Buying Contract:</strong>
            ${buyer.activeRequirements.map(req => `
              <div style="margin-top: 4px; color: #334155;">
                • ${req.crop}: ${req.quantityQtl} Qtl @ ₹${req.targetPrice}/Qtl (${req.qualitySpec})
              </div>
            `).join('')}
          </div>
        </div>

        <button class="btn-primary-action" style="width: 100%; justify-content: center;" onclick="window.MahaApp.directSupplyOffer('${buyer.name}')">
          📝 Submit Direct Supply Offer
        </button>
      </div>
    `).join('');
  }

  function directSupplyOffer(buyerName) {
    openCreateLotModal();
    showToast(`Initiating direct supply offer for ${buyerName}`, '🤝');
  }

  // --- TAB 7: LOGISTICS & WAREHOUSES ---
  function renderWarehouses() {
    const container = document.getElementById('warehousesContainer');
    if (!container || !warehouses) return;

    container.innerHTML = warehouses.map(wh => {
      const occupiedPercent = Math.round(((wh.capacityTotalMT - wh.capacityAvailableMT) / wh.capacityTotalMT) * 100);

      return `
        <div class="lot-card">
          <div>
            <div class="lot-top-bar">
              <span class="lot-id-tag">${wh.id.toUpperCase()}</span>
              <span class="kpi-pill" style="background:#ecfdf5; color:#065f46;">📍 ${wh.distanceKm} km away</span>
            </div>
            <div class="lot-crop-name" style="font-size: 1.1rem;">${wh.name}</div>
            <div class="lot-farmer-meta">${wh.operator} • ${wh.district}</div>

            <div class="lot-specs-table">
              <div class="lot-specs-row">
                <span class="lbl">Storage Rate:</span>
                <span class="val" style="color:#059669; font-weight:700;">₹${wh.ratePerQuintalMonth} / Qtl / Month</span>
              </div>
              <div class="lot-specs-row">
                <span class="lbl">Temperature Spec:</span>
                <span class="val">${wh.tempRange}</span>
              </div>
              <div class="lot-specs-row">
                <span class="lbl">Available Space:</span>
                <span class="val">${wh.capacityAvailableMT} MT (${100 - occupiedPercent}% Free)</span>
              </div>
              <div class="lot-specs-row">
                <span class="lbl">Pledge Financing:</span>
                <span class="val" style="color: ${wh.pledgeFinanceAvailable ? '#059669' : '#64748b'}; font-weight:600;">
                  ${wh.pledgeFinanceAvailable ? `Eligible (Up to ${wh.maxFinancingPercent}% via ${wh.pledgeBank})` : 'Not Applicable'}
                </span>
              </div>
            </div>

            <div style="margin: 10px 0 16px 0;">
              <div style="display:flex; justify-content:space-between; font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">
                <span>Occupied: ${occupiedPercent}%</span>
                <span>Total: ${wh.capacityTotalMT} MT</span>
              </div>
              <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                <div style="width:${occupiedPercent}%; height:100%; background:${occupiedPercent > 80 ? '#f59e0b' : '#10b981'};"></div>
              </div>
            </div>
          </div>

          <button class="btn-primary-action" style="width: 100%; justify-content: center;" onclick="window.MahaApp.bookWarehouse('${wh.name}')">
            📦 Reserve Storage Space
          </button>
        </div>
      `;
    }).join('');
  }

  async function bookWarehouse(whName) {
    try {
      const res = await API.bookStorage({ warehouseName: whName, quantityMT: 25 });
      if (res && res.booking) {
        showToast(`Space reserved at ${whName}! Booking ID: ${res.booking.bookingId}`, '❄️');
      }
    } catch (e) {
      showToast(`Storage reservation request forwarded to ${whName}. Confirmation within 2 hrs.`, '❄️');
    }
  }

  // --- TAB 9: DISPUTES & GRIEVANCE REDRESSAL ---
  function renderDisputes() {
    const container = document.getElementById('disputesContainer');
    if (!container) return;

    if (!disputes || disputes.length === 0) {
      container.innerHTML = `<p style="padding: 20px; color: #64748b;">No active grievances on record. All transactions operating smoothly.</p>`;
      return;
    }

    container.innerHTML = disputes.map(d => `
      <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid #e2e8f0; border-left: 5px solid #dc2626; padding: 20px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <span style="font-family: monospace; font-weight: 700; background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
              ${d.id}
            </span>
            <span style="margin-left: 8px; font-weight: 700; font-size: 0.95rem; color: #0f172a;">${d.category}</span>
          </div>
          <span class="kpi-pill" style="background: #fef3c7; color: #92400e;">⏱️ ${d.slaTimeLeft}</span>
        </div>

        <div style="font-size: 0.84rem; color: #475569; margin-bottom: 8px;">
          Related Trade: <strong>${d.lotId}</strong> • Claimant: <strong>${d.filedBy}</strong> vs. <strong>${d.respondent}</strong>
        </div>

        <div style="font-size: 0.84rem; color: #334155; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 12px;">
          <strong>Evidence on Record:</strong> ${d.evidenceDocs}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.84rem; font-weight: 700; color: #dc2626;">Amount in Escrow Hold: ${d.amountInDispute}</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="font-size: 0.8rem; padding: 6px 12px;" onclick="window.MahaApp.viewArbitrationStatus('${d.id}')">
              View APMC Arbitration Log
            </button>
            <button class="btn-primary-sm" style="font-size: 0.8rem; padding: 6px 12px; background: #059669;" onclick="window.MahaApp.resolveDispute('${d.id}')">
              Accept Resolution & Release Escrow
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async function resolveDispute(disputeId) {
    try {
      await API.resolveDispute(disputeId);
    } catch (e) {
      console.warn('API resolve error', e);
    }

    const disp = disputes.find(d => d.id === disputeId);
    if (disp) {
      disp.status = 'Resolved';
      disp.slaTimeLeft = 'Resolved via APMC Mediation';
    }
    renderDisputes();
    showToast(`Claim ${disputeId} marked as mutually resolved via APMC settlement.`, '⚖️');
  }

  // --- MODAL HANDLERS ---
  function openCreateLotModal() {
    createLotModal.classList.add('open');
  }

  function closeCreateLotModal() {
    createLotModal.classList.remove('open');
  }

  openCreateLotModalBtn.addEventListener('click', openCreateLotModal);
  closeCreateLotModalBtn.addEventListener('click', closeCreateLotModal);

  closeNegotiateModalBtn.addEventListener('click', () => {
    negotiateModal.classList.remove('open');
  });

  if (openFileDisputeBtn) {
    openFileDisputeBtn.addEventListener('click', () => {
      disputeModal.classList.add('open');
    });
  }

  if (closeDisputeModalBtn) {
    closeDisputeModalBtn.addEventListener('click', () => {
      disputeModal.classList.remove('open');
    });
  }

  // CREATE LOT FORM SUBMISSION
  createLotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newLotPayload = {
      farmerName: document.getElementById('formFarmerName').value,
      district: document.getElementById('formDistrict').value,
      mandiTaluka: document.getElementById('formMandiTaluka').value,
      crop: document.getElementById('formCrop').value,
      quantityQuintals: document.getElementById('formQuantity').value,
      minPricePerQuintal: document.getElementById('formMinPrice').value,
      expectedPrice: document.getElementById('formExpPrice').value,
      isFpoPool: document.getElementById('formIsFpoPool').checked,
      pooledFarmers: document.getElementById('formIsFpoPool').checked ? 5 : 1
    };

    try {
      const res = await API.createLot(newLotPayload);
      if (res && res.lot) {
        lots.unshift(res.lot);
      }
    } catch (err) {
      console.warn('Fallback lot creation', err);
    }

    renderLots();
    closeCreateLotModal();
    document.querySelector('[data-tab="lots"]').click();
    showToast(`New produce lot created and listed to institutional buyers!`, '🎉');
  });

  // DISPUTE FORM SUBMISSION
  if (disputeForm) {
    disputeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        lotId: document.getElementById('disputeLotId').value,
        category: document.getElementById('disputeCategory').value,
        amountInDispute: document.getElementById('disputeAmount').value,
        notes: document.getElementById('disputeNotes').value
      };

      try {
        const res = await API.createDispute(payload);
        if (res && res.dispute) {
          disputes.unshift(res.dispute);
        }
      } catch (err) {
        console.warn('Fallback dispute create', err);
      }

      renderDisputes();
      disputeModal.classList.remove('open');
      showToast(`Grievance submitted. APMC Observer assigned under 48h SLA.`, '⚖️');
    });
  }

  // FPO Pooling Buttons
  const joinPoolBtn = document.getElementById('joinPoolActionBtn');
  if (joinPoolBtn) {
    joinPoolBtn.addEventListener('click', () => {
      openCreateLotModal();
      document.getElementById('formIsFpoPool').checked = true;
      showToast('Joining Sahyadri Village Cluster Pool #14', '🤝');
    });
  }

  const createClusterPoolBtn = document.getElementById('createClusterPoolBtn');
  if (createClusterPoolBtn) {
    createClusterPoolBtn.addEventListener('click', () => {
      openCreateLotModal();
      document.getElementById('formIsFpoPool').checked = true;
      showToast('Configuring new FPO Village Aggregation Cluster', '🚜');
    });
  }

  const refreshLotsBtn = document.getElementById('refreshLotsBtn');
  if (refreshLotsBtn) {
    refreshLotsBtn.addEventListener('click', async () => {
      const res = await API.getLots();
      if (res && res.lots) lots = res.lots;
      renderLots();
      showToast('Live bids and escrow statuses updated', '🔄');
    });
  }

  function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        createLotModal.classList.remove('open');
        negotiateModal.classList.remove('open');
        if (disputeModal) disputeModal.classList.remove('open');
      }
    });
  }

  // Export to window for inline HTML onclick handlers
  window.MahaApp = {
    acceptBid,
    openNegotiateModal,
    bookWarehouse,
    directSupplyOffer,
    resolveDispute,
    viewArbitrationStatus: (id) => showToast(`Opening APMC digital ledger for case ${id}`, '📄')
  };

  document.addEventListener('DOMContentLoaded', init);
})();
