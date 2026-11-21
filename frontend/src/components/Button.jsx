import { Link } from 'react-router-dom'

export default function Button({ to, variant = 'primary', children }) {
  const className = `btn btn-${variant}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  )
}
