import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
  LabelList
} from 'recharts'
import './Graficas.css'

const COLORS = ['#0b3d91', '#1a56c4', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
const PIE_COLORS = {
  'Leve': '#059669',
  'Media': '#d97706',
  'Crítica': '#dc2626',
}

function parseDuracion(horaParada) {
  if (!horaParada) return null
  const str = String(horaParada).toLowerCase()
  let total = 0
  const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/)
  const mMatch = str.match(/(\d+(?:\.\d+)?)\s*m/)
  if (hMatch) total += parseFloat(hMatch[1])
  if (mMatch) total += parseFloat(mMatch[1]) / 60
  if (!hMatch && !mMatch) {
    const num = parseFloat(str)
    if (!isNaN(num)) total = num
  }
  return total > 0 ? total : null
}

function getMonthLabel(fecha) {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getCriticidad(tipoNovedad) {
  if (!tipoNovedad) return 'Leve'
  if (tipoNovedad.criticidad) return tipoNovedad.criticidad
  const name = (tipoNovedad.nombre || '').toLowerCase()
  if (name.includes('critic') || name.includes('correctiv') || name.includes('paro')) return 'Crítica'
  if (name.includes('media') || name.includes('moderada') || name.includes('inspeccion') || name.includes('inspección')) return 'Media'
  return 'Leve'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 2) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function Graficas({ intervenciones }) {
  if (!intervenciones || intervenciones.length === 0) {
    return (
      <div className="graficas-empty">
        <p>No hay datos suficientes para mostrar gráficas.</p>
      </div>
    )
  }

  // --- Chart 1: Fallas por tipo ---
  const fallasPorTipo = Object.values(
    intervenciones.reduce((acc, inv) => {
      const tipo = inv.tipo_novedad?.nombre || 'Sin tipo'
      acc[tipo] = acc[tipo] || { tipo, cantidad: 0 }
      acc[tipo].cantidad++
      return acc
    }, {})
  ).sort((a, b) => b.cantidad - a.cantidad)

  // --- Chart 2: Intervenciones por mes (con duración promedio si disponible) ---
  const porMes = {}
  intervenciones.forEach(inv => {
    const mes = getMonthLabel(inv.fecha)
    if (!mes) return
    if (!porMes[mes]) porMes[mes] = { mes, count: 0, totalHoras: 0, conHoras: 0 }
    porMes[mes].count++
    const dur = parseDuracion(inv.hora_parada)
    if (dur !== null) {
      porMes[mes].totalHoras += dur
      porMes[mes].conHoras++
    }
  })
  const datosPorMes = Object.values(porMes)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(m => ({
      mes: m.mes,
      intervenciones: m.count,
      promHoras: m.conHoras > 0 ? parseFloat((m.totalHoras / m.conHoras).toFixed(2)) : null
    }))
  const tieneDuraciones = datosPorMes.some(d => d.promHoras !== null)

  // --- Chart 3: Piezas que más fallan ---
  const piezaMap = {}
  intervenciones.forEach(inv => {
    const equipo = inv.equipos?.nombre || 'Desconocido'
    inv.detalle_intervencion?.forEach(det => {
      const pieza = det.componentes?.nombre_componente
      if (!pieza) return
      const key = `${pieza} (${equipo})`
      piezaMap[key] = (piezaMap[key] || 0) + 1
    })
  })
  const piezasFallas = Object.entries(piezaMap)
    .map(([pieza, fallas]) => ({ pieza, fallas }))
    .sort((a, b) => b.fallas - a.fallas)
    .slice(0, 10)

  // --- Chart 4: Repuestos más utilizados ---
  const repuestoMap = {}
  intervenciones.forEach(inv => {
    inv.detalle_intervencion?.forEach(det => {
      const rep = det.repuestos?.nombre_repuesto
      if (!rep) return
      repuestoMap[rep] = (repuestoMap[rep] || 0) + (det.cantidad_usada || 1)
    })
  })
  const repuestosDatos = Object.entries(repuestoMap)
    .map(([repuesto, usos]) => ({ repuesto, usos }))
    .sort((a, b) => b.usos - a.usos)
    .slice(0, 8)

  // --- Chart 5: Distribución por criticidad ---
  const criticidadMap = { Leve: 0, Media: 0, 'Crítica': 0 }
  intervenciones.forEach(inv => {
    const c = getCriticidad(inv.tipo_novedad)
    criticidadMap[c] = (criticidadMap[c] || 0) + 1
  })
  const criticidadDatos = Object.entries(criticidadMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const total = intervenciones.length

  return (
    <div className="graficas-container">

      {/* Chart 1 */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Fallas por tipo</h3>
          <p className="chart-desc">Frecuencia de cada tipo de novedad registrada</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fallasPorTipo} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ec" />
            <XAxis dataKey="tipo" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cantidad" name="Cantidad" fill="#0b3d91" radius={[4, 4, 0, 0]}>
              {fallasPorTipo.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList dataKey="cantidad" position="top" style={{ fontSize: 12, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2 */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            {tieneDuraciones ? 'Duración promedio de mantenimiento por mes' : 'Intervenciones por mes'}
          </h3>
          <p className="chart-desc">
            {tieneDuraciones
              ? 'Horas promedio de parada por mes (basado en hora de parada registrada)'
              : 'Cantidad de intervenciones registradas por mes'}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosPorMes} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ec" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {tieneDuraciones ? (
              <Line
                type="monotone"
                dataKey="promHoras"
                name="Horas promedio"
                stroke="#0b3d91"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#0b3d91' }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            ) : (
              <Line
                type="monotone"
                dataKey="intervenciones"
                name="Intervenciones"
                stroke="#0b3d91"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#0b3d91' }}
                activeDot={{ r: 7 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3 */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Piezas que más fallan por compresor</h3>
          <p className="chart-desc">Componentes con mayor cantidad de fallas registradas</p>
        </div>
        {piezasFallas.length === 0 ? (
          <div className="chart-no-data">No hay datos de componentes registrados</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(250, piezasFallas.length * 40)}>
            <BarChart
              layout="vertical"
              data={piezasFallas}
              margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ec" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="pieza" tick={{ fontSize: 11 }} width={180} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fallas" name="Fallas" fill="#1a56c4" radius={[0, 4, 4, 0]}>
                {piezasFallas.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="fallas" position="right" style={{ fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 4 */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Repuestos más utilizados</h3>
          <p className="chart-desc">Frecuencia de uso de repuestos en intervenciones</p>
        </div>
        {repuestosDatos.length === 0 ? (
          <div className="chart-no-data">No hay datos de repuestos registrados</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repuestosDatos} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ec" />
              <XAxis dataKey="repuesto" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usos" name="Usos" fill="#2563eb" radius={[4, 4, 0, 0]}>
                {repuestosDatos.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="usos" position="top" style={{ fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 5 */}
      <div className="chart-card chart-card--pie">
        <div className="chart-header">
          <h3 className="chart-title">Distribución de fallas por criticidad</h3>
          <p className="chart-desc">Proporción de fallas según nivel de impacto</p>
        </div>
        <div className="pie-layout">
          <ResponsiveContainer width="60%" height={280}>
            <PieChart>
              <Pie
                data={criticidadDatos}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {criticidadDatos.map((entry, i) => (
                  <Cell key={i} fill={PIE_COLORS[entry.name] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} intervenciones`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {criticidadDatos.map((entry, i) => (
              <div key={i} className="pie-legend-item">
                <span className="pie-legend-dot" style={{ background: PIE_COLORS[entry.name] || COLORS[i] }} />
                <div>
                  <span className="pie-legend-name">{entry.name}</span>
                  <span className="pie-legend-val">{entry.value} ({((entry.value / total) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
