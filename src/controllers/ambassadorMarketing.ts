import { apiConfig } from '../config/api.ts'
import {
  typeLabels,
  type MarketingAsset,
  type MarketingAssetType,
  type MarketingPack,
  type MarketingPlatform,
} from '../models/marketing.ts'
import { apiDownload, apiRequest } from './apiClient.ts'

export type MarketingPageData = {
  title: string
  subtitle: string
  todayNote: string
  previousTitle: string
  packs: MarketingPack[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function assetFilePath(assetId: string, download = false) {
  const query = download ? '?download=1' : ''
  return `/api/ambassador/marketing/assets/${encodeURIComponent(assetId)}/file${query}`
}

export function marketingAssetFileUrl(assetId: string, download = false) {
  return `${apiConfig.baseUrl}${assetFilePath(assetId, download)}`
}

function normalizeType(value: unknown): MarketingAssetType {
  const raw = str(value, 'image').toLowerCase()
  if (raw.includes('story')) return 'story'
  if (raw.includes('caption') || raw.includes('copy') || raw.includes('text')) {
    return 'caption'
  }
  if (raw.includes('video') || raw.includes('reel') || raw.includes('mp4')) {
    return 'video'
  }
  return 'image'
}

function normalizePlatform(value: unknown): MarketingPlatform {
  const raw = str(value, 'All').toLowerCase()
  if (raw.includes('instagram') || raw === 'ig') return 'Instagram'
  if (raw === 'x' || raw.includes('twitter')) return 'X'
  if (raw.includes('tiktok')) return 'TikTok'
  if (raw.includes('linkedin')) return 'LinkedIn'
  return 'All'
}

function formatDateLabel(value: unknown, isToday: boolean) {
  const raw = str(value)
  if (!raw) return isToday ? 'Today' : 'Earlier'
  if (isToday && !/today/i.test(raw)) return `Today · ${raw}`
  return raw
}

function extensionForType(type: MarketingAssetType) {
  switch (type) {
    case 'video':
      return 'mp4'
    case 'caption':
      return 'txt'
    case 'story':
      return 'jpg'
    default:
      return 'png'
  }
}

function normalizeAsset(raw: unknown, index: number): MarketingAsset | null {
  const row = asRecord(raw)
  if (!row) return null

  const id = str(row.id ?? row.asset_id ?? row.assetId ?? row.uuid)
  if (!id) return null

  const type = normalizeType(row.type ?? row.asset_type ?? row.kind ?? row.media_type)
  const title = str(row.title ?? row.name ?? row.label, `Asset ${index + 1}`)
  const caption = str(
    row.caption ?? row.copy ?? row.text ?? row.description ?? row.body,
  )
  const fileName = str(
    row.file_name ?? row.fileName ?? row.filename ?? row.name,
    `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creative'}.${extensionForType(type)}`,
  )
  const preview = str(
    row.preview_url ??
      row.previewUrl ??
      row.thumbnail_url ??
      row.thumbnailUrl ??
      row.image_url ??
      row.imageUrl ??
      row.url,
    marketingAssetFileUrl(id, false),
  )

  return {
    id,
    type,
    title,
    platform: normalizePlatform(row.platform ?? row.channel ?? row.network),
    caption,
    preview,
    downloadUrl: marketingAssetFileUrl(id, true),
    fileName,
  }
}

function normalizePack(raw: unknown, index: number): MarketingPack | null {
  const row = asRecord(raw)
  if (!row) return null

  const assetsRaw = Array.isArray(row.assets)
    ? row.assets
    : Array.isArray(row.items)
      ? row.items
      : Array.isArray(row.creatives)
        ? row.creatives
        : Array.isArray(row.fliers)
          ? row.fliers
          : []

  const assets = assetsRaw
    .map((asset, assetIndex) => normalizeAsset(asset, assetIndex))
    .filter((asset): asset is MarketingAsset => Boolean(asset))

  const isToday = bool(
    row.is_today ?? row.isToday ?? row.today ?? (index === 0 ? true : false),
  )
  const id = str(row.id ?? row.pack_id ?? row.packId ?? row.date, `pack-${index + 1}`)
  const dateLabel = formatDateLabel(
    row.date_label ?? row.dateLabel ?? row.label ?? row.date ?? row.day,
    isToday,
  )

  return {
    id,
    dateLabel,
    isToday,
    note: str(
      row.note ?? row.description ?? row.summary,
      `${assets.length} asset${assets.length === 1 ? '' : 's'}`,
    ),
    assets,
  }
}

export function normalizeMarketing(raw: unknown): MarketingPageData {
  const root = asRecord(raw) ?? {}
  const data = asRecord(root.marketing) ?? asRecord(root.data) ?? root

  const packsRaw = Array.isArray(data.packs)
    ? data.packs
    : Array.isArray(data.days)
      ? data.days
      : Array.isArray(data.items)
        ? data.items
        : []

  let packs = packsRaw
    .map((pack, index) => normalizePack(pack, index))
    .filter((pack): pack is MarketingPack => Boolean(pack))

  // Some APIs return a single "today" object plus "previous" list.
  const today = asRecord(data.today ?? data.current ?? data.featured)
  if (today) {
    const todayPack = normalizePack({ ...today, is_today: true }, 0)
    const previousRaw = Array.isArray(data.previous)
      ? data.previous
      : Array.isArray(data.history)
        ? data.history
        : Array.isArray(data.past)
          ? data.past
          : []
    const previous = previousRaw
      .map((pack, index) =>
        normalizePack({ ...(asRecord(pack) ?? {}), is_today: false }, index + 1),
      )
      .filter((pack): pack is MarketingPack => Boolean(pack))
    packs = todayPack ? [todayPack, ...previous] : previous
  }

  // Flat asset list with no packs.
  if (packs.length === 0) {
    const assetsRaw = Array.isArray(data.assets)
      ? data.assets
      : Array.isArray(data.creatives)
        ? data.creatives
        : Array.isArray(data.fliers)
          ? data.fliers
          : []
    const assets = assetsRaw
      .map((asset, index) => normalizeAsset(asset, index))
      .filter((asset): asset is MarketingAsset => Boolean(asset))
    if (assets.length > 0) {
      packs = [
        {
          id: 'today',
          dateLabel: 'Today',
          isToday: true,
          note: `${assets.length} asset${assets.length === 1 ? '' : 's'} ready to reshare`,
          assets,
        },
      ]
    }
  }

  if (packs.length > 0 && !packs.some(pack => pack.isToday)) {
    packs = packs.map((pack, index) => ({
      ...pack,
      isToday: index === 0,
      dateLabel:
        index === 0 && !/today/i.test(pack.dateLabel)
          ? `Today · ${pack.dateLabel}`
          : pack.dateLabel,
    }))
  }

  return {
    title: str(data.title, 'Marketing'),
    subtitle: str(
      data.subtitle ?? data.description,
      'Daily creatives from admin. Download them and reshare on your platforms.',
    ),
    todayNote: str(
      data.today_note ?? data.todayNote,
      'Admin refreshes this pack every day. Grab today’s assets before they rotate.',
    ),
    previousTitle: str(data.previous_title ?? data.previousTitle, 'Previous days'),
    packs,
  }
}

export async function fetchAmbassadorMarketing() {
  const result = await apiRequest<unknown>('/api/ambassador/marketing', {
    method: 'GET',
    auth: true,
  })
  return normalizeMarketing(result.data)
}

export async function downloadMarketingAsset(asset: MarketingAsset) {
  if (asset.type === 'caption' && asset.caption) {
    return {
      blob: new Blob([asset.caption], {
        type: 'text/plain;charset=utf-8',
      }),
      fileName: asset.fileName.endsWith('.txt')
        ? asset.fileName
        : `${asset.fileName}.txt`,
    }
  }

  const path = assetFilePath(asset.id, true)
  const result = await apiDownload(path, { auth: true })
  return {
    blob: result.blob,
    fileName: result.fileName || asset.fileName,
  }
}

export async function fetchMarketingAssetPreview(asset: MarketingAsset) {
  if (asset.type === 'caption') return null
  if (
    asset.preview &&
    !asset.preview.includes('/api/ambassador/marketing/assets/')
  ) {
    return asset.preview
  }

  const result = await apiDownload(assetFilePath(asset.id, false), { auth: true })
  return URL.createObjectURL(result.blob)
}

export { typeLabels }
