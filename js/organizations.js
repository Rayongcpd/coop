/**
 * Organizations Page Module.
 * CRUD operations for สหกรณ์ and กลุ่มเกษตรกร.
 */

// Current filter state
let orgFilters = {
  search: '',
  category: '',
  type: '',
};

/**
 * Render the organizations page (list view).
 */
async function renderOrganizations() {
  const content = document.getElementById('pageContent');

  content.innerHTML = `
    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-inline">
        <span class="material-symbols-rounded">search</span>
        <input type="text" class="form-input" placeholder="ค้นหาชื่อสหกรณ์/กลุ่มเกษตรกร..."
               id="orgSearchInput" value="${escapeHtml(orgFilters.search)}">
      </div>
      <select class="form-select" id="orgCategoryFilter">
        <option value="">ทุกหมวดหมู่</option>
        ${ORG_CATEGORIES.map(c => `<option value="${c}" ${orgFilters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <select class="form-select" id="orgTypeFilter">
        <option value="">ทุกประเภท</option>
        ${ORG_TYPES.map(t => `<option value="${t}" ${orgFilters.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      ${isAdmin() ? `
      <button class="btn btn-secondary" onclick="showImportForm()" id="importOrgBtn">
        <span class="material-symbols-rounded">upload_file</span>
        นำเข้าข้อมูล
      </button>
      <button class="btn btn-primary" onclick="showOrgForm()" id="addOrgBtn">
        <span class="material-symbols-rounded">add</span>
        เพิ่มองค์กร
      </button>` : ''}
    </div>

    <!-- Table -->
    <div class="table-wrapper animate-in">
      <div class="table-header">
        <div class="table-header-left">
          <div class="table-title">
            <span class="material-symbols-rounded">apartment</span>
            รายชื่อสหกรณ์/กลุ่มเกษตรกร
          </div>
          <span class="table-count" id="orgCount">-</span>
        </div>
      </div>
      <div class="table-scroll">
        <table class="org-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ประเภท</th>
              <th>หมวดหมู่</th>
              <th>จังหวัด</th>
              <th>สถานะ</th>
              <th>สมาชิก</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody id="orgTableBody">
            <tr><td colspan="7" class="text-center text-muted" style="padding:40px;">กำลังโหลด...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach filter event listeners
  const searchInput = document.getElementById('orgSearchInput');
  const categorySelect = document.getElementById('orgCategoryFilter');
  const typeSelect = document.getElementById('orgTypeFilter');

  searchInput.addEventListener('input', debounce((e) => {
    orgFilters.search = e.target.value;
    loadOrgTable();
  }, 300));

  categorySelect.addEventListener('change', (e) => {
    orgFilters.category = e.target.value;
    loadOrgTable();
  });

  typeSelect.addEventListener('change', (e) => {
    orgFilters.type = e.target.value;
    loadOrgTable();
  });

  await loadOrgTable();
}

/**
 * Load and render the organization table data.
 */
async function loadOrgTable() {
  const tbody = document.getElementById('orgTableBody');
  const countEl = document.getElementById('orgCount');

  try {
    const res = await Api.getOrganizations({
      search: orgFilters.search,
      category: orgFilters.category,
      type: orgFilters.type,
    });

    if (!res.success) throw new Error('Failed');

    const orgs = res.data;
    countEl.textContent = `${orgs.length} รายการ`;

    if (orgs.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="table-empty">
            <span class="material-symbols-rounded">search_off</span>
            <p>ไม่พบข้อมูล</p>
          </div>
        </td></tr>
      `;
      return;
    }

    // Get member counts for each org
    const memberRes = await Api.getMembers({});
    const allMembers = memberRes.success ? memberRes.data : [];

    tbody.innerHTML = orgs.map(org => {
      const memberCount = allMembers.filter(m => m.orgId === org.id).length;
      const color = getTypeColor(org.type);
      return `
        <tr>
          <td>
            <div style="font-weight:600;">${escapeHtml(org.name)}</div>
          </td>
          <td><span class="badge badge-${color}">${escapeHtml(org.category === 'กลุ่มเกษตรกร' ? 'กลุ่มเกษตรกร' : org.type)}</span></td>
          <td>${escapeHtml(org.category)}</td>
          <td>${escapeHtml(org.province)}</td>
          <td><span class="badge ${getStatusBadgeClass(org.status)}">${escapeHtml(org.status)}</span></td>
          <td><span class="text-accent" style="font-weight:600;">${memberCount}</span> คน</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon view" title="ดูรายละเอียด" onclick="viewOrganization('${org.id}')">
                <span class="material-symbols-rounded">visibility</span>
              </button>
              ${isAdmin() ? `
              <button class="btn-icon edit" title="แก้ไข" onclick="showOrgForm('${org.id}')">
                <span class="material-symbols-rounded">edit</span>
              </button>
              <button class="btn-icon delete" title="ลบ" onclick="deleteOrganization('${org.id}', '${escapeHtml(org.name)}')">
                <span class="material-symbols-rounded">delete</span>
              </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Load org table error:', err);
    tbody.innerHTML = `
      <tr><td colspan="7" class="text-center text-danger" style="padding:40px;">เกิดข้อผิดพลาด</td></tr>
    `;
  }
}

/**
 * Show organization add/edit form in modal.
 * @param {string} [orgId] - If provided, edit mode.
 */
async function showOrgForm(orgId) {
  const isEdit = !!orgId;
  let org = {};

  if (isEdit) {
    showLoading();
    const res = await Api.getOrganization(orgId);
    hideLoading();
    if (!res.success || !res.data) {
      showToast('ไม่พบข้อมูลองค์กร', 'error');
      return;
    }
    org = res.data;
  }

  const html = `
    <form id="orgForm" onsubmit="handleOrgSubmit(event, '${orgId || ''}')">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">หมวดหมู่ <span class="required">*</span></label>
          <select class="form-select" name="category" id="orgFormCategory" required>
            <option value="">เลือกหมวดหมู่</option>
            ${ORG_CATEGORIES.map(c => `<option value="${c}" ${org.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="orgTypeGroup">
          <label class="form-label">ประเภท <span class="required">*</span></label>
          <select class="form-select" name="type" id="orgFormType" required>
            <option value="">เลือกประเภท</option>
            ${org.category === 'กลุ่มเกษตรกร'
              ? '<option value="กลุ่มเกษตรกร" selected>กลุ่มเกษตรกร</option>'
              : ORG_TYPES.map(t => `<option value="${t}" ${org.type === t ? 'selected' : ''}>${t}</option>`).join('')
            }
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">ชื่อองค์กร <span class="required">*</span></label>
        <input type="text" class="form-input" name="name" value="${escapeHtml(org.name || '')}" placeholder="เช่น สหกรณ์การเกษตรเมืองระยอง จำกัด" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">จังหวัด</label>
          <input type="text" class="form-input" name="province" value="ระยอง" readonly style="background:var(--bg-secondary);cursor:default;">
        </div>
        <div class="form-group">
          <label class="form-label">อำเภอ</label>
          <input type="text" class="form-input" name="district" value="${escapeHtml(org.district || '')}" placeholder="อำเภอ">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">ที่อยู่</label>
        <textarea class="form-textarea" name="address" placeholder="ที่อยู่">${escapeHtml(org.address || '')}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">เบอร์โทรศัพท์</label>
          <input type="text" class="form-input" name="phone" value="${escapeHtml(org.phone || '')}" placeholder="0xx-xxxxxxx">
        </div>
        <div class="form-group">
          <label class="form-label">วันที่จดทะเบียน</label>
          <input type="date" class="form-input" name="registrationDate" value="${toInputDate(org.registrationDate)}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">สถานะ</label>
        <select class="form-select" name="status">
          ${ORG_STATUSES.map(s => `<option value="${s}" ${org.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">
          <span class="material-symbols-rounded">${isEdit ? 'save' : 'add'}</span>
          ${isEdit ? 'บันทึก' : 'เพิ่ม'}
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? 'แก้ไขข้อมูลองค์กร' : 'เพิ่มองค์กรใหม่', html);

  // Category change handler — toggle type options
  const catSelect = document.getElementById('orgFormCategory');
  const typeSelect = document.getElementById('orgFormType');

  catSelect.addEventListener('change', () => {
    const cat = catSelect.value;
    if (cat === 'กลุ่มเกษตรกร') {
      typeSelect.innerHTML = '<option value="กลุ่มเกษตรกร" selected>กลุ่มเกษตรกร</option>';
    } else {
      typeSelect.innerHTML = `
        <option value="">เลือกประเภท</option>
        ${ORG_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
      `;
    }
  });
}

/**
 * Handle organization form submission.
 */
async function handleOrgSubmit(event, orgId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const data = {
    name: formData.get('name'),
    type: formData.get('type'),
    category: formData.get('category'),
    province: formData.get('province'),
    district: formData.get('district'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    registrationDate: formData.get('registrationDate'),
    status: formData.get('status'),
  };

  try {
    showLoading();
    let res;
    if (orgId) {
      data.id = orgId;
      res = await Api.updateOrganization(data);
    } else {
      res = await Api.createOrganization(data);
    }
    hideLoading();

    if (res.success) {
      closeModal();
      showToast(orgId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มองค์กรสำเร็จ', 'success');
      await loadOrgTable();
    } else {
      showToast('เกิดข้อผิดพลาด: ' + (res.error || 'Unknown'), 'error');
    }
  } catch (err) {
    hideLoading();
    console.error('Org submit error:', err);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * Delete an organization.
 */
async function deleteOrganization(id, name) {
  const confirmed = await showConfirm(
    'ยืนยันการลบ',
    `คุณต้องการลบ "${name}" หรือไม่?\nสมาชิกทั้งหมดขององค์กรนี้จะถูกลบด้วย`
  );

  if (!confirmed) return;

  try {
    showLoading();
    const res = await Api.deleteOrganization(id);
    hideLoading();

    if (res.success) {
      showToast('ลบองค์กรสำเร็จ', 'success');
      await loadOrgTable();
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * View organization detail.
 */
async function viewOrganization(id) {
  const content = document.getElementById('pageContent');
  showLoading();

  try {
    const [orgRes, membersRes] = await Promise.all([
      Api.getOrganization(id),
      Api.getMembers({ orgId: id }),
    ]);
    hideLoading();

    if (!orgRes.success || !orgRes.data) {
      showToast('ไม่พบข้อมูล', 'error');
      return;
    }

    const org = orgRes.data;
    const members = membersRes.success ? membersRes.data : [];
    const activeMembers = members.filter(m => m.status === 'ปกติ');
    const businessMembers = members.filter(m => m.participateInBusiness);
    const color = getTypeColor(org.type);

    content.innerHTML = `
      <button class="back-btn" onclick="renderOrganizations()">
        <span class="material-symbols-rounded">arrow_back</span>
        กลับไปรายชื่อองค์กร
      </button>

      <div class="card animate-in mb-lg">
        <div class="detail-header">
          <div class="detail-icon">
            <span class="material-symbols-rounded">${org.category === 'กลุ่มเกษตรกร' ? 'eco' : 'apartment'}</span>
          </div>
          <div class="detail-info">
            <h3>${escapeHtml(org.name)}</h3>
            <div class="detail-meta">
              <span><span class="material-symbols-rounded">category</span> ${escapeHtml(org.type)}</span>
              <span><span class="material-symbols-rounded">location_on</span> ${escapeHtml(org.province || '-')} ${escapeHtml(org.district || '')}</span>
              <span class="badge ${getStatusBadgeClass(org.status)}">${escapeHtml(org.status)}</span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-field">
            <div class="detail-field-label">หมวดหมู่</div>
            <div class="detail-field-value">${escapeHtml(org.category)}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">เบอร์โทร</div>
            <div class="detail-field-value">${escapeHtml(org.phone || '-')}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">วันจดทะเบียน</div>
            <div class="detail-field-value">${formatDate(org.registrationDate)}</div>
          </div>
          <div class="detail-field">
            <div class="detail-field-label">ที่อยู่</div>
            <div class="detail-field-value">${escapeHtml(org.address || '-')}</div>
          </div>
        </div>
      </div>

      <!-- Member Stats -->
      <div class="stats-grid">
        ${createStatCard('groups', 'สมาชิกทั้งหมด', members.length, `ปกติ ${activeMembers.length} คน`, 'blue', 0)}
        ${createStatCard('handshake', 'ร่วมทำธุรกิจ', businessMembers.length, `${members.length > 0 ? Math.round(businessMembers.length / members.length * 100) : 0}%`, 'green', 1)}
      </div>

      <!-- Members Table -->
      <div class="section-header">
        <div class="section-title">
          <span class="material-symbols-rounded">people</span>
          สมาชิกในองค์กร
        </div>
        ${isAdmin() ? `<button class="btn btn-primary btn-sm" onclick="showMemberForm('${org.id}')">
          <span class="material-symbols-rounded">person_add</span>
          เพิ่มสมาชิก
        </button>` : ''}
      </div>

      <div class="table-wrapper animate-in">
        <div class="table-scroll">
          <table class="members-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เบอร์โทร</th>
                <th>วันเข้าเป็นสมาชิก</th>
                <th>สถานะ</th>
                <th>ร่วมธุรกิจ</th>
                ${isAdmin() ? '<th>จัดการ</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${members.length === 0 ? `
                <tr><td colspan="7">
                  <div class="table-empty">
                    <span class="material-symbols-rounded">person_off</span>
                    <p>ยังไม่มีสมาชิก</p>
                  </div>
                </td></tr>
              ` : members.map(m => `
                <tr>
                  <td><span class="text-accent">${escapeHtml(m.memberCode)}</span></td>
                  <td style="font-weight:500;">${escapeHtml(m.name)}</td>
                  <td>${escapeHtml(m.phone || '-')}</td>
                  <td>${formatDate(m.joinDate)}</td>
                  <td><span class="badge ${getStatusBadgeClass(m.status)}">${escapeHtml(m.status)}</span></td>
                  <td>${m.participateInBusiness
                    ? `<span class="badge badge-green">ร่วม</span>`
                    : `<span class="badge badge-gray">ไม่ร่วม</span>`
                  }</td>
                  ${isAdmin() ? `<td>
                    <div class="action-btns">
                      <button class="btn-icon edit" title="แก้ไข" onclick="showMemberForm('${org.id}', '${m.id}')">
                        <span class="material-symbols-rounded">edit</span>
                      </button>
                      <button class="btn-icon delete" title="ลบ" onclick="deleteMemberFromOrgView('${m.id}', '${escapeHtml(m.name)}', '${org.id}')">
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

  } catch (err) {
    hideLoading();
    console.error('View org error:', err);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * Delete member from organization detail view, then refresh the view.
 */
async function deleteMemberFromOrgView(memberId, memberName, orgId) {
  const confirmed = await showConfirm('ยืนยันการลบ', `คุณต้องการลบสมาชิก "${memberName}" หรือไม่?`);
  if (!confirmed) return;

  try {
    showLoading();
    const res = await Api.deleteMember(memberId);
    hideLoading();
    if (res.success) {
      showToast('ลบสมาชิกสำเร็จ', 'success');
      await viewOrganization(orgId);
    } else {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    hideLoading();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

/**
 * Show bulk import form in modal.
 */
function showImportForm() {
  const html = `
    <div class="mb-md">
      <div class="form-row mb-md">
        <div class="form-group">
          <label class="form-label">หมวดหมู่ <span class="required">*</span></label>
          <select class="form-select" id="importOrgCategory" required>
            ${ORG_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" id="importOrgTypeGroup">
          <label class="form-label">ประเภท <span class="required">*</span></label>
          <select class="form-select" id="importOrgType" required>
            ${ORG_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <p class="text-secondary" style="font-size: 0.875rem; margin-bottom: 12px;">
        กรอกข้อมูลที่ต้องการนำเข้า โดยแยกข้อมูลด้วยช่องว่าง (Tab หรือ Space 2 ช่องขึ้นไป) <br>
        รูปแบบ: <strong>ลำดับที่, ชื่อสหกรณ์, วันจดทะเบียน, สถานะ, ที่อยู่</strong> <br>
      </p>
      <textarea id="importDataTextarea" class="form-textarea" style="min-height: 250px; font-family: monospace; font-size: 0.85rem;" 
                placeholder="ตัวอย่าง:\n1   สหกรณ์การเกษตร A   9 มีนาคม 2527   ดำเนินการ   362 หมู่ที่ 9 ต.หนองบัว อ.บ้านค่าย จ.ระยอง 21120"></textarea>
    </div>
    <div class="form-actions" style="margin-top: 0; padding-top: 16px;">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
      <button type="button" class="btn btn-primary" onclick="handleImportSubmit()">
        <span class="material-symbols-rounded">cloud_upload</span>
        เริ่มนำเข้าข้อมูล
      </button>
    </div>
  `;
  openModal('นำเข้าข้อมูลหลายรายการ', html);

  // Category change handler for import modal
  const catSelect = document.getElementById('importOrgCategory');
  const typeSelect = document.getElementById('importOrgType');
  const typeGroup = document.getElementById('importOrgTypeGroup');

  catSelect.addEventListener('change', () => {
    if (catSelect.value === 'กลุ่มเกษตรกร') {
      typeSelect.innerHTML = '<option value="กลุ่มเกษตรกร">กลุ่มเกษตรกร</option>';
      typeGroup.style.display = 'none';
    } else {
      typeSelect.innerHTML = ORG_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
      typeGroup.style.display = 'block';
    }
  });
}

/**
 * Parse textarea data and send to API.
 */
async function handleImportSubmit() {
  const textarea = document.getElementById('importDataTextarea');
  const category = document.getElementById('importOrgCategory').value;
  const type = document.getElementById('importOrgType').value;
  const text = textarea.value.trim();
  
  if (!text) {
    showToast('กรุณากรอกข้อมูล', 'warning');
    return;
  }

  const lines = text.split('\n');
  const organizations = [];
  let skipped = 0;

  lines.forEach(line => {
    // Split by tabs or 2+ spaces
    const parts = line.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p);
    
    // Minimum 4 parts: (Index), Name, Date, Status, Address (Index is often column 0)
    // Based on user: ลำดับที่ ชื่อสหกรณ์ วันจดทะเบียน สถานะของสหกรณ์ ที่อยู่ (5 columns)
    if (parts.length >= 4) {
      // If first part is a number, it's likely the index. If not, maybe index is missing.
      let name, dateStr, status, address;
      
      if (!isNaN(parts[0]) && parts.length >= 5) {
        // [0: Index, 1: Name, 2: Date, 3: Status, 4: Address]
        name = parts[1];
        dateStr = parts[2];
        status = parts[3];
        address = parts[4];
      } else {
        // [0: Name, 1: Date, 2: Status, 3: Address]
        name = parts[0];
        dateStr = parts[1];
        status = parts[2];
        address = parts[3];
      }

      organizations.push({
        name,
        category,
        type,
        registrationDate: parseThaiDate(dateStr),
        status: status || 'ดำเนินการ',
        address: address || '',
        province: 'ระยอง', // Default
        district: extractDistrict(address || '')
      });
    } else {
      if (line.trim()) skipped++;
    }
  });

  if (organizations.length === 0) {
    showToast('รูปแบบข้อมูลไม่ถูกต้อง หรือไม่มีข้อมูลที่นำเข้าได้', 'error');
    return;
  }

  try {
    showLoading();
    const res = await Api.createOrganizationsBatch(organizations);
    hideLoading();

    if (res.success) {
      closeModal();
      let msg = res.message || `นำเข้าสำเร็จ ${organizations.length} รายการ`;
      if (skipped > 0) msg += ` (ข้าม ${skipped} บรรทัด)`;
      showToast(msg, 'success');
      await loadOrgTable();
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาดในการนำเข้า', 'error');
    }
  } catch (err) {
    hideLoading();
    console.error('Import error:', err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
  }
}

/**
 * Helper: Parse Thai Date string (e.g. "9 มีนาคม 2527") to ISO "YYYY-MM-DD"
 */
function parseThaiDate(dateStr) {
  if (!dateStr) return '';
  
  const monthMap = {
    'มกราคม': '01', 'ม.ค.': '01',
    'กุมภาพันธ์': '02', 'ก.พ.': '02',
    'มีนาคม': '03', 'มี.ค.': '03',
    'เมษายน': '04', 'เม.ย.': '04',
    'พฤษภาคม': '05', 'พ.ค.': '05',
    'มิถุนายน': '06', 'มิ.ย.': '06',
    'กรกฎาคม': '07', 'ก.ค.': '07',
    'สิงหาคม': '08', 'ส.ค.': '08',
    'กันยายน': '09', 'ก.ย.': '09',
    'ตุลาคม': '10', 'ต.ค.': '10',
    'พฤศจิกายน': '11', 'พ.ย.': '11',
    'ธันวาคม': '12', 'ธ.ค.': '12'
  };

  const parts = dateStr.split(/\s+/);
  if (parts.length < 3) return '';

  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]] || '01';
  const yearBE = parseInt(parts[2]);
  if (isNaN(yearBE)) return '';
  const yearAD = yearBE - 543;

  return `${yearAD}-${month}-${day}`;
}

/**
 * Helper: Extract district (อำเภอ) from address string
 */
function extractDistrict(address) {
  if (!address) return '';
  // Match "อ.บ้านค่าย", "อำเภอเมือง", etc.
  const match = address.match(/(?:อำเภอ|อ\.)\s*([^\s,]+)/);
  return match ? match[1] : '';
}
