import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import { api } from '../lib/api'

export default function Billing() {
  const [bills, setBills] = useState([])
  const [summary, setSummary] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [form, setForm] = useState({ patient_id:'', items:[{ description:'Consultation', amount:'' }], discount:0, payment_method:'cash', paid_amount:'' })

  const load = async () => {
    setLoading(true)
    const [bData, sData, pData] = await Promise.all([
      api.getBills().catch(() => ({ bills:[] })),
      api.getSummary().catch(() => ({ summary:null })),
      api.getPatients('').catch(() => ({ patients:[] }))
    ])
    setBills(bData.bills||[])
    setSummary(sData.summary)
    setPatients(pData.patients||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const addItem = () => setForm(f=>({...f, items:[...f.items, {description:'',amount:''}]}))
  const removeItem = (i) => setForm(f=>({...f, items:f.items.filter((_,idx)=>idx!==i)}))
  const updateItem = (i,k,v) => setForm(f=>{ const items=[...f.items]; items[i]={...items[i],[k]:v}; return {...f,items} })

  const subtotal = form.items.reduce((s,i)=>s+Number(i.amount||0),0)
  const total = subtotal - Number(form.discount||0)

  const save = async () => {
    if (!form.patient_id) return setToast({message:'Select a patient', type:'error'})
    try {
      await api.createBill({...form, paid_amount: form.paid_amount || total })
      setShowModal(false)
      setToast({message:'Bill created!', type:'success'})
      setForm({patient_id:'',items:[{description:'Consultation',amount:''}],discount:0,payment_method:'cash',paid_amount:''})
      setPatientSearch('')
      load()
    } catch(e){ setToast({message:e.message, type:'error'}) }
  }

  const markPaid = async (id) => {
    await api.updateBill(id, {payment_status:'paid'})
    setToast({message:'Marked as paid', type:'success'})
    load()
  }

  const filtered = patients.filter(p=>p.name.toLowerCase().includes(patientSearch.toLowerCase())||(p.phone||'').includes(patientSearch))

  const PAYMENT_BADGE = { paid:'badge-green', pending:'badge-yellow', partial:'badge-blue' }

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
      <div className="page-header">
        <div><div className="page-title">Billing</div><div className="page-subtitle">Invoices & payments</div></div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ New Bill</button>
      </div>

      {/* Revenue Summary */}
      {summary && (
        <div className="stats-grid" style={{marginBottom:24}}>
          <div className="stat-card">
            <div className="stat-value" style={{fontSize:22}}>₹{Number(summary.total_billed||0).toLocaleString('en-IN')}</div>
            <div className="stat-label">This Month Billed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{fontSize:22,color:'var(--accent)'}}>₹{Number(summary.total_collected||0).toLocaleString('en-IN')}</div>
            <div className="stat-label">Collected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{fontSize:22,color:'var(--warn)'}}>₹{Number(summary.total_pending||0).toLocaleString('en-IN')}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.invoice_count||0}</div>
            <div className="stat-label">Total Invoices</div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner"/> : bills.length===0 ? (
          <div className="empty"><div className="empty-icon">🧾</div><p>No bills yet</p></div>
        ):(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {bills.map(b=>(
                  <tr key={b.id}>
                    <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)'}}>{b.invoice_number}</td>
                    <td style={{fontWeight:600}}>{b.patients?.name}</td>
                    <td style={{fontFamily:'var(--mono)',fontWeight:700}}>₹{Number(b.total).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${PAYMENT_BADGE[b.payment_status]||'badge-gray'}`}>{b.payment_status}</span></td>
                    <td style={{fontSize:13,color:'var(--muted)'}}>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      {b.payment_status!=='paid' && (
                        <button className="btn btn-sm" style={{background:'rgba(0,212,170,0.15)',color:'var(--accent)'}} onClick={()=>markPaid(b.id)}>Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Bill Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Invoice</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Patient *</label>
              <input placeholder="Search patient..." value={patientSearch} onChange={e=>setPatientSearch(e.target.value)} />
              {patientSearch && (
                <div style={{background:'var(--bg3)',borderRadius:8,marginTop:4,maxHeight:150,overflowY:'auto',border:'1px solid var(--border)'}}>
                  {filtered.slice(0,5).map(p=>(
                    <div key={p.id} style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)'}}
                      onClick={()=>{setForm(f=>({...f,patient_id:p.id}));setPatientSearch(p.name)}}>
                      <div style={{fontWeight:600}}>{p.name}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{p.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <label style={{fontSize:13,color:'var(--muted)',fontWeight:500}}>Items</label>
                <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              {form.items.map((item,i)=>(
                <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                  <input style={{flex:2}} placeholder="Description" value={item.description} onChange={e=>updateItem(i,'description',e.target.value)} />
                  <input style={{flex:1}} placeholder="₹ Amount" type="number" value={item.amount} onChange={e=>updateItem(i,'amount',e.target.value)} />
                  {form.items.length>1 && <button onClick={()=>removeItem(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:18}}>✕</button>}
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="form-group"><label>Discount (₹)</label><input type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} placeholder="0" /></div>
              <div className="form-group"><label>Payment Method</label>
                <select value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}>
                  <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="online">Online</option>
                </select>
              </div>
            </div>

            <div style={{background:'var(--bg3)',borderRadius:8,padding:14,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--muted)',marginBottom:4}}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {Number(form.discount)>0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--danger)',marginBottom:4}}><span>Discount</span><span>-₹{Number(form.discount).toLocaleString('en-IN')}</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:16,color:'var(--accent)',borderTop:'1px solid var(--border)',paddingTop:8,marginTop:4}}><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>

            <div className="form-group"><label>Amount Received (₹) — leave blank if full payment</label><input type="number" value={form.paid_amount} onChange={e=>setForm(f=>({...f,paid_amount:e.target.value}))} placeholder={`₹${total}`} /></div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
