import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import checkmark from '../../../assets/images/checkmark-badge-01 (1).png'
import {
  referralUsers,
  referrals,
  type ReferralFilter,
  type ReferralUser,
} from '../../models/referrals.ts'
import {
  defaultXProfile,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import './ReferralsPage.css'

export function ReferralsPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const referralLink = `senseifi.io/r/${profile.username}`
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<ReferralFilter>('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(referralUsers[0]?.id ?? '')

  const filtered = useMemo(() => {
    if (filter === 'activated') {
      return referralUsers.filter(user => user.walletConnected)
    }
    if (filter === 'paid') {
      return referralUsers.filter(user => user.subscription === 'Paid')
    }
    return referralUsers
  }, [filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / referrals.pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice(
    (currentPage - 1) * referrals.pageSize,
    currentPage * referrals.pageSize,
  )
  const selected =
    filtered.find(user => user.id === selectedId) ?? visible[0] ?? filtered[0]

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
      url: `https://${referralLink}`,
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

  function chooseFilter(next: ReferralFilter) {
    setFilter(next)
    setPage(1)
    const nextUsers =
      next === 'activated'
        ? referralUsers.filter(user => user.walletConnected)
        : next === 'paid'
          ? referralUsers.filter(user => user.subscription === 'Paid')
          : referralUsers
    setSelectedId(nextUsers[0]?.id ?? '')
  }

  function chooseUser(user: ReferralUser) {
    setSelectedId(user.id)
  }

  return (
    <main className="referrals">
      <header className="referrals-header">
        <div>
          <h1>{referrals.title}</h1>
          <p>{referrals.subtitle}</p>
        </div>
        <div className="referrals-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>{referrals.ambassador.level}</span>
          </div>
          <img
            className="referrals-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} on X`}
          />
        </div>
      </header>

      <div className="referrals-layout">
        <div className="referrals-main">
          <article className="referrals-card referrals-link-card">
            <h2>My referral link</h2>
            <p className="referrals-link">{referralLink}</p>
            <div className="referrals-actions">
              <button type="button" onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button type="button" className="is-primary" onClick={shareCampaign}>
                Share campaign
              </button>
            </div>
            <p className="referrals-note">{referrals.referralNote}</p>
          </article>

          <article className="referrals-card referrals-table-card">
            <div className="referrals-filters" role="tablist" aria-label="Referral status">
              {referrals.filters.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className={filter === item.id ? 'is-active' : ''}
                  onClick={() => chooseFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="referrals-empty">No paid referrals yet.</p>
            ) : (
              <div className="referrals-table-scroll">
                <table className="referrals-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Wallet</th>
                      <th>Subscription</th>
                      <th>Joined</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(user => {
                      const isSelected = selected?.id === user.id
                      return (
                        <tr
                          key={user.id}
                          className={isSelected ? 'is-selected' : ''}
                          onClick={() => chooseUser(user)}
                        >
                          <td data-label="User">
                            <button
                              type="button"
                              className="referrals-user"
                              aria-pressed={isSelected}
                              onClick={() => chooseUser(user)}
                            >
                              <span
                                className={
                                  isSelected
                                    ? 'referrals-radio is-selected'
                                    : 'referrals-radio'
                                }
                                aria-hidden="true"
                              />
                              {user.label}
                            </button>
                          </td>
                          <td data-label="Wallet">
                            {user.walletConnected ? (
                              <img
                                className="referrals-check"
                                src={checkmark}
                                alt="Wallet connected"
                              />
                            ) : (
                              <span className="referrals-check-empty" aria-label="No wallet" />
                            )}
                          </td>
                          <td data-label="Subscription">{user.subscription}</td>
                          <td data-label="Joined">{user.joined}</td>
                          <td data-label="Status">
                            <span className="referrals-status">{user.status}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > referrals.pageSize ? (
              <div className="referrals-pager" role="navigation" aria-label="Referral pages">
                {Array.from({ length: pageCount }, (_, index) => {
                  const number = index + 1
                  return (
                    <button
                      key={number}
                      type="button"
                      className={number === currentPage ? 'is-active' : ''}
                      aria-current={number === currentPage ? 'page' : undefined}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </article>
        </div>

        <div className="referrals-side">
          <article className="referrals-card referrals-funnel-card">
            <h2>Funnel</h2>
            <div className="referrals-funnel">
              {referrals.funnel.map(step => (
                <div className="referrals-funnel-stat" key={step.label}>
                  <p>{step.label}</p>
                  <strong>{step.value}</strong>
                  <span>{step.detail}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="referrals-card referrals-timeline-card">
            <h2>Event timeline</h2>
            {selected ? (
              <>
                <p className="referrals-user-id">{selected.label}</p>
                <ol className="referrals-timeline">
                  {referrals.timeline.map(event => (
                    <li key={event.title}>
                      <span className="referrals-dot" aria-hidden="true" />
                      <div>
                        <strong>{event.title}</strong>
                        <span>{event.detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="referrals-note">{referrals.timelineNote}</p>
              </>
            ) : (
              <p className="referrals-empty">Select a referral to see their events.</p>
            )}
            <Link className="referrals-ledger" to="/rewards">
              View in commission ledger
            </Link>
          </article>
        </div>
      </div>
    </main>
  )
}
