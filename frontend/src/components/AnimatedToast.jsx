export default function AnimatedToast({ message, tone = 'neutral' }) {
  if (!message) return null

  return (
    <p className={`animated-toast is-${tone}`} role="status">
      {message}
    </p>
  )
}
