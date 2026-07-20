import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, BottomNavigation, BottomNavigationAction,
  Avatar, IconButton, Menu, MenuItem, Chip, Container
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useAuth } from '../../context/AuthContext';
import { useEpimsData } from '../../context/DataContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Inventory', path: '/inventory', icon: <Inventory2OutlinedIcon /> },
  { label: 'Orders', path: '/supplier-orders', icon: <LocalShippingOutlinedIcon /> },
  { label: 'Packaging', path: '/packaging', icon: <InventoryOutlinedIcon /> },
  { label: 'More', path: '/more', icon: <MoreHorizIcon /> }
];

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isLiveConnected } = useEpimsData();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((n) => (n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)))
  );

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: 64 }}>
          <Typography variant="h5" sx={{ flexGrow: 1, color: '#fff', fontWeight: 600, letterSpacing: '0.02em' }}>
            EPIMS
          </Typography>
          <Chip
            size="small"
            label={isLiveConnected ? 'Live · Google Sheets' : 'Demo data'}
            sx={{
              mr: 1.5,
              bgcolor: isLiveConnected ? 'rgba(90,200,120,0.18)' : 'rgba(255,255,255,0.12)',
              color: '#fff',
              fontSize: '0.65rem'
            }}
          />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#000', fontSize: '0.85rem' }} src={undefined}>
              {user?.name?.charAt(0) ?? 'A'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>{user?.name}</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>Settings</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); signOut(); }}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" disableGutters sx={{ flex: 1, pb: 10, px: 2, pt: 2 }}>
        <Outlet />
      </Container>

      <BottomNavigation
        showLabels
        value={activeIndex}
        onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 68, zIndex: 10 }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Box>
  );
};
