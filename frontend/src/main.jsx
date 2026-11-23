import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { PreferencesProvider } from './state/PreferencesProvider.jsx'
import { ProfileProvider } from './state/ProfileProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
