import { Icons } from './Icons'
import './Header.css'

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">
            <span className="logo-icon">{Icons.gear}</span>
          </div>
          <div className="header-text">
            <h1>Sistema de Mantenimientos</h1>
            <span className="header-subtitle">Incolmotos Yamaha</span>
          </div>
        </div>
        <div className="header-meta">
          <span className="header-date">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </header>
  )
}
