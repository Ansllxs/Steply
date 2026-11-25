import logo from '../assets/logo.png'

export default function DashboardHeader({ label = 'STEPLY', showWordmark = true }) {
  return (
    <header className="dashboard-header">
      <img
        className="dashboard-logo"
        src={logo}
        alt="Steply"
        width="52"
        height="34"
      />
      {showWordmark ? <p className="dashboard-wordmark">{label}</p> : null}
    </header>
  )
}
