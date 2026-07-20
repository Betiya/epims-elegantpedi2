import { createTheme } from '@mui/material/styles';

// ElegantPedi brand: black / white / light grey, luxury, minimal, fashion-inspired.
// Display face (Cormorant Garamond) carries the brand's fashion-editorial voice;
// Inter is the quiet, highly-legible workhorse for data-dense screens.

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#FFFFFF' },
    secondary: { main: '#FFFFFF', contrastText: '#000000' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    success: { main: '#2E7D32' },
    warning: { main: '#E07A17' },
    error: { main: '#C62828' },
    text: { primary: '#0A0A0A', secondary: '#5C5C5C' },
    divider: '#E5E3DE'
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 },
    h3: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 },
    h4: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 },
    h5: { fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.8rem' },
    overline: { letterSpacing: '0.14em', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid #ECEAE5',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingLeft: 20, paddingRight: 20, minHeight: 44 },
        containedPrimary: { boxShadow: 'none', '&:hover': { boxShadow: 'none', backgroundColor: '#1A1A1A' } }
      }
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999, fontWeight: 600 } }
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { backgroundColor: '#FFFFFF', borderTop: '1px solid #ECEAE5' } }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#000000', boxShadow: 'none' }
      }
    }
  }
});
