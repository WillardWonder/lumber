let myChart;

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    el.classList.add('active');
    
    // Auto-update calculations when switching to Analysis
    if (tabId === 'analysis') updateCalculations();
}

function updateCalculations() {
    const acres = parseFloat(document.getElementById('total-acres').value) || 0;
    const avgMbf = parseFloat(document.getElementById('avg-mbf').value) || 0;
    const harvestCost = parseFloat(document.getElementById('harvest-cost').value) || 0;
    
    // Map species percentages to their specific mill prices
    const speciesData = {
        maple: { pct: document.querySelector('[data-sp="maple"]').value / 100, price: document.getElementById('p-hardwood').value },
        oak: { pct: document.querySelector('[data-sp="oak"]').value / 100, price: document.getElementById('p-hardwood').value },
        pine: { pct: document.querySelector('[data-sp="pine"]').value / 100, price: document.getElementById('p-pine').value },
        aspen: { pct: document.querySelector('[data-sp="aspen"]').value / 100, price: document.getElementById('p-pulp').value }
    };

    let totalNetValue = 0;
    let totalMbfCount = acres * avgMbf;
    let valuesArray = [];
    let labelsArray = [];

    for (let s in speciesData) {
        let spMbf = totalMbfCount * speciesData[s].pct;
        // Stumpage = Mill Price - Harvest/Haul Costs
        let stumpagePerMbf = speciesData[s].price - harvestCost;
        let spValue = spMbf * stumpagePerMbf;
        
        totalNetValue += spValue;
        valuesArray.push(Math.round(spValue));
        labelsArray.push(s.toUpperCase());
    }

    // UI Updates
    document.getElementById('net-value-display').innerText = new Intl.NumberFormat('en-US', { 
        style: 'currency', currency: 'USD', maximumFractionDigits: 0 
    }).format(totalNetValue);
    
    document.getElementById('cost-val').innerText = `$${harvestCost}`;
    document.getElementById('valuation-subtext').innerText = `Est. ${totalMbfCount.toFixed(1)} MBF total volume.`;

    renderChart(labelsArray, valuesArray);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('speciesChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1e392a', '#2d5a41', '#d4af37', '#444'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Update Analysis live if inputs change
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        if(document.getElementById('analysis').style.display !== 'none') {
            updateCalculations();
        }
    });
});
