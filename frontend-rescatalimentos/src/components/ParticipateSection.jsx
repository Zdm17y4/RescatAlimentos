import { Link } from 'react-router-dom'
import { registrationRoles } from '../data/registrationRoles.js'

function ParticipateSection() {
  return (
    <section className="participate-section section-padding" id="participa">
      <div className="section-heading">
        <p className="eyebrow">Hay muchas formas de ayudar</p>
        <h2>Encuentra tu lugar en el rescate</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p className="section-intro">
          Elige un perfil para conocer la información necesaria y acceder a su
          formulario de registro.
        </p>
      </div>
      <div className="participant-grid">
        {registrationRoles.map((role, index) => (
          <article className="participant-card" key={role.id}>
            <span className="participant-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
            <p className="participant-profile">
              <strong>Datos de registro:</strong> {role.profile}
            </p>
            <Link className="text-link" to={role.route}>
              {role.action}
              <span aria-hidden="true">→</span>
            </Link>
            <span className="route-label">Ruta: {role.route}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ParticipateSection
