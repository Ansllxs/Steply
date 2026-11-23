import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './state/AuthProvider.jsx'
import { PreferencesProvider } from './state/PreferencesProvider.jsx'
import { ProfileProvider } from './state/ProfileProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <AuthProvider>
          <ProfileProvider>
            <App />
          </ProfileProvider>
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
