/**
 * Utility functions for the cooperative management system.
 * Provides UUID generation, formatting, DOM helpers, toast, confirm, loading.
 */

// ============================================================
// UUID / ID Generation
// ============================================================

/**
 * Generate a short unique ID (12 chars).
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================================
// Date & Number Formatting
// ============================================================

/**
 * Format a date string to Thai locale (d/m/yyyy).
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a date string to ISO format (yyyy-mm-dd) for input[type=date].
 * @param {string|Date} dateStr
 * @returns {string}
 */
function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format number with Thai locale (commas).
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('th-TH');
}

/**
 * Format number as currency (Thai Baht).
 * @param {number} num
 * @returns {string}
 */
function formatCurrency(num) {
  if (num == null || isNaN(num)) return '฿0';
  return '฿' + Number(num).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================
// Debounce
// ============================================================

/**
 * Debounce function calls.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================
// DOM Helpers
// ============================================================

/**
 * Shorthand for querySelector.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element|null}
 */
function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Shorthand for querySelectorAll as Array.
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element[]}
 */
function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Safely set innerHTML of an element by id.
 * @param {string} id
 * @param {string} html
 */
function setContent(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ============================================================
// Toast Notifications
// ============================================================

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration - ms
 */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="material-symbols-rounded toast-icon">${iconMap[type]}</span>
    <div class="toast-content">
      <span class="toast-message">${message}</span>
    </div>
    <span class="material-symbols-rounded toast-dismiss" onclick="this.closest('.toast').remove()">close</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ============================================================
// Confirm Dialog
// ============================================================

/**
 * Show a confirm dialog. Returns a promise that resolves true/false.
 * @param {string} title
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmOverlay');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.classList.add('active');

    const cleanup = () => {
      overlay.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// ============================================================
// Loading Overlay
// ============================================================

/**
 * Show the loading overlay.
 */
function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.add('active');
}

/**
 * Hide the loading overlay.
 */
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.remove('active');
}

// ============================================================
// Modal
// ============================================================

/**
 * Open the modal with given title and body HTML.
 * @param {string} title
 * @param {string} bodyHtml
 */
function openModal(title, bodyHtml) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  overlay.classList.add('active');
}

/**
 * Close the modal.
 */
function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
}

// ============================================================
// Escape HTML
// ============================================================

/**
 * Escape HTML special characters for safe rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

// ============================================================
// Status Badge Helper
// ============================================================

/**
 * Get badge class by status.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadgeClass(status) {
  const map = {
    'ดำเนินการ': 'badge-green',
    'ปกติ': 'badge-green',
    'เลิก': 'badge-red',
    'ลาออก': 'badge-amber',
    'ชำระบัญชี': 'badge-amber',
    'ถูกให้ออก': 'badge-red',
  };
  return map[status] || 'badge-gray';
}

/**
 * Get color class for org type.
 * @param {string} type
 * @returns {string}
 */
function getTypeColor(type) {
  const map = {
    'สหกรณ์การเกษตร': 'green',
    'สหกรณ์ประมง': 'cyan',
    'สหกรณ์นิคม': 'amber',
    'สหกรณ์ร้านค้า': 'purple',
    'สหกรณ์บริการ': 'blue',
    'สหกรณ์ออมทรัพย์': 'indigo',
    'สหกรณ์เครดิตยูเนียน': 'rose',
    'กลุ่มเกษตรกร': 'green',
    'กลุ่มเกษตรกรทำนา': 'green',
    'กลุ่มเกษตรกรทำสวน': 'green',
    'กลุ่มเกษตรกรทำไร่': 'green',
    'กลุ่มเกษตรกรเลี้ยงสัตว์': 'green',
    'กลุ่มเกษตรกรทำประมง': 'green',
  };
  return map[type] || 'blue';
}

/**
 * Create skeleton table rows HTML.
 * @param {number} cols - Number of columns.
 * @param {number} rows - Number of rows.
 * @returns {string}
 */
function createSkeletonTableRows(cols, rows = 5) {
  return Array(rows).fill(0).map(() => `
    <tr>
      ${Array(cols).fill(0).map(() => `
        <td><div class="skeleton skeleton-text"></div></td>
      `).join('')}
    </tr>
  `).join('');
}
