import React, { createContext, useContext, useEffect, useState } from 'react';
import api from 'lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search-related state
  const [searchParams, setSearchParams] = useState({ center: [-74.006, 40.7128], zoom: 10 });
  const handleSearch = ({ center, zoom }) => setSearchParams({ center, zoom });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      // Handle OAuth redirect
      const params = new URLSearchParams(window.location.search);
      const oauthToken = params.get('token');
      if (oauthToken) {
        localStorage.setItem('token', oauthToken);
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Verify token with backend
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/api/auth/verify');
          if (data.success) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Auth verify failed:', err);
          logout();
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('token', data.user.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il login');
    }
    return false;
  };

  const loginDirect = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/register', { name, email, password });
      if (data.success) {
        localStorage.setItem('token', data.user.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante la registrazione');
    }
    return false;
  };

  const loginWithGoogle = () => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${base}/api/auth/google`;
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const { data } = await api.put('/api/auth/profile', userData);
      if (data.success) {
        if (data.user.token) localStorage.setItem('token', data.user.token);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante l\'aggiornamento del profilo');
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        loginDirect,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        searchParams,
        handleSearch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
