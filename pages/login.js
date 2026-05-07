import { useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const handle = async () => {
    setLoading(true); setError('')
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        localStorage.setItem('clinic_token', data.session.access_token)
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (error) throw error
        setMsg('Check your email to confirm your account, then log in.')
        setIsLogin(true)
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✚</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>ClinicOS</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Practice Management Software</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          {msg && (
            <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent)' }}>
              {msg}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Dr. Piyush Sharma" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="doctor@clinic.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={handle} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setIsLogin(!isLogin); setError(''); setMsg('') }}>
              {isLogin ? 'Sign up free' : 'Sign in'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
          Free forever for solo doctors · No credit card required
        </div>
      </div>
    </div>
  )
}
