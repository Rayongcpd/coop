/**
 * API Service Layer
 * Handles communication with Google Apps Script backend.
 * Falls back to mock data when APPS_SCRIPT_URL is not configured.
 */

// ============================================================
// Configuration
// ============================================================

/**
 * Google Apps Script Web App URL.
 * Replace with your actual deployed URL after setting up the backend.
 */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwu7kb1E5IlgDghrKwPWuUli6aVvtxxsjqAToDevvZ8z5MNRtMr3tIQON4Db7IeoxFkJw/exec';

/**
 * Check if we're in demo/mock mode.
 */
const IS_DEMO_MODE = !APPS_SCRIPT_URL;

// ============================================================
// Organization Types & Business Types Constants
// ============================================================

const ORG_TYPES = [
  'สหกรณ์การเกษตร',
  'สหกรณ์ประมง',
  'สหกรณ์นิคม',
  'สหกรณ์ร้านค้า',
  'สหกรณ์บริการ',
  'สหกรณ์ออมทรัพย์',
  'สหกรณ์เครดิตยูเนียน',
];

const ORG_CATEGORIES = ['สหกรณ์', 'กลุ่มเกษตรกร'];

const ORG_STATUSES = ['ดำเนินการ', 'เลิก', 'ชำระบัญชี'];

const MEMBER_STATUSES = ['ปกติ', 'ลาออก', 'ถูกให้ออก'];

const BUSINESS_TYPES = [
  'รับฝากเงิน',
  'ให้เงินกู้',
  'จัดหาสินค้ามาจำหน่าย',
  'รวบรวมผลผลิต',
  'แปรรูปผลผลิต',
  'ให้บริการ/สวัสดิการ',
];

const PROVINCES = [
  'เชียงใหม่', 'เชียงราย', 'ลำพูน', 'ลำปาง', 'แพร่', 'น่าน',
  'พะเยา', 'แม่ฮ่องสอน', 'กรุงเทพมหานคร', 'นครราชสีมา',
  'ขอนแก่น', 'อุดรธานี', 'เพชรบุรี', 'สุราษฎร์ธานี',
];

// ============================================================
// Admin Authentication
// ============================================================

const DEMO_ADMIN_PASSWORD = 'admin1234';
let isAdminLoggedIn = false;

// Restore session on load
if (sessionStorage.getItem('coopAdmin') === 'true') {
  isAdminLoggedIn = true;
}

/**
 * Check if current user is admin.
 * @returns {boolean}
 */
function isAdmin() {
  return isAdminLoggedIn;
}

/**
 * Set admin login state.
 * @param {boolean} state
 */
function setAdminState(state) {
  isAdminLoggedIn = state;
  if (state) {
    sessionStorage.setItem('coopAdmin', 'true');
  } else {
    sessionStorage.removeItem('coopAdmin');
  }
}

// ============================================================
// Mock Data
// ============================================================

const MOCK_ORGANIZATIONS = [
  {
    id: 'org001', name: 'สหกรณ์การเกษตรเมืองเชียงใหม่ จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'เมือง', address: '123 ถ.เชียงใหม่-ลำพูน',
    phone: '053-123456', registrationDate: '2010-05-15', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org002', name: 'สหกรณ์ออมทรัพย์ครูเชียงใหม่ จำกัด',
    type: 'สหกรณ์ออมทรัพย์', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'เมือง', address: '45 ถ.ห้วยแก้ว',
    phone: '053-234567', registrationDate: '2005-03-20', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org003', name: 'สหกรณ์การเกษตรแม่แจ่ม จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'แม่แจ่ม', address: '88 ม.3 ต.ช่างเคิ่ง',
    phone: '053-345678', registrationDate: '2012-08-10', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org004', name: 'สหกรณ์ประมงแม่น้ำปิง จำกัด',
    type: 'สหกรณ์ประมง', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'สันป่าตอง', address: '56 ม.5 ต.ยุหว่า',
    phone: '053-456789', registrationDate: '2015-01-25', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org005', name: 'สหกรณ์นิคมแม่ริม จำกัด',
    type: 'สหกรณ์นิคม', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'แม่ริม', address: '12 ม.1 ต.แม่สา',
    phone: '053-567890', registrationDate: '2008-11-30', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org006', name: 'สหกรณ์ร้านค้าชุมชนดอยสะเก็ด จำกัด',
    type: 'สหกรณ์ร้านค้า', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'ดอยสะเก็ด', address: '78 ม.2 ต.เชิงดอย',
    phone: '053-678901', registrationDate: '2018-04-12', status: 'เลิก',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org007', name: 'สหกรณ์บริการเดินรถเชียงใหม่ จำกัด',
    type: 'สหกรณ์บริการ', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'เมือง', address: '200 ถ.คชสาร',
    phone: '053-789012', registrationDate: '2011-07-07', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org008', name: 'สหกรณ์เครดิตยูเนียนสันกำแพง จำกัด',
    type: 'สหกรณ์เครดิตยูเนียน', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'สันกำแพง', address: '33 ม.4 ต.สันกำแพง',
    phone: '053-890123', registrationDate: '2014-09-18', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org009', name: 'กลุ่มเกษตรกรทำนาบ้านแม่ออน',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'เชียงใหม่', district: 'แม่ออน', address: '15 ม.6 ต.ออนเหนือ',
    phone: '053-901234', registrationDate: '2016-02-28', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org010', name: 'กลุ่มเกษตรกรทำสวนลำพูน',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'ลำพูน', district: 'เมือง', address: '67 ม.8 ต.ป่าสัก',
    phone: '053-012345', registrationDate: '2017-06-15', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org011', name: 'กลุ่มเกษตรกรทำไร่ฝาง',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'เชียงใหม่', district: 'ฝาง', address: '99 ม.1 ต.แม่สูน',
    phone: '053-112233', registrationDate: '2019-10-05', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org012', name: 'กลุ่มเกษตรกรเลี้ยงสัตว์แม่วาง',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'เชียงใหม่', district: 'แม่วาง', address: '44 ม.3 ต.แม่วิน',
    phone: '053-223344', registrationDate: '2020-03-22', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org013', name: 'สหกรณ์การเกษตรสันทราย จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'เชียงใหม่', district: 'สันทราย', address: '101 ม.2 ต.หนองหาร',
    phone: '053-334455', registrationDate: '2009-12-01', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
  {
    id: 'org014', name: 'สหกรณ์ออมทรัพย์สาธารณสุขเชียงราย จำกัด',
    type: 'สหกรณ์ออมทรัพย์', category: 'สหกรณ์',
    province: 'เชียงราย', district: 'เมือง', address: '55 ถ.สิงหไคล',
    phone: '053-445566', registrationDate: '2007-05-10', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
  },
];

const MOCK_MEMBERS = [
  // org001 members
  { id: 'm001', orgId: 'org001', memberCode: 'AGR-001', name: 'สมชาย ใจดี', idCard: '5xxxx', phone: '081-1234567', joinDate: '2011-01-15', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต,จัดหาสินค้ามาจำหน่าย' },
  { id: 'm002', orgId: 'org001', memberCode: 'AGR-002', name: 'สมหญิง แสนดี', idCard: '5xxxx', phone: '081-2345678', joinDate: '2011-03-20', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm003', orgId: 'org001', memberCode: 'AGR-003', name: 'ประเสริฐ มั่นคง', idCard: '5xxxx', phone: '081-3456789', joinDate: '2012-05-10', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },
  { id: 'm004', orgId: 'org001', memberCode: 'AGR-004', name: 'วิภา ชัยชนะ', idCard: '5xxxx', phone: '081-4567890', joinDate: '2013-07-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'จัดหาสินค้ามาจำหน่าย' },
  { id: 'm005', orgId: 'org001', memberCode: 'AGR-005', name: 'อนุชา สกุลดี', idCard: '5xxxx', phone: '081-5678901', joinDate: '2014-01-20', status: 'ลาออก', participateInBusiness: false, businessTypes: '' },

  // org002 members
  { id: 'm006', orgId: 'org002', memberCode: 'SAV-001', name: 'สุวิทย์ รักเรียน', idCard: '5xxxx', phone: '082-1111111', joinDate: '2006-01-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รับฝากเงิน,ให้เงินกู้' },
  { id: 'm007', orgId: 'org002', memberCode: 'SAV-002', name: 'มาลี ครูดี', idCard: '5xxxx', phone: '082-2222222', joinDate: '2006-03-15', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รับฝากเงิน' },
  { id: 'm008', orgId: 'org002', memberCode: 'SAV-003', name: 'ประวิทย์ จันทร์งาม', idCard: '5xxxx', phone: '082-3333333', joinDate: '2007-06-10', status: 'ปกติ', participateInBusiness: true, businessTypes: 'ให้เงินกู้' },
  { id: 'm009', orgId: 'org002', memberCode: 'SAV-004', name: 'นฤมล ขยันดี', idCard: '5xxxx', phone: '082-4444444', joinDate: '2008-01-20', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },
  { id: 'm010', orgId: 'org002', memberCode: 'SAV-005', name: 'ชาญชัย ปัญญาเลิศ', idCard: '5xxxx', phone: '082-5555555', joinDate: '2009-09-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รับฝากเงิน,ให้เงินกู้' },
  { id: 'm011', orgId: 'org002', memberCode: 'SAV-006', name: 'วรรณา สุขสบาย', idCard: '5xxxx', phone: '082-6666666', joinDate: '2010-02-14', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รับฝากเงิน' },
  { id: 'm012', orgId: 'org002', memberCode: 'SAV-007', name: 'ธีระ สันติภาพ', idCard: '5xxxx', phone: '082-7777777', joinDate: '2011-05-05', status: 'ลาออก', participateInBusiness: false, businessTypes: '' },

  // org003 members
  { id: 'm013', orgId: 'org003', memberCode: 'MJ-001', name: 'บุญมี ดอยแจ่ม', idCard: '5xxxx', phone: '083-1111000', joinDate: '2013-01-15', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต,แปรรูปผลผลิต' },
  { id: 'm014', orgId: 'org003', memberCode: 'MJ-002', name: 'ดาวเรือง ไร่นา', idCard: '5xxxx', phone: '083-2222000', joinDate: '2013-03-20', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm015', orgId: 'org003', memberCode: 'MJ-003', name: 'สมศักดิ์ เกษตรทอง', idCard: '5xxxx', phone: '083-3333000', joinDate: '2014-06-10', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },

  // org004 members
  { id: 'm016', orgId: 'org004', memberCode: 'FSH-001', name: 'ทองดี ปลาทอง', idCard: '5xxxx', phone: '084-1111000', joinDate: '2015-06-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm017', orgId: 'org004', memberCode: 'FSH-002', name: 'มานพ น้ำใส', idCard: '5xxxx', phone: '084-2222000', joinDate: '2016-01-15', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },

  // org009 members (farmer group)
  { id: 'm018', orgId: 'org009', memberCode: 'FM-001', name: 'ทวี ทำนา', idCard: '5xxxx', phone: '085-1111000', joinDate: '2016-06-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต,จัดหาสินค้ามาจำหน่าย' },
  { id: 'm019', orgId: 'org009', memberCode: 'FM-002', name: 'แดง รักไร่', idCard: '5xxxx', phone: '085-2222000', joinDate: '2016-08-10', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm020', orgId: 'org009', memberCode: 'FM-003', name: 'หล้า สุขใจ', idCard: '5xxxx', phone: '085-3333000', joinDate: '2017-01-05', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },
  { id: 'm021', orgId: 'org009', memberCode: 'FM-004', name: 'สมบัติ ไร่ทอง', idCard: '5xxxx', phone: '085-4444000', joinDate: '2017-04-20', status: 'ปกติ', participateInBusiness: true, businessTypes: 'แปรรูปผลผลิต' },

  // org010 members
  { id: 'm022', orgId: 'org010', memberCode: 'GD-001', name: 'มะลิ สวนสวย', idCard: '5xxxx', phone: '086-1111000', joinDate: '2018-01-10', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm023', orgId: 'org010', memberCode: 'GD-002', name: 'ลำดวน ผลไม้', idCard: '5xxxx', phone: '086-2222000', joinDate: '2018-05-15', status: 'ปกติ', participateInBusiness: true, businessTypes: 'จัดหาสินค้ามาจำหน่าย,รวบรวมผลผลิต' },
  { id: 'm024', orgId: 'org010', memberCode: 'GD-003', name: 'ชำนาญ ลำไย', idCard: '5xxxx', phone: '086-3333000', joinDate: '2019-02-20', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },

  // org011 members
  { id: 'm025', orgId: 'org011', memberCode: 'FR-001', name: 'สุพจน์ ไร่ข้าวโพด', idCard: '5xxxx', phone: '087-1111000', joinDate: '2020-01-10', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm026', orgId: 'org011', memberCode: 'FR-002', name: 'เกศินี ปลูกผัก', idCard: '5xxxx', phone: '087-2222000', joinDate: '2020-06-01', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },

  // org013 members
  { id: 'm027', orgId: 'org013', memberCode: 'ST-001', name: 'วิชัย สันทราย', idCard: '5xxxx', phone: '088-1111000', joinDate: '2010-03-01', status: 'ปกติ', participateInBusiness: true, businessTypes: 'จัดหาสินค้ามาจำหน่าย,ให้บริการ/สวัสดิการ' },
  { id: 'm028', orgId: 'org013', memberCode: 'ST-002', name: 'ศิริพร หนองหาร', idCard: '5xxxx', phone: '088-2222000', joinDate: '2010-05-15', status: 'ปกติ', participateInBusiness: true, businessTypes: 'รวบรวมผลผลิต' },
  { id: 'm029', orgId: 'org013', memberCode: 'ST-003', name: 'ณัฐพล เมืองเหนือ', idCard: '5xxxx', phone: '088-3333000', joinDate: '2011-01-20', status: 'ปกติ', participateInBusiness: false, businessTypes: '' },
  { id: 'm030', orgId: 'org013', memberCode: 'ST-004', name: 'พิมพ์ใจ ดอกไม้', idCard: '5xxxx', phone: '088-4444000', joinDate: '2012-08-10', status: 'ปกติ', participateInBusiness: true, businessTypes: 'จัดหาสินค้ามาจำหน่าย' },
];

// ============================================================
// In-memory Store (for demo mode)
// ============================================================

let mockOrgs = JSON.parse(JSON.stringify(MOCK_ORGANIZATIONS));
let mockMembers = JSON.parse(JSON.stringify(MOCK_MEMBERS));

// ============================================================
// API Request Helper
// ============================================================

/**
 * Make a GET request to the Apps Script API.
 * @param {string} action
 * @param {Object} params
 * @returns {Promise<any>}
 */
async function apiGet(action, params = {}) {
  if (IS_DEMO_MODE) {
    return handleMockGet(action, params);
  }

  const queryStr = new URLSearchParams({ action, ...params }).toString();
  const url = `${APPS_SCRIPT_URL}?${queryStr}`;

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API GET error:', err);
    throw err;
  }
}

/**
 * Make a POST request to the Apps Script API.
 * Uses text/plain content-type to avoid CORS preflight.
 * @param {string} action
 * @param {Object} data
 * @returns {Promise<any>}
 */
async function apiPost(action, data = {}) {
  if (IS_DEMO_MODE) {
    return handleMockPost(action, data);
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...data }),
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API POST error:', err);
    throw err;
  }
}

// ============================================================
// Mock Handlers (Demo Mode)
// ============================================================

function handleMockGet(action, params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'getOrganizations': {
          let result = [...mockOrgs];
          if (params.category) result = result.filter(o => o.category === params.category);
          if (params.type) result = result.filter(o => o.type === params.type);
          if (params.search) {
            const s = params.search.toLowerCase();
            result = result.filter(o =>
              o.name.toLowerCase().includes(s) ||
              o.province.toLowerCase().includes(s)
            );
          }
          resolve({ success: true, data: result });
          break;
        }
        case 'getOrganization': {
          const org = mockOrgs.find(o => o.id === params.id);
          resolve({ success: !!org, data: org || null });
          break;
        }
        case 'getMembers': {
          let result = [...mockMembers];
          if (params.orgId) result = result.filter(m => m.orgId === params.orgId);
          if (params.search) {
            const s = params.search.toLowerCase();
            result = result.filter(m =>
              m.name.toLowerCase().includes(s) ||
              m.memberCode.toLowerCase().includes(s)
            );
          }
          resolve({ success: true, data: result });
          break;
        }
        case 'getMember': {
          const member = mockMembers.find(m => m.id === params.id);
          resolve({ success: !!member, data: member || null });
          break;
        }
        case 'getDashboard': {
          const totalOrgs = mockOrgs.filter(o => o.category === 'สหกรณ์').length;
          const totalFarmerGroups = mockOrgs.filter(o => o.category === 'กลุ่มเกษตรกร').length;
          const totalMembers = mockMembers.length;
          const activeMembers = mockMembers.filter(m => m.status === 'ปกติ').length;
          const businessMembers = mockMembers.filter(m => m.participateInBusiness).length;

          // Count by type
          const byType = {};
          ORG_TYPES.forEach(t => byType[t] = 0);
          mockOrgs.filter(o => o.category === 'สหกรณ์').forEach(o => {
            byType[o.type] = (byType[o.type] || 0) + 1;
          });

          // Members per org category
          const coopMemberCount = mockMembers.filter(m => {
            const org = mockOrgs.find(o => o.id === m.orgId);
            return org && org.category === 'สหกรณ์';
          }).length;

          const farmerMemberCount = mockMembers.filter(m => {
            const org = mockOrgs.find(o => o.id === m.orgId);
            return org && org.category === 'กลุ่มเกษตรกร';
          }).length;

          // Business type breakdown
          const businessByType = {};
          BUSINESS_TYPES.forEach(t => businessByType[t] = 0);
          mockMembers.filter(m => m.participateInBusiness && m.businessTypes).forEach(m => {
            m.businessTypes.split(',').forEach(bt => {
              const trim = bt.trim();
              if (businessByType[trim] !== undefined) businessByType[trim]++;
            });
          });

          resolve({
            success: true,
            data: {
              totalOrgs,
              totalFarmerGroups,
              totalMembers,
              activeMembers,
              businessMembers,
              byType,
              coopMemberCount,
              farmerMemberCount,
              businessByType,
              activeOrgs: mockOrgs.filter(o => o.status === 'ดำเนินการ').length,
            },
          });
          break;
        }
        default:
          resolve({ success: false, error: 'Unknown action' });
      }
    }, 300); // simulate network delay
  });
}

function handleMockPost(action, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      switch (action) {
        case 'createOrganization': {
          const newOrg = { ...data, id: generateId(), createdAt: now, updatedAt: now };
          mockOrgs.push(newOrg);
          resolve({ success: true, data: newOrg });
          break;
        }
        case 'updateOrganization': {
          const idx = mockOrgs.findIndex(o => o.id === data.id);
          if (idx === -1) { resolve({ success: false, error: 'Not found' }); break; }
          mockOrgs[idx] = { ...mockOrgs[idx], ...data, updatedAt: now };
          resolve({ success: true, data: mockOrgs[idx] });
          break;
        }
        case 'deleteOrganization': {
          const i = mockOrgs.findIndex(o => o.id === data.id);
          if (i === -1) { resolve({ success: false, error: 'Not found' }); break; }
          mockOrgs.splice(i, 1);
          mockMembers = mockMembers.filter(m => m.orgId !== data.id);
          resolve({ success: true });
          break;
        }
        case 'createMember': {
          const newMember = { ...data, id: generateId(), createdAt: now, updatedAt: now };
          mockMembers.push(newMember);
          resolve({ success: true, data: newMember });
          break;
        }
        case 'updateMember': {
          const mi = mockMembers.findIndex(m => m.id === data.id);
          if (mi === -1) { resolve({ success: false, error: 'Not found' }); break; }
          mockMembers[mi] = { ...mockMembers[mi], ...data, updatedAt: now };
          resolve({ success: true, data: mockMembers[mi] });
          break;
        }
        case 'deleteMember': {
          const mdi = mockMembers.findIndex(m => m.id === data.id);
          if (mdi === -1) { resolve({ success: false, error: 'Not found' }); break; }
          mockMembers.splice(mdi, 1);
          resolve({ success: true });
          break;
        }
        case 'verifyAdmin': {
          if (data.password === DEMO_ADMIN_PASSWORD) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' });
          }
          break;
        }
        default:
          resolve({ success: false, error: 'Unknown action' });
      }
    }, 200);
  });
}

// ============================================================
// Public API Methods
// ============================================================

const Api = {
  // Organizations
  getOrganizations: (params = {}) => apiGet('getOrganizations', params),
  getOrganization: (id) => apiGet('getOrganization', { id }),
  createOrganization: (data) => apiPost('createOrganization', data),
  createOrganizationsBatch: (organizations) => apiPost('createOrganizationsBatch', { organizations }),
  updateOrganization: (data) => apiPost('updateOrganization', data),
  deleteOrganization: (id) => apiPost('deleteOrganization', { id }),

  // Members
  getMembers: (params = {}) => apiGet('getMembers', params),
  getMember: (id) => apiGet('getMember', { id }),
  createMember: (data) => apiPost('createMember', data),
  updateMember: (data) => apiPost('updateMember', data),
  deleteMember: (id) => apiPost('deleteMember', { id }),

  // Dashboard
  getDashboard: () => apiGet('getDashboard'),

  // Admin
  verifyAdmin: (password) => apiPost('verifyAdmin', { password }),
};
