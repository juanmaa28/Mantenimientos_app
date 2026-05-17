import { useEffect } from 'react'
import { Icons } from './Icons'
import './Lightbox.css'

export default function Lightbox({ url, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!url) return null

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Cerrar">
        {Icons.close}
      </button>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <img src={url} alt="Fotografía de la intervención" className="lightbox-img" />
      </div>
    </div>
  )
}
