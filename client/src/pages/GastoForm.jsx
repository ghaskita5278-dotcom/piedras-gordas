import { useState, useEffect } from 'react'
import { api } from '../api'

const CATEGORIAS = [
  'alimentacion',
  'transporte',
  'herramientas',
  'mantenimiento',
  'pago_trabajador',
  'pago_socio',
  'otro',
]

const UNIDADES = ['kg', 'g', 'L', 'mL', 'unidad', 'caja', 'bulto', 'otro']

const INITIAL = {
  categoria: '',
  descripcion: '',
  cantidad: '',
  unidad: '',
  valor: '',
  registrado_por: '',
}

export default function GastoForm() {
  const [form, setForm] = useState(INITIAL)
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    api.get('/api/trabajadores').then(setTrabajadores).catch(() => {})
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    try {
      await api.post('/api/gastos', {
        ...form,
        cantidad: form.cantidad ? Number(form.cantidad) : null,
        valor: Number(form.valor),
        registrado_por: form.registrado_por ? Number(form.registrado_por) : null,
      })
      setMensaje({ type: 'ok', text: 'Gasto registrado correctamente' })
      setForm(INITIAL)
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar gasto</h2>

      {mensaje && (
        <div className={`rounded-lg p-3 mb-4 text-sm ${
          mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Categoría *</label>
          <select className="input" value={form.categoria} onChange={set('categoria')} required>
            <option value="">Seleccionar...</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Descripción *</label>
          <input className="input" type="text" value={form.descripcion} onChange={set('descripcion')} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cantidad</label>
            <input className="input" type="number" min="0" step="any" value={form.cantidad} onChange={set('cantidad')} />
          </div>
          <div>
            <label className="label">Unidad</label>
            <select className="input" value={form.unidad} onChange={set('unidad')}>
              <option value="">—</option>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Valor (COP) *</label>
          <input className="input" type="number" min="0" step="any" value={form.valor} onChange={set('valor')} required />
        </div>

        <div>
          <label className="label">Registrado por</label>
          <select className="input" value={form.registrado_por} onChange={set('registrado_por')}>
            <option value="">Seleccionar...</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </form>
    </div>
  )
}
