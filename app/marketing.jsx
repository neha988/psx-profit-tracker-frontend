'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const WHATSAPP_LINK = 'https://wa.me/923000000000?text=I%20want%20to%20join%20PSX%20Profit%20Tracker'
export const WHATSAPP_ENROLL_LINK = 'https://wa.me/923000000000?text=I%20want%20to%20enroll%20in%20Technical%20Analysis%20Masterclass'
export const WHATSAPP_TRIAL_LINK = 'https://wa.me/923000000000?text=I%20want%20to%20start%20my%20free%20trial'
export const WHATSAPP_PREMIUM_LINK = 'https://wa.me/923000000000?text=I%20want%20to%20go%20premium%20for%20PSX%20Profit%20Tracker'
export const DISCORD_LINK = 'https://discord.gg/wcktHUYU6'

const navItems = [
  ['Home', '/'],
  ['Courses', '/courses'],
  ['Premium', '/premium'],
  ['Join', '/join'],
]

const displayNameFromEmail = (email = '') => {
  const name = email.split('@')[0] || 'User'
  return name
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'User'
}

export function PublicShell({ children }) {
  return (
    <>
      <MarketingStyles />
      <div className="site-shell">
        <PublicNavbar />

        {children}

        <PublicFooter />
      </div>
    </>
  )
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    window.location.href = '/'
  }

  return (
    <header className="public-nav">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-mark">PSX</span>
        <span className="brand-text">Profit Tracker</span>
      </Link>

      <nav className={`nav-links ${open ? 'open' : ''}`}>
        {navItems.map(([label, href]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        {session && <span className="user-name">{displayNameFromEmail(session.user?.email)}</span>}
        <Link className="login-btn" href="/tracker">{session ? 'Tracker' : 'Login'}</Link>
        {session && (
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        )}
        <button
          className="menu-btn"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="brand footer-logo">
          <span className="brand-mark">PSX</span>
          <span className="brand-text">Profit Tracker</span>
        </div>
        <p>Pakistan's smartest trading tracker for signals, education, and clean P&L insight.</p>
      </div>
      <div className="footer-links">
        {[...navItems.slice(1), ['Tracker', '/tracker']].map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </div>
      <div className="social-links">
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" aria-label="WhatsApp">WA</a>
        <a href={DISCORD_LINK} target="_blank" rel="noreferrer" aria-label="Discord">DC</a>
      </div>
    </footer>
  )
}

export function Section({ eyebrow, title, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      <div className="section-head">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function MarketingStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
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
        --orange: #F59E0B;
        --font: 'DM Mono', 'Fira Code', 'Courier New', monospace;
        --sans: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
      }
      html { scroll-behavior: smooth; background: var(--bg); }
      body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans); }
      a { color: inherit; text-decoration: none; }
      .site-shell { min-height: 100vh; background: radial-gradient(circle at 20% 0%, rgba(59,130,246,0.18), transparent 34rem), var(--bg); }
      .public-nav { position: sticky; top: 0; z-index: 50; height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 5vw; border-bottom: 1px solid rgba(30,45,69,0.88); background: rgba(10,14,26,0.88); backdrop-filter: blur(16px); }
      .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; }
      .brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 8px; background: linear-gradient(145deg, #3B82F6, #10B981); color: white; font-family: var(--font); font-size: 12px; letter-spacing: 0; box-shadow: 0 10px 30px rgba(59,130,246,0.28); }
      .brand-text { font-size: 15px; letter-spacing: 0; }
      .nav-links { display: flex; align-items: center; gap: 6px; }
      .nav-links a { color: var(--muted); font-size: 14px; padding: 10px 13px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
      .nav-links a:hover { color: var(--text); background: rgba(59,130,246,0.10); }
      .nav-actions { display: flex; align-items: center; gap: 10px; }
      .user-name { color: var(--text); font-weight: 700; font-size: 14px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .login-btn, .logout-btn, .primary-btn, .secondary-btn, .outline-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 18px; border-radius: 8px; font-weight: 700; font-size: 14px; transition: transform 0.2s, border-color 0.2s, background 0.2s; }
      .login-btn, .primary-btn { background: var(--accent); color: white; border: 1px solid var(--accent); }
      .logout-btn { color: var(--muted); background: rgba(17,24,39,0.72); border: 1px solid var(--border2); cursor: pointer; font-family: inherit; }
      .secondary-btn, .outline-btn { border: 1px solid var(--border2); color: var(--text); background: rgba(17,24,39,0.72); }
      .primary-btn:hover, .secondary-btn:hover, .outline-btn:hover, .login-btn:hover, .logout-btn:hover { transform: translateY(-1px); }
      .primary-btn:hover, .login-btn:hover { background: var(--accent2); border-color: var(--accent2); }
      .logout-btn:hover { color: var(--loss); border-color: var(--loss); }
      .menu-btn { display: none; width: 42px; height: 42px; border-radius: 8px; border: 1px solid var(--border2); background: var(--surface); padding: 10px; }
      .menu-btn span { display: block; height: 2px; background: var(--text); margin: 5px 0; border-radius: 99px; }
      .ticker-tape { overflow: hidden; border-bottom: 1px solid rgba(30,45,69,0.82); background: rgba(17,24,39,0.74); }
      .ticker-track { display: flex; width: max-content; animation: tickerMove 26s linear infinite; }
      .ticker-track span { min-width: max-content; padding: 12px 28px; color: #B8C5DA; font-family: var(--font); font-size: 12px; border-right: 1px solid rgba(37,53,80,0.72); }
      .ticker-track span:nth-child(3n + 1) { color: var(--profit); }
      @keyframes tickerMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: clamp(2rem, 7vw, 6rem); align-items: center; min-height: calc(100vh - 68px); padding: clamp(4rem, 8vw, 7rem) 5vw; }
      .hero h1 { max-width: 760px; margin: 0; font-size: clamp(3.2rem, 8vw, 7.5rem); line-height: 0.92; letter-spacing: 0; }
      .hero p { max-width: 660px; margin: 1.4rem 0 0; color: #B8C5DA; font-size: clamp(1.05rem, 2.2vw, 1.45rem); line-height: 1.55; }
      .hero-actions, .button-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 2rem; }
      .coin-stage { position: relative; min-height: 520px; display: grid; place-items: center; perspective: 900px; }
      .coin { width: 220px; height: 220px; border-radius: 50%; display: grid; place-items: center; color: #052E1C; font-family: var(--font); font-size: 62px; font-weight: 700; background: radial-gradient(circle at 32% 25%, #E8FFD6, #74D77D 30%, #10B981 62%, #047857); border: 10px solid #D8F8A8; box-shadow: 0 0 0 14px rgba(16,185,129,0.1), 0 34px 80px rgba(16,185,129,0.28); animation: coinEnter 1.15s ease-out both, coinFloat 4s ease-in-out 1.15s infinite; }
      .coin::after { content: 'PAK'; position: absolute; transform: translateY(54px); color: rgba(5,46,28,0.72); font-size: 18px; letter-spacing: 0; }
      .coin-line { position: absolute; border: 1px solid rgba(59,130,246,0.28); border-radius: 999px; animation: orbit 9s linear infinite; }
      .coin-line.one { width: 310px; height: 120px; transform: rotate(-18deg); }
      .coin-line.two { width: 260px; height: 260px; animation-duration: 13s; }
      .chart-card, .signal-card { position: absolute; border: 1px solid rgba(59,130,246,0.24); border-radius: 8px; background: linear-gradient(180deg, rgba(26,34,53,0.90), rgba(17,24,39,0.96)); box-shadow: 0 24px 80px rgba(0,0,0,0.32); backdrop-filter: blur(14px); }
      .chart-card { width: 330px; padding: 16px; top: 12px; right: 20px; transform: rotateX(8deg) rotateY(-10deg); animation: panelFloat 5.4s ease-in-out infinite; }
      .chart-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-family: var(--font); font-size: 12px; color: var(--muted); }
      .chart-top strong { color: var(--profit); }
      .chart-grid { height: 150px; background-image: linear-gradient(rgba(37,53,80,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(37,53,80,0.45) 1px, transparent 1px); background-size: 45px 38px; border-radius: 8px; overflow: hidden; }
      .chart-grid svg { width: 100%; height: 100%; display: block; }
      .area-path { fill: rgba(16,185,129,0.14); }
      .chart-path { fill: none; stroke: #10B981; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 580; stroke-dashoffset: 580; animation: drawChart 2.2s ease forwards 0.35s; }
      .chart-path.shadow { stroke: rgba(16,185,129,0.24); stroke-width: 14; filter: blur(6px); }
      .pulse-dot { fill: #D8F8A8; animation: dotPulse 1.6s ease-in-out infinite 2.3s; opacity: 0; }
      .signal-card { width: 230px; left: 0; bottom: 34px; padding: 14px; animation: panelFloat 6.2s ease-in-out infinite reverse; }
      .signal-label { color: var(--accent); font-family: var(--font); font-size: 11px; text-transform: uppercase; margin-bottom: 10px; }
      .signal-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid rgba(37,53,80,0.72); font-size: 12px; }
      .signal-row span { font-family: var(--font); color: var(--text); }
      .signal-row strong { color: var(--profit); font-family: var(--font); }
      .signal-row strong.down { color: var(--loss); }
      .signal-row em { color: #B8C5DA; font-style: normal; font-size: 10px; padding: 4px 6px; border-radius: 6px; background: rgba(59,130,246,0.12); }
      .floating-symbol { position: absolute; color: rgba(232,237,245,0.72); font-family: var(--font); font-size: 12px; padding: 8px 10px; border: 1px solid rgba(37,53,80,0.72); border-radius: 8px; background: rgba(10,14,26,0.66); animation: symbolFloat 5s ease-in-out infinite; }
      .symbol-one { left: 18px; top: 92px; }
      .symbol-two { right: 8px; bottom: 132px; animation-delay: 0.6s; }
      .symbol-three { left: 86px; bottom: 0; animation-delay: 1.1s; }
      @keyframes coinEnter { from { opacity: 0; transform: translateX(140px) rotateY(80deg) scale(0.72); } to { opacity: 1; transform: translateX(0) rotateY(0) scale(1); } }
      @keyframes coinFloat { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-18px) rotate(3deg); } }
      @keyframes orbit { to { transform: rotate(360deg); } }
      @keyframes drawChart { to { stroke-dashoffset: 0; } }
      @keyframes dotPulse { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.6); } }
      @keyframes panelFloat { 0%, 100% { transform: translateY(0) rotateX(8deg) rotateY(-10deg); } 50% { transform: translateY(-14px) rotateX(5deg) rotateY(-6deg); } }
      @keyframes symbolFloat { 0%, 100% { transform: translateY(0); opacity: 0.58; } 50% { transform: translateY(-16px); opacity: 1; } }
      .section { padding: clamp(3.5rem, 7vw, 6rem) 5vw; max-width: 1220px; margin: 0 auto; }
      .section-head { margin-bottom: 1.5rem; }
      .eyebrow { display: inline-block; margin-bottom: 10px; color: var(--accent); font-family: var(--font); font-size: 12px; letter-spacing: 0; text-transform: uppercase; }
      .section h2 { margin: 0; font-size: clamp(2rem, 4vw, 3.4rem); letter-spacing: 0; }
      .grid { display: grid; gap: 16px; }
      .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .card { background: linear-gradient(180deg, rgba(26,34,53,0.88), rgba(17,24,39,0.94)); border: 1px solid var(--border); border-radius: 8px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
      .card h3 { margin: 0 0 10px; font-size: 22px; }
      .card p, .card li, .muted { color: var(--muted); line-height: 1.7; }
      .price { color: var(--profit); font-family: var(--font); font-weight: 700; font-size: 20px; }
      .feature-list { padding: 0; list-style: none; margin: 18px 0 0; display: grid; gap: 9px; }
      .feature-list li::before { content: '✓'; color: var(--profit); margin-right: 8px; }
      .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; max-width: 1220px; margin: 0 auto; padding: 0 5vw; }
      .stat { background: var(--surface); border: 1px solid var(--border); padding: 22px; text-align: center; }
      .stat strong { display: block; color: white; font-family: var(--font); font-size: clamp(1.9rem, 4vw, 3rem); animation: numberPop 0.9s ease both; }
      .stat span { color: var(--muted); font-size: 13px; }
      @keyframes numberPop { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 8px; margin-bottom: 16px; background: rgba(59,130,246,0.13); border: 1px solid rgba(59,130,246,0.24); color: var(--accent); font-family: var(--font); font-weight: 700; }
      .stars { color: #FBBF24; letter-spacing: 0; margin-bottom: 10px; }
      .compare { width: 100%; border-collapse: collapse; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
      .compare th, .compare td { padding: 16px; border-bottom: 1px solid var(--border); text-align: left; }
      .compare th { background: var(--surface2); color: white; }
      .compare td { color: #B8C5DA; }
      .page-hero { padding: clamp(4rem, 8vw, 7rem) 5vw clamp(2rem, 5vw, 4rem); max-width: 1120px; margin: 0 auto; }
      .page-hero h1 { margin: 0; font-size: clamp(2.8rem, 7vw, 5.8rem); line-height: 0.95; letter-spacing: 0; }
      .page-hero p { max-width: 720px; color: #B8C5DA; font-size: 1.18rem; line-height: 1.6; }
      .footer { display: grid; grid-template-columns: 1.4fr 1fr auto; gap: 2rem; align-items: center; padding: 2rem 5vw; border-top: 1px solid var(--border); background: rgba(17,24,39,0.76); }
      .footer p { max-width: 520px; color: var(--muted); margin: 12px 0 0; }
      .footer-links, .social-links { display: flex; flex-wrap: wrap; gap: 12px; }
      .footer-links a { color: var(--muted); }
      .social-links a { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 8px; background: var(--surface2); border: 1px solid var(--border2); font-family: var(--font); font-size: 12px; color: var(--text); }
      @media (max-width: 900px) {
        .nav-links { position: absolute; left: 5vw; right: 5vw; top: 76px; display: none; flex-direction: column; align-items: stretch; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
        .nav-links.open { display: flex; }
        .menu-btn { display: block; }
        .hero { grid-template-columns: 1fr; min-height: auto; }
        .coin-stage { min-height: 500px; max-width: 420px; width: 100%; margin: 0 auto; }
        .coin { width: 170px; height: 170px; font-size: 48px; }
        .chart-card { width: min(100%, 320px); right: 0; }
        .signal-card { left: 0; width: min(82vw, 230px); }
        .grid.two, .grid.three, .grid.four, .stats, .footer { grid-template-columns: 1fr; }
        .footer { align-items: start; }
      }
      @media (max-width: 560px) {
        .brand-text { display: none; }
        .user-name { max-width: 92px; font-size: 13px; }
        .login-btn, .logout-btn { min-height: 38px; padding: 0 13px; }
        .hero-actions, .button-row { flex-direction: column; }
        .primary-btn, .secondary-btn, .outline-btn { width: 100%; }
        .compare { display: block; overflow-x: auto; }
      }
    `}</style>
  )
}
