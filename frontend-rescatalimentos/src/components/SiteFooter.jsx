import logo from '../assets/logo_rescatalimentos.png'

function SiteFooter({ onJoin }) {
  return (
    <footer className="site-footer" id="contacto">
      <div className="footer-cta">
        <div>
          <p className="eyebrow">Juntos hacemos que suceda</p>
          <h2>Un alimento rescatado puede cambiar mucho.</h2>
        </div>
        <button className="button button-primary" onClick={onJoin} type="button">
          Súmate al rescate
        </button>
      </div>
      <div className="footer-columns">
        <section className="footer-contact">
          <h3>Contacto</h3>
          <p>
            ¿Tienes alimentos para compartir o quieres colaborar con una
            comunidad? Escríbenos y conversemos.
          </p>
          <a
            className="footer-instagram-link"
            href="https://www.instagram.com/mateo_ltf/"
            rel="noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect height="16" rx="4" width="16" x="4" y="4" />
              <circle cx="12" cy="12" r="3.5" />
              <circle className="instagram-dot" cx="17.5" cy="6.8" r="1" />
            </svg>
            @rescatalimentos_
          </a>
        </section>
        <nav aria-label="Recursos" className="footer-links">
          <h3>Explora</h3>
          <a href="/#como-ayudamos">Cómo ayudamos</a>
          <a href="/#como-funciona">Cómo funciona</a>
          <a href="/#impacto">Nuestro impacto</a>
          <a href="/#preguntas">Preguntas frecuentes</a>
        </nav>
        <section className="footer-about">
          <h3>Sobre RescatAlimentos</h3>
          <p>
            Conectamos comercios que tienen excedentes de alimentos con
            comedores y organizaciones comunitarias. También buscamos facilitar
            el apoyo de personas voluntarias para que cada rescate llegue a buen
            destino.
          </p>
        </section>
        <div className="footer-brand">
          <a aria-label="RescatAlimentos, inicio" href="/">
            <img src={logo} alt="RescatAlimentos" />
          </a>
          <p>Rescatamos alimentos. Fortalecemos comunidades.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} RescatAlimentos</span>
        <a href="/#inicio">Volver al inicio ↑</a>
      </div>
    </footer>
  )
}

export default SiteFooter
