import { useMemo, useState } from 'react'
import { rewardEntries, rewards, type RewardFilter } from '../../models/rewards.ts'
import {
  defaultXProfile,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import './RewardsPage.css'

export function RewardsPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [filter, setFilter] = useState<RewardFilter>('all')

  const visible = useMemo(() => {
    if (filter === 'all') return rewardEntries
    return rewardEntries.filter(entry => entry.status === filter)
  }, [filter])

  return (
    <main className="rewards">
      <header className="rewards-header">
        <div>
          <h1>{rewards.title}</h1>
          <p>{rewards.subtitle}</p>
        </div>
        <div className="rewards-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>{rewards.ambassador.level}</span>
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
          <div className="rewards-filters" role="tablist" aria-label="Reward status">
            {rewards.filters.map(item => (
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
            <p className="rewards-empty">No approved rewards yet.</p>
          ) : (
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
                  {visible.map(entry => (
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
          )}
        </article>

        <article className="rewards-card rewards-rules">
          <h2>Qualification rules</h2>
          <ul>
            {rewards.rules.map(rule => (
              <li key={rule.title}>
                <div>
                  <strong>{rule.title}</strong>
                  <span>{rule.value}</span>
                </div>
                <p>{rule.detail}</p>
              </li>
            ))}
          </ul>
          <p className="rewards-example">{rewards.example}</p>
        </article>
      </div>
    </main>
  )
}
