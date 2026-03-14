import type { Product, Receipt, Delivery, Transfer, MoveRecord, Warehouse, Location, UserProfile, LineItem, Status } from './types';

const products: Product[] = [
  { id: 1, name: 'Steel Rods', sku: 'SR-001', category: 'Raw Material', uom: 'kg', onHand: 247, reserved: 20, reorderPoint: 50, location: 'Main Store', status: 'active' },
  { id: 2, name: 'Industrial Bolts M12', sku: 'IB-012', category: 'Hardware', uom: 'pcs', onHand: 12, reserved: 0, reorderPoint: 20, location: 'Rack A2', status: 'active' },
  { id: 3, name: 'Aluminum Sheet 2mm', sku: 'AL-002', category: 'Raw Material', uom: 'pcs', onHand: 80, reserved: 10, reorderPoint: 30, location: 'Main Store', status: 'active' },
  { id: 4, name: 'Plastic Casing Type-B', sku: 'PC-B01', category: 'Components', uom: 'pcs', onHand: 0, reserved: 0, reorderPoint: 15, location: 'Rack C1', status: 'active' },
  { id: 5, name: 'Copper Wire 10m', sku: 'CW-010', category: 'Raw Material', uom: 'rolls', onHand: 55, reserved: 5, reorderPoint: 10, location: 'Main Store', status: 'active' },
];

const receipts: Receipt[] = [
  { id: 1, reference: 'WH/IN/00001', supplier: 'Tata Steel Ltd', scheduledDate: '2026-03-10', status: 'confirmed', lines: [
    { id: 1, productId: 1, productName: 'Steel Rods', demand: 100, done: 0, uom: 'kg' },
    { id: 2, productId: 5, productName: 'Copper Wire 10m', demand: 20, done: 0, uom: 'rolls' },
  ]},
  { id: 2, reference: 'WH/IN/00002', supplier: 'Bharat Hardware', scheduledDate: '2026-03-15', status: 'draft', lines: [
    { id: 3, productId: 2, productName: 'Industrial Bolts M12', demand: 500, done: 0, uom: 'pcs' },
  ]},
  { id: 3, reference: 'WH/IN/00003', supplier: 'Plastics India', scheduledDate: '2026-03-08', status: 'done', lines: [
    { id: 4, productId: 4, productName: 'Plastic Casing Type-B', demand: 200, done: 200, uom: 'pcs' },
  ]},
];

const deliveries: Delivery[] = [
  { id: 1, reference: 'WH/OUT/00001', customer: 'Reliance Infra', scheduledDate: '2026-03-12', status: 'confirmed', lines: [
    { id: 1, productId: 1, productName: 'Steel Rods', demand: 50, done: 0, uom: 'kg' },
  ]},
  { id: 2, reference: 'WH/OUT/00002', customer: 'L&T Engineering', scheduledDate: '2026-03-18', status: 'draft', lines: [
    { id: 2, productId: 3, productName: 'Aluminum Sheet 2mm', demand: 30, done: 0, uom: 'pcs' },
    { id: 3, productId: 5, productName: 'Copper Wire 10m', demand: 10, done: 0, uom: 'rolls' },
  ]},
  { id: 3, reference: 'WH/OUT/00003', customer: 'Bosch India', scheduledDate: '2026-03-05', status: 'done', lines: [
    { id: 4, productId: 2, productName: 'Industrial Bolts M12', demand: 100, done: 100, uom: 'pcs' },
  ]},
];

const transfers: Transfer[] = [
  { id: 1, reference: 'WH/TRF/00001', fromLocation: 'Main Store', toLocation: 'Rack C1', scheduledDate: '2026-03-06', status: 'done', lines: [
    { id: 1, productId: 4, productName: 'Plastic Casing Type-B', demand: 50, done: 50, uom: 'pcs' },
  ]},
  { id: 2, reference: 'WH/TRF/00002', fromLocation: 'Main Store', toLocation: 'Production Rack', scheduledDate: '2026-03-11', status: 'confirmed', lines: [
    { id: 2, productId: 1, productName: 'Steel Rods', demand: 30, done: 0, uom: 'kg' },
  ]},
  { id: 3, reference: 'WH/TRF/00003', fromLocation: 'Rack A2', toLocation: 'Main Store', scheduledDate: '2026-03-14', status: 'draft', lines: [
    { id: 3, productId: 2, productName: 'Industrial Bolts M12', demand: 12, done: 0, uom: 'pcs' },
  ]},
];

const moveHistory: MoveRecord[] = [
  { id: 1, date: '2026-03-14T09:30:00', reference: 'WH/TRF/00001', product: 'Plastic Casing Type-B', from: 'Main Store', to: 'Rack C1', qty: 50, type: 'transfer' },
  { id: 2, date: '2026-03-13T14:15:00', reference: 'WH/IN/00003', product: 'Plastic Casing Type-B', from: 'Supplier', to: 'Main Store', qty: 200, type: 'receipt' },
  { id: 3, date: '2026-03-12T11:00:00', reference: 'WH/OUT/00003', product: 'Industrial Bolts M12', from: 'Rack A2', to: 'Customer', qty: -100, type: 'delivery' },
  { id: 4, date: '2026-03-11T08:45:00', reference: 'ADJ/00001', product: 'Steel Rods', from: '-', to: 'Main Store', qty: 10, type: 'adjustment' },
  { id: 5, date: '2026-03-10T16:20:00', reference: 'WH/IN/00001', product: 'Copper Wire 10m', from: 'Supplier', to: 'Main Store', qty: 20, type: 'receipt' },
  { id: 6, date: '2026-03-09T10:30:00', reference: 'WH/OUT/00001', product: 'Steel Rods', from: 'Main Store', to: 'Customer', qty: -50, type: 'delivery' },
];

const warehouses: Warehouse[] = [
  { id: 1, name: 'Main Warehouse', code: 'WH-MAIN', address: 'Plot 12, Industrial Area, Mumbai 400072', locationCount: 3 },
  { id: 2, name: 'Production Floor', code: 'WH-PROD', address: 'Building B, Industrial Area, Mumbai 400072', locationCount: 1 },
];

const locations: Location[] = [
  { id: 1, name: 'Main Store', code: 'LOC-MS', warehouse: 'Main Warehouse', type: 'storage' },
  { id: 2, name: 'Rack A2', code: 'LOC-A2', warehouse: 'Main Warehouse', type: 'storage' },
  { id: 3, name: 'Rack C1', code: 'LOC-C1', warehouse: 'Main Warehouse', type: 'storage' },
  { id: 4, name: 'Production Rack', code: 'LOC-PR', warehouse: 'Production Floor', type: 'production' },
];

const userProfile: UserProfile = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@coreinventory.com',
  role: 'Inventory Manager',
  avatar: 'RK',
  lastLogin: '2026-03-14T08:30:00',
};

// Simulate network delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Products
  getProducts: async (): Promise<Product[]> => { await delay(); return [...products]; },
  createProduct: async (data: Omit<Product, 'id' | 'status'>): Promise<Product> => {
    await delay();
    const p = { ...data, id: products.length + 1, status: 'active' as const };
    products.push(p);
    return p;
  },

  // Receipts
  getReceipts: async (): Promise<Receipt[]> => { await delay(); return [...receipts]; },
  getReceipt: async (id: number): Promise<Receipt | undefined> => { await delay(); return receipts.find(r => r.id === id); },
  updateReceiptStatus: async (id: number, status: Status): Promise<boolean> => {
    await delay();
    const r = receipts.find(r => r.id === id);
    if (r) { r.status = status; return true; }
    return false;
  },

  // Deliveries
  getDeliveries: async (): Promise<Delivery[]> => { await delay(); return [...deliveries]; },
  getDelivery: async (id: number): Promise<Delivery | undefined> => { await delay(); return deliveries.find(d => d.id === id); },
  updateDeliveryStatus: async (id: number, status: Status): Promise<boolean> => {
    await delay();
    const d = deliveries.find(d => d.id === id);
    if (d) { d.status = status; return true; }
    return false;
  },

  // Transfers
  getTransfers: async (): Promise<Transfer[]> => { await delay(); return [...transfers]; },
  getTransfer: async (id: number): Promise<Transfer | undefined> => { await delay(); return transfers.find(t => t.id === id); },
  createTransfer: async (data: { fromLocation: string; toLocation: string; lines: Omit<LineItem, 'id'>[]; scheduledDate: string }): Promise<Transfer> => {
    await delay();
    const t: Transfer = {
      id: transfers.length + 1,
      reference: `WH/TRF/${String(transfers.length + 1).padStart(5, '0')}`,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      scheduledDate: data.scheduledDate,
      status: 'draft',
      lines: data.lines.map((l, i) => ({ ...l, id: i + 1 })),
    };
    transfers.push(t);
    return t;
  },
  updateTransferStatus: async (id: number, status: Status): Promise<boolean> => {
    await delay();
    const t = transfers.find(t => t.id === id);
    if (t) { t.status = status; return true; }
    return false;
  },

  // Move History
  getMoveHistory: async (): Promise<MoveRecord[]> => { await delay(); return [...moveHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); },

  // Inventory Adjustment
  applyAdjustments: async (adjustments: { productId: number; newQty: number }[]): Promise<boolean> => {
    await delay();
    adjustments.forEach(adj => {
      const p = products.find(p => p.id === adj.productId);
      if (p) {
        const delta = adj.newQty - p.onHand;
        moveHistory.unshift({
          id: moveHistory.length + 1,
          date: new Date().toISOString(),
          reference: `ADJ/${String(moveHistory.length + 1).padStart(5, '0')}`,
          product: p.name,
          from: delta > 0 ? '-' : p.location,
          to: delta > 0 ? p.location : '-',
          qty: delta,
          type: 'adjustment',
        });
        p.onHand = adj.newQty;
      }
    });
    return true;
  },

  // Warehouses & Locations
  getWarehouses: async (): Promise<Warehouse[]> => { await delay(); return [...warehouses]; },
  getLocations: async (): Promise<Location[]> => { await delay(); return [...locations]; },

  // Profile
  getProfile: async (): Promise<UserProfile> => { await delay(); return { ...userProfile }; },

  // Auth (mock)
  login: async (_email: string, _password: string): Promise<{ success: boolean }> => { await delay(500); return { success: true }; },
  signup: async (_email: string, _password: string, _name: string): Promise<{ success: boolean }> => { await delay(500); return { success: true }; },
  requestOtp: async (_email: string): Promise<{ success: boolean }> => { await delay(500); return { success: true }; },
  verifyOtp: async (_email: string, _otp: string): Promise<{ success: boolean }> => { await delay(500); return { success: true }; },
};
