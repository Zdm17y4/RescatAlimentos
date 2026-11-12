import communityImage from '../images/create_community.png'

function InstagramSection() {
  return (
    <section aria-labelledby="instagram-title" className="instagram-section">
      <div className="instagram-photo">
        <img
          alt="Personas compartiendo alimentos y colaborando en comunidad"
          loading="lazy"
          src={communityImage}
        />
      </div>
      <div className="instagram-content">
        <p className="eyebrow">La comunidad también se encuentra en línea</p>
        <h2 id="instagram-title">Sigue el rescate en Instagram</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p>
          Conoce más sobre RescatAlimentos y acompaña las iniciativas que ayudan
          a construir una comunidad con menos desperdicio.
        </p>
        <a
          className="button instagram-button"
          href="https://www.instagram.com/mateo_ltf/"
          rel="noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect height="16" rx="4" width="16" x="4" y="4" />
            <circle cx="12" cy="12" r="3.5" />
            <circle className="instagram-dot" cx="17.5" cy="6.8" r="1" />
          </svg>
          <span>@rescatalimentos_</span>
        </a>
      </div>
    </section>
  )
}

export default InstagramSection
