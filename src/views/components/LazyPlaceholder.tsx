import './LazyPlaceholder.css'

type LazyPlaceholderVariant = 'page' | 'table' | 'cards' | 'stats' | 'side' | 'line'

type LazyPlaceholderProps = {
  variant?: LazyPlaceholderVariant
  label?: string
  rows?: number
  className?: string
}

function Bone({ className = '' }: { className?: string }) {
  return <span className={`lazy-bone ${className}`.trim()} aria-hidden="true" />
}

export function LazyPlaceholder({
  variant = 'page',
  label = 'Loading…',
  rows = 6,
  className = '',
}: LazyPlaceholderProps) {
  return (
    <div
      className={`lazy-placeholder is-${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>

      {variant === 'line' ? <Bone className="lazy-bone-line" /> : null}

      {variant === 'stats' ? (
        <div className="lazy-stats">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="lazy-stat" key={index}>
              <Bone className="lazy-bone-xs" />
              <Bone className="lazy-bone-lg" />
              <Bone className="lazy-bone-sm" />
            </div>
          ))}
        </div>
      ) : null}

      {variant === 'cards' ? (
        <div className="lazy-cards">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="lazy-card" key={index}>
              <Bone className="lazy-bone-media" />
              <Bone className="lazy-bone-md" />
              <Bone className="lazy-bone-sm" />
            </div>
          ))}
        </div>
      ) : null}

      {variant === 'table' ? (
        <div className="lazy-table">
          <Bone className="lazy-bone-toolbar" />
          {Array.from({ length: rows }, (_, index) => (
            <div className="lazy-row" key={index}>
              <Bone className="lazy-bone-cell" />
              <Bone className="lazy-bone-cell" />
              <Bone className="lazy-bone-cell is-short" />
              <Bone className="lazy-bone-cell is-short" />
            </div>
          ))}
        </div>
      ) : null}

      {variant === 'side' ? (
        <div className="lazy-side">
          <Bone className="lazy-bone-md" />
          <Bone className="lazy-bone-lg" />
          <Bone className="lazy-bone-sm" />
          <Bone className="lazy-bone-md" />
          <Bone className="lazy-bone-sm" />
        </div>
      ) : null}

      {variant === 'page' ? (
        <>
          <div className="lazy-page-header">
            <div>
              <Bone className="lazy-bone-title" />
              <Bone className="lazy-bone-md" />
            </div>
            <Bone className="lazy-bone-avatar" />
          </div>
          <div className="lazy-page-body">
            <div className="lazy-page-main">
              <div className="lazy-panel">
                <Bone className="lazy-bone-md" />
                <Bone className="lazy-bone-lg" />
                <Bone className="lazy-bone-toolbar" />
              </div>
              <div className="lazy-panel">
                <Bone className="lazy-bone-toolbar" />
                {Array.from({ length: Math.min(rows, 5) }, (_, index) => (
                  <div className="lazy-row" key={index}>
                    <Bone className="lazy-bone-cell" />
                    <Bone className="lazy-bone-cell" />
                    <Bone className="lazy-bone-cell is-short" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lazy-page-aside">
              <div className="lazy-panel">
                <Bone className="lazy-bone-md" />
                <Bone className="lazy-bone-lg" />
                <Bone className="lazy-bone-sm" />
              </div>
              <div className="lazy-panel">
                <Bone className="lazy-bone-md" />
                <Bone className="lazy-bone-sm" />
                <Bone className="lazy-bone-sm" />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
