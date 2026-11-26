import { createContext, useContext, useState, useEffect } from 'react';
import api, { getCsrfCookie } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verificarSesion = async () => {
    try {
      const { data } = await api.get('/api/me');
      const usuarioReal = data.usuario ?? data;
      setUser(usuarioReal);
      return usuarioReal;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarSesion();
  }, []);

const login = async ({ correo, contrasena }) => {
    await getCsrfCookie();
    const { data } = await api.post('/api/login', { correo, contrasena });
    const usuarioReal = data.usuario ?? data;
    setUser(usuarioReal);
    return usuarioReal;
  };

  const registro = async ({ nombre, correo, contrasena, telefono }) => {
    await getCsrfCookie();
    const { data } = await api.post('/api/registro', {
      nombre,
      correo,
      contrasena,
      telefono: telefono || null,
    });
    const usuarioReal = data.usuario ?? data;
    setUser(usuarioReal);
    return usuarioReal;
  };

  const logout = async () => {
    try {
      await api.post('/api/logout');
    } catch {
      // Ignora error si la sesión ya expiró
    } finally {
      setUser(null);
    }
  };

  // Para probar sin backend conectado (opcional)
  const iniciarModoDemo = () => {
    setUser({
      id: 999,
      nombre: 'Robel (Vista Previa)',
      correo: 'l20031358@celaya.tecnm.mx',
      activo: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registro,
        logout,
        verificarSesion,
        iniciarModoDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);