import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginApi, meApi, registerApi } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('comrade_auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setTokens({ accessToken: parsed.accessToken });
      } catch (e) {
        // ignore
      }
    }

    async function loadMe() {
      try {
        const data = await meApi();
        setUser(data.user);
      } catch (e) {
        // not logged in
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  async function login(email, password) {
    setError(null);
    const data = await loginApi({ email, password });
    setUser(data.user);
    setTokens(data.tokens);
    localStorage.setItem('comrade_auth', JSON.stringify(data.tokens));
    if (data.csrfToken) {
      localStorage.setItem('comrade_csrf', data.csrfToken);
    }
    return data;
  }

  async function register(payload) {
    setError(null);
    const data = await registerApi(payload);
    return data;
  }

  function logout() {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('comrade_auth');
  }

  const value = {
    user,
    loading,
    error,
    tokens,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
