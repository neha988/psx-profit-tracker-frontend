'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminPanel from '../admin'
import { MarketingStyles, PublicNavbar } from '../marketing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const API = process.env.NEXT_PUBLIC_API_URL
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

const isAdminUser = (user) => {
  if (!user) return false
  const email = user.email?.toLowerCase()
  return (
    ADMIN_EMAILS.includes(email) ||
    user.app_metadata?.role === 'admin' ||
    user.app_metadata?.is_admin === true ||
    user.user_metadata?.role === 'admin' ||
    user.user_metadata?.is_admin === true
  )
}

// ─── HELPERS ────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtPL = (n) => `${n >= 0 ? '+' : ''}Rs. ${fmt(n)}`
const isProfit = (n) => n > 0
const isLoss = (n) => n < 0

// Convert UTC time to Pakistani Time (PKT = UTC+5)
const toPKT = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return new Date(date.getTime() + (5 * 60 * 60 * 1000)) // Add 5 hours for PKT
}

// Format date/time in Pakistani timezone
const fmtDateTimePKT = (dateStr) => {
  const pktDate = toPKT(dateStr)
  if (!pktDate) return ''
  return pktDate.toLocaleString('en-PK', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC' // We already converted to PKT, so use UTC for display
  })
}

// Formats "2026-04-22" → "Apr 22" or "2026-04-22,2026-04-24" → "Apr 22 & Apr 24"
const fmtDate = (dateVal) => {
  if (!dateVal) return ''
  const dates = Array.isArray(dateVal) ? dateVal : [dateVal]
  return dates
    .map(d => {
      const dt = new Date(d + 'T00:00:00')
      return dt.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    })
    .join(' & ')
}

// ─── AUTH PAGES ─────────────────────────────
function AuthPage() {
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
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (mode === 'verify') {
    return (
      <AuthFrame>
        <div className="auth-card marketing-auth-card">
          <div className="logo-mark">PSX</div>
          <h2>Check your email</h2>
          <p className="auth-sub">We sent a confirmation link to <strong>{email}</strong></p>
          <button className="btn-link" onClick={() => setMode('login')}>Back to login</button>
        </div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame>
      <div className="auth-card marketing-auth-card">
        <div className="logo-mark">PSX</div>
        <h1 className="auth-title">Profit Tracker</h1>
        <p className="auth-sub">{mode === 'login' ? 'Sign in to upload statements and review your live P&L.' : 'Create your account and start tracking PSX trades.'}</p>
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
    </AuthFrame>
  )
}

function AuthFrame({ children }) {
  return (
    <>
      <MarketingStyles />
      <AuthStyles />
      <div className="site-shell auth-page">
        <PublicNavbar />
        <main className="auth-hero">
          <section className="auth-copy">
            <span className="auth-eyebrow">PSX Profit Tracker</span>
            <h1>Enter your trading workspace.</h1>
            <p>Sign in to access your account, manage your PSX tools, and continue with the plan available to your profile.</p>
            <div className="auth-mini-stats">
              <span>Member Access</span>
              <span>Signals Hub</span>
              <span>Plan Based Tools</span>
            </div>
          </section>

          <section className="auth-panel">
            <div className="auth-coin-stage" aria-hidden="true">
              <div className="auth-coin">Rs</div>
            </div>
            {children}
          </section>
        </main>
      </div>
    </>
  )
}

function AuthStyles() {
  return (
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
        --loss: #EF4444;
        --loss-bg: #2D0808;
        --font: 'DM Mono', 'Fira Code', 'Courier New', monospace;
        --sans: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
      }
      html, body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }
      a { color: inherit; text-decoration: none; }
      .auth-page { min-height: 100vh; }
      .auth-hero { min-height: calc(100vh - 68px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 430px); gap: clamp(2rem, 7vw, 6rem); align-items: center; padding: clamp(3rem, 7vw, 6rem) 5vw; max-width: 1220px; margin: 0 auto; }
      .auth-copy h1 { max-width: 720px; font-size: clamp(3rem, 7vw, 6.5rem); line-height: 0.95; letter-spacing: 0; margin: 0; }
      .auth-copy p { max-width: 620px; margin-top: 1.4rem; color: #B8C5DA; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.65; }
      .auth-eyebrow, .logo-mark { display: inline-block; margin-bottom: 1rem; color: var(--accent); font-family: var(--font); font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
      .auth-mini-stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 2rem; }
      .auth-mini-stats span { padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(17,24,39,0.72); color: #B8C5DA; font-size: 13px; }
      .auth-panel { position: relative; }
      .auth-coin-stage { position: absolute; inset: -90px 0 auto auto; width: 170px; height: 170px; pointer-events: none; opacity: 0.88; }
      .auth-coin { width: 118px; height: 118px; border-radius: 50%; display: grid; place-items: center; color: #052E1C; font-family: var(--font); font-size: 34px; font-weight: 700; background: radial-gradient(circle at 32% 25%, #E8FFD6, #74D77D 30%, #10B981 62%, #047857); border: 7px solid #D8F8A8; box-shadow: 0 24px 60px rgba(16,185,129,0.24); animation: authCoin 4s ease-in-out infinite; }
      @keyframes authCoin { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(5deg); } }
      .marketing-auth-card { position: relative; z-index: 1; width: 100%; max-width: 430px; padding: 2.2rem; background: linear-gradient(180deg, rgba(26,34,53,0.92), rgba(17,24,39,0.97)); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 30px 80px rgba(0,0,0,0.28); }
      .auth-title, .marketing-auth-card h2 { font-size: 30px; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0; }
      .auth-sub { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 1.5rem; }
      .auth-error { background: var(--loss-bg); border: 1px solid var(--loss); color: var(--loss); padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 1rem; }
      .field { margin-bottom: 1rem; }
      .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; letter-spacing: 0; text-transform: uppercase; }
      .field input { width: 100%; padding: 12px 14px; background: var(--bg); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-size: 14px; outline: none; transition: border-color 0.2s, background 0.2s; }
      .field input:focus { border-color: var(--accent); background: rgba(10,14,26,0.74); }
      .btn-primary { width: 100%; min-height: 44px; padding: 11px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s, transform 0.2s; }
      .btn-primary:hover:not(:disabled) { background: var(--accent2); transform: translateY(-1px); }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-switch { text-align: center; margin-top: 1.25rem; font-size: 13px; color: var(--muted); }
      .btn-link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: inherit; text-decoration: underline; }
      @media (max-width: 900px) {
        .auth-hero { grid-template-columns: 1fr; }
        .auth-copy h1 { font-size: clamp(2.7rem, 13vw, 4.6rem); }
        .auth-coin-stage { display: none; }
        .marketing-auth-card { max-width: none; }
      }
      @media (max-width: 560px) {
        .auth-hero { padding: 2.25rem 5vw 3.5rem; }
        .marketing-auth-card { padding: 1.4rem; }
      }
    `}</style>
  )
}

// ─── UPLOAD ZONE ────────────────────────────
// ─── UPLOAD ZONE (Multi-PDF) ────────────────
function UploadZone({ token, onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState([]) // [{name, status, message}]
  const [running, setRunning] = useState(false)

  const uploadFile = async (file, index, updateItem) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      updateItem(index, 'error', 'Not a PDF file')
      return
    }
    updateItem(index, 'uploading', 'Reading statement...')
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
        updateItem(index, 'error', data.detail || `Failed (${res.status})`)
      } else {
        updateItem(index, 'success', `${data.trades_imported} trades imported · ${data.statement_id}`)
      }
    } catch (err) {
      updateItem(index, 'error', 'Connection error: ' + err.message)
    }
  }

  const handleFiles = async (files) => {
    const fileArr = Array.from(files)
    if (!fileArr.length) return

    const initial = fileArr.map(f => ({ name: f.name, status: 'pending', message: 'Waiting...' }))
    setUploads(initial)
    setRunning(true)

    const updateItem = (i, status, message) => {
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status, message } : u))
    }

    // Upload one by one sequentially
    for (let i = 0; i < fileArr.length; i++) {
      await uploadFile(fileArr[i], i, updateItem)
    }

    setRunning(false)
    onSuccess() // refresh data after all uploads
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const reset = () => setUploads([])

  const allDone = uploads.length > 0 && !running
  const hasError = uploads.some(u => u.status === 'error')

  return (
    <div className="upload-outer">
      {uploads.length === 0 ? (
        <div
          className={`upload-zone ${dragging ? 'drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('pdfInput').click()}
        >
          <input
            id="pdfInput"
            type="file"
            accept=".pdf"
            multiple
            hidden
            onChange={e => handleFiles(e.target.files)}
          />
          <div className="upload-state">
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="upload-label">Drop your Munir Khanani PDFs here</p>
            <span className="upload-sub">or click to browse · Select multiple files for bulk upload</span>
          </div>
        </div>
      ) : (
        <div className="upload-progress-box">
          <div className="upload-progress-header">
            <span className="upload-progress-title">
              {running ? `Uploading ${uploads.filter(u => u.status === 'success' || u.status === 'error').length} / ${uploads.length}...` 
                       : `Done — ${uploads.filter(u => u.status === 'success').length} of ${uploads.length} imported`}
            </span>
            {allDone && (
              <button className="btn-link" onClick={reset}>Upload more</button>
            )}
          </div>
          <div className="upload-file-list">
            {uploads.map((u, i) => (
              <div key={i} className={`upload-file-item ${u.status}`}>
                <div className="upload-file-icon">
                  {u.status === 'pending'   && <span className="file-dot pending-dot" />}
                  {u.status === 'uploading' && <div className="spinner-sm" />}
                  {u.status === 'success'   && <span className="file-check">✓</span>}
                  {u.status === 'error'     && <span className="file-x">✕</span>}
                </div>
                <div className="upload-file-info">
                  <div className="upload-file-name">{u.name}</div>
                  <div className="upload-file-msg">{u.message}</div>
                </div>
              </div>
            ))}
          </div>
          {allDone && hasError && (
            <div className="upload-retry-note">Some files failed. Fix them and upload again.</div>
          )}
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

// ─── TRADE LEG ───────────────────────────────
// Renders one side (BUY or SELL) of a trade with its date
function TradeLeg({ t, side }) {
  const isSell = side === 'SELL'
  // trade_dates is from aggregated unmatched; trade_date is the single date field
  const dateLabel = fmtDate(t.trade_dates || t.trade_date)

  return (
    <div className={`trade-leg ${isSell ? 'sell-leg' : 'buy-leg'}`}>
      <div className="leg-top-row">
        <div className={`leg-badge ${isSell ? 'sell-badge' : 'buy-badge'}`}>{side}</div>
        {dateLabel && <div className="leg-date">{dateLabel}</div>}
      </div>
      <div className="leg-detail">
        <span className="leg-qty">{t.quantity?.toLocaleString()}</span>
        <span className="leg-at">@</span>
        <span className="leg-rate">
          Rs. {fmt(t.rate)}
          {t.aggregated && t.aggregated_count > 1 && (
            <span className="leg-avg-tag"> avg</span>
          )}
        </span>
      </div>
      <div className="leg-charges">Charges: Rs. {fmt(t.total_charges)}</div>
      <div className={`leg-amount ${isSell ? 'sell-amount' : 'buy-amount'}`}>
        Rs. {fmt(t.gross_amount)}
      </div>
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

  const symbolGroups = Object.entries(bySymbol).map(([symbol, trades]) => {
    const pairs = {}
    const unmatched = []
    
    // Group by pair_id first
    trades.forEach(t => {
      if (t.pair_id) {
        if (!pairs[t.pair_id]) pairs[t.pair_id] = { BUY: [], SELL: [] }
        pairs[t.pair_id][t.trade_type].push(t)
      } else {
        unmatched.push(t)
      }
    })

    // Aggregate multiple trades on same side in a pair
    const aggregatedPairs = Object.entries(pairs).map(([pair_id, sides]) => {
      const aggregateSide = (trades) => {
        if (trades.length === 1) {
          return { ...trades[0], aggregated: false, aggregated_count: 1 }
        }
        
        const total_qty = trades.reduce((sum, t) => sum + t.quantity, 0)
        const total_gross = trades.reduce((sum, t) => sum + t.gross_amount, 0)
        const avg_rate = total_gross / total_qty
        
        return {
          ...trades[0],
          quantity: total_qty,
          rate: avg_rate,
          gross_amount: total_gross,
          total_charges: trades.reduce((sum, t) => sum + t.total_charges, 0),
          trade_dates: [...new Set(trades.map(t => t.trade_date))].sort(),
          aggregated: true,
          aggregated_count: trades.length,
          id: [trades.map(t => t.id)] // store all IDs
        }
      }
      
      return {
        BUY: sides.BUY.length > 0 ? aggregateSide(sides.BUY) : null,
        SELL: sides.SELL.length > 0 ? aggregateSide(sides.SELL) : null,
        net_pl: trades.find(t => t.pair_id === pair_id)?.net_pl || 0
      }
    })
    
    return { symbol, company: trades[0].company_name, pairs: aggregatedPairs, unmatched }
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

          {/* ── Matched pairs ── */}
          {pairs.map((pair, i) => {
            const sell = pair.SELL
            const buy  = pair.BUY
            const pl   = pair.net_pl || 0
            return (
              <div key={i} className="trade-pair">
                {sell && <TradeLeg t={sell} side="SELL" />}
                {buy  && <TradeLeg t={buy}  side="BUY"  />}
                <div className={`pair-pl ${isProfit(pl) ? 'profit-pl' : isLoss(pl) ? 'loss-pl' : ''}`}>
                  <span className="pl-label">Net P&L</span>
                  <span className="pl-value">{fmtPL(pl)}</span>
                </div>
              </div>
            )
          })}

          {/* ── Unmatched (awaiting) ── */}
          {unmatched.map((t, i) => (
            <div key={i} className={`trade-pair unmatched ${t.trade_type === 'SELL' ? 'short-sell' : 'pending-sell'}`}>
              <TradeLeg t={t} side={t.trade_type} />
              <div className="pending-tag">
                {t.trade_type === 'SELL'
                  ? '⏳ Awaiting BUY to match (Short Sell)'
                  : '⏳ Awaiting SELL to match'}
                {t.aggregated && t.aggregated_count > 1 && (
                  <span className="agg-tag"> · {t.aggregated_count} entries combined</span>
                )}
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
    setData(await res.json())
  }, [month, year, token])

  useEffect(() => { load() }, [load])

  const loadDay = async (dateStr) => {
    setSelected(dateStr)
    const res = await fetch(`${API}/api/trades?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await res.json()
    setDayTrades(d.trades.filter(t => t.trade_date === dateStr))
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay   = new Date(year, month - 1, 1).getDay()
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
          const day     = i + 1
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const info    = data?.daily?.[dateStr]
          return (
            <div
              key={day}
              className={`cal-day ${info ? 'has-data' : ''} ${selected === dateStr ? 'selected' : ''} ${dateStr === new Date().toISOString().slice(0,10) ? 'today' : ''}`}
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

function MonthlyIncomeCalculator({ token }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const calculate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/calendar?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [month, year, token])

  useEffect(() => { calculate() }, [calculate])

  const tradingDays = data ? Object.keys(data.daily || {}).length : 0

  return (
    <div className="calculator-wrap">
      <div className="calculator-card">
        <div>
          <div className="section-title">Monthly Income Calculator</div>
          <h2 className="calculator-title">Select a month to calculate income</h2>
        </div>

        <div className="calculator-controls">
          <div className="field compact">
            <label>Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="field compact">
            <label>Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min="2020" max="2100" />
          </div>
          <button className="calc-btn" onClick={calculate} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        <div className="calculator-results">
          <div className={`income-card ${isProfit(data?.monthly_pl) ? 'profit' : isLoss(data?.monthly_pl) ? 'loss' : ''}`}>
            <span>Monthly Income</span>
            <strong>{data ? fmtPL(data.monthly_pl) : 'Rs. 0.00'}</strong>
          </div>
          <div className="income-card">
            <span>Total Charges</span>
            <strong>Rs. {fmt(data?.monthly_charges)}</strong>
          </div>
          <div className="income-card">
            <span>Trading Days</span>
            <strong>{tradingDays}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ────────────────────────────────
export default function App() {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('dashboard')
  const [trades, setTrades]     = useState([])
  const [summary, setSummary]   = useState(null)
  const [showRemainingOnly, setShowRemainingOnly] = useState(false)
  const isAdmin = isAdminUser(session?.user)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
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
    setTrades((await tradesRes.json()).trades || [])
    setSummary(await summaryRes.json())
  }, [session])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (tab === 'admin' && !isAdmin) setTab('dashboard')
  }, [tab, isAdmin])

  if (loading) return <div className="splash"><div className="splash-logo">PSX</div></div>
  if (!session) return <AuthPage />

  const token = session.access_token
  const visibleTrades = showRemainingOnly ? trades.filter(t => !t.pair_id || t.matched === false) : trades

  return (
    <>
      <MarketingStyles />
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
        .tracker-shell { min-height: 100vh; }
        .app-layout { min-height: calc(100vh - 68px); display: flex; flex-direction: column; }
        .tabs { display: flex; align-items: center; padding: 0 5vw; background: rgba(17,24,39,0.78); border-bottom: 1px solid var(--border); gap: 1rem; backdrop-filter: blur(16px); }
        .tab-buttons { display: flex; gap: 0; overflow-x: auto; }
        .tab { padding: 12px 20px; font-size: 13px; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
        .tab.active { color: var(--text); border-bottom-color: var(--accent); }
        .tab:hover { color: var(--text); }

        .main-content { flex: 1; padding: 1.5rem; max-width: 1100px; margin: 0 auto; width: 100%; }
        .dashboard-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .toggle-control { display: inline-flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; cursor: pointer; user-select: none; }
        .toggle-control input { position: absolute; opacity: 0; pointer-events: none; }
        .toggle-track { width: 48px; height: 26px; border-radius: 999px; border: 1px solid var(--border2); background: var(--surface); position: relative; transition: all 0.2s; }
        .toggle-track::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; left: 3px; top: 3px; background: var(--muted); transition: all 0.2s; }
        .toggle-control input:checked + .toggle-track { background: rgba(59,130,246,0.22); border-color: var(--accent); }
        .toggle-control input:checked + .toggle-track::after { transform: translateX(22px); background: var(--accent); }

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

        /* Date row inside leg */
        .leg-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .leg-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }
        .leg-date { font-size: 11px; color: var(--muted); font-family: var(--font); letter-spacing: 0.03em; }
        .sell-badge { background: rgba(239,68,68,0.15); color: var(--loss); border: 1px solid rgba(239,68,68,0.3); }
        .buy-badge { background: rgba(16,185,129,0.15); color: var(--profit); border: 1px solid rgba(16,185,129,0.3); }

        .leg-detail { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .leg-qty { font-family: var(--font); font-size: 15px; font-weight: 600; }
        .leg-at { color: var(--muted); font-size: 12px; }
        .leg-rate { font-family: var(--font); font-size: 13px; color: var(--muted); }
        .leg-avg-tag { font-size: 10px; color: var(--accent); background: rgba(59,130,246,0.12); padding: 1px 5px; border-radius: 4px; margin-left: 2px; letter-spacing: 0.05em; }
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
        .agg-tag { opacity: 0.7; font-size: 11px; }

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
        .cal-day { background: var(--surface); padding: 8px; min-height: 56px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .cal-day.has-data { cursor: pointer; }
        .cal-day.has-data:hover { background: var(--surface2); }
        .cal-day.selected { background: rgba(59,130,246,0.1); outline: 1px solid var(--accent); }
        .cal-day.today .cal-day-num { color: var(--accent); font-weight: 700; }
        .cal-day-num { font-size: 13px; color: var(--muted); }
        .cal-day-pl { font-size: 11px; font-family: var(--font); font-weight: 600; }
        .day-detail { border-top: 1px solid var(--border); padding: 1rem; }
        .day-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 13px; font-family: var(--font); color: var(--muted); }
        .calculator-wrap { display: grid; gap: 1rem; }
        .calculator-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
        .calculator-title { font-size: 24px; margin: 0 0 1.5rem; }
        .calculator-controls { display: grid; grid-template-columns: minmax(180px, 1fr) 140px auto; gap: 12px; align-items: end; margin-bottom: 1.5rem; }
        .field.compact { margin-bottom: 0; }
        .field select { width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--border2); border-radius: 8px; color: var(--text); font-size: 14px; outline: none; }
        .field select:focus { border-color: var(--accent); }
        .calc-btn { min-height: 41px; padding: 0 18px; background: var(--accent); color: white; border: 1px solid var(--accent); border-radius: 8px; font-weight: 700; cursor: pointer; }
        .calc-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .calculator-results { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .income-card { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
        .income-card span { display: block; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .income-card strong { font-family: var(--font); font-size: 22px; }
        .income-card.profit strong { color: var(--profit); }
        .income-card.loss strong { color: var(--loss); }

        /* SPLASH */
        .splash { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
        .splash-logo { font-family: var(--font); font-size: 20px; letter-spacing: 0.3em; color: var(--accent); animation: pulse 1.5s ease infinite; }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }

        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: repeat(2, 1fr); }
          .trade-pair { grid-template-columns: 1fr 1fr; }
          .pair-pl { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; }
          .main-content { padding: 1rem; }
          .dashboard-toolbar { align-items: flex-start; flex-direction: column; }
          .tabs { padding: 0 1rem; }
          .tab-buttons { width: 100%; }
          .tab { white-space: nowrap; }
          .calculator-controls, .calculator-results { grid-template-columns: 1fr; }
        }
          /* MULTI UPLOAD */
.upload-outer { margin-bottom: 1.5rem; }
.upload-progress-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.upload-progress-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600; }
.upload-progress-title { color: var(--text); }
.upload-file-list { padding: 8px 0; }
.upload-file-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; transition: background 0.15s; }
.upload-file-item.uploading { background: rgba(59,130,246,0.05); }
.upload-file-item.success { background: rgba(16,185,129,0.05); }
.upload-file-item.error { background: rgba(239,68,68,0.05); }
.upload-file-icon { width: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.file-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); display: block; }
.pending-dot { background: var(--muted); }
.spinner-sm { width: 16px; height: 16px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
.file-check { color: var(--profit); font-size: 15px; font-weight: 700; }
.file-x { color: var(--loss); font-size: 15px; font-weight: 700; }
.upload-file-info { flex: 1; min-width: 0; }
.upload-file-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.upload-file-msg { font-size: 11px; color: var(--muted); margin-top: 2px; }
.upload-file-item.success .upload-file-msg { color: var(--profit); }
.upload-file-item.error .upload-file-msg { color: var(--loss); }
.upload-retry-note { padding: 10px 16px; font-size: 12px; color: var(--orange); border-top: 1px solid var(--border); background: var(--orange-bg); }
      `}</style>

      <div className="site-shell tracker-shell">
        <PublicNavbar />
        <div className="app-layout">
          <nav className="tabs">
            <div className="tab-buttons">
              {['dashboard', 'calendar', 'calculator', ...(isAdmin ? ['admin'] : [])].map(t => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t === 'admin' ? 'Admin' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </nav>

          <main className="main-content">
          {tab === 'dashboard' && (
            <>
              <UploadZone token={token} onSuccess={fetchData} />
              <SummaryCards summary={summary} />
              <div className="dashboard-toolbar">
                <div className="section-title">{showRemainingOnly ? 'Remaining Trades' : 'Trade Pairs — Grouped by Symbol'}</div>
                <label className="toggle-control">
                  <input type="checkbox" checked={showRemainingOnly} onChange={e => setShowRemainingOnly(e.target.checked)} />
                  <span className="toggle-track" />
                  <span>Show only remaining trades</span>
                </label>
              </div>
              <TradePairs trades={visibleTrades} />
            </>
          )}
          {tab === 'calendar' && <CalendarView token={token} />}
          {tab === 'calculator' && <MonthlyIncomeCalculator token={token} />}
          {tab === 'admin' && isAdmin && <AdminPanel token={token} />}
          </main>
        </div>
      </div>
    </>
  )
}
