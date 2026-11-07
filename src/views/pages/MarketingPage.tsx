import { useState } from 'react'
import avatar from '../../../assets/images/ambassador-avatar.jpg'
import {
  marketing,
  marketingPacks,
  typeLabels,
  type MarketingAsset,
  type MarketingPack,
} from '../../models/marketing.ts'
import './MarketingPage.css'

export function MarketingPage() {
  const [copiedId, setCopiedId] = useState('')
  const todayPack = marketingPacks.find(pack => pack.isToday) ?? marketingPacks[0]
  const previousPacks = marketingPacks.filter(pack => !pack.isToday)

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
    try {
      const blob =
        asset.type === 'caption'
          ? new Blob([asset.caption], { type: 'text/plain;charset=utf-8' })
          : await (await fetch(asset.downloadUrl)).blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = asset.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      const link = document.createElement('a')
      link.href = asset.downloadUrl
      link.download = asset.fileName
      link.target = '_blank'
      link.rel = 'noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  }

  function renderAsset(asset: MarketingAsset) {
    return (
      <article className="marketing-asset" key={asset.id}>
        <div className="marketing-preview">
          <img src={asset.preview} alt="" />
          <span className="marketing-type">{typeLabels[asset.type]}</span>
        </div>
        <div className="marketing-asset-body">
          <div className="marketing-asset-meta">
            <h3>{asset.title}</h3>
            <span>{asset.platform}</span>
          </div>
          <p className="marketing-caption">{asset.caption}</p>
          <div className="marketing-actions">
            <button type="button" className="is-primary" onClick={() => downloadAsset(asset)}>
              Download
            </button>
            <button type="button" onClick={() => copyCaption(asset)}>
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
        <div className="marketing-grid">{pack.assets.map(renderAsset)}</div>
      </section>
    )
  }

  return (
    <main className="marketing">
      <header className="marketing-header">
        <div>
          <h1>{marketing.title}</h1>
          <p>{marketing.subtitle}</p>
        </div>
        <div className="marketing-profile">
          <div>
            <strong>{marketing.ambassador.name}</strong>
            <span>{marketing.ambassador.level}</span>
          </div>
          <img className="marketing-avatar" src={avatar} alt="" />
        </div>
      </header>

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
