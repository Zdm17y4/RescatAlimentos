const processSteps = [
  {
    number: '01',
    title: 'El comercio publica un lote',
    description:
      'Desde su panel web, registra categoría, peso en kilos, vencimiento, necesidad de cadena de frío y una foto, sin coordinaciones manuales. El flujo contempla productos próximos a vencer entre 6 y 48 horas.',
  },
  {
    number: '02',
    title: 'La plataforma busca cercanía',
    description:
      'El sistema cruza la ubicación del donante con comedores registrados y les muestra lotes disponibles en su zona. El radio menor a 5 km es una referencia del diseño.',
  },
  {
    number: '03',
    title: 'El comedor reserva y elige',
    description:
      'La organización evalúa cercanía, cantidad y necesidad del comedor antes de reservar. Puede recogerlo con movilidad propia dentro de la ventana asignada o solicitar transporte.',
  },
  {
    number: '04',
    title: 'Se asigna la ruta',
    description:
      'Si hace falta logística, voluntarios reciben los puntos de recojo y entrega, el peso y los requisitos de conservación. Al aceptar, la ruta queda asignada.',
  },
  {
    number: '05',
    title: 'Se verifica la recepción',
    description:
      'En el comedor se revisan el estado, el peso real y la temperatura cuando corresponda. La recepción se confirma con un PIN digital de cuatro dígitos.',
  },
  {
    number: '06',
    title: 'Se completa la trazabilidad',
    description:
      'Con la confirmación, el lote pasa a estado completado. El equipo administrador revisa la trazabilidad y los indicadores de seguimiento.',
  },
]

function ProcessSection() {
  return (
    <section className="process-section section-padding" id="como-funciona">
      <div className="section-heading">
        <p className="eyebrow">Flujo previsto de la plataforma</p>
        <h2>¿Cómo funciona el rescate?</h2>
        <span aria-hidden="true" className="heading-rule" />
        <p className="section-intro">
          Desde la publicación del excedente hasta la confirmación de entrega,
          cada etapa ayuda a coordinar el rescate con claridad.
        </p>
      </div>
      <div className="process-grid">
        {processSteps.map((step) => (
          <article className="process-card" key={step.number}>
            <span className="process-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ProcessSection
