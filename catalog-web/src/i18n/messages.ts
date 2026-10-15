import { DEFAULT_LOCALE, type Locale } from './locales';

type Tree = { [key: string]: string | Tree };

/** Source of truth: `en` is typed against the shape inferred from `es`, so key drift fails the build. */
const es = {
  language: {
    label: 'Idioma',
  },
  nav: {
    searchShort: 'Buscar',
    searchLabel: 'Buscar en el catálogo',
    searchPlaceholder: 'Buscar por nombre o SKU…',
    menu: 'Abrir navegación', navigation: 'Navegación principal', contact: 'Contacto', skip: 'Ir a productos',
    whatsapp: 'Escribir por WhatsApp',
  },
  hero: {
    titleLine1:'Vinilos y láminas', titleLine2:'para cada proyecto',
    description:'Materiales para arquitectura, rotulación, seguridad y diseño. Consultá disponibilidad y precio final por WhatsApp.',
    noteLine1:'Ideas que', noteLine2:'se transforman', noteLine3:'en espacios únicos',
    rollTitle:'Venta por rollo', rollBody:'Vinilos y láminas', priceTitle:'Precios en bolivianos', contactBody:'Disponibilidad y cotizaciones',
  },
  categoryDescriptions:{films:'Vinilos y láminas en rollo',tools:'Herramientas y utensilios',accessories:'Accesorios y repuestos',materials:'Planchas acrílicas, foam y lonas'},
  intro: {
    title: 'Vinilos y láminas por rollo',
    subtitle:
      'Elegí el material y consultá disponibilidad y precio final por WhatsApp.',
    note: 'Precios referenciales en bolivianos (BOB).',
  },
  search: {
    clear: 'Limpiar búsqueda',
    resultsOne: '{{count}} producto',
    resultsOther: '{{count}} productos',
    resultsFiltered: 'de {{total}}',
  },
  categories: {
    title: 'Categorías', browse:'Explorar por categoría', explore:'Explorar',
    all: 'Todos',
    films: 'Vinilos y láminas',
    tools: 'Herramientas',
    accessories: 'Accesorios',
    materials: 'Materiales',
  },
  listing: {
    title: 'Productos',
  },
  pagination: {
    label: 'Paginación',
    previous: 'Anterior',
    next: 'Siguiente',
    page: 'Página {{current}} de {{total}}',
    goToPage: 'Ir a la página {{n}}',
  },
  filters: {
    title: 'Filtros',
    open: 'Filtros',
    price: 'Precio (BOB)',
    priceMin: 'Mín.',
    priceMax: 'Máx.',
    priceHint: 'Se usa el precio por rollo o, si no aplica, por metro.',
    clear: 'Limpiar filtros',
    close: 'Cerrar',
  },
  product: {
    sku: 'SKU',
    width: 'Ancho',
    length: 'Largo',
    unit: 'Unidad',
    unitMeters: 'metros',
    unitUnits: 'unidades',
    roll: 'Rollo',
    meter: 'Metro',
    mediaAlt: '{{name}} (SKU {{sku}})',
    cta: 'Consultar por WhatsApp',
    photoMissing: 'Imagen próximamente',
  },
  state: {
    loading: 'Cargando catálogo…',
    emptyTitle: 'Sin resultados',
    emptyBody: 'Probá con otro nombre o código, o quitá los filtros.',
    emptyAction: 'Limpiar búsqueda y filtros',
    error: 'No se pudo cargar el catálogo. Intentá de nuevo más tarde.',
  },
  footer: {
    tagline: 'Importadora SUNTEK · Vinilos, láminas y herramientas',
    rights: '© {{year}} Importadora SUNTEK',
    contact: 'Consultas por WhatsApp',
  },
  whatsapp: {
    productMessage:
      'Hola SUNTEK, quiero consultar disponibilidad y precio de {{name}} (SKU: {{sku}}).',
    generalMessage: 'Hola SUNTEK, quiero consultar disponibilidad de sus materiales.',
  },
};

type Messages = typeof es;

const en: Messages = {
  language: {
    label: 'Language',
  },
  nav: {
    searchShort: 'Search',
    searchLabel: 'Search the catalog',
    searchPlaceholder: 'Search by name or SKU…',
    menu: 'Open navigation', navigation: 'Main navigation', contact: 'Contact', skip: 'Skip to products',
    whatsapp: 'Message us on WhatsApp',
  },
  hero: {
    titleLine1:'Vinyl and films', titleLine2:'for every project',
    description:'Materials for architecture, signage, safety and design. Ask about availability and final pricing on WhatsApp.',
    noteLine1:'Ideas transformed', noteLine2:'into unique', noteLine3:'spaces',
    rollTitle:'Sold by the roll', rollBody:'Vinyl and films', priceTitle:'Prices in bolivianos', contactBody:'Availability and quotations',
  },
  categoryDescriptions:{films:'Vinyl and film rolls',tools:'Tools and utensils',accessories:'Accessories and replacements',materials:'Acrylic sheets, foam and tarpaulins'},
  intro: {
    title: 'Vinyl and films by the roll',
    subtitle: 'Pick the material and ask about availability and final price on WhatsApp.',
    note: 'Reference prices in bolivianos (BOB).',
  },
  search: {
    clear: 'Clear search',
    resultsOne: '{{count}} product',
    resultsOther: '{{count}} products',
    resultsFiltered: 'of {{total}}',
  },
  categories: {
    title: 'Categories', browse:'Browse categories', explore:'Explore',
    all: 'All',
    films: 'Vinyl & Films',
    tools: 'Tools',
    accessories: 'Accessories',
    materials: 'Materials',
  },
  listing: {
    title: 'Products',
  },
  pagination: {
    label: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    page: 'Page {{current}} of {{total}}',
    goToPage: 'Go to page {{n}}',
  },
  filters: {
    title: 'Filters',
    open: 'Filters',
    price: 'Price (BOB)',
    priceMin: 'Min.',
    priceMax: 'Max.',
    priceHint: 'Uses the price per roll, or per meter when not applicable.',
    clear: 'Clear filters',
    close: 'Close',
  },
  product: {
    sku: 'SKU',
    width: 'Width',
    length: 'Length',
    unit: 'Unit',
    unitMeters: 'meters',
    unitUnits: 'units',
    roll: 'Roll',
    meter: 'Meter',
    mediaAlt: '{{name}} (SKU {{sku}})',
    cta: 'Ask on WhatsApp',
    photoMissing: 'Photo coming soon',
  },
  state: {
    loading: 'Loading catalog…',
    emptyTitle: 'No results',
    emptyBody: 'Try another name or code, or clear the filters.',
    emptyAction: 'Clear search and filters',
    error: 'The catalog could not be loaded. Please try again later.',
  },
  footer: {
    tagline: 'SUNTEK · Vinyl, Films & Tools',
    rights: '© {{year}} SUNTEK Importers',
    contact: 'Questions on WhatsApp',
  },
  whatsapp: {
    productMessage:
      'Hello SUNTEK, I would like to ask about availability and price for {{name}} (SKU: {{sku}}).',
    generalMessage: 'Hello SUNTEK, I would like to ask about the availability of your materials.',
  },
};

const messages: Record<Locale, Tree> = { es, en };

function lookup(tree: Tree, path: string[]): string | undefined {
  let node: string | Tree | undefined = tree;
  for (const part of path) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const path = key.split('.');
  const value =
    lookup(messages[locale], path) ?? lookup(messages[DEFAULT_LOCALE], path) ?? key;

  if (!params) return value;

  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;
