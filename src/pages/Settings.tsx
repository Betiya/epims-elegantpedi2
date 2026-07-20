import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Stack, TextField, Switch, FormControlLabel, Button, Divider, Alert } from '@mui/material';
import { useEpimsData } from '../context/DataContext';
import { Settings as SettingsType } from '../types';

export const Settings: React.FC = () => {
  const { data, updateSettings, isLiveConnected } = useEpimsData();
  const [local, setLocal] = useState<SettingsType | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setLocal(data.settings); }, [data]);

  if (!local) return null;

  const save = async () => {
    await updateSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Settings</Typography>

      {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>Settings saved</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Business Information</Typography>
          <TextField fullWidth label="Business Name" value={local.businessName}
            onChange={(e) => setLocal({ ...local, businessName: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Default Minimum Stock" type="number" value={local.defaultMinimumStock}
            onChange={(e) => setLocal({ ...local, defaultMinimumStock: Number(e.target.value) })} />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Suppliers</Typography>
          {local.suppliers.map((s, i) => (
            <Stack key={i} spacing={1} sx={{ mb: 2 }}>
              <TextField label="Supplier Name" value={s.name} onChange={(e) => {
                const suppliers = [...local.suppliers]; suppliers[i] = { ...s, name: e.target.value };
                setLocal({ ...local, suppliers });
              }} />
              <TextField label="Contact" value={s.contact} onChange={(e) => {
                const suppliers = [...local.suppliers]; suppliers[i] = { ...s, contact: e.target.value };
                setLocal({ ...local, suppliers });
              }} />
              <TextField label="Lead Time (days)" type="number" value={s.leadTimeDays} onChange={(e) => {
                const suppliers = [...local.suppliers]; suppliers[i] = { ...s, leadTimeDays: Number(e.target.value) };
                setLocal({ ...local, suppliers });
              }} />
            </Stack>
          ))}
          <Button size="small" onClick={() => setLocal({ ...local, suppliers: [...local.suppliers, { name: '', contact: '', leadTimeDays: 7 }] })}>
            + Add supplier
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>WhatsApp Numbers</Typography>
          <TextField
            fullWidth label="Numbers (comma-separated)"
            value={local.whatsappNumbers.join(', ')}
            onChange={(e) => setLocal({ ...local, whatsappNumbers: e.target.value.split(',').map((s) => s.trim()) })}
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Notification Preferences</Typography>
          {(Object.keys(local.notificationPreferences) as (keyof SettingsType['notificationPreferences'])[]).map((key) => (
            <FormControlLabel
              key={key}
              control={<Switch checked={local.notificationPreferences[key]}
                onChange={(e) => setLocal({ ...local, notificationPreferences: { ...local.notificationPreferences, [key]: e.target.checked } })} />}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              sx={{ display: 'flex', justifyContent: 'space-between', ml: 0, width: '100%' }}
              labelPlacement="start"
            />
          ))}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Google Sheet Configuration</Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            {isLiveConnected
              ? 'Connected to your live Google Sheet via the Apps Script backend.'
              : 'Running on local demo data. Deploy google-apps-script/Code.gs and set VITE_EPIMS_API_URL in .env to connect your live Google Sheet.'}
          </Typography>
        </CardContent>
      </Card>

      <Button fullWidth variant="contained" onClick={save}>Save Settings</Button>
    </Box>
  );
};
