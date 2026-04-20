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
};

let currentPage = 'dashboard';

/**
 * Navigate to a page.
 * @param {string} page
 */
function navigateTo(page) {
  if (!PAGES[page]) page = 'dashboard';
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
        ${createStatCard('groups', 'สมาชิกทั้งหมด', dash.totalMembers || 0, 'คน', 'purple', 2)}
        ${createStatCard('handshake', 'ร่วมทำธุรกิจ', dash.businessMembers || 0, 'คน', 'amber', 3)}
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
          <table>
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
  // Re-render current page to hide admin buttons
  if (PAGES[currentPage]) PAGES[currentPage].render();
}

/**
 * Update the sidebar footer to reflect admin state.
 */
function updateAdminUI() {
  const adminArea = document.getElementById('adminArea');
  if (!adminArea) return;

  if (isAdmin()) {
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

