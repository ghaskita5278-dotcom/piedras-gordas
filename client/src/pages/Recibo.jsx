import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'

// ── Monto en letras (español, pesos colombianos) ──────────────────────────────
const UNIDADES = [
  '', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve',
]
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function centenasToWords(n) {
  if (n === 0) return ''
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100)
  const r = n % 100
  const cent = c > 0 ? CENTENAS[c] : ''
  let resto = ''
  if (r >= 20) {
    const d = Math.floor(r / 10)
    const u = r % 10
    resto = u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`
  } else if (r > 0) {
    resto = UNIDADES[r]
  }
  return [cent, resto].filter(Boolean).join(' ')
}

function toWords(n) {
  n = Math.floor(n)
  if (n === 0) return 'cero'
  const parts = []
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000)
    parts.push(m === 1 ? 'un millón' : `${toWords(m)} millones`)
    n %= 1000000
  }
  if (n >= 1000) {
    const k = Math.floor(n / 1000)
    parts.push(k === 1 ? 'mil' : `${toWords(k)} mil`)
    n %= 1000
  }
  if (n > 0) parts.push(centenasToWords(n))
  return parts.join(' ')
}

function montoEnLetras(valor) {
  const entero = Math.floor(Math.abs(valor))
  const centavos = Math.round((Math.abs(valor) - entero) * 100)
  const letras = toWords(entero).toUpperCase()
  return centavos > 0
    ? `${letras} PESOS CON ${centavos}/100 M/CTE`
    : `${letras} PESOS M/CTE`
}

// ── Canvas de firma ──────────────────────────────────────────────────────────
function FirmaCanvas({ onFirma, bloqueado }) {
  const canvasRef = useRef(null)
  const dibujando = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function coords(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const iniciar = useCallback((e) => {
    if (bloqueado) return
    e.preventDefault()
    dibujando.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = coords(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [bloqueado])

  const dibujar = useCallback((e) => {
    if (!dibujando.current || bloqueado) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = coords(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [bloqueado])

  const terminar = useCallback(() => {
    dibujando.current = false
  }, [])

  function limpiar() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onFirma(null)
  }

  function confirmar() {
    const canvas = canvasRef.current
    onFirma(canvas.toDataURL('image/png'))
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full touch-none"
          onMouseDown={iniciar}
          onMouseMove={dibujar}
          onMouseUp={terminar}
          onMouseLeave={terminar}
          onTouchStart={iniciar}
          onTouchMove={dibujar}
          onTouchEnd={terminar}
          style={{ cursor: bloqueado ? 'not-allowed' : 'crosshair' }}
        />
      </div>
      {!bloqueado && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={limpiar}
            className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="flex-1 py-2 text-sm bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg"
          >
            Confirmar y guardar firma
          </button>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Recibo() {
  const { id } = useParams()
  const [gasto, setGasto] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [receptor, setReceptor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [firmaImg, setFirmaImg] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/api/gastos/${id}`),
      api.get('/api/transacciones/resumen'),
    ])
      .then(([g, r]) => { setGasto(g); setResumen(r) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // Resolver nombre del receptor: trabajador primero, socio como fallback
  useEffect(() => {
    if (!gasto?.registrado_por) return
    api.get(`/api/trabajadores/${gasto.registrado_por}`)
      .then((t) => setReceptor(t.nombre))
      .catch(() =>
        api.get(`/api/socios/${gasto.registrado_por}`)
          .then((s) => setReceptor(s.nombre))
          .catch(() => setReceptor(null))
      )
  }, [gasto?.registrado_por])

  async function guardarFirma(dataUrl) {
    setFirmaImg(dataUrl)
    if (!dataUrl) return
    setGuardando(true)
    try {
      await api.put(`/api/gastos/${id}`, { ...gasto, firmado: true })
      setGuardado(true)
      setGasto((g) => ({ ...g, firmado: true }))
    } catch {
      // firma guardada localmente aunque falle el PUT
    } finally {
      setGuardando(false)
    }
  }

  async function descargarPDF() {
    const el = document.getElementById('recibo-imprimible')
    if (!el) return
    setGenerandoPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
      const imgW = canvas.width * ratio
      const imgH = canvas.height * ratio
      const x = (pageW - imgW) / 2
      pdf.addImage(imgData, 'PNG', x, 20, imgW, imgH)
      pdf.save(`recibo-${String(gasto.id).padStart(6, '0')}.pdf`)
    } finally {
      setGenerandoPdf(false)
    }
  }

  function abrirWhatsApp() {
    const monto = `$${Number(gasto.valor).toLocaleString('es-CO')}`
    const mensaje = `Recibo de pago Piedras Gordas - ${gasto.descripcion} - ${monto} - ${fecha}`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  function compartir() {
    if (navigator.share) {
      navigator.share({
        title: `Recibo #${id} — Piedras Gordas`,
        text: `${gasto.descripcion} — $${Number(gasto.valor).toLocaleString('es-CO')}`,
      }).catch(() => {})
    } else {
      window.print()
    }
  }

  if (loading) return <p className="text-center mt-10 text-gray-400">Cargando recibo...</p>
  if (error)   return <p className="text-center mt-10 text-red-500">{error}</p>
  if (!gasto)  return null

  const saldoDespues = Number(resumen?.balance ?? 0)
  const saldoAntes   = saldoDespues + Number(gasto.valor)
  const fecha = new Date(gasto.created_at).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-4 max-w-lg mx-auto">

      {/* ── Cuerpo del recibo ── */}
      <div id="recibo-imprimible" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 print:shadow-none print:border-none print:rounded-none">

        {/* Encabezado */}
        <div className="text-center border-b border-gray-100 pb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Recibo de pago</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Piedras Gordas</h1>
          <p className="text-sm text-gray-500 mt-1">{fecha}</p>
          <p className="text-xs text-gray-400">N.° {String(gasto.id).padStart(6, '0')}</p>
        </div>

        {/* Receptor y concepto */}
        <div className="space-y-3">
          <Row label="Receptor" value={receptor ?? (gasto.registrado_por ? 'Cargando…' : '—')} />
          <Row label="Concepto" value={gasto.descripcion} />
          <Row label="Categoría" value={gasto.categoria} />
          {gasto.tipo_pago && <Row label="Forma de pago" value={gasto.tipo_pago} />}
        </div>

        {/* Monto */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Valor</p>
          <p className="text-3xl font-bold text-green-800">
            ${Number(gasto.valor).toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-500 italic leading-snug">
            {montoEnLetras(gasto.valor)}
          </p>
        </div>

        {/* Saldo de caja */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Saldo antes</p>
            <p className="font-semibold text-gray-700 mt-0.5">
              ${saldoAntes.toLocaleString('es-CO')}
            </p>
          </div>
          <div className={`rounded-xl p-3 text-center ${saldoDespues >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-400">Saldo después</p>
            <p className={`font-semibold mt-0.5 ${saldoDespues >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${saldoDespues.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        {/* Firma */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Firma del receptor</p>
          {firmaImg ? (
            <div className="space-y-2">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={firmaImg} alt="Firma" className="w-full" />
              </div>
              {guardado && (
                <p className="text-xs text-green-700 text-center">✓ Firma guardada</p>
              )}
              {guardando && (
                <p className="text-xs text-gray-400 text-center">Guardando...</p>
              )}
            </div>
          ) : (
            <FirmaCanvas onFirma={guardarFirma} bloqueado={guardado} />
          )}
          {!firmaImg && (
            <p className="text-xs text-gray-400 text-center mt-1">
              Firma con el dedo en el recuadro
            </p>
          )}
        </div>

        {/* Pie */}
        <p className="text-center text-xs text-gray-300 pt-2 border-t border-gray-100">
          Generado por Piedras Gordas
        </p>
      </div>

      {/* ── Botones de acción (ocultos al imprimir) ── */}
      <div className="mt-4 print:hidden space-y-2">
        <button
          onClick={descargarPDF}
          disabled={generandoPdf}
          className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {generandoPdf ? 'Generando PDF…' : '⬇ Descargar PDF'}
        </button>
        <button
          onClick={abrirWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Compartir por WhatsApp
        </button>
        <button
          onClick={compartir}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Imprimir / Compartir
        </button>
      </div>

    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}
