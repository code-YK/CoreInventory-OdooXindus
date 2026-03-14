export type Status = 'draft' | 'confirmed' | 'done' | 'cancelled';
export type OperationType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  uom: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  location: string;
  status: 'active' | 'inactive';
}

export interface LineItem {
  id: number;
  productId: number;
  productName: string;
  demand: number;
  done: number;
  uom: string;
}

export interface Receipt {
  id: number;
  reference: string;
  supplier: string;
  scheduledDate: string;
  status: Status;
  lines: LineItem[];
}

export interface Delivery {
  id: number;
  reference: string;
  customer: string;
  scheduledDate: string;
  status: Status;
  lines: LineItem[];
}

export interface Transfer {
  id: number;
  reference: string;
  fromLocation: string;
  toLocation: string;
  scheduledDate: string;
  status: Status;
  lines: LineItem[];
}

export interface MoveRecord {
  id: number;
  date: string;
  reference: string;
  product: string;
  from: string;
  to: string;
  qty: number;
  type: OperationType;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  locationCount: number;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  warehouse: string;
  type: 'storage' | 'production' | 'staging' | 'shipping';
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  lastLogin: string;
}
