import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signInDevMode, googleClientId } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id && btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 280
      });
    }
  }, [googleClientId]);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', p: 3 }}>
      <Paper elevation={0} sx={{ p: 5, maxWidth: 360, width: '100%', textAlign: 'center', border: 'none' }}>
        <Typography variant="h1" sx={{ fontSize: '2.6rem', mb: 0.5 }}>
          EPIMS
        </Typography>
        <Typography variant="overline" color="text.secondary">
          ElegantPedi Inventory &amp; Supplier Management
        </Typography>

        <Stack spacing={2} sx={{ mt: 5 }}>
          <Box ref={btnRef} sx={{ display: 'flex', justifyContent: 'center' }} />
          {!googleClientId && (
            <Typography variant="caption" color="text.secondary">
              Google Sign-In isn't configured yet — set VITE_GOOGLE_CLIENT_ID (see README) to enable it.
            </Typography>
          )}
          <Button variant="outlined" color="inherit" onClick={signInDevMode} sx={{ borderColor: '#000' }}>
            Continue in demo mode
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
