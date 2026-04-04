import { useEffect, useState } from 'react'
import { Icons } from './Icons'
import './Toast.css'

export default function Toast({ message, type = 'success', onClose }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onClose, 300)
    }, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: Icons.check,
    error: Icons.x,
    info: Icons.info
  }

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`}>
      <span className="toast-icon">{icons[type] || icons.info}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setExiting(true); setTimeout(onClose, 300) }}>
        {Icons.close}
      </button>
    </div>
  )
}
