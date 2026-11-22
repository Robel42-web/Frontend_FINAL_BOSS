import { Link } from 'react-router-dom';
import { ClipboardList, Calendar, Users, Clock, ArrowRight } from 'lucide-react';

export default function Resumen({ negocioActivo }) {
  const stats = [
    { label: 'Órdenes activas', value: '12', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
    { label: 'Citas por confirmar', value: '4', icon: Calendar, color: 'bg-amber-50 text-amber-600' },
    { label: 'Cotizaciones pendientes', value: '3', icon: Clock, color: 'bg-purple-50 text-purple-600' },
    { label: 'Clientes registrados', value: '48', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido a {negocioActivo?.nombre || 'RepairHub'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Resumen operativo de reparaciones, citas y seguimiento del establecimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${item.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Configura los datos y horarios de tu taller
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Personaliza el enlace público <code className="text-blue-600 font-medium">/t/{negocioActivo?.slug}</code> para recibir solicitudes de cita.
          </p>
        </div>
        <Link
          to="/dashboard/establecimiento"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shrink-0"
        >
          <span>Ir a mi establecimiento</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}