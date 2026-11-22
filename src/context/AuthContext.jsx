import { createContext, useContext, useState, useEffect } from 'react';
import api, { getCsrfCookie } from '../services/api';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 1,
  nombre: 'Robel (Vista Previa)',
  correo: 'robel@repairhub.mx',
  telefono: '461 123 4567',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const checkSession = async () => {
    try {
      const { data } = await api.get('/api/me');
      setUser(data.user ?? data);
      setDemoMode(false);
    } catch (err) {
      // Si hay sesión demo guardada localmente mientras no hay backend
      const savedDemo = localStorage.getItem('repairhub_demo_user');
      if (savedDemo && (!err.response || err.response.status >= 500)) {
        setUser(JSON.parse(savedDemo));
        setDemoMode(true);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (credentials) => {
    try {
      await getCsrfCookie();
      const { data } = await api.post('/api/login', credentials);
      await checkSession();
      return data;
    } catch (err) {
      // Si el servidor Laravel (8001) está apagado, entramos en modo vista previa
      if (!err.response || err.response.status >= 500) {
        const mockUser = { ...DEMO_USER, correo: credentials.correo };
        localStorage.setItem('repairhub_demo_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setDemoMode(true);
        return { user: mockUser };
      }
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      await getCsrfCookie();
      const { data } = await api.post('/api/registro', userData);
      await checkSession();
      return data;
    } catch (err) {
      if (!err.response || err.response.status >= 500) {
        const mockUser = {
          id: 1,
          nombre: userData.nombre,
          correo: userData.correo,
          telefono: userData.telefono,
        };
        localStorage.setItem('repairhub_demo_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setDemoMode(true);
        return { user: mockUser };
      }
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('repairhub_demo_user');
    setDemoMode(false);
    try {
      await api.post('/api/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, demoMode, login, register, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);