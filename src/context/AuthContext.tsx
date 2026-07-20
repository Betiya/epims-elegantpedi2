import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface EpimsUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  user: EpimsUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInDevMode: () => void;
  signOut: () => void;
  googleClientId?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'epims-auth-user';

// Set VITE_GOOGLE_CLIENT_ID in .env once you've created an OAuth 2.0 Client ID
// in Google Cloud Console (APIs & Services > Credentials > OAuth client ID > Web application).
// Add your deployed origin (e.g. https://epims.elegantpedi.co.za) to "Authorized JavaScript origins".
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: any;
  }
}

function decodeJwt(token: string): any {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(base64))));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EpimsUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setUser(JSON.parse(raw));
    setLoading(false);

    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: { credential: string }) => {
          const payload = decodeJwt(resp.credential);
          const u: EpimsUser = { name: payload.name, email: payload.email, picture: payload.picture };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setUser(u);
        }
      });
    }
  }, []);

  const signInWithGoogle = useCallback(() => {
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      console.warn('VITE_GOOGLE_CLIENT_ID not set — see google-apps-script/README for setup.');
    }
  }, []);

  const signInDevMode = useCallback(() => {
    const u: EpimsUser = { name: 'Administrator', email: 'admin@elegantpedi.local' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInDevMode, signOut, googleClientId: GOOGLE_CLIENT_ID }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
