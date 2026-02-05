let myChart = null;
const STORAGE_KEY = 'tmi_unified_data_v1';

window.onload = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = data[id];
        });
    }
    updateVeneerLabel();
};

function autoSave() {
    const inputs = document.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(input => data[input.id] = input.value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateVeneerLabel();
    
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
    
    if (targetId === 'analysis') runAnalysis();
}

function runAnalysis() {
    // Inputs
    const mbf = parseFloat(document.getElementById('total-mbf').value) || 0;
    const maple = (parseFloat(document.getElementById('maple-pct').value) || 0) / 100;
    const oak = (parseFloat(document.getElementById('oak-pct').value) || 0) / 100;
    const pine = (parseFloat(document.getElementById('pine-pct').value) || 0) / 100;
    const aspen = (parseFloat(document.getElementById('aspen-pct').value) || 0) / 100;
    
    const veneerRatio = (parseFloat(document.getElementById('veneer-ratio').value) || 0) / 100;
    const growth = (parseFloat(document.getElementById('bio-growth').value) || 0) / 100;
    const dist = parseFloat(document.getElementById('mill-dist').value) || 0;
    const mkt = parseFloat(document.getElementById('market-cycle').value) || 1;
    const seasonBonus = parseFloat(document.getElementById('season').value) || 0;

    // Pricing Matrix (Delivered Mill Prices)
    const prices = { hardwood: 580 * mkt, pine: 410, pulp: 240, veneer: 1350 };
    const costs = 165 + (dist > 60 ? (dist - 60) * 1.75 : 0);

    const premiumMbf = mbf * (maple + oak) * veneerRatio;
    const baseMbf = mbf - premiumMbf;

    const weightedBase = (maple * prices.hardwood) + (oak * prices.hardwood) + (pine * prices.pine) + (aspen * prices.pulp);
    
    const netToday = (baseMbf * (weightedBase - costs + seasonBonus)) + (premiumMbf * (prices.veneer - costs + seasonBonus));
    const netNextYear = netToday * (1 + growth);

    // Formatter
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // UI Updates
    document.getElementById('net-value-display').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('growth-premium').innerText = "+" + fmt.format(Math.max(0, netNextYear - netToday));
    document.getElementById('valuation-subtext').innerText = `Analysis based on ${mbf} MBF volume and ${dist}mi haul.`;
    
    // Advice & Strategy
    let advice = `<strong>Stewardship Note:</strong> `;
    if (mkt < 1) {
        advice += `Markets are currently soft. Biological growth is providing a <b>${(growth*100).toFixed(1)}%</b> return. Holding is recommended.`;
    } else {
        advice += `Market cycles are favorable. Focus on quality grading and sustainable harvesting windows.`;
    }
    document.getElementById('strategy-output').innerHTML = advice;

    // Report Bridge (Update Hidden Print Template)
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('report-date').innerText = `Assessment Date: ${dateStr}`;
    document.getElementById('print-value').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('print-growth').innerText = "+" + fmt.format(Math.max(0, netNextYear - netToday));
    document.getElementById('print-strategy').innerHTML = advice;

    renderChart(netToday, netNextYear);
}

function renderChart(v1, v2) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Value Today', '1-Year Projection'],
            datasets: [{
                data: [Math.max(0, v1), Math.max(0, v2)],
                backgroundColor: ['#1e392a', '#d4af37'],
                borderRadius: 6
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
