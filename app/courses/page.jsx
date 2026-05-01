import Link from 'next/link'
import { PublicShell, Section, WHATSAPP_ENROLL_LINK } from '../marketing'

const topics = [
  'Support and resistance zones',
  'Trendlines and market structure',
  'RSI entries and divergence',
  'MACD confirmation',
  'Volume analysis for PSX shares',
  'Breakout and retest planning',
  'Risk management and stop loss placement',
  'PSX-specific swing and intraday strategies',
]

export default function CoursesPage() {
  return (
    <PublicShell>
      <main>
        <section className="page-hero">
          <span className="eyebrow">Courses</span>
          <h1>Technical Analysis Masterclass</h1>
          <p>Learn practical PSX chart reading, disciplined entries, exits, and repeatable trading review.</p>
        </section>

        <Section title="Course Details">
          <div className="card">
            <div className="price">Rs. 5,000</div>
            <h3>Technical Analysis Masterclass</h3>
            <ul className="feature-list">
              {topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
            <div className="button-row">
              <a className="primary-btn" href={WHATSAPP_ENROLL_LINK} target="_blank" rel="noreferrer">Enroll Now</a>
              <Link className="secondary-btn" href="/join">Join Community</Link>
            </div>
          </div>
        </Section>
      </main>
    </PublicShell>
  )
}
