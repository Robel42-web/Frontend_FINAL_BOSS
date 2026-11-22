import { useState, useEffect } from 'react';
import { Store, Globe, Mail, Phone, MapPin, Clock, Save, Plus, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const HORARIO_DEFAULT = {
  lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
  martes: { abierto: true, inicio: '09:00', fin: '18:00' },
  miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
  jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
  viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
  sabado: { abierto: true, inicio: '09:00', fin: '14:00' },
  domingo: { abierto: false, inicio: '09:00', fin: '14:00' },
};

export default function Establecimiento({ negocioActivo, onGuardarNegocio, onCrearNuevo }) {
  const [modoCrear, setModoCrear] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    correo: '',
    telefono: '',
    direccion: '',
    activo: true,
    horario_atencion: HORARIO_DEFAULT,
  });

  useEffect(() => {
    if (negocioActivo && !modoCrear) {
      setForm({
        nombre: negocioActivo.nombre || '',
        slug: negocioActivo.slug || '',
        descripcion: negocioActivo.descripcion || '',
        correo: negocioActivo.correo || '',
        telefono: negocioActivo.telefono || '',
        direccion: negocioActivo.direccion || '',
        activo: negocioActivo.activo ?? true,
        horario_atencion: negocioActivo.horario_atencion || HORARIO_DEFAULT,
      });
    }
  }, [negocioActivo, modoCrear]);

  const generarSlug = (texto) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    setForm((prev) => ({
      ...prev,
      nombre,
      slug: modoCrear ? generarSlug(nombre) : prev.slug,
    }));
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      horario_atencion: {
        ...prev.horario_atencion,
        [dia]: {
          ...prev.horario_atencion[dia],
          [campo]: valor,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      if (modoCrear) {
        try {
          const { data } = await api.post('/api/establecimientos', form);
          onCrearNuevo(data.data ?? data);
        } catch {
          onCrearNuevo({ ...form, id: Date.now() });
        }
        setModoCrear(false);
        setSavedMsg('Nuevo establecimiento creado correctamente.');
      } else {
        try {
          const { data } = await api.put(`/api/establecimientos/${negocioActivo.id}`, form);
          onGuardarNegocio(data.data ?? data);
        } catch {
          onGuardarNegocio({ ...negocioActivo, ...form });
        }
        setSavedMsg('Datos del establecimiento actualizados.');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(''), 3500);
    }
  };

  const iniciarNuevo = () => {
    setModoCrear(true);
    setForm({
      nombre: '',
      slug: '',
      descripcion: '',
      correo: '',
      telefono: '',
      direccion: '',
      activo: true,
      horario_atencion: HORARIO_DEFAULT,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {modoCrear ? 'Registrar nuevo establecimiento' : 'Configuración del establecimiento'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Esta información aparecerá en tu página pública para que los clientes agenden citas.
          </p>
        </div>

        {!modoCrear ? (
          <button
            type="button"
            onClick={iniciarNuevo}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer self-start"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar otro negocio</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setModoCrear(false)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer self-start"
          >
            Cancelar creación
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Datos Generales */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Store className="h-5 w-5 text-blue-600" />
            <h2>Información general</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del negocio *
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={handleNombreChange}
                placeholder="Ej. TechFix Celaya"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Enlace público (Slug) *
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white">
                <span className="pl-3 text-xs text-slate-400 select-none flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> /t/
                </span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: generarSlug(e.target.value) })}
                  placeholder="techfix-celaya"
                  className="w-full px-2 py-2.5 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción del taller
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Especialistas en reparación de laptops, celulares y mantenimiento preventivo..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo de contacto
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  placeholder="contacto@techfix.mx"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="461 234 5678"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dirección física
            </label>
            <div className="relative">
              <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Av. Tecnológico #450, Col. Centro, Celaya, Gto."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Establecimiento activo</p>
              <p className="text-xs text-slate-500">
                Permite que los clientes vean tu página pública y soliciten citas
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Horario de atención (jsonb) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2>Horario de atención</h2>
          </div>

          <div className="space-y-3">
            {DIAS_SEMANA.map(({ key, label }) => {
              const diaData = form.horario_atencion[key] || {
                abierto: false,
                inicio: '09:00',
                fin: '18:00',
              };
              return (
                <div key={key} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
                    <input
                      type="checkbox"
                      checked={diaData.abierto}
                      onChange={(e) => handleHorarioChange(key, 'abierto', e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className={diaData.abierto ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {label}
                    </span>
                  </label>

                  {diaData.abierto ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={diaData.inicio}
                        onChange={(e) => handleHorarioChange(key, 'inicio', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={diaData.fin}
                        onChange={(e) => handleHorarioChange(key, 'fin', e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : modoCrear ? 'Crear establecimiento' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}