// Types mirror the six Google Sheets tabs defined in the EPIMS SRS

export type Colour = 'Black' | 'White';
export type Design = 'Clean' | 'Mebotorong' | 'Neat';
export type Size = 'Small' | 'Medium' | 'Large' | 'X-Large';

export interface InventoryItem {
  productId: string;
  colour: Colour;
  design: Design;
  size: Size;
  quantityAvailable: number;
  reservedQuantity: number;
  minimumStock: number;
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string; // ISO date
}

export type SupplierOrderStatus = 'Draft' | 'Pending' | 'Ordered' | 'Received' | 'Cancelled';

export interface SupplierOrderLine {
  orderNumber: string;
  supplier: string;
  date: string;
  colour: Colour;
  design: Design;
  size: Size;
  quantity: number;
  status: SupplierOrderStatus;
  notes?: string;
}

export interface PackagingItem {
  packagingType: string;
  quantity: number;
  minimumQuantity: number;
  supplier: string;
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Outstanding';

export interface Payment {
  customer: string;
  orderNumber: string;
  amount: number;
  paid: number;
  outstanding: number;
  date: string;
  status: PaymentStatus;
}

export interface Settings {
  businessName: string;
  suppliers: { name: string; contact: string; leadTimeDays: number }[];
  defaultMinimumStock: number;
  whatsappNumbers: string[];
  businessLogoUrl?: string;
  notificationPreferences: {
    lowStock: boolean;
    packagingAlert: boolean;
    supplierOrderAlert: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
  };
}

export interface InventoryHistoryEntry {
  id: string;
  productId: string;
  change: number; // + for stock in, - for stock out
  reason: string;
  date: string;
  user: string;
}

export interface NotificationLogEntry {
  id: string;
  type: 'Low Stock' | 'Packaging Alert' | 'Supplier Order' | 'Daily Summary' | 'Weekly Report';
  message: string;
  date: string;
  sent: boolean;
}

export interface EPIMSData {
  inventory: InventoryItem[];
  supplierOrders: SupplierOrderLine[];
  packaging: PackagingItem[];
  payments: Payment[];
  settings: Settings;
  history: InventoryHistoryEntry[];
  notifications: NotificationLogEntry[];
}
