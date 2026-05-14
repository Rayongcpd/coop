/**
 * Dashboard Page Module.
 * Renders summary cards, charts, and statistics.
 */

// Store chart instances to destroy before re-creating
let chartInstances = {};

/**
 * Render the dashboard page.
 */
async function renderDashboard() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="dashboard-loading flex-center" style="min-height:300px;">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const res = await Api.getDashboard();
    if (!res.success) throw new Error('Failed to load dashboard');
    const data = res.data;

    content.innerHTML = `
      <!-- Summary Stats -->
      <div class="stats-grid" id="statsGrid">
        ${createStatCard('apartment', 'สหกรณ์', data.totalOrgs, 'แห่ง', 'blue', 0)}
        ${createStatCard('eco', 'กลุ่มเกษตรกร', data.totalFarmerGroups, 'กลุ่ม', 'green', 1)}
        ${createStatCard('groups', 'สมาชิกสหกรณ์', data.coopMemberCount, 'คน', 'purple', 2)}
        ${createStatCard('groups', 'สมาชิกกลุ่มเกษตรกร', data.farmerMemberCount, 'คน', 'rose', 3)}
        ${createStatCard('handshake', 'สหกรณ์ร่วมธุรกิจ', data.coopBusinessCount, 'คน', 'indigo', 4)}
        ${createStatCard('handshake', 'กลุ่มเกษตรกรร่วมธุรกิจ', data.farmerBusinessCount, 'คน', 'amber', 5)}
      </div>

      <!-- Charts Row -->
      <div class="charts-grid">
        <!-- Coop Types Chart -->
        <div class="chart-card animate-in animate-in-delay-2">
          <div class="chart-card-title">
            <span class="material-symbols-rounded">donut_large</span>
            จำนวนสหกรณ์แยกตามประเภท
          </div>
          <div class="chart-container">
            <canvas id="coopTypeChart"></canvas>
          </div>
        </div>

        <!-- Farmer Group Types Chart -->
        <div class="chart-card animate-in animate-in-delay-2">
          <div class="chart-card-title">
            <span class="material-symbols-rounded">donut_small</span>
            จำนวนกลุ่มเกษตรกรแยกตามประเภท
          </div>
          <div class="chart-container">
            <canvas id="farmerGroupTypeChart"></canvas>
          </div>
        </div>

        <!-- Members by Category Chart -->
        <div class="chart-card animate-in animate-in-delay-3">
          <div class="chart-card-title">
            <span class="material-symbols-rounded">bar_chart</span>
            จำนวนสมาชิก: สหกรณ์ vs กลุ่มเกษตรกร
          </div>
          <div class="chart-container">
            <canvas id="memberCategoryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Business Participation -->
      <div class="charts-grid">
        <div class="chart-card animate-in animate-in-delay-4">
          <div class="chart-card-title">
            <span class="material-symbols-rounded">pie_chart</span>
            สมาชิกที่ร่วมทำธุรกิจ
          </div>
          <div class="chart-container">
            <canvas id="businessParticipationChart"></canvas>
          </div>
        </div>

        <div class="chart-card animate-in animate-in-delay-4">
          <div class="chart-card-title">
            <span class="material-symbols-rounded">stacked_bar_chart</span>
            ประเภทธุรกิจที่สมาชิกร่วม
          </div>
          <div class="chart-container">
            <canvas id="businessTypeChart"></canvas>
          </div>
        </div>
      </div>

    `;

    // Create charts
    createCoopTypeChart(data.byType);
    createFarmerGroupTypeChart(data.byFarmerGroupType);
    createMemberCategoryChart(data.coopMemberCount, data.farmerMemberCount);
    createBusinessParticipationChart(data.businessMembers, data.totalMembers - data.businessMembers);
    createBusinessTypeChart(data.businessByType);

  } catch (err) {
    console.error('Dashboard error:', err);
    content.innerHTML = `
      <div class="table-empty">
        <span class="material-symbols-rounded">error</span>
        <p>ไม่สามารถโหลดข้อมูลได้</p>
        <button class="btn btn-primary mt-md" onclick="renderDashboard()">
          <span class="material-symbols-rounded">refresh</span> ลองอีกครั้ง
        </button>
      </div>
    `;
  }
}

/**
 * Create a stat card HTML.
 */
function createStatCard(icon, label, value, sub, color, delay) {
  return `
    <div class="stat-card ${color} animate-in animate-in-delay-${delay}">
      <div class="stat-card-header">
        <span class="stat-card-label">${label}</span>
        <div class="stat-card-icon">
          <span class="material-symbols-rounded">${icon}</span>
        </div>
      </div>
      <div class="stat-card-value">${formatNumber(value)}</div>
      <div class="stat-card-sub">${sub}</div>
    </div>
  `;
}

// ============================================================
// Chart Creation Functions
// ============================================================

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#06B6D4', '#F43F5E', '#6366F1',
];

const CHART_COLORS_ALPHA = [
  'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(139,92,246,0.8)',
  'rgba(239,68,68,0.8)', 'rgba(6,182,212,0.8)', 'rgba(244,63,94,0.8)', 'rgba(99,102,241,0.8)',
];

/**
 * Destroy a chart instance if it exists.
 */
function destroyChart(name) {
  if (chartInstances[name]) {
    chartInstances[name].destroy();
    delete chartInstances[name];
  }
}

/**
 * Common Chart.js defaults for dark theme.
 */
function getChartDefaults() {
  return {
    color: '#94A3B8',
    borderColor: 'rgba(148,163,184,0.1)',
    font: { family: "'Inter', 'Noto Sans Thai', sans-serif" },
  };
}

/**
 * Cooperative types doughnut chart.
 */
function createCoopTypeChart(byType) {
  destroyChart('coopType');
  const canvas = document.getElementById('coopTypeChart');
  if (!canvas) return;

  const labels = Object.keys(byType).map(t => t.replace('สหกรณ์', '').trim());
  const values = Object.values(byType);

  chartInstances.coopType = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS_ALPHA,
        borderColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            ...getChartDefaults(),
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        },
      },
    },
  });
}

/**
 * Farmer group types doughnut chart.
 */
function createFarmerGroupTypeChart(byType) {
  destroyChart('farmerGroupType');
  const canvas = document.getElementById('farmerGroupTypeChart');
  if (!canvas) return;

  const labels = Object.keys(byType).map(t => t.replace('กลุ่มเกษตรกร', '').trim());
  const values = Object.values(byType);

  // Use a slightly different color scheme for variety, or reuse but reversed
  const colors = [...CHART_COLORS].reverse();
  const colorsAlpha = [...CHART_COLORS_ALPHA].reverse();

  chartInstances.farmerGroupType = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colorsAlpha,
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            ...getChartDefaults(),
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        },
      },
    },
  });
}

/**
 * Members by category (coop vs farmer group) bar chart.
 */
function createMemberCategoryChart(coopCount, farmerCount) {
  destroyChart('memberCategory');
  const canvas = document.getElementById('memberCategoryChart');
  if (!canvas) return;

  chartInstances.memberCategory = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['สหกรณ์', 'กลุ่มเกษตรกร'],
      datasets: [{
        label: 'จำนวนสมาชิก',
        data: [coopCount, farmerCount],
        backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)'],
        borderColor: ['#3B82F6', '#10B981'],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 60,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} คน`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(148,163,184,0.08)' },
        },
        x: {
          ticks: { color: '#94A3B8', font: { size: 13 } },
          grid: { display: false },
        },
      },
    },
  });
}

/**
 * Business participation doughnut chart.
 */
function createBusinessParticipationChart(participating, notParticipating) {
  destroyChart('businessPart');
  const canvas = document.getElementById('businessParticipationChart');
  if (!canvas) return;

  chartInstances.businessPart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['ร่วมทำธุรกิจ', 'ไม่ได้ร่วม'],
      datasets: [{
        data: [participating, notParticipating],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(100,116,139,0.4)'],
        borderColor: ['#10B981', '#475569'],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            ...getChartDefaults(),
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.parsed} คน`,
          },
        },
      },
    },
  });
}

/**
 * Business types horizontal bar chart.
 */
function createBusinessTypeChart(businessByType) {
  destroyChart('businessType');
  const canvas = document.getElementById('businessTypeChart');
  if (!canvas) return;

  const labels = Object.keys(businessByType);
  const values = Object.values(businessByType);

  chartInstances.businessType = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'จำนวนสมาชิก',
        data: values,
        backgroundColor: CHART_COLORS_ALPHA.slice(0, labels.length),
        borderColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F1F5F9',
          bodyColor: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.parsed.x} คน`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(148,163,184,0.08)' },
        },
        y: {
          ticks: { color: '#94A3B8', font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}
