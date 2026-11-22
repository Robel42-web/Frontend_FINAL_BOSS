import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  Wrench,
  Smartphone,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TALLER_DEMO = {
  id: 1,
  nombre: 'TechFix Celaya',
  slug: 'techfix-celaya',
  descripcion:
    'Servicio técnico especializado en reparación de laptops, smartphones, tabletas y mantenimiento preventivo con garantía por escrito.',
  correo: 'contacto@techfix.mx',
  telefono: '461 234 5678',
  direccion: 'Av. Tecnológico #450, Col. Centro, Celaya, Gto.',
  horario_atencion: {
    lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
    martes: { abierto: true, inicio: '09:00', fin: '18:00' },
    miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
    jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
    viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
    sabado: { abierto: true, inicio: '09:00', fin: '14:00' },
    domingo: { abierto: false, inicio: '09:00', fin: '14:00' },
  },
  servicios: [
    { id: 1, nombre: 'Diagnóstico general y revisión', precio_estimado: 150, duracion: '30 min' },
    { id: 2, nombre: 'Mantenimiento preventivo y cambio de pasta térmica', precio_estimado: 450, duracion: '1.5 hrs' },
    { id: 3, nombre: 'Cambio de pantalla / display', precio_estimado: 1800, duracion: '2 hrs' },
    { id: 4, nombre: 'Reemplazo de batería', precio_estimado: 950, duracion: '1 hr' },
  ],
};

const DIAS_LABEL = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export default function TallerPublico({ onNuevaCitaDemo }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [taller, setTaller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [citaEnviada, setCitaEnviada] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_correo: '',
    servicio_id: '',
    equipo_descripcion: '',
    fecha_hora: '',
    notas: '',
  });

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/public/establecimientos/${slug}`)
      .then(({ data }) => {
        setTaller(data.data ?? data);
      })
      .catch(() => {
        setTaller({
          ...TALLER_DEMO,
          slug: slug || TALLER_DEMO.slug,
          nombre: slug
            ? slug
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : TALLER_DEMO.nombre,
        });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    const servicioSeleccionado = (taller?.servicios || TALLER_DEMO.servicios).find(
      (s) => String(s.id) === String(form.servicio_id)
    );

    const payload = {
      ...form,
      establecimiento_id: taller?.id || 1,
      servicio_nombre: servicioSeleccionado?.nombre || 'Revisión general',
    };

    try {
      const { data } = await api.post(`/api/public/establecimientos/${slug}/citas`, payload);
      setCitaEnviada(data.data ?? data);
    } catch {
      const nuevaCita = {
        id: Date.now(),
        ...payload,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
      };
      if (onNuevaCitaDemo) onNuevaCitaDemo(nuevaCita);
      setCitaEnviada(nuevaCita);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const servicios = taller?.servicios?.length ? taller.servicios : TALLER_DEMO.servicios;
  const horarios = taller?.horario_atencion || TALLER_DEMO.horario_atencion;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Cabecera pública */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white">
        {/* Barra superior de extremo a extremo */}
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Explorar otros talleres</span>
          </Link>

          {user && (
            <Link
              to="/dashboard/citas"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
            >
              <span>Volver al panel del taller</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Información del establecimiento alineada con las columnas */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Agendamiento en línea disponible
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight !text-white">
              {taller?.nombre}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {taller?.descripcion}
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
              {taller?.direccion && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-400 shrink-0" />
                  {taller.direccion}
                </span>
              )}
              {taller?.telefono && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-brand-400 shrink-0" />
                  {taller.telefono}
                </span>
              )}
              {taller?.correo && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                  {taller.correo}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Servicios y Horarios */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3 mb-4">
              <Wrench className="h-5 w-5 text-brand-600" />
              <h2>Servicios disponibles</h2>
            </div>

            <div className="space-y-3">
              {servicios.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setForm((prev) => ({ ...prev, servicio_id: String(srv.id) }))}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    String(form.servicio_id) === String(srv.id)
                      ? 'border-brand-600 bg-brand-50/60'
                      : 'border-slate-200 hover:border-brand-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{srv.nombre}</p>
                    <span className="text-xs font-bold text-brand-600 shrink-0">
                      ${srv.precio_estimado} MXN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tiempo estimado: {srv.duracion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3 mb-4">
              <Clock className="h-5 w-5 text-brand-600" />
              <h2>Horarios de atención</h2>
            </div>

            <div className="space-y-2.5 text-sm">
              {Object.entries(DIAS_LABEL).map(([key, label]) => {
                const info = horarios[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">{label}</span>
                    {info?.abierto ? (
                      <span className="text-slate-900 font-semibold text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                        {info.inicio} - {info.fin}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Solicitud de Cita */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            {citaEnviada ? (
              <div className="py-10 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  ¡Solicitud de cita enviada!
                </h2>
                <p className="text-sm text-slate-600">
                  Hemos registrado tu solicitud para{' '}
                  <strong className="text-slate-900">{citaEnviada.equipo_descripcion}</strong>. El
                  taller confirmará tu horario a la brevedad.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 text-slate-700">
                  <p>
                    <strong>Cliente:</strong> {citaEnviada.cliente_nombre}
                  </p>
                  <p>
                    <strong>Servicio:</strong> {citaEnviada.servicio_nombre}
                  </p>
                  <p>
                    <strong>Fecha y hora deseada:</strong>{' '}
                    {new Date(citaEnviada.fecha_hora).toLocaleString('es-MX')}
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCitaEnviada(null);
                      setForm({
                        cliente_nombre: '',
                        cliente_telefono: '',
                        cliente_correo: '',
                        servicio_id: '',
                        equipo_descripcion: '',
                        fecha_hora: '',
                        notas: '',
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Agendar otra cita
                  </button>
                  {user && (
                    <Link
                      to="/dashboard/citas"
                      className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
                    >
                      Ver cita en el panel
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-6">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Agenda tu cita</h2>
                    <p className="text-xs text-slate-500">
                      Completa tus datos y selecciona el servicio o falla de tu equipo
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tu nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.cliente_nombre}
                        onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                        placeholder="Ej. Ana Sofía Ramírez"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.cliente_telefono}
                        onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })}
                        placeholder="461 123 4567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={form.cliente_correo}
                        onChange={(e) => setForm({ ...form, cliente_correo: e.target.value })}
                        placeholder="cliente@correo.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fecha y hora preferida *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={form.fecha_hora}
                        onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Servicio requerido *
                      </label>
                      <select
                        required
                        value={form.servicio_id}
                        onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                      >
                        <option value="">Selecciona un servicio...</option>
                        {servicios.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.nombre} (${srv.precio_estimado})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Equipo (Marca y modelo) *
                      </label>
                      <div className="relative">
                        <Smartphone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={form.equipo_descripcion}
                          onChange={(e) =>
                            setForm({ ...form, equipo_descripcion: e.target.value })
                          }
                          placeholder="Ej. Laptop HP Pavilion 15"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descripción de la falla o notas adicionales
                    </label>
                    <textarea
                      rows={3}
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                      placeholder="Cuéntanos brevemente qué problema presenta tu equipo..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    {enviando ? 'Enviando solicitud...' : 'Solicitar cita ahora'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}