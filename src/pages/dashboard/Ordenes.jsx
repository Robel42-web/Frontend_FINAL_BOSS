import { useState, useEffect } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  FileText,
  Camera,
  Send,
  Stethoscope,
  X,
  Upload,
} from 'lucide-react';
import api from '../../services/api';

const ESTADOS_ORDEN = {
  recibido: {
    label: 'Recibido',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    siguientes: ['en_diagnostico', 'cancelado'],
  },
  en_diagnostico: {
    label: 'En diagnóstico',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    siguientes: ['esperando_autorizacion', 'no_reparable', 'cancelado'],
  },
  esperando_autorizacion: {
    label: 'Esperando autorización',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    siguientes: ['en_reparacion', 'en_diagnostico', 'no_reparable', 'cancelado'],
  },
  en_reparacion: {
    label: 'En reparación',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    siguientes: ['en_pruebas', 'no_reparable', 'cancelado'],
  },
  en_pruebas: {
    label: 'En pruebas',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    siguientes: ['listo_entrega', 'en_reparacion'],
  },
  listo_entrega: {
    label: 'Listo para entrega',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    siguientes: ['entregado'],
  },
  entregado: {
    label: 'Entregado',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    siguientes: [],
  },
  no_reparable: {
    label: 'No reparable',
    badge: 'bg-red-50 text-red-700 border-red-200',
    siguientes: ['entregado'],
  },
  cancelado: {
    label: 'Cancelado',
    badge: 'bg-red-100 text-red-800 border-red-300',
    siguientes: ['entregado'],
  },
};

export default function Ordenes({ ordenesDemo = [], negocioActivo: negocioProp }) {
  const location = useLocation();
  const outlet = useOutletContext() || {};
  const negocioActivo = negocioProp ?? outlet.negocioActivo ?? null;

  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Modal Nueva Orden
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [nuevaOrden, setNuevaOrden] = useState({
    cliente_id: '',
    equipo_id: '',
    cita_id: '',
    tecnico_membresia_id: '',
    problema_reportado: '',
    prioridad: 'normal',
    estado_fisico_inicial: '',
    accesorios_recibidos: '',
    fecha_estimada: '',
  });
  const [creandoOrden, setCreandoOrden] = useState(false);

  // Modal Gestión Detallada de una Orden (Estado, Diagnóstico, Notas y Evidencias)
  const [ordenActiva, setOrdenActiva] = useState(null);
  const [detalleOrden, setDetalleOrden] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Subformularios dentro del detalle
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [descEstado, setDescEstado] = useState('');
  const [visibleEstado, setVisibleEstado] = useState(true);

  const [diagForm, setDiagForm] = useState({ descripcion: '', reparacion_sugerida: '' });
  const [notaForm, setNotaForm] = useState({ descripcion: '', visible_cliente: true });
  const [archivoEvidencia, setArchivoEvidencia] = useState(null);
  const [descEvidencia, setDescEvidencia] = useState('');
  const [visibleEvidencia, setVisibleEvidencia] = useState(true);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const cargarTodo = async () => {
    if (!negocioActivo?.id) {
      setOrdenes(ordenesDemo);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [resOrd, resCli, resEq] = await Promise.all([
        api.get(`/api/establecimientos/${negocioActivo.id}/ordenes`),
        api.get(`/api/establecimientos/${negocioActivo.id}/clientes`),
        api.get(`/api/establecimientos/${negocioActivo.id}/equipos`),
      ]);
      setOrdenes(Array.isArray(resOrd.data) ? resOrd.data : []);
      setClientes(Array.isArray(resCli.data) ? resCli.data : []);
      setEquipos(Array.isArray(resEq.data) ? resEq.data : []);

      // Técnicos (solo si es administrador)
      api
        .get(`/api/establecimientos/${negocioActivo.id}/tecnicos`)
        .then(({ data }) => setTecnicos(Array.isArray(data) ? data.filter((t) => t.activo) : []))
        .catch(() => setTecnicos([]));
    } catch {
      setOrdenes(ordenesDemo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, [negocioActivo?.id]);

  // Si venimos desde "Crear orden" en la bandeja de Citas
  useEffect(() => {
    const desdeCita = location.state?.desdeCita;
    if (desdeCita) {
      setMostrarNueva(true);
      setNuevaOrden((prev) => ({
        ...prev,
        cliente_id: desdeCita.cliente_id ? String(desdeCita.cliente_id) : '',
        cita_id: desdeCita.cita_id ? String(desdeCita.cita_id) : '',
        problema_reportado: desdeCita.descripcion_problema || '',
      }));
    }
  }, [location.state]);

  const handleCrearOrden = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id) return;
    setCreandoOrden(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const payload = {
        cliente_id: Number(nuevaOrden.cliente_id),
        equipo_id: Number(nuevaOrden.equipo_id),
        cita_id: nuevaOrden.cita_id ? Number(nuevaOrden.cita_id) : null,
        tecnico_membresia_id: nuevaOrden.tecnico_membresia_id
          ? Number(nuevaOrden.tecnico_membresia_id)
          : null,
        problema_reportado: nuevaOrden.problema_reportado.trim(),
        prioridad: nuevaOrden.prioridad,
        estado_fisico_inicial: nuevaOrden.estado_fisico_inicial.trim() || null,
        accesorios_recibidos: nuevaOrden.accesorios_recibidos.trim() || null,
        fecha_estimada: nuevaOrden.fecha_estimada || null,
      };

      const { data } = await api.post(`/api/establecimientos/${negocioActivo.id}/ordenes`, payload);
      setMostrarNueva(false);
      setNuevaOrden({
        cliente_id: '',
        equipo_id: '',
        cita_id: '',
        tecnico_membresia_id: '',
        problema_reportado: '',
        prioridad: 'normal',
        estado_fisico_inicial: '',
        accesorios_recibidos: '',
        fecha_estimada: '',
      });
      setMensaje({ tipo: 'ok', texto: `Orden #${data.folio} creada correctamente.` });
      cargarTodo();
    } catch (err) {
      const errores = err.response?.data?.errors;
      const primerError = errores ? Object.values(errores)[0]?.[0] : null;
      setMensaje({
        tipo: 'error',
        texto: primerError || err.response?.data?.message || 'No se pudo crear la orden.',
      });
    } finally {
      setCreandoOrden(false);
    }
  };

  const abrirDetalleOrden = async (orden) => {
    setOrdenActiva(orden);
    setDetalleOrden(null);
    setEvidencias([]);
    setNuevoEstado('');
    setDescEstado('');
    setMensaje({ tipo: '', texto: '' });

    if (!negocioActivo?.id) {
      setDetalleOrden(orden);
      return;
    }

    setCargandoDetalle(true);
    try {
      const [resDet, resEv] = await Promise.all([
        api.get(`/api/establecimientos/${negocioActivo.id}/ordenes/${orden.id}`),
        api.get(`/api/establecimientos/${negocioActivo.id}/ordenes/${orden.id}/evidencias`),
      ]);
      setDetalleOrden(resDet.data);
      setEvidencias(Array.isArray(resEv.data) ? resEv.data : []);
    } catch {
      setDetalleOrden(orden);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleCambiarEstado = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !ordenActiva || !nuevoEstado || !descEstado.trim()) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data } = await api.post(
        `/api/establecimientos/${negocioActivo.id}/ordenes/${ordenActiva.id}/estado`,
        {
          estado: nuevoEstado,
          descripcion: descEstado.trim(),
          visible_cliente: visibleEstado,
        }
      );
      setOrdenActiva((prev) => ({ ...prev, estado: data.estado }));
      setDescEstado('');
      setNuevoEstado('');
      setMensaje({ tipo: 'ok', texto: 'Estado de la orden actualizado.' });
      await abrirDetalleOrden({ ...ordenActiva, estado: data.estado });
      cargarTodo();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo cambiar el estado.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleGuardarDiagnostico = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !ordenActiva || !diagForm.descripcion.trim()) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await api.post(
        `/api/establecimientos/${negocioActivo.id}/ordenes/${ordenActiva.id}/diagnosticos`,
        {
          descripcion: diagForm.descripcion.trim(),
          reparacion_sugerida: diagForm.reparacion_sugerida.trim() || null,
        }
      );
      setDiagForm({ descripcion: '', reparacion_sugerida: '' });
      setMensaje({ tipo: 'ok', texto: 'Diagnóstico técnico guardado.' });
      await abrirDetalleOrden(ordenActiva);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo guardar el diagnóstico.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleGuardarNota = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !ordenActiva || !notaForm.descripcion.trim()) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      await api.post(`/api/establecimientos/${negocioActivo.id}/ordenes/${ordenActiva.id}/notas`, {
        descripcion: notaForm.descripcion.trim(),
        visible_cliente: notaForm.visible_cliente,
      });
      setNotaForm({ descripcion: '', visible_cliente: true });
      setMensaje({ tipo: 'ok', texto: 'Nota agregada al historial de la orden.' });
      await abrirDetalleOrden(ordenActiva);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo agregar la nota.',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleSubirEvidencia = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !ordenActiva || !archivoEvidencia) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const formData = new FormData();
      formData.append('archivo', archivoEvidencia);
      if (descEvidencia.trim()) formData.append('descripcion', descEvidencia.trim());
      formData.append('visible_cliente', visibleEvidencia ? '1' : '0');

      await api.post(
        `/api/establecimientos/${negocioActivo.id}/ordenes/${ordenActiva.id}/evidencias`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setArchivoEvidencia(null);
      setDescEvidencia('');
      setMensaje({ tipo: 'ok', texto: 'Evidencia fotográfica subida a Supabase.' });
      await abrirDetalleOrden(ordenActiva);
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo subir la imagen (máx 5MB, JPG/PNG/WEBP).',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const equiposDelClienteSeleccionado = equipos.filter(
    (eq) => String(eq.cliente_id) === String(nuevaOrden.cliente_id)
  );

  const ordenesFiltradas = ordenes.filter((o) => {
    const coincideEstado = filtroEstado === 'todas' || o.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    if (!q) return coincideEstado;

    return (
      coincideEstado &&
      (o.folio?.toLowerCase().includes(q) ||
        o.cliente_nombre?.toLowerCase().includes(q) ||
        o.equipo_marca?.toLowerCase().includes(q) ||
        o.equipo_modelo?.toLowerCase().includes(q) ||
        o.problema_reportado?.toLowerCase().includes(q))
    );
  });

  const estadoActualInfo = ordenActiva
    ? ESTADOS_ORDEN[ordenActiva.estado] || ESTADOS_ORDEN.recibido
    : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes de servicio</h1>
          <p className="text-sm text-slate-500">
            Control de reparaciones, diagnósticos técnicos, evidencias fotográficas y avances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarNueva((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva orden</span>
        </button>
      </div>

      {mensaje.texto && !ordenActiva && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
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

      {/* Formulario Nueva Orden */}
      {mostrarNueva && (
        <form
          onSubmit={handleCrearOrden}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Recepción de equipo / Nueva orden de servicio
            </h2>
            <button
              type="button"
              onClick={() => setMostrarNueva(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente *</label>
              <select
                required
                value={nuevaOrden.cliente_id}
                onChange={(e) =>
                  setNuevaOrden({ ...nuevaOrden, cliente_id: e.target.value, equipo_id: '' })
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="">Selecciona cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Equipo / Unidad *
              </label>
              <select
                required
                disabled={!nuevaOrden.cliente_id}
                value={nuevaOrden.equipo_id}
                onChange={(e) => setNuevaOrden({ ...nuevaOrden, equipo_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600 disabled:bg-slate-100"
              >
                <option value="">
                  {nuevaOrden.cliente_id
                    ? equiposDelClienteSeleccionado.length > 0
                      ? 'Selecciona equipo...'
                      : 'Este cliente no tiene equipos (regístralo en Clientes)'
                    : 'Elige primero un cliente'}
                </option>
                {equiposDelClienteSeleccionado.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {[eq.marca, eq.modelo, eq.nombre].filter(Boolean).join(' ') || `Equipo #${eq.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Técnico asignado
              </label>
              <select
                value={nuevaOrden.tecnico_membresia_id}
                onChange={(e) =>
                  setNuevaOrden({ ...nuevaOrden, tecnico_membresia_id: e.target.value })
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="">Sin asignar todavía</option>
                {tecnicos.map((t) => (
                  <option key={t.membresia_id} value={t.membresia_id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problema reportado por el cliente *
              </label>
              <input
                type="text"
                required
                value={nuevaOrden.problema_reportado}
                onChange={(e) =>
                  setNuevaOrden({ ...nuevaOrden, problema_reportado: e.target.value })
                }
                placeholder="Ej. Pantalla estrellada y no da imagen al encender"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
              <select
                value={nuevaOrden.prioridad}
                onChange={(e) => setNuevaOrden({ ...nuevaOrden, prioridad: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta (Urgente)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado físico inicial
              </label>
              <input
                type="text"
                value={nuevaOrden.estado_fisico_inicial}
                onChange={(e) =>
                  setNuevaOrden({ ...nuevaOrden, estado_fisico_inicial: e.target.value })
                }
                placeholder="Ej. Rayones leves en tapa"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accesorios recibidos
              </label>
              <input
                type="text"
                value={nuevaOrden.accesorios_recibidos}
                onChange={(e) =>
                  setNuevaOrden({ ...nuevaOrden, accesorios_recibidos: e.target.value })
                }
                placeholder="Ej. Cargador original y funda"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha estimada de entrega
              </label>
              <input
                type="datetime-local"
                value={nuevaOrden.fecha_estimada}
                onChange={(e) => setNuevaOrden({ ...nuevaOrden, fecha_estimada: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarNueva(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creandoOrden}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {creandoOrden ? 'Generando folio...' : 'Crear orden de servicio'}
            </button>
          </div>
        </form>
      )}

      {/* Filtros y buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'recibido', label: 'Recibidas' },
            { id: 'en_diagnostico', label: 'En diagnóstico' },
            { id: 'esperando_autorizacion', label: 'Esperando autorización' },
            { id: 'en_reparacion', label: 'En reparación' },
            { id: 'listo_entrega', label: 'Listas' },
            { id: 'entregado', label: 'Entregadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
            placeholder="Buscar folio, cliente o equipo..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      {/* Listado de Órdenes */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
          <Wrench className="h-9 w-9 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay órdenes en esta vista</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ordenesFiltradas.map((orden) => {
            const est = ESTADOS_ORDEN[orden.estado] || ESTADOS_ORDEN.recibido;
            const equipoLabel =
              [orden.equipo_marca, orden.equipo_modelo].filter(Boolean).join(' ') ||
              orden.equipo_descripcion ||
              'Equipo en taller';

            return (
              <div
                key={orden.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg">
                      #{orden.folio}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${est.badge}`}>
                      {est.label}
                    </span>
                    {orden.prioridad === 'alta' && (
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-bold">
                        Prioridad Alta
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{equipoLabel}</h3>
                    <p className="text-xs text-slate-500">
                      Cliente: <strong className="text-slate-700">{orden.cliente_nombre}</strong>
                      {orden.tecnico_nombre ? ` · Técnico: ${orden.tecnico_nombre}` : ''}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600">
                    <strong className="text-slate-800">Falla reportada:</strong>{' '}
                    {orden.problema_reportado || orden.falla_reportada}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Link
                    to={`/seguimiento/${orden.folio}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Vista cliente ({orden.folio})</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => abrirDetalleOrden(orden)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Gestionar orden</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Gestión Integral de la Orden */}
      {ordenActiva && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold !text-white">Orden #{ordenActiva.folio}</h2>
                  {estadoActualInfo && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white">
                      {estadoActualInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Cliente: {ordenActiva.cliente_nombre} ·{' '}
                  {[ordenActiva.equipo_marca, ordenActiva.equipo_modelo].filter(Boolean).join(' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrdenActiva(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              {mensaje.texto && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
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

              {cargandoDetalle ? (
                <div className="py-8 flex justify-center">
                  <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* 1. Cambiar estado con comentario obligatorio */}
                  {estadoActualInfo?.siguientes?.length > 0 && (
                    <form
                      onSubmit={handleCambiarEstado}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        1. Avanzar estado de la reparación
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          required
                          value={nuevoEstado}
                          onChange={(e) => setNuevoEstado(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        >
                          <option value="">Selecciona siguiente estado...</option>
                          {estadoActualInfo.siguientes.map((st) => (
                            <option key={st} value={st}>
                              {ESTADOS_ORDEN[st]?.label || st}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          required
                          value={descEstado}
                          onChange={(e) => setDescEstado(e.target.value)}
                          placeholder="Comentario del cambio (obligatorio) *"
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleEstado}
                            onChange={(e) => setVisibleEstado(e.target.checked)}
                            className="rounded text-brand-600"
                          />
                          <span>Mostrar este avance al cliente en su portal</span>
                        </label>
                        <button
                          type="submit"
                          disabled={procesandoAccion}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Actualizar estado
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. Registrar Diagnóstico Técnico */}
                  <form
                    onSubmit={handleGuardarDiagnostico}
                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-brand-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        2. Diagnóstico técnico
                      </h3>
                    </div>
                    <textarea
                      required
                      rows={2}
                      value={diagForm.descripcion}
                      onChange={(e) => setDiagForm({ ...diagForm, descripcion: e.target.value })}
                      placeholder="Describe el hallazgo técnico detallado..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={diagForm.reparacion_sugerida}
                        onChange={(e) =>
                          setDiagForm({ ...diagForm, reparacion_sugerida: e.target.value })
                        }
                        placeholder="Reparación o refacción sugerida (opcional)"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                      <button
                        type="submit"
                        disabled={procesandoAccion}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Guardar diagnóstico
                      </button>
                    </div>

                    {detalleOrden?.diagnosticos?.length > 0 && (
                      <div className="pt-2 space-y-1.5 border-t border-slate-100">
                        {detalleOrden.diagnosticos.map((d) => (
                          <div key={d.id} className="text-xs bg-slate-50 p-2.5 rounded-lg">
                            <p className="text-slate-800 font-medium">{d.descripcion}</p>
                            {d.reparacion_sugerida && (
                              <p className="text-slate-500 mt-0.5">
                                Sugerencia: {d.reparacion_sugerida}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </form>

                  {/* 3. Subir Evidencia Fotográfica a Supabase */}
                  <form
                    onSubmit={handleSubirEvidencia}
                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-brand-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        3. Evidencias fotográficas (Supabase Storage)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        onChange={(e) => setArchivoEvidencia(e.target.files?.[0] || null)}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                      />
                      <input
                        type="text"
                        value={descEvidencia}
                        onChange={(e) => setDescEvidencia(e.target.value)}
                        placeholder="Descripción de la foto (opcional)"
                        className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleEvidencia}
                          onChange={(e) => setVisibleEvidencia(e.target.checked)}
                          className="rounded text-brand-600"
                        />
                        <span>Visible para el cliente</span>
                      </label>
                      <button
                        type="submit"
                        disabled={procesandoAccion || !archivoEvidencia}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Subir foto</span>
                      </button>
                    </div>

                    {evidencias.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        {evidencias.map((ev) => (
                          <a
                            key={ev.id}
                            href={`/api/establecimientos/${negocioActivo.id}/ordenes/${ordenActiva.id}/evidencias/${ev.id}/archivo`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 text-xs flex flex-col justify-between gap-1 bg-slate-50"
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {ev.nombre_original || `Evidencia #${ev.id}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {ev.descripcion || (ev.visible_cliente ? 'Pública' : 'Interna')}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </form>

                  {/* 4. Notas e Historial de Seguimiento */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. Notas e historial de movimientos
                    </h3>

                    <form onSubmit={handleGuardarNota} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={notaForm.descripcion}
                        onChange={(e) => setNotaForm({ ...notaForm, descripcion: e.target.value })}
                        placeholder="Escribe una nota de avance..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600"
                      />
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 px-2">
                        <input
                          type="checkbox"
                          checked={notaForm.visible_cliente}
                          onChange={(e) =>
                            setNotaForm({ ...notaForm, visible_cliente: e.target.checked })
                          }
                        />
                        <span>Visible cliente</span>
                      </label>
                      <button
                        type="submit"
                        disabled={procesandoAccion}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Agregar</span>
                      </button>
                    </form>

                    {detalleOrden?.seguimientos?.length > 0 && (
                      <div className="divide-y divide-slate-100 pt-2">
                        {detalleOrden.seguimientos.map((seg) => (
                          <div key={seg.id} className="py-2 flex items-start justify-between gap-2 text-xs">
                            <div>
                              <span className="font-semibold text-slate-800">{seg.descripcion}</span>
                              <p className="text-[11px] text-slate-400">
                                Estado: {ESTADOS_ORDEN[seg.estado]?.label || seg.estado} ·{' '}
                                {seg.visible_cliente ? 'Visible al cliente' : 'Nota interna'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}