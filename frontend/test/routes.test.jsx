import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth } from '../src/components/RouteGuards.jsx'
import { AuthContext } from '../src/state/auth-context.js'
import { PreferencesContext } from '../src/state/preferences-context.js'

afterEach(() => cleanup())

function renderRoutes(auth, path) {
  return render(
    <PreferencesContext.Provider value={{ t: (key) => key }}>
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<RedirectIfAuthenticated><p>Pantalla de acceso</p></RedirectIfAuthenticated>} />
          <Route path="/dashboard" element={<RequireAuth><p>Panel privado</p></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
    </PreferencesContext.Provider>
  )
}

describe('rutas protegidas', () => {
  test('sin sesión manda al acceso', () => {
    renderRoutes({ user: null, status: 'ready', holding: false }, '/dashboard')
    expect(screen.getByText('Pantalla de acceso')).toBeTruthy()
  })

  test('una sesión válida entra al panel', () => {
    renderRoutes({ user: { id: '1', nombre: 'Ana' }, status: 'ready', holding: false }, '/dashboard')
    expect(screen.getByText('Panel privado')).toBeTruthy()
  })

  test('mientras la sesión se comprueba no muestra el panel', () => {
    renderRoutes({ user: null, status: 'loading', holding: false }, '/dashboard')
    expect(screen.queryByText('Panel privado')).toBeNull()
    expect(screen.queryByText('Pantalla de acceso')).toBeNull()
  })

  test('quien ya entró no vuelve al formulario de acceso', () => {
    renderRoutes({ user: { id: '1' }, status: 'ready', holding: false }, '/login')
    expect(screen.getByText('Panel privado')).toBeTruthy()
  })
})
