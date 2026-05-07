import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { api } from '../lib/api'

export default function Profile() {
  const [form, setForm] = useState({ name:'', phone:'', specialty:'', clinic_name:'', clinic_address:'', license_number:'', slot_duration_minutes:15, clinic_code:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState(false)

  const bookingLink = form.clinic_code ? `https://airmedicare.vercel.app/book/${form.clinic_code}` : ''

  useEffect(() => {
    api.getProfile().then(d => { setForm(d.doctor); setLoading(false) })
      .catch(() => { setIsNew(true); setLoading(false) })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (isNew) { await api.createProfile(form); setIsNew(false) }
      else await api.updateProfile(form)
      setToast({ message: 'Profile saved!', type: 'success' })
    } catch (e) { setToast({ message: e.message, type: 'error' }) }
    setSaving(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div><div className="page-title">Clinic Settings</div><div className="page-subtitle">Your profile and working hours</div></div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {/* Patient Booking Link */}
          {bookingLink && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,212,170,0.3)' }}>
              <div className="card-title">🔗 Your Patient Booking Link</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, marginTop: 4 }}>
                Share this link with patients — they can book slots themselves, 24/7
              </p>
              <div style={{ display:'flex', gap:10, alignItems:'center', background:'var(--bg3)', borderRadius:8, padding:'10px 14px', border:'1px solid var(--border)' }}>
                <div style={{ flex:1, fontSize:13, fontFamily:'var(--mono)', color:'var(--accent)', wordBreak:'break-all' }}>
                  {bookingLink}
                </div>
                <button className="btn btn-primary btn-sm" onClick={copyLink} style={{ flexShrink:0 }}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ marginTop:10, fontSize:12, color:'var(--muted)' }}>
                Clinic code: <strong style={{ color:'var(--text)', fontFamily:'var(--mono)' }}>{form.clinic_code}</strong>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Doctor Information</div>
            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group"><label>Full Name</label><input value={form.name||''} onChange={f('name')} placeholder="Dr. Piyush Sharma" /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone||''} onChange={f('phone')} placeholder="9876543210" /></div>
              <div className="form-group"><label>Specialty</label>
                <select value={form.specialty||''} onChange={f('specialty')}>
                  <option value="">Select specialty</option>
                  {['General Physician','Dentist','Dermatologist','Pediatrician','Physiotherapist','Homeopathy','Ayurveda','Gynecologist','Orthopedic','ENT','Ophthalmologist','Psychiatrist'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>License Number</label><input value={form.license_number||''} onChange={f('license_number')} placeholder="MCI-XXXXXXXX" /></div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Clinic Details</div>
            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group"><label>Clinic Name</label><input value={form.clinic_name||''} onChange={f('clinic_name')} placeholder="Sharma Clinic" /></div>
              <div className="form-group"><label>Slot Duration (minutes)</label>
                <select value={form.slot_duration_minutes||15} onChange={f('slot_duration_minutes')}>
                  {[5,10,15,20,30,45,60].map(m=><option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Clinic Address</label><textarea value={form.clinic_address||''} onChange={f('clinic_address')} rows={2} placeholder="Full address..." /></div>
            <div className="form-group">
              <label>Clinic Code (for booking link)</label>
              <input value={form.clinic_code||''} onChange={e => setForm(p=>({...p, clinic_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')}))} placeholder="e.g. DRSHARMA" maxLength={12} />
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>Letters and numbers only. This appears in your patient booking link.</div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </Layout>
  )
}
