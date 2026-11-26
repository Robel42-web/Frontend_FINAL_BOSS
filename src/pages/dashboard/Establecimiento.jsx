import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Store,
  Save,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Users,
  Trash2,
  UserPlus,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const crearHorariosVacios = () => ({
  lunes: { abierto: false, apertura: '09:00', cierre: '18:00' },
  martes: { abierto: false, apertura: '09:00', cierre: '18:00' },
  miercoles: { abierto: false, apertura: '09:00', cierre: '18:00' },
  jueves: { abierto: false, apertura: '09:00', cierre: '18:00' },
  viernes: { abierto: false, apertura: '09:00', cierre: '18:00' },
  sabado: { abierto: false, apertura: '09:00', cierre: '14:00' },
  domingo: { abierto: false, apertura: '09:00', cierre: '14:00' },
});

const normalizarHorarios = (horariosGuardados) => {
  const base = crearHorariosVacios();
  if (!horariosGuardados || typeof horariosGuardados !== 'object') return base;

  DIAS_SEMANA.forEach(({ key }) => {
    if (horariosGuardados[key]) {
      base[key] = {
        abierto: Boolean(horariosGuardados[key].abierto),
        apertura: horariosGuardados[key].apertura || base[key].apertura,
        cierre: horariosGuardados[key].cierre || base[key].cierre,
      };
    }
  });
  return base;
};

export default function Establecimiento(props) {
  const outlet = useOutletContext() || {};
  const negocioActivo = props.negocioActivo ?? outlet.negocioActivo ?? null;
  const negocios = props.negocios ?? outlet.negocios ?? [];
  const onCrearNegocio = props.onCrearNegocio ?? outlet.onCrearNegocio;
  const onActualizarNegocio = props.onActualizarNegocio ?? outlet.onActualizarNegocio;
  const onSeleccionarNegocio = props.onSeleccionarNegocio ?? outlet.onSeleccionarNegocio;

  const [modoCrear, setModoCrear] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Formulario del establecimiento
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    telefono: '',
    correo: '',
    direccion: '',
  });

  // Horarios configurables por el gerente
  const [horarios, setHorarios] = useState(crearHorariosVacios);

  // Catálogo de servicios reales
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    duracion_estimada_minutos: '',
  });
  const [guardandoServicio, setGuardandoServicio] = useState(false);

  // Equipo de técnicos reales
  const [tecnicos, setTecnicos] = useState([]);
  const [correoTecnico, setCorreoTecnico] = useState('');
  const [guardandoTecnico, setGuardandoTecnico] = useState(false);

  // Cargar detalle completo, horarios, servicios y técnicos del establecimiento activo
  useEffect(() => {
    if (!negocioActivo || modoCrear) return;

    setForm({
      nombre: negocioActivo.nombre || '',
      descripcion: negocioActivo.descripcion || '',
      telefono: negocioActivo.telefono || '',
      correo: negocioActivo.correo || '',
      direccion: negocioActivo.direccion || '',
    });
    setHorarios(normalizarHorarios(negocioActivo.horario_atencion));

    if (negocioActivo.id) {
      api
        .get(`/api/establecimientos/${negocioActivo.id}`)
        .then(({ data }) => {
          setForm({
            nombre: data.nombre || '',
            descripcion: data.descripcion || '',
            telefono: data.telefono || '',
            correo: data.correo || '',
            direccion: data.direccion || '',
          });
          setHorarios(normalizarHorarios(data.horario_atencion));
        })
        .catch(() => {});

      api
        .get(`/api/establecimientos/${negocioActivo.id}/servicios`)
        .then(({ data }) => setServicios(Array.isArray(data) ? data : []))
        .catch(() => setServicios([]));

      api
        .get(`/api/establecimientos/${negocioActivo.id}/tecnicos`)
        .then(({ data }) => setTecnicos(Array.isArray(data) ? data : []))
        .catch(() => setTecnicos([]));
    }
  }, [negocioActivo?.id, modoCrear]);

  const iniciarNuevoNegocio = () => {
    setModoCrear(true);
    setMensaje({ tipo: '', texto: '' });
    setForm({
      nombre: '',
      descripcion: '',
      telefono: '',
      correo: '',
      direccion: '',
    });
    setHorarios(crearHorariosVacios());
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleHorarioChange = (diaKey, campo, valor) => {
    setHorarios((prev) => ({
      ...prev,
      [diaKey]: {
        ...prev[diaKey],
        [campo]: valor,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      direccion: form.direccion.trim() || null,
      horario_atencion: horarios,
    };

    try {
      if (modoCrear || !negocioActivo) {
        const { data } = await api.post('/api/establecimientos', payload);
        if (onCrearNegocio) onCrearNegocio({ ...data, rol: 'administrador' });
        setModoCrear(false);
        setMensaje({ tipo: 'ok', texto: 'Nuevo establecimiento registrado correctamente.' });
      } else {
        const { data } = await api.put(`/api/establecimientos/${negocioActivo.id}`, payload);
        if (onActualizarNegocio) onActualizarNegocio({ ...negocioActivo, ...data });
        setMensaje({ tipo: 'ok', texto: 'Cambios y horarios del establecimiento guardados.' });
      }
    } catch (err) {
      const errores = err.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      setMensaje({
        tipo: 'error',
        texto: primerError || err.response?.data?.message || 'No se pudo guardar el establecimiento.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarServicio = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !nuevoServicio.nombre.trim()) return;
    setGuardandoServicio(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data } = await api.post(`/api/establecimientos/${negocioActivo.id}/servicios`, {
        nombre: nuevoServicio.nombre.trim(),
        descripcion: nuevoServicio.descripcion.trim() || null,
        precio_base: nuevoServicio.precio_base !== '' ? Number(nuevoServicio.precio_base) : null,
        duracion_estimada_minutos:
          nuevoServicio.duracion_estimada_minutos !== ''
            ? Number(nuevoServicio.duracion_estimada_minutos)
            : null,
      });
      setServicios((prev) => [...prev, data]);
      setNuevoServicio({
        nombre: '',
        descripcion: '',
        precio_base: '',
        duracion_estimada_minutos: '',
      });
      setMensaje({ tipo: 'ok', texto: 'Servicio agregado al catálogo.' });
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo agregar el servicio.',
      });
    } finally {
      setGuardandoServicio(false);
    }
  };

  const handleDesactivarServicio = async (servicioId) => {
    if (!negocioActivo?.id) return;
    try {
      await api.delete(`/api/establecimientos/${negocioActivo.id}/servicios/${servicioId}`);
      setServicios((prev) =>
        prev.map((s) => (s.id === servicioId ? { ...s, activo: false } : s))
      );
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo desactivar el servicio.',
      });
    }
  };

  const handleAgregarTecnico = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !correoTecnico.trim()) return;
    setGuardandoTecnico(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data } = await api.post(`/api/establecimientos/${negocioActivo.id}/tecnicos`, {
        correo: correoTecnico.trim(),
      });
      setTecnicos((prev) => {
        const existe = prev.some((t) => t.membresia_id === data.membresia_id);
        return existe
          ? prev.map((t) => (t.membresia_id === data.membresia_id ? data : t))
          : [...prev, data];
      });
      setCorreoTecnico('');
      setMensaje({ tipo: 'ok', texto: `Técnico ${data.nombre} vinculado al taller.` });
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo agregar al técnico.',
      });
    } finally {
      setGuardandoTecnico(false);
    }
  };

  const handleDesactivarTecnico = async (membresiaId) => {
    if (!negocioActivo?.id) return;
    try {
      await api.delete(`/api/establecimientos/${negocioActivo.id}/tecnicos/${membresiaId}`);
      setTecnicos((prev) =>
        prev.map((t) => (t.membresia_id === membresiaId ? { ...t, activo: false } : t))
      );
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo desactivar al técnico.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi establecimiento</h1>
          <p className="text-sm text-slate-500">
            Administra tus talleres, horarios de atención, catálogo de servicios y equipo de técnicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {negocioActivo?.slug && !modoCrear && (
            <Link
              to={`/t/${negocioActivo.slug}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-600 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Ver página pública</span>
            </Link>
          )}
          <button
            type="button"
            onClick={iniciarNuevoNegocio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar otro taller</span>
          </button>
        </div>
      </div>

      {/* Selector rápido de establecimientos */}
      {negocios.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-2">Tus talleres:</span>
          {negocios.map((neg) => {
            const activo = !modoCrear && negocioActivo?.id === neg.id;
            return (
              <button
                key={neg.id}
                type="button"
                onClick={() => {
                  setModoCrear(false);
                  setMensaje({ tipo: '', texto: '' });
                  onSeleccionarNegocio(neg);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activo
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {neg.nombre}
              </button>
            );
          })}
        </div>
      )}

      {mensaje.texto && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center gap-2 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Tarjeta 1: Datos generales y Horarios del establecimiento */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">
              {modoCrear || !negocioActivo ? 'Nuevo establecimiento' : 'Información general'}
            </h2>
          </div>
          {negocioActivo?.slug && !modoCrear && (
            <span className="text-xs font-mono text-slate-400">
              Slug: /t/{negocioActivo.slug}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del taller / establecimiento *
            </label>
            <input
              type="text"
              name="nombre"
              required
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. TechFix Celaya"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción de servicios y especialidades
            </label>
            <textarea
              name="descripcion"
              rows={2}
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe qué reparan, marcas que atienden y garantías..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono de contacto
            </label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="461 234 5678"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo público del taller
            </label>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="contacto@mitaller.mx"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dirección física
            </label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Calle, número, colonia y ciudad"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
            />
          </div>
        </div>

        {/* Sección de Horarios de atención configurables */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Horarios de atención</h3>
              <p className="text-xs text-slate-500">
                Activa los días que abre este establecimiento y define su horario.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {DIAS_SEMANA.map(({ key, label }) => {
              const dia = horarios[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                    dia.abierto
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-50/30 border-slate-100 opacity-75'
                  }`}
                >
                  <label className="inline-flex items-center gap-2.5 cursor-pointer min-w-[110px]">
                    <input
                      type="checkbox"
                      checked={dia.abierto}
                      onChange={(e) => handleHorarioChange(key, 'abierto', e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">{label}</span>
                  </label>

                  {dia.abierto ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={dia.apertura}
                        onChange={(e) => handleHorarioChange(key, 'apertura', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-brand-600"
                      />
                      <span className="text-xs text-slate-400">a</span>
                      <input
                        type="time"
                        value={dia.cierre}
                        onChange={(e) => handleHorarioChange(key, 'cierre', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {modoCrear && negocioActivo && (
            <button
              type="button"
              onClick={() => setModoCrear(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>
              {guardando
                ? 'Guardando...'
                : modoCrear || !negocioActivo
                ? 'Crear establecimiento'
                : 'Guardar cambios'}
            </span>
          </button>
        </div>
      </form>

      {/* Tarjetas 2 y 3: Servicios y Técnicos (solo si ya existe un taller seleccionado) */}
      {!modoCrear && negocioActivo?.id && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Catálogo de Servicios */}
          <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wrench className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Catálogo de servicios</h2>
                <p className="text-xs text-slate-500">
                  Deja el precio vacío si requiere diagnóstico previo.
                </p>
              </div>
            </div>

            <form onSubmit={handleAgregarServicio} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                required
                placeholder="Nombre del servicio *"
                value={nuevoServicio.nombre}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                className="sm:col-span-5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio (opcional)"
                value={nuevoServicio.precio_base}
                onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio_base: e.target.value })}
                className="sm:col-span-3 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
              />
              <input
                type="number"
                min="1"
                placeholder="Minutos"
                value={nuevoServicio.duracion_estimada_minutos}
                onChange={(e) =>
                  setNuevoServicio({ ...nuevoServicio, duracion_estimada_minutos: e.target.value })
                }
                className="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
              />
              <button
                type="submit"
                disabled={guardandoServicio}
                className="sm:col-span-2 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
              >
                Agregar
              </button>
            </form>

            {servicios.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aún no tienes servicios registrados en este taller.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {servicios.map((srv) => (
                  <div key={srv.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          srv.activo === false ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {srv.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {srv.precio_base !== null && srv.precio_base !== undefined
                          ? `$${Number(srv.precio_base).toFixed(0)} MXN`
                          : 'Previa revisión'}
                        {srv.duracion_estimada_minutos ? ` · ${srv.duracion_estimada_minutos} min` : ''}
                      </p>
                    </div>
                    {srv.activo !== false ? (
                      <button
                        type="button"
                        onClick={() => handleDesactivarServicio(srv.id)}
                        title="Desactivar servicio"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Inactivo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Equipo de Técnicos */}
          <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Equipo de técnicos</h2>
                <p className="text-xs text-slate-500">
                  Vincula cuentas ya registradas en RepairHub.
                </p>
              </div>
            </div>

            <form onSubmit={handleAgregarTecnico} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Correo del técnico *"
                value={correoTecnico}
                onChange={(e) => setCorreoTecnico(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
              />
              <button
                type="submit"
                disabled={guardandoTecnico}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Vincular</span>
              </button>
            </form>

            {tecnicos.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No hay técnicos vinculados todavía.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tecnicos.map((tec) => (
                  <div key={tec.membresia_id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          tec.activo === false ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {tec.nombre}
                      </p>
                      <p className="text-xs text-slate-500">{tec.correo}</p>
                    </div>
                    {tec.activo !== false ? (
                      <button
                        type="button"
                        onClick={() => handleDesactivarTecnico(tec.membresia_id)}
                        title="Desactivar técnico"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Inactivo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}