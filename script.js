let myChart;

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    el.classList.add('active');
    if (tabId === 'analysis') updateCalculations();
}

function updateCalculations() {
    // Inputs
    const mbf = parseFloat(document.getElementById('total-mbf').value) || 0;
    const growthRate = parseFloat(document.getElementById('bio-growth').value) / 100;
    const distance = parseFloat(document.getElementById('mill-dist').value) || 0;
    const demandMultiplier = parseFloat(document.getElementById('cabinet-demand').value);
    const accessBonus = parseFloat(document.getElementById('access-type').value);

    // Base Prices (Local averages)
    const baseHardwood = 550 * demandMultiplier;
    const basePine = 380;
    const haulCost = distance * 2.5; // Estimated $2.50 per MBF per Mile

    const species = {
        maple: { pct: document.querySelector('[data-sp="maple"]').value / 100, price: baseHardwood },
        oak: { pct: document.querySelector('[data-sp="oak"]').value / 100, price: baseHardwood },
        pine: { pct: document.querySelector('[data-sp="pine"]').value / 100, price: basePine },
        aspen: { pct: document.querySelector('[data-sp="aspen"]').value / 100, price: 240 }
    };

    let todayValue = 0;
    for (let s in species) {
        let spMbf = mbf * species[s].pct;
        let stumpage = species[s].price - haulCost + accessBonus - 150; // 150 base logging cost
        todayValue += spMbf * stumpage;
    }

    // Biological growth calculation (Value if you wait 1 year)
    let nextYearValue = todayValue * (1 + growthRate);

    // UI Updates
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    document.getElementById('net-value-display').innerText = formatter.format(todayValue);
    document.getElementById('growth-value').innerText = formatter.format(nextYearValue);

    // Logic-based advice based on Troy's principles
    let advice = "";
    if (demandMultiplier < 1) {
        advice = "<strong>Market Timing:</strong> Demand is soft. Because your trees add volume biologically, holding may be better than selling in a down cycle.";
    } else if (distance > 50) {
        advice = "<strong>Local Constraint:</strong> Your distance to mills is high. Focus on high-quality veneer logs to offset transportation costs.";
    } else {
        advice = "<strong>Status:</strong> Your forest fundamentals are strong. Decisions should be based on forest health and maturity rather than price anxiety.";
    }
    document.getElementById('decision-advice').innerHTML = advice;

    renderChart(todayValue, nextYearValue);
}

function renderChart(val1, val2) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current Value', 'Value in 1 Year (Bio-Growth)'],
            datasets: [{
                label: 'Value ($)',
                data: [val1, val2],
                backgroundColor: ['#1e392a', '#d4af37']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}
