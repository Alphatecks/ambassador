import { useMemo, useState, type FormEvent } from 'react'
import { withdraw, withdrawEntries, type WithdrawFilter } from '../../models/withdraw.ts'
import {
  defaultXProfile,
  shortenAddress,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import './WithdrawPage.css'

function dollars(amount: number) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function WithdrawPage() {
  const { xProfile, wallet, connectWallet } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [filter, setFilter] = useState<WithdrawFilter>('all')
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const visible = useMemo(() => {
    if (filter === 'all') return withdrawEntries
    return withdrawEntries.filter(entry => entry.status === filter)
  }, [filter])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wallet) return
    setSubmitted(true)
    window.setTimeout(() => setSubmitted(false), 1800)
    setAmount('')
  }

  return (
    <main className="withdraw">
      <header className="withdraw-header">
        <div>
          <h1>{withdraw.title}</h1>
          <p>{withdraw.subtitle}</p>
        </div>
        <div className="withdraw-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>Rising Ambassador</span>
          </div>
          <img
            className="withdraw-avatar"
            src={profile.avatarUrl}
            alt={`${profile.displayName} on X`}
          />
        </div>
      </header>

      <section className="withdraw-stats">
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Available</p>
          <p className="withdraw-value">{dollars(withdraw.available)}</p>
          <p className="withdraw-copy">Ready to send</p>
        </article>
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Pending</p>
          <p className="withdraw-value">{dollars(withdraw.pending)}</p>
          <p className="withdraw-copy">In processing</p>
        </article>
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Withdrawn</p>
          <p className="withdraw-value">{dollars(withdraw.withdrawn)}</p>
          <p className="withdraw-copy">Lifetime sent</p>
        </article>
      </section>

      <div className="withdraw-layout">
        <div className="withdraw-main">
          <article className="withdraw-panel">
            <div className="withdraw-panel-heading">
              <h2>Request payout</h2>
              <span className={wallet ? 'withdraw-pill' : 'withdraw-pill is-muted'}>
                {wallet ? 'Wallet ready' : 'Wallet required'}
              </span>
            </div>

            {wallet ? (
              <form className="withdraw-form" onSubmit={onSubmit}>
                <label className="withdraw-field" htmlFor="withdraw-amount">
                  Amount (USD)
                  <input
                    id="withdraw-amount"
                    type="number"
                    min={withdraw.minAmount}
                    max={withdraw.available}
                    step="0.01"
                    placeholder={`Min ${dollars(withdraw.minAmount)}`}
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    required
                  />
                </label>

                <div className="withdraw-destination">
                  <span>Destination</span>
                  <strong>{shortenAddress(wallet.address)}</strong>
                </div>

                <div className="withdraw-actions">
                  <button type="submit" className="is-primary">
                    {submitted ? 'Requested' : 'Withdraw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(String(withdraw.available))}
                  >
                    Use max
                  </button>
                </div>
                <p className="withdraw-copy">
                  Minimum payout is {dollars(withdraw.minAmount)}. Funds leave available
                  balance once the request is submitted.
                </p>
              </form>
            ) : (
              <div className="withdraw-locked">
                <p className="withdraw-copy">
                  Connect your wallet to choose a destination for withdrawals.
                </p>
                <button type="button" className="is-primary" onClick={connectWallet}>
                  Connect wallet
                </button>
              </div>
            )}
          </article>

          <article className="withdraw-panel">
            <div
              className="withdraw-filters"
              role="tablist"
              aria-label="Withdrawal status"
            >
              {withdraw.filters.map(item => (
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
              <p className="withdraw-empty">No withdrawals in this view.</p>
            ) : (
              <div className="withdraw-table-scroll">
                <table className="withdraw-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(entry => (
                      <tr key={entry.id}>
                        <td data-label="Date">{entry.date}</td>
                        <td data-label="Amount">{entry.amount}</td>
                        <td data-label="Destination">{entry.destination}</td>
                        <td data-label="Status">
                          <span className={`withdraw-status is-${entry.status}`}>
                            {entry.status === 'pending'
                              ? 'Pending'
                              : entry.status === 'sent'
                                ? 'Sent'
                                : 'Failed'}
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
        </div>

        <article className="withdraw-panel withdraw-rules">
          <h2>Payout rules</h2>
          <ul>
            {withdraw.rules.map(rule => (
              <li key={rule.title}>
                <div>
                  <strong>{rule.title}</strong>
                  <span>{rule.value}</span>
                </div>
                <p>{rule.detail}</p>
              </li>
            ))}
          </ul>
          <p className="withdraw-example">{withdraw.example}</p>
        </article>
      </div>
    </main>
  )
}
