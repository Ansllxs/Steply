export default function SuccessFeedback({ message }) {
  if (!message) return null

  return (
    <p className="success-feedback" role="status">
      <span className="success-feedback-mark" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
