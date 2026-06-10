import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const TIPOS = [
  { value: 'aporte',     label: 'Aporte',               color: 'bg-green-100 text-green-800' },
  { value: 'prestamo',   label: 'Préstamo',              color: 'bg-orange-100 text-orange-800' },
  { value: 'devolucion', label: 'Devolución de finca',   color: 'bg-blue-100 text-blue-800' },
]

function tipoBadge(tipo) {
  const t = TIPOS.find((x) => x.value === tipo)
  return t ? (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
  ) : null
}

function fmt(n) {
  return `$${Number(n ?? 0).toLocaleString('es-CO')}`
}

const INITIAL = {
  socio_id: '',
  tipo: 'aporte',
  monto: '',
  descripcion: '',
  socio_receptor_id: '',
  fecha_devolucion: '',
  url_soporte: '',
}

export default function Aportes() {
  const [resumen, setResumen]       = useState([])
  const [historial, setHistorial]   = useState([])
  const [socios, setSocios]         = useState([])
  const [form, setForm]             = useState(INITIAL)
  const [loading, setLoading]       = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [mensaje, setMensaje]       = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [res, hist, soc] = await Promise.all([
        api.get('/api/aportes/resumen'),
        api.get('/api/aportes'),
        api.get('/api/socios'),
      ])
      setResumen(res)
      setHistorial(hist)
      setSocios(soc)
    } catch (e) {
      setMensaje({ type: 'err', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      await api.post('/api/aportes', {
        socio_id:          Number(form.socio_id),
        tipo:              form.tipo,
        monto:             Number(form.monto),
        descripcion:       form.descripcion || null,
        socio_receptor_id: form.socio_receptor_id ? Number(form.socio_receptor_id) : null,
        fecha_devolucion:  form.fecha_devolucion || null,
        url_soporte:       form.url_soporte || null,
      })
      setMensaje({ type: 'ok', text: 'Movimiento registrado correctamente' })
      setForm(INITIAL)
      cargar()
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const totalAportado = resumen.reduce((s, r) => s + Number(r.total_aportado), 0)
  const totalDevuelto = resumen.reduce((s, r) => s + Number(r.total_devuelto), 0)
  const pct = totalAportado > 0 ? Math.min(100, (totalDevuelto / totalAportado) * 100) : 0

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">

      {/* ── 0. Resumen global ── */}
      {!loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-700 rounded-2xl p-4 shadow-sm">
              <p className="text-green-200 text-xs">Aportes totales</p>
              <p className="text-white text-xl font-bold mt-1 leading-tight">{fmt(totalAportado)}</p>
            </div>
            <div className="bg-blue-600 rounded-2xl p-4 shadow-sm">
              <p className="text-blue-100 text-xs">Retornos de la finca</p>
              <p className="text-white text-xl font-bold mt-1 leading-tight">{fmt(totalDevuelto)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progreso de retornos</span>
              <span className="font-semibold">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              La finca ha devuelto {fmt(totalDevuelto)} de {fmt(totalAportado)} aportados
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Tarjetas de balance por socio ── */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Balance por socio</p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : resumen.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin socios registrados</p>
        ) : (
          <div className="space-y-3">
            {resumen.map((s) => {
              const saldo = Number(s.saldo_pendiente)
              return (
                <div key={s.socio_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-800">{s.socio_nombre}</p>
                    <span className={`text-sm font-bold ${saldo > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {saldo > 0 ? `La finca debe ${fmt(saldo)}` : 'Sin saldo pendiente'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Aportado</p>
                      <p className="text-sm font-semibold text-green-700">{fmt(s.total_aportado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Prestado</p>
                      <p className="text-sm font-semibold text-orange-600">{fmt(s.total_prestado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Devuelto</p>
                      <p className="text-sm font-semibold text-blue-600">{fmt(s.total_devuelto)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 2. Formulario de nuevo movimiento ── */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Nuevo movimiento</p>

        {mensaje && (
          <div className={`rounded-lg p-3 mb-4 text-sm ${
            mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">

          <div>
            <label className="label">Socio *</label>
            <select className="input" value={form.socio_id} onChange={set('socio_id')} required>
              <option value="">Seleccionar...</option>
              {socios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tipo *</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.tipo === t.value
                      ? `${t.color} border-transparent`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Monto (COP) *</label>
            <input className="input" type="number" min="0" step="any" value={form.monto} onChange={set('monto')} required />
          </div>

          <div>
            <label className="label">Descripción</label>
            <input className="input" type="text" value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Abono para insumos" />
          </div>

          {form.tipo === 'prestamo' && (
            <>
              <div>
                <label className="label">Socio receptor (opcional)</label>
                <select className="input" value={form.socio_receptor_id} onChange={set('socio_receptor_id')}>
                  <option value="">Ninguno</option>
                  {socios.filter((s) => s.id !== Number(form.socio_id)).map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha de devolución pactada</label>
                <input className="input" type="date" value={form.fecha_devolucion} onChange={set('fecha_devolucion')} />
              </div>
            </>
          )}

          <div>
            <label className="label">URL soporte (opcional)</label>
            <input className="input" type="url" value={form.url_soporte} onChange={set('url_soporte')} placeholder="https://..." />
          </div>

          <button className="btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar movimiento'}
          </button>
        </form>
      </div>

      {/* ── 3. Historial completo ── */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Historial</p>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && historial.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">Sin movimientos registrados</p>
        )}

        {!loading && (
          <div className="space-y-2">
            {historial.map((a) => {
              const dt = new Date(a.created_at)
              const fecha = dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
              const hora  = dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {tipoBadge(a.tipo)}
                        <span className="text-sm font-semibold text-gray-800 truncate">{a.socio_nombre}</span>
                        {a.socio_receptor_nombre && (
                          <span className="text-xs text-gray-400">→ {a.socio_receptor_nombre}</span>
                        )}
                      </div>
                      {a.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{a.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{fecha} · {hora}</p>
                      {a.tipo === 'prestamo' && a.fecha_devolucion && (
                        <p className="text-xs text-orange-500 mt-0.5">
                          Vence: {new Date(a.fecha_devolucion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {a.estado === 'devuelto' && <span className="ml-2 text-green-600">· devuelto</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${
                        a.tipo === 'aporte' ? 'text-green-700' :
                        a.tipo === 'prestamo' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {fmt(a.monto)}
                      </p>
                      {a.url_soporte && (
                        <a href={a.url_soporte} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-500 underline">
                          soporte
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
