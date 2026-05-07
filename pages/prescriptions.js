import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { api } from '../lib/api'

const BLANK_MED = { name: '', dosage: '', frequency: '', duration: '', instructions: '' }

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showView, setShowView] = useState(null)
  const [toast, setToast] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [form, setForm] = useState({ patient_id: '', diagnosis: '', medicines: [{ ...BLANK_MED }], advice: '', follow_up_days: '' })

  const load = async () => {
    setLoading(true)
    const [rxData, pData] = await Promise.all([
      api.getPrescriptions().catch(() => ({ prescriptions: [] })),
      api.getPatients('').catch(() => ({ patients: [] }))
    ])
    setPrescriptions(rxData.prescriptions || [])
    setPatients(pData.patients || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addMed = () => setForm(f => ({ ...f, medicines: [...f.medicines, { ...BLANK_MED }] }))
  const removeMed = (i) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }))
  const updateMed = (i, k, v) => setForm(f => {
    const meds = [...f.medicines]; meds[i] = { ...meds[i], [k]: v }; return { ...f, medicines: meds }
  })

  const save = async () => {
    if (!form.patient_id) return setToast({ message: 'Select a patient', type: 'error' })
    try {
      await api.createPrescription(form)
      setShowModal(false)
      setToast({ message: 'Prescription created!', type: 'success' })
      setForm({ patient_id: '', diagnosis: '', medicines: [{ ...BLANK_MED }], advice: '', follow_up_days: '' })
      setPatientSearch('')
      load()
    } catch (e) { setToast({ message: e.message, type: 'error' }) }
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || (p.phone||'').includes(patientSearch)
  )

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div><div className="page-title">Prescriptions</div><div className="page-subtitle">{prescriptions.length} total</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Prescription</button>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : prescriptions.length === 0 ? (
          <div className="empty"><div className="empty-icon">💊</div><p>No prescriptions yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Diagnosis</th><th>Medicines</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id}>
                    <td style={{ fontWeight: 600 }}>{rx.patients?.name}</td>
                    <td>{rx.diagnosis || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{rx.medicines?.length || 0} medicine(s)</td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(rx.created_at).toLocaleDateString('en-IN')}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => setShowView(rx)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Prescription Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Prescription</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Patient *</label>
              <input placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
              {patientSearch && (
                <div style={{ background:'var(--bg3)', borderRadius:8, marginTop:4, maxHeight:160, overflowY:'auto', border:'1px solid var(--border)' }}>
                  {filtered.slice(0,5).map(p => (
                    <div key={p.id} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                      onClick={() => { setForm(f => ({...f, patient_id: p.id})); setPatientSearch(p.name) }}>
                      <div style={{ fontWeight:600 }}>{p.name}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{p.phone} · Age {p.age}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Diagnosis</label>
              <input value={form.diagnosis} onChange={e => setForm(f=>({...f,diagnosis:e.target.value}))} placeholder="Viral fever, Hypertension..." />
            </div>

            {/* Medicines */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <label style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>Medicines</label>
                <button className="btn btn-ghost btn-sm" onClick={addMed}>+ Add Medicine</button>
              </div>
              {form.medicines.map((m, i) => (
                <div key={i} className="med-row">
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <input placeholder="Medicine name" value={m.name} onChange={e => updateMed(i,'name',e.target.value)} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                      <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={e => updateMed(i,'dosage',e.target.value)} />
                      <input placeholder="Frequency (3x/day)" value={m.frequency} onChange={e => updateMed(i,'frequency',e.target.value)} />
                      <input placeholder="Duration (5 days)" value={m.duration} onChange={e => updateMed(i,'duration',e.target.value)} />
                    </div>
                    <input placeholder="Instructions (after meals, etc.)" value={m.instructions} onChange={e => updateMed(i,'instructions',e.target.value)} />
                  </div>
                  {form.medicines.length > 1 && (
                    <button onClick={() => removeMed(i)} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18, padding:'0 4px' }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="form-group"><label>Advice</label><textarea rows={2} value={form.advice} onChange={e=>setForm(f=>({...f,advice:e.target.value}))} placeholder="Rest, drink fluids..." /></div>
              <div className="form-group"><label>Follow-up in (days)</label><input type="number" value={form.follow_up_days} onChange={e=>setForm(f=>({...f,follow_up_days:e.target.value}))} placeholder="3" /></div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Prescription</button>
            </div>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {showView && (
        <div className="modal-overlay" onClick={() => setShowView(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Prescription</div>
              <button className="modal-close" onClick={() => setShowView(null)}>✕</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:18 }}>{showView.patients?.name}</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>{new Date(showView.created_at).toLocaleDateString('en-IN', { dateStyle:'long' })}</div>
            </div>
            {showView.diagnosis && <div style={{ marginBottom:16 }}><div className="card-title">Diagnosis</div><div>{showView.diagnosis}</div></div>}
            <div style={{ marginBottom:16 }}>
              <div className="card-title">Medicines</div>
              {(showView.medicines||[]).map((m,i) => (
                <div key={i} style={{ background:'var(--bg3)', borderRadius:8, padding:12, marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>{m.name} <span style={{ fontWeight:400, color:'var(--muted)', fontSize:13 }}>{m.dosage}</span></div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>{m.frequency} · {m.duration}</div>
                  {m.instructions && <div style={{ fontSize:12, color:'var(--warn)', marginTop:4 }}>📋 {m.instructions}</div>}
                </div>
              ))}
            </div>
            {showView.advice && <div style={{ marginBottom:12 }}><div className="card-title">Advice</div><div>{showView.advice}</div></div>}
            {showView.follow_up_days && <div style={{ background:'rgba(0,153,255,0.1)', borderRadius:8, padding:10, fontSize:13 }}>📅 Follow-up in <strong>{showView.follow_up_days} days</strong></div>}
          </div>
        </div>
      )}
    </Layout>
  )
}
