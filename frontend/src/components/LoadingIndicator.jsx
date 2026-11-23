import { usePreferences } from '../state/usePreferences'

export default function LoadingIndicator({ message }) {
  const { t } = usePreferences()
  const text = message || t('loading.preparing')

  return (
    <div className="loading-indicator" role="status">
      <span className="loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <p>{text}</p>
    </div>
  )
}
