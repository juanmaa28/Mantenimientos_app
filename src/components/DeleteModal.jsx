import { Icons } from './Icons'
import './DeleteModal.css'

export default function DeleteModal({ intervencion, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-modal-icon">{Icons.warning}</div>
        <h3>Confirmar eliminación</h3>
        <p>
          ¿Está seguro de que desea eliminar la intervención
          <strong> #{intervencion.id_intervencion}</strong> del equipo
          <strong> {intervencion.equipos?.nombre || 'N/A'}</strong>?
        </p>
        <p className="delete-warning">Esta acción no se puede deshacer.</p>
        <div className="delete-modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}
