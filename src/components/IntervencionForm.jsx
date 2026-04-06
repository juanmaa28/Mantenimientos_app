import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import './IntervencionForm.css'

export default function IntervencionForm({
  equipos, tecnicos, tiposNovedad, componentes, repuestos,
  editData, onSave, onCancel
}) {
  const [form, setForm] = useState({
    fk_id_equipo: '',
    fk_id_tipo_novedad: '',
    fecha: '',
    hora_parada: '',
    descripcion: '',
    tecnico_id: '',
    componente_id: '',
    repuesto_id: '',
    cantidad_usada: ''
  })

  const [filteredComponentes, setFilteredComponentes] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editData) {
      setForm({
        fk_id_equipo: editData.fk_id_equipo || '',
        fk_id_tipo_novedad: editData.fk_id_tipo_novedad || '',
        fecha: editData.fecha || '',
        hora_parada: editData.hora_parada || '',
        descripcion: editData.descripcion || '',
        tecnico_id: editData.intervencion_tecnico?.[0]?.fk_id_tecnico || '',
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
        tecnico_id: '',
        componente_id: '',
        repuesto_id: '',
        cantidad_usada: ''
      })
    }
  }, [editData])

  useEffect(() => {
    if (form.fk_id_equipo) {
      const filtered = componentes.filter(
        c => c.fk_id_equipo === parseInt(form.fk_id_equipo)
      )
      setFilteredComponentes(filtered)
    } else {
      setFilteredComponentes(componentes)
    }
  }, [form.fk_id_equipo, componentes])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.fk_id_equipo || !form.fk_id_tipo_novedad || !form.fecha) {
      alert('Por favor complete los campos obligatorios: Equipo, Tipo de Novedad y Fecha.')
      return
    }

    setSaving(true)
    try {
      await onSave(form, editData?.id_intervencion)
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
                <label className="form-label">Hora de parada</label>
                <input
                  type="text"
                  name="hora_parada"
                  value={form.hora_parada}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: 2 horas, 30 min"
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
              <label className="form-label">Descripción de la intervención</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Describa la falla detectada, trabajos realizados, observaciones..."
                rows={4}
              />
            </div>
          </div>

          {/* Técnico */}
          <div className="form-section">
            <h4 className="form-section-title">
              <span className="section-icon">{Icons.user}</span>
              Responsable
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Técnico responsable</label>
                <select
                  name="tecnico_id"
                  value={form.tecnico_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Seleccione técnico</option>
                  {tecnicos.map(t => (
                    <option key={t.id_tecnico} value={t.id_tecnico}>
                      {t.nombre} {t.entidad ? `(${t.entidad})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                <select
                  name="componente_id"
                  value={form.componente_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Seleccione componente</option>
                  {filteredComponentes.map(c => (
                    <option key={c.id_componente} value={c.id_componente}>
                      {c.nombre_componente}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Repuesto utilizado</label>
                <select
                  name="repuesto_id"
                  value={form.repuesto_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Seleccione repuesto</option>
                  {repuestos.map(r => (
                    <option key={r.id_repuesto} value={r.id_repuesto}>
                      {r.nombre_repuesto} {r.referencia ? `(${r.referencia})` : ''}
                    </option>
                  ))}
                </select>
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
