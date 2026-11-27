import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FaqSection from './FaqSection.jsx'
import Header from './Header.jsx'
import HowWeHelp from './HowWeHelp.jsx'
import PlatformViewsSection from './PlatformViewsSection.jsx'
import SiteFooter from './SiteFooter.jsx'

afterEach(() => {
  cleanup()
})

describe('secciones y navegación públicas', () => {
  it('muestra las vistas previstas y respuestas frecuentes', () => {
    render(
      <MemoryRouter>
        <PlatformViewsSection />
        <FaqSection />
      </MemoryRouter>,
    )

    expect(screen.getByText('Panel del donante')).toBeTruthy()
    expect(screen.getByText('/comedor/confirmar-recepcion/:id')).toBeTruthy()
    fireEvent.click(
      screen.getByText('¿Qué pasa si el comedor no tiene transporte?'),
    )
    expect(
      screen.getByText(/No\. Son indicadores previstos en la propuesta/),
    ).toBeTruthy()
  })

  it('cierra los menús al hacer clic fuera y al navegar', () => {
    render(<Header onAuth={vi.fn()} onLogout={vi.fn()} sesionActiva={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Participa' }))
    expect(screen.getByRole('link', { name: 'Sé voluntario' })).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('link', { name: 'Sé voluntario' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Participa' }))
    const preventNavigation = (event) => event.preventDefault()
    document.addEventListener('click', preventNavigation)
    fireEvent.click(screen.getByRole('link', { name: 'Regístrate por perfil' }))
    document.removeEventListener('click', preventNavigation)
    expect(screen.queryByRole('link', { name: 'Regístrate por perfil' })).toBeNull()
  })

  it('dispara las acciones de unirse desde tarjetas y pie de página', () => {
    const onJoin = vi.fn()
    render(
      <MemoryRouter>
        <HowWeHelp onJoin={onJoin} />
        <SiteFooter onJoin={onJoin} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Conoce cómo rescatar/ }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Súmate al rescate' })[0])

    expect(onJoin).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('link', { name: 'Cómo funciona' })).toBeTruthy()
  })

  it('muestra el estado de sesión activa y permite cerrarla', () => {
    const onLogout = vi.fn()
    render(
      <Header onAuth={vi.fn()} onLogout={onLogout} sesionActiva />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
