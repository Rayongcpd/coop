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

const FARMER_GROUP_TYPES = [
  'กลุ่มเกษตรกรทำนา',
  'กลุ่มเกษตรกรทำสวน',
  'กลุ่มเกษตรกรทำไร่',
  'กลุ่มเกษตรกรเลี้ยงสัตว์',
  'กลุ่มเกษตรกรทำประมง',
];

const ORG_CATEGORIES = ['สหกรณ์', 'กลุ่มเกษตรกร'];

const ORG_STATUSES = ['ดำเนินการ', 'เลิก', 'ชำระบัญชี'];

const MEMBER_STATUSES = ['ปกติ', 'ลาออก', 'ถูกให้ออก'];

const BUSINESS_TYPES = [
  'รับฝากเงิน',
  'ให้เงินกู้',
  'จัดหาสินค้ามาจำหน่าย',
  'แปรรูปผลผลิต',
  'รวบรวมผลผลิต',
  'ให้บริการ/สวัสดิการ',
];

const PROVINCES = ['ระยอง'];

// ============================================================
// Admin Authentication
// ============================================================

// const DEMO_ADMIN_PASSWORD = 'asdfasdf'; // REMOVED FOR SECURITY
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
    id: 'org001', name: 'สหกรณ์การเกษตรเมืองระยอง จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '123 ถ.สุขุมวิท',
    phone: '038-123456', registrationDate: '2010-05-15', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org002', name: 'สหกรณ์ออมทรัพย์ระยอง จำกัด',
    type: 'สหกรณ์ออมทรัพย์', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '45 ถ.จันทอุดม',
    phone: '038-234567', registrationDate: '2005-03-20', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org003', name: 'สหกรณ์การเกษตรแกลง จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'ระยอง', district: 'แกลง', address: '88 ม.3 ต.ทางเกวียน',
    phone: '038-345678', registrationDate: '2012-08-10', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org004', name: 'สหกรณ์ประมงปากน้ำระยอง จำกัด',
    type: 'สหกรณ์ประมง', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '56 ม.5 ต.ปากน้ำ',
    phone: '038-456789', registrationDate: '2015-01-25', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org005', name: 'สหกรณ์นิคมบ้านค่าย จำกัด',
    type: 'สหกรณ์นิคม', category: 'สหกรณ์',
    province: 'ระยอง', district: 'บ้านค่าย', address: '12 ม.1 ต.บ้านค่าย',
    phone: '038-567890', registrationDate: '2008-11-30', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 120, activeMembers: 108, businessParticipants: 65,
  },
  {
    id: 'org006', name: 'สหกรณ์ร้านค้าชุมชนมาบตาพุด จำกัด',
    type: 'สหกรณ์ร้านค้า', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '78 ม.2 ต.มาบตาพุด',
    phone: '038-678901', registrationDate: '2018-04-12', status: 'เลิก',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 45, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org007', name: 'สหกรณ์บริการเดินรถระยอง จำกัด',
    type: 'สหกรณ์บริการ', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '200 ถ.ตากสิน',
    phone: '038-789012', registrationDate: '2011-07-07', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 85, activeMembers: 78, businessParticipants: 42,
  },
  {
    id: 'org008', name: 'สหกรณ์เครดิตยูเนียนบ้านเพ จำกัด',
    type: 'สหกรณ์เครดิตยูเนียน', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '33 ม.4 ต.เพ',
    phone: '038-890123', registrationDate: '2014-09-18', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 200, activeMembers: 185, businessParticipants: 150,
  },
  {
    id: 'org009', name: 'กลุ่มเกษตรกรทำนาบ้านฉาง',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'ระยอง', district: 'บ้านฉาง', address: '15 ม.6 ต.บ้านฉาง',
    phone: '038-901234', registrationDate: '2016-02-28', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org010', name: 'กลุ่มเกษตรกรทำสวนวังจันทร์',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'ระยอง', district: 'วังจันทร์', address: '67 ม.8 ต.วังจันทร์',
    phone: '038-012345', registrationDate: '2017-06-15', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org011', name: 'กลุ่มเกษตรกรทำไร่ฝาง',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'ระยอง', district: 'นิคมพัฒนา', address: '99 ม.1 ต.มะขามคู่',
    phone: '038-112233', registrationDate: '2019-10-05', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org012', name: 'กลุ่มเกษตรกรเลี้ยงสัตว์เขาชะเมา',
    type: 'กลุ่มเกษตรกร', category: 'กลุ่มเกษตรกร',
    province: 'ระยอง', district: 'เขาชะเมา', address: '44 ม.3 ต.น้ำเป็น',
    phone: '038-223344', registrationDate: '2020-03-22', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 35, activeMembers: 30, businessParticipants: 18,
  },
  {
    id: 'org013', name: 'สหกรณ์การเกษตรปลวกแดง จำกัด',
    type: 'สหกรณ์การเกษตร', category: 'สหกรณ์',
    province: 'ระยอง', district: 'ปลวกแดง', address: '101 ม.2 ต.ปลวกแดง',
    phone: '038-334455', registrationDate: '2009-12-01', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 0, activeMembers: 0, businessParticipants: 0,
  },
  {
    id: 'org014', name: 'สหกรณ์ออมทรัพย์สาธารณสุขระยอง จำกัด',
    type: 'สหกรณ์ออมทรัพย์', category: 'สหกรณ์',
    province: 'ระยอง', district: 'เมือง', address: '55 ถ.สุขุมวิท',
    phone: '038-445566', registrationDate: '2007-05-10', status: 'ดำเนินการ',
    createdAt: '2024-01-01', updatedAt: '2024-06-01',
    totalMembers: 450, activeMembers: 420, businessParticipants: 380,
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

// Type Summary mock data (ข้อมูลจริงจาก PDF)
let mockTypeSummary = [
  { id: 'ts01', category: 'สหกรณ์', type: 'สหกรณ์การเกษตร', orgCount: 10, memberCount: 32642, businessTotal: 44447, bizDeposit: 15734, bizLoan: 16768, bizSupply: 11615, bizCollect: 21792, bizProcess: 1375, bizService: 648, dataDate: '2569-01-01' },
  { id: 'ts02', category: 'สหกรณ์', type: 'สหกรณ์ประมง', orgCount: 2, memberCount: 1086, businessTotal: 1086, bizDeposit: 1074, bizLoan: 933, bizSupply: 149, bizCollect: 120, bizProcess: 0, bizService: 7, dataDate: '2569-01-01' },
  { id: 'ts03', category: 'สหกรณ์', type: 'สหกรณ์นิคม', orgCount: 4, memberCount: 10778, businessTotal: 10719, bizDeposit: 7360, bizLoan: 2546, bizSupply: 1374, bizCollect: 2438, bizProcess: 0, bizService: 190, dataDate: '2569-01-01' },
  { id: 'ts04', category: 'สหกรณ์', type: 'สหกรณ์ร้านค้า', orgCount: 0, memberCount: 0, businessTotal: 0, bizDeposit: 0, bizLoan: 0, bizSupply: 0, bizCollect: 0, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
  { id: 'ts05', category: 'สหกรณ์', type: 'สหกรณ์บริการ', orgCount: 7, memberCount: 5965, businessTotal: 0, bizDeposit: 0, bizLoan: 0, bizSupply: 0, bizCollect: 0, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
  { id: 'ts06', category: 'สหกรณ์', type: 'สหกรณ์ออมทรัพย์', orgCount: 25, memberCount: 24184, businessTotal: 24184, bizDeposit: 23504, bizLoan: 19724, bizSupply: 20758, bizCollect: 14343, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
  { id: 'ts07', category: 'สหกรณ์', type: 'สหกรณ์เครดิตยูเนียน', orgCount: 11, memberCount: 6216, businessTotal: 6216, bizDeposit: 4836, bizLoan: 852, bizSupply: 3802, bizCollect: 1765, bizProcess: 0, bizService: 48, dataDate: '2569-01-01' },
  { id: 'ts08', category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำนา', orgCount: 4, memberCount: 338, businessTotal: 138, bizDeposit: 0, bizLoan: 0, bizSupply: 67, bizCollect: 29, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
  { id: 'ts09', category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำไร่', orgCount: 12, memberCount: 1321, businessTotal: 1521, bizDeposit: 0, bizLoan: 495, bizSupply: 462, bizCollect: 170, bizProcess: 0, bizService: 24, dataDate: '2569-01-01' },
  { id: 'ts10', category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำสวน', orgCount: 18, memberCount: 2506, businessTotal: 2506, bizDeposit: 0, bizLoan: 242, bizSupply: 857, bizCollect: 275, bizProcess: 0, bizService: 18, dataDate: '2569-01-01' },
  { id: 'ts11', category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรทำประมง', orgCount: 1, memberCount: 52, businessTotal: 52, bizDeposit: 0, bizLoan: 14, bizSupply: 0, bizCollect: 14, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
  { id: 'ts12', category: 'กลุ่มเกษตรกร', type: 'กลุ่มเกษตรกรเลี้ยงสัตว์', orgCount: 1, memberCount: 49, businessTotal: 49, bizDeposit: 0, bizLoan: 0, bizSupply: 0, bizCollect: 0, bizProcess: 0, bizService: 0, dataDate: '2569-01-01' },
];

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
          const hasSummary = mockTypeSummary.length > 0;
          const coopOrgs = mockOrgs.filter(o => o.category === 'สหกรณ์');
          const farmerOrgsD = mockOrgs.filter(o => o.category === 'กลุ่มเกษตรกร');
          const byType = {};
          ORG_TYPES.forEach(t => byType[t] = 0);
          coopOrgs.forEach(o => { byType[o.type] = (byType[o.type] || 0) + 1; });

          const byFarmerGroupType = {};
          FARMER_GROUP_TYPES.forEach(t => byFarmerGroupType[t] = 0);
          farmerOrgsD.forEach(o => { byFarmerGroupType[o.type] = (byFarmerGroupType[o.type] || 0) + 1; });

          let totalMembers = 0, activeMembers = 0, businessMembers = 0;
          let coopMemberCount = 0, farmerMemberCount = 0;
          let coopBusinessCount = 0, farmerBusinessCount = 0;
          const businessByType = {};
          BUSINESS_TYPES.forEach(t => businessByType[t] = 0);

          if (hasSummary) {
            totalOrgs = 0;
            totalFarmerGroups = 0;
            // Reset breakdown to be filled from summary
            Object.keys(byType).forEach(k => byType[k] = 0);
            Object.keys(byFarmerGroupType).forEach(k => byFarmerGroupType[k] = 0);

            mockTypeSummary.forEach(s => {
              const oc = parseInt(s.orgCount) || 0;
              const mc = parseInt(s.memberCount) || 0;
              const bt = parseInt(s.businessTotal) || 0;

              totalMembers += mc;
              businessMembers += bt;

              if (s.category === 'สหกรณ์') {
                totalOrgs += oc;
                coopMemberCount += mc;
                coopBusinessCount += bt;
                if (byType[s.type] !== undefined) byType[s.type] = oc;
              } else {
                totalFarmerGroups += oc;
                farmerMemberCount += mc;
                farmerBusinessCount += bt;
                if (byFarmerGroupType[s.type] !== undefined) byFarmerGroupType[s.type] = oc;
              }

              businessByType['รับฝากเงิน'] += parseInt(s.bizDeposit) || 0;
              businessByType['ให้เงินกู้'] += parseInt(s.bizLoan) || 0;
              businessByType['จัดหาสินค้ามาจำหน่าย'] += parseInt(s.bizSupply) || 0;
              businessByType['แปรรูปผลผลิต'] += parseInt(s.bizProcess) || 0;
              businessByType['รวบรวมผลผลิต'] += parseInt(s.bizCollect) || 0;
              businessByType['ให้บริการ/สวัสดิการ'] += parseInt(s.bizService) || 0;
            });
            activeMembers = totalMembers;
          } else {
            totalMembers = mockMembers.length;
            activeMembers = mockMembers.filter(m => m.status === 'ปกติ').length;
            businessMembers = mockMembers.filter(m => m.participateInBusiness).length;
            const coopOrgIds = new Set(coopOrgs.map(o => o.id));
            coopMemberCount = mockMembers.filter(m => coopOrgIds.has(m.orgId)).length;
            farmerMemberCount = mockMembers.filter(m => !coopOrgIds.has(m.orgId)).length;
            coopBusinessCount = mockMembers.filter(m => coopOrgIds.has(m.orgId) && m.participateInBusiness).length;
            farmerBusinessCount = mockMembers.filter(m => !coopOrgIds.has(m.orgId) && m.participateInBusiness).length;
          }

          resolve({
            success: true,
            data: {
              totalOrgs: coopOrgs.length,
              totalFarmerGroups: farmerOrgsD.length,
              totalMembers, activeMembers, businessMembers,
              byType, byFarmerGroupType, coopMemberCount, farmerMemberCount,
              coopBusinessCount, farmerBusinessCount,
              businessByType,
              activeOrgs: mockOrgs.filter(o => o.status === 'ดำเนินการ').length,
              summaries: hasSummary ? mockTypeSummary : [],
            },
          });
          break;
        }
        case 'getTypeSummary': {
          resolve({ success: true, data: mockTypeSummary });
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
          resolve({ success: false, error: 'ระบบ Login Admin ถูกปิดใช้งานในโหมด Demo เพื่อความปลอดภัย กรุณาตั้งค่า APPS_SCRIPT_URL เพื่อใช้งานระบบจริง' });
          break;
        }
        case 'saveTypeSummary': {
          if (data.rows) mockTypeSummary = data.rows;
          resolve({ success: true, count: mockTypeSummary.length });
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

  // Type Summary
  getTypeSummary: () => apiGet('getTypeSummary'),
  saveTypeSummary: (rows) => apiPost('saveTypeSummary', { rows }),

  // Admin
  verifyAdmin: (password) => apiPost('verifyAdmin', { password }),
};
