/**
 * Members Page Module.
 * CRUD operations for สมาชิก with organization selection.
 */

// Current state
let memberState = {
  selectedOrgId: '',
  search: '',
};

/**
 * Render the members page.
 */
async function renderMembers() {
  const content = document.getElementById('pageContent');

  // Load organizations for selector
  let orgs = [];
  try {
    const res = await Api.getOrganizations({});
    if (res.success) orgs = res.data;
  } catch (e) {
    console.error('Failed to load orgs for member page:', e);
  }

  content.innerHTML = `
    <div class="org-selector">
      <label class="form-label">เลือกสหกรณ์/กลุ่มเกษตรกร</label>
      <div class="search-inline mb-sm">
        <span class="material-symbols-rounded">search</span>
        <input type="text" class="form-input" id="orgFilterInput" placeholder="พิมพ์เพื่อค้นหาชื่อสหกรณ์...">
      </div>
      <select class="form-select" id="memberOrgSelect">
        <option value="">— เลือกองค์กร —</option>
        <optgroup label="สหกรณ์" id="coopOptGroup">
          ${orgs.filter(o => o.category === 'สหกรณ์').map(o =>
            `<option value="${o.id}" ${memberState.selectedOrgId === o.id ? 'selected' : ''}>${escapeHtml(o.name)}</option>`
          ).join('')}
        </optgroup>
        <optgroup label="กลุ่มเกษตรกร" id="farmerOptGroup">
          ${orgs.filter(o => o.category === 'กลุ่มเกษตรกร').map(o =>
            `<option value="${o.id}" ${memberState.selectedOrgId === o.id ? 'selected' : ''}>${escapeHtml(o.name)}</option>`
          ).join('')}
        </optgroup>
      </select>
    </div>

    <!-- Members Content Area -->
    <div id="membersContentArea">
      ${memberState.selectedOrgId
        ? '<div class="flex-center" style="padding:40px;"><div class="spinner"></div></div>'
        : `<div class="table-empty" style="padding:80px;">
            <span class="material-symbols-rounded" style="font-size:64px;opacity:0.3;">groups</span>
            <p class="mt-md" style="font-size:1rem;">กรุณาเลือกสหกรณ์/กลุ่มเกษตรกร เพื่อดูรายชื่อสมาชิก</p>
          </div>`
      }
    </div>
  `;

  // Event listener
  const orgSelect = document.getElementById('memberOrgSelect');
  const orgFilterInput = document.getElementById('orgFilterInput');

  orgSelect.addEventListener('change', (e) => {
    memberState.selectedOrgId = e.target.value;
    memberState.search = '';
    if (memberState.selectedOrgId) {
      loadMemberView();
    } else {
      document.getElementById('membersContentArea').innerHTML = `
        <div class="table-empty" style="padding:80px;">
          <span class="material-symbols-rounded" style="font-size:64px;opacity:0.3;">groups</span>
          <p class="mt-md" style="font-size:1rem;">กรุณาเลือกสหกรณ์/กลุ่มเกษตรกร เพื่อดูรายชื่อสมาชิก</p>
        </div>
      `;
    }
  });

  // Filter organizations as user types
  orgFilterInput.addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase();
    const options = orgSelect.querySelectorAll('option');
    
    options.forEach(opt => {
      if (opt.value === '') return; // Skip placeholder
      const text = opt.textContent.toLowerCase();
      if (text.includes(searchText)) {
        opt.style.display = '';
      } else {
        opt.style.display = 'none';
      }
    });

    // Handle optgroup visibility (optional but nice)
    const groups = orgSelect.querySelectorAll('optgroup');
    groups.forEach(group => {
      const visibleOpts = Array.from(group.querySelectorAll('option')).filter(opt => opt.style.display !== 'none');
      group.style.display = visibleOpts.length > 0 ? '' : 'none';
    });
  });

  // Auto-load if org already selected
  if (memberState.selectedOrgId) {
    await loadMemberView();
  }
}

/**
 * Load member view for selected organization.
 */
async function loadMemberView() {
  const area = document.getElementById('membersContentArea');
  if (!area) return;

  try {
    const [orgRes, membersRes] = await Promise.all([
      Api.getOrganization(memberState.selectedOrgId),
      Api.getMembers({ orgId: memberState.selectedOrgId }),
    ]);

    const org = orgRes.success ? orgRes.data : null;
    let members = membersRes.success ? membersRes.data : [];

    // Apply search filter
    if (memberState.search) {
      const s = memberState.search.toLowerCase();
      members = members.filter(m =>
        m.name.toLowerCase().includes(s) ||
        m.memberCode.toLowerCase().includes(s) ||
        (m.phone && m.phone.includes(s))
      );
    }

    const activeMembers = members.filter(m => m.status === 'ปกติ');
    const businessMembers = members.filter(m => m.participateInBusiness);

    area.innerHTML = `
      <!-- Stats -->
      <div class="stats-grid animate-in">
        ${createStatCard('groups', 'สมาชิกทั้งหมด', members.length, `ปกติ ${activeMembers.length} คน`, 'blue', 0)}
        ${createStatCard('handshake', 'ร่วมทำธุรกิจ', businessMembers.length,
          `${members.length > 0 ? Math.round(businessMembers.length / members.length * 100) : 0}% ของสมาชิก`, 'green', 1)}
      </div>

      <!-- Filter + Add -->
      <div class="filter-bar">
        <div class="search-inline">
          <span class="material-symbols-rounded">search</span>
          <input type="text" class="form-input" placeholder="ค้นหาสมาชิก..."
                 id="memberSearchInput" value="${escapeHtml(memberState.search)}">
        </div>
        ${isAdmin() ? `<button class="btn btn-primary" onclick="showMemberForm('${memberState.selectedOrgId}')" id="addMemberBtn">
          <span class="material-symbols-rounded">person_add</span>
          เพิ่มสมาชิก
        </button>` : ''}
      </div>

      <!-- Table -->
      <div class="table-wrapper animate-in">
        <div class="table-header">
          <div class="table-header-left">
            <div class="table-title">
              <span class="material-symbols-rounded">people</span>
              รายชื่อสมาชิก${org ? ' — ' + escapeHtml(org.name) : ''}
            </div>
            <span class="table-count">${members.length} คน</span>
          </div>
        </div>
        <div class="table-scroll">
          <table class="members-table">
            <thead>
              <tr>
                <th>รหัสสมาชิก</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เบอร์โทร</th>
                <th>วันเข้าเป็นสมาชิก</th>
                <th>สถานะ</th>
                <th>ร่วมธุรกิจ</th>
                <th>ประเภทธุรกิจ</th>
                ${isAdmin() ? '<th>จัดการ</th>' : ''}
              </tr>
            </thead>
            <tbody id="memberTableBody">
              ${members.length === 0 ? `
                <tr><td colspan="8">
                  <div class="table-empty">
                    <span class="material-symbols-rounded">person_off</span>
                    <p>${memberState.search ? 'ไม่พบสมาชิกที่ค้นหา' : 'ยังไม่มีสมาชิก'}</p>
                  </div>
                </td></tr>
              ` : members.map(m => `
                <tr>
                  <td><span class="text-accent" style="font-weight:600;">${escapeHtml(m.memberCode)}</span></td>
                  <td style="font-weight:500;">${escapeHtml(m.name)}</td>
                  <td>${escapeHtml(m.phone || '-')}</td>
                  <td>${formatDate(m.joinDate)}</td>
                  <td><span class="badge ${getStatusBadgeClass(m.status)}">${escapeHtml(m.status)}</span></td>
                  <td>${m.participateInBusiness
                    ? '<span class="badge badge-green">ร่วม</span>'
                    : '<span class="badge badge-gray">ไม่ร่วม</span>'
                  }</td>
                  <td>${m.businessTypes
                    ? m.businessTypes.split(',').map(bt =>
                        `<span class="badge badge-blue" style="margin:2px;">${escapeHtml(bt.trim())}</span>`
                      ).join('')
                    : '<span class="text-muted">-</span>'
                  }</td>
                  ${isAdmin() ? `<td>
                    <div class="action-btns">
                      <button class="btn-icon edit" title="แก้ไข" onclick="showMemberForm('${memberState.selectedOrgId}', '${m.id}')">
                        <span class="material-symbols-rounded">edit</span>
                      </button>
                      <button class="btn-icon delete" title="ลบ" onclick="deleteMember('${m.id}', '${escapeHtml(m.name)}')">
                        <span class="material-symbols-rounded">delete</span>
                      </button>
                    </div>
                  </td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Search listener
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        memberState.search = e.target.value;
        loadMemberView();
      }, 300));
    }

  } catch (err) {
    console.error('Load member view error:', err);
    area.innerHTML = `
      <div class="table-empty">
        <span class="material-symbols-rounded">error</span>
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

/**
 * Show member add/edit form in modal.
 * @param {string} orgId
 * @param {string} [memberId]
 */
async function showMemberForm(orgId, memberId) {
  const isEdit = !!memberId;
  let member = {};

  if (isEdit) {
    showLoading();
    const res = await Api.getMember(memberId);
    hideLoading();
    if (!res.success || !res.data) {
      showToast('ไม่พบข้อมูลสมาชิก', 'error');
      return;
    }
    member = res.data;
  }

  const existingBusinessTypes = member.businessTypes ? member.businessTypes.split(',').map(s => s.trim()) : [];

  const html = `
    <form id="memberForm" onsubmit="handleMemberSubmit(event, '${orgId}', '${memberId || ''}')">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">รหัสสมาชิก <span class="required">*</span></label>
          <input type="text" class="form-input" name="memberCode" value="${escapeHtml(member.memberCode || '')}" placeholder="เช่น AGR-001" required>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
          <input type="text" class="form-input" name="name" value="${escapeHtml(member.name || '')}" placeholder="ชื่อ นามสกุล" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">เลขบัตรประชาชน</label>
          <input type="text" class="form-input" name="idCard" value="${escapeHtml(member.idCard || '')}" placeholder="x-xxxx-xxxxx-xx-x" maxlength="17">
        </div>
        <div class="form-group">
          <label class="form-label">เบอร์โทรศัพท์</label>
          <input type="text" class="form-input" name="phone" value="${escapeHtml(member.phone || '')}" placeholder="0xx-xxxxxxx">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">วันเข้าเป็นสมาชิก</label>
          <input type="date" class="form-input" name="joinDate" value="${toInputDate(member.joinDate)}">
        </div>
        <div class="form-group">
          <label class="form-label">สถานะ</label>
          <select class="form-select" name="status">
            ${MEMBER_STATUSES.map(s => `<option value="${s}" ${member.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">ร่วมทำธุรกิจกับสหกรณ์</label>
        <div class="toggle-wrap">
          <input type="checkbox" class="toggle" name="participateInBusiness" id="memberBusinessToggle"
                 ${member.participateInBusiness ? 'checked' : ''}>
          <span class="toggle-label" id="businessToggleLabel">${member.participateInBusiness ? 'ร่วมทำธุรกิจ' : 'ไม่ร่วมทำธุรกิจ'}</span>
        </div>
      </div>

      <div class="form-group" id="businessTypesGroup" style="${member.participateInBusiness ? '' : 'display:none;'}">
        <label class="form-label">ประเภทธุรกิจที่ร่วม</label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${BUSINESS_TYPES.map(bt => `
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.875rem;color:var(--text-secondary);">
              <input type="checkbox" name="businessTypes" value="${bt}"
                     ${existingBusinessTypes.includes(bt) ? 'checked' : ''}
                     style="accent-color:var(--accent);width:16px;height:16px;">
              ${bt}
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">
          <span class="material-symbols-rounded">${isEdit ? 'save' : 'person_add'}</span>
          ${isEdit ? 'บันทึก' : 'เพิ่มสมาชิก'}
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่', html);

  // Toggle business types visibility
  const toggle = document.getElementById('memberBusinessToggle');
  const typesGroup = document.getElementById('businessTypesGroup');
  const toggleLabel = document.getElementById('businessToggleLabel');

  toggle.addEventListener('change', () => {
    typesGroup.style.display = toggle.checked ? '' : 'none';
    toggleLabel.textContent = toggle.checked ? 'ร่วมทำธุรกิจ' : 'ไม่ร่วมทำธุรกิจ';
  });
}

/**
 * Handle member form submission.
 */
async function handleMemberSubmit(event, orgId, memberId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const businessTypesChecked = formData.getAll('businessTypes');

  const data = {
    orgId: orgId,
    memberCode: formData.get('memberCode'),
    name: formData.get('name'),
    idCard: formData.get('idCard'),
    phone: formData.get('phone'),
    joinDate: formData.get('joinDate'),
    status: formData.get('status'),
    participateInBusiness: !!formData.get('participateInBusiness'),
    businessTypes: businessTypesChecked.join(','),
  };

  try {
    showLoading();
    let res;
    if (memberId) {
      data.id = memberId;
      res = await Api.updateMember(data);
    } else {
      res = await Api.createMember(data);
    }
    hideLoading();

    if (res.success) {
      closeModal();
      showToast(memberId ? 'แก้ไขสมาชิกสำเร็จ' : 'เพิ่มสมาชิกสำเร็จ', 'success');
      // Refresh the appropriate view
      if (document.getElementById('memberOrgSelect')) {
        await loadMemberView();
      } else {
        // We're in org detail view
        await viewOrganization(orgId);
      }
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * Delete a member.
 */
async function deleteMember(memberId, memberName) {
  const confirmed = await showConfirm('ยืนยันการลบ', `คุณต้องการลบสมาชิก "${memberName}" หรือไม่?`);
  if (!confirmed) return;

  try {
    showLoading();
    const res = await Api.deleteMember(memberId);
    hideLoading();

    if (res.success) {
      showToast('ลบสมาชิกสำเร็จ', 'success');
      await loadMemberView();
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}
