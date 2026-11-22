import { Link } from 'react-router-dom'

export default function Button({ to, variant = 'primary', type = 'button', children }) {
  const className = `btn btn-${variant}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={className}>
      {children}
    </button>
  )
}
