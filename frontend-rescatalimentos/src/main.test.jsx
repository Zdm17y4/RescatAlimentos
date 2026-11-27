import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

vi.mock('./App.jsx', () => ({ default: () => null }))

describe('entrada de la aplicación', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('monta la aplicación en el nodo raíz', async () => {
    await import('./main.jsx')

    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    expect(createRoot.mock.results[0].value.render).toHaveBeenCalledOnce()
  })
})
