import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

const Button = forwardRef(function Button(
  { to, variant = 'primary', type = 'button', onClick, state, disabled = false, children },
  ref,
) {
  const className = `btn btn-${variant}`

  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        className={className}
        state={state}
        aria-disabled={disabled || undefined}
      >
        {children}
      </Link>
    )
  }

  return (
    <button ref={ref} type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
})

export default Button
