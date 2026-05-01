import { DISCORD_LINK, PublicShell, Section, WHATSAPP_LINK } from '../marketing'

export default function JoinPage() {
  return (
    <PublicShell>
      <main>
        <section className="page-hero">
          <span className="eyebrow">Community</span>
          <h1>Join Our Community</h1>
          <p>Connect with PSX traders, receive signal updates, and follow live intraday and swing trade discussions.</p>
        </section>

        <Section title="Community Links">
          <div className="grid two">
            <div className="card">
              <div className="icon">WA</div>
              <h3>WhatsApp Group</h3>
              <p>Join 500+ traders on WhatsApp for quick updates, trade discussions, and community support.</p>
              <p className="price">500+ members</p>
              <div className="button-row">
                <a className="primary-btn" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Join WhatsApp</a>
              </div>
            </div>

            <div className="card">
              <div className="icon">DC</div>
              <h3>Discord Server</h3>
              <p>Get live signals, organized trade channels, and premium community alerts on Discord.</p>
              <p className="price">Live signals</p>
              <ul className="feature-list">
                <li>Intraday</li>
                <li>Swing Trade</li>
              </ul>
              <div className="button-row">
                <a className="primary-btn" href={DISCORD_LINK} target="_blank" rel="noreferrer">Join Discord</a>
              </div>
            </div>
          </div>
        </Section>
      </main>
    </PublicShell>
  )
}
