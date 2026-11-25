import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import ChoiceGroup from '../src/components/ChoiceGroup.jsx'

afterEach(() => cleanup())

describe('grupos de selección', () => {
  test('usa radios nativos con un solo valor marcado y nombre accesible', async () => {
    const user = userEvent.setup()
    let selected = 'daily'
    const view = render(
      <div>
        <button type="button">Antes</button>
        <ChoiceGroup
          name="frequency"
          legend="Frecuencia"
          value={selected}
          onChange={(next) => {
            selected = next
            view.rerender(
              <div>
                <button type="button">Antes</button>
                <ChoiceGroup
                  name="frequency"
                  legend="Frecuencia"
                  value={selected}
                  onChange={() => {}}
                  options={[
                    { id: 'daily', label: 'Diaria' },
                    { id: 'weekly', label: 'Semanal' },
                  ]}
                />
                <button type="button">Después</button>
              </div>,
            )
          }}
          options={[
            { id: 'daily', label: 'Diaria' },
            { id: 'weekly', label: 'Semanal' },
          ]}
        />
        <button type="button">Después</button>
      </div>,
    )

    const daily = screen.getByRole('radio', { name: 'Diaria' })
    const weekly = screen.getByRole('radio', { name: 'Semanal' })
    expect(daily.checked).toBe(true)
    expect(weekly.checked).toBe(false)
    expect(daily.name).toBe('frequency')
    expect(weekly.name).toBe('frequency')
    expect(screen.getByRole('group', { name: 'Frecuencia' })).toBeTruthy()

    await user.click(weekly)
    expect(selected).toBe('weekly')
    expect(screen.getByRole('radio', { name: 'Semanal' }).checked).toBe(true)
    expect(screen.getByRole('radio', { name: 'Diaria' }).checked).toBe(false)

    screen.getByRole('button', { name: 'Antes' }).focus()
    await user.tab()
    expect(document.activeElement?.getAttribute('type')).toBe('radio')
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Después' }))
  })

  test('el estado deshabilitado no recibe la selección', async () => {
    const user = userEvent.setup()
    let changed = false
    render(
      <ChoiceGroup
        name="theme"
        labelledBy="theme-label"
        value="light"
        disabled
        onChange={() => {
          changed = true
        }}
        options={[
          { id: 'light', label: 'Claro' },
          { id: 'dark', label: 'Oscuro' },
        ]}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Claro' }).disabled).toBe(true)
    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(changed).toBe(false)
  })
})
