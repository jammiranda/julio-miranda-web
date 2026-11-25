// Plantillas de espacio: categorías iniciales según para qué se use.
const c = (tipo, emoji, name, plan = null) => ({ tipo, emoji, name, plan });

const BASE_IN = [c('in', '💼', 'Sueldo'), c('in', '🧾', 'Trabajos extra'), c('in', '✨', 'Otros ingresos')];

export const TEMPLATES = {
  hogar: {
    label: 'Hogar / familia', emoji: '🏠',
    cats: [
      c('out', '🛒', 'Súper y almacén'), c('out', '🏠', 'Alquiler / expensas'), c('out', '💡', 'Servicios'),
      c('out', '🎓', 'Colegio y educación'), c('out', '🩺', 'Salud / prepaga'), c('out', '🚗', 'Auto y transporte'),
      c('out', '💳', 'Tarjetas'), c('out', '🧹', 'Ayuda en casa'), c('out', '🎉', 'Salidas y ocio'),
      c('out', '👕', 'Ropa'), c('out', '🐾', 'Mascotas'), c('out', '📦', 'Varios'), ...BASE_IN,
    ],
    pagos: ['Transferencia', 'Débito', 'Efectivo', 'Crédito'],
  },
  pareja: {
    label: 'Pareja', emoji: '💞',
    cats: [
      c('out', '🛒', 'Súper'), c('out', '🏠', 'Alquiler / expensas'), c('out', '💡', 'Servicios'),
      c('out', '🍽️', 'Salidas'), c('out', '✈️', 'Viajes'), c('out', '🚗', 'Transporte'),
      c('out', '💳', 'Tarjetas'), c('out', '📦', 'Varios'), ...BASE_IN,
    ],
    pagos: ['Transferencia', 'Débito', 'Efectivo', 'Crédito'],
  },
  personal: {
    label: 'Personal', emoji: '🙋',
    cats: [
      c('out', '🛒', 'Comida'), c('out', '🏠', 'Vivienda'), c('out', '💡', 'Servicios'), c('out', '🚌', 'Transporte'),
      c('out', '📱', 'Suscripciones'), c('out', '🎉', 'Salidas'), c('out', '🩺', 'Salud'), c('out', '💳', 'Tarjetas'),
      c('out', '📦', 'Varios'), ...BASE_IN,
    ],
    pagos: ['Transferencia', 'Débito', 'Efectivo', 'Crédito'],
  },
  negocio: {
    label: 'Emprendimiento', emoji: '🧰',
    cats: [
      c('out', '📦', 'Mercadería / insumos'), c('out', '🏬', 'Alquiler del local'), c('out', '💡', 'Servicios'),
      c('out', '👥', 'Sueldos y honorarios'), c('out', '📣', 'Publicidad'), c('out', '🧾', 'Impuestos (AFIP/ARCA)'),
      c('out', '🚚', 'Envíos y logística'), c('out', '💻', 'Software'), c('out', '🏦', 'Comisiones bancarias'),
      c('in', '🛍️', 'Ventas'), c('in', '🧾', 'Servicios prestados'), c('in', '✨', 'Otros ingresos'),
    ],
    pagos: ['Transferencia', 'Mercado Pago', 'Efectivo', 'Débito', 'Crédito'],
  },
  grupo: {
    label: 'Viaje / grupo', emoji: '🧳',
    cats: [
      c('out', '🏨', 'Alojamiento'), c('out', '✈️', 'Pasajes'), c('out', '🍽️', 'Comidas'), c('out', '🚕', 'Traslados'),
      c('out', '🎟️', 'Excursiones'), c('out', '🛒', 'Compras'), c('out', '📦', 'Varios'), c('in', '💸', 'Aportes al pozo'),
    ],
    pagos: ['Efectivo', 'Transferencia', 'Débito', 'Crédito'],
  },
};
