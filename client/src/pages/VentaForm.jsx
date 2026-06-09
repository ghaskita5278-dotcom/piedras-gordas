import { useState, useEffect } from 'react'
import { api } from '../api'

const INITIAL = {
  producto: '',
  kilos_primera: '',
  precio_primera: '',
  kilos_segunda: '',
  precio_segunda: '',
  kilos_tercera: '',
  precio_tercera: '0',
  total_ingreso: '',
  registrado_por: '',
}

export default function VentaForm() {
  const [form, setForm] = useState(INITIAL)
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    api.get('/api/socios').then(setSocios).catch(() => {})
  }, [])

  const set = (field) => (e) => {
    const val = e.target.value
    setForm((f) => {
      const next = { ...f, [field]: val }
      // Calcular total automáticamente si ambos precios/kilos están
      const p1 = Number(next.kilos_primera || 0) * Number(next.precio_primera || 0)
      const p2 = Number(next.kilos_segunda || 0) * Number(next.precio_segunda || 0)
      const p3 = Number(next.precio_tercera || 0) > 0
        ? Number(next.kilos_tercera || 0) * Number(next.precio_tercera)
        : 0
      if (p1 + p2 + p3 > 0) next.total_ingreso = String(p1 + p2 + p3)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    try {
      await api.post('/api/ventas', {
        producto: form.producto,
        kilos_primera: form.kilos_primera ? Number(form.kilos_primera) : null,
        precio_primera: form.precio_primera ? Number(form.precio_primera) : null,
        kilos_segunda: form.kilos_segunda ? Number(form.kilos_segunda) : null,
        precio_segunda: form.precio_segunda ? Number(form.precio_segunda) : null,
        total_ingreso: Number(form.total_ingreso),
        registrado_por: form.registrado_por ? Number(form.registrado_por) : null,
      })
      setMensaje({ type: 'ok', text: 'Venta registrada correctamente' })
      setForm(INITIAL)
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar venta</h2>

      {mensaje && (
        <div className={`rounded-lg p-3 mb-4 text-sm ${
          mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Producto *</label>
          <input className="input" type="text" value={form.producto} onChange={set('producto')} required />
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
          <legend className="text-sm font-medium text-gray-600 px-1">Primera calidad</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kilos</label>
              <input className="input" type="number" min="0" step="any" value={form.kilos_primera} onChange={set('kilos_primera')} />
            </div>
            <div>
              <label className="label">Precio/kg</label>
              <input className="input" type="number" min="0" step="any" value={form.precio_primera} onChange={set('precio_primera')} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
          <legend className="text-sm font-medium text-gray-600 px-1">Segunda calidad</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kilos</label>
              <input className="input" type="number" min="0" step="any" value={form.kilos_segunda} onChange={set('kilos_segunda')} />
            </div>
            <div>
              <label className="label">Precio/kg</label>
              <input className="input" type="number" min="0" step="any" value={form.precio_segunda} onChange={set('precio_segunda')} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
          <legend className="text-sm font-medium text-gray-600 px-1">
            Tercera calidad
            <span className="ml-2 text-xs text-gray-400 font-normal">(no se vende)</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kilos</label>
              <input className="input" type="number" min="0" step="any" value={form.kilos_tercera} onChange={set('kilos_tercera')} />
            </div>
            <div>
              <label className="label">Precio/kg</label>
              <input className="input bg-gray-100 text-gray-400 cursor-not-allowed" type="number" value={form.precio_tercera} readOnly tabIndex={-1} />
            </div>
          </div>
        </fieldset>

        <div>
          <label className="label">Total ingreso (COP) *</label>
          <input
            className="input bg-gray-50 font-semibold"
            type="number" min="0" step="any"
            value={form.total_ingreso}
            onChange={set('total_ingreso')}
            required
          />
          <p className="text-xs text-gray-400 mt-1">Se calcula automáticamente o puedes editarlo.</p>
        </div>

        <div>
          <label className="label">Registrado por</label>
          <select className="input" value={form.registrado_por} onChange={set('registrado_por')}>
            <option value="">Seleccionar...</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar venta'}
        </button>
      </form>
    </div>
  )
}
