import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PASOS_FLUJO = [
  { key: 'diagnostico', label: 'Diagnóstico técnico' },
  { key: 'cotizacion_pendiente', label: 'Cotización' },
  { key: 'en_reparacion', label: 'En reparación' },
  { key: 'listo', label: 'Listo para entrega' },
];

export default function SeguimientoOrden({ ordenes = [], onResponderCotizacion }) {
  const { token } = useParams();
  const { user } = useAuth();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/public/seguimiento/${token}`)
      .then(({ data }) => {
        setOrden(data.data ?? data);
      })
      .catch(() => {
        const limpia = decodeURIComponent(token || '').replace(/^#/, '').toLowerCase();
        const encontrada = ordenes.find(
          (o) => o.folio?.toLowerCase() === limpia
        );
        setOrden(encontrada || ordenes[0] || null);
      })
      .finally(() => setLoading(false));
  }, [token, ordenes]);

  const responderCotizacion = async (decision) => {
    if (!orden) return;
    try {
      await api.post(`/api/public/seguimiento/${token}/cotizacion`, {
        decision,
      });
    } catch {
      // Actualización optimista local
    }

    const nuevoEstadoOrden =
      decision === 'aprobada' ? 'en_reparacion' : 'diagnostico';

    const actualizada = {
      ...orden,
      cotizacion_estado: decision,
      estado: nuevoEstadoOrden,
    };
    setOrden(actualizada);
    if (onResponderCotizacion) {
      onResponderCotizacion(orden.id, decision, nuevoEstadoOrden);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Orden no encontrada</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Verifica que el código de seguimiento sea correcto o comunícate directamente con tu
          taller.
        </p>
        <Link
          to="/"
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const indicePasoActual = PASOS_FLUJO.findIndex((p) => p.key === orden.estado);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Cabecera */}
      <header className="bg-slate-900 text-white">
        {/* Barra superior de extremo a extremo */}
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>

          {user && (
            <Link
              to="/dashboard/ordenes"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
            >
              <span>Volver a órdenes del taller</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Título de la orden alineado con las tarjetas */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-7">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            {orden.establecimiento_nombre || 'TechFix Celaya'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold !text-white mt-1">
            Orden #{orden.folio}
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            {orden.equipo_descripcion} · Cliente: {orden.cliente_nombre}
          </p>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Línea de progreso */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Progreso de tu reparación</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PASOS_FLUJO.map((paso, idx) => {
              const completado =
                orden.estado === 'entregado' || idx <= indicePasoActual;
              return (
                <div
                  key={paso.key}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    completado
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {completado ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0" />
                  )}
                  <span>{paso.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnóstico técnico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
            <Wrench className="h-5 w-5 text-brand-600" />
            <h2>Reporte técnico</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Falla reportada</p>
              <p className="text-slate-800 mt-0.5">{orden.falla_reportada}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Diagnóstico del especialista
              </p>
              <p className="text-slate-800 mt-0.5">
                {orden.diagnostico_tecnico ||
                  'Nuestro técnico está revisando tu equipo. Pronto verás aquí el diagnóstico detallado.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cotización y botones de aprobación */}
        {orden.cotizacion_monto && (
          <div className="bg-white p-6 rounded-2xl border-2 border-brand-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <FileText className="h-5 w-5 text-brand-600" />
                <h2>Presupuesto / Cotización</h2>
              </div>

              <span className="text-xl font-extrabold text-brand-600 inline-flex items-center">
                <DollarSign className="h-5 w-5" />
                {orden.cotizacion_monto} MXN
              </span>
            </div>

            {orden.cotizacion_detalle && (
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {orden.cotizacion_detalle}
              </p>
            )}

            {orden.cotizacion_estado === 'aprobada' ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>
                  Has aprobado esta cotización. El taller ya está trabajando en tu reparación.
                </span>
              </div>
            ) : orden.cotizacion_estado === 'rechazada' ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 font-medium">
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>
                  Cotización rechazada. El taller se pondrá en contacto contigo.
                </span>
              </div>
            ) : (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Autoriza el presupuesto para que el técnico proceda con la reparación:
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => responderCotizacion('rechazada')}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => responderCotizacion('aprobada')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    Aprobar cotización
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}