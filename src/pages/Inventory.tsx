import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Chip, Stack, Card, CardContent,
  Grid, IconButton, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HistoryIcon from '@mui/icons-material/History';
import { useEpimsData } from '../context/DataContext';
import { InventoryItem } from '../types';

const COLOURS = ['All', 'Black', 'White'];
const DESIGNS = ['All', 'Clean', 'Mebotorong', 'Neat'];
const SIZES = ['All', 'Small', 'Medium', 'Large', 'X-Large'];

export const Inventory: React.FC = () => {
  const { data, loading, updateInventoryItem } = useEpimsData();
  const [query, setQuery] = useState('');
  const [colour, setColour] = useState('All');
  const [design, setDesign] = useState('All');
  const [size, setSize] = useState('All');
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.inventory.filter((i: InventoryItem) => {
      if (colour !== 'All' && i.colour !== colour) return false;
      if (design !== 'All' && i.design !== design) return false;
      if (size !== 'All' && i.size !== size) return false;
      if (query && !`${i.colour} ${i.design} ${i.size} ${i.productId}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [data, colour, design, size, query]);

  const adjust = async (item: InventoryItem, delta: number) => {
    const updated = { ...item, quantityAvailable: Math.max(0, item.quantityAvailable + delta), lastUpdated: new Date().toISOString() };
    await updateInventoryItem(updated, delta > 0 ? 'Manual stock in' : 'Manual stock out');
  };

  if (loading || !data) {
    return <Stack spacing={1.5}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} />)}</Stack>;
  }

  const itemHistory = historyItem ? data.history.filter((h: any) => h.productId === historyItem) : [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Inventory</Typography>

      <TextField
        fullWidth size="small" placeholder="Search colour, design, size, ID"
        value={query} onChange={(e) => setQuery(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        sx={{ mb: 1.5 }}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Colour</InputLabel>
          <Select label="Colour" value={colour} onChange={(e) => setColour(e.target.value)}>
            {COLOURS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Design</InputLabel>
          <Select label="Design" value={design} onChange={(e) => setDesign(e.target.value)}>
            {DESIGNS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Size</InputLabel>
          <Select label="Size" value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="caption" color="text.secondary">{filtered.length} product lines</Typography>

      <Stack spacing={1.25} sx={{ mt: 1 }}>
        {filtered.map((item: InventoryItem) => {
          const low = item.quantityAvailable < item.minimumStock;
          return (
            <Card key={item.productId}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item xs={7}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                      {item.colour} · {item.design}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{item.size} · {item.productId}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {low && <Chip size="small" label="Low stock" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                      <IconButton size="small" onClick={() => setHistoryItem(item.productId)}>
                        <HistoryIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Stack>
                  </Grid>
                  <Grid item xs={5}>
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                      <IconButton size="small" onClick={() => adjust(item, -1)} sx={{ border: '1px solid #eee' }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ width: 34, textAlign: 'center', fontWeight: 700 }}>{item.quantityAvailable}</Typography>
                      <IconButton size="small" onClick={() => adjust(item, 1)} sx={{ border: '1px solid #eee' }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }} onClick={() => setEditing(item)}>
                      Edit details
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Edit details dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit {editing?.productId}</DialogTitle>
        <DialogContent>
          {editing && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Quantity Available" type="number" value={editing.quantityAvailable}
                onChange={(e) => setEditing({ ...editing, quantityAvailable: Number(e.target.value) })} />
              <TextField label="Minimum Stock" type="number" value={editing.minimumStock}
                onChange={(e) => setEditing({ ...editing, minimumStock: Number(e.target.value) })} />
              <TextField label="Cost Price (R)" type="number" value={editing.costPrice}
                onChange={(e) => setEditing({ ...editing, costPrice: Number(e.target.value) })} />
              <TextField label="Selling Price (R)" type="number" value={editing.sellingPrice}
                onChange={(e) => setEditing({ ...editing, sellingPrice: Number(e.target.value) })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={async () => {
            if (editing) await updateInventoryItem({ ...editing, lastUpdated: new Date().toISOString() }, 'Edited product details');
            setEditing(null);
          }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyItem} onClose={() => setHistoryItem(null)} fullWidth maxWidth="xs">
        <DialogTitle>Stock history · {historyItem}</DialogTitle>
        <DialogContent>
          {itemHistory.length === 0 && <Typography variant="body2" color="text.secondary">No movement recorded yet.</Typography>}
          <Stack spacing={1}>
            {itemHistory.map((h: any) => (
              <Box key={h.id}>
                <Typography variant="body2">{h.change > 0 ? '+' : ''}{h.change} units — {h.reason}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(h.date).toLocaleString('en-ZA')}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistoryItem(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};
