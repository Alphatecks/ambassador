import { useEffect, useState } from 'react'
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

const emptyMarketing = (): MarketingPageData => ({
  title: 'Marketing',
  subtitle: 'Daily creatives from admin. Download them and reshare on your platforms.',
  todayNote: 'Admin refreshes this pack every day. Grab today’s assets before they rotate.',
  previousTitle: 'Previous days',
  packs: [],
})

export function MarketingPage() {
  const { xProfile } = useAmbassador()
  const profile = xProfile ?? defaultXProfile
  const [copiedId, setCopiedId] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [marketing, setMarketing] = useState<MarketingPageData>(() => emptyMarketing())
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const objectUrls: string[] = []

    async function load() {
      if (!getSessionToken()) {
        if (!active) return
        setMarketing(emptyMarketing())
        setError('Sign in again to load marketing creatives.')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await fetchAmbassadorMarketing()
        if (!active) return
        setMarketing(data)
        setError('')

        const nextPreviews: Record<string, string> = {}
        await Promise.all(
          data.packs.flatMap(pack =>
            pack.assets.map(async asset => {
              try {
                const preview = await fetchMarketingAssetPreview(asset)
                if (!active) return
                if (preview?.startsWith('blob:')) objectUrls.push(preview)
                if (preview) nextPreviews[asset.id] = preview
              } catch {
                if (asset.preview) nextPreviews[asset.id] = asset.preview
              }
            }),
          ),
        )

        if (active) setPreviewUrls(nextPreviews)
      } catch (err) {
        if (!active) return
        setMarketing(emptyMarketing())
        setError(
          err instanceof Error ? err.message : 'Could not load marketing creatives.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      for (const url of objectUrls) URL.revokeObjectURL(url)
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
            <h1>{marketing.title}</h1>
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
          <h1>{marketing.title}</h1>
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
