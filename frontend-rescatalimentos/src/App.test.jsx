import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App.jsx'

function openPath(path) {
  window.history.pushState({}, '', path)
}

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('muestra la página pública y navega al acceso', () => {
    openPath('/')
    render(<App />)

    expect(
      screen.getAllByRole('heading', { name: /Creamos comunidad/ })[0],
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: '¿Cómo ayudamos?' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'El impacto también se puede medir' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: '¿Cómo funciona el rescate?' }),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Encuentra tu lugar/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Conócenos' }))
    expect(screen.getByRole('button', { name: 'Conócenos' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Conócenos' }).getAttribute('aria-expanded')).toBe(
      'false',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeTruthy()
  })

  it('envía rutas protegidas a login y muestra una página 404 para rutas desconocidas', () => {
    openPath('/admin/usuarios')
    const { unmount } = render(<App />)
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeTruthy()

    unmount()
    openPath('/ruta-inexistente')
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Esta ruta aún no está disponible' }),
    ).toBeTruthy()
  })
})
