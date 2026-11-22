import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Smartphone,
  Plus,
  X,
  Wrench,
  Hash,
  ClipboardPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CLIENTES_DEMO = [
  {
    id: 1,
    nombre: 'Laura Gómez',
    telefono: '461 555 0192',
    correo: 'laura.gomez@gmail.com',
    notas: 'Cliente frecuente, prefiere contacto por WhatsApp.',
    equipos: [
      {
        id: 11,
        tipo: 'Laptop',
        marca_modelo: 'Lenovo IdeaPad Gaming 3',
        serie_placa: 'SN-LNV883920',
        notas: 'Cargador original incluido',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Marco Antonio Ruiz',
    telefono: '461 889 3410',
    correo: 'marco.ruiz@outlook.com',
    notas: '',
    equipos: [
      {
        id: 21,
        tipo: 'Smartphone',
        marca_modelo: 'iPhone 13 Pro',
        serie_placa: 'IMEI-359820114',
        notas: 'Color azul sierra, 256GB',
      },
      {
        id: 22,
        tipo: 'Consola',
        marca_modelo: 'PlayStation 5',
        serie_placa: 'SN-PS500912',
        notas: '',
      },
    ],
  },
];

export default function Clientes({ negocioActivo, clientes = [], onActualizarClientes }) {
  const navigate = useNavigate();
  const [listaClientes, setListaClientes] = useState(
    clientes.length > 0 ? clientes : CLIENTES_DEMO
  );
  const [busqueda, setBusqueda] = useState('');

  // Modal Nuevo Cliente
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    notas: '',
    equipo_tipo: 'Equipo / Dispositivo',
    equipo_marca_modelo: '',
    equipo_serie_placa: '',
  });

  // Modal Agregar Equipo a Cliente existente
  const [clienteParaEquipo, setClienteParaEquipo] = useState(null);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    tipo: 'Equipo / Dispositivo',
    marca_modelo: '',
    serie_placa: '',
    notas: '',
  });

  useEffect(() => {
    if (clientes.length > 0) setListaClientes(clientes);
  }, [clientes]);

  useEffect(() => {
    if (!negocioActivo?.id) return;
    api
      .get(`/api/establecimientos/${negocioActivo.id}/clientes`)
      .then(({ data }) => {
        const items = data.data ?? data;
        if (Array.isArray(items) && items.length > 0) {
          setListaClientes(items);
        }
      })
      .catch(() => {
        // Conserva datos locales en modo vista previa
      });
  }, [negocioActivo?.id]);

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    const equiposIniciales = nuevoCliente.equipo_marca_modelo.trim()
      ? [
          {
            id: Date.now() + 1,
            tipo: nuevoCliente.equipo_tipo,
            marca_modelo: nuevoCliente.equipo_marca_modelo.trim(),
            serie_placa: nuevoCliente.equipo_serie_placa.trim() || 'Sin serie',
            notas: '',
          },
        ]
      : [];

    const payload = {
      id: Date.now(),
      establecimiento_id: negocioActivo?.id || 1,
      nombre: nuevoCliente.nombre.trim(),
      telefono: nuevoCliente.telefono.trim(),
      correo: nuevoCliente.correo.trim(),
      notas: nuevoCliente.notas.trim(),
      equipos: equiposIniciales,
    };

    try {
      const { data } = await api.post(
        `/api/establecimientos/${negocioActivo?.id || 1}/clientes`,
        payload
      );
      const creado = data.data ?? data;
      const actualizada = [creado, ...listaClientes];
      setListaClientes(actualizada);
      if (onActualizarClientes) onActualizarClientes(actualizada);
    } catch {
      const actualizada = [payload, ...listaClientes];
      setListaClientes(actualizada);
      if (onActualizarClientes) onActualizarClientes(actualizada);
    }

    setNuevoCliente({
      nombre: '',
      telefono: '',
      correo: '',
      notas: '',
      equipo_tipo: 'Equipo / Dispositivo',
      equipo_marca_modelo: '',
      equipo_serie_placa: '',
    });
    setModalClienteOpen(false);
  };

  const handleAgregarEquipo = async (e) => {
    e.preventDefault();
    if (!clienteParaEquipo) return;

    const equipoCreado = {
      id: Date.now(),
      tipo: nuevoEquipo.tipo,
      marca_modelo: nuevoEquipo.marca_modelo.trim(),
      serie_placa: nuevoEquipo.serie_placa.trim() || 'Sin serie',
      notas: nuevoEquipo.notas.trim(),
    };

    try {
      await api.post(`/api/clientes/${clienteParaEquipo.id}/equipos`, equipoCreado);
    } catch {
      // Actualización local en modo vista previa
    }

    const actualizada = listaClientes.map((c) =>
      c.id === clienteParaEquipo.id
        ? { ...c, equipos: [...(c.equipos || []), equipoCreado] }
        : c
    );
    setListaClientes(actualizada);
    if (onActualizarClientes) onActualizarClientes(actualizada);

    setNuevoEquipo({
      tipo: 'Equipo / Dispositivo',
      marca_modelo: '',
      serie_placa: '',
      notas: '',
    });
    setClienteParaEquipo(null);
  };

  const clientesFiltrados = listaClientes.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q) ||
      c.equipos?.some(
        (eq) =>
          eq.marca_modelo?.toLowerCase().includes(q) ||
          eq.serie_placa?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes y equipos</h1>
          <p className="text-sm text-slate-600 mt-1">
            Directorio de clientes y registro técnico de sus equipos, vehículos o aparatos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalClienteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer self-start"
        >
          <UserPlus className="h-4 w-4" />
          <span>Registrar cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono, modelo o serie/placa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
          />
        </div>

        <span className="text-xs font-medium text-slate-500">
          {clientesFiltrados.length}{' '}
          {clientesFiltrados.length === 1 ? 'cliente registrado' : 'clientes registrados'}
        </span>
      </div>

      {/* Listado de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-800">
            No se encontraron clientes
          </p>
          <p className="text-sm text-slate-500">
            Registra un nuevo cliente con el botón superior derecho.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {(cliente.nombre || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cliente.nombre}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {cliente.telefono}
                        </span>
                        {cliente.correo && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {cliente.correo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setClienteParaEquipo(cliente)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Equipo</span>
                  </button>
                </div>

                {cliente.notas && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    {cliente.notas}
                  </p>
                )}

                {/* Equipos registrados del cliente */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Equipos / Unidades registradas ({cliente.equipos?.length || 0})
                  </p>

                  {!cliente.equipos || cliente.equipos.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      Aún no tiene equipos registrados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cliente.equipos.map((eq) => (
                        <div
                          key={eq.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                              <Wrench className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                              <span>{eq.marca_modelo}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{eq.tipo}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 font-mono">
                                <Hash className="h-3 w-3" />
                                {eq.serie_placa}
                              </span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/ordenes')}
                            title="Crear orden de servicio para este equipo"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:border-brand-600 hover:text-brand-600 transition cursor-pointer shrink-0"
                          >
                            <ClipboardPlus className="h-3.5 w-3.5" />
                            <span>Nueva orden</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Registrar Nuevo Cliente */}
      {modalClienteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Registrar nuevo cliente</h2>
              <button
                type="button"
                onClick={() => setModalClienteOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCliente} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoCliente.nombre}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                  }
                  placeholder="Ej. Roberto Hernández"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nuevoCliente.telefono}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                    }
                    placeholder="461 123 4567"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={nuevoCliente.correo}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, correo: e.target.value })
                    }
                    placeholder="cliente@correo.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas del cliente
                </label>
                <input
                  type="text"
                  value={nuevoCliente.notas}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, notas: e.target.value })
                  }
                  placeholder="Preferencias de contacto, facturación, etc."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              {/* Primer equipo opcional */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-brand-600" />
                  <span>Registrar primer equipo / unidad (Opcional)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tipo
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.equipo_tipo}
                      onChange={(e) =>
                        setNuevoCliente({ ...nuevoCliente, equipo_tipo: e.target.value })
                      }
                      placeholder="Laptop / Auto / Lavadora"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Serie, IMEI o Placa
                    </label>
                    <input
                      type="text"
                      value={nuevoCliente.equipo_serie_placa}
                      onChange={(e) =>
                        setNuevoCliente({
                          ...nuevoCliente,
                          equipo_serie_placa: e.target.value,
                        })
                      }
                      placeholder="Ej. SN-99201 / GTM-451"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Marca y modelo
                  </label>
                  <input
                    type="text"
                    value={nuevoCliente.equipo_marca_modelo}
                    onChange={(e) =>
                      setNuevoCliente({
                        ...nuevoCliente,
                        equipo_marca_modelo: e.target.value,
                      })
                    }
                    placeholder="Ej. Dell Inspiron 15 / Nissan Sentra 2020"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalClienteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Equipo a Cliente Existente */}
      {clienteParaEquipo && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Agregar equipo</h2>
                <p className="text-xs text-slate-500">Cliente: {clienteParaEquipo.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setClienteParaEquipo(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAgregarEquipo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de unidad *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoEquipo.tipo}
                  onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, tipo: e.target.value })}
                  placeholder="Ej. Laptop, Celular, Vehículo, Lavadora"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca y modelo *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoEquipo.marca_modelo}
                  onChange={(e) =>
                    setNuevoEquipo({ ...nuevoEquipo, marca_modelo: e.target.value })
                  }
                  placeholder="Ej. MacBook Air M2 / Lavadora LG 19kg"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de serie, IMEI o Placa
                </label>
                <input
                  type="text"
                  value={nuevoEquipo.serie_placa}
                  onChange={(e) =>
                    setNuevoEquipo({ ...nuevoEquipo, serie_placa: e.target.value })
                  }
                  placeholder="Ej. C02XY123MD6M"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClienteParaEquipo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}