import { usePreferences } from '../state/usePreferences'

export default function LoadingSkeleton({ message }) {
  const { t } = usePreferences()
  const text = message || t('loading.preparing')

  return (
    <div className="loading-skeleton" role="status">
      <span className="loading-skeleton-media" aria-hidden="true" />
      <span className="loading-skeleton-line" aria-hidden="true" />
      <span className="loading-skeleton-line is-short" aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}
