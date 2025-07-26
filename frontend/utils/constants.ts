// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  DASHBOARD_SETTINGS: 'dashboard_settings',
  SEARCH_HISTORY: 'search_history',
  RECENT_PRODUCTS: 'recent_products',
} as const;

// Currency and Number Formatting
export const CURRENCY_CONFIG = {
  LOCALE: 'es-CO',
  CURRENCY: 'COP',
  FORMAT_OPTIONS: {
    style: 'currency' as const,
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
} as const;

// Date Formatting
export const DATE_CONFIG = {
  LOCALE: 'es-CO',
  SHORT_FORMAT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  LONG_FORMAT: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
} as const;

// Colombian Car Brands
export const CAR_BRANDS = [
  'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda',
  'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Peugeot', 'Renault', 'Suzuki',
  'Toyota', 'Volkswagen', 'Volvo', 'Jeep', 'Land Rover', 'Lexus',
] as const;

// Fuel Types
export const FUEL_TYPES = [
  'Gasolina',
  'Diésel',
  'Híbrido',
  'Eléctrico',
  'GLP',
  'GNV',
] as const;

// Transmission Types
export const TRANSMISSION_TYPES = [
  'Manual',
  'Automática',
  'Semiautomática',
  'CVT',
] as const;

// Vehicle Conditions
export const VEHICLE_CONDITIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'usado', label: 'Usado' },
] as const;

// Colombian Cities
export const COLOMBIAN_CITIES = [
  'Bogotá, D.C.',
  'Medellín, Antioquia',
  'Cali, Valle del Cauca',
  'Barranquilla, Atlántico',
  'Cartagena, Bolívar',
  'Cúcuta, Norte de Santander',
  'Bucaramanga, Santander',
  'Ibagué, Tolima',
  'Pereira, Risaralda',
  'Santa Marta, Magdalena',
  'Manizales, Caldas',
  'Villavicencio, Meta',
  'Neiva, Huila',
  'Armenia, Quindío',
  'Pasto, Nariño',
] as const;

// Price Ranges (in COP)
export const PRICE_RANGES = [
  { min: 0, max: 30000000, label: 'Hasta $30M' },
  { min: 30000000, max: 50000000, label: '$30M - $50M' },
  { min: 50000000, max: 70000000, label: '$50M - $70M' },
  { min: 70000000, max: 100000000, label: '$70M - $100M' },
  { min: 100000000, max: 150000000, label: '$100M - $150M' },
  { min: 150000000, max: Infinity, label: 'Más de $150M' },
] as const;

// Year Ranges
export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_YEAR = 1990;
export const YEAR_RANGES = [
  { min: CURRENT_YEAR - 2, max: CURRENT_YEAR, label: `${CURRENT_YEAR - 2} - ${CURRENT_YEAR}` },
  { min: CURRENT_YEAR - 5, max: CURRENT_YEAR - 3, label: `${CURRENT_YEAR - 5} - ${CURRENT_YEAR - 3}` },
  { min: CURRENT_YEAR - 10, max: CURRENT_YEAR - 6, label: `${CURRENT_YEAR - 10} - ${CURRENT_YEAR - 6}` },
  { min: MIN_YEAR, max: CURRENT_YEAR - 11, label: `${MIN_YEAR} - ${CURRENT_YEAR - 11}` },
] as const;

// Mileage Ranges (in kilometers)
export const MILEAGE_RANGES = [
  { min: 0, max: 20000, label: 'Hasta 20.000 km' },
  { min: 20000, max: 50000, label: '20.000 - 50.000 km' },
  { min: 50000, max: 100000, label: '50.000 - 100.000 km' },
  { min: 100000, max: 200000, label: '100.000 - 200.000 km' },
  { min: 200000, max: Infinity, label: 'Más de 200.000 km' },
] as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  PRICE_DROP: 'price_drop',
  PRICE_ALERT: 'price_alert',
  PRODUCT_UNAVAILABLE: 'product_unavailable',
  SYSTEM: 'system',
} as const;

// Alert Types
export const ALERT_TYPES = [
  { value: 'below', label: 'Precio por debajo de' },
  { value: 'above', label: 'Precio por encima de' },
  { value: 'change', label: 'Cualquier cambio de precio' },
] as const;

// Notification Methods
export const NOTIFICATION_METHODS = [
  { value: 'browser', label: 'Notificación del navegador' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'both', label: 'Ambos' },
] as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGES_TO_SHOW: 5,
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  GRAY: '#6b7280',
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  MERCADOLIBRE_URL: /^https?:\/\/(www\.)?(carro\.)?mercadolibre\.com\.co\//,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+57)?[0-9]{10}$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  AUTH_FAILED: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
  INVALID_URL: 'URL de MercadoLibre no válida.',
  PRODUCT_NOT_FOUND: 'Producto no encontrado.',
  PRICE_ALERT_EXISTS: 'Ya tienes una alerta para este producto.',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_TRACKED: 'Producto agregado al seguimiento exitosamente.',
  ALERT_CREATED: 'Alerta de precio creada exitosamente.',
  ALERT_UPDATED: 'Alerta de precio actualizada exitosamente.',
  ALERT_DELETED: 'Alerta de precio eliminada exitosamente.',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente.',
  SETTINGS_SAVED: 'Configuración guardada exitosamente.',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_PRICE_PREDICTIONS: false,
  ENABLE_SOCIAL_SHARING: false,
} as const; 