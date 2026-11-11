import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // If a token is saved from an earlier visit, find out who it belongs to.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('sweety:unauthorized', logout);
    return () => window.removeEventListener('sweety:unauthorized', logout);
  }, [logout]);

  const value = useMemo(() => {
    const startSession = ({ token, user: nextUser }) => {
      setToken(token);
      setUser(nextUser);
    };
    return {
      user,
      loading,
      logout,
      login: async (credentials) => startSession(await api.login(credentials)),
      register: async (details) => startSession(await api.register(details)),
    };
  }, [user, loading, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
