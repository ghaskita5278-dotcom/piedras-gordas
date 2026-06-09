import { useState, useEffect } from 'react'
import { api } from '../api'

const INITIAL = { nombre: '', cedula: '', telefono: '' }

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([])
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  function cargar() {
    api.get('/api/trabajadores').then(setTrabajadores).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    try {
      await api.post('/api/trabajadores', form)
      setMensaje({ type: 'ok', text: 'Trabajador agregado correctamente' })
      setForm(INITIAL)
      cargar()
    } catch (err) {
      setMensaje({ type: 'err', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">

      {/* Formulario */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar trabajador</h2>

        {mensaje && (
          <div className={`rounded-lg p-3 mb-4 text-sm ${
            mensaje.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              type="text"
              value={form.nombre}
              onChange={set('nombre')}
              required
            />
          </div>
          <div>
            <label className="label">Cédula</label>
            <input
              className="input"
              type="text"
              value={form.cedula}
              onChange={set('cedula')}
              placeholder="Ej: 1234567890"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input"
              type="tel"
              value={form.telefono}
              onChange={set('telefono')}
              placeholder="Ej: 3001234567"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Agregar trabajador'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Trabajadores</h2>

        {trabajadores.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Sin trabajadores registrados</p>
        ) : (
          <div className="space-y-2">
            {trabajadores.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
              >
                <p className="font-semibold text-gray-800">{t.nombre}</p>
                <div className="flex gap-4 mt-1">
                  {t.cedula && (
                    <span className="text-xs text-gray-500">CC {t.cedula}</span>
                  )}
                  {t.telefono && (
                    <a
                      href={`tel:${t.telefono}`}
                      className="text-xs text-green-700 underline"
                    >
                      {t.telefono}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
