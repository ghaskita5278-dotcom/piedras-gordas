import { useState, useEffect } from 'react'
import { api } from '../api'

const TIPOS_PAGO = ['transferencia', 'efectivo', 'cheque', 'otro']

const INITIAL = {
  socio_id: '',
  monto: '',
  tipo_pago: '',
  url_soporte: '',
  obligacion_id: '',
}

export default function PagoSocio() {
  const [socios, setSocios] = useState([])
  const [obligaciones, setObligaciones] = useState([])
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    api.get('/api/socios').then(setSocios).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.socio_id) { setObligaciones([]); return }
    // Cargar obligaciones pendientes del socio (si hay endpoint de obligaciones)
    api.get(`/api/obligaciones?socio_id=${form.socio_id}`)
      .then(setObligaciones)
      .catch(() => setObligaciones([]))
  }, [form.socio_id])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.socio_id) return
    setLoading(true)
    setMensaje(null)
    try {
      await api.post(`/api/socios/${form.socio_id}/pagos`, {
        monto: Number(form.monto),
        tipo_pago: form.tipo_pago || null,
        url_soporte: form.url_soporte || null,
        obligacion_id: form.obligacion_id || null,
      })
      setMensaje({ type: 'ok', text: 'Pago al socio registrado correctamente' })
      setForm(INITIAL)
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Pagar socio</h2>

      {mensaje && (
        <div className={`rounded-lg p-3 mb-4 text-sm ${
          mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Socio *</label>
          <select className="input" value={form.socio_id} onChange={set('socio_id')} required>
            <option value="">Seleccionar...</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {obligaciones.length > 0 && (
          <div>
            <label className="label">Obligación (opcional)</label>
            <select className="input" value={form.obligacion_id} onChange={set('obligacion_id')}>
              <option value="">Sin obligación específica</option>
              {obligaciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.concepto} — ${Number(o.monto_total).toLocaleString('es-CO')} ({o.estado})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Monto (COP) *</label>
          <input className="input" type="number" min="0" step="any" value={form.monto} onChange={set('monto')} required />
        </div>

        <div>
          <label className="label">Tipo de pago</label>
          <select className="input" value={form.tipo_pago} onChange={set('tipo_pago')}>
            <option value="">Seleccionar...</option>
            {TIPOS_PAGO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">URL soporte (opcional)</label>
          <input
            className="input"
            type="url"
            value={form.url_soporte}
            onChange={set('url_soporte')}
            placeholder="https://..."
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar pago'}
        </button>
      </form>
    </div>
  )
}
