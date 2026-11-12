import foodImage from '../images/rescue_food.png'
import environmentImage from '../images/help_environment.png'
import communityImage from '../images/create_community.png'

const waysToHelp = [
  {
    title: 'Rescatamos alimentos',
    image: foodImage,
    alt: 'Persona colaborando en el rescate de alimentos frescos',
    description:
      'Facilitamos que comercios y productores compartan excedentes en buen estado con organizaciones locales.',
    action: 'Conoce cómo rescatar',
  },
  {
    title: 'Cuidamos el ambiente',
    image: environmentImage,
    alt: 'Voluntarias cosechando verduras en un huerto comunitario',
    description:
      'Aprovechar los alimentos ayuda a reducir el desperdicio y el impacto que genera en nuestro planeta.',
    action: 'Súmate como voluntario',
  },
  {
    title: 'Creamos comunidad',
    image: communityImage,
    alt: 'Personas preparando alimentos juntas',
    description:
      'Unimos a donantes, organizaciones y voluntarios para fortalecer las redes de apoyo de cada comunidad.',
    action: 'Conecta con nosotros',
  },
]

function HowWeHelp({ onJoin }) {
  return (
    <section className="how-section section-padding" id="como-ayudamos">
      <div className="section-heading">
        <p className="eyebrow">Así hacemos la diferencia</p>
        <h2>¿Cómo ayudamos?</h2>
        <span aria-hidden="true" className="heading-rule" />
      </div>
      <div className="help-grid">
        {waysToHelp.map((item) => (
          <article className="help-card" key={item.title}>
            <h3>{item.title}</h3>
            <img alt={item.alt} loading="lazy" src={item.image} />
            <p>{item.description}</p>
            <button className="text-link" onClick={onJoin} type="button">
              {item.action}
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HowWeHelp
