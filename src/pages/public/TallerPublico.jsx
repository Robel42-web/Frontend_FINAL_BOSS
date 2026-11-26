import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Wrench,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TALLERES_DEMO_POR_SLUG = {
  'techfix-celaya': {
    nombre: 'TechFix Celaya',
    slug: 'techfix-celaya',
    descripcion:
      'Servicio técnico especializado en reparación de laptops, smartphones, tabletas y mantenimiento preventivo con garantía por escrito.',
    telefono: '461 234 5678',
    correo: 'contacto@techfix.mx',
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
      { id: 1, nombre: 'Diagnóstico general y revisión', precio_base: 150, duracion_estimada_minutos: 30 },
      { id: 2, nombre: 'Mantenimiento preventivo y pasta térmica', precio_base: 450, duracion_estimada_minutos: 90 },
      { id: 3, nombre: 'Cambio de pantalla / display', precio_base: null, duracion_estimada_minutos: null },
      { id: 4, nombre: 'Reemplazo de batería', precio_base: 950, duracion_estimada_minutos: 60 },
    ],
  },
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

const formatearDuracion = (min) => {
  if (!min) return 'A reserva de modelo';
  if (min < 60) return `${min} min`;
  const hrs = (min / 60).toFixed(min % 60 === 0 ? 0 : 1);
  return `${hrs} ${Number(hrs) === 1 ? 'hr' : 'hrs'}`;
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
    nombre: '',
    telefono: '',
    correo: '',
    servicio_id: '',
    fecha_programada: '',
    descripcion_problema: '',
  });

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/publico/${slug}`)
      .then(({ data }) => {
        setTaller(data.data ?? data);
      })
      .catch(() => {
        setTaller(
          TALLERES_DEMO_POR_SLUG[slug] || {
            ...TALLERES_DEMO_POR_SLUG['techfix-celaya'],
            slug,
          }
        );
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.telefono.trim() && !form.correo.trim()) {
      setError('Ingresa al menos un teléfono o correo electrónico de contacto.');
      return;
    }

    setEnviando(true);
    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      servicio_id: form.servicio_id ? Number(form.servicio_id) : null,
      fecha_programada: form.fecha_programada,
      descripcion_problema: form.descripcion_problema.trim(),
    };

    try {
      const { data } = await api.post(`/api/publico/${slug}/citas`, payload);
      setCitaEnviada(data);
    } catch (err) {
      if (err.response?.status === 422 || err.response?.status === 429) {
        const errores = err.response.data?.errors;
        const primerError = errores ? Object.values(errores)[0]?.[0] : null;
        setError(primerError || err.response.data?.message || 'Revisa los datos de tu cita.');
      } else {
        const servicioObj = taller?.servicios?.find((s) => String(s.id) === String(form.servicio_id));
        const nueva = {
          id: Date.now(),
          cliente_nombre: form.nombre,
          cliente_telefono: form.telefono,
          cliente_correo: form.correo,
          servicio_nombre: servicioObj?.nombre || 'Diagnóstico general',
          fecha_hora: form.fecha_programada,
          notas: form.descripcion_problema,
          estado: 'pendiente',
        };
        if (onNuevaCitaDemo) onNuevaCitaDemo(nueva);
        setCitaEnviada({
          message: 'Solicitud recibida (modo respaldo local).',
          cita: { id: nueva.id, fecha_programada: form.fecha_programada, estado: 'pendiente' },
        });
      }
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

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Cabecera pública */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white">
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
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Catálogo de servicios y horarios */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wrench className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Servicios y tarifas</h2>
            </div>

            {!taller?.servicios || taller.servicios.length === 0 ? (
              <p className="text-sm text-slate-500">
                Este taller realiza diagnósticos personalizados al recibir tu equipo.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {taller.servicios.map((srv) => (
                  <div key={srv.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{srv.nombre}</p>
                      {srv.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">{srv.descripcion}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tiempo estimado: {formatearDuracion(srv.duracion_estimada_minutos)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {srv.precio_base !== null && srv.precio_base !== undefined ? (
                        <span className="text-sm font-bold text-brand-600">
                          Desde ${Number(srv.precio_base).toFixed(0)} MXN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Previa revisión
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {taller?.horario_atencion && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">Horarios de atención</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                {Object.entries(DIAS_LABEL).map(([key, label]) => {
                  const dia = taller.horario_atencion?.[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="font-medium text-slate-700">{label}</span>
                      {dia?.abierto ? (
                        <span className="text-slate-600 font-medium">
                          {dia.inicio || dia.apertura} - {dia.fin || dia.cierre}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Columna Derecha: Formulario de solicitud de cita */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            {citaEnviada ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">¡Solicitud enviada!</h3>
                <p className="text-sm text-slate-600">
                  {citaEnviada.message || 'El taller revisará tu solicitud y confirmará tu horario.'}
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
                  <p>
                    <strong className="text-slate-800">Cliente:</strong> {form.nombre}
                  </p>
                  <p>
                    <strong className="text-slate-800">Fecha solicitada:</strong>{' '}
                    {form.fecha_programada.replace('T', ' ')}
                  </p>
                  <p>
                    <strong className="text-slate-800">Estado:</strong> Pendiente de confirmación
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCitaEnviada(null);
                    setForm({
                      nombre: '',
                      telefono: '',
                      correo: '',
                      servicio_id: '',
                      fecha_programada: '',
                      descripcion_problema: '',
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Agendar otra cita
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Agendar una cita</h2>
                    <p className="text-xs text-slate-500">Sin necesidad de crear cuenta</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tu nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. María Fernanda López"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="461 123 4567"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Servicio requerido
                  </label>
                  <select
                    name="servicio_id"
                    value={form.servicio_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                  >
                    <option value="">Diagnóstico / No estoy seguro</option>
                    {taller?.servicios?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}{' '}
                        {s.precio_base !== null && s.precio_base !== undefined
                          ? `($${Number(s.precio_base).toFixed(0)})`
                          : '(Previa revisión)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha y hora preferida *
                  </label>
                  <input
                    type="datetime-local"
                    name="fecha_programada"
                    required
                    value={form.fecha_programada}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipo / Vehículo y descripción de la falla *
                  </label>
                  <textarea
                    name="descripcion_problema"
                    required
                    rows={3}
                    value={form.descripcion_problema}
                    onChange={handleChange}
                    placeholder="Ej. Laptop HP Pavilion 15 - No enciende al conectar el cargador..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  {enviando ? 'Enviando solicitud...' : 'Solicitar cita'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}