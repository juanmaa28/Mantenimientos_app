import { useEffect, useRef, useState } from 'react'
import { Icons } from './Icons'
import './UndoDeleteToast.css'

const DURATION = 5000

export default function UndoDeleteToast({ intervencion, onUndo, onClose }) {
  const [exiting, setExiting] = useState(false)
  const timeoutRef = useRef(null)

  const dismiss = (cb) => {
    setExiting(true)
    setTimeout(() => { onClose(); cb?.() }, 300)
  }

  useEffect(() => {
    timeoutRef.current = setTimeout(() => dismiss(), DURATION)
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const handleUndo = () => {
    clearTimeout(timeoutRef.current)
    onUndo()
    dismiss()
  }

  return (
    <div className={`undo-toast ${exiting ? 'undo-toast--exit' : ''}`}>
      <div className="undo-toast__body">
        <span className="undo-toast__icon">{Icons.trash}</span>
        <div className="undo-toast__text">
          <span className="undo-toast__msg">
            Intervención <strong>#{intervencion.id_intervencion}</strong> eliminada
          </span>
          <span className="undo-toast__sub">{intervencion.equipos?.nombre || ''}</span>
        </div>
        <button className="undo-toast__undo" onClick={handleUndo}>
          Deshacer
        </button>
        <button className="undo-toast__close" onClick={() => dismiss()} title="Cerrar">
          {Icons.close}
        </button>
      </div>
      <div className="undo-toast__bar">
        <div className="undo-toast__progress" style={{ animationDuration: `${DURATION}ms` }} />
      </div>
    </div>
  )
}
