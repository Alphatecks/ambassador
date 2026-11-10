import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  downloadMarketingAsset,
  fetchAmbassadorMarketing,
  fetchMarketingAssetPreview,
  type MarketingPageData,
} from '../../controllers/ambassadorMarketing.ts'
import { getSessionToken } from '../../controllers/apiClient.ts'
import { typeLabels, type MarketingAsset, type MarketingPack } from '../../models/marketing.ts'
import {
  defaultXProfile,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import { LazyPlaceholder } from '../components/LazyPlaceholder.tsx'
import './MarketingPage.css'

const MARKETING_POLL_MS = 20_000

const emptyMarketing = (): MarketingPageData => ({
  title: 'Marketing materials',
  subtitle: 'Daily creatives from admin. Download them and reshare on your platforms.',
  todayNote: 'Admin refreshes this pack every day. Grab today’s assets before they rotate.',
  previousTitle: 'Previous days',
  packs: [],
})

function marketingFingerprint(data: MarketingPageData) {
  return data.packs
    .map(
      pack =>
        `${pack.id}:${pack.dateLabel}:${pack.assets
          .map(asset => `${asset.id}:${asset.title}:${asset.caption}`)
          .join(',')}`,
    )
    .join('|')
}

function withMarketingTitle(data: MarketingPageData): MarketingPageData {
  return {
    ...data,
    title: 'Marketing materials',
  }
}

export function MarketingPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [copiedId, setCopiedId] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [marketing, setMarketing] = useState<MarketingPageData>(() => emptyMarketing())
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fingerprintRef = useRef('')
  const previewUrlsRef = useRef<Record<string, string>>({})
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    previewUrlsRef.current = previewUrls
  }, [previewUrls])

  useEffect(() => {
    let active = true
    let timer: number | null = null

    function clearObjectUrls(urls: string[]) {
      for (const url of urls) URL.revokeObjectURL(url)
    }

    async function loadPreviews(
      data: MarketingPageData,
      previous: Record<string, string>,
    ) {
      const nextPreviews: Record<string, string> = {}
      const created: string[] = []
      const keepIds = new Set(
        data.packs.flatMap(pack => pack.assets.map(asset => asset.id)),
      )

      await Promise.all(
        data.packs.flatMap(pack =>
          pack.assets.map(async asset => {
            const existing = previous[asset.id]
            if (existing) {
              nextPreviews[asset.id] = existing
              return
            }
            try {
              const preview = await fetchMarketingAssetPreview(asset)
              if (!active) return
              if (preview?.startsWith('blob:')) created.push(preview)
              if (preview) nextPreviews[asset.id] = preview
            } catch {
              if (asset.preview) nextPreviews[asset.id] = asset.preview
            }
          }),
        ),
      )

      const revoked: string[] = []
      for (const [id, url] of Object.entries(previous)) {
        if (!keepIds.has(id) && url.startsWith('blob:')) {
          revoked.push(url)
        }
      }
      clearObjectUrls(revoked)
      objectUrlsRef.current = objectUrlsRef.current
        .filter(url => !revoked.includes(url))
        .concat(created)

      return nextPreviews
    }

    async function load(options?: { silent?: boolean }) {
      const silent = Boolean(options?.silent)

      if (!getSessionToken()) {
        if (!active) return
        fingerprintRef.current = ''
        setMarketing(emptyMarketing())
        setPreviewUrls({})
        setError('Sign in again to load marketing creatives.')
        setLoading(false)
        return
      }

      if (!silent) setLoading(true)

      try {
        const data = withMarketingTitle(await fetchAmbassadorMarketing())
        if (!active) return

        const nextFingerprint = marketingFingerprint(data)
        const changed = nextFingerprint !== fingerprintRef.current
        fingerprintRef.current = nextFingerprint
        setMarketing(data)
        setError('')

        if (changed || !silent) {
          const nextPreviews = await loadPreviews(data, previewUrlsRef.current)
          if (active) setPreviewUrls(nextPreviews)
        }
      } catch (err) {
        if (!active) return
        if (!silent) {
          setMarketing(emptyMarketing())
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load marketing creatives.',
          )
        }
      } finally {
        if (active && !silent) setLoading(false)
      }
    }

    function schedule() {
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void tick()
      }, MARKETING_POLL_MS)
    }

    async function tick() {
      if (!active) return
      if (document.visibilityState === 'visible') {
        await load({ silent: true })
      }
      if (active) schedule()
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void load({ silent: true }).then(() => {
          if (active) schedule()
        })
      }
    }

    void load().then(() => {
      if (active) schedule()
    })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      if (timer !== null) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      clearObjectUrls(objectUrlsRef.current)
      objectUrlsRef.current = []
    }
  }, [])

  const todayPack = marketing.packs.find(pack => pack.isToday) ?? marketing.packs[0]
  const previousPacks = marketing.packs.filter(pack => pack.id !== todayPack?.id)

  async function copyCaption(asset: MarketingAsset) {
    try {
      await navigator.clipboard.writeText(asset.caption)
      setCopiedId(asset.id)
      window.setTimeout(() => {
        setCopiedId(current => (current === asset.id ? '' : current))
      }, 1600)
    } catch {
      setCopiedId('')
    }
  }

  async function downloadAsset(asset: MarketingAsset) {
    setDownloadingId(asset.id)
    try {
      const { blob, fileName } = await downloadMarketingAsset(asset)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName || asset.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not download this creative.',
      )
    } finally {
      setDownloadingId(current => (current === asset.id ? '' : current))
    }
  }

  function renderAsset(asset: MarketingAsset) {
    const preview = previewUrls[asset.id] || asset.preview
    return (
      <article className="marketing-asset" key={asset.id}>
        <div className="marketing-preview">
          {preview ? <img src={preview} alt="" /> : <div className="marketing-preview-empty" />}
          <span className="marketing-type">{typeLabels[asset.type]}</span>
        </div>
        <div className="marketing-asset-body">
          <div className="marketing-asset-meta">
            <h3>{asset.title}</h3>
            <span>{asset.platform}</span>
          </div>
          <p className="marketing-caption">{asset.caption || 'No caption provided.'}</p>
          <div className="marketing-actions">
            <button
              type="button"
              className="is-primary"
              onClick={() => downloadAsset(asset)}
              disabled={downloadingId === asset.id}
            >
              {downloadingId === asset.id ? 'Downloading…' : 'Download'}
            </button>
            <button type="button" onClick={() => copyCaption(asset)} disabled={!asset.caption}>
              {copiedId === asset.id ? 'Copied' : 'Copy caption'}
            </button>
          </div>
        </div>
      </article>
    )
  }

  function renderPack(pack: MarketingPack, featured = false) {
    return (
      <section className={featured ? 'marketing-pack is-today' : 'marketing-pack'} key={pack.id}>
        <div className="marketing-pack-heading">
          <div>
            <p className="marketing-pack-date">{pack.dateLabel}</p>
            <p className="marketing-pack-note">
              {featured ? marketing.todayNote : pack.note}
            </p>
          </div>
          <span className="marketing-count">
            {pack.assets.length} asset{pack.assets.length === 1 ? '' : 's'}
          </span>
        </div>
        {pack.assets.length > 0 ? (
          <div className="marketing-grid">{pack.assets.map(renderAsset)}</div>
        ) : (
          <p className="marketing-empty">No assets in this pack yet.</p>
        )}
      </section>
    )
  }

  if (loading) {
    return (
      <main className="marketing">
        <header className="marketing-header">
          <div>
            <h1>Marketing materials</h1>
            <p>{marketing.subtitle}</p>
          </div>
          <div className="marketing-profile">
            <div>
              <strong>@{profile.username}</strong>
              <span>Ambassador</span>
            </div>
            <img className="marketing-avatar" src={profile.avatarUrl} alt="" />
          </div>
        </header>
        <LazyPlaceholder variant="cards" label="Loading creatives…" rows={3} />
      </main>
    )
  }

  return (
    <main className="marketing">
      <header className="marketing-header">
        <div>
          <h1>Marketing materials</h1>
          <p>{marketing.subtitle}</p>
          {error ? (
            <p className="marketing-status is-error" role="alert">
              {error}{' '}
              {!getSessionToken() ? <Link to="/sign-in">Sign in</Link> : null}
            </p>
          ) : null}
        </div>
        <div className="marketing-profile">
          <div>
            <strong>@{profile.username}</strong>
            <span>Ambassador</span>
          </div>
          <img className="marketing-avatar" src={profile.avatarUrl} alt="" />
        </div>
      </header>

      {!error && marketing.packs.length === 0 ? (
        <p className="marketing-empty">No marketing creatives are available yet.</p>
      ) : null}

      {todayPack ? renderPack(todayPack, true) : null}

      {previousPacks.length > 0 ? (
        <section className="marketing-previous">
          <h2>{marketing.previousTitle}</h2>
          <div className="marketing-previous-list">
            {previousPacks.map(pack => renderPack(pack))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
