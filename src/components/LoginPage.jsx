import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Icons } from './Icons'
import './LoginPage.css'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'Yamaha2025'
const ADMIN_ID_USUARIO = 1

// step: null | 'admin' | 'tecnico-opciones' | 'tecnico-login' | 'tecnico-registro'
export default function LoginPage({ onLogin }) {
  const [step, setStep] = useState(null)
  const [form, setForm] = useState({ usuario: '', password: '', nombre: '', cedula: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const back = (to) => { setStep(to); setError('') }

  // ── Admin ──────────────────────────────────────────────────────────────────
  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (form.usuario === ADMIN_USER && form.password === ADMIN_PASS) {
      onLogin({ role: 'admin', nombre: 'Administrador', id_usuario: ADMIN_ID_USUARIO })
    } else {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  // ── Técnico login (solo cédula) ────────────────────────────────────────────
  const handleTecnicoLogin = async (e) => {
    e.preventDefault()
    if (!form.cedula.trim()) { setError('Ingrese su cédula.'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', form.cedula.trim())
        .eq('rol', 'tecnico')
        .single()

      if (dbError || !data) {
        setError('Cédula no encontrada. ¿Es su primera vez? Regístrese.')
      } else {
        onLogin({ role: 'tecnico', nombre: data.nombre, id_usuario: data.id_usuario, cedula: data.cedula })
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    }
    setLoading(false)
  }

  // ── Técnico registro (nombre + cédula) ────────────────────────────────────
  const handleTecnicoRegistro = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('Ingrese su nombre.'); return }
    if (!form.cedula.trim()) { setError('Ingrese su cédula.'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .insert({ nombre: form.nombre.trim(), cedula: form.cedula.trim(), rol: 'tecnico' })
        .select()
        .single()

      if (dbError) {
        if (dbError.code === '23505') {
          setError('Esa cédula ya está registrada. Inicie sesión con su cédula.')
        } else {
          setError('No se pudo registrar. Intente de nuevo.')
        }
      } else {
        onLogin({ role: 'tecnico', nombre: data.nombre, id_usuario: data.id_usuario, cedula: data.cedula })
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    }
    setLoading(false)
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

        {/* ── Selector de rol ── */}
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

        {/* ── Admin form ── */}
        {step === 'admin' && (
          <form className="login-form" onSubmit={handleAdminLogin}>
            <button type="button" className="login-back" onClick={() => back(null)}>← Volver</button>
            <h2 className="login-form-title">Acceso de Administrador</h2>
            <div className="login-group">
              <label className="login-label">Usuario</label>
              <input className="login-input" type="text" name="usuario"
                value={form.usuario} onChange={handleChange}
                placeholder="Nombre de usuario" autoComplete="username" autoFocus />
            </div>
            <div className="login-group">
              <label className="login-label">Contraseña</label>
              <div className="login-pass-wrap">
                <input className="login-input" type={showPass ? 'text' : 'password'}
                  name="password" value={form.password} onChange={handleChange}
                  placeholder="Contraseña" autoComplete="current-password" />
                <button type="button" className="login-pass-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? Icons.x : Icons.check}
                </button>
              </div>
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-btn">Ingresar</button>
          </form>
        )}

        {/* ── Técnico: opciones ── */}
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

        {/* ── Técnico: login ── */}
        {step === 'tecnico-login' && (
          <form className="login-form" onSubmit={handleTecnicoLogin}>
            <button type="button" className="login-back" onClick={() => back('tecnico-opciones')}>← Volver</button>
            <h2 className="login-form-title">Iniciar sesión</h2>
            <div className="login-group">
              <label className="login-label">Número de cédula</label>
              <input className="login-input" type="text" name="cedula"
                value={form.cedula} onChange={handleChange}
                placeholder="Sin puntos ni espacios" autoFocus />
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

        {/* ── Técnico: registro ── */}
        {step === 'tecnico-registro' && (
          <form className="login-form" onSubmit={handleTecnicoRegistro}>
            <button type="button" className="login-back" onClick={() => back('tecnico-opciones')}>← Volver</button>
            <h2 className="login-form-title">Crear cuenta</h2>
            <div className="login-group">
              <label className="login-label">Nombre completo</label>
              <input className="login-input" type="text" name="nombre"
                value={form.nombre} onChange={handleChange}
                placeholder="Su nombre y apellido" autoFocus />
            </div>
            <div className="login-group">
              <label className="login-label">Número de cédula</label>
              <input className="login-input" type="text" name="cedula"
                value={form.cedula} onChange={handleChange}
                placeholder="Sin puntos ni espacios" />
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
