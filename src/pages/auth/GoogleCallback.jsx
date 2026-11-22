import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { getCsrfCookie } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('codigo');
    if (!code) {
      navigate('/login');
      return;
    }

    const exchangeCode = async () => {
      try {
        await getCsrfCookie();
        await api.post('/api/auth/google/exchange', { codigo: code, code });
        await checkSession();
        navigate('/dashboard');
      } catch {
        setError('No se pudo completar el inicio de sesión con Google.');
        setTimeout(() => navigate('/login'), 2500);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, checkSession]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
        {error ? (
          <p className="text-red-600 text-sm font-medium">{error}</p>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-slate-900 font-semibold">Conectando con Google...</h3>
            <p className="text-slate-500 text-sm mt-1">Validando tu cuenta en RepairHub</p>
          </>
        )}
      </div>
    </div>
  );
}