import impactImage from '../images/central_image.png'

const impactMetrics = [
  {
    value: 'KG',
    title: 'Alimentos rescatados',
    detail:
      'Contador previsto para mostrar los kilos de alimentos redistribuidos.',
  },
  {
    value: 'RAE',
    title: 'Raciones equivalentes',
    detail:
      'Estimación de raciones servidas: la propuesta considera aproximadamente tres raciones por kilo.',
  },
  {
    value: 'S/.',
    title: 'Valor redistribuido',
    detail:
      'Ahorro presupuestario estimado con precios mayoristas de referencia en Lima.',
  },
  {
    value: '%D',
    title: 'Discrepancia de peso',
    detail:
      'Variación porcentual entre el peso declarado y el peso real recibido, para auditar cada lote.',
  },
  {
    value: 'MIN',
    title: 'Tiempo de rescate',
    detail:
      'Tiempo promedio desde la publicación hasta la confirmación de recepción con PIN.',
  },
]

function ImpactSection() {
  return (
    <section
      aria-labelledby="impact-title"
      className="impact-section"
      id="impacto"
      style={{ '--impact-image': `url("${impactImage}")` }}
    >
      <div className="impact-content">
        <p className="eyebrow">Seguimiento transparente</p>
        <h2 id="impact-title">El impacto también se puede medir</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p className="impact-intro">
          La propuesta contempla contadores de kilos, raciones equivalentes y
          valor de alimentos, además de indicadores para auditar y mejorar cada
          rescate.
        </p>
        <div className="impact-grid">
          {impactMetrics.map((metric) => (
            <article className="impact-item" key={metric.title}>
              <span className="impact-number">{metric.value}</span>
              <h3>{metric.title}</h3>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
        <p className="impact-note">
          Métricas previstas para conectarse a la API. Como el backend aún no
          está conectado, no se muestran cifras en tiempo real.
        </p>
      </div>
    </section>
  )
}

export default ImpactSection
