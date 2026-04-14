import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, setAuthToken } from '../services/api';

const AuthContext = createContext();

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      if (!token) {
        setAuthToken(null);
        if (isMounted) setLoading(false);
        return;
      }

      setAuthToken(token);

      try {
        const { data } = await getCurrentUser();
        if (!isMounted) return;
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        if (!isMounted) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthToken(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthToken(userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
