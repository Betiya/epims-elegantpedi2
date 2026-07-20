import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Stack, Chip, Tabs, Tab, Skeleton, Divider, Select, MenuItem
} from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useEpimsData } from '../context/DataContext';
import { SupplierOrderLine, SupplierOrderStatus } from '../types';

export const SupplierOrders: React.FC = () => {
  const { data, loading, suggestedReorders, saveSupplierOrder, updateSupplierOrderStatus } = useEpimsData();
  const [tab, setTab] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const rows = useMemo(
    () => suggestedReorders.map((r) => ({ ...r, key: `${r.colour}-${r.design}-${r.size}` })),
    [suggestedReorders]
  );

  const getQty = (key: string, fallback: number) => (key in quantities ? quantities[key] : fallback);

  const groupedOrders = useMemo(() => {
    if (!data) return [];
    const byOrder = new Map<string, SupplierOrderLine[]>();
    data.supplierOrders.forEach((o) => {
      if (!byOrder.has(o.orderNumber)) byOrder.set(o.orderNumber, []);
      byOrder.get(o.orderNumber)!.push(o);
    });
    return Array.from(byOrder.entries());
  }, [data]);

  const handleSave = async () => {
    const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
    const lines: SupplierOrderLine[] = rows
      .map((r) => ({
        orderNumber,
        supplier: data?.settings.suppliers[0]?.name ?? 'Default Supplier',
        date: new Date().toISOString(),
        colour: r.colour as any,
        design: r.design as any,
        size: r.size as any,
        quantity: getQty(r.key, r.order),
        status: 'Pending' as SupplierOrderStatus
      }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) return;
    await saveSupplierOrder(lines);
    setQuantities({});
    setTab(1);
  };

  const handlePrintOrPdf = () => window.print();

  if (loading || !data) return <Stack spacing={1.5}>{[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={64} />)}</Stack>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Supplier Orders</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Suggested Orders" />
        <Tab label="Order History" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {rows.length === 0 ? (
            <Card><CardContent><Typography color="text.secondary">All product lines are at or above minimum stock — nothing to reorder right now.</Typography></CardContent></Card>
          ) : (
            <Card>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Colour</TableCell><TableCell>Design</TableCell><TableCell>Size</TableCell>
                    <TableCell align="right">Current</TableCell><TableCell align="right">Min</TableCell><TableCell align="right">Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>{r.colour}</TableCell>
                      <TableCell>{r.design}</TableCell>
                      <TableCell>{r.size}</TableCell>
                      <TableCell align="right">{r.current}</TableCell>
                      <TableCell align="right">{r.minimum}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small" type="number" value={getQty(r.key, r.order)}
                          onChange={(e) => setQuantities((q) => ({ ...q, [r.key]: Number(e.target.value) }))}
                          sx={{ width: 64 }} inputProps={{ min: 0, style: { textAlign: 'right' } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSave} disabled={rows.length === 0}>Save supplier order</Button>
            <Button variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={handlePrintOrPdf}>Print</Button>
            <Button variant="outlined" startIcon={<PictureAsPdfOutlinedIcon />} onClick={handlePrintOrPdf}>Export PDF</Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Reorder quantity = Minimum Stock − Current Stock. Adjust any line before saving.
          </Typography>
        </Box>
      )}

      {tab === 1 && (
        <Stack spacing={2}>
          {groupedOrders.length === 0 && <Typography color="text.secondary">No supplier orders yet.</Typography>}
          {groupedOrders.map(([orderNumber, lines]) => (
            <Card key={orderNumber}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{orderNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lines[0].supplier} · {new Date(lines[0].date).toLocaleDateString('en-ZA')}
                    </Typography>
                  </Box>
                  <Select
                    size="small" value={lines[0].status}
                    onChange={(e) => updateSupplierOrderStatus(orderNumber, e.target.value as SupplierOrderStatus)}
                  >
                    {(['Draft', 'Pending', 'Ordered', 'Received', 'Cancelled'] as SupplierOrderStatus[]).map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {lines.map((l, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                    <Typography variant="body2">{l.colour} · {l.design} · {l.size}</Typography>
                    <Chip size="small" label={`×${l.quantity}`} />
                  </Stack>
                ))}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
