import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Wrench,
  User,
  Smartphone,
  FileText,
  ExternalLink,
  X,
  CheckCircle2,
  Clock,
  DollarSign,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ESTADOS_ORDEN = {
  diagnostico: {
    label: 'En diagnóstico',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  cotizacion_pendiente: {
    label: 'Esperando aprobación',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  en_reparacion: {
    label: 'En reparación',
    badge: 'bg-brand-50 text-brand-700 border-brand-200',
  },
  listo: {
    label: 'Listo para entrega',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  entregado: {
    label: 'Entregado',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export default function Ordenes({
  negocioActivo,
  ordenes = [],
  onCrearOrden,
  onActualizarOrden,
}) {
  const [listaOrdenes, setListaOrdenes] = useState(ordenes);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  // Modal Nueva Orden
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    equipo_descripcion: '',
    serie_placa: '',
    falla_reportada: '',
    tecnico_asignado: 'Carlos Mendoza',
  });

  // Modal Gestionar Diagnóstico / Cotización
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [diagnosticoForm, setDiagnosticoForm] = useState({
    estado: 'diagnostico',
    diagnostico_tecnico: '',
    cotizacion_monto: '',
    cotizacion_detalle: '',
  });

  useEffect(() => {
    setListaOrdenes(ordenes);
  }, [ordenes]);

  useEffect(() => {
    if (!negocioActivo?.id) return;
    api
      .get(`/api/establecimientos/${negocioActivo.id}/ordenes`)
      .then(({ data }) => {
        const items = data.data ?? data;
        if (Array.isArray(items) && items.length > 0) {
          setListaOrdenes(items);
        }
      })
      .catch(() => {
        // Mantiene órdenes locales en modo diseño
      });
  }, [negocioActivo?.id]);

  const handleCrearOrden = async (e) => {
    e.preventDefault();
    const folioGenerado = `RH-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const creada = {
      id: Date.now(),
      folio: folioGenerado,
      establecimiento_nombre: negocioActivo?.nombre || 'TechFix Celaya',
      cliente_nombre: nuevaOrden.cliente_nombre.trim(),
      cliente_telefono: nuevaOrden.cliente_telefono.trim(),
      equipo_descripcion: nuevaOrden.equipo_descripcion.trim(),
      serie_placa: nuevaOrden.serie_placa.trim() || 'N/A',
      falla_reportada: nuevaOrden.falla_reportada.trim(),
      tecnico_asignado: nuevaOrden.tecnico_asignado.trim(),
      estado: 'diagnostico',
      diagnostico_tecnico: '',
      cotizacion_monto: null,
      cotizacion_detalle: '',
      cotizacion_estado: 'sin_enviar',
      fecha_ingreso: new Date().toISOString(),
    };

    try {
      const { data } = await api.post(
        `/api/establecimientos/${negocioActivo?.id || 1}/ordenes`,
        creada
      );
      const res = data.data ?? data;
      setListaOrdenes((prev) => [res, ...prev]);
      if (onCrearOrden) onCrearOrden(res);
    } catch {
      setListaOrdenes((prev) => [creada, ...prev]);
      if (onCrearOrden) onCrearOrden(creada);
    }

    setNuevaOrden({
      cliente_nombre: '',
      cliente_telefono: '',
      equipo_descripcion: '',
      serie_placa: '',
      falla_reportada: '',
      tecnico_asignado: 'Carlos Mendoza',
    });
    setModalNuevaOpen(false);
  };

  const abrirGestionOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setDiagnosticoForm({
      estado: orden.estado,
      diagnostico_tecnico: orden.diagnostico_tecnico || '',
      cotizacion_monto: orden.cotizacion_monto || '',
      cotizacion_detalle: orden.cotizacion_detalle || '',
    });
  };

  const handleGuardarGestion = async (e) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;

    const montoNum = diagnosticoForm.cotizacion_monto
      ? Number(diagnosticoForm.cotizacion_monto)
      : null;

    const estadoCotizacion =
      montoNum && ordenSeleccionada.cotizacion_estado !== 'aprobada'
        ? 'pendiente'
        : ordenSeleccionada.cotizacion_estado;

    const actualizada = {
      ...ordenSeleccionada,
      estado: diagnosticoForm.estado,
      diagnostico_tecnico: diagnosticoForm.diagnostico_tecnico.trim(),
      cotizacion_monto: montoNum,
      cotizacion_detalle: diagnosticoForm.cotizacion_detalle.trim(),
      cotizacion_estado: estadoCotizacion,
    };

    try {
      await api.put(`/api/ordenes/${ordenSeleccionada.id}`, actualizada);
    } catch {
      // Actualización optimista local
    }

    setListaOrdenes((prev) =>
      prev.map((o) => (o.id === actualizada.id ? actualizada : o))
    );
    if (onActualizarOrden) onActualizarOrden(actualizada);
    setOrdenSeleccionada(null);
  };

  const ordenesFiltradas = listaOrdenes.filter((o) => {
    const coincideEstado = filtroEstado === 'todas' || o.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    if (!q) return coincideEstado;
    return (
      o.folio?.toLowerCase().includes(q) ||
      o.cliente_nombre?.toLowerCase().includes(q) ||
      o.equipo_descripcion?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes de servicio</h1>
          <p className="text-sm text-slate-600 mt-1">
            Control de reparaciones, diagnósticos técnicos, cotizaciones y portal del cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevaOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva orden</span>
        </button>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'diagnostico', label: 'En diagnóstico' },
            { id: 'cotizacion_pendiente', label: 'Esperando aprobación' },
            { id: 'en_reparacion', label: 'En reparación' },
            { id: 'listo', label: 'Listas' },
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

        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar folio, cliente o equipo..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      {/* Listado de Órdenes */}
      {ordenesFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-800">No hay órdenes registradas</p>
          <p className="text-sm text-slate-500">
            Crea una nueva orden de servicio con el botón superior derecho.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {ordenesFiltradas.map((orden) => {
            const infoEstado = ESTADOS_ORDEN[orden.estado] || ESTADOS_ORDEN.diagnostico;
            return (
              <div
                key={orden.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                        #{orden.folio}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {orden.equipo_descripcion}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{orden.cliente_nombre}</span>
                        {orden.cliente_telefono && <span>· {orden.cliente_telefono}</span>}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${infoEstado.badge}`}
                    >
                      {infoEstado.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Falla reportada:</strong>{' '}
                      {orden.falla_reportada}
                    </p>
                    {orden.diagnostico_tecnico && (
                      <p className="text-slate-700">
                        <strong className="text-slate-900">Diagnóstico:</strong>{' '}
                        {orden.diagnostico_tecnico}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5 text-slate-400" />
                        Técnico: <strong className="text-slate-700">{orden.tecnico_asignado}</strong>
                      </span>

                      {orden.cotizacion_monto ? (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          ${orden.cotizacion_monto} MXN
                          {orden.cotizacion_estado === 'aprobada' && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700">
                              Aprobada
                            </span>
                          )}
                          {orden.cotizacion_estado === 'rechazada' && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700">
                              Rechazada
                            </span>
                          )}
                          {orden.cotizacion_estado === 'pendiente' && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700">
                              Por aprobar
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin cotización aún</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <Link
                    to={`/seguimiento/${orden.folio}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Vista del cliente ({orden.folio})</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => abrirGestionOrden(orden)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Diagnóstico y cotización</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nueva Orden de Servicio */}
      {modalNuevaOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Nueva orden de servicio</h2>
              <button
                type="button"
                onClick={() => setModalNuevaOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOrden} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevaOrden.cliente_nombre}
                    onChange={(e) =>
                      setNuevaOrden({ ...nuevaOrden, cliente_nombre: e.target.value })
                    }
                    placeholder="Ej. Sofía Martínez"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nuevaOrden.cliente_telefono}
                    onChange={(e) =>
                      setNuevaOrden({ ...nuevaOrden, cliente_telefono: e.target.value })
                    }
                    placeholder="461 123 4567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipo, vehículo o aparato *
                  </label>
                  <div className="relative">
                    <Smartphone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={nuevaOrden.equipo_descripcion}
                      onChange={(e) =>
                        setNuevaOrden({ ...nuevaOrden, equipo_descripcion: e.target.value })
                      }
                      placeholder="Ej. MacBook Air M1 / Nissan Versa"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serie, IMEI o Placa
                  </label>
                  <input
                    type="text"
                    value={nuevaOrden.serie_placa}
                    onChange={(e) =>
                      setNuevaOrden({ ...nuevaOrden, serie_placa: e.target.value })
                    }
                    placeholder="Ej. SN-882910"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Falla reportada al recibir *
                </label>
                <textarea
                  rows={3}
                  required
                  value={nuevaOrden.falla_reportada}
                  onChange={(e) =>
                    setNuevaOrden({ ...nuevaOrden, falla_reportada: e.target.value })
                  }
                  placeholder="Describe los síntomas con los que ingresa el equipo..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Técnico asignado
                </label>
                <input
                  type="text"
                  value={nuevaOrden.tecnico_asignado}
                  onChange={(e) =>
                    setNuevaOrden({ ...nuevaOrden, tecnico_asignado: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevaOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Generar orden con folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Actualizar Diagnóstico y Cotización */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Orden #{ordenSeleccionada.folio}
                </h2>
                <p className="text-xs text-slate-500">
                  {ordenSeleccionada.equipo_descripcion} · {ordenSeleccionada.cliente_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrdenSeleccionada(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarGestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado de la reparación
                </label>
                <select
                  value={diagnosticoForm.estado}
                  onChange={(e) =>
                    setDiagnosticoForm({ ...diagnosticoForm, estado: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                >
                  {Object.entries(ESTADOS_ORDEN).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico técnico (visible para el cliente)
                </label>
                <textarea
                  rows={3}
                  value={diagnosticoForm.diagnostico_tecnico}
                  onChange={(e) =>
                    setDiagnosticoForm({
                      ...diagnosticoForm,
                      diagnostico_tecnico: e.target.value,
                    })
                  }
                  placeholder="Explica qué pieza falló y qué reparación se recomienda..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-brand-600" />
                  <span>Cotización para aprobación del cliente</span>
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Monto total estimado (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={diagnosticoForm.cotizacion_monto}
                    onChange={(e) =>
                      setDiagnosticoForm({
                        ...diagnosticoForm,
                        cotizacion_monto: e.target.value,
                      })
                    }
                    placeholder="Ej. 2450"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Desglose de refacciones y mano de obra
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosticoForm.cotizacion_detalle}
                    onChange={(e) =>
                      setDiagnosticoForm({
                        ...diagnosticoForm,
                        cotizacion_detalle: e.target.value,
                      })
                    }
                    placeholder="Ej. Pantalla original + instalación y garantía de 90 días."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrdenSeleccionada(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Guardar y actualizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}