import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthShowcase from '../../components/AuthShowcase';

export default function Registro() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
    contrasena_confirmation: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.contrasena !== form.contrasena_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const firstError = Object.values(apiErrors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || 'Error al crear la cuenta.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* Columna Izquierda: Formulario */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 xl:px-24 bg-white">
        <div />

        <div className="w-full max-w-md mx-auto my-auto py-6">
          <h1 className="text-3xl font-bold tracking-tight !text-slate-900">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Registra tu taller en minutos y ofrece seguimiento en tiempo real a tus clientes.
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <User className="h-5 w-5 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  name="correo"
                  required
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="h-5 w-5 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="461 123 4567"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="contrasena"
                    required
                    minLength={8}
                    value={form.contrasena}
                    onChange={handleChange}
                    placeholder="Mín. 8 caracteres"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="contrasena_confirmation"
                    required
                    minLength={8}
                    value={form.contrasena_confirmation}
                    onChange={handleChange}
                    placeholder="Repite contraseña"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition cursor-pointer mt-2"
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              Inicia sesión
            </Link>
          </p>
        </div>

        <div />
      </div>

      {/* Columna Derecha Dinámica */}
      <AuthShowcase />
    </div>
  );
}