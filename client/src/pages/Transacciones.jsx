import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

export default function Transacciones() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    tipo_pago: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  const setFiltro = (field) => (e) =>
    setFiltros((f) => ({ ...f, [field]: e.target.value }))

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (filtros.tipo_pago) params.set('tipo_pago', filtros.tipo_pago)
    if (filtros.fecha_inicio) params.set('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.set('fecha_fin', filtros.fecha_fin)
    const qs = params.toString()
    api.get(`/api/transacciones${qs ? `?${qs}` : ''}`)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de pagos</h2>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3 mb-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Desde</label>
            <input className="input" type="date" value={filtros.fecha_inicio} onChange={setFiltro('fecha_inicio')} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input className="input" type="date" value={filtros.fecha_fin} onChange={setFiltro('fecha_fin')} />
          </div>
        </div>
        <div>
          <label className="label">Tipo de pago</label>
          <input className="input" type="text" value={filtros.tipo_pago} onChange={setFiltro('tipo_pago')} placeholder="transferencia, efectivo..." />
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 mt-6">Cargando...</p>}
      {error && <p className="text-center text-red-500 mt-6">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-center text-gray-400 mt-6">Sin resultados</p>
      )}

      <div className="space-y-3">
        {items.map((tx) => (
          <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {tx.tipo_pago || 'Pago'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(tx.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
                {tx.url_soporte && (
                  <a
                    href={tx.url_soporte}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    Ver soporte
                  </a>
                )}
              </div>
              <span className="text-red-600 font-bold ml-3 whitespace-nowrap">
                −${Number(tx.monto).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
