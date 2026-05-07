import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../lib/api'

const STATUS_BADGE = {
  scheduled: 'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
  no_show:    'badge-yellow',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Good morning, Doctor 👋</div>
          <div className="page-subtitle">{today}</div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data?.stats?.total_patients || 0}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data?.stats?.todays_appointments || 0}</div>
              <div className="stat-label">Today's Appointments</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data?.stats?.completed_today || 0}</div>
              <div className="stat-label">Completed Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warn)', fontSize: 22 }}>
                ₹{(data?.stats?.pending_amount || 0).toLocaleString('en-IN')}
              </div>
              <div className="stat-label">Pending Payments</div>
            </div>
          </div>

          {/* Today's appointments */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title">Today's Schedule</div>
            {data?.todays_appointments?.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📅</div>
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Problem</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.todays_appointments?.map(apt => (
                      <tr key={apt.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{apt.appointment_time?.slice(0,5)}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{apt.patients?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{apt.patients?.phone}</div>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{apt.problem || '—'}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[apt.status] || 'badge-gray'}`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent patients */}
          <div className="card">
            <div className="card-title">Recently Added Patients</div>
            {data?.recent_patients?.length === 0 ? (
              <div className="empty"><div className="empty-icon">👥</div><p>No patients yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {data?.recent_patients?.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      {p.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
