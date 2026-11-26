import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { verificarSesion } = useAuth();

  useEffect(() => {
    verificarSesion().then((usuario) => {
      if (usuario) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login?error=oauth', { replace: true });
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-600">
        Completando inicio de sesión con Google...
      </p>
    </div>
  );
}