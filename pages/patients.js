import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { api } from '../lib/api'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ name:'', age:'', gender:'', phone:'', blood_group:'', allergies:'', chronic_conditions:'', address:'' })

  const load = async (q='') => {
    setLoading(true)
    const data = await api.getPatients(q).catch(() => ({ patients: [] }))
    setPatients(data.patients || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setSelected(null); setForm({ name:'',age:'',gender:'',phone:'',blood_group:'',allergies:'',chronic_conditions:'',address:'' }); setShowModal(true) }
  const openEdit = (p) => { setSelected(p); setForm(p); setShowModal(true) }

  const save = async () => {
    try {
      if (selected) await api.updatePatient(selected.id, form)
      else await api.createPatient(form)
      setShowModal(false)
      setToast({ message: selected ? 'Patient updated' : 'Patient added', type: 'success' })
      load(search)
    } catch (e) { setToast({ message: e.message, type: 'error' }) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this patient? This cannot be undone.')) return
    try { await api.deletePatient(id); setToast({ message: 'Patient deleted', type: 'success' }); load(search) }
    catch (e) { setToast({ message: e.message, type: 'error' }) }
  }

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Patients</div>
          <div className="page-subtitle">{patients.length} total</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Patient</button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span>🔍</span>
        <input placeholder="Search by name or phone..." value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value) }} />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div className="spinner" /> : patients.length === 0 ? (
          <div className="empty"><div className="empty-icon">👥</div><p>No patients found</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Age</th><th>Phone</th><th>Blood Group</th><th>Actions</th></tr></thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>
                          {p.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.chronic_conditions && <div style={{ fontSize: 11, color: 'var(--warn)' }}>{p.chronic_conditions}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{p.age || '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{p.phone || '—'}</td>
                    <td>{p.blood_group ? <span className="badge badge-red">{p.blood_group}</span> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: 'rgba(255,77,109,0.15)', color: 'var(--danger)' }} onClick={() => remove(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selected ? 'Edit Patient' : 'Add New Patient'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="grid-2">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={f('name')} placeholder="Patient name" /></div>
              <div className="form-group"><label>Age</label><input type="number" value={form.age} onChange={f('age')} placeholder="25" /></div>
              <div className="form-group"><label>Gender</label>
                <select value={form.gender} onChange={f('gender')}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={f('phone')} placeholder="9876543210" /></div>
              <div className="form-group"><label>Blood Group</label>
                <select value={form.blood_group} onChange={f('blood_group')}>
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Allergies</label><input value={form.allergies} onChange={f('allergies')} placeholder="Penicillin, dust..." /></div>
            </div>

            <div className="form-group"><label>Chronic Conditions</label><input value={form.chronic_conditions} onChange={f('chronic_conditions')} placeholder="Diabetes, Hypertension..." /></div>
            <div className="form-group"><label>Address</label><textarea value={form.address} onChange={f('address')} rows={2} placeholder="Patient address" /></div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>
                {selected ? 'Update Patient' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
