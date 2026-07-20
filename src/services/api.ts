import { EPIMSData, InventoryItem, PackagingItem, Payment, SupplierOrderLine, InventoryHistoryEntry } from '../types';
import { mockData } from './mockData';

// The Apps Script web app URL, set after deploying google-apps-script/Code.gs
// (Deploy > New deployment > Web app > "Execute as: Me" > "Who has access: Anyone with the link").
// Set it in a .env file as VITE_EPIMS_API_URL, or leave blank to run against local mock data.
const API_URL = import.meta.env.VITE_EPIMS_API_URL as string | undefined;

const LOCAL_KEY = 'epims-local-data-v1';

function loadLocal(): EPIMSData {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as EPIMSData;
    } catch {
      /* fall through to seed */
    }
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(mockData));
  return mockData;
}

function saveLocal(data: EPIMSData) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

async function callAppsScript<T>(action: string, payload?: unknown): Promise<T> {
  if (!API_URL) throw new Error('No API_URL configured');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) throw new Error(`EPIMS API error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data as T;
}

export const isLiveConnected = !!API_URL;

export const epimsApi = {
  /** Full read of all six sheets. Used to hydrate the app on load. */
  async getAllData(): Promise<EPIMSData> {
    if (API_URL) {
      try {
        return await callAppsScript<EPIMSData>('getAllData');
      } catch (e) {
        console.error('Falling back to local data:', e);
      }
    }
    return loadLocal();
  },

  async updateInventoryItem(item: InventoryItem, reason: string): Promise<InventoryItem> {
    if (API_URL) return callAppsScript<InventoryItem>('updateInventoryItem', { item, reason });
    const data = loadLocal();
    const idx = data.inventory.findIndex((i) => i.productId === item.productId);
    const prevQty = idx >= 0 ? data.inventory[idx].quantityAvailable : 0;
    if (idx >= 0) data.inventory[idx] = item;
    else data.inventory.push(item);
    const historyEntry: InventoryHistoryEntry = {
      id: `H-${Date.now()}`,
      productId: item.productId,
      change: item.quantityAvailable - prevQty,
      reason,
      date: new Date().toISOString(),
      user: 'Administrator'
    };
    data.history.unshift(historyEntry);
    saveLocal(data);
    return item;
  },

  async saveSupplierOrder(lines: SupplierOrderLine[]): Promise<SupplierOrderLine[]> {
    if (API_URL) return callAppsScript<SupplierOrderLine[]>('saveSupplierOrder', { lines });
    const data = loadLocal();
    data.supplierOrders.push(...lines);
    saveLocal(data);
    return lines;
  },

  async updateSupplierOrderStatus(orderNumber: string, status: SupplierOrderLine['status']): Promise<void> {
    if (API_URL) return callAppsScript('updateSupplierOrderStatus', { orderNumber, status });
    const data = loadLocal();
    data.supplierOrders.forEach((o) => {
      if (o.orderNumber === orderNumber) o.status = status;
    });
    saveLocal(data);
  },

  async updatePackaging(item: PackagingItem): Promise<PackagingItem> {
    if (API_URL) return callAppsScript<PackagingItem>('updatePackaging', { item });
    const data = loadLocal();
    const idx = data.packaging.findIndex((p) => p.packagingType === item.packagingType);
    if (idx >= 0) data.packaging[idx] = item;
    else data.packaging.push(item);
    saveLocal(data);
    return item;
  },

  async recordPayment(payment: Payment): Promise<Payment> {
    if (API_URL) return callAppsScript<Payment>('recordPayment', { payment });
    const data = loadLocal();
    const idx = data.payments.findIndex((p) => p.orderNumber === payment.orderNumber);
    if (idx >= 0) data.payments[idx] = payment;
    else data.payments.push(payment);
    saveLocal(data);
    return payment;
  },

  async updateSettings(settings: EPIMSData['settings']): Promise<EPIMSData['settings']> {
    if (API_URL) return callAppsScript('updateSettings', { settings });
    const data = loadLocal();
    data.settings = settings;
    saveLocal(data);
    return settings;
  },

  /** Triggers the Apps Script side to send a WhatsApp message via the configured provider (see Code.gs). */
  async sendWhatsAppNotification(type: string, message: string): Promise<void> {
    if (API_URL) return callAppsScript('sendWhatsAppNotification', { type, message });
    const data = loadLocal();
    data.notifications.unshift({ id: `N-${Date.now()}`, type: type as any, message, date: new Date().toISOString(), sent: false });
    saveLocal(data);
  }
};
