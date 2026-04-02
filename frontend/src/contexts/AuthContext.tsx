import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authApi, resetSessionExpiredNotification } from '../api/client';

const TOKEN_KEY = 'suntek_token';
const USER_KEY = 'suntek_user';

export interface User {
  email: string;
  roles: string[];
  expiresAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): { token: string; user: User } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr) as User;
    if (new Date(user.expiresAt) <= new Date()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return { token, user };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setState({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const setAuth = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      const { token, email: userEmail, roles, expiresAt } = res.data;
      const user: User = {
        email: userEmail,
        roles,
        expiresAt: new Date(expiresAt).toISOString(),
      };
      resetSessionExpiredNotification();
      setAuth(token, user);
    },
    [setAuth]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
