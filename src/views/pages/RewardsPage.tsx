import { useEffect, useState } from 'react'
import {
  emptyRewardsPage,
  fetchAmbassadorRewards,
  type RewardsPageData,
} from '../../controllers/ambassadorRewards.ts'
import { getSessionToken } from '../../controllers/apiClient.ts'
import { type RewardFilter } from '../../models/rewards.ts'
import {
  defaultXProfile,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import { LazyPlaceholder } from '../components/LazyPlaceholder.tsx'
import './RewardsPage.css'

export function RewardsPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [data, setData] = useState<RewardsPageData>(() => emptyRewardsPage())
  const [filter, setFilter] = useState<RewardFilter>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!getSessionToken()) {
        if (!active) return
        setData(emptyRewardsPage())
        setError('Sign in again to load the reward ledger.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const next = await fetchAmbassadorRewards({ filter, page })
        if (!active) return
        setData(next)
        setError('')
        if (next.page !== page) setPage(next.page)
      } catch (err) {
        if (!active) return
        setData(current => ({
          ...emptyRewardsPage(),
          filters: current.filters,
          rules: current.rules,
          example: current.example,
        }))
        setError(
          err instanceof Error ? err.message : 'Could not load reward ledger.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [filter, page])

  function chooseFilter(next: RewardFilter) {
    setFilter(next)
    setPage(1)
  }

  const emptyMessage =
    filter === 'pending'
      ? 'No pending rewards.'
      : filter === 'approved'
        ? 'No approved rewards yet.'
        : 'No rewards yet.'

  if (loading) {
    return (
      <main className="rewards">
        <header className="rewards-header">
          <div>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <div className="rewards-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>{data.ambassadorLevel}</span>
            </div>
            <img
              className="rewards-avatar"
              src={profile.avatarUrl}
              alt={`${profile.displayName} on X`}
            />
          </div>
        </header>
        <LazyPlaceholder variant="page" label="Loading rewards…" />
      </main>
    )
  }

  return (
    <main className="rewards">
      <header className="rewards-header">
        <div>
          <h1>{data.title}</h1>
          <p>{data.subtitle}</p>
        </div>
        <div className="rewards-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>{data.ambassadorLevel}</span>
          </div>
          <img
            className="rewards-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} on X`}
          />
        </div>
      </header>

      <div className="rewards-layout">
        <article className="rewards-card">
          <div
            className="rewards-filters"
            role="tablist"
            aria-label="Reward status"
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

          {error ? (
            <p className="rewards-status-msg is-error" role="alert">
              {error}
            </p>
          ) : null}

          {!error && data.entries.length === 0 ? (
            <p className="rewards-empty">{emptyMessage}</p>
          ) : null}

          {data.entries.length > 0 ? (
            <div className="rewards-table-scroll">
              <table className="rewards-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Referred user</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Release / note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map(entry => (
                    <tr key={entry.id}>
                      <td data-label="Date">{entry.date}</td>
                      <td data-label="Event">{entry.event}</td>
                      <td data-label="Referred user">{entry.user}</td>
                      <td data-label="Amount">{entry.amount}</td>
                      <td data-label="Status">
                        <span className={`rewards-status is-${entry.status}`}>
                          {entry.status === 'pending' ? 'Pending' : 'Approved'}
                        </span>
                      </td>
                      <td data-label="Release / note">{entry.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {data.totalPages > 1 ? (
            <div
              className="rewards-pager"
              role="navigation"
              aria-label="Reward pages"
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

        <article className="rewards-card rewards-rules">
          <h2>Qualification rules</h2>
          <ul>
            {data.rules.map(rule => (
              <li key={rule.title}>
                <div>
                  <strong>{rule.title}</strong>
                  <span>{rule.value}</span>
                </div>
                <p>{rule.detail}</p>
              </li>
            ))}
          </ul>
          <p className="rewards-example">{data.example}</p>
        </article>
      </div>
    </main>
  )
}
