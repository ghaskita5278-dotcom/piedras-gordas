import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import GastoForm from './pages/GastoForm'
import VentaForm from './pages/VentaForm'
import Trabajadores from './pages/Trabajadores'
import PagoTrabajador from './pages/PagoTrabajador'
import Socios from './pages/Socios'
import PagoSocio from './pages/PagoSocio'
import Transacciones from './pages/Transacciones'
import Recibo from './pages/Recibo'
import Caja from './pages/Caja'
import Aportes from './pages/Aportes'
import Reportes from './pages/Reportes'

const NAV = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/caja', label: 'Caja', icon: '💰' },
  { to: '/gastos', label: 'Gasto', icon: '💸' },
  { to: '/ventas', label: 'Venta', icon: '📦' },
  { to: '/trabajadores', label: 'Equipo', icon: '👷' },
  { to: '/socios', label: 'Socios', icon: '👥' },
  { to: '/aportes', label: 'Aportes', icon: '🏦' },
  { to: '/reportes', label: 'Reportes', icon: '📊' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-700 text-white px-4 py-3 shadow-md">
          <h1 className="text-lg font-bold tracking-tight">Piedras Gordas</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gastos" element={<GastoForm />} />
            <Route path="/ventas" element={<VentaForm />} />
            <Route path="/trabajadores" element={<Trabajadores />} />
            <Route path="/pagos/trabajador" element={<PagoTrabajador />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/pagos/socio" element={<PagoSocio />} />
            <Route path="/caja" element={<Caja />} />
            <Route path="/transacciones" element={<Transacciones />} />
            <Route path="/aportes" element={<Aportes />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/recibo/:id" element={<Recibo />} />
          </Routes>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-10">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-0.5 text-[10px] flex-1 transition-colors ${
                  isActive ? 'text-green-700 font-semibold' : 'text-gray-500'
                }`
              }
            >
              <span className="text-xl">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  )
}
