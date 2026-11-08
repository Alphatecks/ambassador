import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import hero from '../../../assets/images/landing-hero.jpg'
import mascot from '../../../assets/images/senseifi-mascot.webm'
import rewardPool from '../../../assets/images/reward-pool.mp4'
import {
  createLandingWinner,
  createLandingWinners,
  landing,
  type LandingWinner,
} from '../../models/landing.ts'
import './LandingPage.css'

const WINNER_COUNT = 14

export function LandingPage() {
  const [winners, setWinners] = useState<LandingWinner[]>(() =>
    createLandingWinners(WINNER_COUNT),
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWinners(current => {
        const next = createLandingWinner()
        return [next, ...current.slice(0, WINNER_COUNT - 1)]
      })
    }, 2800)
    return () => window.clearInterval(timer)
  }, [])

  const marquee = [...winners, ...winners]

  return (
    <main className="landing">
      <header className="landing-top">
        <Link className="landing-brand-mark" to="/">
          <img src={logo} alt="" />
          <span>SenseiFi</span>
        </Link>
        <div className="landing-top-actions">
          <Link className="landing-top-link" to="/sign-in">
            {landing.secondaryCta}
          </Link>
          <Link className="landing-top-cta" to="/sign-up">
            {landing.primaryCta}
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <img
          className="landing-hero-media"
          src={hero}
          alt="Abstract blockchain network with glowing nodes and reward energy"
        />
        <div className="landing-hero-scrim" aria-hidden="true" />
        <div className="landing-hero-copy">
          <p className="landing-brand">
            <span>SenseiFi</span>
            <span>Ambassadors</span>
          </p>
          <h1>{landing.headline}</h1>
          <p className="landing-support">{landing.support}</p>
          <div className="landing-cta">
            <Link className="landing-cta-primary" to="/sign-up">
              {landing.primaryCta}
            </Link>
            <Link className="landing-cta-secondary" to="/sign-in">
              {landing.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="landing-hero-stage" aria-hidden="true">
          <div className="landing-hero-orbit">
            <span className="landing-hero-ring" />
            <span className="landing-hero-ring is-delay" />
            <video
              className="landing-hero-mascot"
              src={mascot}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <div className="landing-hero-jackpot">
              <strong>$30,000</strong>
              <span>USDT vault</span>
            </div>
          </div>

          <ul className="landing-hero-drops">
            {winners.slice(0, 5).map((winner, index) => (
              <li
                key={winner.id}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span>{winner.wallet}</span>
                <strong>{winner.amount}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-live" aria-label="Live ambassador payouts">
        <div className="landing-live-label">
          <span className="landing-live-dot" aria-hidden="true" />
          {landing.liveLabel}
        </div>
        <div className="landing-marquee" aria-hidden="true">
          <div className="landing-marquee-track">
            {marquee.map((winner, index) => (
              <WinnerChip key={`${winner.id}-${index}`} winner={winner} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-pool">
        <div className="landing-pool-copy">
          <p className="landing-kicker">{landing.pool.kicker}</p>
          <h2 className="landing-pool-title">
            <span className="landing-pool-amount">
              <span className="landing-pool-currency">$</span>
              <span className="landing-pool-figure">30,000</span>
            </span>
            <span className="landing-pool-unit">{landing.pool.unit}</span>
          </h2>
          <p className="landing-pool-lead">{landing.pool.lead}</p>
          <p className="landing-pool-detail">{landing.pool.detail}</p>
          <ul className="landing-pool-tiers">
            {landing.pool.tiers.map(tier => (
              <li key={tier.name}>
                <div>
                  <strong>{tier.name}</strong>
                  <p>{tier.detail}</p>
                </div>
                <span>{tier.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        <video
          className="landing-pool-media"
          src={rewardPool}
          autoPlay
          muted
          loop
          playsInline
          aria-label="SenseiFi 30,000 USDT reward pool"
        />
      </section>

      <section className="landing-path">
        <div className="landing-path-intro">
          <p className="landing-kicker">{landing.pathTitle}</p>
          <h2>{landing.pathSupport}</h2>
        </div>
        <ol className="landing-steps">
          {landing.path.map(step => (
            <li key={step.index}>
              <span>{step.index}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-board" aria-label="Recent winners">
        <div className="landing-board-head">
          <p className="landing-kicker">Winner feed</p>
          <h2>Real influencers. Real withdrawals.</h2>
        </div>
        <ul className="landing-board-list">
          {winners.slice(0, 8).map(winner => (
            <li key={winner.id}>
              <span className="landing-board-wallet">{winner.wallet}</span>
              <span className="landing-board-action">{winner.action}</span>
              <strong className="landing-board-amount">{winner.amount}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-close">
        <h2>{landing.closeTitle}</h2>
        <p>{landing.closeSupport}</p>
        <Link className="landing-cta-primary" to="/sign-up">
          {landing.closeCta}
        </Link>
      </section>
    </main>
  )
}

function WinnerChip({ winner }: { winner: LandingWinner }) {
  return (
    <div className="landing-chip">
      <span className="landing-chip-wallet">{winner.wallet}</span>
      <span className="landing-chip-action">{winner.action}</span>
      <strong>{winner.amount}</strong>
      <span className="landing-chip-unit">USDT</span>
    </div>
  )
}
