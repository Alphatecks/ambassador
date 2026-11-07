import { useState, type ChangeEvent } from 'react'
import { overview } from '../../models/overview.ts'
import {
  defaultXProfile,
  shortenAddress,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import './OverviewPage.css'

function dollars(amount: number, digits = 2) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function OverviewPage() {
  const { xProfile, wallet, connectWallet, disconnectWallet } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [copied, setCopied] = useState(false)
  const [referralLink, setReferralLink] = useState(overview.referralLink)

  function updateReferralLink(event: ChangeEvent<HTMLInputElement>) {
    setReferralLink(event.target.value)
  }

  function shareUrl(link: string) {
    const trimmed = link.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  async function shareCampaign() {
    const shareData = {
      title: 'SenseiFi',
      text: referralLink,
      url: shareUrl(referralLink),
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        return
      }
    }
    await copyLink()
  }

  return (
    <main className="overview">
      <header className="overview-header">
        <div>
          <h1>{overview.title}</h1>
          <p>{overview.subtitle}</p>
        </div>
        {wallet ? (
          <button
            type="button"
            className="overview-wallet-btn is-connected"
            onClick={disconnectWallet}
            title={wallet.address}
          >
            <span className="overview-wallet-label">Wallet</span>
            <span>{shortenAddress(wallet.address)}</span>
          </button>
        ) : (
          <button
            type="button"
            className="overview-wallet-btn"
            onClick={connectWallet}
          >
            Connect wallet
          </button>
        )}
      </header>

      <section className="overview-hero panel">
        <div className="overview-hero-profile">
          <img
            className="overview-hero-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} on X`}
          />
          <div className="overview-hero-copy">
            <p className="overview-hero-handle">@{profile.username}</p>
            <h2>{overview.ambassador.name}</h2>
            <p className="overview-hero-level">
              {overview.ambassador.level}
              <span aria-hidden="true">·</span>
              Step {overview.step.current} of {overview.step.total}
            </p>
          </div>
        </div>

        <div className="overview-hero-progress">
          <div className="overview-hero-progress-top">
            <span>{overview.ambassador.xpLabel}</span>
            <span>{overview.ambassador.rankProgress}%</span>
          </div>
          <div
            className="overview-hero-bar"
            role="progressbar"
            aria-valuenow={overview.ambassador.rankProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress to Rising unlock"
          >
            <span style={{ width: `${overview.ambassador.rankProgress}%` }} />
          </div>
          <p>Next rank: {overview.ambassador.nextRank}</p>
        </div>

        <div className="overview-hero-rewards">
          <div>
            <p className="panel-kicker">Earned</p>
            <p className="overview-hero-stat">{dollars(overview.earnings.total)}</p>
          </div>
          <div>
            <p className="panel-kicker">Escrow locked</p>
            <p className="overview-hero-stat">{dollars(overview.escrow.amount, 0)}</p>
          </div>
          <div>
            <p className="panel-kicker">Reward status</p>
            <p className="overview-hero-stat is-status">{overview.escrow.status}</p>
          </div>
        </div>
      </section>

      <section className="overview-path panel">
        <div className="panel-heading">
          <h2>Rank path</h2>
          <span className="status-pill">Live</span>
        </div>
        <div className="rank-path">
          {overview.step.tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`rank-node${tier.active ? ' is-active' : ''}${tier.complete ? ' is-complete' : ''}`}
            >
              <span className="rank-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{tier.name}</strong>
              <span>{tier.amount}</span>
            </div>
          ))}
        </div>
        <p className="panel-note">{overview.step.nextUnlock}</p>
      </section>

      <section className="overview-mission">
        <article className="panel mission-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">{overview.reward.title}</p>
              <h2>Clear the three targets</h2>
            </div>
            <span className="status-pill">{overview.reward.status}</span>
          </div>

          <div className="mission-score">
            <p className="mission-score-value">{overview.reward.overallPercent}%</p>
            <p className="panel-copy">Overall mission completion</p>
          </div>

          <div className="targets">
            {overview.reward.targets.map(target => (
              <div className="target" key={target.label}>
                <div className="target-top">
                  <span>{target.label}</span>
                  <span>
                    {target.current} / {target.goal}
                  </span>
                </div>
                <div className="target-track-row">
                  <div
                    className="target-track"
                    role="progressbar"
                    aria-valuenow={target.current}
                    aria-valuemin={0}
                    aria-valuemax={target.goal}
                    aria-label={target.label}
                  >
                    <span style={{ width: `${target.percent}%` }} />
                  </div>
                  <span className="target-remaining">{target.remaining} to go</span>
                </div>
              </div>
            ))}
          </div>
          <p className="panel-note">{overview.reward.note}</p>
        </article>

        <div className="overview-side">
          <article className="panel referral-panel">
            <h2>My referral link</h2>
            <input
              className="referral-link"
              type="text"
              aria-label="My referral link"
              value={referralLink}
              onChange={updateReferralLink}
            />
            <div className="referral-actions">
              <button type="button" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button type="button" className="is-primary" onClick={shareCampaign}>
                Share campaign
              </button>
            </div>
            <p className="panel-note">{overview.referralNote}</p>
          </article>

          <article className="panel earnings-panel">
            <p className="panel-kicker">Referral earnings</p>
            <p className="panel-value">{dollars(overview.earnings.total)}</p>
            <ul className="earning-lines">
              {overview.earnings.lines.map(line => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <span>{dollars(line.amount)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="overview-funnel">
        <h2>Campaign loop</h2>
        <div className="funnel-grid">
          {overview.funnel.map(step => (
            <article className="funnel-card" key={step.index}>
              <p className="funnel-kicker">
                <span>{step.index}</span> {step.name}
              </p>
              <p className="funnel-title">{step.title}</p>
              <p className="funnel-value">{step.value}</p>
              <p className={step.detailTone === 'link' ? 'is-link' : ''}>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
