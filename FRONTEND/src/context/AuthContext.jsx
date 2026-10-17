import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Create Context
const AuthContext = createContext();

// Create Provider Component
export const AuthProvider = ({ children }) => {
  // We can store the entire user object here, not just the profile_id!
  // This saves us from making expensive Axios calls in other components.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // You can optionally load the user from local storage or an API on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (savedUser && token && savedUser !== 'undefined' && token !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setLoading(false);
        return;
      }
      
      // Verify session with backend immediately on mount/navigation
      verifySession();
      
      // Set up polling to check session status every 10 seconds (detect forced logouts)
      const intervalId = setInterval(verifySession, 10000);
      
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  // Make a quick call to /api/auth/me. 
  // If forced logged out, the interceptor catches the 401 and clears local storage.
  const verifySession = async () => {
    try {
      // We must dynamically import to avoid circular dependencies if any, 
      // or just rely on the global axiosInstance if imported at top.
      const { default: axiosInstance } = await import('../utils/axiosInstance');
      const response = await axiosInstance.get('/auth/me');
      
      // Keep user state in sync with backend (fetches latest plan, etc.)
      if (response.data && response.data.user) {
        // Only update state if it changed, to avoid infinite re-renders or loops
        // But for simplicity, we can just call setUser and localStorage
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      // 401 error is handled by axiosInstance interceptor which kicks the user out
      if (error.response && error.response.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update both state and localStorage when user logs in/out
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      const { default: axiosInstance } = await import('../utils/axiosInstance');
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Logout API failed', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser, verifySession }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext easily
export const useAuth = () => {
  return useContext(AuthContext);
};
