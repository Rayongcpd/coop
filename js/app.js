/**
 * Main Application Module.
 * Handles routing, navigation, and app initialization.
 * Also includes the Reports page renderer.
 */

// ============================================================
// Router
// ============================================================

const PAGES = {
  dashboard: {
    title: 'แดชบอร์ด',
    render: renderDashboard,
  },
  organizations: {
    title: 'สหกรณ์/กลุ่มเกษตรกร',
    render: renderOrganizations,
  },
  members: {
    title: 'สมาชิก',
    render: renderMembers,
  },
  reports: {
    title: 'รายงาน',
    render: renderReports,
  },
  typeSummary: {
    title: 'ข้อมูลภาพรวม',
    render: renderTypeSummary,
  },
};

let currentPage = 'dashboard';

/**
 * Navigate to a page.
 * @param {string} page
 */
function navigateTo(page) {
  if (!PAGES[page]) page = 'dashboard';
  
  // Security: Check if page requires admin
  if (page === 'typeSummary' && !isAdmin()) {
    page = 'dashboard';
  }

  currentPage = page;

  // Update URL hash
  window.location.hash = page;

  // Update page title
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = PAGES[page].title;

  // Update active nav
  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Close mobile sidebar
  closeSidebar();

  // Render page
  PAGES[page].render();
}

/**
 * Handle hash change for routing.
 */
function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);
}

// ============================================================
// Sidebar Controls
// ============================================================

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// ============================================================
// Type Summary Page (Editable Table)
// ============================================================

const ALL_TYPES = [
  { category: 'สหกรณ์', type: 'สหกรณ์การเกษตร' },
  { category: 'สหกรณ์', type: 'สหกรณ์ประมง' },
  { category: 'สหกรณ์', type: 'สหกรณ์นิคม' },
  { category: 'สหกรณ์', type: 'สหกรณ์ร้านค้า' },
  { category: 'สหกรณ์', type: 'สหกรณ์บริการ' },
  { category: 'สหกรณ์', type: 'สหกรณ์ออมทรัพย์' },
  { category: 'สหกรณ์', type: 'สหกรณ์เครดิตยูเนียน' },
  { category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำนา' },
  { category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำไร่' },
  { category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำสวน' },
  { category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำประมง' },
  { category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรเลี้ยงสัตว์' },
];

async function renderTypeSummary() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="flex-center" style="min-height:300px;"><div class="spinner"></div></div>';

  try {
    const res = await Api.getTypeSummary();
    const data = res.success ? res.data : [];

    // Merge with ALL_TYPES template
    const rows = ALL_TYPES.map(t => {
      const existing = data.find(d => d.type === t.type);
      return existing ? { ...t, ...existing } : { ...t, id: '', orgCount: 0, memberCount: 0, businessTotal: 0, bizDeposit: 0, bizLoan: 0, bizSupply: 0, bizCollect: 0, bizProcess: 0, bizService: 0, dataDate: '' };
    });

    const numInput = (name, val, row) => `<input type="number" class="ts-input" data-row="${row}" data-field="${name}" value="${val || 0}" min="0" ${isAdmin() ? '' : 'disabled'}>`;

    content.innerHTML = `
      <div class="section-header">
        <div class="section-title">
          <span class="material-symbols-rounded">analytics</span>
          ข้อมูลสมาชิกภาพรวม (แยกตามประเภท)
        </div>
        ${isAdmin() ? `<button class="btn btn-primary" onclick="handleSaveTypeSummary()" id="saveSummaryBtn">
          <span class="material-symbols-rounded">save</span> บันทึกข้อมูล
        </button>` : ''}
      </div>
      <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:16px;">
        <span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;">info</span>
        กรอกตัวเลขจำนวนสมาชิกภาพรวมตามประเภท — เมื่อมีข้อมูลรายบุคคลในอนาคต ระบบจะใช้ข้อมูลจริงแทน
      </p>

      <!-- สหกรณ์ -->
      <div class="table-wrapper animate-in mb-lg">
        <div class="table-header"><div class="table-header-left"><div class="table-title">
          <span class="material-symbols-rounded">apartment</span> สหกรณ์
        </div></div></div>
        <div class="table-scroll">
          <table class="ts-table">
            <thead><tr>
              <th>ประเภท</th><th>จำนวนแห่ง</th><th>สมาชิก</th><th>ร่วมธุรกิจ</th>
              <th>รับฝากเงิน</th><th>ให้เงินกู้</th><th>จัดหาสินค้า</th>
              <th>แปรรูป</th><th>รวบรวมผลผลิต</th><th>บริการ</th>
            </tr></thead>
            <tbody>
              ${rows.filter(r => r.category === 'สหกรณ์').map((r, i) => `<tr>
                <td style="font-weight:500;white-space:nowrap;">${r.type.replace('สหกรณ์','').trim()}</td>
                <td>${numInput('orgCount', r.orgCount, i)}</td>
                <td>${numInput('memberCount', r.memberCount, i)}</td>
                <td>${numInput('businessTotal', r.businessTotal, i)}</td>
                <td>${numInput('bizDeposit', r.bizDeposit, i)}</td>
                <td>${numInput('bizLoan', r.bizLoan, i)}</td>
                <td>${numInput('bizSupply', r.bizSupply, i)}</td>
                <td>${numInput('bizProcess', r.bizProcess, i)}</td>
                <td>${numInput('bizCollect', r.bizCollect, i)}</td>
                <td>${numInput('bizService', r.bizService, i)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- กลุ่มเกษตรกร -->
      <div class="table-wrapper animate-in">
        <div class="table-header"><div class="table-header-left"><div class="table-title">
          <span class="material-symbols-rounded">eco</span> กลุ่มเกษตรกร
        </div></div></div>
        <div class="table-scroll">
          <table class="ts-table">
            <thead><tr>
              <th>ประเภท</th><th>จำนวนกลุ่ม</th><th>สมาชิก</th><th>ร่วมธุรกิจ</th>
              <th>รับฝากเงิน</th><th>ให้เงินกู้</th><th>จัดหาสินค้า</th>
              <th>แปรรูป</th><th>รวบรวมผลผลิต</th><th>บริการ</th>
            </tr></thead>
            <tbody>
              ${rows.filter(r => r.category === 'กลุ่มเกษตรกร').map((r, i) => `<tr>
                <td style="font-weight:500;white-space:nowrap;">${r.type.replace('กลุ่มเกษตรกร','').trim()}</td>
                <td>${numInput('orgCount', r.orgCount, i + 7)}</td>
                <td>${numInput('memberCount', r.memberCount, i + 7)}</td>
                <td>${numInput('businessTotal', r.businessTotal, i + 7)}</td>
                <td>${numInput('bizDeposit', r.bizDeposit, i + 7)}</td>
                <td>${numInput('bizLoan', r.bizLoan, i + 7)}</td>
                <td>${numInput('bizSupply', r.bizSupply, i + 7)}</td>
                <td>${numInput('bizProcess', r.bizProcess, i + 7)}</td>
                <td>${numInput('bizCollect', r.bizCollect, i + 7)}</td>
                <td>${numInput('bizService', r.bizService, i + 7)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('TypeSummary error:', err);
    content.innerHTML = '<div class="table-empty"><span class="material-symbols-rounded">error</span><p>ไม่สามารถโหลดข้อมูลได้</p></div>';
  }
}

async function handleSaveTypeSummary() {
  const inputs = document.querySelectorAll('.ts-input');
  const rowData = {};
  inputs.forEach(inp => {
    const row = inp.dataset.row;
    const field = inp.dataset.field;
    if (!rowData[row]) rowData[row] = {};
    rowData[row][field] = parseInt(inp.value) || 0;
  });

  const rows = ALL_TYPES.map((t, i) => ({
    ...t,
    id: 'ts' + String(i + 1).padStart(2, '0'),
    orgCount: rowData[i]?.orgCount || 0,
    memberCount: rowData[i]?.memberCount || 0,
    businessTotal: rowData[i]?.businessTotal || 0,
    bizDeposit: rowData[i]?.bizDeposit || 0,
    bizLoan: rowData[i]?.bizLoan || 0,
    bizSupply: rowData[i]?.bizSupply || 0,
    bizCollect: rowData[i]?.bizCollect || 0,
    bizProcess: rowData[i]?.bizProcess || 0,
    bizService: rowData[i]?.bizService || 0,
    dataDate: new Date().toISOString().split('T')[0],
  }));

  try {
    showLoading();
    const res = await Api.saveTypeSummary(rows);
    hideLoading();
    if (res.success) {
      showToast(`บันทึกข้อมูลสำเร็จ ${res.count || rows.length} ประเภท`, 'success');
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

// ============================================================
// Reports Page
// ============================================================

/**
 * Render the reports page.
 */
async function renderReports() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="flex-center" style="min-height:300px;">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const [dashRes, orgsRes, membersRes] = await Promise.all([
      Api.getDashboard(),
      Api.getOrganizations({}),
      Api.getMembers({}),
    ]);

    const dash = dashRes.success ? dashRes.data : {};
    const orgs = orgsRes.success ? orgsRes.data : [];
    const members = membersRes.success ? membersRes.data : [];

    // Per-org stats
    const orgStats = orgs.map(org => {
      const orgMembers = members.filter(m => m.orgId === org.id);
      const activeMembers = orgMembers.filter(m => m.status === 'ปกติ');
      const bizMembers = orgMembers.filter(m => m.participateInBusiness);
      return { org, total: orgMembers.length, active: activeMembers.length, business: bizMembers.length };
    }).sort((a, b) => b.total - a.total);

    content.innerHTML = `
      <!-- Report Header -->
      <div class="section-header">
        <div class="section-title">
          <span class="material-symbols-rounded">summarize</span>
          รายงานสรุปข้อมูล
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid">
        ${createStatCard('apartment', 'สหกรณ์', dash.totalOrgs || 0, 'แห่ง', 'blue', 0)}
        ${createStatCard('eco', 'กลุ่มเกษตรกร', dash.totalFarmerGroups || 0, 'กลุ่ม', 'green', 1)}
        ${createStatCard('groups', 'สมาชิกสหกรณ์', dash.coopMemberCount || 0, 'คน', 'purple', 2)}
        ${createStatCard('groups', 'สมาชิกกลุ่มเกษตรกร', dash.farmerMemberCount || 0, 'คน', 'rose', 3)}
        ${createStatCard('handshake', 'สหกรณ์ร่วมธุรกิจ', dash.coopBusinessCount || 0, 'คน', 'indigo', 4)}
        ${createStatCard('handshake', 'กลุ่มเกษตรกรร่วมธุรกิจ', dash.farmerBusinessCount || 0, 'คน', 'amber', 5)}
      </div>

      <div class="report-grid">
        <!-- Organization Types Report -->
        <div class="report-card animate-in animate-in-delay-1">
          <div class="report-card-title">
            <span class="material-symbols-rounded">category</span>
            จำนวนสหกรณ์แยกตามประเภท
          </div>
          ${dash.byType ? Object.entries(dash.byType).map(([type, count]) => `
            <div class="report-item">
              <span class="report-item-label">${type}</span>
              <span class="report-item-value">${formatNumber(count)} แห่ง</span>
            </div>
          `).join('') : '<p class="text-muted">ไม่มีข้อมูล</p>'}
        </div>

        <div class="report-card animate-in animate-in-delay-1-5">
          <div class="report-card-title">
            <span class="material-symbols-rounded">eco</span>
            จำนวนกลุ่มเกษตรกรแยกตามประเภท
          </div>
          ${dash.byFarmerGroupType ? Object.entries(dash.byFarmerGroupType).map(([type, count]) => `
            <div class="report-item">
              <span class="report-item-label">${type}</span>
              <span class="report-item-value">${formatNumber(count)} กลุ่ม</span>
            </div>
          `).join('') : '<p class="text-muted">ไม่มีข้อมูล</p>'}
        </div>

        <!-- Business Types Report -->
        <div class="report-card animate-in animate-in-delay-2">
          <div class="report-card-title">
            <span class="material-symbols-rounded">business_center</span>
            ประเภทธุรกิจที่สมาชิกร่วม
          </div>
          ${dash.businessByType ? Object.entries(dash.businessByType).map(([type, count]) => {
            const pct = dash.businessMembers > 0 ? Math.round(count / dash.businessMembers * 100) : 0;
            return `
            <div class="report-item">
              <span class="report-item-label">${type}</span>
              <span class="report-item-value">${formatNumber(count)} คน</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill blue" style="width:${pct}%;"></div>
            </div>
          `}).join('') : '<p class="text-muted">ไม่มีข้อมูล</p>'}
        </div>
      </div>

      <!-- Per-Organization Table -->
      <div class="section-header mt-lg">
        <div class="section-title">
          <span class="material-symbols-rounded">table_chart</span>
          สรุปจำนวนสมาชิกรายองค์กร
        </div>
        <div class="search-inline" style="width: 250px;">
          <span class="material-symbols-rounded">search</span>
          <input type="text" class="form-input" id="reportOrgSearch" placeholder="ค้นหาชื่อองค์กร...">
        </div>
      </div>

      <div class="table-wrapper animate-in">
        <div class="table-scroll">
          <table class="reports-table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อองค์กร</th>
                <th>หมวดหมู่</th>
                <th>ประเภท</th>
                <th>สมาชิกทั้งหมด</th>
                <th>สมาชิกปกติ</th>
                <th>ร่วมทำธุรกิจ</th>
                <th>% ร่วมธุรกิจ</th>
              </tr>
            </thead>
            <tbody>
              ${orgStats.length === 0
                ? '<tr><td colspan="8" class="text-center text-muted" style="padding:40px;">ไม่มีข้อมูล</td></tr>'
                : orgStats.map((item, idx) => {
                    const pct = item.total > 0 ? Math.round(item.business / item.total * 100) : 0;
                    return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td style="font-weight:500;">${escapeHtml(item.org.name)}</td>
                      <td>${escapeHtml(item.org.category)}</td>
                      <td><span class="badge badge-${getTypeColor(item.org.type)}">${escapeHtml(item.org.type)}</span></td>
                      <td class="text-center">${formatNumber(item.total)}</td>
                      <td class="text-center">${formatNumber(item.active)}</td>
                      <td class="text-center"><span class="text-accent" style="font-weight:600;">${formatNumber(item.business)}</span></td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div class="progress-bar" style="flex:1;">
                            <div class="progress-fill ${pct >= 50 ? 'green' : 'amber'}" style="width:${pct}%;"></div>
                          </div>
                          <span style="font-size:0.8rem;min-width:35px;text-align:right;">${pct}%</span>
                        </div>
                      </td>
                    </tr>
                  `}).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add search listener for reports table
    const reportSearch = document.getElementById('reportOrgSearch');
    reportSearch.addEventListener('input', (e) => {
      const searchText = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.table-wrapper tbody tr');
      rows.forEach(row => {
        const nameCell = row.cells[1]; // ชื่อองค์กร
        if (nameCell) {
          const text = nameCell.textContent.toLowerCase();
          row.style.display = text.includes(searchText) ? '' : 'none';
        }
      });
    });


  } catch (err) {
    console.error('Reports error:', err);
    content.innerHTML = `
      <div class="table-empty">
        <span class="material-symbols-rounded">error</span>
        <p>เกิดข้อผิดพลาดในการโหลดรายงาน</p>
      </div>
    `;
  }
}

// ============================================================
// Admin Login / Logout
// ============================================================

/**
 * Show the hidden admin login modal.
 */
function showAdminLogin() {
  const html = `
    <form id="adminLoginForm" onsubmit="handleAdminLogin(event)">
      <div class="form-group">
        <label class="form-label">รหัสผ่าน Admin <span class="required">*</span></label>
        <input type="password" class="form-input" name="password" id="adminPassword"
               placeholder="กรอกรหัสผ่าน" required autofocus>
      </div>
      <div class="form-actions" style="border-top:none;margin-top:16px;padding-top:0;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">
          <span class="material-symbols-rounded">login</span>
          เข้าสู่ระบบ
        </button>
      </div>
    </form>
  `;
  openModal('เข้าสู่ระบบ Admin', html);
}

/**
 * Handle admin login form submission.
 */
async function handleAdminLogin(event) {
  event.preventDefault();
  const password = document.getElementById('adminPassword').value;

  try {
    showLoading();
    const res = await Api.verifyAdmin(password);
    hideLoading();

    if (res.success) {
      setAdminState(true);
      closeModal();
      updateAdminUI();
      showToast('เข้าสู่ระบบ Admin สำเร็จ', 'success');
      // Re-render current page to show admin buttons
      if (PAGES[currentPage]) PAGES[currentPage].render();
    } else {
      showToast(res.error || 'รหัสผ่านไม่ถูกต้อง', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * Admin logout.
 */
function adminLogout() {
  setAdminState(false);
  updateAdminUI();
  showToast('ออกจากระบบ Admin แล้ว', 'info');
  
  // If on a restricted page, go back to dashboard
  if (currentPage === 'typeSummary') {
    navigateTo('dashboard');
  } else {
    // Re-render current page to hide admin buttons
    if (PAGES[currentPage]) PAGES[currentPage].render();
  }
}

/**
 * Update the sidebar footer to reflect admin state.
 */
function updateAdminUI() {
  const adminArea = document.getElementById('adminArea');
  const navTypeSummary = document.getElementById('nav-typeSummary');
  if (!adminArea) return;

  const admin = isAdmin();

  // Toggle 'ภาพรวม' menu visibility
  if (navTypeSummary) {
    navTypeSummary.classList.toggle('hidden', !admin);
  }

  if (admin) {
    adminArea.innerHTML = `
      <div class="admin-logged-in">
        <div class="admin-badge-row">
          <span class="badge badge-green" style="font-size:0.7rem;">
            <span class="material-symbols-rounded" style="font-size:14px;margin-right:2px;">shield_person</span>
            ADMIN
          </span>
        </div>
        <button class="btn btn-ghost btn-sm admin-logout-btn" onclick="adminLogout()" style="width:100%;justify-content:center;margin-top:8px;font-size:0.78rem;color:var(--text-muted);">
          <span class="material-symbols-rounded" style="font-size:16px;">logout</span>
          ออกจากระบบ
        </button>
      </div>
    `;
  } else {
    adminArea.innerHTML = `
      <div class="sidebar-info" id="loginTrigger" style="cursor:pointer;" title="Admin Login">
        <span class="material-symbols-rounded">info</span>
        <span>v1.0.0</span>
      </div>
    `;
    // Re-attach click listener
    const trigger = document.getElementById('loginTrigger');
    if (trigger) {
      trigger.addEventListener('click', showAdminLogin);
    }
  }
}

// ============================================================
// App Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Navigation click handlers
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', openSidebar);

  // Sidebar close
  const sidebarClose = document.getElementById('sidebarClose');
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

  // Overlay close
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Modal close
  const modalClose = document.getElementById('modalClose');
  if (modalClose) modalClose.addEventListener('click', closeModal);

  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSidebar();
    }
  });

  // Hidden admin login trigger (click on version in sidebar footer)
  const loginTrigger = document.getElementById('loginTrigger');
  if (loginTrigger) {
    loginTrigger.addEventListener('click', showAdminLogin);
  }

  // Show demo mode badge
  if (IS_DEMO_MODE) {
    const topbar = document.getElementById('topbar');
    if (topbar) {
      const demoBadge = document.createElement('div');
      demoBadge.className = 'badge badge-amber';
      demoBadge.style.cssText = 'margin-left:12px;font-size:0.7rem;';
      demoBadge.textContent = 'DEMO MODE';
      const topbarLeft = topbar.querySelector('.topbar-left');
      if (topbarLeft) topbarLeft.appendChild(demoBadge);
    }
  }

  // Initialize admin UI state
  updateAdminUI();

  // Handle initial route
  handleRoute();

  // Hash change listener
  window.addEventListener('hashchange', handleRoute);
});

