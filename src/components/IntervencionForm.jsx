import { useState, useEffect, useRef, useCallback } from 'react'
import { Icons } from './Icons'
import './IntervencionForm.css'

function InlineAdd({ placeholder, onSave, onCancel }) {
  const [val, setVal] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSave = async () => {
    if (!val.trim()) return
    setSaving(true)
    await onSave(val.trim())
    setSaving(false)
  }

  return (
    <div className="inline-add">
      <input
        ref={inputRef}
        className="form-input inline-add__input"
        placeholder={placeholder}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave() } if (e.key === 'Escape') onCancel() }}
      />
      <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !val.trim()}>
        {saving ? '...' : 'Guardar'}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}

export default function IntervencionForm({
  equipos, tecnicos, tiposNovedad, componentes, repuestos,
  editData, onSave, onCancel,
  onAddTecnico, onAddComponente, onAddRepuesto
}) {
  const [form, setForm] = useState({
    fk_id_equipo: '',
    fk_id_tipo_novedad: '',
    fecha: '',
    hora_parada: '',
    descripcion: '',
    componente_id: '',
    repuesto_id: '',
    cantidad_usada: ''
  })

  const [tecnicosIds, setTecnicosIds] = useState([])
  const [tecnicoSelect, setTecnicoSelect] = useState('')

  const [filteredComponentes, setFilteredComponentes] = useState([])
  const [saving, setSaving] = useState(false)
  const [addingNew, setAddingNew] = useState({ tecnico: false, componente: false, repuesto: false })

  // Photo state
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoUrlExistente, setFotoUrlExistente] = useState(null)
  const [eliminarFoto, setEliminarFoto] = useState(false)
  const fotoInputRef = useRef(null)

  useEffect(() => {
    setFotoFile(null)
    setFotoPreview(null)
    setEliminarFoto(false)
    setFotoUrlExistente(editData?.foto_url || null)
    setTecnicoSelect('')
    setTecnicosIds(
      editData?.intervencion_tecnico
        ?.map(it => it.fk_id_tecnico)
        .filter(Boolean)
        .map(String) || []
    )

    if (editData) {
      setForm({
        fk_id_equipo: editData.fk_id_equipo || '',
        fk_id_tipo_novedad: editData.fk_id_tipo_novedad || '',
        fecha: editData.fecha || '',
        hora_parada: editData.hora_parada || '',
        descripcion: editData.descripcion || '',
        componente_id: editData.detalle_intervencion?.[0]?.fk_id_componente || '',
        repuesto_id: editData.detalle_intervencion?.[0]?.fk_id_repuesto || '',
        cantidad_usada: editData.detalle_intervencion?.[0]?.cantidad_usada || ''
      })
    } else {
      setForm({
        fk_id_equipo: '',
        fk_id_tipo_novedad: '',
        fecha: '',
        hora_parada: '',
        descripcion: '',
        componente_id: '',
        repuesto_id: '',
        cantidad_usada: ''
      })
    }
  }, [editData])

  useEffect(() => {
    if (form.fk_id_equipo) {
      setFilteredComponentes(componentes.filter(c => c.fk_id_equipo === parseInt(form.fk_id_equipo)))
    } else {
      setFilteredComponentes(componentes)
    }
  }, [form.fk_id_equipo, componentes])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectWithNew = (name, value, field) => {
    if (value === '__new__') {
      setAddingNew(prev => ({ ...prev, [field]: true }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const cancelNew = (field, name) => {
    setAddingNew(prev => ({ ...prev, [field]: false }))
    setForm(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tecnicosIds.length === 0) {
      alert('Por favor seleccione al menos un técnico responsable.')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, tecnicos_ids: tecnicosIds }, editData?.id_intervencion, { fotoFile, fotoUrlExistente, eliminarFoto })
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!editData

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="form-modal" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="form-modal-title">
            <span className="form-modal-title-icon">{isEdit ? Icons.edit : Icons.plus}</span>
            <h2>{isEdit ? 'Editar Intervención' : 'Nueva Intervención'}</h2>
          </div>
          <button className="modal-close" onClick={onCancel}>{Icons.close}</button>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          {/* Información General */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.list}</span>
              Información General
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Equipo intervenido *</label>
                <select
                  name="fk_id_equipo"
                  value={form.fk_id_equipo}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Seleccione equipo</option>
                  {equipos.map(e => (
                    <option key={e.id_equipo} value={e.id_equipo}>
                      {e.nombre} {e.marca ? `— ${e.marca}` : ''} {e.modelo || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de novedad *</label>
                <select
                  name="fk_id_tipo_novedad"
                  value={form.fk_id_tipo_novedad}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Seleccione tipo</option>
                  {tiposNovedad.map(t => (
                    <option key={t.id_tipo} value={t.id_tipo}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de intervención *</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora de parada *</label>
                <input
                  type="text"
                  name="hora_parada"
                  value={form.hora_parada}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: 2h, 30 min, 1h 30m"
                  required
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.fileText}</span>
              Descripción
            </h4>
            <div className="form-group">
              <label className="form-label">Descripción de la intervención *</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Describa la falla detectada, trabajos realizados, observaciones..."
                rows={4}
                required
              />
            </div>
          </div>

          {/* Técnicos */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.users}</span>
              Responsables *
            </h4>

            {/* Tags de técnicos seleccionados */}
            {tecnicosIds.length > 0 && (
              <div className="tecnicos-tags">
                {tecnicosIds.map(id => {
                  const t = tecnicos.find(t => String(t.id_tecnico) === String(id))
                  return (
                    <span key={id} className="tecnico-tag">
                      {t ? `${t.nombre}${t.entidad ? ` (${t.entidad})` : ''}` : `#${id}`}
                      <button
                        type="button"
                        className="tecnico-tag__remove"
                        onClick={() => setTecnicosIds(prev => prev.filter(i => i !== id))}
                      >
                        {Icons.close}
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Dropdown + botón agregar */}
            {addingNew.tecnico ? (
              <InlineAdd
                placeholder="Nombre del técnico"
                onSave={async (nombre) => {
                  const newId = await onAddTecnico(nombre)
                  if (newId) {
                    setTecnicosIds(prev => [...prev, String(newId)])
                    setAddingNew(prev => ({ ...prev, tecnico: false }))
                  }
                }}
                onCancel={() => setAddingNew(prev => ({ ...prev, tecnico: false }))}
              />
            ) : (
              <div className="tecnicos-add-row">
                <select
                  value={tecnicoSelect}
                  onChange={e => {
                    if (e.target.value === '__new__') {
                      setAddingNew(prev => ({ ...prev, tecnico: true }))
                      setTecnicoSelect('')
                    } else {
                      setTecnicoSelect(e.target.value)
                    }
                  }}
                  className="form-select"
                >
                  <option value="">Seleccione técnico</option>
                  {tecnicos
                    .filter(t => !tecnicosIds.includes(String(t.id_tecnico)))
                    .map(t => (
                      <option key={t.id_tecnico} value={t.id_tecnico}>
                        {t.nombre} {t.entidad ? `(${t.entidad})` : ''}
                      </option>
                    ))}
                  <option value="__new__">+ Añadir otro...</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!tecnicoSelect}
                  onClick={() => {
                    if (tecnicoSelect) {
                      setTecnicosIds(prev => [...prev, tecnicoSelect])
                      setTecnicoSelect('')
                    }
                  }}
                >
                  Agregar
                </button>
              </div>
            )}
          </div>

          {/* Repuestos y componentes */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.wrench}</span>
              Repuestos y Componentes
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Componente afectado</label>
                {addingNew.componente ? (
                  <InlineAdd
                    placeholder="Nombre del componente"
                    onSave={async (nombre) => {
                      const newId = await onAddComponente(nombre, form.fk_id_equipo)
                      if (newId) {
                        setForm(prev => ({ ...prev, componente_id: newId }))
                        setAddingNew(prev => ({ ...prev, componente: false }))
                      }
                    }}
                    onCancel={() => cancelNew('componente', 'componente_id')}
                  />
                ) : (
                  <select
                    name="componente_id"
                    value={form.componente_id}
                    onChange={e => handleSelectWithNew('componente_id', e.target.value, 'componente')}
                    className="form-select"
                  >
                    <option value="">Seleccione componente</option>
                    {filteredComponentes.map(c => (
                      <option key={c.id_componente} value={c.id_componente}>
                        {c.nombre_componente}
                      </option>
                    ))}
                    <option value="__new__">+ Añadir otro...</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Repuesto utilizado</label>
                {addingNew.repuesto ? (
                  <InlineAdd
                    placeholder="Nombre del repuesto"
                    onSave={async (nombre) => {
                      const newId = await onAddRepuesto(nombre)
                      if (newId) {
                        setForm(prev => ({ ...prev, repuesto_id: newId }))
                        setAddingNew(prev => ({ ...prev, repuesto: false }))
                      }
                    }}
                    onCancel={() => cancelNew('repuesto', 'repuesto_id')}
                  />
                ) : (
                  <select
                    name="repuesto_id"
                    value={form.repuesto_id}
                    onChange={e => handleSelectWithNew('repuesto_id', e.target.value, 'repuesto')}
                    className="form-select"
                  >
                    <option value="">Seleccione repuesto</option>
                    {repuestos.map(r => (
                      <option key={r.id_repuesto} value={r.id_repuesto}>
                        {r.nombre_repuesto} {r.referencia ? `(${r.referencia})` : ''}
                      </option>
                    ))}
                    <option value="__new__">+ Añadir otro...</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad usada</label>
                <input
                  type="number"
                  name="cantidad_usada"
                  value={form.cantidad_usada}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Foto */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.camera}</span>
              Fotografía
            </h4>
            <div className="foto-upload">
              {/* Preview */}
              {(fotoPreview || (fotoUrlExistente && !eliminarFoto)) && (
                <div className="foto-preview-wrap">
                  <img
                    src={fotoPreview || fotoUrlExistente}
                    alt="Foto intervención"
                    className="foto-preview"
                  />
                  <button
                    type="button"
                    className="foto-remove"
                    onClick={() => {
                      if (fotoFile) {
                        setFotoFile(null)
                        setFotoPreview(null)
                      } else {
                        setEliminarFoto(true)
                      }
                      if (fotoInputRef.current) fotoInputRef.current.value = ''
                    }}
                    title="Quitar foto"
                  >
                    {Icons.close}
                  </button>
                </div>
              )}

              {/* Upload button */}
              {!fotoPreview && !(fotoUrlExistente && !eliminarFoto) && (
                <button
                  type="button"
                  className="foto-upload-btn"
                  onClick={() => fotoInputRef.current?.click()}
                >
                  {Icons.camera}
                  <span>Seleccionar foto</span>
                </button>
              )}

              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setFotoFile(file)
                  setEliminarFoto(false)
                  setFotoPreview(URL.createObjectURL(file))
                }}
              />
              <p className="foto-hint">JPG, PNG o WebP · máx. 8 MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Actualizar intervención' : 'Guardar intervención'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
