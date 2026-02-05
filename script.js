let myChart = null;
const STORAGE_KEY = 'tmi_pro_engine_v1';

window.onload = () => {
    // Load persisted data
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = data[id];
        });
    }
    // Set initial veneer label
    updateVeneerLabel();
    // Run initial analysis
    runAnalysis();
};

function autoSave() {
    const inputs = document.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(input => data[input.id] = input.value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateVeneerLabel();
    runAnalysis();
    
    // UI Save feedback
    const status = document.getElementById('save-status');
    status.style.opacity = '1';
    setTimeout(() => status.style.opacity = '0.5', 1000);
}

function updateVeneerLabel() {
    const val = document.getElementById('veneer-ratio').value;
    document.getElementById('veneer-val').innerText = val;
}

function switchTab(button) {
    const targetId = button.getAttribute('data-target');
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
    document.getElementById(targetId).style.display = 'block';
    
    // Ensure chart renders if switching to analysis
    if (targetId === 'analysis') runAnalysis();
}

function runAnalysis() {
    // 1. Gather Data with Fallbacks to prevent "Blank Boxes"
    const mbf = parseFloat(document.getElementById('total-mbf').value) || 0;
    const maple = (parseFloat(document.getElementById('maple-pct').value) || 0) / 100;
    const oak = (parseFloat(document.getElementById('oak-pct').value) || 0) / 100;
    const pine = (parseFloat(document.getElementById('pine-pct').value) || 0) / 100;
    const aspen = (parseFloat(document.getElementById('aspen-pct').value) || 0) / 100;
    
    const veneerRatio = (parseFloat(document.getElementById('veneer-ratio').value) || 0) / 100;
    const growthRate = (parseFloat(document.getElementById('bio-growth').value) || 0) / 100;
    const dist = parseFloat(document.getElementById('mill-dist').value) || 0;
    const mkt = parseFloat(document.getElementById('market-cycle').value) || 1;
    const seasonBonus = parseFloat(document.getElementById('season').value) || 0;

    // 2. Pricing Matrix (Delivered Mill Prices)
    const prices = { hardwood: 580 * mkt, pine: 410, pulp: 240, veneer: 1400 };
    const harvestingCost = 175;
    const transportFee = dist > 50 ? (dist - 50) * 1.85 : 0;
    const totalCosts = harvestingCost + transportFee - seasonBonus;

    // 3. Logic: Calculate Veneer Mbf vs. Standard Mbf
    const vMbf = mbf * (maple + oak) * veneerRatio;
    const bMbf = mbf - vMbf;

    const weightedBase = (maple * prices.hardwood) + (oak * prices.hardwood) + (pine * prices.pine) + (aspen * prices.pulp);
    
    const netToday = (bMbf * (weightedBase - totalCosts)) + (vMbf * (prices.veneer - totalCosts));
    const netNextYear = netToday * (1 + growthRate);

    // 4. Update UI Components
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    
    // Main Display
    document.getElementById('net-value-display').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('growth-premium').innerText = "+" + fmt.format(Math.max(0, netNextYear - netToday));
    document.getElementById('valuation-subtext').innerText = `Valuation based on ${mbf} MBF volume and ${dist}mi haul.`;

    // Strategy Advice
    let strategy = `<strong>Market Intelligence:</strong> Good forestry matters more than perfect timing. Trees keep growing biologically during down markets. `;
    if (mkt < 1) {
        strategy += `Holding inventory allows volume growth of <b>${(growthRate*100).toFixed(1)}%</b> annually to offset price contraction.`;
    } else {
        strategy += `Market demand is currently favorable. Ensure harvest decisions are driven by maturity and silviculture.`;
    }
    document.getElementById('strategy-output').innerHTML = strategy;

    // 5. Update Hidden Print Template
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('report-date').innerText = `Assessment Date: ${reportDate}`;
    document.getElementById('print-value').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('print-growth').innerText = "+" + fmt.format(Math.max(0, netNextYear - netToday));
    document.getElementById('print-strategy').innerHTML = strategy;

    // 6. Refresh Chart
    renderChart(netToday, netNextYear);
}

function renderChart(v1, v2) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Value Today', '1-Year Projection'],
            datasets: [{
                data: [Math.max(0, v1), Math.max(0, v2)],
                backgroundColor: ['#0d2818', '#d4af37'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } }
        }
    });
}
