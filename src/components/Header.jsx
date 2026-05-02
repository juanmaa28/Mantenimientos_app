import { Icons } from './Icons'
import './Header.css'

export default function Header({ currentUser, onLogout }) {
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
          {currentUser && (
            <div className="header-user">
              <span className="header-user-icon">
                {currentUser.role === 'admin' ? Icons.gear : Icons.user}
              </span>
              <div className="header-user-info">
                <span className="header-user-name">{currentUser.nombre}</span>
                <span className="header-user-role">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Técnico'}
                </span>
              </div>
              <button className="header-logout" onClick={onLogout} title="Cerrar sesión">
                {Icons.close}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
