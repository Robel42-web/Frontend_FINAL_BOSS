import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';

import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import GoogleCallback from './pages/auth/GoogleCallback';
import DashboardLayout from './layouts/DashboardLayout';
import Resumen from './pages/dashboard/Resumen';
import Establecimiento from './pages/dashboard/Establecimiento';
import Citas from './pages/dashboard/Citas';
import Clientes from './pages/dashboard/Clientes';
import Ordenes from './pages/dashboard/Ordenes';
import TallerPublico from './pages/public/TallerPublico';
import Inicio from './pages/public/Inicio';
import SeguimientoOrden from './pages/public/SeguimientoOrden';

const NEGOCIO_DEMO = {
  id: 1,
  nombre: 'TechFix Celaya',
  slug: 'techfix-celaya',
  descripcion: 'Servicio técnico especializado en laptops, smartphones y consolas.',
  correo: 'contacto@techfix.mx',
  telefono: '461 234 5678',
  direccion: 'Av. Tecnológico #450, Celaya, Gto.',
  activo: true,
};

const CITAS_DEMO_INICIALES = [
  {
    id: 101,
    cliente_nombre: 'Laura Gómez',
    cliente_telefono: '461 555 0192',
    cliente_correo: 'laura.gomez@gmail.com',
    servicio_nombre: 'Mantenimiento preventivo y cambio de pasta térmica',
    equipo_descripcion: 'Lenovo IdeaPad Gaming 3',
    fecha_hora: '2026-11-22T11:00',
    notas: 'Se calienta mucho al abrir programas pesados.',
    estado: 'pendiente',
  },
  {
    id: 102,
    cliente_nombre: 'Marco Antonio Ruiz',
    cliente_telefono: '461 889 3410',
    cliente_correo: '',
    servicio_nombre: 'Cambio de pantalla / display',
    equipo_descripcion: 'iPhone 13 Pro',
    fecha_hora: '2026-11-22T16:30',
    notas: 'Tiene líneas verdes en el lado derecho.',
    estado: 'confirmada',
  },
];

const ORDENES_DEMO_INICIALES = [
  {
    id: 501,
    folio: 'RH-2026-084',
    establecimiento_nombre: 'TechFix Celaya',
    cliente_nombre: 'Diego Hernández',
    cliente_telefono: '461 334 9910',
    equipo_descripcion: 'MacBook Pro 14" · Cambio de batería',
    serie_placa: 'C02ZN881MD6R',
    falla_reportada: 'La batería dura menos de 30 minutos y marca condición de servicio.',
    tecnico_asignado: 'Carlos Mendoza',
    estado: 'cotizacion_pendiente',
    diagnostico_tecnico:
      'Batería inflada con 1,140 ciclos de carga. Se requiere reemplazo por celda original nueva.',
    cotizacion_monto: 2450,
    cotizacion_detalle: 'Batería original MacBook Pro 14" + limpieza interna + 6 meses de garantía.',
    cotizacion_estado: 'pendiente',
  },
];

function ProtectedDashboard({
  citas,
  onActualizarEstadoCita,
  ordenes,
  onCrearOrden,
  onActualizarOrden,
}) {
  const { user, loading } = useAuth();
  const [negocios, setNegocios] = useState([NEGOCIO_DEMO]);
  const [negocioActivoId, setNegocioActivoId] = useState(1);

  useEffect(() => {
    if (!user) return;
    api
      .get('/api/establecimientos')
      .then(({ data }) => {
        const lista = data.data ?? data;
        if (Array.isArray(lista) && lista.length > 0) {
          setNegocios(lista);
          setNegocioActivoId(lista[0].id);
        }
      })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const negocioActivo = negocios.find((n) => n.id === negocioActivoId) || negocios[0];

  const handleGuardarNegocio = (actualizado) => {
    setNegocios((prev) => prev.map((n) => (n.id === actualizado.id ? actualizado : n)));
  };

  const handleCrearNuevo = (nuevo) => {
    setNegocios((prev) => [...prev, nuevo]);
    setNegocioActivoId(nuevo.id);
  };

  return (
    <Routes>
      <Route
        element={
          <DashboardLayout
            negocios={negocios}
            negocioActivo={negocioActivo}
            onSelectNegocio={setNegocioActivoId}
          />
        }
      >
        <Route index element={<Resumen negocioActivo={negocioActivo} />} />
        <Route
          path="establecimiento"
          element={
            <Establecimiento
              negocioActivo={negocioActivo}
              onGuardarNegocio={handleGuardarNegocio}
              onCrearNuevo={handleCrearNuevo}
            />
          }
        />
        <Route
          path="citas"
          element={
            <Citas
              negocioActivo={negocioActivo}
              citas={citas}
              onActualizarEstado={onActualizarEstadoCita}
            />
          }
        />
        <Route
          path="clientes"
          element={<Clientes negocioActivo={negocioActivo} />}
        />
        <Route
          path="ordenes"
          element={
            <Ordenes
              negocioActivo={negocioActivo}
              ordenes={ordenes}
              onCrearOrden={onCrearOrden}
              onActualizarOrden={onActualizarOrden}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [citasDemo, setCitasDemo] = useState(CITAS_DEMO_INICIALES);
  const [ordenesDemo, setOrdenesDemo] = useState(ORDENES_DEMO_INICIALES);

  const handleNuevaCitaDemo = (nueva) => {
    setCitasDemo((prev) => [nueva, ...prev]);
  };

  const handleActualizarEstadoCita = (id, estado) => {
    setCitasDemo((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
  };

  const handleCrearOrdenDemo = (nueva) => {
    setOrdenesDemo((prev) => [nueva, ...prev]);
  };

  const handleActualizarOrdenDemo = (actualizada) => {
    setOrdenesDemo((prev) =>
      prev.map((o) => (o.id === actualizada.id ? actualizada : o))
    );
  };

  const handleResponderCotizacionDemo = (ordenId, decision, nuevoEstadoOrden) => {
    setOrdenesDemo((prev) =>
      prev.map((o) =>
        o.id === ordenId
          ? { ...o, cotizacion_estado: decision, estado: nuevoEstadoOrden }
          : o
      )
    );
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página principal: Directorio y buscador público de talleres */}
          <Route path="/" element={<Inicio />} />

          {/* Autenticación para gerentes y trabajadores */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />

          {/* Ficha individual del taller para agendar cita */}
          <Route
            path="/t/:slug"
            element={<TallerPublico onNuevaCitaDemo={handleNuevaCitaDemo} />}
          />

          {/* Seguimiento de orden y aprobación de cotización */}
          <Route
            path="/seguimiento/:token"
            element={
              <SeguimientoOrden
                ordenes={ordenesDemo}
                onResponderCotizacion={handleResponderCotizacionDemo}
              />
            }
          />

          {/* Panel interno del taller */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedDashboard
                citas={citasDemo}
                onActualizarEstadoCita={handleActualizarEstadoCita}
                ordenes={ordenesDemo}
                onCrearOrden={handleCrearOrdenDemo}
                onActualizarOrden={handleActualizarOrdenDemo}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}