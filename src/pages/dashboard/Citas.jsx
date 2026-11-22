import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  Smartphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  ClipboardPlus,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const ESTADOS_BADGE = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
  convertida: 'bg-brand-50 text-brand-700 border-brand-200',
};

export default function Citas({ negocioActivo, citas = [], onActualizarEstado }) {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [listaCitas, setListaCitas] = useState(citas);

  useEffect(() => {
    setListaCitas(citas);
  }, [citas]);

  useEffect(() => {
    if (!negocioActivo?.id) return;
    api
      .get(`/api/establecimientos/${negocioActivo.id}/citas`)
      .then(({ data }) => {
        const items = data.data ?? data;
        if (Array.isArray(items)) setListaCitas(items);
      })
      .catch(() => {
        // Conserva citas locales en modo vista previa
      });
  }, [negocioActivo?.id]);

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      await api.patch(`/api/citas/${citaId}/estado`, { estado: nuevoEstado });
    } catch {
      // Actualización optimista local en modo diseño
    }
    setListaCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
    );
    if (onActualizarEstado) onActualizarEstado(citaId, nuevoEstado);
  };

  const citasFiltradas = listaCitas.filter((cita) => {
    const coincideEstado = filtroEstado === 'todas' || cita.estado === filtroEstado;
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      cita.cliente_nombre?.toLowerCase().includes(texto) ||
      cita.equipo_descripcion?.toLowerCase().includes(texto) ||
      cita.servicio_nombre?.toLowerCase().includes(texto);
    return coincideEstado && coincideBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de citas</h1>
          <p className="text-sm text-slate-600 mt-1">
            Administra las solicitudes agendadas desde tu enlace público.
          </p>
        </div>

        {negocioActivo?.slug && (
          <Link
            to={`/t/${negocioActivo.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition self-start"
          >
            <span>Abrir página pública de citas</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'confirmada', label: 'Confirmadas' },
            { id: 'cancelada', label: 'Canceladas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            placeholder="Buscar cliente o equipo..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      {/* Listado de Citas */}
      {citasFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-800">No hay citas en esta vista</p>
          <p className="text-sm text-slate-500">
            Prueba agendando una desde tu página pública{' '}
            <code className="text-brand-600">/t/{negocioActivo?.slug}</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {citasFiltradas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cita.cliente_nombre}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {cita.cliente_telefono}
                      {cita.cliente_correo && ` · ${cita.cliente_correo}`}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                      ESTADOS_BADGE[cita.estado] || ESTADOS_BADGE.pendiente
                    }`}
                  >
                    {cita.estado}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 border border-slate-100">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    <Smartphone className="h-4 w-4 text-brand-600 shrink-0" />
                    <span>
                      {cita.equipo_descripcion} —{' '}
                      <span className="text-brand-600">{cita.servicio_nombre}</span>
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      {new Date(cita.fecha_hora).toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </p>
                  {cita.notas && (
                    <p className="text-slate-500 pt-1 border-t border-slate-200/70 italic">
                      "{cita.notas}"
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {cita.estado === 'pendiente' && (
                  <>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(cita.id, 'cancelada')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(cita.id, 'confirmada')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar cita
                    </button>
                  </>
                )}

                {cita.estado === 'confirmada' && (
                  <button
                    type="button"
                    onClick={() => {
                      cambiarEstado(cita.id, 'convertida');
                      navigate('/dashboard/ordenes');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition cursor-pointer"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                    Crear orden de servicio
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}