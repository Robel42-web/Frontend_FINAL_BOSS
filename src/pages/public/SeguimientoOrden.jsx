import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import api from '../../services/api';

export default function SeguimientoOrden() {
  const params = useParams();
  const folio = Object.values(params)[0] || '';
  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [requiereLogin, setRequiereLogin] = useState(false);

  useEffect(() => {
    if (!folio) {
      setCargando(false);
      return;
    }
    let activo = true;

    async function cargarOrden() {
      setCargando(true);
      setRequiereLogin(false);

      try {
        // 1. Intentar consultar en el portal del cliente autenticado
        const { data: listaPortal } = await api.get('/api/portal/ordenes');
        const encontrada = Array.isArray(listaPortal)
          ? listaPortal.find(
              (o) => o.folio?.toLowerCase() === folio?.toLowerCase()
            )
          : null;

        if (encontrada) {
          const { data: detalle } = await api.get(
            `/api/portal/ordenes/${encontrada.id}`
          );
          if (activo) setOrden(detalle);
          return;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          if (activo) setRequiereLogin(true);
        }
      }

      // 2. Respaldo: buscar en los establecimientos del usuario (vista previa del taller)
      try {
        const { data: talleres } = await api.get('/api/establecimientos');
        if (Array.isArray(talleres)) {
          for (const taller of talleres) {
            const { data: ordenesTaller } = await api.get(
              `/api/establecimientos/${taller.id}/ordenes`
            );
            const match = Array.isArray(ordenesTaller)
              ? ordenesTaller.find(
                  (o) => o.folio?.toLowerCase() === folio?.toLowerCase()
                )
              : null;

            if (match) {
              const { data: detalleTaller } = await api.get(
                `/api/establecimientos/${taller.id}/ordenes/${match.id}`
              );
              if (activo) setOrden(detalleTaller);
              return;
            }
          }
        }
      } catch {
        // Si tampoco tiene sesión de taller, queda en null
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarOrden();
    return () => {
      activo = false;
    };
  }, [folio]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado */}
      <div className="bg-slate-900 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
            <Link
              to="/dashboard/ordenes"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              Volver a órdenes del taller →
            </Link>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-brand-300 mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Portal de seguimiento RepairHub
          </div>
          <h1 className="text-3xl font-bold tracking-tight !text-white">
            Orden #{folio}
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {cargando ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
            Consultando estado de la orden #{folio}...
          </div>
        ) : !orden ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">
              No encontramos la orden #{folio}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {requiereLogin
                ? 'Inicia sesión con el correo del cliente registrado en la orden para consultar su seguimiento y evidencias.'
                : 'Verifica que el folio sea correcto o que tu sesión corresponda al cliente o taller de esta orden.'}
            </p>
            {requiereLogin && (
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition"
                >
                  Iniciar sesión como cliente
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estado y equipo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 capitalize">
                  <Wrench className="h-3.5 w-3.5" />
                  {orden.estado?.replace(/_/g, ' ')}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {orden.equipo?.marca} {orden.equipo?.modelo}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: {orden.cliente?.nombre} · Falla reportada:{' '}
                  {orden.problema_reportado}
                </p>
              </div>
              {orden.fecha_estimada_entrega && (
                <div className="text-right text-xs text-slate-500">
                  <span className="block font-semibold text-slate-700">
                    Entrega estimada
                  </span>
                  {orden.fecha_estimada_entrega}
                </div>
              )}
            </div>

            {/* Diagnóstico técnico */}
            {orden.diagnosticos?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Diagnóstico técnico
                </h3>
                {orden.diagnosticos.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <p className="font-medium text-slate-800">{d.descripcion}</p>
                    {d.reparacion_sugerida && (
                      <p className="text-slate-500">
                        Sugerencia: {d.reparacion_sugerida}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Evidencias fotográficas */}
            {orden.evidencias?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-brand-600" />
                  Evidencias fotográficas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {orden.evidencias.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                    >
                      {ev.url && (
                        <img
                          src={ev.url}
                          alt={ev.descripcion || 'Evidencia de reparación'}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-3 text-xs text-slate-600">
                        {ev.descripcion || 'Evidencia adjunta por el taller'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de avances */}
            {orden.historial?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  Historial de movimientos
                </h3>
                <div className="divide-y divide-slate-100">
                  {orden.historial.map((h) => (
                    <div key={h.id} className="py-3 text-xs">
                      <p className="font-medium text-slate-800">{h.comentario}</p>
                      <span className="text-slate-400 capitalize">
                        Estado: {h.estado_nuevo?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}