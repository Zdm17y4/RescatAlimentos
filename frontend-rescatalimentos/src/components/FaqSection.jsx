const questions = [
  {
    question: '¿Qué información lleva una publicación de donación?',
    answer:
      'La propuesta contempla categoría del alimento (fresco, lácteo, carnes o abarrotes), peso en kilos, fecha y hora de vencimiento, requerimiento de cadena de frío y una fotografía.',
  },
  {
    question: '¿Cómo se encuentra un comedor cercano?',
    answer:
      'La plataforma compara la ubicación del donante con la de comedores registrados. El diseño usa como referencia un radio menor a 5 km; la disponibilidad depende de los registros y las donaciones activas.',
  },
  {
    question: '¿Qué pasa si el comedor no tiene transporte?',
    answer:
      'Al reservar el lote, el comedor puede solicitar apoyo logístico. Los voluntarios de la zona reciben los detalles de recojo, entrega, peso y necesidades de conservación.',
  },
  {
    question: '¿Cómo se confirma que el lote llegó?',
    answer:
      'La propuesta incluye revisar el estado del alimento, registrar el peso real y la temperatura cuando corresponda, y confirmar la recepción con un PIN digital de cuatro dígitos.',
  },
  {
    question: '¿Los indicadores del landing son datos en vivo?',
    answer:
      'No. Son indicadores previstos en la propuesta, como raciones equivalentes, tiempo de rescate y ahorro estimado. Este prototipo todavía no está conectado a una API ni muestra donaciones en tiempo real.',
  },
]

function FaqSection() {
  return (
    <section className="faq-section section-padding" id="preguntas">
      <div className="faq-layout">
        <div className="faq-heading">
          <p className="eyebrow">Información útil</p>
          <h2>Preguntas frecuentes</h2>
          <span aria-hidden="true" className="heading-rule" />
          <p>
            ¿Tienes dudas sobre cómo sumarte? Aquí respondemos algunas de las
            preguntas más comunes.
          </p>
          <a
            className="text-link faq-contact"
            href="https://www.instagram.com/mateo_ltf/"
            rel="noreferrer"
            target="_blank"
          >
            Escríbenos por Instagram
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="faq-list">
          {questions.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
