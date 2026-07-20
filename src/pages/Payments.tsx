import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Skeleton, Fab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEpimsData } from '../context/DataContext';
import { Payment, PaymentStatus } from '../types';

const statusColor: Record<PaymentStatus, 'success' | 'warning' | 'error'> = {
  Paid: 'success', Partial: 'warning', Outstanding: 'error'
};

const currency = (n: number) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export const Payments: React.FC = () => {
  const { data, loading, recordPayment } = useEpimsData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({ status: 'Outstanding' });

  if (loading || !data) return <Stack spacing={1.5}>{[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} />)}</Stack>;

  const submit = async () => {
    if (!form.customer || !form.orderNumber || !form.amount) return;
    const paid = form.paid ?? 0;
    const amount = form.amount ?? 0;
    const status: PaymentStatus = paid >= amount ? 'Paid' : paid > 0 ? 'Partial' : 'Outstanding';
    await recordPayment({
      customer: form.customer,
      orderNumber: form.orderNumber,
      amount,
      paid,
      outstanding: Math.max(0, amount - paid),
      date: new Date().toISOString(),
      status
    });
    setForm({ status: 'Outstanding' });
    setOpen(false);
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Payments</Typography>
      <Stack spacing={1.25}>
        {data.payments.map((p, i) => (
          <Card key={i}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{p.customer}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.orderNumber} · {new Date(p.date).toLocaleDateString('en-ZA')}</Typography>
                </Box>
                <Chip size="small" label={p.status} color={statusColor[p.status]} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2">Total {currency(p.amount)}</Typography>
                <Typography variant="body2">Paid {currency(p.paid)}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Owed {currency(p.outstanding)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Fab color="primary" onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: 84, right: 20 }}>
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Record payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Customer" value={form.customer ?? ''} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
            <TextField label="Order Number" value={form.orderNumber ?? ''} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} />
            <TextField label="Total Amount (R)" type="number" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <TextField label="Amount Paid (R)" type="number" value={form.paid ?? ''} onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
