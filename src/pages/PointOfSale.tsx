import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Button, TextField, IconButton, Chip,
  Skeleton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { useEpimsData } from '../context/DataContext';
import { InventoryItem } from '../types';

interface CartLine {
  productId: string;
  colour: string;
  design: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

const currency = (n: number) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}`;

export const PointOfSale: React.FC = () => {
  const { data, loading, updateInventoryItem, recordPayment } = useEpimsData();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in customer');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ saleNumber: string; date: string; lines: CartLine[]; total: number; received: number; customer: string } | null>(null);

  const availableProducts = useMemo(() => (data?.inventory ?? []).filter((i) => i.quantityAvailable > 0), [data]);

  const total = useMemo(() => cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [cart]);

  if (loading || !data) return <Stack spacing={1.5}>{[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={70} />)}</Stack>;

  const addToCart = () => {
    const item = data.inventory.find((i) => i.productId === selectedProductId);
    if (!item) return;
    setCart((c) => {
      const existing = c.find((l) => l.productId === item.productId);
      const inCartQty = existing?.quantity ?? 0;
      if (inCartQty + 1 > item.quantityAvailable) return c; // don't exceed stock on hand
      if (existing) {
        return c.map((l) => (l.productId === item.productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...c, { productId: item.productId, colour: item.colour, design: item.design, size: item.size, quantity: 1, unitPrice: item.sellingPrice }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    const stockItem = data.inventory.find((i) => i.productId === productId) as InventoryItem;
    setCart((c) =>
      c
        .map((l) => {
          if (l.productId !== productId) return l;
          const next = l.quantity + delta;
          if (next > stockItem.quantityAvailable) return l;
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) => setCart((c) => c.filter((l) => l.productId !== productId));

  const completeSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
      // Decrement stock for each line
      for (const line of cart) {
        const item = data.inventory.find((i) => i.productId === line.productId);
        if (!item) continue;
        const updated = { ...item, quantityAvailable: Math.max(0, item.quantityAvailable - line.quantity), lastUpdated: new Date().toISOString() };
        await updateInventoryItem(updated, `In-store sale ${saleNumber}`);
      }
      // Record the payment as Paid (assumes full payment at point of sale)
      await recordPayment({
        customer: customerName || 'Walk-in customer',
        orderNumber: saleNumber,
        amount: total,
        paid: amountReceived || total,
        outstanding: Math.max(0, total - (amountReceived || total)),
        date: new Date().toISOString(),
        status: (amountReceived || total) >= total ? 'Paid' : 'Partial'
      });
      setReceipt({ saleNumber, date: new Date().toISOString(), lines: cart, total, received: amountReceived || total, customer: customerName || 'Walk-in customer' });
      setCart([]);
      setAmountReceived(0);
      setCustomerName('Walk-in customer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong completing the sale.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>New Sale</Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Add product</InputLabel>
              <Select label="Add product" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                {availableProducts.map((p) => (
                  <MenuItem key={p.productId} value={p.productId}>
                    {p.colour} {p.design} {p.size} — {p.quantityAvailable} in stock
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={addToCart} disabled={!selectedProductId} sx={{ flexShrink: 0 }}>Add</Button>
          </Stack>
        </CardContent>
      </Card>

      {cart.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary">Cart is empty — add products above to start a sale.</Typography></CardContent></Card>
      ) : (
        <Stack spacing={1.25}>
          {cart.map((l) => (
            <Card key={l.productId}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{l.colour} {l.design} {l.size}</Typography>
                    <Typography variant="caption" color="text.secondary">{currency(l.unitPrice)} each</Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <IconButton size="small" onClick={() => changeQty(l.productId, -1)} sx={{ border: '1px solid #eee' }}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography sx={{ width: 28, textAlign: 'center', fontWeight: 700 }}>{l.quantity}</Typography>
                    <IconButton size="small" onClick={() => changeQty(l.productId, 1)} sx={{ border: '1px solid #eee' }}><AddIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => removeLine(l.productId)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {cart.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField label="Customer name (optional)" size="small" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <TextField
                label="Amount received (R)" size="small" type="number" value={amountReceived || ''}
                placeholder={total.toFixed(2)}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                helperText="Leave blank to record full amount as received"
              />
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">{currency(total)}</Typography>
              </Stack>
              <Button variant="contained" size="large" onClick={completeSale} disabled={processing}>
                {processing ? 'Processing…' : 'Complete sale'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Receipt dialog */}
      <Dialog open={!!receipt} onClose={() => setReceipt(null)} fullWidth maxWidth="xs">
        <DialogTitle>Sale complete</DialogTitle>
        <DialogContent>
          {receipt && (
            <Box id="receipt-print-area">
              <Typography variant="h5" sx={{ textAlign: 'center', mb: 0.5 }}>{data.settings.businessName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                Receipt · {receipt.saleNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">{new Date(receipt.date).toLocaleString('en-ZA')}</Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>Customer: {receipt.customer}</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {receipt.lines.map((l, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">{l.quantity}× {l.colour} {l.design} {l.size}</Typography>
                  <Typography variant="body2">{currency(l.quantity * l.unitPrice)}</Typography>
                </Stack>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 700 }}>Total</Typography><Typography sx={{ fontWeight: 700 }}>{currency(receipt.total)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Received</Typography><Typography variant="body2">{currency(receipt.received)}</Typography></Stack>
              {receipt.received < receipt.total && (
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="warning.main">Balance due</Typography><Typography variant="body2" color="warning.main">{currency(receipt.total - receipt.received)}</Typography></Stack>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>Thank you for shopping with us.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceipt(null)}>Close</Button>
          <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>Print receipt</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
