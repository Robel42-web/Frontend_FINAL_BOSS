import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Wrench,
  Smartphone,
  Car,
  WashingMachine,
  Cpu,
  ShieldCheck,
  Calendar,
  FileSearch,
  Store,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIAS = [
  { id: 'todos', label: 'Todos los talleres', icon: Wrench },
  { id: 'computo', label: 'Celulares y cómputo', icon: Smartphone },
  { id: 'automotriz', label: 'Taller mecánico', icon: Car },
  { id: 'electrodomesticos', label: 'Lavadoras y línea blanca', icon: WashingMachine },
  { id: 'electronica', label: 'Electrónica y consolas', icon: Cpu },
];

export default function Inicio({ negociosExtra = [] }) {
  const navigate = useNavigate();
  const [talleres, setTalleres] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [tokenSeguimiento, setTokenSeguimiento] = useState('');

  useEffect(() => {
    api
      .get('/api/public/establecimientos')
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data?.data || [];
        if (lista.length > 0) {
          const reales = lista.map((t) => ({
            ...t,
            categoria: t.categoria || 'computo',
            categoria_label: t.categoria_label || 'Celulares y cómputo',
            descripcion: t.descripcion || 'Servicio técnico especializado y mantenimiento.',
            direccion: t.direccion || 'Celaya, Gto.',
            telefono: t.telefono || 'Sin teléfono público',
            horario_resumen: t.horario_resumen || 'Lun - Vie 09:00 - 18:00',
            servicios_destacados: Array.isArray(t.servicios)
              ? t.servicios.map((s) => (typeof s === 'string' ? s : s.nombre))
              : t.servicios_destacados || [],
            activo: t.activo !== false,
          }));

          setTalleres(reales);
        }
      })
      .catch(() => {
        if (negociosExtra.length > 0) {
          const idsBase = new Set(TALLERES_DEMO.map((t) => t.slug));
          const adicionales = negociosExtra
            .filter((n) => n.activo && !idsBase.has(n.slug))
            .map((n) => ({
              ...n,
              categoria: n.categoria || 'computo',
              categoria_label: n.categoria_label || 'Servicio técnico',
              horario_resumen: 'Consulta horarios disponibles',
              servicios_destacados: ['Diagnóstico general', 'Reparación especializada'],
            }));
          setTalleres([...TALLERES_DEMO, ...adicionales]);
        }
      });
  }, [negociosExtra]);

  const talleresFiltrados = talleres.filter((t) => {
    const coincideCat =
      categoriaActiva === 'todos' || (t.categoria || 'computo') === categoriaActiva;
    const q = busqueda.toLowerCase().trim();
    if (!q) return coincideCat;

    const coincideTexto =
      t.nombre?.toLowerCase().includes(q) ||
      t.descripcion?.toLowerCase().includes(q) ||
      t.direccion?.toLowerCase().includes(q) ||
      t.servicios_destacados?.some((s) => s.toLowerCase().includes(q));

    return coincideCat && coincideTexto;
  });

  const handleBuscarSeguimiento = (e) => {
    e.preventDefault();
    const limpio = tokenSeguimiento.trim();
    if (!limpio) return;
    navigate(`/seguimiento/${encodeURIComponent(limpio)}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      {/* Barra superior pública */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-brand-600 p-2 rounded-xl text-white shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Repair<span className="text-brand-600">Hub</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
            >
              <Store className="h-4 w-4 hidden sm:inline" />
              <span>Registrar mi taller</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero con Buscador para Clientes */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm text-brand-100">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Talleres verificados con seguimiento transparente y cotizaciones claras</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight !text-white leading-tight">
            Encuentra el taller ideal y agenda tu reparación en minutos
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Busca por falla, equipo, vehículo o ciudad. Revisa direcciones, horarios y solicita
            tu cita sin crear cuentas ni esperar al teléfono.
          </p>

          {/* Barra de búsqueda principal */}
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="h-5 w-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="¿Qué necesitas reparar? Ej. pantalla laptop, frenos, lavadora, Celaya..."
                className="w-full pl-11 pr-4 py-3 text-slate-900 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <a
              href="#directorio"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shrink-0"
            >
              <span>Buscar talleres</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Filtros por categoría + Consulta de seguimiento */}
      <main id="directorio" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 space-y-8">
        {/* Pills de Categorías */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => {
              const Icon = cat.icon;
              const activa = categoriaActiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaActiva(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activa
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-slate-500">
            Mostrando {talleresFiltrados.length}{' '}
            {talleresFiltrados.length === 1 ? 'establecimiento' : 'establecimientos'}
          </span>
        </div>

        {/* Grid de Talleres Disponibles */}
        {talleresFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Search className="h-10 w-10 text-slate-300 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">
              No encontramos talleres con esa búsqueda
            </h2>
            <p className="text-sm text-slate-500">
              Intenta con otra palabra clave o selecciona "Todos los talleres".
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setCategoriaActiva('todos');
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talleresFiltrados.map((taller) => (
              <article
                key={taller.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition flex flex-col justify-between p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-700">
                      {taller.categoria_label || 'Centro de reparación'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Disponible
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{taller.nombre}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-3">
                      {taller.descripcion}
                    </p>
                  </div>

                  {/* Datos de contacto y ubicación */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    {taller.direccion && (
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                        <span>{taller.direccion}</span>
                      </p>
                    )}
                    {taller.telefono && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-brand-600 shrink-0" />
                        <span>{taller.telefono}</span>
                      </p>
                    )}
                    {taller.horario_resumen && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{taller.horario_resumen}</span>
                      </p>
                    )}
                  </div>

                  {/* Etiquetas de servicios */}
                  {taller.servicios_destacados?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {taller.servicios_destacados.map((srv) => (
                        <span
                          key={srv}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100">
                  <Link
                    to={`/t/${taller.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Ver información y agendar cita</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Banner para clientes que ya dejaron un equipo y quieren ver su avance */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm">
              <FileSearch className="h-5 w-5" />
              <span>¿Ya dejaste tu equipo o vehículo en reparación?</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Consulta el estado y autoriza tu cotización en línea
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Ingresa el código de seguimiento que te compartió el taller para ver el diagnóstico,
              evidencias fotográficas y presupuesto.
            </p>
          </div>

          <form onSubmit={handleBuscarSeguimiento} className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
            <input
              type="text"
              value={tokenSeguimiento}
              onChange={(e) => setTokenSeguimiento(e.target.value)}
              placeholder="Ej. RH-2026-084"
              className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-600 sm:w-60"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition cursor-pointer shrink-0"
            >
              Consultar orden
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}