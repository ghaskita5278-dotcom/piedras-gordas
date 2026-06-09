import { useState, useEffect } from 'react'
import { api } from '../api'

const INITIAL = { nombre: '', telefono_whatsapp: '' }

export default function Socios() {
  const [socios, setSocios] = useState([])
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  function cargar() {
    api.get('/api/socios').then(setSocios).catch(() => {})
  }

  useEffect(() => { cargar() }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    try {
      await api.post('/api/socios', form)
      setMensaje({ type: 'ok', text: 'Socio agregado correctamente' })
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar socio</h2>

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
            <label className="label">Teléfono WhatsApp</label>
            <input
              className="input"
              type="tel"
              value={form.telefono_whatsapp}
              onChange={set('telefono_whatsapp')}
              placeholder="Ej: 3001234567"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Agregar socio'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">Socios</h2>

        {socios.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Sin socios registrados</p>
        ) : (
          <div className="space-y-2">
            {socios.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
              >
                <p className="font-semibold text-gray-800">{s.nombre}</p>
                {s.telefono_whatsapp && (
                  <a
                    href={`https://wa.me/${s.telefono_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-green-700 underline"
                  >
                    WhatsApp {s.telefono_whatsapp}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
