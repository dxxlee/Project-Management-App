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
        const decoded = jwtDecode(token); // Decode the token
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
          localStorage.removeItem('token'); // Remove expired token
          setUser(null);
        } else {
          setUser(decoded);
          setAuthToken(token); // Set token in API client
        }
      } catch (error) {
        localStorage.removeItem('token'); // Remove invalid token
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    setAuthToken(token); // Set token in API client
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthToken(null); // Clear token in API client
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};