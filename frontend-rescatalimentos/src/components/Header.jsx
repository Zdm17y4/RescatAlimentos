import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo_rescatalimentos.png'

const menuItems = [
  {
    id: 'conoce',
    label: 'Conócenos',
    links: [
      ['El problema', '#problema'],
      ['Cómo ayudamos', '#como-ayudamos'],
      ['Nuestro impacto', '#impacto'],
      ['Cómo funciona', '#como-funciona'],
      ['Vistas por perfil', '#vistas-principales'],
      ['Preguntas frecuentes', '#preguntas'],
    ],
  },
  {
    id: 'participa',
    label: 'Participa',
    links: [
      ['Rescata alimentos', '#como-ayudamos'],
      ['Sé voluntario', '#participa'],
      ['Regístrate por perfil', '/registro'],
    ],
  },
  {
    id: 'apoya',
    label: 'Apoya nuestra labor',
    links: [
      ['Conoce cómo ayudar', '#participa'],
      ['Comparte la iniciativa', '#instagram-title'],
    ],
  },
]

function Dropdown({ id, label, links, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="nav-dropdown" ref={dropdownRef}>
      <button
        aria-controls={`menu-${id}`}
        aria-expanded={isOpen}
        className="nav-link dropdown-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 12 8">
          <path d="m1 1 5 5 5-5" />
        </svg>
      </button>
      {isOpen && (
        <div className="dropdown-panel" id={`menu-${id}`}>
          {links.map(([text, href]) => (
            <a
              href={href.startsWith('#') ? `/${href}` : href}
              key={text}
              onClick={() => {
                setIsOpen(false)
                onNavigate()
              }}
            >
              {text}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function Header({ onAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="topbar-inner">
          <p>Juntos rescatamos alimentos y cuidamos nuestro planeta.</p>
          <div className="account-actions">
            <button type="button" onClick={() => onAuth('signup')}>
              Crear cuenta
            </button>
            <button type="button" onClick={() => onAuth('login')}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
      <div className="navigation-wrap">
        <a
          aria-label="RescatAlimentos, inicio"
          className="brand"
          href="/#inicio"
          onClick={closeMobileMenu}
        >
          <img src={logo} alt="RescatAlimentos" />
        </a>
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          aria-label="Navegación principal"
          className={`main-navigation${mobileMenuOpen ? ' is-open' : ''}`}
        >
          {menuItems.map((item) => (
            <Dropdown {...item} key={item.id} onNavigate={closeMobileMenu} />
          ))}
          <a
            className="nav-link locations-link"
            href="/#participa"
            onClick={closeMobileMenu}
          >
            Comunidades
          </a>
          <a
            className="button button-donate"
            href="/#contacto"
            onClick={closeMobileMenu}
          >
            Donar
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
