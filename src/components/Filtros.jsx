import { useState, useMemo } from 'react'
import { Icons } from './Icons'
import './Filtros.css'

export const FILTROS_VACIOS = {
  search: '',
  equipoId: '',
  tipoId: '',
  tecnicoId: '',
  fechaDesde: '',
  fechaHasta: ''
}

export const normalize = (str) =>
  String(str ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

// Devuelve true si el item pasa todos los filtros activos
export const matchesFiltros = (item, filtros) => {
  // Búsqueda libre: divide en términos, todos deben aparecer
  if (filtros.search?.trim()) {
    const terms = normalize(filtros.search).split(/\s+/).filter(Boolean)
    const haystack = normalize([
      item.id_intervencion,
      item.equipos?.nombre, item.equipos?.marca, item.equipos?.modelo, item.equipos?.fabricante,
      item.tipo_novedad?.nombre,
      item.descripcion,
      item.hora_parada,
      item.fecha,
      ...(item.intervencion_tecnico?.map(it => it.tecnicos?.nombre) || []),
      ...(item.intervencion_tecnico?.map(it => it.tecnicos?.entidad) || []),
      item.detalle_intervencion?.[0]?.componentes?.nombre_componente,
      item.detalle_intervencion?.[0]?.repuestos?.nombre_repuesto,
      item.detalle_intervencion?.[0]?.repuestos?.referencia
    ].filter(Boolean).join(' '))
    if (!terms.every(t => haystack.includes(t))) return false
  }
  if (filtros.equipoId && String(item.fk_id_equipo) !== String(filtros.equipoId)) return false
  if (filtros.tipoId && String(item.fk_id_tipo_novedad) !== String(filtros.tipoId)) return false
  if (filtros.tecnicoId) {
    const ids = item.intervencion_tecnico?.map(it => String(it.fk_id_tecnico)) || []
    if (!ids.includes(String(filtros.tecnicoId))) return false
  }
  if (filtros.fechaDesde && (!item.fecha || item.fecha < filtros.fechaDesde)) return false
  if (filtros.fechaHasta && (!item.fecha || item.fecha > filtros.fechaHasta)) return false
  return true
}

const countActivos = (filtros) =>
  ['equipoId', 'tipoId', 'tecnicoId', 'fechaDesde', 'fechaHasta']
    .filter(k => filtros[k]).length

export default function Filtros({
  filtros, onFiltrosChange,
  equipos, tiposNovedad, tecnicos,
  totalRegistros, totalFiltrados
}) {
  const [open, setOpen] = useState(false)
  const activos = useMemo(() => countActivos(filtros), [filtros])
  const algunFiltro = activos > 0 || filtros.search?.trim()

  const update = (patch) => onFiltrosChange({ ...filtros, ...patch })
  const limpiar = () => onFiltrosChange(FILTROS_VACIOS)

  return (
    <div className="filtros">
      {/* Top row: search + filter toggle */}
      <div className="filtros-top">
        <div className="search-box">
          <span className="search-icon">{Icons.search}</span>
          <input
            type="text"
            placeholder="Buscar por equipo, técnico, descripción, ID..."
            value={filtros.search}
            onChange={(e) => update({ search: e.target.value })}
            className="search-input"
          />
          {filtros.search && (
            <button className="search-clear" onClick={() => update({ search: '' })} title="Limpiar búsqueda">
              {Icons.close}
            </button>
          )}
        </div>

        <button
          type="button"
          className={`filtros-toggle ${open ? 'filtros-toggle--open' : ''} ${activos > 0 ? 'filtros-toggle--active' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          {Icons.filter}
          <span>Filtros</span>
          {activos > 0 && <span className="filtros-badge">{activos}</span>}
        </button>
      </div>

      {/* Expandable panel */}
      {open && (
        <div className="filtros-panel">
          <div className="filtros-grid">
            <div className="filtros-field">
              <label className="filtros-label">Equipo</label>
              <select
                value={filtros.equipoId}
                onChange={(e) => update({ equipoId: e.target.value })}
                className="filtros-select"
              >
                <option value="">Todos los equipos</option>
                {equipos.map(e => (
                  <option key={e.id_equipo} value={e.id_equipo}>
                    {e.nombre}{e.marca ? ` — ${e.marca}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtros-field">
              <label className="filtros-label">Tipo de novedad</label>
              <select
                value={filtros.tipoId}
                onChange={(e) => update({ tipoId: e.target.value })}
                className="filtros-select"
              >
                <option value="">Todos los tipos</option>
                {tiposNovedad.map(t => (
                  <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filtros-field">
              <label className="filtros-label">Técnico responsable</label>
              <select
                value={filtros.tecnicoId}
                onChange={(e) => update({ tecnicoId: e.target.value })}
                className="filtros-select"
              >
                <option value="">Todos los técnicos</option>
                {tecnicos.map(t => (
                  <option key={t.id_tecnico} value={t.id_tecnico}>
                    {t.nombre}{t.entidad ? ` (${t.entidad})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtros-field filtros-field--dates">
              <label className="filtros-label">
                <span className="filtros-label-icon">{Icons.calendar}</span>
                Rango de fechas
              </label>
              <div className="filtros-dates">
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  max={filtros.fechaHasta || undefined}
                  onChange={(e) => update({ fechaDesde: e.target.value })}
                  className="filtros-date"
                  title="Desde"
                />
                <span className="filtros-date-sep">→</span>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  min={filtros.fechaDesde || undefined}
                  onChange={(e) => update({ fechaHasta: e.target.value })}
                  className="filtros-date"
                  title="Hasta"
                />
              </div>
            </div>
          </div>

          <div className="filtros-footer">
            <span className="filtros-resultados">
              Mostrando <strong>{totalFiltrados}</strong> de {totalRegistros}
            </span>
            {algunFiltro && (
              <button type="button" className="filtros-limpiar" onClick={limpiar}>
                {Icons.close}
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active chips when panel is closed */}
      {!open && algunFiltro && (
        <div className="filtros-chips">
          {filtros.equipoId && (
            <Chip label={`Equipo: ${equipos.find(e => String(e.id_equipo) === String(filtros.equipoId))?.nombre || '?'}`}
              onRemove={() => update({ equipoId: '' })} />
          )}
          {filtros.tipoId && (
            <Chip label={`Tipo: ${tiposNovedad.find(t => String(t.id_tipo) === String(filtros.tipoId))?.nombre || '?'}`}
              onRemove={() => update({ tipoId: '' })} />
          )}
          {filtros.tecnicoId && (
            <Chip label={`Técnico: ${tecnicos.find(t => String(t.id_tecnico) === String(filtros.tecnicoId))?.nombre || '?'}`}
              onRemove={() => update({ tecnicoId: '' })} />
          )}
          {filtros.fechaDesde && (
            <Chip label={`Desde: ${filtros.fechaDesde}`} onRemove={() => update({ fechaDesde: '' })} />
          )}
          {filtros.fechaHasta && (
            <Chip label={`Hasta: ${filtros.fechaHasta}`} onRemove={() => update({ fechaHasta: '' })} />
          )}
          <button type="button" className="filtros-limpiar filtros-limpiar--inline" onClick={limpiar}>
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span className="filtros-chip">
      {label}
      <button type="button" className="filtros-chip-remove" onClick={onRemove}>
        {Icons.close}
      </button>
    </span>
  )
}
