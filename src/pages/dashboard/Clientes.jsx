import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Laptop,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';

export default function Clientes({ negocioActivo: negocioProp } = {}) {
  const outlet = useOutletContext() || {};
  const negocioActivo = negocioProp ?? outlet.negocioActivo ?? null;
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Modal / Formulario nuevo cliente
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    observaciones: '',
  });
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  // Formulario nuevo equipo para un cliente
  const [clienteParaEquipo, setClienteParaEquipo] = useState(null);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    categoria_id: '',
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    observaciones: '',
    caracteristicas: {},
  });
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  const cargarDatos = async () => {
    if (!negocioActivo?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resClientes, resEquipos, resCats] = await Promise.all([
        api.get(`/api/establecimientos/${negocioActivo.id}/clientes`),
        api.get(`/api/establecimientos/${negocioActivo.id}/equipos`),
        api.get('/api/categorias-equipos'),
      ]);
      setClientes(Array.isArray(resClientes.data) ? resClientes.data : []);
      setEquipos(Array.isArray(resEquipos.data) ? resEquipos.data : []);
      setCategorias(Array.isArray(resCats.data) ? resCats.data : []);
    } catch {
      // Mantiene estado actual si falla
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [negocioActivo?.id]);

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id) return;
    setMensaje({ tipo: '', texto: '' });

    if (!nuevoCliente.telefono.trim() && !nuevoCliente.correo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa al menos un teléfono o correo para el cliente.' });
      return;
    }

    setGuardandoCliente(true);
    try {
      const { data } = await api.post(`/api/establecimientos/${negocioActivo.id}/clientes`, {
        nombre: nuevoCliente.nombre.trim(),
        telefono: nuevoCliente.telefono.trim() || null,
        correo: nuevoCliente.correo.trim() || null,
        observaciones: nuevoCliente.observaciones.trim() || null,
      });
      setClientes((prev) => [data, ...prev]);
      setNuevoCliente({ nombre: '', telefono: '', correo: '', observaciones: '' });
      setMostrarFormCliente(false);
      setMensaje({ tipo: 'ok', texto: 'Cliente registrado correctamente.' });
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo registrar el cliente.',
      });
    } finally {
      setGuardandoCliente(false);
    }
  };

  const handleEliminarCliente = async (clienteId) => {
    if (!negocioActivo?.id) return;
    try {
      await api.delete(`/api/establecimientos/${negocioActivo.id}/clientes/${clienteId}`);
      setClientes((prev) => prev.filter((c) => c.id !== clienteId));
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo eliminar el cliente.',
      });
    }
  };

  const handleCrearEquipo = async (e) => {
    e.preventDefault();
    if (!negocioActivo?.id || !clienteParaEquipo) return;
    setGuardandoEquipo(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { data } = await api.post(`/api/establecimientos/${negocioActivo.id}/equipos`, {
        cliente_id: clienteParaEquipo.id,
        categoria_id: Number(nuevoEquipo.categoria_id),
        nombre: nuevoEquipo.nombre.trim() || null,
        marca: nuevoEquipo.marca.trim() || null,
        modelo: nuevoEquipo.modelo.trim() || null,
        numero_serie: nuevoEquipo.numero_serie.trim() || null,
        observaciones: nuevoEquipo.observaciones.trim() || null,
        caracteristicas: nuevoEquipo.caracteristicas,
      });
      setEquipos((prev) => [data, ...prev]);
      setClienteParaEquipo(null);
      setNuevoEquipo({
        categoria_id: '',
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        observaciones: '',
        caracteristicas: {},
      });
      setMensaje({ tipo: 'ok', texto: 'Equipo o unidad vinculado al cliente.' });
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'No se pudo registrar el equipo.',
      });
    } finally {
      setGuardandoEquipo(false);
    }
  };

  const categoriaSeleccionada = categorias.find(
    (c) => String(c.id) === String(nuevoEquipo.categoria_id)
  );

  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes y equipos</h1>
          <p className="text-sm text-slate-500">
            Directorio de clientes del taller y sus dispositivos, vehículos o electrodomésticos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarFormCliente((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {mensaje.texto && (
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

      {/* Formulario rápido para nuevo cliente */}
      {mostrarFormCliente && (
        <form
          onSubmit={handleCrearCliente}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">Registrar nuevo cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                placeholder="Ej. Diego Hernández"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                placeholder="461 123 4567"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={nuevoCliente.correo}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })}
                placeholder="cliente@correo.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormCliente(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoCliente}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {guardandoCliente ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      )}

      {/* Modal/Panel para agregar equipo a un cliente */}
      {clienteParaEquipo && (
        <form
          onSubmit={handleCrearEquipo}
          className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold !text-white">
              Registrar equipo para {clienteParaEquipo.nombre}
            </h2>
            <button
              type="button"
              onClick={() => setClienteParaEquipo(null)}
              className="text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoría *</label>
              <select
                required
                value={nuevoEquipo.categoria_id}
                onChange={(e) =>
                  setNuevoEquipo({ ...nuevoEquipo, categoria_id: e.target.value, caracteristicas: {} })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              >
                <option value="">Selecciona categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Marca</label>
              <input
                type="text"
                value={nuevoEquipo.marca}
                onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, marca: e.target.value })}
                placeholder="Ej. Apple, HP, Nissan"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Modelo</label>
              <input
                type="text"
                value={nuevoEquipo.modelo}
                onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, modelo: e.target.value })}
                placeholder="Ej. MacBook Pro 14, Versa"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">No. Serie / Placas</label>
              <input
                type="text"
                value={nuevoEquipo.numero_serie}
                onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, numero_serie: e.target.value })}
                placeholder="Opcional"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>

          {/* Campos dinámicos si la categoría los define en config/equipos.php */}
          {categoriaSeleccionada?.campos?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              {categoriaSeleccionada.campos.map((campo, idx) => {
                const clave =
                  typeof campo === 'string'
                    ? campo
                    : campo.nombre || campo.key || campo.campo || `campo_${idx}`;
                const etiqueta =
                  typeof campo === 'string'
                    ? campo.replace(/_/g, ' ')
                    : campo.etiqueta || campo.label || clave.replace(/_/g, ' ');

                return (
                  <div key={clave}>
                    <label className="block text-xs font-medium text-slate-300 mb-1 capitalize">
                      {etiqueta}
                    </label>
                    <input
                      type={typeof campo === 'object' && campo.tipo === 'number' ? 'number' : 'text'}
                      placeholder={typeof campo === 'object' ? campo.placeholder || '' : ''}
                      value={nuevoEquipo.caracteristicas[clave] || ''}
                      onChange={(e) =>
                        setNuevoEquipo({
                          ...nuevoEquipo,
                          caracteristicas: {
                            ...nuevoEquipo.caracteristicas,
                            [clave]: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardandoEquipo}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {guardandoEquipo ? 'Guardando equipo...' : 'Vincular equipo'}
            </button>
          </div>
        </form>
      )}

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre, correo o teléfono..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-brand-600"
        />
      </div>

      {/* Listado de Clientes y sus Equipos */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
          <Users className="h-9 w-9 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay clientes registrados</p>
          <p className="text-xs text-slate-500">
            Agrega tu primer cliente o espera a que agenden una cita desde tu página pública.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientesFiltrados.map((cliente) => {
            const equiposCliente = equipos.filter((eq) => eq.cliente_id === cliente.id);

            return (
              <div
                key={cliente.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cliente.nombre}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                        {cliente.telefono && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-brand-600" />
                            {cliente.telefono}
                          </span>
                        )}
                        {cliente.correo && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-brand-600" />
                            {cliente.correo}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarCliente(cliente.id)}
                      title="Eliminar cliente"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Equipos del cliente */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5 text-brand-600" />
                        Equipos / Unidades ({equiposCliente.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setClienteParaEquipo(cliente)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Agregar equipo</span>
                      </button>
                    </div>

                    {equiposCliente.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin equipos registrados aún.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {equiposCliente.map((eq) => (
                          <span
                            key={eq.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                          >
                            {[eq.marca, eq.modelo, eq.nombre].filter(Boolean).join(' ') || `Equipo #${eq.id}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}