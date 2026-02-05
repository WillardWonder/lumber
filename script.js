let myChart = null;
const STORAGE_KEY = 'tmi_pro_stewardship_v1';

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
    if(document.getElementById('analysis').style.display !== 'none') runAnalysis();
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

    // Pricing & Costs
    const prices = { hardwood: 580 * mkt, pine: 410, pulp: 240, veneer: 1400 };
    const costBase = 170;
    const haulCost = dist > 50 ? (dist - 50) * 1.85 : 0;
    const netCosts = costBase + haulCost - seasonBonus;

    const vMbf = mbf * (maple + oak) * veneerRatio;
    const bMbf = mbf - vMbf;

    const wBase = (maple * prices.hardwood) + (oak * prices.hardwood) + (pine * prices.pine) + (aspen * prices.pulp);
    const netToday = (bMbf * (wBase - netCosts)) + (vMbf * (prices.veneer - netCosts));
    const netGrowth = netToday * (1 + growth);

    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // Update Screen
    document.getElementById('net-value-display').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('growth-premium').innerText = "+" + fmt.format(Math.max(0, netGrowth - netToday));
    document.getElementById('valuation-subtext').innerText = `Valuation includes ${dist}mi transportation factoring.`;

    // Strategy Advice
    let adv = `Quality over timing. Your stands are currently providing a <b>${(growth*100).toFixed(1)}%</b> biological return. `;
    if (mkt < 1) adv += "Because market demand is soft, the biological value added by holding often outweighs the immediate liquidation value.";
    else adv += "Market conditions are favorable. Harvest decisions should be driven by forest maturity and silvicultural goals.";
    document.getElementById('strategy-output').innerHTML = adv;

    // Update Print Template
    document.getElementById('report-date').innerText = `Assessment Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    document.getElementById('print-value').innerText = fmt.format(Math.max(0, netToday));
    document.getElementById('print-growth').innerText = "+" + fmt.format(Math.max(0, netGrowth - netToday));
    document.getElementById('print-strategy').innerHTML = adv;

    renderChart(netToday, netGrowth);
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
