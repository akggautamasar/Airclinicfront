import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { api } from '../lib/api'

const STATUS_BADGE = { scheduled:'badge-blue', completed:'badge-green', cancelled:'badge-red', no_show:'badge-yellow' }

function toDateInput(d) { return d.toISOString().split('T')[0] }

export default function Appointments() {
  const [date, setDate] = useState(toDateInput(new Date()))
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [slots, setSlots] = useState([])
  const [patients, setPatients] = useState([])
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ patient_id:'', appointment_date:'', appointment_time:'', problem:'' })
  const [patientSearch, setPatientSearch] = useState('')

  const load = async (d) => {
    setLoading(true)
    const data = await api.getAppointments(d).catch(() => ({ appointments: [] }))
    setAppointments(data.appointments || [])
    setLoading(false)
  }

  useEffect(() => { load(date) }, [date])

  const openBook = async () => {
    const d = form.appointment_date || date
    setForm(prev => ({ ...prev, appointment_date: d }))
    const [slotsData, patientsData] = await Promise.all([
      api.getSlots(d).catch(() => ({ slots: [] })),
      api.getPatients('').catch(() => ({ patients: [] }))
    ])
    setSlots(slotsData.slots || [])
    setPatients(patientsData.patients || [])
    setShowModal(true)
  }

  const onDateChange = async (d) => {
    setForm(prev => ({ ...prev, appointment_date: d, appointment_time: '' }))
    const data = await api.getSlots(d).catch(() => ({ slots: [] }))
    setSlots(data.slots || [])
  }

  const book = async () => {
    if (!form.patient_id || !form.appointment_date || !form.appointment_time)
      return setToast({ message: 'Select patient, date and time slot', type: 'error' })
    try {
      await api.bookAppointment(form)
      setShowModal(false)
      setToast({ message: 'Appointment booked!', type: 'success' })
      load(date)
    } catch (e) { setToast({ message: e.message, type: 'error' }) }
  }

  const markStatus = async (id, status) => {
    await api.updateAppointment(id, { status })
    load(date)
    setToast({ message: `Marked as ${status}`, type: 'success' })
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || (p.phone || '').includes(patientSearch)
  )

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <div className="page-title">Appointments</div>
          <div className="page-subtitle">{appointments.length} scheduled for this day</div>
        </div>
        <button className="btn btn-primary" onClick={openBook}>+ Book Slot</button>
      </div>

      {/* Date picker */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: 'auto', padding: '8px 14px' }} />
        <button className="btn btn-ghost btn-sm" onClick={() => setDate(toDateInput(new Date()))}>Today</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(toDateInput(d))
        }}>← Prev</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1); setDate(toDateInput(d))
        }}>Next →</button>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : appointments.length === 0 ? (
          <div className="empty"><div className="empty-icon">📅</div><p>No appointments for this day</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Patient</th><th>Problem</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{a.appointment_time?.slice(0,5)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.patients?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.patients?.phone}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>{a.problem || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[a.status]||'badge-gray'}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {a.status === 'scheduled' && <>
                          <button className="btn btn-sm" style={{ background: 'rgba(0,212,170,0.15)', color: 'var(--accent)' }} onClick={() => markStatus(a.id, 'completed')}>✓ Done</button>
                          <button className="btn btn-sm" style={{ background: 'rgba(255,77,109,0.15)', color: 'var(--danger)' }} onClick={() => markStatus(a.id, 'cancelled')}>✕ Cancel</button>
                          <button className="btn btn-sm" style={{ background: 'rgba(255,179,71,0.15)', color: 'var(--warn)' }} onClick={() => markStatus(a.id, 'no_show')}>No Show</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Book Appointment</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Patient search */}
            <div className="form-group">
              <label>Search Patient *</label>
              <input placeholder="Type name or phone..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
              {patientSearch && (
                <div style={{ background: 'var(--bg3)', borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)' }}>
                  {filtered.slice(0,6).map(p => (
                    <div key={p.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onClick={() => { setForm(prev => ({ ...prev, patient_id: p.id })); setPatientSearch(p.name) }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.phone} · Age {p.age}</div>
                    </div>
                  ))}
                  {filtered.length === 0 && <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 13 }}>No patient found</div>}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.appointment_date} onChange={e => onDateChange(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Select Time Slot *</label>
              {slots.length === 0 ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No slots available. Pick a date first.</div> : (
                <div className="slots-grid" style={{ marginTop: 8 }}>
                  {slots.map(s => (
                    <div key={s.time}
                      className={`slot ${!s.available ? 'taken' : form.appointment_time === s.time ? 'selected' : 'available'}`}
                      onClick={() => s.available && setForm(prev => ({ ...prev, appointment_time: s.time }))}>
                      {s.time}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Problem / Reason</label>
              <input value={form.problem} onChange={e => setForm(prev => ({ ...prev, problem: e.target.value }))} placeholder="Fever, follow-up, checkup..." />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={book}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
