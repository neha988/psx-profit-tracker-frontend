import Link from 'next/link'
import { DISCORD_LINK, PublicShell, Section, WHATSAPP_LINK } from './marketing'

const courseTopics = ['Support & Resistance', 'RSI & MACD', 'Volume Analysis', 'PSX-specific strategies']
const trackerFeatures = ['PDF Upload', 'Trade Matching', 'Calendar View', 'P&L Summary']
const education = [
  ['IN', 'Intraday Signals', 'Market hours entries, targets, stop loss, and quick exit planning.'],
  ['SW', 'Swing Trade Guide', 'Multi-day setups built around support zones, momentum, and volume.'],
  ['TA', 'Technical Analysis', 'Read trends, breakouts, reversals, RSI, MACD, and risk zones clearly.'],
  ['LC', 'Live Chart Reading', 'Practice real PSX chart decisions with structured market commentary.'],
]
const reviews = [
  ['Ahmed Khan', 'Lahore', 'I finally started tracking net profit after charges. The signals helped me stay disciplined.'],
  ['Sara Malik', 'Karachi', 'The swing trade guide made entries easier to understand, especially around support levels.'],
  ['Bilal Raza', 'Islamabad', 'Uploading statements and seeing win rate changed how I review every trading week.'],
]
const tickerItems = ['HBL +1.42%', 'ENGRO +0.88%', 'LUCK +2.31%', 'MARI +1.07%', 'SYS +3.12%', 'OGDC +0.64%', 'FFC +1.22%']
const marketRows = [
  ['MARI', '+3.12%', 'BUY'],
  ['LUCK', '+2.31%', 'HOLD'],
  ['HBL', '+1.42%', 'BUY'],
  ['OGDC', '-0.28%', 'WATCH'],
]

export default function HomePage() {
  return (
    <PublicShell>
      <main>
        <div className="ticker-tape" aria-label="Market ticker">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className="hero">
          <div>
            <span className="eyebrow">PSX signals, tracker, and education</span>
            <h1>Master PSX Trading</h1>
            <p>Pakistan's smartest stock trading tracker with live signals, swing trade guides and intraday alerts</p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/premium">Start Free Trial</Link>
              <Link className="secondary-btn" href="/join">Join Community</Link>
            </div>
          </div>
          <div className="coin-stage" aria-hidden="true">
            <div className="coin-line one" />
            <div className="coin-line two" />
            <div className="chart-card">
              <div className="chart-top">
                <span>KSE-100</span>
                <strong>+786 pts</strong>
              </div>
              <div className="chart-grid">
                <svg viewBox="0 0 360 160" role="img">
                  <path className="area-path" d="M0 132 L42 116 L78 124 L116 82 L154 96 L198 54 L238 68 L282 30 L330 42 L360 18 L360 160 L0 160 Z" />
                  <path className="chart-path shadow" d="M0 132 L42 116 L78 124 L116 82 L154 96 L198 54 L238 68 L282 30 L330 42 L360 18" />
                  <path className="chart-path" d="M0 132 L42 116 L78 124 L116 82 L154 96 L198 54 L238 68 L282 30 L330 42 L360 18" />
                  <circle className="pulse-dot" cx="360" cy="18" r="5" />
                </svg>
              </div>
            </div>
            <div className="coin">Rs</div>
            <div className="signal-card">
              <div className="signal-label">Live Signals</div>
              {marketRows.map(([symbol, move, action]) => (
                <div className="signal-row" key={symbol}>
                  <span>{symbol}</span>
                  <strong className={move.startsWith('-') ? 'down' : ''}>{move}</strong>
                  <em>{action}</em>
                </div>
              ))}
            </div>
            <span className="floating-symbol symbol-one">PSX</span>
            <span className="floating-symbol symbol-two">RSI</span>
            <span className="floating-symbol symbol-three">P&L</span>
          </div>
        </section>

        <section className="stats" aria-label="PSX Profit Tracker stats">
          {[
            ['500+', 'Members'],
            ['10,000+', 'Trades Tracked'],
            ['78%', 'Win Rate'],
            ['24/7', 'Live Support'],
          ].map(([value, label]) => (
            <div className="stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <Section title="Learn From Experts">
          <div className="card">
            <div className="price">Rs. 5,000</div>
            <h3>Technical Analysis Masterclass</h3>
            <ul className="feature-list">
              {courseTopics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
            <div className="button-row">
              <Link className="primary-btn" href="/courses">View Course</Link>
            </div>
          </div>
        </Section>

        <Section title="Go Premium">
          <div className="grid two">
            <div className="card">
              <div className="price">1 month free</div>
              <h3>Free Trial</h3>
              <p>Basic signals and PDF tracker access for new traders testing the workflow.</p>
            </div>
            <div className="card">
              <div className="price">Rs. 500/month</div>
              <h3>Premium</h3>
              <p>All features, live signals, Discord access, and personal support.</p>
            </div>
          </div>
          <div className="button-row">
            <Link className="primary-btn" href="/premium">See All Plans</Link>
          </div>
        </Section>

        <Section title="Auto Profit Tracker">
          <div className="card">
            <p>Upload your Munir Khanani statement and instantly see your profit/loss, charges, win rate</p>
            <ul className="feature-list">
              {trackerFeatures.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <div className="button-row">
              <Link className="primary-btn" href="/tracker">Open Tracker</Link>
            </div>
          </div>
        </Section>

        <Section title="What You Will Learn">
          <div className="grid four">
            {education.map(([icon, title, description]) => (
              <div className="card" key={title}>
                <div className="icon">{icon}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Student Reviews">
          <div className="grid three">
            {reviews.map(([name, city, quote]) => (
              <div className="card" key={name}>
                <div className="stars">★★★★★</div>
                <h3>{name}</h3>
                <p className="muted">{city}</p>
                <p>"{quote}"</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Join Our Community">
          <div className="grid two">
            <div className="card">
              <div className="icon">WA</div>
              <h3>WhatsApp</h3>
              <p>Join 500+ traders on WhatsApp</p>
              <div className="button-row">
                <a className="primary-btn" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Join WhatsApp</a>
              </div>
            </div>
            <div className="card">
              <div className="icon">DC</div>
              <h3>Discord</h3>
              <p>Get live signals on Discord</p>
              <div className="button-row">
                <a className="primary-btn" href={DISCORD_LINK} target="_blank" rel="noreferrer">Join Discord</a>
              </div>
            </div>
          </div>
          <div className="button-row">
            <Link className="outline-btn" href="/join">See All Links</Link>
          </div>
        </Section>
      </main>
    </PublicShell>
  )
}
