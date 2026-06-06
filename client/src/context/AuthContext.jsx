import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session persistence
    const sessionUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (sessionUser && token) {
      setUser(JSON.parse(sessionUser));
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const register = async (userData) => {
    return { success: false, error: 'Registration via API not implemented in demo' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
