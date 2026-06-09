import { useEffect, useState } from 'react'
import { api } from '../api'

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-4 shadow-sm border ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">
        ${Number(value || 0).toLocaleString('es-CO')}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/transacciones/resumen')
      .then(setResumen)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-center mt-10 text-gray-400">Cargando...</p>
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Resumen financiero</h2>

      <div className="grid grid-cols-1 gap-3">
        <StatCard
          label="Total ingresos (ventas)"
          value={resumen?.total_ingresos}
          color="bg-green-50 border-green-200"
        />
        <StatCard
          label="Total gastos"
          value={resumen?.total_gastos}
          color="bg-red-50 border-red-200"
        />
        <StatCard
          label="Pagos a socios"
          value={resumen?.total_pagos_socios}
          color="bg-orange-50 border-orange-200"
        />
        <div className={`rounded-xl p-4 shadow-sm border ${
          Number(resumen?.balance) >= 0
            ? 'bg-blue-50 border-blue-200'
            : 'bg-red-50 border-red-300'
        }`}>
          <p className="text-sm text-gray-500">Balance</p>
          <p className={`text-2xl font-bold mt-1 ${
            Number(resumen?.balance) >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            ${Number(resumen?.balance || 0).toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </div>
  )
}
