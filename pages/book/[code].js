import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const API = process.env.NEXT_PUBLIC_API_URL

function toDateInput(d) { return d.toISOString().split('T')[0] }

const STEPS = ['clinic', 'date', 'details', 'confirm']

export default function BookPage() {
  const router = useRouter()
  const { code } = router.query

  const [step, setStep] = useState(0)
  const [clinic, setClinic] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Date & slot state
  const [date, setDate] = useState(toDateInput(new Date()))
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')

  // Patient form
  const [form, setForm] = useState({ name:'', age:'', phone:'', gender:'', problem:'' })
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(null)

  // Load clinic info
  useEffect(() => {
    if (!code) return
    fetch(`${API}/public/clinic/${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setClinic(d.clinic)
      })
      .catch(() => setError('Could not connect. Please try again.'))
      .finally(() => setLoading(false))
  }, [code])

  // Load slots when date changes
  useEffect(() => {
    if (!clinic || !date) return
    setSlotsLoading(true)
    setSelectedSlot('')
    fetch(`${API}/public/slots/${clinic.id}?date=${date}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [clinic, date])

  const handleBook = async () => {
    if (!form.name || !form.phone) return setError('Name and phone are required')
    if (form.phone.length < 10) return setError('Enter a valid 10-digit phone number')
    setBooking(true); setError('')
    try {
      const res = await fetch(`${API}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: clinic.id,
          appointment_date: date,
          appointment_time: selectedSlot,
          patient_name: form.name,
          patient_age: form.age,
          patient_phone: form.phone,
          patient_gender: form.gender,
          problem: form.problem
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooked(data.appointment)
      setStep(3)
    } catch (e) {
      setError(e.message)
    }
    setBooking(false)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  // Format date nicely
  const niceDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' }) : ''

  // Min date = today
  const today = toDateInput(new Date())

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.spinner} />
    </div>
  )

  if (error && !clinic) return (
    <div style={styles.page}>
      <div style={styles.errorBox}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Clinic Not Found</div>
        <div style={{ color: '#888', fontSize: 14 }}>{error}</div>
      </div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Book Appointment — {clinic?.clinic_name || 'Clinic'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <div style={styles.card}>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>✚</div>
            <div style={styles.clinicName}>{clinic?.clinic_name || 'Clinic'}</div>
            <div style={styles.doctorName}>Dr. {clinic?.name}</div>
            <div style={styles.specialty}>{clinic?.specialty}</div>
            {clinic?.clinic_address && <div style={styles.address}>📍 {clinic.clinic_address}</div>}
          </div>

          {/* Step indicator */}
          {step < 3 && (
            <div style={styles.steps}>
              {['Date & Slot', 'Your Details', 'Confirm'].map((s, i) => (
                <div key={i} style={{ ...styles.stepDot, ...(i <= step ? styles.stepActive : {}) }}>
                  <div style={{ ...styles.stepCircle, ...(i <= step ? styles.stepCircleActive : {}) }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={styles.stepLabel}>{s}</div>
                </div>
              ))}
            </div>
          )}

          {error && step !== 3 && (
            <div style={styles.errMsg}>⚠️ {error}</div>
          )}

          {/* STEP 0 — Pick date & slot */}
          {step === 0 && (
            <div>
              <div style={styles.sectionTitle}>Select Date</div>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                style={styles.input}
              />

              <div style={styles.sectionTitle}>Available Slots</div>
              {slotsLoading ? (
                <div style={{ textAlign:'center', padding:20, color:'#888' }}>Loading slots...</div>
              ) : slots.length === 0 ? (
                <div style={styles.noSlots}>😔 No slots available on this day. Try another date.</div>
              ) : (
                <div style={styles.slotsGrid}>
                  {slots.map(s => (
                    <div key={s.time}
                      onClick={() => s.available && setSelectedSlot(s.time)}
                      style={{
                        ...styles.slot,
                        ...(s.available ? {} : styles.slotTaken),
                        ...(selectedSlot === s.time ? styles.slotSelected : {})
                      }}>
                      {s.time}
                    </div>
                  ))}
                </div>
              )}

              <button
                style={{ ...styles.btn, ...(selectedSlot ? {} : styles.btnDisabled) }}
                onClick={() => { if (selectedSlot) { setError(''); setStep(1) } else setError('Please select a time slot') }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP 1 — Patient details */}
          {step === 1 && (
            <div>
              <div style={styles.selectedInfo}>
                📅 {niceDate} at <strong>{selectedSlot}</strong>
                <span style={styles.changeLink} onClick={() => setStep(0)}> (change)</span>
              </div>

              <div style={styles.sectionTitle}>Your Details</div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input style={styles.input} value={form.name} onChange={f('name')} placeholder="Your full name" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number *</label>
                <input style={styles.input} type="tel" value={form.phone} onChange={f('phone')} placeholder="10-digit mobile number" maxLength={10} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Age</label>
                  <input style={styles.input} type="number" value={form.age} onChange={f('age')} placeholder="25" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender</label>
                  <select style={styles.input} value={form.gender} onChange={f('gender')}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Reason for Visit</label>
                <textarea style={{ ...styles.input, minHeight:80, resize:'vertical' }}
                  value={form.problem} onChange={f('problem')}
                  placeholder="Describe your symptoms or reason..." />
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button style={{ ...styles.btn, background:'transparent', border:'1px solid #333', color:'#aaa', flex:1 }} onClick={() => setStep(0)}>← Back</button>
                <button style={{ ...styles.btn, flex:2 }} onClick={() => {
                  if (!form.name) return setError('Please enter your name')
                  if (!form.phone || form.phone.length < 10) return setError('Enter valid 10-digit phone')
                  setError(''); setStep(2)
                }}>Review →</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Confirm */}
          {step === 2 && (
            <div>
              <div style={styles.sectionTitle}>Review Your Booking</div>

              <div style={styles.reviewCard}>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Doctor</span><span>Dr. {clinic?.name}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Clinic</span><span>{clinic?.clinic_name}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Date</span><span>{niceDate}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Time</span><strong style={{ color:'#00d4aa' }}>{selectedSlot}</strong></div>
                <div style={{ borderTop:'1px solid #222', margin:'12px 0' }} />
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Name</span><span>{form.name}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Phone</span><span>{form.phone}</span></div>
                {form.age && <div style={styles.reviewRow}><span style={styles.reviewLabel}>Age</span><span>{form.age}</span></div>}
                {form.problem && <div style={styles.reviewRow}><span style={styles.reviewLabel}>Reason</span><span>{form.problem}</span></div>}
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button style={{ ...styles.btn, background:'transparent', border:'1px solid #333', color:'#aaa', flex:1 }} onClick={() => setStep(1)}>← Edit</button>
                <button style={{ ...styles.btn, flex:2 }} onClick={handleBook} disabled={booking}>
                  {booking ? 'Booking...' : '✓ Confirm Appointment'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && booked && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color:'#00d4aa' }}>Appointment Confirmed!</div>
              <div style={{ color:'#888', fontSize:14, marginBottom:24 }}>Please arrive 10 minutes early</div>

              <div style={styles.reviewCard}>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Patient</span><span>{booked.patient_name}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Doctor</span><span>Dr. {clinic?.name}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Date</span><span>{niceDate}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Time</span><strong style={{ color:'#00d4aa' }}>{booked.time}</strong></div>
                {booked.problem && <div style={styles.reviewRow}><span style={styles.reviewLabel}>Reason</span><span>{booked.problem}</span></div>}
              </div>

              <div style={{ marginTop:24, fontSize:13, color:'#555' }}>
                Screenshot this page for your records
              </div>

              <button style={{ ...styles.btn, marginTop:20, background:'transparent', border:'1px solid #333', color:'#aaa' }}
                onClick={() => { setStep(0); setBooked(null); setSelectedSlot(''); setForm({ name:'',age:'',phone:'',gender:'',problem:'' }) }}>
                Book Another Appointment
              </button>
            </div>
          )}

        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#444' }}>
          Powered by AirMedicare ✚
        </div>
      </div>
    </>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0f1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '24px 16px 40px',
    fontFamily: "'Sora', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#111827',
    borderRadius: 20,
    border: '1px solid #1f2d45',
    padding: '28px 24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #1f2d45',
  },
  logo: { fontSize: 32, color: '#00d4aa', marginBottom: 8 },
  clinicName: { fontSize: 20, fontWeight: 800, color: '#e8edf5', marginBottom: 4 },
  doctorName: { fontSize: 15, color: '#aaa', marginBottom: 2 },
  specialty: { fontSize: 13, color: '#00d4aa', marginBottom: 4 },
  address: { fontSize: 12, color: '#555', marginTop: 4 },
  steps: {
    display: 'flex',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 28,
  },
  stepDot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    opacity: 0.4,
  },
  stepActive: { opacity: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#1a2235',
    border: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    color: '#666',
  },
  stepCircleActive: { background: '#00d4aa', border: 'none', color: '#000' },
  stepLabel: { fontSize: 10, color: '#666', textAlign: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 4 },
  input: {
    width: '100%',
    background: '#1a2235',
    border: '1px solid #1f2d45',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e8edf5',
    fontFamily: "'Sora', sans-serif",
    fontSize: 14,
    outline: 'none',
    marginBottom: 0,
    boxSizing: 'border-box',
  },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, color: '#6b7a99', marginBottom: 6, fontWeight: 500 },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  slot: {
    padding: '10px 4px',
    textAlign: 'center',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    cursor: 'pointer',
    border: '1px solid #1f2d45',
    background: '#1a2235',
    color: '#e8edf5',
    transition: 'all 0.15s',
  },
  slotTaken: { opacity: 0.3, cursor: 'not-allowed', textDecoration: 'line-through', color: '#555' },
  slotSelected: { background: '#00d4aa', color: '#000', fontWeight: 700, border: 'none' },
  noSlots: { textAlign:'center', padding:'20px 0', color:'#555', fontSize:14, marginBottom:16 },
  btn: {
    display: 'block',
    width: '100%',
    padding: '13px',
    background: '#00d4aa',
    color: '#000',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Sora', sans-serif",
    cursor: 'pointer',
    marginTop: 16,
    textAlign: 'center',
  },
  btnDisabled: { background: '#1a2235', color: '#444', cursor: 'not-allowed' },
  selectedInfo: { background:'#1a2235', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#aaa', marginBottom:20 },
  changeLink: { color:'#00d4aa', cursor:'pointer', fontWeight:600 },
  reviewCard: { background:'#1a2235', borderRadius:10, padding:'16px', border:'1px solid #1f2d45' },
  reviewRow: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'6px 0', fontSize:14, gap:12 },
  reviewLabel: { color:'#6b7a99', fontSize:13, flexShrink:0 },
  errMsg: { background:'rgba(255,77,109,0.1)', border:'1px solid #ff4d6d', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#ff4d6d' },
  errorBox: { textAlign:'center', padding:40, color:'#e8edf5' },
  spinner: { width:36, height:36, border:'3px solid #1f2d45', borderTopColor:'#00d4aa', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'80px auto' },
}
