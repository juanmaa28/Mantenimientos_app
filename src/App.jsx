import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Icons } from './components/Icons'
import Header from './components/Header'
import IntervencionesTable from './components/IntervencionesTable'
import IntervencionForm from './components/IntervencionForm'
import Toast from './components/Toast'
import UndoDeleteToast from './components/UndoDeleteToast'
import Graficas from './components/Graficas'
import LoginPage from './components/LoginPage'
import IntervencionDetalle from './components/IntervencionDetalle'
import Filtros, { FILTROS_VACIOS, matchesFiltros } from './components/Filtros'
import './App.css'

function App() {
  // Auth
  // Admin → Supabase Auth session  |  Técnico → localStorage
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const loadAdminUser = useCallback(async (authId) => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()
    setCurrentUser(data || null)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    // Técnico: check localStorage first
    try {
      const saved = localStorage.getItem('tecnicoSession')
      if (saved) {
        setCurrentUser(JSON.parse(saved))
        setAuthReady(true)
        return
      }
    } catch { localStorage.removeItem('tecnicoSession') }

    // Admin: Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadAdminUser(session.user.id)
      else setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('tecnicoSession')) return
      if (session) loadAdminUser(session.user.id)
      else { setCurrentUser(null); setAuthReady(true) }
    })

    return () => subscription.unsubscribe()
  }, [loadAdminUser])

  // Llamado por LoginPage cuando un técnico se autentica
  const handleTecnicoLogin = (user) => {
    localStorage.setItem('tecnicoSession', JSON.stringify(user))
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('tecnicoSession')
    setCurrentUser(null)
    supabase.auth.signOut()
  }

  // Data states
  const [intervenciones, setIntervenciones] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [tiposNovedad, setTiposNovedad] = useState([])
  const [componentes, setComponentes] = useState([])
  const [repuestos, setRepuestos] = useState([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [detalleItem, setDetalleItem] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [activeTab, setActiveTab] = useState('intervenciones')

  const switchTab = (tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const deleteTimerRef = useRef(null)

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Fetch all reference data
  const fetchReferenceData = useCallback(async () => {
    const [eqRes, tecRes, tipoRes, compRes, repRes] = await Promise.all([
      supabase.from('equipos').select('*').order('nombre'),
      supabase.from('tecnicos').select('*').order('nombre'),
      supabase.from('tipo_novedad').select('*').order('nombre'),
      supabase.from('componentes').select('*').order('nombre_componente'),
      supabase.from('repuestos').select('*').order('nombre_repuesto')
    ])

    if (eqRes.data) setEquipos(eqRes.data)
    if (tecRes.data) setTecnicos(tecRes.data)
    if (tipoRes.data) setTiposNovedad(tipoRes.data)
    if (compRes.data) setComponentes(compRes.data)
    if (repRes.data) setRepuestos(repRes.data)
  }, [])

  // Fetch interventions with all joins
  const fetchIntervenciones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('intervenciones')
      .select(`
        *,
        equipos (*),
        tipo_novedad (*),
        intervencion_tecnico (
          *,
          tecnicos (*)
        ),
        detalle_intervencion (
          *,
          componentes (*),
          repuestos (*)
        ),
        usuarios (id_usuario, nombre, cedula)
      `)
      .order('id_intervencion', { ascending: false })

    if (error) {
      console.error('Error fetching intervenciones:', error)
      showToast('Error al cargar las intervenciones', 'error')
    } else {
      setIntervenciones(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReferenceData()
    fetchIntervenciones()
  }, [fetchReferenceData, fetchIntervenciones])

  // Open form for new
  const handleNew = () => {
    setEditData(null)
    setShowForm(true)
  }

  // Open form for edit
  const handleEdit = (item) => {
    setEditData(item)
    setShowForm(true)
  }

  // Storage helpers
  const uploadFoto = async (file) => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('fotos-intervenciones').upload(path, file)
    if (error) throw error
    return supabase.storage.from('fotos-intervenciones').getPublicUrl(path).data.publicUrl
  }

  const deleteFotoFromStorage = async (fotoUrl) => {
    if (!fotoUrl) return
    const path = fotoUrl.split('/fotos-intervenciones/')[1]
    if (path) await supabase.storage.from('fotos-intervenciones').remove([path])
  }

  // Save (create or update)
  const handleSave = async (formData, editId, fotoData = {}) => {
    const idUsuario = currentUser?.id_usuario || null
    const { fotoFile, fotoUrlExistente, eliminarFoto } = fotoData
    try {
      // Resolve photo URL
      let fotoUrl = fotoUrlExistente || null
      if (fotoFile) {
        if (fotoUrlExistente) await deleteFotoFromStorage(fotoUrlExistente)
        fotoUrl = await uploadFoto(fotoFile)
      } else if (eliminarFoto && fotoUrlExistente) {
        await deleteFotoFromStorage(fotoUrlExistente)
        fotoUrl = null
      }

      if (editId) {
        // ===== UPDATE =====
        const { error: updateError } = await supabase
          .from('intervenciones')
          .update({
            fk_id_equipo: parseInt(formData.fk_id_equipo),
            fk_id_tipo_novedad: parseInt(formData.fk_id_tipo_novedad),
            fecha: formData.fecha,
            hora_parada: formData.hora_parada || null,
            descripcion: formData.descripcion || null,
            foto_url: fotoUrl,
            fk_id_usuario: idUsuario
          })
          .eq('id_intervencion', editId)

        if (updateError) throw updateError

        // Update technician relation
        const { error: delTecError } = await supabase.from('intervencion_tecnico').delete().eq('fk_id_intervencion', editId)
        if (delTecError) throw delTecError
        if (formData.tecnicos_ids?.length > 0) {
          const { error: insTecError } = await supabase.from('intervencion_tecnico').insert(
            formData.tecnicos_ids.map(id => ({ fk_id_intervencion: editId, fk_id_tecnico: parseInt(id) }))
          )
          if (insTecError) throw insTecError
        }

        // Update detail relation
        const { error: delDetError } = await supabase.from('detalle_intervencion').delete().eq('fk_id_intervencion', editId)
        if (delDetError) throw delDetError
        if (formData.componente_id || formData.repuesto_id) {
          const { error: insDetError } = await supabase.from('detalle_intervencion').insert({
            fk_id_intervencion: editId,
            fk_id_componente: formData.componente_id ? parseInt(formData.componente_id) : null,
            fk_id_repuesto: formData.repuesto_id ? parseInt(formData.repuesto_id) : null,
            cantidad_usada: formData.cantidad_usada ? parseInt(formData.cantidad_usada) : null
          })
          if (insDetError) throw insDetError
        }

        showToast('Intervención actualizada correctamente')
      } else {
        // ===== CREATE =====
        const { data: newIntervencion, error: createError } = await supabase
          .from('intervenciones')
          .insert({
            fk_id_equipo: parseInt(formData.fk_id_equipo),
            fk_id_tipo_novedad: parseInt(formData.fk_id_tipo_novedad),
            fecha: formData.fecha,
            hora_parada: formData.hora_parada || null,
            descripcion: formData.descripcion || null,
            foto_url: fotoUrl,
            fk_id_usuario: idUsuario
          })
          .select()
          .single()

        if (createError) throw createError

        const newId = newIntervencion.id_intervencion

        // Insert technician relation
        if (formData.tecnicos_ids?.length > 0) {
          const { error: tecError } = await supabase.from('intervencion_tecnico').insert(
            formData.tecnicos_ids.map(id => ({ fk_id_intervencion: newId, fk_id_tecnico: parseInt(id) }))
          )
          if (tecError) throw tecError
        }

        // Insert detail relation
        if (formData.componente_id || formData.repuesto_id) {
          const { error: detError } = await supabase.from('detalle_intervencion').insert({
            fk_id_intervencion: newId,
            fk_id_componente: formData.componente_id ? parseInt(formData.componente_id) : null,
            fk_id_repuesto: formData.repuesto_id ? parseInt(formData.repuesto_id) : null,
            cantidad_usada: formData.cantidad_usada ? parseInt(formData.cantidad_usada) : null
          })
          if (detError) throw detError
        }

        showToast('Intervención registrada correctamente')
      }

      setShowForm(false)
      setEditData(null)
      fetchIntervenciones()
    } catch (error) {
      console.error('Error saving:', error)
      showToast(`Error al guardar: ${error.message}`, 'error')
    }
  }

  // Add new reference items inline from the form
  const handleAddTecnico = async (nombre) => {
    const { data, error } = await supabase.from('tecnicos').insert({ nombre }).select().single()
    if (error) { showToast('Error al agregar técnico', 'error'); return null }
    await fetchReferenceData()
    return data.id_tecnico
  }

  const handleAddComponente = async (nombre, equipoId) => {
    const insert = { nombre_componente: nombre }
    if (equipoId) insert.fk_id_equipo = parseInt(equipoId)
    const { data, error } = await supabase.from('componentes').insert(insert).select().single()
    if (error) { showToast('Error al agregar componente', 'error'); return null }
    await fetchReferenceData()
    return data.id_componente
  }

  const handleAddRepuesto = async (nombre) => {
    const { data, error } = await supabase.from('repuestos').insert({ nombre_repuesto: nombre }).select().single()
    if (error) { showToast('Error al agregar repuesto', 'error'); return null }
    await fetchReferenceData()
    return data.id_repuesto
  }

  // Start delete countdown — actual DB delete fires after 5s unless undone
  const handleDeleteWithUndo = (item) => {
    clearTimeout(deleteTimerRef.current)
    setPendingDelete(item)
    deleteTimerRef.current = setTimeout(() => {
      executeDelete(item)
    }, 5000)
  }

  const handleUndoDelete = () => {
    clearTimeout(deleteTimerRef.current)
    setPendingDelete(null)
  }

  const executeDelete = async (item) => {
    setPendingDelete(null)
    const id = item.id_intervencion
    try {
      await supabase.from('intervencion_tecnico').delete().eq('fk_id_intervencion', id)
      await supabase.from('detalle_intervencion').delete().eq('fk_id_intervencion', id)
      const { error } = await supabase.from('intervenciones').delete().eq('id_intervencion', id)
      if (error) throw error
      if (item.foto_url) await deleteFotoFromStorage(item.foto_url)
      fetchIntervenciones()
    } catch (error) {
      console.error('Error deleting:', error)
      showToast(`Error al eliminar: ${error.message}`, 'error')
    }
  }

  // Filter interventions (exclude pending-delete row)
  const filteredIntervenciones = intervenciones.filter(item => {
    if (pendingDelete && item.id_intervencion === pendingDelete.id_intervencion) return false
    return matchesFiltros(item, filtros)
  })

  if (!authReady) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle, #f8fafd)' }}>
      <div className="loading-spinner" />
    </div>
  )
  if (!currentUser) return <LoginPage onTecnicoLogin={handleTecnicoLogin} />

  return (
    <div className="app">
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <main className="main-content">
        {/* Tab navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'intervenciones' ? 'tab-btn--active' : ''}`}
            onClick={() => switchTab('intervenciones')}
          >
            {Icons.list}
            <span>Intervenciones</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'graficas' ? 'tab-btn--active' : ''}`}
            onClick={() => switchTab('graficas')}
          >
            {Icons.barChart}
            <span>Gráficas</span>
          </button>
        </div>

        {activeTab === 'intervenciones' && (
          <div className="tab-content">
            {/* Toolbar */}
            <div className="toolbar">
              <div className="toolbar-left">
                <h2 className="page-title">Intervenciones</h2>
                <span className="record-count">
                  {filteredIntervenciones.length === intervenciones.length
                    ? `${intervenciones.length} registros`
                    : `${filteredIntervenciones.length} de ${intervenciones.length} registros`}
                </span>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-primary btn-lg" onClick={handleNew}>
                  {Icons.plus}
                  <span>Nueva Intervención</span>
                </button>
              </div>
            </div>

            {/* Filtros */}
            <Filtros
              filtros={filtros}
              onFiltrosChange={setFiltros}
              equipos={equipos}
              tiposNovedad={tiposNovedad}
              tecnicos={tecnicos}
              totalRegistros={intervenciones.length}
              totalFiltrados={filteredIntervenciones.length}
            />

            {/* Table */}
            <IntervencionesTable
              intervenciones={filteredIntervenciones}
              loading={loading}
              isAdmin={currentUser?.rol === 'admin'}
              onView={setDetalleItem}
              onEdit={handleEdit}
              onDelete={handleDeleteWithUndo}
            />

            {/* Stats cards */}
            {!loading && intervenciones.length > 0 && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">{Icons.fileText}</div>
                  <div className="stat-data">
                    <span className="stat-value">{intervenciones.length}</span>
                    <span className="stat-label">Total Intervenciones</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{Icons.box}</div>
                  <div className="stat-data">
                    <span className="stat-value">{equipos.length}</span>
                    <span className="stat-label">Equipos Registrados</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{Icons.users}</div>
                  <div className="stat-data">
                    <span className="stat-value">{tecnicos.length}</span>
                    <span className="stat-label">Técnicos</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{Icons.wrench}</div>
                  <div className="stat-data">
                    <span className="stat-value">{repuestos.length}</span>
                    <span className="stat-label">Repuestos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'graficas' && (
          <div className="tab-content">
            <div className="toolbar">
              <div className="toolbar-left">
                <h2 className="page-title">Gráficas</h2>
                <span className="record-count">{intervenciones.length} registros analizados</span>
              </div>
            </div>
            <Graficas intervenciones={intervenciones} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Sistema de Registro de Mantenimiento — Incolmotos Yamaha &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Modals */}
      {showForm && (
        <IntervencionForm
          equipos={equipos}
          tecnicos={tecnicos}
          tiposNovedad={tiposNovedad}
          componentes={componentes}
          repuestos={repuestos}
          editData={editData}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditData(null) }}
          onAddTecnico={handleAddTecnico}
          onAddComponente={handleAddComponente}
          onAddRepuesto={handleAddRepuesto}
        />
      )}

      {/* Detalle */}
      {detalleItem && (
        <IntervencionDetalle
          item={detalleItem}
          onClose={() => setDetalleItem(null)}
          onEdit={(item) => { setDetalleItem(null); handleEdit(item) }}
        />
      )}

      {/* Undo delete toast */}
      {pendingDelete && (
        <UndoDeleteToast
          intervencion={pendingDelete}
          onUndo={handleUndoDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
