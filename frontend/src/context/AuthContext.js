import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token); // Декодируем токен
        const currentTime = Date.now() / 1000; // Текущее время в секундах

        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Token expired');
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded);
          setAuthToken(token); // Устанавливаем токен в API клиенте
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    setAuthToken(token); // Устанавливаем токен в API клиенте
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthToken(null); // Очищаем токен в API клиенте
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};