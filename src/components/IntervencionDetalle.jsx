import { Icons } from './Icons'
import './IntervencionDetalle.css'

const fmt = (fecha) =>
  fecha
    ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      })
    : '—'

const getBadgeClass = (nombre) => {
  if (!nombre) return 'badge-blue'
  const n = nombre.toLowerCase()
  if (n.includes('preventiv')) return 'badge-green'
  if (n.includes('correctiv')) return 'badge-red'
  if (n.includes('inspección') || n.includes('inspeccion')) return 'badge-yellow'
  return 'badge-blue'
}

export default function IntervencionDetalle({ item, onClose, onEdit }) {
  if (!item) return null

  const tecnicos = item.intervencion_tecnico?.map(it => it.tecnicos).filter(Boolean) || []
  const detalle = item.detalle_intervencion?.[0]
  const equipo = item.equipos
  const tipoNovedad = item.tipo_novedad
  const usuario = item.usuarios

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detalle-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="detalle-header">
          <div className="detalle-header-left">
            <span className="detalle-id">#{item.id_intervencion}</span>
            {tipoNovedad && (
              <span className={`badge ${getBadgeClass(tipoNovedad.nombre)}`}>
                {tipoNovedad.nombre}
              </span>
            )}
          </div>
          <div className="detalle-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); onEdit(item) }}>
              {Icons.edit}
              <span>Editar</span>
            </button>
            <button className="modal-close" onClick={onClose}>{Icons.close}</button>
          </div>
        </div>

        <div className="detalle-body">

          {/* Foto */}
          {item.foto_url && (
            <div className="detalle-foto-wrap">
              <a href={item.foto_url} target="_blank" rel="noopener noreferrer">
                <img src={item.foto_url} alt="Fotografía de la intervención" className="detalle-foto" />
                <span className="detalle-foto-hint">Ver imagen completa</span>
              </a>
            </div>
          )}

          {/* Equipo + fecha */}
          <div className="detalle-section">
            <h4 className="detalle-section-title">
              <span className="detalle-section-icon">{Icons.list}</span>
              Información General
            </h4>
            <div className="detalle-grid">
              <div className="detalle-field">
                <span className="detalle-label">Equipo intervenido</span>
                <span className="detalle-value detalle-value--equipo">
                  {equipo?.nombre || '—'}
                  {(equipo?.marca || equipo?.modelo) && (
                    <span className="detalle-sub">
                      {[equipo.marca, equipo.modelo].filter(Boolean).join(' ')}
                    </span>
                  )}
                  {equipo?.fabricante && (
                    <span className="detalle-sub">{equipo.fabricante}</span>
                  )}
                </span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Tipo de novedad</span>
                <span className="detalle-value">
                  {tipoNovedad
                    ? <span className={`badge ${getBadgeClass(tipoNovedad.nombre)}`}>{tipoNovedad.nombre}</span>
                    : '—'}
                </span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Fecha de intervención</span>
                <span className="detalle-value">{fmt(item.fecha)}</span>
              </div>
              <div className="detalle-field">
                <span className="detalle-label">Hora de parada</span>
                <span className="detalle-value">{item.hora_parada || '—'}</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="detalle-section">
            <h4 className="detalle-section-title">
              <span className="detalle-section-icon">{Icons.fileText}</span>
              Descripción
            </h4>
            <p className="detalle-descripcion">{item.descripcion || 'Sin descripción.'}</p>
          </div>

          {/* Técnicos */}
          <div className="detalle-section">
            <h4 className="detalle-section-title">
              <span className="detalle-section-icon">{Icons.users}</span>
              Técnicos Responsables
            </h4>
            {tecnicos.length > 0 ? (
              <ul className="detalle-tecnicos">
                {tecnicos.map(t => (
                  <li key={t.id_tecnico} className="detalle-tecnico">
                    <span className="detalle-tecnico-avatar">{t.nombre?.[0]?.toUpperCase()}</span>
                    <div>
                      <span className="detalle-tecnico-nombre">{t.nombre}</span>
                      {t.entidad && <span className="detalle-tecnico-entidad">{t.entidad}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detalle-empty">Sin técnicos asignados.</p>
            )}
          </div>

          {/* Repuestos y componentes */}
          {(detalle?.componentes || detalle?.repuestos || detalle?.cantidad_usada) && (
            <div className="detalle-section">
              <h4 className="detalle-section-title">
                <span className="detalle-section-icon">{Icons.wrench}</span>
                Repuestos y Componentes
              </h4>
              <div className="detalle-grid">
                {detalle.componentes && (
                  <div className="detalle-field">
                    <span className="detalle-label">Componente afectado</span>
                    <span className="detalle-value">{detalle.componentes.nombre_componente}</span>
                  </div>
                )}
                {detalle.repuestos && (
                  <div className="detalle-field">
                    <span className="detalle-label">Repuesto utilizado</span>
                    <span className="detalle-value">
                      {detalle.repuestos.nombre_repuesto}
                      {detalle.repuestos.referencia && (
                        <span className="detalle-sub">Ref: {detalle.repuestos.referencia}</span>
                      )}
                    </span>
                  </div>
                )}
                {detalle.cantidad_usada != null && (
                  <div className="detalle-field">
                    <span className="detalle-label">Cantidad usada</span>
                    <span className="detalle-value">{detalle.cantidad_usada}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registro */}
          <div className="detalle-footer-info">
            <span className="detalle-registrado-icon">{Icons.user}</span>
            <span>
              Registrado por{' '}
              <strong>{usuario?.nombre || 'desconocido'}</strong>
              {usuario?.cedula && <span className="detalle-cedula"> · C.C. {usuario.cedula}</span>}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
