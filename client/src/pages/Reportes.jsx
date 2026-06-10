import { useState } from 'react'
import { api } from '../api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return `$${Number(n ?? 0).toLocaleString('es-CO')}`
}

function fmtKg(n) {
  return `${Number(n ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })} kg`
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)) // lunes
  d.setHours(0, 0, 0, 0)
  return isoDate(d)
}

function startOfMonth() {
  const d = new Date()
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

function today() {
  return isoDate(new Date())
}

// ── Componentes menores ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'bg-white' }) {
  return (
    <div className={`rounded-xl border border-gray-200 shadow-sm p-4 ${color}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{children}</p>
}

// ── Página principal ──────────────────────────────────────────────────────────
const PERIODOS = [
  { value: 'semanal',   label: 'Semanal' },
  { value: 'mensual',   label: 'Mensual' },
  { value: 'cosecha',   label: 'Por cosecha' },
]

export default function Reportes() {
  const [periodo, setPeriodo]     = useState('mensual')
  const [desde, setDesde]         = useState(startOfMonth)
  const [hasta, setHasta]         = useState(today)
  const [reporte, setReporte]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [exportando, setExportando] = useState(false)
  const [error, setError]         = useState(null)

  function seleccionarPeriodo(p) {
    setPeriodo(p)
    if (p === 'semanal') { setDesde(startOfWeek()); setHasta(today()) }
    if (p === 'mensual') { setDesde(startOfMonth()); setHasta(today()) }
    // 'cosecha' deja que el usuario elija las fechas libremente
  }

  async function generar() {
    setLoading(true)
    setError(null)
    setReporte(null)
    try {
      const qs = `fecha_inicio=${desde}&fecha_fin=${hasta}`
      const [resumen, ventasFiltradas, gastosFiltrados, aportesResumen] = await Promise.all([
        api.get(`/api/transacciones/resumen?${qs}`),
        api.get(`/api/ventas?desde=${desde}&hasta=${hasta}`),
        api.get(`/api/gastos?desde=${desde}&hasta=${hasta}`),
        api.get('/api/aportes/resumen'),
      ])

      // Kilos totales vendidos
      const kilosTotales = ventasFiltradas.reduce((sum, v) => (
        sum +
        Number(v.kilos_primera || 0) +
        Number(v.kilos_segunda  || 0)
      ), 0)

      // Egresos por categoría
      const porCategoria = gastosFiltrados.reduce((acc, g) => {
        const cat = g.categoria || 'sin categoría'
        acc[cat] = (acc[cat] || 0) + Number(g.valor)
        return acc
      }, {})

      const pagosTrabajadores = gastosFiltrados.filter(
        (g) => g.categoria === 'pago_trabajador'
      )

      setReporte({
        resumen,
        ventasFiltradas,
        gastosFiltrados,
        kilosTotales,
        porCategoria,
        aportesResumen,
        pagosTrabajadores,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function exportarPDF() {
    if (!reporte) return
    setExportando(true)
    try {
      const { default: jsPDF }    = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const G   = [26, 107, 58]          // corporate green #1a6b3a
      const DRK = [30, 30, 30]           // near-black text
      const GRY = [243, 244, 246]        // gray-100 bg
      const SUB = [229, 231, 235]        // gray-200 subtotal rows
      const WHT = [255, 255, 255]

      const pW = doc.internal.pageSize.getWidth()    // 210 mm
      const pH = doc.internal.pageSize.getHeight()   // 297 mm
      const mL = 14
      const mR = 14
      const mTop = 20

      const genDateStr = new Date().toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
      const reportNum = `RPT-${desde.replace(/-/g, '')}-${hasta.replace(/-/g, '')}`

      // ── header band drawn on each page ──
      function drawHeader() {
        doc.setFillColor(...G)
        doc.rect(0, 0, pW, 13, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(...WHT)
        doc.text('PIEDRAS GORDAS', mL, 9)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.text('Finca de producción · Reporte financiero', pW - mR, 9, { align: 'right' })
      }

      drawHeader()

      let y = 19

      // Report meta
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...DRK)
      doc.text(reportNum, mL, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 100, 100)
      doc.text(`Período: ${desde} al ${hasta}   ·   Generado: ${genDateStr}`, mL, y + 5)

      y += 11

      // Divider
      doc.setDrawColor(...G)
      doc.setLineWidth(0.5)
      doc.line(mL, y, pW - mR, y)
      y += 7

      // ── helpers ──
      const BASE = {
        styles:             { fontSize: 7.5, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles:         { fillColor: G, textColor: WHT, fontStyle: 'bold', fontSize: 8 },
        footStyles:         { fillColor: GRY, textColor: DRK, fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin:             { left: mL, right: mR },
        didDrawPage:        () => { drawHeader() },
      }

      function secTitle(text, curY) {
        if (curY > pH - 55) { doc.addPage(); drawHeader(); curY = mTop }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...G)
        doc.text(text, mL, curY)
        return curY + 4
      }

      // ── 1. RESUMEN GENERAL ──
      y = secTitle('RESUMEN GENERAL', y)
      const totalEgresos = Number(reporte.resumen.total_gastos ?? 0) + Number(reporte.resumen.total_pagos_socios ?? 0)
      const bal = Number(reporte.resumen.balance)

      autoTable(doc, {
        ...BASE,
        startY: y,
        head: [['Ingresos totales', 'Egresos totales', 'Balance neto', 'Kilos vendidos']],
        body: [[
          fmt(reporte.resumen.total_ingresos),
          fmt(totalEgresos),
          fmt(bal),
          fmtKg(reporte.kilosTotales),
        ]],
        styles:    { ...BASE.styles, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        headStyles: { ...BASE.headStyles, halign: 'center' },
        columnStyles: {
          0: { textColor: [20, 120, 60] },
          1: { textColor: [180, 30, 30] },
          2: { textColor: bal >= 0 ? [20, 120, 60] : [180, 30, 30] },
          3: { textColor: DRK },
        },
      })
      y = doc.lastAutoTable.finalY + 8

      // ── 2. VENTAS ──
      if (reporte.ventasFiltradas.length > 0) {
        y = secTitle('VENTAS', y)
        const totKg1 = reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_primera || 0), 0)
        const totKg2 = reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_segunda  || 0), 0)
        const totKg3 = reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_tercera  || 0), 0)
        const totV   = reporte.ventasFiltradas.reduce((s, v) => s + Number(v.total_ingreso  || 0), 0)
        const fmtN   = (n) => Number(n || 0).toLocaleString('es-CO')

        autoTable(doc, {
          ...BASE,
          startY: y,
          head: [['Fecha', 'Producto', '1ª kg', '1ª precio', '2ª kg', '2ª precio', '3ª kg', 'Total']],
          body: reporte.ventasFiltradas.map((v) => [
            new Date(v.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
            v.producto,
            v.kilos_primera  ? `${fmtN(v.kilos_primera)} kg`  : '—',
            v.precio_primera ? fmt(v.precio_primera)           : '—',
            v.kilos_segunda  ? `${fmtN(v.kilos_segunda)} kg`  : '—',
            v.precio_segunda ? fmt(v.precio_segunda)           : '—',
            v.kilos_tercera  ? `${fmtN(v.kilos_tercera)} kg`  : '—',
            { content: fmt(v.total_ingreso), styles: { fontStyle: 'bold', textColor: [20, 120, 60] } },
          ]),
          foot: [[
            '', `Total (${reporte.ventasFiltradas.length})`,
            `${fmtN(totKg1)} kg`, '',
            `${fmtN(totKg2)} kg`, '',
            `${fmtN(totKg3)} kg`,
            { content: fmt(totV), styles: { halign: 'right' } },
          ]],
          showFoot: 'lastPage',
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 26 },
            3: { halign: 'right' },
            5: { halign: 'right' },
            7: { halign: 'right' },
          },
        })
        y = doc.lastAutoTable.finalY + 8
      }

      // ── 3. GASTOS POR CATEGORÍA ──
      if (reporte.gastosFiltrados.length > 0) {
        y = secTitle('GASTOS POR CATEGORÍA', y)

        const ORD = ['insumos', 'pago_trabajador', 'combustible', 'otro']
        const LBL = { insumos: 'Insumos', pago_trabajador: 'Pago trabajador', combustible: 'Combustible', otro: 'Otro' }
        const normC = (c) => { const lc = (c || 'otro').toLowerCase(); return ORD.includes(lc) ? lc : 'otro' }
        const grps  = Object.fromEntries(ORD.map((c) => [c, []]))
        reporte.gastosFiltrados.forEach((g) => grps[normC(g.categoria)].push(g))
        const totG = reporte.gastosFiltrados.reduce((s, g) => s + Number(g.valor), 0)

        const body = []
        ORD.forEach((cat) => {
          const filas = grps[cat]
          if (!filas.length) return
          const sub = filas.reduce((s, g) => s + Number(g.valor), 0)
          const pct = totG > 0 ? ((sub / totG) * 100).toFixed(0) : 0

          body.push([{
            content: LBL[cat].toUpperCase(),
            colSpan: 3,
            styles: { fillColor: G, textColor: WHT, fontStyle: 'bold', fontSize: 8 },
          }])
          filas.forEach((g) => body.push([
            new Date(g.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
            g.descripcion || '—',
            { content: fmt(g.valor), styles: { halign: 'right' } },
          ]))
          body.push([
            { content: `Subtotal ${LBL[cat]} · ${pct}%`, colSpan: 2,
              styles: { fillColor: SUB, fontStyle: 'bold', textColor: DRK } },
            { content: fmt(sub), styles: { halign: 'right', fillColor: SUB, fontStyle: 'bold', textColor: DRK } },
          ])
        })

        autoTable(doc, {
          ...BASE,
          startY: y,
          head: [['Fecha', 'Descripción', 'Valor']],
          body,
          foot: [['', 'TOTAL GASTOS',
            { content: fmt(totG), styles: { halign: 'right' } },
          ]],
          showFoot: 'lastPage',
          columnStyles: {
            0: { cellWidth: 22 },
            2: { halign: 'right', cellWidth: 32 },
          },
        })
        y = doc.lastAutoTable.finalY + 8
      }

      // ── 4. SOCIOS ──
      if (reporte.aportesResumen?.length > 0) {
        y = secTitle('SOCIOS', y)

        autoTable(doc, {
          ...BASE,
          startY: y,
          head: [['Socio', 'Aportado', 'Devuelto', 'Saldo pendiente']],
          body: reporte.aportesResumen.map((s) => [
            s.socio_nombre,
            { content: fmt(s.total_aportado), styles: { halign: 'right', textColor: [20, 120, 60] } },
            { content: fmt(s.total_devuelto),  styles: { halign: 'right', textColor: [30, 80, 160] } },
            { content: fmt(s.saldo_pendiente), styles: { halign: 'right', fontStyle: 'bold',
              textColor: Number(s.saldo_pendiente) > 0 ? [160, 80, 0] : DRK } },
          ]),
          foot: [['TOTAL',
            { content: fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.total_aportado), 0)), styles: { halign: 'right' } },
            { content: fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.total_devuelto),  0)), styles: { halign: 'right' } },
            { content: fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.saldo_pendiente), 0)), styles: { halign: 'right' } },
          ]],
          showFoot: 'lastPage',
          styles: { ...BASE.styles, fontSize: 8 },
        })
        y = doc.lastAutoTable.finalY + 8
      }

      // ── 5. PAGOS A TRABAJADORES ──
      if (reporte.pagosTrabajadores?.length > 0) {
        y = secTitle('PAGOS A TRABAJADORES', y)

        autoTable(doc, {
          ...BASE,
          startY: y,
          head: [['Trabajador', 'Fecha', 'Monto']],
          body: reporte.pagosTrabajadores.map((g) => [
            g.descripcion || '—',
            new Date(g.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
            { content: fmt(g.valor), styles: { halign: 'right', fontStyle: 'bold' } },
          ]),
          foot: [[
            `Total (${reporte.pagosTrabajadores.length} pagos)`, '',
            { content: fmt(reporte.pagosTrabajadores.reduce((s, g) => s + Number(g.valor), 0)),
              styles: { halign: 'right' } },
          ]],
          showFoot: 'lastPage',
          styles: { ...BASE.styles, fontSize: 8 },
          columnStyles: {
            1: { cellWidth: 28 },
            2: { cellWidth: 30, halign: 'right' },
          },
        })
      }

      // ── footer on every page ──
      const numPages = doc.internal.getNumberOfPages()
      for (let p = 1; p <= numPages; p++) {
        doc.setPage(p)
        doc.setDrawColor(...G)
        doc.setLineWidth(0.3)
        doc.line(mL, pH - 12, pW - mR, pH - 12)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(140, 140, 140)
        doc.text(`Generado por Piedras Gordas · ${genDateStr}`, mL, pH - 8)
        doc.text(`Página ${p} de ${numPages}`, pW - mR, pH - 8, { align: 'right' })
      }

      doc.save(`reporte-piedras-gordas-${desde}-${hasta}.pdf`)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        <SectionTitle>Reporte</SectionTitle>

        {/* Selector de período */}
        <div className="grid grid-cols-3 gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => seleccionarPeriodo(p.value)}
              className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                periodo === p.value
                  ? 'bg-green-700 text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Desde</label>
            <input
              className="input"
              type="date"
              value={desde}
              onChange={(e) => { setDesde(e.target.value); setPeriodo('cosecha') }}
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              className="input"
              type="date"
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); setPeriodo('cosecha') }}
            />
          </div>
        </div>

        <button
          onClick={generar}
          disabled={loading || !desde || !hasta}
          className="btn-primary"
        >
          {loading ? 'Generando...' : 'Generar reporte'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* ── Reporte ── */}
      {reporte && (
        <div className="space-y-6">

          {/* Botón exportar PDF */}
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white disabled:opacity-60 active:bg-green-800 transition-colors"
          >
            {exportando ? 'Generando PDF...' : '⬇ Exportar PDF'}
          </button>

          <div className="space-y-6">

          {/* 1. Resumen general */}
          <div>
            <SectionTitle>Resumen general</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Ingresos totales"
                value={fmt(reporte.resumen.total_ingresos)}
                sub={`${reporte.ventasFiltradas.length} ventas`}
                color="bg-green-50"
              />
              <StatCard
                label="Egresos totales"
                value={fmt(
                  Number(reporte.resumen.total_gastos ?? 0) +
                  Number(reporte.resumen.total_pagos_socios ?? 0)
                )}
                sub={`${reporte.gastosFiltrados.length} gastos`}
                color="bg-red-50"
              />
              <StatCard
                label="Balance neto"
                value={fmt(reporte.resumen.balance)}
                color={Number(reporte.resumen.balance) >= 0 ? 'bg-blue-50' : 'bg-red-100'}
              />
              <StatCard
                label="Kilos vendidos"
                value={fmtKg(reporte.kilosTotales)}
                sub="primera + segunda"
              />
            </div>
          </div>

          {/* 2. Ventas */}
          <div>
            <SectionTitle>Ventas</SectionTitle>
            {reporte.ventasFiltradas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin ventas en el período</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Tabla con scroll horizontal en móvil */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Fecha</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Producto</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">1ª kg / precio</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">2ª kg / precio</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">3ª kg</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reporte.ventasFiltradas.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                            {new Date(v.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{v.producto}</td>
                          <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                            {v.kilos_primera
                              ? `${Number(v.kilos_primera).toLocaleString('es-CO')} kg / $${Number(v.precio_primera ?? 0).toLocaleString('es-CO')}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                            {v.kilos_segunda
                              ? `${Number(v.kilos_segunda).toLocaleString('es-CO')} kg / $${Number(v.precio_segunda ?? 0).toLocaleString('es-CO')}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                            {v.kilos_tercera
                              ? `${Number(v.kilos_tercera).toLocaleString('es-CO')} kg`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-green-700 whitespace-nowrap">
                            {fmt(v.total_ingreso)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-gray-600">
                          Total ({reporte.ventasFiltradas.length} ventas)
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">
                          {fmtKg(reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_primera || 0), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">
                          {fmtKg(reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_segunda || 0), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">
                          {fmtKg(reporte.ventasFiltradas.reduce((s, v) => s + Number(v.kilos_tercera || 0), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-green-700">
                          {fmt(reporte.ventasFiltradas.reduce((s, v) => s + Number(v.total_ingreso || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. Gastos por categoría */}
          <div>
            <SectionTitle>Gastos por categoría</SectionTitle>
            {reporte.gastosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin gastos en el período</p>
            ) : (
              <GastosPorCategoria gastos={reporte.gastosFiltrados} />
            )}
          </div>

          {/* 4. Socios */}
          <div>
            <SectionTitle>Socios</SectionTitle>
            {!reporte.aportesResumen || reporte.aportesResumen.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin socios registrados</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[360px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Socio</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Aportado</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Devuelto</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reporte.aportesResumen.map((s) => (
                        <tr key={s.socio_id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{s.socio_nombre}</td>
                          <td className="px-3 py-2 text-right text-green-700 whitespace-nowrap">{fmt(s.total_aportado)}</td>
                          <td className="px-3 py-2 text-right text-blue-600 whitespace-nowrap">{fmt(s.total_devuelto)}</td>
                          <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${Number(s.saldo_pendiente) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {fmt(s.saldo_pendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-600">Total</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-green-700">
                          {fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.total_aportado), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">
                          {fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.total_devuelto), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-orange-600">
                          {fmt(reporte.aportesResumen.reduce((s, r) => s + Number(r.saldo_pendiente), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 4b. Pagos a trabajadores */}
          <div>
            <SectionTitle>Pagos a trabajadores</SectionTitle>
            {reporte.pagosTrabajadores.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin pagos a trabajadores en el período</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[320px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Trabajador</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Fecha</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reporte.pagosTrabajadores.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{g.descripcion || '—'}</td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                            {new Date(g.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-blue-700 whitespace-nowrap">
                            {fmt(g.valor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-gray-600">
                          Total ({reporte.pagosTrabajadores.length} pagos)
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-700">
                          {fmt(reporte.pagosTrabajadores.reduce((s, g) => s + Number(g.valor), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          </div>

        </div>
      )}

    </div>
  )
}

// ── Categorías conocidas — las demás caen en "otro" ──────────────────────────
const CATS_ORDEN = ['insumos', 'pago_trabajador', 'combustible', 'otro']

function normalizarCat(cat) {
  const c = (cat || 'otro').toLowerCase()
  return CATS_ORDEN.includes(c) ? c : 'otro'
}

const CAT_LABEL = {
  insumos:          'Insumos',
  pago_trabajador:  'Pago trabajador',
  combustible:      'Combustible',
  otro:             'Otro',
}

const CAT_COLOR = {
  insumos:         'bg-purple-50  text-purple-700',
  pago_trabajador: 'bg-blue-50    text-blue-700',
  combustible:     'bg-orange-50  text-orange-700',
  otro:            'bg-gray-50    text-gray-600',
}

function GastosPorCategoria({ gastos }) {
  // Agrupar filas por categoría normalizada
  const grupos = CATS_ORDEN.reduce((acc, cat) => {
    acc[cat] = gastos.filter((g) => normalizarCat(g.categoria) === cat)
    return acc
  }, {})

  const totalGlobal = gastos.reduce((s, g) => s + Number(g.valor), 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[400px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Fecha</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Descripción</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {CATS_ORDEN.map((cat) => {
              const filas = grupos[cat]
              if (filas.length === 0) return null
              const subtotal = filas.reduce((s, g) => s + Number(g.valor), 0)
              const pct = totalGlobal > 0 ? ((subtotal / totalGlobal) * 100).toFixed(0) : 0
              return (
                <>
                  {/* Encabezado de categoría */}
                  <tr key={`cat-${cat}`} className="border-t border-gray-100">
                    <td
                      colSpan={3}
                      className={`px-3 py-1.5 font-semibold ${CAT_COLOR[cat]}`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${CAT_COLOR[cat]}`}>
                        {CAT_LABEL[cat]}
                      </span>
                    </td>
                  </tr>

                  {/* Filas de la categoría */}
                  {filas.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                        {new Date(g.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {g.descripcion || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 whitespace-nowrap">
                        {fmt(g.valor)}
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal de categoría */}
                  <tr key={`sub-${cat}`} className={`border-t border-gray-200 ${CAT_COLOR[cat]}`}>
                    <td colSpan={2} className="px-3 py-1.5 font-semibold text-right">
                      Subtotal {CAT_LABEL[cat]} · {pct}%
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold whitespace-nowrap">
                      {fmt(subtotal)}
                    </td>
                  </tr>
                </>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-gray-600">
                Total gastos ({gastos.length} registros)
              </td>
              <td className="px-3 py-2 text-right text-sm font-bold text-red-600">
                {fmt(totalGlobal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
