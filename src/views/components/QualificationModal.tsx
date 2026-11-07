import { useEffect, useId, useRef, useState } from 'react'
import { qualification, type QualificationStepId } from '../../models/qualification.ts'
import './QualificationModal.css'

type QualificationModalProps = {
  onClose: () => void
}

export function QualificationModal({ onClose }: QualificationModalProps) {
  const titleId = useId()
  const targetsRef = useRef<HTMLDivElement>(null)
  const [stepId, setStepId] = useState<QualificationStepId>('rising')
  const [targetIndex, setTargetIndex] = useState(0)
  const step = qualification.steps.find(item => item.id === stepId) ?? qualification.steps[0]

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    setTargetIndex(0)
    const track = targetsRef.current
    if (track) track.scrollTo({ left: 0 })
  }, [stepId])

  function selectStep(nextId: QualificationStepId) {
    setStepId(nextId)
  }

  function onTargetsScroll() {
    const track = targetsRef.current
    if (!track) return
    const cards = Array.from(track.querySelectorAll<HTMLElement>('article'))
    let closest = 0
    let best = Number.POSITIVE_INFINITY
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - track.scrollLeft)
      if (distance < best) {
        best = distance
        closest = index
      }
    })
    setTargetIndex(closest)
  }

  function goToTarget(index: number) {
    const track = targetsRef.current
    if (!track) return
    const card = track.querySelectorAll<HTMLElement>('article')[index]
    if (!card) return
    setTargetIndex(index)
    track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }

  return (
    <div className="qualify-backdrop" onClick={onClose}>
      <section
        className="qualify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={event => event.stopPropagation()}
      >
        <button className="qualify-close" type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <h2 id={titleId}>{qualification.title}</h2>

        <div className="qualify-tabs" role="tablist" aria-label="Ambassador steps">
          {qualification.steps.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === step.id}
              className={item.id === step.id ? 'is-active' : ''}
              onClick={() => selectStep(item.id)}
            >
              {item.tab}
            </button>
          ))}
        </div>

        <div className="qualify-heading">
          <div>
            <p className="qualify-name">{step.name}</p>
            <div className="qualify-reward-row">
              <span className="qualify-reward">{step.reward}</span>
              <span className="qualify-total">{step.total}</span>
            </div>
            <p className="qualify-incremental">{step.incremental}</p>
          </div>
          <span className={`qualify-status is-${step.id}`}>{step.status}</span>
        </div>

        <p className="qualify-required">{qualification.required}</p>

        <div
          className="qualify-targets"
          ref={targetsRef}
          onScroll={onTargetsScroll}
          aria-label="Qualification targets"
        >
          {step.targets.map(target => (
            <article key={target.title}>
              <h3>{target.title}</h3>
              <p>{target.detail}</p>
              <strong>{target.value}</strong>
            </article>
          ))}
        </div>

        <div className="qualify-dots" role="tablist" aria-label="Target slides">
          {step.targets.map((target, index) => (
            <button
              key={target.title}
              type="button"
              role="tab"
              aria-label={target.title}
              aria-selected={index === targetIndex}
              className={index === targetIndex ? 'is-active' : ''}
              onClick={() => goToTarget(index)}
            />
          ))}
        </div>

        <p className="qualify-unlock-title">{qualification.unlockTitle}</p>
        <ol className="qualify-unlocks">
          {qualification.unlocks.map(item => (
            <li key={item.index}>
              <span>{item.index}</span>
              {item.text}
            </li>
          ))}
        </ol>

        <p className="qualify-withdraw">
          <span aria-hidden="true">i</span>
          {qualification.withdrawNote}
        </p>

        <div className="qualify-footer">
          <p>
            <span aria-hidden="true">i</span>
            {qualification.claimNote}
          </p>
          <button type="button">{step.rewardLabel}</button>
        </div>
      </section>
    </div>
  )
}
