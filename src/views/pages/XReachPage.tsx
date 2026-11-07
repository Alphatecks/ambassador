import { useMemo, useState } from 'react'
import {
  formatCount,
  xPosts,
  xReach,
  type XPostFilter,
} from '../../models/xReach.ts'
import { defaultXProfile, useAmbassador } from '../../providers/AmbassadorContext.tsx'
import './XReachPage.css'

export function XReachPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [filter, setFilter] = useState<XPostFilter>('all')

  const visible = useMemo(() => {
    if (filter === 'all') return xPosts
    return xPosts.filter(entry => entry.status === filter)
  }, [filter])

  return (
    <main className="xreach">
      <header className="xreach-header">
        <div>
          <h1>{xReach.title}</h1>
          <p>{xReach.subtitle}</p>
        </div>
        <div className="xreach-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>Connected on X</span>
          </div>
          <img
            className="xreach-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} on X`}
          />
        </div>
      </header>

      <section className="xreach-stats">
        {xReach.stats.map(stat => (
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
            {xReach.filters.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={filter === item.id ? 'is-active' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="xreach-empty">No tracked posts yet.</p>
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
                  {visible.map(entry => (
                    <tr key={entry.id}>
                      <td data-label="Date">{entry.date}</td>
                      <td data-label="Post">
                        <a className="xreach-post-link" href={entry.url} target="_blank" rel="noreferrer">
                          {entry.preview}
                        </a>
                      </td>
                      <td data-label="Impressions">{formatCount(entry.impressions)}</td>
                      <td data-label="Engagement">
                        {formatCount(entry.likes + entry.reposts + entry.replies)}
                        <span className="xreach-engagement">
                          {entry.likes} likes · {entry.reposts} reposts · {entry.replies} replies
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
        </article>

        <article className="xreach-panel xreach-rules">
          <h2>Tracking rules</h2>
          <ul>
            {xReach.rules.map(rule => (
              <li key={rule.title}>
                <div>
                  <strong>{rule.title}</strong>
                  <span>{rule.value}</span>
                </div>
                <p>{rule.detail}</p>
              </li>
            ))}
          </ul>
          <p className="xreach-example">{xReach.example}</p>
        </article>
      </div>
    </main>
  )
}
