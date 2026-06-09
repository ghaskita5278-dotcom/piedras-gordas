import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

function fmt(n) {
  return `$${Number(n ?? 0).toLocaleString('es-CO')}`
}

export default function Caja() {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, gastos, ventas] = await Promise.all([
        api.get('/api/transacciones/resumen'),
        api.get('/api/gastos'),
        api.get('/api/ventas'),
      ])
      setResumen(res)

      // Combinar gastos y ventas en una lista unificada, ordenar por fecha desc, tomar 10
      const lista = [
        ...gastos.map((g) => ({
          id: `g-${g.id}`,
          tipo: 'egreso',
          descripcion: g.descripcion,
          detalle: g.categoria,
          monto: g.valor,
          fecha: g.created_at,
          ref_id: g.id,
          firmado: g.firmado,
        })),
        ...ventas.map((v) => ({
          id: `v-${v.id}`,
          tipo: 'ingreso',
          descripcion: v.producto,
          detalle: `${v.kilos_primera ?? 0} kg`,
          monto: v.total_ingreso,
          fecha: v.created_at,
        })),
      ]
      lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      setMovimientos(lista.slice(0, 10))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">

      {/* ── Saldo actual ── */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Caja</p>
        {loading ? (
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <>
            <div className={`rounded-2xl p-5 shadow-sm ${
              Number(resumen?.balance) >= 0 ? 'bg-green-700' : 'bg-red-600'
            }`}>
              <p className="text-green-100 text-sm">Saldo actual</p>
              <p className="text-white text-4xl font-bold mt-1 tracking-tight">
                {fmt(resumen?.balance)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <p className="text-xs text-gray-400">Total ingresos</p>
                <p className="text-green-700 font-semibold mt-0.5">{fmt(resumen?.total_ingresos)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <p className="text-xs text-gray-400">Total egresos</p>
                <p className="text-red-600 font-semibold mt-0.5">
                  {fmt(Number(resumen?.total_gastos ?? 0) + Number(resumen?.total_pagos_socios ?? 0))}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Botón gasto rápido ── */}
      <button
        onClick={() => navigate('/gastos')}
        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 hover:border-green-500 hover:text-green-700 text-gray-500 font-medium py-3 rounded-xl transition-colors text-sm"
      >
        <span className="text-lg">💸</span>
        Registrar gasto rápido
      </button>

      {/* ── Últimos movimientos ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">Últimos movimientos</p>
          <button
            onClick={cargar}
            className="text-xs text-green-700 hover:underline"
          >
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && movimientos.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Sin movimientos registrados</p>
        )}

        {!loading && (
          <div className="space-y-2">
            {movimientos.map((m) => (
              <div
                key={m.id}
                onClick={() => m.tipo === 'egreso' && navigate(`/recibo/${m.ref_id}`)}
                className={`bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center gap-3 ${
                  m.tipo === 'egreso' ? 'active:bg-gray-50 cursor-pointer' : ''
                }`}
              >
                {/* Indicador */}
                <div className={`w-2 h-10 rounded-full shrink-0 ${
                  m.tipo === 'ingreso' ? 'bg-green-400' : 'bg-red-400'
                }`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.descripcion}</p>
                  <p className="text-xs text-gray-400">
                    {m.detalle}
                    {m.firmado != null && (
                      <span className={`ml-2 ${m.firmado ? 'text-green-600' : 'text-orange-400'}`}>
                        {m.firmado ? '✓ firmado' : '· sin firma'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Monto + fecha */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${
                    m.tipo === 'ingreso' ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {m.tipo === 'ingreso' ? '+' : '−'}{fmt(m.monto)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
