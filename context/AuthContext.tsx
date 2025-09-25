import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as api from '../api';
import { Capacitor } from '@capacitor/core';
import { verifyToken } from '../utils/totp';
import TwoFactorAuthPrompt from '../components/TwoFactorAuthPrompt';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  logout: () => Promise<void>;
  pendingTwoFactorUser: User | null;
  login: (username: string, password: string) => Promise<void>;
  completeTwoFactorLogin: (code: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start as true for initial session check

  // Check for session on initial load
  useEffect(() => {
    const persistentUser = localStorage.getItem('currentUser');
    const sessionUser = sessionStorage.getItem('currentUser');
    const userJson = persistentUser || sessionUser;

    if (userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);
  
    import { registerPush } from '../services/notifications';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  logout: () => Promise<void>;
  pendingTwoFactorUser: User | null;
  login: (username: string, password: string) => Promise<void>;
  completeTwoFactorLogin: (code: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start as true for initial session check

  // Check for session on initial load
  useEffect(() => {
    const persistentUser = localStorage.getItem('currentUser');
    const sessionUser = sessionStorage.getItem('currentUser');
    const userJson = persistentUser || sessionUser;

    if (userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);
  
    const handleLoginSuccess = useCallback((user: User) => {
    const isMobile = Capacitor.isNativePlatform() || /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    setCurrentUser(user);
    setPendingTwoFactorUser(null);
    setLoginError(null);

    // On native mobile, store user ID in Capacitor Preferences
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          // Dynamically require instead of static import
          const prefsModule = await import('@capacitor/preferences');
          const { Preferences } = prefsModule;
          await Preferences.set({ key: 'current_user_id', value: user.id });

          // Register for push notifications
          await registerPush(user.id);
        } catch (e) {
          console.warn('Capacitor Preferences or Push registration failed:', e);
        }
      })();
    } else {
      // Web fallback
      localStorage.setItem('current_user_id', user.id);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setLoginError(null);
    setPendingTwoFactorUser(null);
    try {
      const userProfile = await api.fetchUserByName(username);
      
      if (!userProfile) {
        throw new Error(`User profile not found for username: ${username}`);
      }
      
      if (userProfile.password !== password) {
          throw new Error('Invalid password');
      }

      if (userProfile.isTwoFactorEnabled && userProfile.twoFactorSecret) {
          setPendingTwoFactorUser(userProfile);
      } else {
          handleLoginSuccess(userProfile);
      }
    } catch (error: any) {
        setLoginError(error.message);
        throw error;
    } finally {
      setLoading(false);
    }
  }, [handleLoginSuccess]);

  const completeTwoFactorLogin = useCallback(async (code: string) => {
    if (!pendingTwoFactorUser || !pendingTwoFactorUser.twoFactorSecret) {
        throw new Error('No user pending 2FA');
    }
    setLoading(true);
    setLoginError(null);
    try {
        const isValid = await verifyToken(pendingTwoFactorUser.twoFactorSecret, code);
        if (isValid) {
            handleLoginSuccess(pendingTwoFactorUser);
        } else {
            const error = new Error('Invalid 2FA code');
            setLoginError(error.message);
            throw error;
        }
    } catch (error: any) {
        setLoginError(error.message);
        throw error;
    } finally {
        setLoading(false);
    }
  }, [pendingTwoFactorUser, handleLoginSuccess]);

  const logout = useCallback(async () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('current_user_id');
    setCurrentUser(null);
    setPendingTwoFactorUser(null);
  }, []);
  
  const cancelTwoFactor = useCallback(() => {
    setPendingTwoFactorUser(null);
    setLoginError(null);
  }, []);

  const currentRole = useMemo(() => currentUser?.role || null, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    currentRole,
    logout,
    pendingTwoFactorUser,
    login,
    completeTwoFactorLogin,
    loading,
  }), [currentUser, currentRole, logout, pendingTwoFactorUser, login, completeTwoFactorLogin, loading]);

  if (pendingTwoFactorUser) {
    return (
      <TwoFactorAuthPrompt 
        user={pendingTwoFactorUser} 
        onVerify={completeTwoFactorLogin} 
        onCancel={cancelTwoFactor} 
        error={loginError} 
        isLoading={loading}
      />
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setLoginError(null);
    setPendingTwoFactorUser(null);
    try {
      const userProfile = await api.fetchUserByName(username);
      
      if (!userProfile) {
        throw new Error(`User profile not found for username: ${username}`);
      }
      
      if (userProfile.password !== password) {
          throw new Error('Invalid password');
      }

      if (userProfile.isTwoFactorEnabled && userProfile.twoFactorSecret) {
          setPendingTwoFactorUser(userProfile);
      } else {
          handleLoginSuccess(userProfile);
      }
    } catch (error: any) {
        setLoginError(error.message);
        throw error;
    } finally {
      setLoading(false);
    }
  }, [handleLoginSuccess]);

  const completeTwoFactorLogin = useCallback(async (code: string) => {
    if (!pendingTwoFactorUser || !pendingTwoFactorUser.twoFactorSecret) {
        throw new Error('No user pending 2FA');
    }
    setLoading(true);
    setLoginError(null);
    try {
        const isValid = await verifyToken(pendingTwoFactorUser.twoFactorSecret, code);
        if (isValid) {
            handleLoginSuccess(pendingTwoFactorUser);
        } else {
            const error = new Error('Invalid 2FA code');
            setLoginError(error.message);
            throw error;
        }
    } catch (error: any) {
        setLoginError(error.message);
        throw error;
    } finally {
        setLoading(false);
    }
  }, [pendingTwoFactorUser, handleLoginSuccess]);

  const logout = useCallback(async () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('current_user_id');
    setCurrentUser(null);
    setPendingTwoFactorUser(null);
  }, []);
  
  const cancelTwoFactor = useCallback(() => {
    setPendingTwoFactorUser(null);
    setLoginError(null);
  }, []);

  const currentRole = useMemo(() => currentUser?.role || null, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    currentRole,
    logout,
    pendingTwoFactorUser,
    login,
    completeTwoFactorLogin,
    loading,
  }), [currentUser, currentRole, logout, pendingTwoFactorUser, login, completeTwoFactorLogin, loading]);

  if (pendingTwoFactorUser) {
    return (
      <TwoFactorAuthPrompt 
        user={pendingTwoFactorUser} 
        onVerify={completeTwoFactorLogin} 
        onCancel={cancelTwoFactor} 
        error={loginError} 
        isLoading={loading}
      />
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
