import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ negocios = [], negocioActivo, onSelectNegocio }) {
  const { user, logout, demoMode } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/dashboard/ordenes', label: 'Órdenes de servicio', icon: ClipboardList },
    { to: '/dashboard/citas', label: 'Citas', icon: Calendar },
    { to: '/dashboard/clientes', label: 'Clientes y equipos', icon: Users },
    { to: '/dashboard/establecimiento', label: 'Mi establecimiento', icon: Store },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera móvil */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <span className="text-sm font-semibold text-slate-300">Navegación</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selector de Establecimiento */}
        <div className="p-4 border-b border-slate-800">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Establecimiento activo
          </label>
          <div className="relative">
            <select
              value={negocioActivo?.id || ''}
              onChange={(e) => onSelectNegocio(Number(e.target.value))}
              className="w-full appearance-none bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {negocioActivo?.slug && (
            <Link
              to={`/t/${negocioActivo.slug}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
            >
              <span>Ver página pública</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil y Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-9 w-9 rounded-full bg-brand-600/25 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-sm">
              {(user?.nombre || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.correo || 'taller@repairhub.mx'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-slate-500 hidden sm:inline">
              {negocioActivo?.nombre || 'Panel de Control'}
            </span>
          </div>

          {demoMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Modo diseño (sin API conectada)
            </span>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}