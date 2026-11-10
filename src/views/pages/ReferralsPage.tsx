import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import checkmark from '../../../assets/images/checkmark-badge-01 (1).png'
import {
  emptyReferralsPage,
  fetchAmbassadorReferrals,
  fetchReferralTimeline,
  type ReferralsPageData,
} from '../../controllers/ambassadorReferrals.ts'
import { getSessionToken } from '../../controllers/apiClient.ts'
import { readAmbassadorSession } from '../../controllers/ambassadorAuth.ts'
import {
  type ReferralFilter,
  type ReferralUser,
} from '../../models/referrals.ts'
import {
  defaultXProfile,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import { LazyPlaceholder } from '../components/LazyPlaceholder.tsx'
import './ReferralsPage.css'

export function ReferralsPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const cachedLink = readAmbassadorSession()?.referralLink ?? ''
  const [data, setData] = useState<ReferralsPageData>(() => {
    const empty = emptyReferralsPage()
    return { ...empty, referralLink: cachedLink }
  })
  const [filter, setFilter] = useState<ReferralFilter>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [timelineError, setTimelineError] = useState('')
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!getSessionToken()) {
        if (!active) return
        setData(current => ({
          ...emptyReferralsPage(),
          referralLink: current.referralLink || cachedLink,
        }))
        setListError('Sign in again to load referrals.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const next = await fetchAmbassadorReferrals({ filter, page })
        if (!active) return
        setData(next)
        setListError('')
        setTimelineError('')
        if (next.page !== page) setPage(next.page)
      } catch (err) {
        if (!active) return
        setData(current => ({
          ...emptyReferralsPage(),
          referralLink: current.referralLink || cachedLink,
          filters: current.filters,
        }))
        setListError(
          err instanceof Error ? err.message : 'Could not load referrals.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [cachedLink, filter, page])

  const selected = data.selected

  async function copyLink() {
    if (!data.referralLink) return
    try {
      await navigator.clipboard.writeText(data.referralLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function shareUrl(link: string) {
    const trimmed = link.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  async function shareCampaign() {
    const shareData = {
      title: 'SenseiFi',
      text: data.referralLink,
      url: shareUrl(data.referralLink),
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
    setTimelineError('')
  }

  async function chooseUser(user: ReferralUser) {
    if (data.selected?.id === user.id) return
    setData(current => ({
      ...current,
      selected: user,
      timeline: [],
    }))
    setTimelineError('')

    if (!getSessionToken()) {
      setTimelineError('Sign in again to load timeline.')
      return
    }

    setTimelineLoading(true)
    try {
      const next = await fetchReferralTimeline(user.id)
      setData(current => ({
        ...current,
        selected: next.selected ?? user,
        timeline: next.timeline,
      }))
    } catch (err) {
      setTimelineError(
        err instanceof Error ? err.message : 'Could not load timeline.',
      )
    } finally {
      setTimelineLoading(false)
    }
  }

  const emptyMessage =
    filter === 'paid'
      ? 'No paid referrals yet.'
      : filter === 'activated'
        ? 'No activated referrals yet.'
        : 'No referrals yet.'

  if (loading) {
    return (
      <main className="referrals">
        <header className="referrals-header">
          <div>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <div className="referrals-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>{data.ambassadorLevel}</span>
            </div>
            <img
              className="referrals-avatar"
              src={profile.avatarUrl}
              alt={`${profile.displayName} on X`}
            />
          </div>
        </header>
        <LazyPlaceholder variant="page" label="Loading referrals…" />
      </main>
    )
  }

  return (
    <main className="referrals">
      <header className="referrals-header">
        <div>
          <h1>{data.title}</h1>
          <p>{data.subtitle}</p>
        </div>
        <div className="referrals-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>{data.ambassadorLevel}</span>
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
            <p className="referrals-link">
              {data.referralLink || 'No referral link yet'}
            </p>
            <div className="referrals-actions">
              <button
                type="button"
                onClick={copyLink}
                disabled={!data.referralLink}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={shareCampaign}
                disabled={!data.referralLink}
              >
                Share campaign
              </button>
            </div>
            <p className="referrals-note">{data.referralNote}</p>
          </article>

          <article className="referrals-card referrals-table-card">
            <div
              className="referrals-filters"
              role="tablist"
              aria-label="Referral status"
            >
              {data.filters.map(item => (
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

            {listError ? (
              <p className="referrals-status-msg is-error" role="alert">
                {listError}
              </p>
            ) : null}

            {!listError && data.users.length === 0 ? (
              <p className="referrals-empty">{emptyMessage}</p>
            ) : null}

            {data.users.length > 0 ? (
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
                    {data.users.map(user => {
                      const isSelected = selected?.id === user.id
                      return (
                        <tr
                          key={user.id}
                          className={isSelected ? 'is-selected' : ''}
                          onClick={() => void chooseUser(user)}
                        >
                          <td data-label="User">
                            <button
                              type="button"
                              className="referrals-user"
                              aria-pressed={isSelected}
                              onClick={() => void chooseUser(user)}
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
                              <span
                                className="referrals-check-empty"
                                aria-label="No wallet"
                              />
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
            ) : null}

            {data.totalPages > 1 ? (
              <div
                className="referrals-pager"
                role="navigation"
                aria-label="Referral pages"
              >
                {Array.from({ length: data.totalPages }, (_, index) => {
                  const number = index + 1
                  return (
                    <button
                      key={number}
                      type="button"
                      className={number === data.page ? 'is-active' : ''}
                      aria-current={number === data.page ? 'page' : undefined}
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
              {data.funnel.map(step => (
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
                {timelineLoading ? (
                  <LazyPlaceholder
                    variant="side"
                    label="Loading events…"
                    className="referrals-timeline-loader"
                  />
                ) : null}
                {timelineError ? (
                  <p className="referrals-status-msg is-error" role="alert">
                    {timelineError}
                  </p>
                ) : null}
                {!timelineLoading && data.timeline.length > 0 ? (
                  <ol className="referrals-timeline">
                    {data.timeline.map(event => (
                      <li key={event.id}>
                        <span className="referrals-dot" aria-hidden="true" />
                        <div>
                          <strong>{event.title}</strong>
                          <span>{event.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {!timelineLoading &&
                !timelineError &&
                data.timeline.length === 0 ? (
                  <p className="referrals-empty">
                    No events for this referral yet.
                  </p>
                ) : null}
                <p className="referrals-note">{data.timelineNote}</p>
              </>
            ) : (
              <p className="referrals-empty">
                Select a referral to see their events.
              </p>
            )}
            <Link className="referrals-ledger" to="/rewards">
              {data.ledgerLabel}
            </Link>
          </article>
        </div>
      </div>
    </main>
  )
}
