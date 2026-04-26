'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const API = process.env.NEXT_PUBLIC_API_URL

// ─── HELPERS ────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtPL = (n) => `${n >= 0 ? '+' : ''}Rs. ${fmt(n)}`
const isProfit = (n) => n > 0
const isLoss = (n) => n < 0

// ─── AUTH PAGES ─────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let res
      if (mode === 'login') {
        res = await supabase.auth.signInWithPassword({ email, password })
      } else {
        res = await supabase.auth.signUp({ email, password })
      }
      if (res.error) throw res.error
      if (mode === 'signup') setMode('verify')
      else onAuth(res.data.session)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (mode === 'verify') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="logo-mark">PSX</div>
          <h2>Check your email</h2>
          <p className="auth-sub">We sent a confirmation link to <strong>{email}</strong></p>
          <button className="btn-link" onClick={() => setMode('login')}>Back to login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-mark">PSX</div>
        <h1 className="auth-title">Profit Tracker</h1>
        <p className="auth-sub">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handle}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="btn-link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── UPLOAD ZONE ────────────────────────────
function UploadZone({ token, onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null) // null | 'uploading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  const upload = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      setStatus('error')
      setMessage('Please upload a PDF file only')
      return
    }
    setStatus('uploading')
    setMessage('Reading your transaction statement...')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API}/api/upload-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.detail || 'Upload failed')
      } else {
        setStatus('success')
        setMessage(`${data.trades_imported} trades imported from ${data.statement_id}`)
        setTimeout(() => { setStatus(null); onSuccess() }, 2500)
      }
    } catch {
      setStatus('error')
      setMessage('Connection error. Please try again.')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    upload(file)
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'drag' : ''} ${status === 'uploading' ? 'uploading' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => status !== 'uploading' && document.getElementById('pdfInput').click()}
    >
      <input id="pdfInput" type="file" accept=".pdf" hidden onChange={e => upload(e.target.files[0])} />
      {status === 'uploading' && (
        <div className="upload-state">
          <div className="spinner" />
          <p>{message}</p>
        </div>
      )}
      {status === 'success' && (
        <div className="upload-state success">
          <div className="check-icon">✓</div>
          <p>{message}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="upload-state error">
          <div className="x-icon">✕</div>
          <p>{message}</p>
          <span className="retry">Click to try again</span>
        </div>
      )}
      {!status && (
        <div className="upload-state">
          <div className="upload-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="upload-label">Drop your Munir Khanani PDF here</p>
          <span className="upload-sub">or click to browse · Transaction statements only</span>
        </div>
      )}
    </div>
  )
}

// ─── SUMMARY CARDS ───────────────────────────
function SummaryCards({ summary }) {
  if (!summary) return null
  const cards = [
    { label: "Today's P&L", value: summary.today_pl, type: 'pl' },
    { label: "This Week", value: summary.week_pl, type: 'pl' },
    { label: "This Month", value: summary.month_pl, type: 'pl' },
    { label: "Total Charges", value: summary.total_charges, type: 'charge' },
    { label: "Win Rate", value: `${summary.win_rate}%`, type: 'rate' },
    { label: "Total Trades", value: summary.total_trades, type: 'count' },
  ]
  return (
    <div className="cards-grid">
      {cards.map(c => (
        <div key={c.label} className={`summary-card ${c.type === 'pl' ? (isProfit(c.value) ? 'profit' : isLoss(c.value) ? 'loss' : '') : ''}`}>
          <div className="card-label">{c.label}</div>
          <div className="card-value">
            {c.type === 'pl' ? fmtPL(c.value) :
             c.type === 'charge' ? `Rs. ${fmt(c.value)}` :
             c.value}
          </div>
        </div>
      ))}
      {summary.best_trade && (
        <div className="summary-card best">
          <div className="card-label">Best Trade</div>
          <div className="card-value">{summary.best_trade.symbol}</div>
          <div className="card-sub profit-text">{fmtPL(summary.best_trade.pl)}</div>
        </div>
      )}
      {summary.worst_trade && (
        <div className="summary-card worst">
          <div className="card-label">Worst Trade</div>
          <div className="card-value">{summary.worst_trade.symbol}</div>
          <div className="card-sub loss-text">{fmtPL(summary.worst_trade.pl)}</div>
        </div>
      )}
    </div>
  )
}

// ─── TRADE PAIRS ─────────────────────────────
function TradePairs({ trades }) {
  if (!trades || trades.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <p>No trades yet. Upload your first transaction statement above.</p>
    </div>
  )

  // Group by symbol
  const bySymbol = {}
  trades.forEach(t => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = []
    bySymbol[t.symbol].push(t)
  })

  // Group pairs
  const symbolGroups = Object.entries(bySymbol).map(([symbol, trades]) => {
    const pairs = {}
    const unmatched = []
    trades.forEach(t => {
      if (t.pair_id) {
        if (!pairs[t.pair_id]) pairs[t.pair_id] = {}
        pairs[t.pair_id][t.trade_type] = t
      } else {
        unmatched.push(t)
      }
    })
    return { symbol, company: trades[0].company_name, pairs: Object.values(pairs), unmatched }
  })

  return (
    <div className="trade-groups">
      {symbolGroups.map(({ symbol, company, pairs, unmatched }) => (
        <div key={symbol} className="symbol-group">
          <div className="symbol-header">
            <div>
              <span className="symbol-ticker">{symbol}</span>
              <span className="symbol-company">{company}</span>
            </div>
          </div>

          {pairs.map((pair, i) => {
            const sell = pair.SELL
            const buy = pair.BUY
            const pl = sell?.net_pl || buy?.net_pl || 0
            return (
              <div key={i} className="trade-pair">
                {sell && (
                  <div className="trade-leg sell-leg">
                    <div className="leg-badge sell-badge">SELL</div>
                    <div className="leg-detail">
                      <span className="leg-qty">{sell.quantity?.toLocaleString()}</span>
                      <span className="leg-at">@</span>
                      <span className="leg-rate">Rs. {fmt(sell.rate)}</span>
                    </div>
                    <div className="leg-charges">Charges: Rs. {fmt(sell.total_charges)}</div>
                    <div className="leg-amount sell-amount">Rs. {fmt(sell.gross_amount)}</div>
                  </div>
                )}
                {buy && (
                  <div className="trade-leg buy-leg">
                    <div className="leg-badge buy-badge">BUY</div>
                    <div className="leg-detail">
                      <span className="leg-qty">{buy.quantity?.toLocaleString()}</span>
                      <span className="leg-at">@</span>
                      <span className="leg-rate">Rs. {fmt(buy.rate)}</span>
                    </div>
                    <div className="leg-charges">Charges: Rs. {fmt(buy.total_charges)}</div>
                    <div className="leg-amount buy-amount">Rs. {fmt(buy.gross_amount)}</div>
                  </div>
                )}
                <div className={`pair-pl ${isProfit(pl) ? 'profit-pl' : isLoss(pl) ? 'loss-pl' : ''}`}>
                  <span className="pl-label">Net P&L</span>
                  <span className="pl-value">{fmtPL(pl)}</span>
                </div>
              </div>
            )
          })}

          {unmatched.map((t, i) => (
            <div key={i} className={`trade-pair unmatched ${t.trade_type === 'SELL' ? 'short-sell' : 'pending-sell'}`}>
              <div className="trade-leg">
                <div className={`leg-badge ${t.trade_type === 'BUY' ? 'buy-badge' : 'sell-badge'}`}>{t.trade_type}</div>
                <div className="leg-detail">
                  <span className="leg-qty">{t.quantity?.toLocaleString()}</span>
                  <span className="leg-at">@</span>
                  <span className="leg-rate">Rs. {fmt(t.rate)}</span>
                </div>
                <div className="leg-amount">{t.trade_type === 'SELL' ? `-Rs. ${fmt(t.gross_amount)}` : `Rs. ${fmt(t.gross_amount)}`}</div>
              </div>
              <div className="pending-tag">
                {t.trade_type === 'SELL' ? '⏳ Awaiting BUY to match (Short Sell)' : '⏳ Awaiting SELL to match'}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── CALENDAR ────────────────────────────────
function CalendarView({ token }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [dayTrades, setDayTrades] = useState(null)

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/calendar?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await res.json()
    setData(d)
  }, [month, year, token])

  useEffect(() => { load() }, [load])

  const loadDay = async (dateStr) => {
    setSelected(dateStr)
    const res = await fetch(`${API}/api/trades?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await res.json()
    const dayOnly = d.trades.filter(t => t.trade_date === dateStr)
    setDayTrades(dayOnly)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="calendar-wrap">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }}>←</button>
        <div className="cal-title">{monthNames[month - 1]} {year}</div>
        <button className="cal-nav" onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }}>→</button>
      </div>

      {data && (
        <div className="cal-summary-row">
          <div className={`cal-monthly-pl ${isProfit(data.monthly_pl) ? 'profit-text' : isLoss(data.monthly_pl) ? 'loss-text' : ''}`}>
            Monthly P&L: {fmtPL(data.monthly_pl)}
          </div>
          <div className="cal-monthly-charges">Charges: Rs. {fmt(data.monthly_charges)}</div>
        </div>
      )}

      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const info = data?.daily?.[dateStr]
          const isSelected = selected === dateStr
          const isToday = dateStr === new Date().toISOString().slice(0,10)
          return (
            <div
              key={day}
              className={`cal-day ${info ? 'has-data' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => info && loadDay(dateStr)}
            >
              <span className="cal-day-num">{day}</span>
              {info && (
                <span className={`cal-day-pl ${isProfit(info.pl) ? 'profit-text' : isLoss(info.pl) ? 'loss-text' : ''}`}>
                  {info.pl >= 0 ? '+' : ''}{Math.round(info.pl / 1000)}k
                </span>
              )}
            </div>
          )
        })}
      </div>

      {selected && dayTrades && (
        <div className="day-detail">
          <div className="day-detail-header">
            <span>{selected}</span>
            <button className="btn-link" onClick={() => { setSelected(null); setDayTrades(null) }}>✕</button>
          </div>
          <TradePairs trades={dayTrades} />
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')
  const [trades, setTrades] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const fetchData = useCallback(async () => {
    if (!session) return
    const token = session.access_token
    const [tradesRes, summaryRes] = await Promise.all([
      fetch(`${API}/api/trades`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/summary`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const tradesData = await tradesRes.json()
    const summaryData = await summaryRes.json()
    setTrades(tradesData.trades || [])
    setSummary(summaryData)
  }, [session])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="splash"><div className="splash-logo">PSX</div></div>
  if (!session) return <AuthPage onAuth={setSession} />

  const token = session.access_token

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
        
        :root {
          --bg: #0A0E1A;
          --surface: #111827;
          --surface2: #1A2235;
          --border: #1E2D45;
          --border2: #253550;
          --text: #E8EDF5;
          --muted: #6B7FA3;
          --accent: #3B82F6;
          --accent2: #1D4ED8;
          --profit: #10B981;
          --profit-bg: #052E1C;
          --loss: #EF4444;
          --loss-bg: #2D0808;
          --sell-bg: #1C0A0A;
          --sell-border: #3D1515;
          --buy-bg: #0A1C0F;
          --buy-border: #153D20;
          --orange: #F59E0B;
          --orange-bg: #1C1405;
          --font: 'DM Mono', 'Fira Code', 'Courier New', monospace;
          --sans: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
        }

        html, body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }

        /* AUTH */
        .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 1rem; }
        .auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px; }
        .logo-mark { font-family: var(--font); font-size: 12px; letter-spacing: 0.3em; color: var(--accent); margin-bottom: 1rem; }
        .auth-title { font-size: 24px; font-weight: 600; margin-bottom: 0.25rem; }
        .auth-sub { color: var(--muted); font-size: 14px; margin-bottom: 1.5rem; }
        .auth-error { background: var(--loss-bg); border: 1px solid var(--loss); color: var(--loss); padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 1rem; }
        .field { margin-bottom: 1rem; }
        .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
        .field input { width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-size: 14px; outline: none; transition: border-color 0.2s; }
        .field input:focus { border-color: var(--accent); }
        .btn-primary { width: 100%; padding: 11px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
        .btn-primary:hover:not(:disabled) { background: var(--accent2); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-switch { text-align: center; margin-top: 1.25rem; font-size: 13px; color: var(--muted); }
        .btn-link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: inherit; text-decoration: underline; }

        /* LAYOUT */
        .app-layout { min-height: 100vh; display: flex; flex-direction: column; }
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; height: 56px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
        .topbar-logo { font-family: var(--font); font-size: 13px; letter-spacing: 0.2em; color: var(--accent); }
        .topbar-user { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 12px; }
        .signout-btn { padding: 5px 12px; background: transparent; border: 1px solid var(--border2); border-radius: 6px; color: var(--muted); font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .signout-btn:hover { border-color: var(--loss); color: var(--loss); }

        .tabs { display: flex; padding: 0 1.5rem; background: var(--surface); border-bottom: 1px solid var(--border); gap: 0; }
        .tab { padding: 12px 20px; font-size: 13px; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
        .tab.active { color: var(--text); border-bottom-color: var(--accent); }
        .tab:hover { color: var(--text); }

        .main-content { flex: 1; padding: 1.5rem; max-width: 1100px; margin: 0 auto; width: 100%; }

        /* UPLOAD */
        .upload-zone { border: 1.5px dashed var(--border2); border-radius: 12px; padding: 2.5rem 2rem; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 1.5rem; background: var(--surface); }
        .upload-zone:hover, .upload-zone.drag { border-color: var(--accent); background: rgba(59,130,246,0.05); }
        .upload-zone.uploading { cursor: default; border-color: var(--accent); }
        .upload-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .upload-icon { color: var(--muted); }
        .upload-label { font-size: 15px; font-weight: 500; }
        .upload-sub { font-size: 12px; color: var(--muted); }
        .spinner { width: 28px; height: 28px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .check-icon { width: 40px; height: 40px; background: var(--profit-bg); border: 2px solid var(--profit); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--profit); font-size: 18px; }
        .x-icon { width: 40px; height: 40px; background: var(--loss-bg); border: 2px solid var(--loss); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--loss); font-size: 18px; }
        .upload-state.success p { color: var(--profit); }
        .upload-state.error p { color: var(--loss); }
        .retry { font-size: 12px; color: var(--muted); }

        /* SUMMARY CARDS */
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 1.5rem; }
        .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .summary-card.profit { border-color: var(--buy-border); background: var(--buy-bg); }
        .summary-card.loss { border-color: var(--sell-border); background: var(--sell-bg); }
        .card-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .card-value { font-size: 18px; font-weight: 600; font-family: var(--font); }
        .card-sub { font-size: 13px; margin-top: 4px; font-family: var(--font); }
        .profit-text { color: var(--profit) !important; }
        .loss-text { color: var(--loss) !important; }

        /* TRADES */
        .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 12px; }
        .trade-groups { display: flex; flex-direction: column; gap: 16px; }
        .symbol-group { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .symbol-header { padding: 12px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .symbol-ticker { font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--accent); margin-right: 10px; }
        .symbol-company { font-size: 12px; color: var(--muted); }

        .trade-pair { display: grid; grid-template-columns: 1fr 1fr auto; gap: 1px; border-bottom: 1px solid var(--border); }
        .trade-pair:last-child { border-bottom: none; }
        .trade-pair.unmatched { grid-template-columns: 1fr; }
        .trade-leg { padding: 14px 16px; }
        .sell-leg { background: var(--sell-bg); }
        .buy-leg { background: var(--buy-bg); }
        .leg-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 8px; }
        .sell-badge { background: rgba(239,68,68,0.15); color: var(--loss); border: 1px solid rgba(239,68,68,0.3); }
        .buy-badge { background: rgba(16,185,129,0.15); color: var(--profit); border: 1px solid rgba(16,185,129,0.3); }
        .leg-detail { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .leg-qty { font-family: var(--font); font-size: 15px; font-weight: 600; }
        .leg-at { color: var(--muted); font-size: 12px; }
        .leg-rate { font-family: var(--font); font-size: 13px; color: var(--muted); }
        .leg-charges { font-size: 11px; color: var(--muted); }
        .leg-amount { font-family: var(--font); font-size: 14px; font-weight: 600; margin-top: 6px; }
        .sell-amount { color: var(--loss); }
        .buy-amount { color: var(--profit); }
        .pair-pl { padding: 14px 16px; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; min-width: 130px; background: var(--surface2); }
        .pl-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 4px; }
        .pl-value { font-family: var(--font); font-size: 16px; font-weight: 700; }
        .profit-pl .pl-value { color: var(--profit); }
        .loss-pl .pl-value { color: var(--loss); }
        .pending-tag { padding: 10px 16px; font-size: 12px; color: var(--orange); background: var(--orange-bg); border-top: 1px solid rgba(245,158,11,0.2); }

        .empty-state { text-align: center; padding: 4rem 1rem; color: var(--muted); }
        .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }

        /* CALENDAR */
        .calendar-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .cal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .cal-title { font-size: 15px; font-weight: 600; font-family: var(--font); }
        .cal-nav { background: none; border: 1px solid var(--border2); color: var(--text); border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 14px; }
        .cal-nav:hover { border-color: var(--accent); }
        .cal-summary-row { display: flex; gap: 1.5rem; padding: 12px 20px; background: var(--surface2); border-bottom: 1px solid var(--border); font-size: 13px; font-family: var(--font); }
        .cal-monthly-pl { font-weight: 600; }
        .cal-monthly-charges { color: var(--muted); }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); padding: 1px; }
        .cal-day-name { background: var(--surface2); padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
        .cal-day { background: var(--surface); padding: 8px; min-height: 56px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; position: relative; }
        .cal-day.has-data { cursor: pointer; }
        .cal-day.has-data:hover { background: var(--surface2); }
        .cal-day.selected { background: rgba(59,130,246,0.1); outline: 1px solid var(--accent); }
        .cal-day.today .cal-day-num { color: var(--accent); font-weight: 700; }
        .cal-day-num { font-size: 13px; color: var(--muted); }
        .cal-day-pl { font-size: 11px; font-family: var(--font); font-weight: 600; }
        .day-detail { border-top: 1px solid var(--border); padding: 1rem; }
        .day-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 13px; font-family: var(--font); color: var(--muted); }

        /* SPLASH */
        .splash { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
        .splash-logo { font-family: var(--font); font-size: 20px; letter-spacing: 0.3em; color: var(--accent); animation: pulse 1.5s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }

        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: repeat(2, 1fr); }
          .trade-pair { grid-template-columns: 1fr 1fr; }
          .pair-pl { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; }
          .main-content { padding: 1rem; }
          .topbar { padding: 0 1rem; }
          .tabs { padding: 0 1rem; overflow-x: auto; }
          .tab { white-space: nowrap; }
        }
      `}</style>

      <div className="app-layout">
        <header className="topbar">
          <div className="topbar-logo">PSX PROFIT TRACKER</div>
          <div className="topbar-user">
            <span>{session.user.email}</span>
            <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </header>

        <nav className="tabs">
          {['dashboard', 'calendar'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        <main className="main-content">
          {tab === 'dashboard' && (
            <>
              <UploadZone token={token} onSuccess={fetchData} />
              <SummaryCards summary={summary} />
              <div className="section-title">Trade Pairs — Grouped by Symbol</div>
              <TradePairs trades={trades} />
            </>
          )}
          {tab === 'calendar' && <CalendarView token={token} />}
        </main>
      </div>
    </>
  )
}
