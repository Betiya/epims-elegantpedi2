import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useEpimsData } from '../context/DataContext';
import { epimsApi } from '../services/api';

export const Notifications: React.FC = () => {
  const { data, refresh, lowStockItems, lowPackaging } = useEpimsData();
  const [sending, setSending] = useState(false);

  const send = async (type: string, message: string) => {
    setSending(true);
    await epimsApi.sendWhatsAppNotification(type, message);
    await refresh();
    setSending(false);
  };

  if (!data) return null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Notifications</Typography>

      <Card sx={{ mb: 2, bgcolor: '#000', color: '#fff' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WhatsAppIcon />
            <Typography sx={{ fontWeight: 600 }}>WhatsApp Alerts</Typography>
          </Stack>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
            Low stock, packaging shortages and supplier order recommendations are sent automatically once the
            Apps Script backend and WhatsApp Business API are connected — see Settings.
          </Typography>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="outlined" disabled={sending}
          onClick={() => send('Low Stock', `🚨 Low Stock Alert: ${lowStockItems.length} product line(s) below minimum stock.`)}
        >
          Send low stock alert now
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button
          variant="outlined" disabled={sending}
          onClick={() => send('Packaging Alert', `📦 Packaging running low: ${lowPackaging.map((p) => p.packagingType).join(', ') || 'none'}.`)}
        >
          Send packaging alert now
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ mb: 1 }}>Notification Log</Typography>
      <Card>
        <List disablePadding>
          {data.notifications.length === 0 && <ListItem><ListItemText primary="No notifications sent yet." /></ListItem>}
          {data.notifications.map((n, i) => (
            <React.Fragment key={n.id}>
              <ListItem
                secondaryAction={<Chip size="small" label={n.sent ? 'Sent' : 'Queued'} color={n.sent ? 'success' : 'default'} />}
              >
                <ListItemText primary={`${n.type}`} secondary={`${n.message} — ${new Date(n.date).toLocaleString('en-ZA')}`} />
              </ListItem>
              {i < data.notifications.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Card>
    </Box>
  );
};
