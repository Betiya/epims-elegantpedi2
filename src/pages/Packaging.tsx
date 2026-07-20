import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Stack, IconButton, Skeleton, Chip, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useEpimsData } from '../context/DataContext';

export const Packaging: React.FC = () => {
  const { data, loading, updatePackaging } = useEpimsData();
  const [busy, setBusy] = useState<string | null>(null);

  if (loading || !data) return <Stack spacing={1.5}>{[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} />)}</Stack>;

  const adjust = async (type: string, delta: number) => {
    const item = data.packaging.find((p) => p.packagingType === type);
    if (!item) return;
    setBusy(type);
    await updatePackaging({ ...item, quantity: Math.max(0, item.quantity + delta) });
    setBusy(null);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Packaging</Typography>
      <Stack spacing={1.5}>
        {data.packaging.map((p) => {
          const low = p.quantity < p.minimumQuantity;
          const pct = Math.min(100, (p.quantity / Math.max(p.minimumQuantity * 2, 1)) * 100);
          return (
            <Card key={p.packagingType}>
              <CardContent sx={{ py: 1.75 }}>
                <Grid container alignItems="center">
                  <Grid item xs={7}>
                    <Typography sx={{ fontWeight: 600 }}>{p.packagingType}</Typography>
                    <Typography variant="caption" color="text.secondary">Supplier: {p.supplier}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={pct} color={low ? 'warning' : 'success'} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                    {low && <Chip size="small" label="Reorder" color="warning" sx={{ mt: 0.75, height: 20, fontSize: '0.65rem' }} />}
                  </Grid>
                  <Grid item xs={5}>
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                      <IconButton size="small" disabled={busy === p.packagingType} onClick={() => adjust(p.packagingType, -10)} sx={{ border: '1px solid #eee' }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ width: 44, textAlign: 'center', fontWeight: 700 }}>{p.quantity}</Typography>
                      <IconButton size="small" disabled={busy === p.packagingType} onClick={() => adjust(p.packagingType, 10)} sx={{ border: '1px solid #eee' }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                      Min: {p.minimumQuantity}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};
