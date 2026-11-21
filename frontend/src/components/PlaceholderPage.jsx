import { useLocation } from 'react-router-dom'

export default function PlaceholderPage({ title, description, children }) {
  const { pathname } = useLocation()

  return (
    <section className="page">
      <p className="page-path">{pathname}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </section>
  )
}
