import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Icons } from './Icons'
import './LoginPage.css'

const ADMIN_EMAIL = 'admin@mantenimientos.app'

export default function LoginPage({ onTecnicoLogin }) {
  const [step, setStep] = useState(null)
  const [form, setForm] = useState({ password: '', nombre: '', cedula: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const back = (to) => { setStep(to); setError('') }

  // ── Admin: Supabase Auth ────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    if (!form.password.trim()) { setError('Ingrese la contraseña.'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: form.password
    })
    if (authError) setError('Contraseña incorrecta.')
    setLoading(false)
    // Si es exitoso, onAuthStateChange en App.jsx maneja el resto
  }

  // ── Técnico login: solo cédula contra tabla usuarios ──────────────────────
  const handleTecnicoLogin = async (e) => {
    e.preventDefault()
    const cedula = form.cedula.trim()
    if (!cedula) { setError('Ingrese su cédula.'); return }
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cedula', cedula)
      .eq('rol', 'tecnico')
      .maybeSingle()
    setLoading(false)
    if (dbError) { setError('Error de conexión. Intente de nuevo.'); return }
    if (!data) { setError('Cédula no encontrada. ¿Es su primera vez? Regístrese.'); return }
    onTecnicoLogin(data)
  }

  // ── Técnico registro: nombre + cédula, sin contraseña ─────────────────────
  const handleTecnicoRegistro = async (e) => {
    e.preventDefault()
    const cedula = form.cedula.trim()
    const nombre = form.nombre.trim()
    if (!nombre) { setError('Ingrese su nombre.'); return }
    if (!cedula) { setError('Ingrese su cédula.'); return }
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('usuarios')
      .insert({ nombre, cedula, rol: 'tecnico' })
      .select()
      .single()
    setLoading(false)
    if (dbError) {
      if (dbError.code === '23505') {
        setError('Esa cédula ya está registrada. Inicie sesión con su cédula.')
      } else {
        setError('No se pudo crear la cuenta. Intente de nuevo.')
      }
      return
    }
    onTecnicoLogin(data)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">{Icons.gear}</span>
          </div>
          <h1 className="login-title">Sistema de Mantenimientos</h1>
          <p className="login-subtitle">Incolmotos Yamaha</p>
        </div>

        {!step && (
          <div className="role-selector">
            <p className="role-prompt">¿Cómo desea ingresar?</p>
            <div className="role-cards">
              <button className="role-card" onClick={() => setStep('admin')}>
                <span className="role-card-icon">{Icons.gear}</span>
                <span className="role-card-label">Administrador</span>
                <span className="role-card-desc">Acceso completo al sistema</span>
              </button>
              <button className="role-card" onClick={() => setStep('tecnico-opciones')}>
                <span className="role-card-icon">{Icons.wrench}</span>
                <span className="role-card-label">Técnico</span>
                <span className="role-card-desc">Registrar intervenciones</span>
              </button>
            </div>
          </div>
        )}

        {step === 'admin' && (
          <form className="login-form" onSubmit={handleAdminLogin}>
            <button type="button" className="login-back" onClick={() => back(null)}>← Volver</button>
            <h2 className="login-form-title">Acceso de Administrador</h2>
            <div className="login-group">
              <label className="login-label">Contraseña</label>
              <div className="login-pass-wrap">
                <input
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Contraseña de administrador"
                  autoFocus
                />
                <button type="button" className="login-pass-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? Icons.x : Icons.check}
                </button>
              </div>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {step === 'tecnico-opciones' && (
          <div className="role-selector">
            <button type="button" className="login-back" style={{ marginBottom: 12 }} onClick={() => back(null)}>
              ← Volver
            </button>
            <p className="role-prompt">¿Es su primera vez?</p>
            <div className="role-cards">
              <button className="role-card" onClick={() => setStep('tecnico-login')}>
                <span className="role-card-icon">{Icons.user}</span>
                <span className="role-card-label">Ya tengo cuenta</span>
                <span className="role-card-desc">Ingresar con mi cédula</span>
              </button>
              <button className="role-card" onClick={() => setStep('tecnico-registro')}>
                <span className="role-card-icon">{Icons.plus}</span>
                <span className="role-card-label">Registrarme</span>
                <span className="role-card-desc">Crear mi cuenta</span>
              </button>
            </div>
          </div>
        )}

        {step === 'tecnico-login' && (
          <form className="login-form" onSubmit={handleTecnicoLogin}>
            <button type="button" className="login-back" onClick={() => back('tecnico-opciones')}>← Volver</button>
            <h2 className="login-form-title">Iniciar sesión</h2>
            <div className="login-group">
              <label className="login-label">Número de cédula</label>
              <input
                className="login-input"
                type="text"
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                placeholder="Sin puntos ni espacios"
                autoFocus
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
            <button type="button" className="login-link" onClick={() => back('tecnico-registro')}>
              ¿No tiene cuenta? Regístrese
            </button>
          </form>
        )}

        {step === 'tecnico-registro' && (
          <form className="login-form" onSubmit={handleTecnicoRegistro}>
            <button type="button" className="login-back" onClick={() => back('tecnico-opciones')}>← Volver</button>
            <h2 className="login-form-title">Crear cuenta</h2>
            <div className="login-group">
              <label className="login-label">Nombre completo</label>
              <input
                className="login-input"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Su nombre y apellido"
                autoFocus
              />
            </div>
            <div className="login-group">
              <label className="login-label">Número de cédula</label>
              <input
                className="login-input"
                type="text"
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                placeholder="Sin puntos ni espacios"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear cuenta e ingresar'}
            </button>
            <button type="button" className="login-link" onClick={() => back('tecnico-login')}>
              ¿Ya tiene cuenta? Inicie sesión
            </button>
          </form>
        )}

        <p className="login-footer">
          Sistema de Registro de Mantenimiento &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
