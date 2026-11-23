import checkIcon from '../assets/icon-check.svg'

export default function AuthSuccess({ message }) {
  return (
    <div className="auth-success" role="status">
      <span className="auth-success-mark" aria-hidden="true">
        <img src={checkIcon} alt="" width="18" height="18" />
      </span>
      <p>{message}</p>
    </div>
  )
}
