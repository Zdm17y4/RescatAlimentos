export const registrationRoles = [
  {
    id: 'donante',
    apiRole: 'DONANTE',
    title: 'Donante: comercio o mercado',
    route: '/registro/donante',
    description:
      'Publica excedentes en buen estado con categoría, peso, vencimiento, necesidad de frío y dirección de recojo.',
    profile: 'Correo electrónico, contraseña y dirección opcional.',
    action: 'Registrarme como donante',
    fields: [
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'address', label: 'Dirección de la sede', required: false },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
  {
    id: 'comedor',
    apiRole: 'COMEDOR',
    title: 'Comedor u organización',
    route: '/registro/comedor',
    description:
      'Consulta los lotes disponibles y reserva los que pueda aprovechar tu comunidad.',
    profile: 'Correo electrónico, contraseña y dirección opcional.',
    action: 'Registrar mi comedor',
    fields: [
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'address', label: 'Dirección del comedor', required: false },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
  {
    id: 'voluntario',
    apiRole: 'DRIVER',
    title: 'Voluntario de logística',
    route: '/registro/voluntario',
    description:
      'Apoya los recojos cuando un comedor necesita transporte.',
    profile: 'Correo electrónico, contraseña y dirección opcional.',
    action: 'Sumarme como voluntario',
    fields: [
      { name: 'email', label: 'Correo electrónico', type: 'email' },
      { name: 'address', label: 'Dirección', required: false },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        autoComplete: 'new-password',
      },
    ],
  },
]
