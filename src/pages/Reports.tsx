import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Stack, Grid, Divider, Skeleton } from '@mui/material';
import { useEpimsData } from '../context/DataContext';

const currency = (n: number) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export const Reports: React.FC = () => {
  const { data, loading, kpis, lowStockItems } = useEpimsData();

  const byDesign = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.inventory.forEach((i) => map.set(i.design, (map.get(i.design) ?? 0) + i.quantityAvailable));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const bySize = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.inventory.forEach((i) => map.set(i.size, (map.get(i.size) ?? 0) + i.quantityAvailable));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  if (loading || !data) return <Stack spacing={1.5}>{[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={100} />)}</Stack>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Reports</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Inventory Value &amp; Profit</Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Box><Typography variant="caption" color="text.secondary">Inventory Value</Typography><Typography variant="h5">{currency(kpis.inventoryValue)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Estimated Profit</Typography><Typography variant="h5">{currency(kpis.estimatedProfit)}</Typography></Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Most Popular Design</Typography>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {byDesign.map(([design, qty]) => (
              <Stack key={design} direction="row" justifyContent="space-between">
                <Typography variant="body2">{design}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{qty} units</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Most Popular Size</Typography>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {bySize.map(([size, qty]) => (
              <Stack key={size} direction="row" justifyContent="space-between">
                <Typography variant="body2">{size}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{qty} units</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Low Stock Report</Typography>
          <Divider sx={{ my: 1.5 }} />
          {lowStockItems.length === 0 && <Typography variant="body2" color="text.secondary">Nothing below minimum stock.</Typography>}
          <Grid container spacing={1}>
            {lowStockItems.map((i) => (
              <Grid item xs={6} key={i.productId}>
                <Typography variant="body2">{i.colour} {i.design} {i.size}</Typography>
                <Typography variant="caption" color="warning.main">{i.quantityAvailable} / min {i.minimumStock}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Payment Report</Typography>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Total Outstanding</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{currency(kpis.outstandingPayments)}</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
