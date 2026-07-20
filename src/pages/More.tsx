import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const ITEMS = [
  { label: 'Payments', path: '/payments', icon: <PaymentsOutlinedIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentOutlinedIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsNoneOutlinedIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon /> }
];

export const More: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>More</Typography>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #ECEAE5' }}>
        {ITEMS.map((item, i) => (
          <React.Fragment key={item.path}>
            <ListItemButton onClick={() => navigate(item.path)} sx={{ py: 1.5 }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
            {i < ITEMS.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};
