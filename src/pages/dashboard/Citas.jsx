import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  UserX,
  Wrench,
  AlertCircle,
  Search,
} from 'lucide-react';
import api from '../../services/api';

const ESTADOS_INFO = {
  pendiente: {
    label: 'Pendiente',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  confirmada: {
    label: 'Confirmada',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completada: {
    label: 'Completada',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelada: {
    label: 'Cancelada',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  no_asistio: {
    label: 'No asistió',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export default function Citas({ citasDemo = [], onActualizarEstadoCita, negocioActivo: negocioProp }) {
  const navigate = useNavigate();
  const outlet = useOutletContext() || {};
  const negocioActivo = negocioProp ?? outlet.negocioActivo ?? null;
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    if (!negocioActivo?.id) {
      setCitas(citasDemo);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get(`/api/establecimientos/${negocioActivo.id}/citas`)
      .then(({ data }) => {
        setCitas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCitas(citasDemo);
      })
      .finally(() => setLoading(false));
  }, [negocioActivo?.id]);

  const cambiarEstado = async (cita, nuevoEstado) => {
    setError('');
    setActualizandoId(cita.id);

    try {
      if (negocioActivo?.id) {
        await api.put(`/api/establecimientos/${negocioActivo.id}/citas/${cita.id}`, {
          estado: nuevoEstado,
        });
      }
      setCitas((prev) =>
        prev.map((c) => (c.id === cita.id ? { ...c, estado: nuevoEstado } : c))
      );
      if (onActualizarEstadoCita) onActualizarEstadoCita(cita.id, nuevoEstado);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado de la cita.');
    } finally {
      setActualizandoId(null);
    }
  };

  const convertirEnOrden = (cita) => {
    navigate('/dashboard/ordenes', {
      state: {
        desdeCita: {
          cita_id: cita.id,
          cliente_id: cita.cliente_id,
          cliente_nombre: cita.cliente_nombre,
          cliente_telefono: cita.cliente_telefono,
          servicio_id: cita.servicio_id,
          descripcion_problema: cita.descripcion_problema || cita.notas || '',
        },
      },
    });
  };

  const citasFiltradas = citas.filter((c) => {
    const coincideEstado = filtroEstado === 'todas' || c.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    if (!q) return coincideEstado;

    return (
      coincideEstado &&
      (c.cliente_nombre?.toLowerCase().includes(q) ||
        c.servicio_nombre?.toLowerCase().includes(q) ||
        (c.descripcion_problema || c.notas || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bandeja de citas</h1>
          <p className="text-sm text-slate-500">
            Confirma solicitudes públicas, registra asistencia y convierte citas en órdenes de servicio.
          </p>
        </div>
      </div>

      {/* Filtros y buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'confirmada', label: 'Confirmadas' },
            { id: 'completada', label: 'Completadas' },
            { id: 'cancelada', label: 'Canceladas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, servicio o falla..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : citasFiltradas.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
          <Calendar className="h-9 w-9 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay citas en esta vista</p>
          <p className="text-xs text-slate-500">
            Las solicitudes que los clientes agenden desde tu página pública aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {citasFiltradas.map((cita) => {
            const info = ESTADOS_INFO[cita.estado] || ESTADOS_INFO.pendiente;
            const fechaStr = (cita.fecha_programada || cita.fecha_hora || '').replace('T', ' ').slice(0, 16);
            const problema = cita.descripcion_problema || cita.notas;
            const cargandoEsta = actualizandoId === cita.id;

            return (
              <div
                key={cita.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.badge}`}>
                      {info.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-brand-600" />
                      {fechaStr}
                    </span>
                    {cita.servicio_nombre && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {cita.servicio_nombre}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cita.cliente_nombre}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-0.5">
                      {cita.cliente_telefono && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {cita.cliente_telefono}
                        </span>
                      )}
                      {cita.cliente_correo && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {cita.cliente_correo}
                        </span>
                      )}
                    </div>
                  </div>

                  {problema && (
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong className="text-slate-800">Falla / Equipo:</strong> {problema}
                    </p>
                  )}
                </div>

                {/* Acciones permitidas según las transiciones del backend */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {cita.estado === 'pendiente' && (
                    <>
                      <button
                        type="button"
                        disabled={cargandoEsta}
                        onClick={() => cambiarEstado(cita, 'confirmada')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirmar</span>
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEsta}
                        onClick={() => cambiarEstado(cita, 'cancelada')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}

                  {cita.estado === 'confirmada' && (
                    <>
                      <button
                        type="button"
                        onClick={() => convertirEnOrden(cita)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Wrench className="h-4 w-4" />
                        <span>Crear orden</span>
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEsta}
                        onClick={() => cambiarEstado(cita, 'completada')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completar</span>
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEsta}
                        onClick={() => cambiarEstado(cita, 'no_asistio')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" />
                        <span>No asistió</span>
                      </button>
                      <button
                        type="button"
                        disabled={cargandoEsta}
                        onClick={() => cambiarEstado(cita, 'cancelada')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}