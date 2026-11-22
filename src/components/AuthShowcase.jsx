import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Camera,
  Calendar,
  Clock,
  FileCheck2,
} from 'lucide-react';

const SLIDES = [
  {
    badge: 'Orden #RH-2026-084',
    title: 'MacBook Pro 14" · Cambio de batería',
    status: 'Autorizada',
    statusClass: 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40',
    items: [
      { icon: CheckCircle2, color: 'text-emerald-300', text: 'Diagnóstico técnico documentado' },
      { icon: Camera, color: 'text-sky-200', text: '3 evidencias fotográficas subidas al portal' },
      { icon: CheckCircle2, color: 'text-emerald-300', text: 'Cotización aprobada por el cliente ($2,450 MXN)' },
    ],
    heading: 'Transparencia total en cada reparación',
    description: 'Administra citas, diagnósticos, evidencias y autorizaciones desde un solo lugar.',
  },
  {
    badge: 'Portal Público · /t/techfix',
    title: 'Nueva solicitud de cita recibida',
    status: 'Pendiente',
    statusClass: 'bg-amber-400/25 text-amber-100 border-amber-300/40',
    items: [
      { icon: Calendar, color: 'text-amber-200', text: 'Cliente: Laura Gómez · Hoy, 16:30 hrs' },
      { icon: Clock, color: 'text-sky-200', text: 'Servicio: Mantenimiento preventivo y limpieza' },
      { icon: CheckCircle2, color: 'text-emerald-300', text: 'Conversión a orden de servicio en un clic' },
    ],
    heading: 'Agenda en línea sin llamadas ni esperas',
    description: 'Cada establecimiento cuenta con su propia página pública para recibir clientes.',
  },
  {
    badge: 'Cotización v1 · #COT-109',
    title: 'iPhone 15 Pro · Reemplazo de pantalla',
    status: 'Verificada',
    statusClass: 'bg-sky-400/25 text-sky-100 border-sky-300/40',
    items: [
      { icon: FileCheck2, color: 'text-sky-200', text: 'Desglose claro de refacciones y mano de obra' },
      { icon: ShieldCheck, color: 'text-emerald-300', text: 'Aprobación digital con registro de fecha y hora' },
      { icon: Camera, color: 'text-indigo-200', text: 'Historial y comprobante PDF listo al entregar' },
    ],
    heading: 'Presupuestos claros antes de reparar',
    description: 'Evita malentendidos con aprobaciones verificables por el cliente.',
  },
];

export default function AuthShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = SLIDES[activeIndex];

  return (
    <div className="hidden md:flex relative bg-gradient-to-br from-brand-500 via-brand-600 to-purple-800 p-8 lg:p-12 flex-col justify-between text-white overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-900/40 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-2 text-brand-100 text-xs lg:text-sm font-medium">
        <ShieldCheck className="h-5 w-5 text-white shrink-0" />
        <span>Plataforma multiempresa para talleres y centros de servicio</span>
      </div>

      {/* Tarjeta animada */}
      <div key={activeIndex} className="relative z-10 max-w-md mx-auto w-full space-y-6 animate-slide">
        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-5 lg:p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-2 pb-4 border-b border-white/20">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-brand-100 font-semibold">
                {current.badge}
              </span>
              <h3 className="text-base lg:text-lg font-bold !text-white mt-0.5">
                {current.title}
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${current.statusClass}`}
            >
              {current.status}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs lg:text-sm">
            {current.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3 text-white/95">
                  <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl lg:text-2xl font-bold !text-white leading-snug">
            {current.heading}
          </h2>
          <p className="text-xs lg:text-sm text-brand-100">
            {current.description}
          </p>
        </div>
      </div>

      {/* Controles interactivos del carrusel */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Diapositiva ${idx + 1}`}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}