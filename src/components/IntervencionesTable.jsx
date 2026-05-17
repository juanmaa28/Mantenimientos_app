import { useState } from 'react'
import { Icons } from './Icons'
import Lightbox from './Lightbox'
import './IntervencionesTable.css'

export default function IntervencionesTable({ intervenciones, loading, isAdmin, onEdit, onDelete, onView }) {
  const [lightboxUrl, setLightboxUrl] = useState(null)
  if (loading) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Cargando intervenciones...</p>
        </div>
      </div>
    )
  }

  if (!intervenciones || intervenciones.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <span className="empty-icon">{Icons.clipboard}</span>
          <p>No hay intervenciones registradas</p>
          <span style={{ fontSize: '0.85rem' }}>Haz clic en "Nueva Intervención" para crear una</span>
        </div>
      </div>
    )
  }

  const getBadgeClass = (tipo) => {
    if (!tipo) return 'badge-blue'
    const name = tipo.toLowerCase()
    if (name.includes('preventiv')) return 'badge-green'
    if (name.includes('correctiv')) return 'badge-red'
    if (name.includes('inspección') || name.includes('inspeccion')) return 'badge-yellow'
    return 'badge-blue'
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foto</th>
              <th>Fecha</th>
              <th>Equipo</th>
              <th>Tipo Novedad</th>
              <th>Hora Parada</th>
              <th>Descripción</th>
              <th>Técnico(s)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {intervenciones.map((item, index) => (
              <tr key={item.id_intervencion} style={{ animationDelay: `${index * 0.04}s` }}>
                <td className="td-id">#{item.id_intervencion}</td>
                <td className="td-foto">
                  {item.foto_url ? (
                    <button className="foto-thumb-btn" onClick={() => setLightboxUrl(item.foto_url)} title="Ver imagen">
                      <img src={item.foto_url} alt="foto" className="foto-thumb" />
                    </button>
                  ) : (
                    <span className="foto-empty">{Icons.camera}</span>
                  )}
                </td>
                <td className="td-date">
                  {item.fecha
                    ? new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="td-equipo">
                  <div className="equipo-info">
                    <span className="equipo-nombre">{item.equipos?.nombre || '—'}</span>
                    {item.equipos?.marca && (
                      <span className="equipo-marca">{item.equipos.marca} {item.equipos.modelo || ''}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(item.tipo_novedad?.nombre)}`}>
                    {item.tipo_novedad?.nombre || '—'}
                  </span>
                </td>
                <td>{item.hora_parada || '—'}</td>
                <td className="td-desc">{item.descripcion || '—'}</td>
                <td className="td-tecnicos">
                  {item.intervencion_tecnico && item.intervencion_tecnico.length > 0
                    ? item.intervencion_tecnico
                        .map(it => it.tecnicos?.nombre)
                        .filter(Boolean)
                        .join(', ') || '—'
                    : '—'}
                </td>
                <td className="td-actions">
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => onView(item)}
                    title="Ver detalle"
                  >
                    {Icons.eye}
                  </button>
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => onEdit(item)}
                    title="Editar"
                  >
                    {Icons.edit}
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn-icon btn-ghost btn-ghost-danger"
                      onClick={() => onDelete(item)}
                      title="Eliminar"
                    >
                      {Icons.trash}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>{intervenciones.length} intervención{intervenciones.length !== 1 ? 'es' : ''} registrada{intervenciones.length !== 1 ? 's' : ''}</span>
      </div>

      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}
