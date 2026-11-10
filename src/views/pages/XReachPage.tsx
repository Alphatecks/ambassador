import { useEffect, useState } from 'react'
import {
  emptyXReachPage,
  fetchAmbassadorXReach,
  formatCount,
  syncAmbassadorXReach,
  type XReachPageData,
} from '../../controllers/ambassadorXReach.ts'
import { getSessionToken } from '../../controllers/apiClient.ts'
import { type XPostFilter } from '../../models/xReach.ts'
import { defaultXProfile, useAmbassador } from '../../providers/AmbassadorContext.tsx'
import { LazyPlaceholder } from '../components/LazyPlaceholder.tsx'
import './XReachPage.css'

function formatSyncedAt(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function XReachPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [data, setData] = useState<XReachPageData>(() => emptyXReachPage())
  const [filter, setFilter] = useState<XPostFilter>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!getSessionToken()) {
        if (!active) return
        setData(emptyXReachPage())
        setError('Sign in again to load X Reach.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const next = await fetchAmbassadorXReach({
          filter,
          page,
          perPage: 50,
        })
        if (!active) return
        setData(next)
        setError(next.syncHint || '')
        if (next.page !== page) setPage(next.page)
      } catch (err) {
        if (!active) return
        setData(current => ({
          ...emptyXReachPage(),
          filters: current.filters,
          rules: current.rules,
          example: current.example,
        }))
        setError(err instanceof Error ? err.message : 'Could not load X Reach.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [filter, page])

  function chooseFilter(next: XPostFilter) {
    setFilter(next)
    setPage(1)
  }

  async function onSync() {
    if (syncing || !data.canSync) return
    setSyncing(true)
    setError('')
    try {
      const next = await syncAmbassadorXReach()
      setData(next)
      setError(next.syncHint || '')
      if (filter !== 'all') setFilter('all')
      else if (page !== 1) setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync X posts.')
    } finally {
      setSyncing(false)
    }
  }

  const emptyMessage =
    filter === 'pending'
      ? 'No pending posts.'
      : filter === 'tracked'
        ? 'No tracked posts yet.'
        : 'No posts yet.'

  if (loading) {
    return (
      <main className="xreach">
        <header className="xreach-header">
          <div>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <div className="xreach-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>{data.ambassadorLevel}</span>
            </div>
            <img
              className="xreach-avatar"
              src={profile.avatarUrl}
              alt={`${profile.displayName} on X`}
            />
          </div>
        </header>
        <LazyPlaceholder variant="stats" label="Loading X Reach…" />
        <div style={{ marginTop: 18 }}>
          <LazyPlaceholder variant="page" label="Loading posts…" />
        </div>
      </main>
    )
  }

  return (
    <main className="xreach">
      <header className="xreach-header">
        <div>
          <h1>{data.title}</h1>
          <p>{data.subtitle}</p>
          {error ? (
            <p className="xreach-status-msg is-error" role="alert">
              {error}
            </p>
          ) : null}
          {data.lastSyncedAt ? (
            <p className="xreach-status-msg">
              Last synced {formatSyncedAt(data.lastSyncedAt)}
            </p>
          ) : null}
        </div>
        <div className="xreach-header-actions">
          <button
            type="button"
            className="is-primary"
            onClick={() => void onSync()}
            disabled={!data.canSync || syncing}
          >
            {syncing ? 'Syncing…' : 'Sync posts'}
          </button>
          <div className="xreach-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>{data.ambassadorLevel}</span>
            </div>
            <img
              className="xreach-avatar"
              src={profile.avatarUrl}
              alt={`${profile.displayName} on X`}
            />
          </div>
        </div>
      </header>

      <section className="xreach-stats">
        {data.stats.map(stat => (
          <article className="xreach-panel" key={stat.id}>
            <p className="xreach-kicker">{stat.label}</p>
            <p className="xreach-value">{stat.value}</p>
            <p className="xreach-copy">{stat.detail}</p>
          </article>
        ))}
      </section>

      <div className="xreach-layout">
        <article className="xreach-panel">
          <div className="xreach-filters" role="tablist" aria-label="Post status">
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

          {data.entries.length === 0 ? (
            <p className="xreach-empty">{emptyMessage}</p>
          ) : (
            <div className="xreach-table-scroll">
              <table className="xreach-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Post</th>
                    <th>Impressions</th>
                    <th>Engagement</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map(entry => (
                    <tr key={entry.id}>
                      <td data-label="Date">{entry.date}</td>
                      <td data-label="Post">
                        {entry.url ? (
                          <a
                            className="xreach-post-link"
                            href={entry.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {entry.preview}
                          </a>
                        ) : (
                          entry.preview
                        )}
                      </td>
                      <td data-label="Impressions">
                        {formatCount(entry.impressions)}
                      </td>
                      <td data-label="Engagement">
                        {formatCount(
                          entry.engagement ??
                            entry.likes + entry.reposts + entry.replies,
                        )}
                        <span className="xreach-engagement">
                          {entry.engagementDetail ||
                            `${entry.likes} likes · ${entry.reposts} reposts · ${entry.replies} replies`}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`xreach-status is-${entry.status}`}>
                          {entry.status === 'pending' ? 'Pending' : 'Tracked'}
                        </span>
                      </td>
                      <td data-label="Note">{entry.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.totalPages > 1 ? (
            <div
              className="xreach-pager"
              role="navigation"
              aria-label="X Reach pages"
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

        <article className="xreach-panel xreach-rules">
          <h2>Tracking rules</h2>
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
          <p className="xreach-example">{data.example}</p>
        </article>
      </div>
    </main>
  )
}
