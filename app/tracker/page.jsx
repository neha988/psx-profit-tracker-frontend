'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminPanel from '../admin'
import { MarketingStyles, PublicNavbar } from '../marketing'
import { TradeModal } from '../components/TradeModal'

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
const getMarket = (t) => t?.settlement_type === 'Futures' ? 'Futures' : 'Ready'

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
  const [uploads, setUploads] = useState([]) // [{name, status, message, file, conflict}]
  const [running, setRunning] = useState(false)
  const inputId = 'pdfInput'

  const uploadFile = async (file, index, updateItem, force = false) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      updateItem(index, 'error', 'Not a PDF file')
      return
    }
    updateItem(index, 'uploading', 'Reading statement...')
    const form = new FormData()
    form.append('file', file)
    try {
      const url = force ? `${API}/api/upload-pdf?force=true` : `${API}/api/upload-pdf`
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      const data = await res.json()
      if (!res.ok) {
        // Check if it's a conflict error (already uploaded)
        if (res.status === 409 && data.detail && data.detail.includes('already exists')) {
          updateItem(index, 'conflict', data.detail)
        } else {
          updateItem(index, 'error', data.detail || `Failed (${res.status})`)
        }
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

    const initial = fileArr.map(f => ({ name: f.name, status: 'pending', message: 'Waiting...', file: f, conflict: false }))
    setUploads(initial)
    setRunning(true)

    const updateItem = (i, status, message) => {
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status, message } : u))
    }

    // Upload one by one sequentially
    for (let i = 0; i < fileArr.length; i++) {
      await uploadFile(fileArr[i], i, updateItem, false)
    }

    setRunning(false)
    onSuccess() // refresh data after all uploads
  }

  const handleForceRetry = async (index) => {
    const file = uploads[index].file
    const updateItem = (i, status, message) => {
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status, message, conflict: false } : u))
    }
    await uploadFile(file, index, updateItem, true)
    onSuccess() // refresh data
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const reset = () => setUploads([])

  const allDone = uploads.length > 0 && !running
  const hasError = uploads.some(u => u.status === 'error')
  const hasConflict = uploads.some(u => u.status === 'conflict')

  return (
    <div className="upload-outer">
      {uploads.length === 0 ? (
        <div
          className={`upload-zone ${dragging ? 'drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById(inputId).click()}
        >
          <input
            id={inputId}
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
            <p className="upload-label">Upload PDF</p>
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
                  {u.status === 'conflict'  && <span className="file-warn">⚠</span>}
                </div>
                <div className="upload-file-info">
                  <div className="upload-file-name">{u.name}</div>
                  <div className="upload-file-msg">{u.message}</div>
                  {u.status === 'conflict' && (
                    <button 
                      className="btn-force-retry"
                      onClick={() => handleForceRetry(i)}
                    >
                      Force Re-import
                    </button>
                  )}
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
const normalizeTradeDate = (dateValue) => String(dateValue || '').slice(0, 10)

const isDateInRange = (dateValue, startDate, endDate) => {
  const date = normalizeTradeDate(dateValue)
  if (!date) return false
  if (startDate && endDate) {
    const from = startDate <= endDate ? startDate : endDate
    const to = startDate <= endDate ? endDate : startDate
    return date >= from && date <= to
  }
  if (startDate) return date === startDate
  if (endDate) return date === endDate
  return true
}

const getPairSummaries = (trades = []) => {
  const byPair = {}
  trades
    .filter(t => t?.pair_id && t?.matched !== false && t?.net_pl !== null && t?.net_pl !== undefined)
    .forEach(t => {
      if (!byPair[t.pair_id]) {
        byPair[t.pair_id] = {
          pair_id: t.pair_id,
          broker: t.broker || 'Unknown',
          date: normalizeTradeDate(t.trade_date),
          tradeDates: [],
          pl: Number(t.net_pl) || 0,
          charges: 0,
        }
      }
      byPair[t.pair_id].charges += Number(t.total_charges) || 0
      const tradeDate = normalizeTradeDate(t.trade_date)
      if (tradeDate && !byPair[t.pair_id].tradeDates.includes(tradeDate)) {
        byPair[t.pair_id].tradeDates.push(tradeDate)
      }
      if (tradeDate > (byPair[t.pair_id].date || '')) {
        byPair[t.pair_id].date = tradeDate
      }
    })
  return Object.values(byPair)
}

const makePeriodBreakdown = (label, pairs, predicate) => {
  const rows = pairs.filter(predicate)
  return {
    label,
    total: rows.reduce((sum, t) => sum + t.pl, 0),
  }
}

const makeBrokerRowsForDate = (brokers, pairs, startDate, endDate) => {
  if (!startDate && !endDate) return brokers || []
  const knownBrokers = brokers?.length
    ? brokers.map(b => b.broker || 'Unknown')
    : Array.from(new Set(pairs.map(t => t.broker || 'Unknown'))).sort()
  return knownBrokers.map(broker => {
    const rows = pairs.filter(t => {
      const dates = t.tradeDates?.length ? t.tradeDates : [t.date]
      return (t.broker || 'Unknown') === broker && dates.some(date => isDateInRange(date, startDate, endDate))
    })
    const trades = rows.length
    const wins = rows.filter(t => t.pl > 0).length
    return {
      broker,
      pl: rows.reduce((sum, t) => sum + t.pl, 0),
      trades,
      win_rate: trades ? Math.round((wins / trades) * 1000) / 10 : 0,
      charges: rows.reduce((sum, t) => sum + t.charges, 0),
    }
  })
}

function PeriodPnlCard({ item }) {
  const tone = isProfit(item.total) ? 'profit' : isLoss(item.total) ? 'loss' : ''
  return (
    <div className={`period-card ${tone}`}>
      <div className="period-card-head">
        <div className="card-label">{item.label}</div>
        <div className={`period-total ${isProfit(item.total) ? 'profit-text' : isLoss(item.total) ? 'loss-text' : ''}`}>
          {fmtPL(item.total)}
        </div>
      </div>
    </div>
  )
}

function OverallTotalsCard({ overall }) {
  const tone = isProfit(overall.profit) ? 'profit' : isLoss(overall.profit) ? 'loss' : ''
  return (
    <div className={`overall-totals-card ${tone}`}>
      <div className="period-line">
        <span>Overall Profit</span>
        <strong className={isProfit(overall.profit) ? 'profit-text' : isLoss(overall.profit) ? 'loss-text' : ''}>{fmtPL(overall.profit)}</strong>
      </div>
      <div className="period-line">
        <span>Overall Charges</span>
        <strong>Rs. {fmt(overall.charges)}</strong>
      </div>
      <div className="period-line">
        <span>Closed Trades Charges</span>
        <strong>Rs. {fmt(overall.closedTradesCharges)}</strong>
      </div>
      <div className="period-line">
        <span>Closed Trades</span>
        <strong>{overall.closedTrades}</strong>
      </div>
      <div className="period-line">
        <span>Open Trades</span>
        <strong>{overall.openTrades}</strong>
      </div>
    </div>
  )
}

function SummaryCards({ summary, trades = [], dateStart = '', dateEnd = '' }) {
  if (!summary) return null
  const pairs = getPairSummaries(trades)
  const brokerRows = makeBrokerRowsForDate(summary.brokers || [], pairs, dateStart, dateEnd)
  const latestDate = pairs.reduce((latest, t) => !latest || (t.date || '') > latest ? t.date : latest, '')
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`
  const weekStart = new Date(today)
  const dayOfWeek = today.getDay() || 7
  weekStart.setDate(today.getDate() - dayOfWeek + 1)
  const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
  const monthStartStr = `${yyyy}-${mm}-01`
  const periodCards = [
    makePeriodBreakdown(latestDate ? `Last P&L (${fmtDate(latestDate)})` : 'Last P&L', pairs, t => t.date === latestDate),
    makePeriodBreakdown('This Week P&L', pairs, t => (t.date || '') >= weekStartStr && (t.date || '') <= todayStr),
    makePeriodBreakdown('This Month P&L', pairs, t => (t.date || '') >= monthStartStr && (t.date || '') <= todayStr),
  ]
  const overall = {
    profit: pairs.reduce((sum, t) => sum + t.pl, 0),
    charges: Number(summary.total_charges) || pairs.reduce((sum, t) => sum + t.charges, 0),
    closedTrades: summary.total_trades || 0,
    closedTradesCharges: trades.filter(t => t.pair_id).reduce((sum, t) => sum + (t.total_charges || 0), 0),
    openTrades: trades.filter(t => !t.pair_id || t.matched === false).length,
  }
  return (
    <>
      <div className="period-grid">
        {periodCards.map(c => <PeriodPnlCard key={c.label} item={c} />)}
        <OverallTotalsCard overall={overall} />
      </div>
      {brokerRows.length > 0 && (
        <div className="broker-breakdown">
          {brokerRows.map(b => (
            <div key={b.broker} className="broker-card">
              <div className="broker-card-head">
                <div>
                  <div className="broker-kicker">Broker</div>
                  <div className="broker-name">{b.broker}</div>
                </div>
                <div className={`broker-pl ${isProfit(b.pl) ? 'profit-text' : isLoss(b.pl) ? 'loss-text' : ''}`}>{fmtPL(b.pl)}</div>
              </div>
              <div className="broker-stats">
                <div>
                  <span>Trades</span>
                  <strong>{b.trades}</strong>
                </div>
                <div>
                  <span>Win Rate</span>
                  <strong>{b.win_rate}%</strong>
                </div>
                <div>
                  <span>Charges</span>
                  <strong>Rs. {fmt(b.charges)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
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
        <span className="leg-rate">
          @ Rs. {fmt(t.rate)}
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
const firstTradeDate = (trade) => {
  const dates = trade?.trade_dates || trade?.trade_date
  if (Array.isArray(dates)) return dates[0] || ''
  return dates || ''
}

const getPairDirection = (buy, sell) => {
  const buyDate = firstTradeDate(buy)
  const sellDate = firstTradeDate(sell)
  if (sellDate && (!buyDate || sellDate < buyDate)) return 'SHORT'
  return 'LONG'
}

function TradePairs({ trades, expandedPairs = {}, onTogglePair = () => {} }) {
  if (!trades || trades.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <p>No trades yet. Upload your first transaction statement above.</p>
    </div>
  )

  // Group by symbolffgigi
  const bySymbol = {}
  trades.forEach(t => {
    const key = `${t.broker || 'Unknown'}|${t.symbol}`
    if (!bySymbol[key]) bySymbol[key] = []
    bySymbol[key].push(t)
  })

  const symbolGroups = Object.entries(bySymbol).map(([key, trades]) => {
    const [broker, symbol] = key.split('|')
    const company = trades[0].company_name && trades[0].company_name !== symbol ? trades[0].company_name : ''
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
        pair_id,
        BUY: sides.BUY.length > 0 ? aggregateSide(sides.BUY) : null,
        SELL: sides.SELL.length > 0 ? aggregateSide(sides.SELL) : null,
        net_pl: trades.find(t => t.pair_id === pair_id)?.net_pl || 0,
        // Store individual trades for expanded view
        BUY_individual: sides.BUY,
        SELL_individual: sides.SELL,
      }
    })
    
    return { symbol, broker, company, pairs: aggregatedPairs, unmatched }
  })

  return (
    <div className="trade-groups">
      {symbolGroups.map(({ symbol, broker, company, pairs, unmatched }) => (
        <div key={`${broker}-${symbol}`} className="symbol-group">
          <div className="symbol-header">
            <div>
              <span className="symbol-ticker">{symbol}</span>
              <span className="symbol-company">{company}</span>
            </div>
            <span className="broker-pill">{broker}</span>
          </div>

          {/* ── Unmatched (remaining) - SHOW FIRST ── */}
          {unmatched.map((t, i) => (
            <div key={i} className={`trade-pair unmatched ${t.settlement_type === 'Futures' ? 'futures-contract' : t.trade_type === 'SELL' ? 'short-sell' : 'pending-buy'}`}>
              <TradeLeg t={t} side={t.trade_type} />
              <div className="pending-tag">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span>
                    {t.settlement_type === 'Futures'
                      ? `📊 Futures Contract (${t.settlement_type})`
                      : t.trade_type === 'SELL'
                      ? '⏳ Awaiting BUY to match'
                      : '⏳ Awaiting SELL to match'}
                    {t.aggregated && t.aggregated_count > 1 && (
                      <span className="agg-tag"> · {t.aggregated_count} entries combined</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="ledger-action-btn edit"
                    onClick={() => onEdit(t)}
                    title="Edit trade"
                    style={{ fontSize: '14px' }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="ledger-action-btn delete"
                    onClick={() => onDelete(t.id)}
                    title="Delete trade"
                    style={{ fontSize: '14px' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* ── Matched pairs (closed) - SHOW AFTER ── */}
          {pairs.map((pair, i) => {
            const sell = pair.SELL
            const buy  = pair.BUY
            const pl   = pair.net_pl || 0
            const direction = getPairDirection(buy, sell)
            const pairId = pair.pair_id
            const isExpanded = expandedPairs[pairId]
            
            if (isExpanded) {
              // Expanded view: Show individual legs
              return (
                <div key={pairId} className={`trade-pair ${direction === 'SHORT' ? 'short-pair' : 'long-pair'} expanded-view`}>
                  <div className="pair-header-expanded">
                    <div className="pair-direction">
                      <span>{direction}</span>
                    </div>
                    <button 
                      className="toggle-details-btn expanded"
                      onClick={() => onTogglePair(pairId)}
                      title="Collapse to merged view"
                    >
                      ↑ Hide details
                    </button>
                    <div className={`pair-pl ${isProfit(pl) ? 'profit-pl' : isLoss(pl) ? 'loss-pl' : ''}`}>
                      <span className="pl-label">Net P&L</span>
                      <span className="pl-value">{fmtPL(pl)}</span>
                    </div>
                  </div>
                  
                  {/* Individual BUY legs */}
                  <div className="legs-section">
                    <div className="legs-label">BUY Legs</div>
                    {pair.BUY_individual && pair.BUY_individual.map((buyLeg, idx) => (
                      <TradeLeg key={`buy-${idx}`} t={buyLeg} side="BUY" />
                    ))}
                  </div>
                  
                  {/* Individual SELL legs */}
                  <div className="legs-section">
                    <div className="legs-label">SELL Legs</div>
                    {pair.SELL_individual && pair.SELL_individual.map((sellLeg, idx) => (
                      <TradeLeg key={`sell-${idx}`} t={sellLeg} side="SELL" />
                    ))}
                  </div>
                  
                  {/* Charges summary */}
                  <div className="charges-column">
                    <div className="charges-header">Charges</div>
                    <div className="charges-content">
                      <div className="charge-item buy-charge">
                        <span className="charge-label">Buy:</span>
                        <span className="charge-value">Rs. {fmt(buy?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-item sell-charge">
                        <span className="charge-label">Sell:</span>
                        <span className="charge-value">Rs. {fmt(sell?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-item total-charge">
                        <span className="charge-label">Total:</span>
                        <span className="charge-value">Rs. {fmt((buy?.total_charges || 0) + (sell?.total_charges || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            } else {
              // Merged/collapsed view (default)
              return (
                <div key={pairId} className={`trade-pair ${direction === 'SHORT' ? 'short-pair' : 'long-pair'}`}>
                  <div className="pair-direction">
                    <span>{direction}</span>
                  </div>
                  {sell && <TradeLeg t={sell} side="SELL" />}
                  {buy  && <TradeLeg t={buy}  side="BUY"  />}
                  <div className="charges-column">
                    <div className="charges-header">Charges</div>
                    <div className="charges-content">
                      <div className="charge-item buy-charge">
                        <span className="charge-label">Buy:</span>
                        <span className="charge-value">Rs. {fmt(buy?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-item sell-charge">
                        <span className="charge-label">Sell:</span>
                        <span className="charge-value">Rs. {fmt(sell?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-item total-charge">
                        <span className="charge-label">Total:</span>
                        <span className="charge-value">Rs. {fmt((buy?.total_charges || 0) + (sell?.total_charges || 0))}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`pair-pl ${isProfit(pl) ? 'profit-pl' : isLoss(pl) ? 'loss-pl' : ''}`}>
                    <button 
                      className="toggle-details-btn"
                      onClick={() => onTogglePair(pairId)}
                      title="Expand to show individual trade legs"
                    >
                      ↓ Show details
                    </button>
                    <span className="pl-label">Net P&L</span>
                    <span className="pl-value">{fmtPL(pl)}</span>
                  </div>
                </div>
              )
            }
          })}
        </div>
      ))}
    </div>
  )
}

// ─── CALENDAR ────────────────────────────────
function TradeLedger({ trades, expandedPairs = {}, onTogglePair = () => {}, onEdit = () => {}, onDelete = () => {} }) {
  if (!trades || trades.length === 0) return (
    <div className="empty-state compact">
      <p>No trades match these filters.</p>
    </div>
  )

  const byPair = {}
  const rows = []

  trades.forEach(t => {
    if (t.pair_id) {
      if (!byPair[t.pair_id]) byPair[t.pair_id] = []
      byPair[t.pair_id].push(t)
    } else {
      rows.push({
        id: t.id,
        date: t.trade_date,
        broker: t.broker || 'Unknown',
        symbol: t.symbol,
        market: getMarket(t),
        buy: t.trade_type === 'BUY' ? t : null,
        sell: t.trade_type === 'SELL' ? t : null,
        pl: null,
        status: t.trade_type === 'BUY' ? 'Awaiting SELL' : 'Awaiting BUY',
        open: true,
      })
    }
  })

  Object.entries(byPair).forEach(([pairId, pairTrades]) => {
    const buys = pairTrades.filter(t => t.trade_type === 'BUY')
    const sells = pairTrades.filter(t => t.trade_type === 'SELL')
    const aggregate = (items) => {
      if (!items.length) return null
      const qty = items.reduce((sum, t) => sum + (t.quantity || 0), 0)
      const gross = items.reduce((sum, t) => sum + (t.gross_amount || 0), 0)
      const charges = items.reduce((sum, t) => sum + (t.total_charges || 0), 0)
      const first = items[0]
      // Create clean object to avoid inheriting malformed fields
      return {
        id: first.id,  // Single trade id for editing
        symbol: first.symbol,
        company_name: first.company_name,
        trade_type: first.trade_type,
        trade_date: first.trade_date,
        quantity: qty,
        rate: qty ? gross / qty : first.rate,
        gross_amount: gross,
        total_charges: charges,
        commission: first.commission,
        broker: first.broker,
        settlement_type: first.settlement_type,
        is_futures: first.is_futures,
        is_short_sell: first.is_short_sell,
        matched: first.matched,
        pair_id: first.pair_id,
        gross_pl: first.gross_pl,
        net_pl: first.net_pl,
        trade_dates: [...new Set(items.map(t => t.trade_date))].sort(),
      }
    }
    const first = pairTrades[0]
    rows.push({
      id: pairId,
      pairId: pairId,
      date: first.trade_date,
      broker: first.broker || 'Unknown',
      symbol: first.symbol,
      market: getMarket(first),
      buy: aggregate(buys),
      sell: aggregate(sells),
      pl: first.net_pl || 0,
      status: 'Closed',
      open: false,
      // Store individual trades for expanded view
      buys_individual: buys,
      sells_individual: sells,
    })
  })

  rows.forEach(row => {
    row.direction = row.open ? '-' : getPairDirection(row.buy, row.sell)
  })

  // Sort: Unmatched first (remaining) → Closed trades → by date (newer first)
  rows.sort((a, b) => {
    // Open trades (unmatched) come FIRST
    if (a.open && !b.open) return -1
    if (!a.open && b.open) return 1
    
    // Within same status, sort by date (newer first)
    return (b.date || '').localeCompare(a.date || '') || a.symbol.localeCompare(b.symbol)
  })

  const sideCell = (trade, side) => {
    if (!trade) return <span className="ledger-muted">-</span>
    const dateLabel = fmtDate(trade.trade_dates || trade.trade_date)
    return (
      <div className="ledger-side">
        <span className={`ledger-side-badge ${side.toLowerCase()}`}>{side}</span>
        <div className="ledger-side-main">
          <strong>{trade.quantity?.toLocaleString()}</strong>
          <span>@ Rs. {fmt(trade.rate)}</span>
        </div>
        {dateLabel && <span className="ledger-side-date">{dateLabel}</span>}
      </div>
    )
  }

  const amountCell = (row) => {
    if (row.open) {
      const trade = row.buy || row.sell
      const side = row.buy ? 'BUY' : 'SELL'
      return (
        <div className="ledger-amount single">
          <span className={side.toLowerCase()}>Rs. {fmt(trade?.gross_amount || 0)}</span>
        </div>
      )
    }

    return (
      <div className="ledger-amount">
        <div>
          <span className="ledger-amount-label buy">BUY</span>
          <strong className="buy">Rs. {fmt(row.buy?.gross_amount || 0)}</strong>
        </div>
        <div>
          <span className="ledger-amount-label sell">SELL</span>
          <strong className="sell">Rs. {fmt(row.sell?.gross_amount || 0)}</strong>
        </div>
      </div>
    )
  }

  return (
    <div className="ledger-wrap">
      <table className="trade-ledger">
        <thead>
          <tr>
            <th>Date</th>
            <th>Broker</th>
            <th>Symbol</th>
            <th>Market</th>
            <th>Type</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Charges</th>
            <th>Amount</th>
            <th>P&L</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const charges = (row.buy?.total_charges || 0) + (row.sell?.total_charges || 0)
            return [
              <tr key={row.id} className={row.open ? 'open-row' : ''}>
                <td>{row.open ? fmtDate(row.date) : (
                  <span className="ledger-muted">See BUY/SELL</span>
                )}</td>
                <td><span className="broker-pill ledger-broker">{row.broker}</span></td>
                <td className="ledger-symbol">{row.symbol}</td>
                <td>{row.market}</td>
                <td>
                  {row.open ? (
                    <span className="ledger-muted">-</span>
                  ) : (
                    <span className={`direction-pill ${row.direction === 'SHORT' ? 'short' : 'long'}`}>{row.direction}</span>
                  )}
                </td>
                <td>{sideCell(row.buy, 'BUY')}</td>
                <td>{sideCell(row.sell, 'SELL')}</td>
                <td>
                  {row.open ? (
                    <span>Rs. {fmt(charges)}</span>
                  ) : (
                    <div className="ledger-charges-breakdown">
                      <div className="charge-line buy-charge-line">
                        <span className="charge-label">BUY</span>
                        <span className="charge-amount">Rs. {fmt(row.buy?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-line sell-charge-line">
                        <span className="charge-label">SELL</span>
                        <span className="charge-amount">Rs. {fmt(row.sell?.total_charges || 0)}</span>
                      </div>
                      <div className="charge-line total-charge-line">
                        <span className="charge-label">Total</span>
                        <span className="charge-amount">Rs. {fmt(charges)}</span>
                      </div>
                    </div>
                  )}
                </td>
                <td>{amountCell(row)}</td>
                <td className={row.pl === null ? 'ledger-muted' : isProfit(row.pl) ? 'profit-text' : isLoss(row.pl) ? 'loss-text' : ''}>
                  {row.pl === null ? '-' : fmtPL(row.pl)}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                    <span className={`status-pill ${row.open ? 'open' : 'closed'}`}>{row.status}</span>
                    {!row.open && (
                      <button 
                        className="ledger-details-btn"
                        onClick={() => onTogglePair(row.pairId)}
                        title={expandedPairs[row.pairId] ? 'Hide details' : 'Show details'}
                      >
                        {expandedPairs[row.pairId] ? '↑' : '↓'}
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      className="ledger-action-btn edit"
                      onClick={() => onEdit(row.buy || row.sell)}
                      title="Edit trade"
                    >
                      ✏️
                    </button>
                    <button 
                      className="ledger-action-btn delete"
                      onClick={() => onDelete((row.buy || row.sell)?.id)}
                      title="Delete trade"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>,
              !row.open && expandedPairs[row.pairId] ? (
                <tr key={`${row.id}-expanded`} className="expanded-ledger-row">
                  <td colSpan="11">
                    <div className="expanded-trades-detail">
                      <div className="expanded-section">
                        <div className="expanded-section-title">BUY Legs</div>
                        {row.buys_individual && row.buys_individual.map((t, idx) => (
                          <div key={idx} className="expanded-trade-item">
                            <div className="item-row"><span className="item-label">Date:</span> <span>{fmtDate(t.trade_date)}</span></div>
                            <div className="item-row"><span className="item-label">Qty:</span> <span>{t.quantity?.toLocaleString()}</span></div>
                            <div className="item-row"><span className="item-label">Rate:</span> <span>Rs. {fmt(t.rate)}</span></div>
                            <div className="item-row"><span className="item-label">Charges:</span> <span>Rs. {fmt(t.total_charges)}</span></div>
                            <div className="item-row"><span className="item-label">Amount:</span> <span className="profit">Rs. {fmt(t.gross_amount)}</span></div>
                            <div className="item-row" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <button 
                                className="ledger-action-btn edit"
                                onClick={() => onEdit(t)}
                                title="Edit trade"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                ✏️
                              </button>
                              <button 
                                className="ledger-action-btn delete"
                                onClick={() => onDelete(t.id)}
                                title="Delete trade"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="expanded-section">
                        <div className="expanded-section-title">SELL Legs</div>
                        {row.sells_individual && row.sells_individual.map((t, idx) => (
                          <div key={idx} className="expanded-trade-item">
                            <div className="item-row"><span className="item-label">Date:</span> <span>{fmtDate(t.trade_date)}</span></div>
                            <div className="item-row"><span className="item-label">Qty:</span> <span>{t.quantity?.toLocaleString()}</span></div>
                            <div className="item-row"><span className="item-label">Rate:</span> <span>Rs. {fmt(t.rate)}</span></div>
                            <div className="item-row"><span className="item-label">Charges:</span> <span>Rs. {fmt(t.total_charges)}</span></div>
                            <div className="item-row"><span className="item-label">Amount:</span> <span className="loss">Rs. {fmt(t.gross_amount)}</span></div>
                            <div className="item-row" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <button 
                                className="ledger-action-btn edit"
                                onClick={() => onEdit(t)}
                                title="Edit trade"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                ✏️
                              </button>
                              <button 
                                className="ledger-action-btn delete"
                                onClick={() => onDelete(t.id)}
                                title="Delete trade"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

function CalendarView({ token, expandedPairs = {}, onTogglePair = () => {} }) {
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
          <TradePairs trades={dayTrades} expandedPairs={expandedPairs} onTogglePair={onTogglePair} />
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
  const [brokerFilter, setBrokerFilter] = useState('All')
  const [marketFilter, setMarketFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [expandedPairs, setExpandedPairs] = useState({})
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [tradeModalMode, setTradeModalMode] = useState('add') // 'add' or 'edit'
  const [selectedTrade, setSelectedTrade] = useState(null)
  const isAdmin = isAdminUser(session?.user)

  const togglePairExpanded = (pairId) => {
    setExpandedPairs(prev => ({
      ...prev,
      [pairId]: !prev[pairId]
    }))
  }

  const openAddTradeModal = () => {
    setTradeModalMode('add')
    setSelectedTrade(null)
    setTradeModalOpen(true)
  }

  const openEditTradeModal = (trade) => {
    setTradeModalMode('edit')
    setSelectedTrade(trade)
    setTradeModalOpen(true)
  }

  const handleDeleteTrade = async (tradeId) => {
    // Validate trade ID - should be a single UUID, not comma-separated
    if (!tradeId || typeof tradeId !== 'string' || tradeId.includes(',')) {
      alert('✗ Cannot delete paired trades from summary view.\n\nExpand the pair (↓) to see individual trade legs, then delete from there.')
      return
    }

    if (!window.confirm('Are you sure you want to delete this trade?')) return

    try {
      const res = await fetch(`${API}/api/trades/${tradeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Delete failed')
      
      // Refresh trades
      fetchData()
      alert('✓ Trade deleted successfully')
    } catch (err) {
      alert(`✗ Error: ${err.message}`)
    }
  }

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
  const brokerOptions = ['All', ...Array.from(new Set(trades.map(t => t.broker || 'Unknown'))).sort()]
  const visibleTrades = trades.filter(t => {
    const brokerOk = brokerFilter === 'All' || (t.broker || 'Unknown') === brokerFilter
    const marketOk = marketFilter === 'All' || getMarket(t) === marketFilter
    const statusOk =
      statusFilter === 'All' ||
      (statusFilter === 'Open' && (!t.pair_id || t.matched === false)) ||
      (statusFilter === 'Closed' && t.pair_id && t.matched !== false)
    const dateOk = isDateInRange(t.trade_date, dateStart, dateEnd)
    return brokerOk && marketOk && statusOk && dateOk
  })

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

        html, body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; overflow-x: hidden; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0; height: 0; }
        html { scrollbar-width: none; -ms-overflow-style: none; }
        body { scrollbar-width: none; -ms-overflow-style: none; }

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
        .tab-buttons::-webkit-scrollbar { display: none; }
        .tab-buttons { -ms-overflow-style: none; scrollbar-width: none; }
        .tab { padding: 12px 20px; font-size: 13px; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
        .tab.active { color: var(--text); border-bottom-color: var(--accent); }
        .tab:hover { color: var(--text); }

        .main-content { flex: 1; padding: 1.25rem; max-width: 1320px; margin: 0 auto; width: 100%; }
        .dashboard-overview { background: linear-gradient(180deg, rgba(26,34,53,0.9), rgba(17,24,39,0.96)); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 14px; box-shadow: 0 18px 44px rgba(0,0,0,0.16); }
        .dashboard-topbar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(290px, 360px); align-items: stretch; gap: 18px; margin-bottom: 16px; }
        .dashboard-heading { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .dashboard-kicker { color: var(--accent); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .dashboard-title { font-size: clamp(28px, 3vw, 38px); line-height: 1.05; margin: 0; letter-spacing: 0; }
        .dashboard-subtitle { color: #A9B8CF; font-size: 14px; line-height: 1.55; max-width: 680px; margin-top: 10px; }
        .dashboard-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
        .dashboard-chips span { min-height: 30px; display: inline-flex; align-items: center; padding: 0 11px; border: 1px solid var(--border2); border-radius: 999px; background: rgba(10,14,26,0.42); color: var(--muted); font-size: 12px; font-weight: 700; }
        .dashboard-action-panel { display: flex; flex-direction: column; gap: 10px; justify-content: space-between; background: rgba(10,14,26,0.46); border: 1px solid var(--border2); border-radius: 8px; padding: 13px; min-width: 0; }
        .action-panel-copy { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        .action-panel-copy span { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; }
        .action-panel-copy strong { color: var(--text); font-size: 13px; white-space: nowrap; }
        .dashboard-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem; }
        .ledger-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0.75rem 0; }
        .filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .filter-row select, .filter-row input { height: 34px; min-width: 128px; background: var(--surface); color: var(--text); border: 1px solid var(--border2); border-radius: 7px; padding: 0 10px; font-size: 12px; outline: none; }
        .filter-row input[type="date"] { min-width: 150px; color-scheme: dark; }
        .filter-row select:focus, .filter-row input:focus { border-color: var(--accent); }
        .filter-clear { height: 34px; padding: 0 11px; border-radius: 7px; border: 1px solid var(--border2); background: rgba(10,14,26,0.38); color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer; }
        .filter-clear:hover { color: var(--text); border-color: var(--accent); }
        .toggle-control { display: inline-flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; cursor: pointer; user-select: none; }
        .toggle-control input { position: absolute; opacity: 0; pointer-events: none; }
        .toggle-track { width: 48px; height: 26px; border-radius: 999px; border: 1px solid var(--border2); background: var(--surface); position: relative; transition: all 0.2s; }
        .toggle-track::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; left: 3px; top: 3px; background: var(--muted); transition: all 0.2s; }
        .toggle-control input:checked + .toggle-track { background: rgba(59,130,246,0.22); border-color: var(--accent); }
        .toggle-control input:checked + .toggle-track::after { transform: translateX(22px); background: var(--accent); }

        /* UPLOAD */
        .dashboard-action-panel .upload-outer { margin: 0; width: 100%; }
        .dashboard-action-panel .upload-zone { margin: 0; min-height: 68px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .dashboard-action-panel .upload-state { width: 100%; min-width: 0; flex-direction: column; gap: 4px; }
        .dashboard-action-panel .upload-sub { max-width: 100%; white-space: normal; line-height: 1.35; }
        .upload-zone { border: 1px dashed var(--border2); border-radius: 8px; padding: 10px 14px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 1rem; background: var(--surface); }
        .upload-zone:hover, .upload-zone.drag { border-color: var(--accent); background: rgba(59,130,246,0.05); }
        .upload-zone.uploading { cursor: default; border-color: var(--accent); }
        .upload-state { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
        .upload-icon { display: none; }
        .upload-label { font-size: 13px; font-weight: 700; white-space: nowrap; }
        .upload-sub { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .spinner { width: 28px; height: 28px; border: 2px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .check-icon { width: 40px; height: 40px; background: var(--profit-bg); border: 2px solid var(--profit); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--profit); font-size: 18px; }
        .x-icon { width: 40px; height: 40px; background: var(--loss-bg); border: 2px solid var(--loss); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--loss); font-size: 18px; }
        .upload-state.success p { color: var(--profit); }
        .upload-state.error p { color: var(--loss); }
        .retry { font-size: 12px; color: var(--muted); }

        /* SUMMARY CARDS */
        .period-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .period-card { background: linear-gradient(180deg, rgba(26,34,53,0.86), rgba(17,24,39,0.96)); border: 1px solid var(--border); border-radius: 8px; padding: 14px; min-width: 0; }
        .period-card.profit { border-color: rgba(16,185,129,0.34); }
        .period-card.loss { border-color: rgba(239,68,68,0.34); }
        .period-card-head { display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 10px; min-height: 74px; }
        .period-total { font-family: var(--font); font-size: 18px; font-weight: 800; line-height: 1.2; text-align: right; white-space: nowrap; }
        .period-lines { display: grid; gap: 8px; padding: 11px 0; }
        .period-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--muted); min-width: 0; }
        .period-line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .period-line strong { font-family: var(--font); font-size: 13px; color: var(--text); white-space: nowrap; }
        .period-empty { color: var(--muted); font-size: 12px; padding: 2px 0; }
        .period-total-row { padding-top: 10px; border-top: 1px solid var(--border); color: var(--text); font-weight: 700; }
        .overall-totals-card { display: grid; align-content: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; min-width: 0; }
        .overall-totals-card.profit { border-color: rgba(16,185,129,0.28); }
        .overall-totals-card.loss { border-color: rgba(239,68,68,0.28); }
        .cards-grid { display: grid; grid-template-columns: repeat(3, minmax(145px, 1fr)); gap: 10px; margin-bottom: 1rem; }
        .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; min-height: 74px; }
        .summary-card.profit { border-color: var(--buy-border); background: var(--buy-bg); }
        .summary-card.loss { border-color: var(--sell-border); background: var(--sell-bg); }
        .card-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .card-value { font-size: 16px; font-weight: 600; font-family: var(--font); line-height: 1.25; }
        .card-sub { font-size: 12px; margin-top: 3px; font-family: var(--font); }
        .profit-text { color: var(--profit) !important; }
        .loss-text { color: var(--loss) !important; }
        .broker-breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: 10px; margin: -0.25rem 0 1rem; }
        .broker-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 13px; }
        .broker-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .broker-kicker { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .broker-name { font-size: 14px; font-weight: 800; color: var(--text); line-height: 1.25; }
        .broker-pl { font-family: var(--font); font-size: 17px; font-weight: 800; line-height: 1.2; text-align: right; white-space: nowrap; }
        .broker-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .broker-stats div { min-width: 0; border: 1px solid var(--border); border-radius: 7px; padding: 9px 10px; background: var(--bg); }
        .broker-stats span { display: block; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
        .broker-stats strong { display: block; font-family: var(--font); font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* TRADES */
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 0; }
        .trade-groups { display: flex; flex-direction: column; gap: 10px; }
        .symbol-group { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .symbol-header { min-height: 38px; padding: 8px 12px; background: var(--surface2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .symbol-header > div { min-width: 0; display: flex; align-items: baseline; gap: 8px; }
        .symbol-ticker { font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--accent); flex: 0 0 auto; }
        .symbol-company { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .broker-pill { flex: 0 0 auto; font-size: 9px; font-weight: 700; color: var(--text); border: 1px solid var(--border2); border-radius: 999px; padding: 2px 7px; background: var(--surface); }

        .trade-pair { display: grid; grid-template-columns: 76px minmax(0, 1fr) minmax(0, 1fr) 118px; gap: 1px; border-bottom: 1px solid var(--border); position: relative; }
        .trade-pair:last-child { border-bottom: none; }
        .trade-pair.unmatched { grid-template-columns: minmax(0, 1fr) 190px; }
        .trade-pair.unmatched .trade-leg { min-height: 52px; }
        .pair-direction { display: flex; align-items: center; justify-content: center; background: var(--surface2); border-right: 1px solid var(--border); padding: 8px; }
        .pair-direction span { display: inline-flex; align-items: center; justify-content: center; width: 54px; min-height: 24px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 0.08em; font-family: var(--font); }
        .long-pair .pair-direction span { color: var(--profit); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.28); }
        .short-pair .pair-direction span { color: var(--loss); background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.28); }
        .trade-leg { padding: 9px 12px; min-width: 0; display: grid; grid-template-columns: 72px minmax(150px, 1fr) 120px 120px; align-items: center; gap: 10px; }
        .sell-leg { background: var(--sell-bg); }
        .buy-leg { background: var(--buy-bg); }

        /* Date row inside leg */
        .leg-top-row { display: flex; align-items: center; gap: 7px; min-width: 0; }
        .leg-badge { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; line-height: 1.2; }
        .leg-date { font-size: 10px; color: var(--muted); font-family: var(--font); letter-spacing: 0; white-space: nowrap; }
        .sell-badge { background: rgba(239,68,68,0.15); color: var(--loss); border: 1px solid rgba(239,68,68,0.3); }
        .buy-badge { background: rgba(16,185,129,0.15); color: var(--profit); border: 1px solid rgba(16,185,129,0.3); }

        .leg-detail { display: grid; grid-template-columns: minmax(58px, max-content) minmax(0, 1fr); align-items: center; gap: 8px; min-width: 0; }
        .leg-qty { font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
        .leg-at { display: none; }
        .leg-rate { font-family: var(--font); font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .leg-avg-tag { font-size: 9px; color: var(--accent); background: rgba(59,130,246,0.12); padding: 1px 4px; border-radius: 4px; margin-left: 2px; letter-spacing: 0; }
        .leg-charges { font-size: 10px; color: var(--muted); font-family: var(--font); white-space: nowrap; text-align: right; }
        .leg-amount { font-family: var(--font); font-size: 13px; font-weight: 700; margin-top: 0; white-space: nowrap; text-align: right; }
        .sell-amount { color: var(--loss); }
        .buy-amount { color: var(--profit); }

        .charges-column { padding: 9px 12px; display: flex; flex-direction: column; gap: 6px; background: var(--surface2); border-top: 1px solid var(--border); min-width: 0; }
        .charges-header { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; }
        .charges-content { display: flex; flex-direction: column; gap: 4px; }
        .charge-item { display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding: 4px 6px; border-radius: 4px; }
        .charge-item.buy-charge { background: rgba(16,185,129,0.08); border-left: 2px solid var(--profit); }
        .charge-item.sell-charge { background: rgba(239,68,68,0.08); border-left: 2px solid var(--loss); }
        .charge-item.total-charge { background: rgba(0,0,0,0.15); border-left: 2px solid var(--accent); font-weight: 700; border-top: 1px solid var(--border); padding-top: 6px; margin-top: 2px; }
        .charge-label { color: var(--muted); }
        .buy-charge .charge-label { color: var(--profit); }
        .sell-charge .charge-label { color: var(--loss); }
        .charge-value { font-family: var(--font); font-size: 12px; font-weight: 700; }
        .buy-charge .charge-value { color: var(--profit); }
        .sell-charge .charge-value { color: var(--loss); }
        .total-charge .charge-value { color: var(--text); }

        .pair-pl { padding: 9px 12px; display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 6px; justify-items: flex-end; align-items: center; min-width: 0; background: var(--surface2); }
        .pair-pl .toggle-details-btn { grid-column: 2; grid-row: 1; }
        .pair-pl .pl-label { grid-column: 2; grid-row: 2; }
        .pair-pl .pl-value { grid-column: 2; grid-row: 3; }
        .pl-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 3px; }
        .pl-value { font-family: var(--font); font-size: 13px; font-weight: 700; white-space: nowrap; }
        .profit-pl .pl-value { color: var(--profit); }
        .loss-pl .pl-value { color: var(--loss); }

        /* Toggle details button */
        .toggle-details-btn { background: rgba(59,130,246,0.15); border: 1px solid var(--accent); color: var(--accent); padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .toggle-details-btn:hover { background: var(--accent); color: white; }
        .toggle-details-btn.expanded { background: rgba(16,185,129,0.15); border-color: var(--profit); color: var(--profit); }
        .toggle-details-btn.expanded:hover { background: var(--profit); color: white; }

        /* Expanded view for closed trades */
        .trade-pair.expanded-view { grid-template-columns: 1fr; }
        .trade-pair.expanded-view .pair-header-expanded { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; background: var(--surface2); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .pair-header-expanded .pair-direction { margin: 0; padding: 0; background: none; border: none; }
        .pair-header-expanded .pair-pl { padding: 0; background: none; }

        .legs-section { display: flex; flex-direction: column; gap: 1px; padding: 0; }
        .legs-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding: 8px 12px; background: var(--surface2); border-bottom: 1px solid var(--border); }

        .pending-tag { padding: 9px 12px; font-size: 11px; color: var(--orange); background: var(--orange-bg); border-top: none; display: flex; align-items: center; justify-content: space-between; text-align: right; gap: 12px; }
        .trade-pair.futures-contract .pending-tag { color: #3b82f6; background: rgba(59,130,246,0.08); border-top: 1px solid rgba(59,130,246,0.2); }
        .agg-tag { opacity: 0.7; font-size: 11px; }
        
        .ledger-action-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
        .ledger-action-btn:hover { background: rgba(59,130,246,0.15); }
        .ledger-action-btn.edit { color: #3b82f6; }
        .ledger-action-btn.delete { color: #ef4444; }
        .ledger-action-btn:active { transform: scale(0.95); }

        .ledger-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; overflow-y: hidden; width: 100%; max-width: 100%; }
        .ledger-wrap::-webkit-scrollbar { display: none; }
        .ledger-wrap { -ms-overflow-style: none; scrollbar-width: none; }
        .trade-ledger { width: 100%; border-collapse: collapse; font-size: 11px; }
        .trade-ledger th { position: sticky; top: 0; z-index: 1; background: var(--surface2); color: var(--muted); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border); }
        .trade-ledger td { padding: 6px 8px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; white-space: nowrap; }
        .trade-ledger tr:last-child td { border-bottom: none; }
        .trade-ledger tbody tr:hover { background: rgba(59,130,246,0.05); }
        .trade-ledger .open-row { background: rgba(245,158,11,0.035); }
        .ledger-symbol { color: var(--accent) !important; font-family: var(--font); font-weight: 700; }
        .ledger-muted { color: var(--muted) !important; }
        .ledger-broker { font-size: 9px; padding: 2px 6px; }
        .ledger-side { display: grid; grid-template-columns: 28px minmax(90px, 1fr); align-items: center; gap: 4px; font-family: var(--font); min-width: 0; }
        .ledger-side-main { min-width: 0; display: flex; align-items: baseline; gap: 7px; }
        .ledger-side strong { font-size: 12px; }
        .ledger-side-main span { color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
        .ledger-side-date { grid-column: 2; color: var(--muted); font-size: 10px; line-height: 1.1; }
        .ledger-side-badge { border-radius: 999px; padding: 2px 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-align: center; }
        .ledger-side-badge.buy { color: var(--profit); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.28); }
        .ledger-side-badge.sell { color: var(--loss); background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.28); }
        .ledger-amount { display: grid; gap: 3px; font-family: var(--font); min-width: 110px; }
        .ledger-amount.single { min-width: 0; }
        .ledger-amount div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ledger-amount-label { flex: 0 0 auto; border-radius: 999px; padding: 2px 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
        .ledger-amount-label.buy { color: var(--profit); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.28); }
        .ledger-amount-label.sell { color: var(--loss); background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.28); }
        .ledger-amount strong, .ledger-amount.single span { font-size: 12px; white-space: nowrap; }
        .ledger-amount .buy { color: var(--profit); }
        .ledger-amount .sell { color: var(--loss); }
        .ledger-charges-breakdown { display: flex; flex-direction: column; gap: 2px; font-family: var(--font); font-size: 10px; min-width: 120px; }
        .charge-line { display: flex; justify-content: space-between; align-items: center; gap: 6px; padding: 2px 4px; }
        .charge-label { color: var(--muted); text-transform: uppercase; font-size: 9px; font-weight: 700; letter-spacing: 0.04em; flex-shrink: 0; }
        .charge-amount { font-weight: 600; white-space: nowrap; }
        .buy-charge-line .charge-amount { color: var(--profit); }
        .sell-charge-line .charge-amount { color: var(--loss); }
        .total-charge-line .charge-amount { color: var(--text); font-weight: 700; padding-top: 2px; border-top: 1px solid var(--border); }
        .direction-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 54px; min-height: 24px; border-radius: 999px; padding: 2px 8px; font-family: var(--font); font-size: 9px; font-weight: 900; letter-spacing: 0.08em; }
        .direction-pill.long { color: var(--profit); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.28); }
        .direction-pill.short { color: var(--loss); background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.28); }
        .status-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 700; }
        .status-pill.closed { color: var(--profit); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.22); }
        .status-pill.open { color: var(--orange); background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.22); }

        /* Details button for ledger closed trades */
        .ledger-details-btn { background: rgba(59,130,246,0.12); border: 1px solid var(--accent); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ledger-details-btn:hover { background: var(--accent); color: white; }

        /* Expanded row in ledger */
        .expanded-ledger-row { background: var(--surface2) !important; }
        .expanded-ledger-row td { padding: 0 !important; border-bottom: none !important; }
        .expanded-trades-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 14px; }
        .expanded-section { display: flex; flex-direction: column; gap: 12px; }
        .expanded-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding-bottom: 8px; border-bottom: 1px solid var(--border); }
        .expanded-trade-item { display: grid; gap: 4px; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; }
        .item-row { display: flex; justify-content: space-between; gap: 12px; }
        .item-label { color: var(--muted); font-weight: 600; min-width: 70px; }
        .expanded-trade-item .profit { color: var(--profit); font-family: var(--font); font-weight: 600; }
        .expanded-trade-item .loss { color: var(--loss); font-family: var(--font); font-weight: 600; }

        .empty-state { text-align: center; padding: 4rem 1rem; color: var(--muted); }
        .empty-state.compact { padding: 2rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
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

        @media (max-width: 1100px) {
          .period-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 920px) {
          .dashboard-topbar { grid-template-columns: 1fr; }
          .dashboard-action-panel { max-width: none; }
        }

        @media (max-width: 640px) {
          .dashboard-overview { padding: 14px; }
          .dashboard-topbar { gap: 14px; }
          .dashboard-title { font-size: 28px; }
          .dashboard-subtitle { font-size: 13px; }
          .dashboard-chips { display: grid; grid-template-columns: 1fr; }
          .dashboard-chips span { justify-content: space-between; }
          .action-panel-copy { flex-direction: column; gap: 4px; }
          .action-panel-copy strong { white-space: normal; }
          .ledger-toolbar { align-items: stretch; flex-direction: column; }
          .filter-row { display: grid; grid-template-columns: 1fr; }
          .filter-row select, .filter-row input, .filter-clear { width: 100%; }
          .period-grid, .cards-grid { grid-template-columns: 1fr; }
          .broker-stats { grid-template-columns: 1fr; }
          .trade-pair { grid-template-columns: 1fr 1fr; }
          .trade-pair.unmatched { grid-template-columns: 1fr; }
          .pair-direction { grid-column: 1 / -1; justify-content: flex-start; border-right: none; border-bottom: 1px solid var(--border); }
          .trade-leg { grid-template-columns: 1fr; gap: 6px; padding: 10px 12px; }
          .leg-top-row { justify-content: space-between; }
          .leg-detail { grid-template-columns: max-content minmax(0, 1fr); }
          .leg-charges, .leg-amount { text-align: left; }
          .pending-tag { justify-content: space-between; text-align: left; border-top: 1px solid rgba(245,158,11,0.2); gap: 8px; }
          .charges-column { grid-column: 1 / -1; }
          .pair-pl { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; }
          .main-content { padding: 1rem; }
          .dashboard-toolbar { align-items: flex-start; flex-direction: column; }
          .tabs { padding: 0 1rem; }
          .tab-buttons { width: 100%; }
          .tab { white-space: nowrap; }
          .calculator-controls, .calculator-results { grid-template-columns: 1fr; }
          .trade-ledger { font-size: 11px; }
          .trade-ledger td { padding: 6px 8px; }
          .trade-ledger th { padding: 6px 8px; font-size: 9px; }
          .ledger-side { grid-template-columns: 28px minmax(80px, 1fr); gap: 4px; }
          .ledger-amount { min-width: 100px; gap: 2px; }
          .ledger-charges-breakdown { min-width: 110px; gap: 2px; font-size: 10px; }
          .charge-line { padding: 1px 2px; gap: 4px; }
          .ledger-action-btn { font-size: 12px; padding: 3px 6px; }
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
              <section className="dashboard-overview">
                <div className="dashboard-topbar">
                  <div className="dashboard-heading">
                    <div className="dashboard-kicker">Trading Ledger</div>
                    <h1 className="dashboard-title">Portfolio Tracker</h1>
                    <p className="dashboard-subtitle">Review closed P&L, broker performance, charges, and open trade status in one workspace.</p>
                    <div className="dashboard-chips">
                      <span>{summary?.total_trades || 0} closed trades</span>
                      <span>{trades.filter(t => !t.pair_id || t.matched === false).length} open rows</span>
                      <span>{brokerOptions.length - 1} brokers</span>
                    </div>
                  </div>
                  <div className="dashboard-action-panel">
                    <div className="action-panel-copy">
                      <span>Statement Upload</span>
                      <strong>Import PDF trades</strong>
                    </div>
                    <UploadZone token={token} onSuccess={fetchData} />
                    <button 
                      className="btn-primary" 
                      onClick={openAddTradeModal}
                      style={{ marginTop: '8px' }}
                    >
                      ➕ Add Manual Trade
                    </button>
                  </div>
                </div>
                <SummaryCards summary={summary} trades={trades} dateStart={dateStart} dateEnd={dateEnd} />
              </section>
              <div className="ledger-toolbar">
                <div className="section-title">{showRemainingOnly ? 'Remaining Trades' : 'Trade Pairs — Grouped by Symbol'}</div>
                <div className="filter-row">
                  <select value={brokerFilter} onChange={e => setBrokerFilter(e.target.value)}>
                    {brokerOptions.map(b => <option key={b} value={b}>{b === 'All' ? 'All brokers' : b}</option>)}
                  </select>
                  <select value={marketFilter} onChange={e => setMarketFilter(e.target.value)}>
                    <option value="All">All markets</option>
                    <option value="Ready">Ready</option>
                    <option value="Futures">Futures</option>
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All status</option>
                    <option value="Closed">Closed</option>
                    <option value="Open">Open</option>
                  </select>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={e => setDateStart(e.target.value)}
                    aria-label="Filter start date"
                  />
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={e => setDateEnd(e.target.value)}
                    min={dateStart || undefined}
                    aria-label="Filter end date"
                  />
                  {(dateStart || dateEnd) && (
                    <button className="filter-clear" type="button" onClick={() => { setDateStart(''); setDateEnd('') }}>Clear dates</button>
                  )}
                </div>
              </div>
              <TradeLedger 
                trades={visibleTrades} 
                expandedPairs={expandedPairs} 
                onTogglePair={togglePairExpanded}
                onEdit={openEditTradeModal}
                onDelete={handleDeleteTrade}
              />
            </>
          )}
          {tab === 'calendar' && <CalendarView token={token} expandedPairs={expandedPairs} onTogglePair={togglePairExpanded} />}
          {tab === 'calculator' && <MonthlyIncomeCalculator token={token} />}
          {tab === 'admin' && isAdmin && <AdminPanel token={token} />}
          </main>
        </div>
      </div>
      <TradeModal 
        isOpen={tradeModalOpen}
        mode={tradeModalMode}
        trade={selectedTrade}
        onClose={() => setTradeModalOpen(false)}
        onSuccess={fetchData}
        token={token}
      />
    </>
  )
}
