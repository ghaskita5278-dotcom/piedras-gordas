import { useState, useEffect } from 'react'
import { api } from '../api'

const INITIAL = {
  trabajador_id: '',
  descripcion: '',
  cantidad: '',
  unidad: '',
  valor: '',
  registrado_por: '',
  obligacion_id: '',
}

export default function PagoTrabajador() {
  const [trabajadores, setTrabajadores] = useState([])
  const [obligaciones, setObligaciones] = useState([])
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    api.get('/api/trabajadores').then(setTrabajadores).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.trabajador_id) { setObligaciones([]); return }
    // Cargar obligaciones del trabajador seleccionado (filtradas por trabajador_id via query)
    api.get(`/api/obligaciones?trabajador_id=${form.trabajador_id}`)
      .then(setObligaciones)
      .catch(() => setObligaciones([]))
  }, [form.trabajador_id])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.trabajador_id) return
    setLoading(true)
    setMensaje(null)
    try {
      await api.post(`/api/trabajadores/${form.trabajador_id}/pagos`, {
        descripcion: form.descripcion,
        cantidad: form.cantidad ? Number(form.cantidad) : null,
        unidad: form.unidad || null,
        valor: Number(form.valor),
        registrado_por: form.registrado_por || null,
        obligacion_id: form.obligacion_id || null,
      })
      setMensaje({ type: 'ok', text: 'Pago registrado correctamente' })
      setForm(INITIAL)
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Pagar trabajador</h2>

      {mensaje && (
        <div className={`rounded-lg p-3 mb-4 text-sm ${
          mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Trabajador *</label>
          <select className="input" value={form.trabajador_id} onChange={set('trabajador_id')} required>
            <option value="">Seleccionar...</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
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
          <label className="label">Descripción</label>
          <input className="input" type="text" value={form.descripcion} onChange={set('descripcion')} placeholder="Ej: Jornada semana del 2 al 7 jun" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cantidad</label>
            <input className="input" type="number" min="0" step="any" value={form.cantidad} onChange={set('cantidad')} />
          </div>
          <div>
            <label className="label">Unidad</label>
            <input className="input" type="text" value={form.unidad} onChange={set('unidad')} placeholder="Ej: días" />
          </div>
        </div>

        <div>
          <label className="label">Valor (COP) *</label>
          <input className="input" type="number" min="0" step="any" value={form.valor} onChange={set('valor')} required />
        </div>

        <div>
          <label className="label">Registrado por</label>
          <input className="input" type="text" value={form.registrado_por} onChange={set('registrado_por')} />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar pago'}
        </button>
      </form>
    </div>
  )
}
