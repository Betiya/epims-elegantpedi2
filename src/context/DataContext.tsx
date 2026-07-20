import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EPIMSData, InventoryItem, PackagingItem, Payment, SupplierOrderLine } from '../types';
import { epimsApi, isLiveConnected } from '../services/api';

interface DataContextValue {
  data: EPIMSData | null;
  loading: boolean;
  error: string | null;
  isLiveConnected: boolean;
  refresh: () => Promise<void>;
  updateInventoryItem: (item: InventoryItem, reason: string) => Promise<void>;
  saveSupplierOrder: (lines: SupplierOrderLine[]) => Promise<void>;
  updateSupplierOrderStatus: (orderNumber: string, status: SupplierOrderLine['status']) => Promise<void>;
  updatePackaging: (item: PackagingItem) => Promise<void>;
  recordPayment: (payment: Payment) => Promise<void>;
  updateSettings: (settings: EPIMSData['settings']) => Promise<void>;
  suggestedReorders: { colour: string; design: string; size: string; current: number; minimum: number; order: number }[];
  lowStockItems: InventoryItem[];
  lowPackaging: PackagingItem[];
  kpis: {
    totalShirts: number;
    blackShirts: number;
    whiteShirts: number;
    packagingRemaining: number;
    outstandingPayments: number;
    lowStockCount: number;
    supplierOrdersPending: number;
    inventoryValue: number;
    estimatedProfit: number;
  };
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<EPIMSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await epimsApi.getAllData();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load EPIMS data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateInventoryItem = useCallback(async (item: InventoryItem, reason: string) => {
    await epimsApi.updateInventoryItem(item, reason);
    await refresh();
  }, [refresh]);

  const saveSupplierOrder = useCallback(async (lines: SupplierOrderLine[]) => {
    await epimsApi.saveSupplierOrder(lines);
    await refresh();
  }, [refresh]);

  const updateSupplierOrderStatus = useCallback(async (orderNumber: string, status: SupplierOrderLine['status']) => {
    await epimsApi.updateSupplierOrderStatus(orderNumber, status);
    await refresh();
  }, [refresh]);

  const updatePackaging = useCallback(async (item: PackagingItem) => {
    await epimsApi.updatePackaging(item);
    await refresh();
  }, [refresh]);

  const recordPayment = useCallback(async (payment: Payment) => {
    await epimsApi.recordPayment(payment);
    await refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (settings: EPIMSData['settings']) => {
    await epimsApi.updateSettings(settings);
    await refresh();
  }, [refresh]);

  const suggestedReorders = useMemo(() => {
    if (!data) return [];
    return data.inventory
      .filter((i) => i.quantityAvailable < i.minimumStock)
      .map((i) => ({
        colour: i.colour,
        design: i.design,
        size: i.size,
        current: i.quantityAvailable,
        minimum: i.minimumStock,
        order: Math.max(i.minimumStock - i.quantityAvailable, 0)
      }));
  }, [data]);

  const lowStockItems = useMemo(() => data?.inventory.filter((i) => i.quantityAvailable < i.minimumStock) ?? [], [data]);
  const lowPackaging = useMemo(() => data?.packaging.filter((p) => p.quantity < p.minimumQuantity) ?? [], [data]);

  const kpis = useMemo(() => {
    if (!data) {
      return {
        totalShirts: 0, blackShirts: 0, whiteShirts: 0, packagingRemaining: 0,
        outstandingPayments: 0, lowStockCount: 0, supplierOrdersPending: 0,
        inventoryValue: 0, estimatedProfit: 0
      };
    }
    const totalShirts = data.inventory.reduce((s, i) => s + i.quantityAvailable, 0);
    const blackShirts = data.inventory.filter((i) => i.colour === 'Black').reduce((s, i) => s + i.quantityAvailable, 0);
    const whiteShirts = data.inventory.filter((i) => i.colour === 'White').reduce((s, i) => s + i.quantityAvailable, 0);
    const packagingRemaining = data.packaging.reduce((s, p) => s + p.quantity, 0);
    const outstandingPayments = data.payments.reduce((s, p) => s + p.outstanding, 0);
    const inventoryValue = data.inventory.reduce((s, i) => s + i.quantityAvailable * i.costPrice, 0);
    const estimatedProfit = data.inventory.reduce((s, i) => s + i.quantityAvailable * (i.sellingPrice - i.costPrice), 0);
    const supplierOrdersPending = new Set(
      data.supplierOrders.filter((o) => o.status === 'Pending' || o.status === 'Ordered').map((o) => o.orderNumber)
    ).size;
    return {
      totalShirts, blackShirts, whiteShirts, packagingRemaining, outstandingPayments,
      lowStockCount: lowStockItems.length, supplierOrdersPending, inventoryValue, estimatedProfit
    };
  }, [data, lowStockItems]);

  const value: DataContextValue = {
    data, loading, error, isLiveConnected, refresh,
    updateInventoryItem, saveSupplierOrder, updateSupplierOrderStatus,
    updatePackaging, recordPayment, updateSettings,
    suggestedReorders, lowStockItems, lowPackaging, kpis
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useEpimsData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useEpimsData must be used within DataProvider');
  return ctx;
}
