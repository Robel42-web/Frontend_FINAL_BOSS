import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Registro() {
  const navigate = useNavigate();
  const { registro } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
    confirmar: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.contrasena !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await registro({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || null,
        contrasena: form.contrasena,
      });
      navigate('/dashboard');
    } catch (err) {
      const errores = err.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      setError(
        primerError ||
          err.response?.data?.message ||
          'No se pudo crear la cuenta. Verifica tus datos.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 xl:px-24 bg-white">
        <div />

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <h1 className="text-3xl font-bold tracking-tight !text-slate-900">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Registra tu taller en minutos y ofrece seguimiento en tiempo real a tus clientes.
          </p>

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Robel"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="correo"
                  required
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  name="telefono"
                  maxLength={20}
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej. 461 123 4567"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="confirmar"
                    required
                    minLength={8}
                    value={form.confirmar}
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
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              <span>{submitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div />
      </div>

      {/* Columna Derecha Decorativa */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 text-white">
        <div className="max-w-md space-y-6 text-center">
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200">
              COTIZACIÓN #COT-109 · Verificada
            </span>
            <h3 className="text-lg font-bold !text-white">
              iPhone 15 Pro - Reemplazo de pantalla
            </h3>
            <p className="text-xs text-brand-100">
              Desglose claro de refacciones, mano de obra y aprobación digital con historial completo.
            </p>
          </div>
          <h2 className="text-2xl font-bold !text-white">
            Presupuestos claros antes de reparar
          </h2>
          <p className="text-sm text-brand-100">
            Evita malentendidos con aprobaciones verificables por el cliente.
          </p>
        </div>
      </div>
    </div>
  );
}