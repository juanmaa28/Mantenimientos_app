import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Icons } from './components/Icons'
import Header from './components/Header'
import IntervencionesTable from './components/IntervencionesTable'
import IntervencionForm from './components/IntervencionForm'
import DeleteModal from './components/DeleteModal'
import Toast from './components/Toast'
import './App.css'

function App() {
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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
        )
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

  // Save (create or update)
  const handleSave = async (formData, editId) => {
    try {
      if (editId) {
        // ===== UPDATE =====
        const { error: updateError } = await supabase
          .from('intervenciones')
          .update({
            fk_id_equipo: parseInt(formData.fk_id_equipo),
            fk_id_tipo_novedad: parseInt(formData.fk_id_tipo_novedad),
            fecha: formData.fecha,
            hora_parada: formData.hora_parada || null,
            descripcion: formData.descripcion || null
          })
          .eq('id_intervencion', editId)

        if (updateError) throw updateError

        // Update technician relation
        const { error: delTecError } = await supabase.from('intervencion_tecnico').delete().eq('fk_id_intervencion', editId)
        if (delTecError) throw delTecError
        if (formData.tecnico_id) {
          const { error: insTecError } = await supabase.from('intervencion_tecnico').insert({
            fk_id_intervencion: editId,
            fk_id_tecnico: parseInt(formData.tecnico_id)
          })
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
            descripcion: formData.descripcion || null
          })
          .select()
          .single()

        if (createError) throw createError

        const newId = newIntervencion.id_intervencion

        // Insert technician relation
        if (formData.tecnico_id) {
          const { error: tecError } = await supabase.from('intervencion_tecnico').insert({
            fk_id_intervencion: newId,
            fk_id_tecnico: parseInt(formData.tecnico_id)
          })
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

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const id = deleteTarget.id_intervencion

      // Delete related records first
      await supabase.from('intervencion_tecnico').delete().eq('fk_id_intervencion', id)
      await supabase.from('detalle_intervencion').delete().eq('fk_id_intervencion', id)

      const { error } = await supabase
        .from('intervenciones')
        .delete()
        .eq('id_intervencion', id)

      if (error) throw error

      showToast('Intervención eliminada correctamente')
      setDeleteTarget(null)
      fetchIntervenciones()
    } catch (error) {
      console.error('Error deleting:', error)
      showToast(`Error al eliminar: ${error.message}`, 'error')
    }
  }

  // Filter interventions by search
  const filteredIntervenciones = intervenciones.filter(item => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      item.equipos?.nombre?.toLowerCase().includes(term) ||
      item.tipo_novedad?.nombre?.toLowerCase().includes(term) ||
      item.descripcion?.toLowerCase().includes(term) ||
      item.intervencion_tecnico?.some(it => it.tecnicos?.nombre?.toLowerCase().includes(term)) ||
      String(item.id_intervencion).includes(term)
    )
  })

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <h2 className="page-title">Intervenciones</h2>
            <span className="record-count">{intervenciones.length} registros</span>
          </div>
          <div className="toolbar-right">
            <div className="search-box">
              <span className="search-icon">{Icons.search}</span>
              <input
                type="text"
                placeholder="Buscar por equipo, tipo, técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm('')}>
                  {Icons.close}
                </button>
              )}
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleNew}>
              {Icons.plus}
              <span>Nueva Intervención</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <IntervencionesTable
          intervenciones={filteredIntervenciones}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
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
        />
      )}

      {deleteTarget && (
        <DeleteModal
          intervencion={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
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
