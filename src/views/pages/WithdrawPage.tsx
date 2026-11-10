import { useEffect, useState, type FormEvent } from 'react'
import {
  connectAmbassadorWallet,
  emptyWithdrawPage,
  fetchAmbassadorWithdraw,
  requestAmbassadorWithdraw,
  requestBrowserWalletAddress,
  type WithdrawPageData,
} from '../../controllers/ambassadorWithdraw.ts'
import { getSessionToken } from '../../controllers/apiClient.ts'
import { type WithdrawFilter } from '../../models/withdraw.ts'
import {
  defaultXProfile,
  shortenAddress,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import { LazyPlaceholder } from '../components/LazyPlaceholder.tsx'
import './WithdrawPage.css'

function dollars(amount: string | number) {
  const value =
    typeof amount === 'number' ? amount : Number(String(amount).replace(/[$,]/g, ''))
  const safe = Number.isFinite(value) ? value : 0
  return safe.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function statusLabel(status: string) {
  if (status === 'sent') return 'Sent'
  if (status === 'failed') return 'Failed'
  return 'Pending'
}

export function WithdrawPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [data, setData] = useState<WithdrawPageData>(() => emptyWithdrawPage())
  const [filter, setFilter] = useState<WithdrawFilter>('all')
  const [page, setPage] = useState(1)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!getSessionToken()) {
        if (!active) return
        setData(emptyWithdrawPage())
        setError('Sign in again to load withdrawals.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const next = await fetchAmbassadorWithdraw({
          filter,
          page,
          perPage: 50,
        })
        if (!active) return
        setData(next)
        setError('')
        if (next.page !== page) setPage(next.page)
      } catch (err) {
        if (!active) return
        setData(current => ({
          ...emptyWithdrawPage(),
          filters: current.filters,
          rules: current.rules,
          example: current.example,
        }))
        setError(
          err instanceof Error ? err.message : 'Could not load withdrawals.',
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

  function chooseFilter(next: WithdrawFilter) {
    setFilter(next)
    setPage(1)
  }

  async function onConnectWallet() {
    setFormError('')
    setConnecting(true)
    try {
      const address = await requestBrowserWalletAddress()
      const connected = await connectAmbassadorWallet(address)
      setData(current => ({
        ...current,
        wallet: {
          connected: connected.connected,
          address: connected.address,
          destination: shortenAddress(connected.address),
        },
      }))
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not connect wallet.',
      )
    } finally {
      setConnecting(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!data.wallet.connected || submitting) return

    const requested = Number(String(amount).replace(/[$,]/g, ''))
    const available = Number(data.available)
    const minimum = Number(data.minAmount)

    if (!Number.isFinite(requested) || requested <= 0) {
      setFormError('Enter a valid payout amount.')
      return
    }
    if (Number.isFinite(minimum) && requested < minimum) {
      setFormError(`Minimum payout is ${dollars(data.minAmount)}.`)
      return
    }
    if (Number.isFinite(available) && requested > available) {
      setFormError('Amount exceeds your available balance.')
      return
    }

    setFormError('')
    setSubmitting(true)
    try {
      const result = await requestAmbassadorWithdraw(amount)
      setData(current => ({
        ...current,
        available: result.available || current.available,
        pending: result.pending || current.pending,
        withdrawn: result.withdrawn || current.withdrawn,
        totalEarned: result.totalEarned || current.totalEarned,
      }))
      setAmount('')
      setSubmitted(true)
      window.setTimeout(() => setSubmitted(false), 1800)

      const refreshed = await fetchAmbassadorWithdraw({
        filter,
        page: 1,
        perPage: 50,
      })
      setData(refreshed)
      if (page !== 1) setPage(1)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not request payout.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const emptyMessage =
    filter === 'pending'
      ? 'No pending withdrawals.'
      : filter === 'sent'
        ? 'No sent withdrawals yet.'
        : filter === 'failed'
          ? 'No failed withdrawals.'
          : 'No withdrawals yet.'

  const availableNumber = Number(data.available)
  const minNumber = Number(data.minAmount)
  const canWithdraw =
    Number.isFinite(availableNumber) &&
    Number.isFinite(minNumber) &&
    availableNumber >= minNumber
  const amountMin = canWithdraw ? minNumber : undefined
  const amountMax = canWithdraw ? availableNumber : undefined

  if (loading) {
    return (
      <main className="withdraw">
        <header className="withdraw-header">
          <div>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          <div className="withdraw-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>{data.ambassadorLevel}</span>
            </div>
            <img
              className="withdraw-avatar"
              src={profile.avatarUrl}
              alt={`${profile.displayName} on X`}
            />
          </div>
        </header>
        <LazyPlaceholder variant="stats" label="Loading balances…" />
        <div className="withdraw-layout" style={{ marginTop: 18 }}>
          <LazyPlaceholder variant="page" label="Loading withdrawals…" />
        </div>
      </main>
    )
  }

  return (
    <main className="withdraw">
      <header className="withdraw-header">
        <div>
          <h1>{data.title}</h1>
          <p>{data.subtitle}</p>
        </div>
        <div className="withdraw-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>{data.ambassadorLevel}</span>
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
          <p className="withdraw-value">{dollars(data.available)}</p>
          <p className="withdraw-copy">Ready to send</p>
        </article>
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Pending</p>
          <p className="withdraw-value">{dollars(data.pending)}</p>
          <p className="withdraw-copy">In processing</p>
        </article>
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Withdrawn</p>
          <p className="withdraw-value">{dollars(data.withdrawn)}</p>
          <p className="withdraw-copy">Lifetime sent</p>
        </article>
        <article className="withdraw-panel">
          <p className="withdraw-kicker">Total earned</p>
          <p className="withdraw-value">{dollars(data.totalEarned)}</p>
          <p className="withdraw-copy">All-time commissions</p>
        </article>
      </section>

      <div className="withdraw-layout">
        <div className="withdraw-main">
          <article className="withdraw-panel">
            <div className="withdraw-panel-heading">
              <h2>Request payout</h2>
              <span
                className={
                  data.wallet.connected
                    ? 'withdraw-pill'
                    : 'withdraw-pill is-muted'
                }
              >
                {data.wallet.connected ? 'Wallet ready' : 'Wallet required'}
              </span>
            </div>

            {data.wallet.connected ? (
              <form className="withdraw-form" onSubmit={onSubmit}>
                <label className="withdraw-field" htmlFor="withdraw-amount">
                  Amount (USD)
                  <input
                    id="withdraw-amount"
                    type="number"
                    min={amountMin}
                    max={amountMax}
                    step="0.01"
                    placeholder={`Min ${dollars(data.minAmount)}`}
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    required
                    disabled={submitting || !canWithdraw}
                  />
                </label>

                <div className="withdraw-destination">
                  <span>Destination</span>
                  <strong>
                    {data.wallet.destination ||
                      shortenAddress(data.wallet.address)}
                  </strong>
                </div>

                {!canWithdraw ? (
                  <p className="withdraw-status-msg" role="status">
                    You need at least {dollars(data.minAmount)} available to
                    request a payout. Current available:{' '}
                    {dollars(data.available)}.
                  </p>
                ) : null}

                {formError ? (
                  <p className="withdraw-status-msg is-error" role="alert">
                    {formError}
                  </p>
                ) : null}

                <div className="withdraw-actions">
                  <button
                    type="submit"
                    className="is-primary"
                    disabled={submitting || !canWithdraw}
                  >
                    {submitted ? 'Requested' : submitting ? 'Requesting…' : 'Withdraw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(data.available)}
                    disabled={submitting || !canWithdraw}
                  >
                    Use max
                  </button>
                </div>
                <p className="withdraw-copy">
                  Minimum payout is {dollars(data.minAmount)}. Funds leave
                  available balance once the request is submitted.
                </p>
              </form>
            ) : (
              <div className="withdraw-locked">
                <p className="withdraw-copy">
                  Connect your wallet to choose a destination for withdrawals.
                </p>
                {formError ? (
                  <p className="withdraw-status-msg is-error" role="alert">
                    {formError}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="is-primary"
                  onClick={() => void onConnectWallet()}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting…' : 'Connect wallet'}
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
              <p className="withdraw-status-msg is-error" role="alert">
                {error}
              </p>
            ) : null}

            {!error && data.entries.length === 0 ? (
              <p className="withdraw-empty">{emptyMessage}</p>
            ) : null}

            {data.entries.length > 0 ? (
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
                    {data.entries.map(entry => (
                      <tr key={entry.id}>
                        <td data-label="Date">{entry.date}</td>
                        <td data-label="Amount">{entry.amount}</td>
                        <td data-label="Destination">{entry.destination}</td>
                        <td data-label="Status">
                          <span className={`withdraw-status is-${entry.status}`}>
                            {statusLabel(entry.status)}
                          </span>
                        </td>
                        <td data-label="Note">{entry.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {data.totalPages > 1 ? (
              <div
                className="withdraw-pager"
                role="navigation"
                aria-label="Withdrawal pages"
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

        <article className="withdraw-panel withdraw-rules">
          <h2>Payout rules</h2>
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
          <p className="withdraw-example">{data.example}</p>
        </article>
      </div>
    </main>
  )
}
