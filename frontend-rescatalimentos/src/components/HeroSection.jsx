import heroImage from '../images/central_image.png'

function HeroSection({ onJoin }) {
  return (
    <section className="hero-section" id="inicio">
      <div className="hero-copy">
        <p className="eyebrow">Alimento que se comparte, comunidad que crece</p>
        <h1>
          Creamos comunidad.
          <br />
          Rescatamos alimentos.
          <br />
          Cuidamos el planeta.
        </h1>
        <p className="hero-tagline">#ÚNETEALRESCATE</p>
        <p className="hero-description">
          Conectamos alimentos en buen estado con personas y organizaciones que
          pueden aprovecharlos.
        </p>
        <button className="button button-primary" onClick={onJoin} type="button">
          Súmate al rescate
        </button>
      </div>
      <div className="hero-image-wrap">
        <img
          alt="Voluntarios de RescatAlimentos recuperando frutas y verduras"
          className="hero-image"
          fetchPriority="high"
          src={heroImage}
        />
        <div className="hero-image-caption">
          <span>Una acción sencilla</span>
          <strong>Un impacto que se multiplica</strong>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
