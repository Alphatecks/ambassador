import {
  type WithdrawEntry,
  type WithdrawFilter,
  type WithdrawRule,
  type WithdrawStatus,
  withdraw as withdrawCopy,
} from '../models/withdraw.ts'
import { apiRequest } from './apiClient.ts'

export type WithdrawWalletInfo = {
  connected: boolean
  address: string
  destination: string
}

export type WithdrawPageData = {
  title: string
  subtitle: string
  ambassadorLevel: string
  available: string
  pending: string
  withdrawn: string
  totalEarned: string
  minAmount: string
  wallet: WithdrawWalletInfo
  filters: Array<{ id: WithdrawFilter; label: string }>
  filter: WithdrawFilter
  page: number
  perPage: number
  total: number
  totalPages: number
  entries: WithdrawEntry[]
  rules: WithdrawRule[]
  example: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function moneyString(value: unknown, fallback = '0.00') {
  const raw = str(value, fallback).replace(/,/g, '')
  const parsed = Number(raw.replace(/^\$/, ''))
  if (!Number.isFinite(parsed)) return fallback
  return parsed.toFixed(2)
}

function asFilter(value: unknown): WithdrawFilter {
  const raw = str(value, 'all').toLowerCase()
  if (raw === 'pending' || raw === 'processing') return 'pending'
  if (raw === 'sent' || raw === 'paid' || raw === 'complete' || raw === 'completed') {
    return 'sent'
  }
  if (raw === 'failed' || raw === 'rejected' || raw === 'returned') return 'failed'
  return 'all'
}

function asStatus(value: unknown): WithdrawStatus {
  const raw = str(value).toLowerCase()
  if (raw === 'sent' || raw === 'paid' || raw === 'complete' || raw === 'completed') {
    return 'sent'
  }
  if (raw === 'failed' || raw === 'rejected' || raw === 'returned') return 'failed'
  return 'pending'
}

function normalizeEntry(raw: unknown): WithdrawEntry | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = str(row.id)
  if (!id) return null
  const amountRaw = str(row.amount ?? row.amount_usd ?? row.amountUsd, '0.00')
  const amount = amountRaw.startsWith('$') ? amountRaw : `$${amountRaw.replace(/^\$/, '')}`
  return {
    id,
    date: str(row.date ?? row.requested_at ?? row.requestedAt, '—'),
    amount,
    destination: str(
      row.destination ?? row.destination_wallet ?? row.destinationWallet,
      '—',
    ),
    status: asStatus(row.status),
    note: str(row.note ?? row.status_label ?? row.statusLabel),
  }
}

function normalizeRules(raw: unknown): WithdrawRule[] {
  if (!Array.isArray(raw)) return withdrawCopy.rules
  const rules = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const title = str(row.title ?? row.label)
      if (!title) return null
      return {
        title,
        value: str(row.value),
        detail: str(row.detail ?? row.description),
      }
    })
    .filter((item): item is WithdrawRule => Boolean(item))
  return rules.length ? rules : withdrawCopy.rules
}

function normalizeFilters(raw: unknown) {
  if (!Array.isArray(raw)) return withdrawCopy.filters
  const filters = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const id = asFilter(row.id ?? row.value ?? row.filter)
      return {
        id,
        label: str(
          row.label,
          id === 'all' ? 'All' : id[0].toUpperCase() + id.slice(1),
        ),
      }
    })
    .filter(
      (item): item is { id: WithdrawFilter; label: string } => Boolean(item),
    )
  return filters.length ? filters : withdrawCopy.filters
}

function normalizeWallet(raw: unknown): WithdrawWalletInfo {
  const wallet = asRecord(raw) ?? {}
  const address = str(wallet.address ?? wallet.wallet_address ?? wallet.walletAddress)
  return {
    connected: bool(wallet.connected, Boolean(address)),
    address,
    destination: str(wallet.destination, address),
  }
}

export function emptyWithdrawPage(): WithdrawPageData {
  return {
    title: withdrawCopy.title,
    subtitle: withdrawCopy.subtitle,
    ambassadorLevel: 'Level 1',
    available: '0.00',
    pending: '0.00',
    withdrawn: '0.00',
    totalEarned: '0.00',
    minAmount: '20.00',
    wallet: { connected: false, address: '', destination: '' },
    filters: withdrawCopy.filters,
    filter: 'all',
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 1,
    entries: [],
    rules: withdrawCopy.rules,
    example: withdrawCopy.example,
  }
}

export function normalizeWithdraw(raw: unknown): WithdrawPageData {
  const data = asRecord(raw) ?? {}
  const ambassador = asRecord(data.ambassador) ?? {}
  const entriesSource = data.entries ?? data.withdrawals ?? data.items ?? data.history
  const entries = Array.isArray(entriesSource)
    ? entriesSource
        .map(normalizeEntry)
        .filter((entry): entry is WithdrawEntry => Boolean(entry))
    : []

  return {
    title: str(data.title, withdrawCopy.title),
    subtitle: str(data.subtitle, withdrawCopy.subtitle),
    ambassadorLevel: str(ambassador.level ?? data.level, 'Level 1'),
    available: moneyString(
      data.available ?? data.available_balance_usd ?? data.availableBalanceUsd,
    ),
    pending: moneyString(
      data.pending ?? data.pending_balance_usd ?? data.pendingBalanceUsd,
    ),
    withdrawn: moneyString(
      data.withdrawn ?? data.withdrawn_usd ?? data.withdrawnUsd,
    ),
    totalEarned: moneyString(
      data.total_earned ?? data.totalEarned ?? data.total_earned_usd ?? data.totalEarnedUsd,
    ),
    minAmount: moneyString(
      data.min_amount ?? data.minAmount ?? data.min_amount_usd ?? data.minAmountUsd,
      '20.00',
    ),
    wallet: normalizeWallet(data.wallet),
    filters: normalizeFilters(data.filters),
    filter: asFilter(data.filter),
    page: Math.max(1, num(data.page, 1)),
    perPage: Math.max(1, num(data.per_page ?? data.perPage, 50)),
    total: Math.max(0, num(data.total)),
    totalPages: Math.max(1, num(data.total_pages ?? data.totalPages, 1)),
    entries,
    rules: normalizeRules(data.rules),
    example: str(data.example, withdrawCopy.example),
  }
}

export type FetchWithdrawInput = {
  filter?: WithdrawFilter
  page?: number
  perPage?: number
}

export async function fetchAmbassadorWithdraw(input: FetchWithdrawInput = {}) {
  const params = new URLSearchParams()
  params.set('filter', input.filter ?? 'all')
  params.set('page', String(Math.max(1, input.page ?? 1)))
  params.set('per_page', String(Math.max(1, input.perPage ?? 50)))

  const result = await apiRequest<unknown>(
    `/api/ambassador/withdraw?${params.toString()}`,
    { auth: true },
  )
  return normalizeWithdraw(result.data)
}

export async function requestAmbassadorWithdraw(amountUsd: string) {
  const amount = amountUsd.trim().replace(/^\$/, '')
  const result = await apiRequest<unknown>('/api/ambassador/withdraw', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ amount_usd: amount }),
  })
  const data = asRecord(result.data) ?? {}
  return {
    entry: normalizeEntry(data.entry),
    available: moneyString(data.available_balance_usd ?? data.availableBalanceUsd),
    pending: moneyString(data.pending_balance_usd ?? data.pendingBalanceUsd),
    withdrawn: moneyString(data.withdrawn_usd ?? data.withdrawnUsd),
    totalEarned: moneyString(data.total_earned_usd ?? data.totalEarnedUsd),
  }
}

export async function connectAmbassadorWallet(walletAddress: string) {
  const result = await apiRequest<unknown>('/api/ambassador/wallet/connect', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ wallet_address: walletAddress }),
  })
  const data = asRecord(result.data) ?? {}
  const address = str(data.address ?? data.wallet_address ?? data.walletAddress)
  return {
    connected: bool(data.connected, Boolean(address)),
    address,
  }
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function ethereumProvider(): EthereumProvider | null {
  const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum
  return ethereum && typeof ethereum.request === 'function' ? ethereum : null
}

export async function requestBrowserWalletAddress() {
  const provider = ethereumProvider()
  if (!provider) {
    throw new Error('No browser wallet found. Install MetaMask or another wallet.')
  }
  const accounts = await provider.request({ method: 'eth_requestAccounts' })
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !accounts[0]) {
    throw new Error('No wallet account was returned.')
  }
  return accounts[0]
}
