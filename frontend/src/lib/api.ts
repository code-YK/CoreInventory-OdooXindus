import type { Product, Receipt, Delivery, Transfer, MoveRecord, Warehouse, Location, UserProfile, LineItem, Status } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Core fetch helper ─────────────────────────────────────────────────────
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Operation mapper ──────────────────────────────────────────────────────
const mapOperationToUI = (op: any): any => ({
  id: op.id,
  reference: op.reference,
  supplier: op.supplier || '',
  customer: op.customer || '',
  fromLocation: op.source_location_name || op.source_location_id || 'Unknown',
  toLocation: op.dest_location_name || op.dest_location_id || 'Unknown',
  scheduledDate: op.created_at,
  status: op.status,
  lines: op.items?.map((i: any) => ({
    id: i.id || crypto.randomUUID(),
    productId: i.product_id,
    productName: i.product_name || 'Unknown',
    demand: i.quantity,
    done: op.status === 'done' ? i.quantity : 0,
    uom: 'pcs',
  })) || [],
});

function paginate<T>(items: T[], page = 1, limit = 20): T[] {
  const start = (Math.max(1, page) - 1) * Math.max(1, limit);
  return items.slice(start, start + Math.max(1, limit));
}

// ─── API ───────────────────────────────────────────────────────────────────
export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('token', res.access_token);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Login failed' };
    }
  },

  signup: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('token', res.access_token);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Signup failed' };
    }
  },

  logout: () => { localStorage.removeItem('token'); },

  resetPassword: async (email: string, newPassword: string): Promise<{ success: boolean }> => {
    try {
      await fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, new_password: newPassword }) });
      return { success: true };
    } catch { return { success: false }; }
  },

  // OTP is not in backend — these are UX stubs that jump to the real reset-password
  requestOtp: async (_email: string): Promise<{ success: boolean }> => ({ success: true }),
  verifyOtp: async (_email: string, _otp: string): Promise<{ success: boolean }> => ({ success: true }),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: async (): Promise<UserProfile> => {
    const res = await fetchApi('/auth/me');
    const name = res.email?.split('@')[0] || 'User';
    const avatar = name.slice(0, 2).toUpperCase();
    return {
      name,
      email: res.email,
      role: res.role || 'Staff',
      avatar,
      lastLogin: new Date().toISOString(),
    };
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardKpis: async () => {
    return fetchApi('/dashboard/kpis');
  },

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts: async (page = 1, limit = 20): Promise<Product[]> => {
    const [products, inventory] = await Promise.all([
      fetchApi('/products'),
      fetchApi('/inventory'),
    ]);
    const data = products.map((p: any) => {
      const inv = inventory.filter((i: any) => i.product_id === p.id);
      const onHand = inv.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
      const reserved = inv.reduce((acc: number, curr: any) => acc + curr.reserved_qty, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category_id || 'Unknown',
        uom: p.unit,
        onHand,
        reserved,
        reorderPoint: p.reorder_level,
        location: inv[0]?.location_name || '—',
        status: p.is_active ? 'active' : 'inactive',
      };
    });
    return paginate(data, page, limit);
  },

  createProduct: async (data: Omit<Product, 'id' | 'status'>): Promise<Product> => {
    const res = await fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify({ name: data.name, sku: data.sku, unit: data.uom, reorder_level: data.reorderPoint || 0 }),
    });
    return { id: res.id, name: res.name, sku: res.sku, category: res.category_id || 'Unknown', uom: res.unit, onHand: 0, reserved: 0, reorderPoint: res.reorder_level, location: '—', status: res.is_active ? 'active' : 'inactive' };
  },

  updateProduct: async (id: string, data: Partial<Pick<Product, 'name' | 'sku' | 'uom' | 'reorderPoint'>>): Promise<boolean> => {
    try {
      await fetchApi(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: data.name, sku: data.sku, unit: data.uom, reorder_level: data.reorderPoint }),
      });
      return true;
    } catch { return false; }
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    try { await fetchApi(`/products/${id}`, { method: 'DELETE' }); return true; }
    catch { return false; }
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  getInventory: async () => fetchApi('/inventory'),

  getLowStockProducts: async () => fetchApi('/inventory/low-stock'),

  // ── Receipts ──────────────────────────────────────────────────────────────
  getReceipts: async (page = 1, limit = 20): Promise<Receipt[]> => {
    const res = await fetchApi('/receipts');
    return paginate(res.map(mapOperationToUI), page, limit);
  },

  getReceipt: async (id: string): Promise<Receipt | undefined> => {
    try { return mapOperationToUI(await fetchApi(`/receipts/${id}`)); }
    catch { return undefined; }
  },

  updateReceiptStatus: async (id: string, status: Status): Promise<boolean> => {
    try {
      if (status === 'confirmed') await fetchApi(`/receipts/${id}/confirm`, { method: 'PUT' });
      else if (status === 'done') await fetchApi(`/receipts/${id}/done`, { method: 'PUT' });
      else if (status === 'cancelled') await fetchApi(`/receipts/${id}/cancel`, { method: 'PUT' });
      return true;
    } catch { return false; }
  },

  // ── Deliveries ────────────────────────────────────────────────────────────
  getDeliveries: async (page = 1, limit = 20): Promise<Delivery[]> => {
    const res = await fetchApi('/deliveries');
    return paginate(res.map(mapOperationToUI), page, limit);
  },

  getDelivery: async (id: string): Promise<Delivery | undefined> => {
    try { return mapOperationToUI(await fetchApi(`/deliveries/${id}`)); }
    catch { return undefined; }
  },

  updateDeliveryStatus: async (id: string, status: Status): Promise<boolean> => {
    try {
      if (status === 'confirmed') await fetchApi(`/deliveries/${id}/confirm`, { method: 'PUT' });
      else if (status === 'done') await fetchApi(`/deliveries/${id}/done`, { method: 'PUT' });
      else if (status === 'cancelled') await fetchApi(`/deliveries/${id}/cancel`, { method: 'PUT' });
      return true;
    } catch { return false; }
  },

  // ── Transfers ─────────────────────────────────────────────────────────────
  getTransfers: async (page = 1, limit = 20): Promise<Transfer[]> => {
    const res = await fetchApi('/transfers');
    return paginate(res.map(mapOperationToUI), page, limit);
  },

  getTransfer: async (id: string): Promise<Transfer | undefined> => {
    try { return mapOperationToUI(await fetchApi(`/transfers/${id}`)); }
    catch { return undefined; }
  },

  createTransfer: async (data: { fromLocation: string; toLocation: string; lines: Omit<LineItem, 'id'>[]; scheduledDate: string }): Promise<Transfer> => {
    const res = await fetchApi('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        source_location_id: data.fromLocation,
        dest_location_id: data.toLocation,
        items: data.lines.map(l => ({ product_id: l.productId, quantity: l.demand })),
      }),
    });
    return mapOperationToUI(res);
  },

  updateTransferStatus: async (id: string, status: Status): Promise<boolean> => {
    try {
      if (status === 'confirmed') await fetchApi(`/transfers/${id}/confirm`, { method: 'PUT' });
      else if (status === 'done') await fetchApi(`/transfers/${id}/done`, { method: 'PUT' });
      else if (status === 'cancelled') await fetchApi(`/transfers/${id}/cancel`, { method: 'PUT' });
      return true;
    } catch { return false; }
  },

  // ── Adjustments ───────────────────────────────────────────────────────────
  applyAdjustments: async (adjustments: { productId: string; newQty: number }[]): Promise<boolean> => {
    try {
      const warehouses = await fetchApi('/warehouses');
      if (!warehouses.length) return false;
      const locs = await fetchApi(`/warehouses/${warehouses[0].id}/locations`);
      if (!locs.length) return false;
      await fetchApi('/adjustments', {
        method: 'POST',
        body: JSON.stringify({
          location_id: locs[0].id,
          items: adjustments.map(a => ({ product_id: a.productId, counted_quantity: a.newQty })),
        }),
      });
      return true;
    } catch { return false; }
  },

  getAdjustments: async (page = 1, limit = 20) => {
    const all = await fetchApi('/adjustments');
    return paginate(all, page, limit);
  },

  confirmAdjustment: async (id: string): Promise<boolean> => {
    try { await fetchApi(`/adjustments/${id}/done`, { method: 'PUT' }); return true; }
    catch { return false; }
  },

  // ── Move History ──────────────────────────────────────────────────────────
  getMoveHistory: async (page = 1, limit = 20): Promise<MoveRecord[]> => {
    const res = await fetchApi('/history');
    return paginate(res.map((h: any) => ({
      id: h.id,
      date: h.created_at,
      reference: h.reference,
      product: h.items?.[0]?.product_name || 'Multiple',
      from: h.source_location_name || '-',
      to: h.dest_location_name || '-',
      qty: h.items?.[0]?.quantity || 0,
      type: h.type as any,
    })), page, limit);
  },

  // ── Warehouses & Locations ────────────────────────────────────────────────
  getWarehouses: async (page = 1, limit = 20): Promise<Warehouse[]> => {
    const res = await fetchApi('/warehouses');
    return paginate(res.map((w: any) => ({
      id: w.id,
      name: w.name,
      code: w.short_code,
      address: w.address || '',
      locationCount: w.location_count || 0,
    })), page, limit);
  },

  createWarehouse: async (data: { name: string; code: string; address?: string }): Promise<Warehouse> => {
    const res = await fetchApi('/warehouses', {
      method: 'POST',
      body: JSON.stringify({ name: data.name, short_code: data.code, address: data.address }),
    });
    return { id: res.id, name: res.name, code: res.short_code, address: res.address || '', locationCount: 0 };
  },

  getLocations: async (page = 1, limit = 20): Promise<Location[]> => {
    const warehouses = await fetchApi('/warehouses');
    const allLocs: Location[] = [];
    for (const w of warehouses) {
      const locs = await fetchApi(`/warehouses/${w.id}/locations`);
      allLocs.push(...locs.map((l: any) => ({
        id: l.id,
        name: l.name,
        code: l.short_code || l.name,
        warehouse: w.name,
        type: 'storage' as const,
      })));
    }
    return paginate(allLocs, page, limit);
  },

  createLocation: async (warehouseId: string, data: { name: string; code: string }): Promise<Location | null> => {
    try {
      const res = await fetchApi(`/warehouses/${warehouseId}/locations`, {
        method: 'POST',
        body: JSON.stringify({ name: data.name, short_code: data.code }),
      });
      return { id: res.id, name: res.name, code: res.short_code, warehouse: warehouseId, type: 'storage' };
    } catch { return null; }
  },

  // ── Categories ────────────────────────────────────────────────────────────
  getCategories: async (page = 1, limit = 20) => {
    const res = await fetchApi('/categories');
    return paginate(res, page, limit);
  },

  createCategory: async (name: string) => {
    return fetchApi('/categories', { method: 'POST', body: JSON.stringify({ name }) });
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    try { await fetchApi(`/categories/${id}`, { method: 'DELETE' }); return true; }
    catch { return false; }
  },
};
