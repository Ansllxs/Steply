import logo from '../assets/logo.png'

export default function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <img
        className="dashboard-logo"
        src={logo}
        alt="Steply"
        width="52"
        height="34"
      />
      <p className="dashboard-wordmark">STEPLY</p>
    </header>
  )
}
