import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Stack, Chip, Skeleton, Alert, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useEpimsData } from '../context/DataContext';

const currency = (n: number) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

const KpiCard: React.FC<{ label: string; value: string; tone?: 'default' | 'warning' | 'success' }> = ({ label, value, tone = 'default' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{label}</Typography>
      <Typography variant="h3" sx={{ mt: 0.5, color: tone === 'warning' ? 'warning.main' : tone === 'success' ? 'success.main' : 'text.primary' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, kpis, lowStockItems, lowPackaging } = useEpimsData();

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !data) {
    return (
      <Stack spacing={2}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={90} />)}
      </Stack>
    );
  }

  const recent = data.history.slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Good day, Lerato</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Here's where ElegantPedi stands today.
      </Typography>

      {(lowStockItems.length > 0 || lowPackaging.length > 0) && (
        <Alert
          icon={<ErrorOutlineIcon fontSize="inherit" />}
          severity="warning"
          sx={{ borderRadius: 3, mb: 3 }}
          action={<Button size="small" onClick={() => navigate('/inventory')}>Review</Button>}
        >
          {lowStockItems.length} product line{lowStockItems.length !== 1 ? 's' : ''} and {lowPackaging.length} packaging item{lowPackaging.length !== 1 ? 's' : ''} below minimum stock.
        </Alert>
      )}

      <Grid container spacing={1.5}>
        <Grid item xs={6}><KpiCard label="Total Shirts" value={String(kpis.totalShirts)} /></Grid>
        <Grid item xs={6}><KpiCard label="Black / White" value={`${kpis.blackShirts} / ${kpis.whiteShirts}`} /></Grid>
        <Grid item xs={6}><KpiCard label="Packaging Remaining" value={String(kpis.packagingRemaining)} /></Grid>
        <Grid item xs={6}><KpiCard label="Outstanding Payments" value={currency(kpis.outstandingPayments)} tone={kpis.outstandingPayments > 0 ? 'warning' : 'default'} /></Grid>
        <Grid item xs={6}><KpiCard label="Low Stock Items" value={String(kpis.lowStockCount)} tone={kpis.lowStockCount > 0 ? 'warning' : 'success'} /></Grid>
        <Grid item xs={6}><KpiCard label="Supplier Orders Pending" value={String(kpis.supplierOrdersPending)} /></Grid>
        <Grid item xs={6}><KpiCard label="Inventory Value" value={currency(kpis.inventoryValue)} /></Grid>
        <Grid item xs={6}><KpiCard label="Est. Profit" value={currency(kpis.estimatedProfit)} tone="success" /></Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>Quick Actions</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label="Create supplier order" onClick={() => navigate('/supplier-orders')} sx={{ bgcolor: '#000', color: '#fff', px: 1 }} />
        <Chip label="Add stock" onClick={() => navigate('/inventory')} variant="outlined" sx={{ px: 1 }} />
        <Chip label="Record payment" onClick={() => navigate('/payments')} variant="outlined" sx={{ px: 1 }} />
        <Chip label="View reports" onClick={() => navigate('/reports')} variant="outlined" sx={{ px: 1 }} />
      </Stack>

      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Recent Activity</Typography>
      <Card>
        <List disablePadding>
          {recent.length === 0 && (
            <ListItem><ListItemText primary="No stock movement recorded yet" secondary="Adjustments you make in Inventory will appear here." /></ListItem>
          )}
          {recent.map((h, i) => (
            <React.Fragment key={h.id}>
              <ListItem>
                <ListItemText
                  primary={`${h.productId} · ${h.change > 0 ? '+' : ''}${h.change} units`}
                  secondary={`${h.reason} — ${new Date(h.date).toLocaleString('en-ZA')}`}
                />
              </ListItem>
              {i < recent.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Card>
    </Box>
  );
};
