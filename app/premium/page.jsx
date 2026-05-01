import Link from 'next/link'
import { PublicShell, Section, WHATSAPP_PREMIUM_LINK, WHATSAPP_TRIAL_LINK } from '../marketing'

const rows = [
  ['Trial length', '1 month trial', 'Monthly access'],
  ['Signals', 'Basic signals', 'Live intraday and swing signals'],
  ['PDF tracker', 'Included', 'Included'],
  ['Discord access', 'Not included', 'Included'],
  ['Support', 'Community support', 'Personal support'],
  ['Price', 'Free', 'Rs. 500/month'],
]

export default function PremiumPage() {
  return (
    <PublicShell>
      <main>
        <section className="page-hero">
          <span className="eyebrow">Premium</span>
          <h1>Free vs Premium</h1>
          <p>Start with the tracker and basic signals, then upgrade when you want live alerts, Discord access, and personal support.</p>
          <div className="button-row">
            <a className="primary-btn" href={WHATSAPP_TRIAL_LINK} target="_blank" rel="noreferrer">Start Free Trial</a>
            <a className="secondary-btn" href={WHATSAPP_PREMIUM_LINK} target="_blank" rel="noreferrer">Go Premium</a>
          </div>
        </section>

        <Section title="Plan Comparison">
          <table className="compare">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feature, free, premium]) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  <td>{free}</td>
                  <td>{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-row">
            <Link className="outline-btn" href="/join">Join Community</Link>
          </div>
        </Section>
      </main>
    </PublicShell>
  )
}
