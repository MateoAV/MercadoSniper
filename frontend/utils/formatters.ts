import { CURRENCY_CONFIG, DATE_CONFIG } from './constants';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format currency values for Colombian Peso
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(numericAmount)) return 'N/A';
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, CURRENCY_CONFIG.FORMAT_OPTIONS).format(numericAmount);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatCompactNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  const numericValue = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num;
  if (isNaN(numericValue)) return 'N/A';
  
  if (numericValue >= 1000000000) {
    return (numericValue / 1000000000).toFixed(1) + 'B';
  }
  if (numericValue >= 1000000) {
    return (numericValue / 1000000).toFixed(1) + 'M';
  }
  if (numericValue >= 1000) {
    return (numericValue / 1000).toFixed(1) + 'K';
  }
  return numericValue.toString();
};

/**
 * Format numbers with thousand separators
 */
export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  const numericValue = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num;
  if (isNaN(numericValue)) return 'N/A';
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE).format(numericValue);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number | string | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return 'N/A';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return 'N/A';
  return `${numericValue.toFixed(decimals)}%`;
};

/**
 * Format date in short format
 */
export const formatDateShort = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(DATE_CONFIG.LOCALE, DATE_CONFIG.SHORT_FORMAT);
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Format date in long format
 */
export const formatDateLong = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(DATE_CONFIG.LOCALE, DATE_CONFIG.LONG_FORMAT);
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const relativeTime = formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
    
    // Fix common Spanish translation issues
    return relativeTime
      .replace(/^en /, 'hace ')  // "en X" -> "hace X"
      .replace(/^about /, 'hace aproximadamente ')  // "about X" -> "hace aproximadamente X"
      .replace(/^over /, 'hace más de ')  // "over X" -> "hace más de X"
      .replace(/^almost /, 'hace casi ')  // "almost X" -> "hace casi X"
      .replace(/^less than /, 'hace menos de ');  // "less than X" -> "hace menos de X"
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Format time only (e.g., "14:30")
 */
export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'HH:mm', { locale: es });
  } catch (error) {
    return 'Hora inválida';
  }
};

/**
 * Format mileage with thousand separators and "km" suffix
 */
export const formatMileage = (mileage: number | string | null | undefined): string => {
  if (mileage === null || mileage === undefined) return 'N/A';
  
  if (typeof mileage === 'string') {
    // If it's already formatted with "km", just return it
    if (mileage.toLowerCase().includes('km')) {
      return mileage;
    }
    // Otherwise parse the number and format it
    const numericValue = parseFloat(mileage.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) return mileage; // Return original if parsing fails
    return `${formatNumber(numericValue)} km`;
  }
  
  return `${formatNumber(mileage)} km`;
};

/**
 * Format vehicle year
 */
export const formatYear = (year: number | string | null | undefined): string => {
  if (year === null || year === undefined) return 'N/A';
  return year.toString();
};

/**
 * Format price change with sign and currency
 */
export const formatPriceChange = (change: number | string | null | undefined): string => {
  if (change === null || change === undefined) return 'N/A';
  const numericChange = typeof change === 'string' ? parseFloat(change) : change;
  if (isNaN(numericChange)) return 'N/A';
  
  const sign = numericChange >= 0 ? '+' : '';
  return `${sign}${formatCurrency(numericChange)}`;
};

/**
 * Format percentage change with sign
 */
export const formatPercentageChange = (change: number | string | null | undefined): string => {
  if (change === null || change === undefined) return 'N/A';
  const numericChange = typeof change === 'string' ? parseFloat(change) : change;
  if (isNaN(numericChange)) return 'N/A';
  
  const sign = numericChange >= 0 ? '+' : '';
  return `${sign}${formatPercentage(numericChange)}`;
};

/**
 * Format compact currency (e.g., "$85M" instead of "$85,000,000")
 */
export const formatCompactCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(numericAmount)) return 'N/A';
  
  if (numericAmount >= 1000000000) {
    return `$${(numericAmount / 1000000000).toFixed(1)}B`;
  }
  if (numericAmount >= 1000000) {
    return `$${(numericAmount / 1000000).toFixed(1)}M`;
  }
  if (numericAmount >= 1000) {
    return `$${(numericAmount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(numericAmount);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number | string | null | undefined): string => {
  if (bytes === null || bytes === undefined) return 'N/A';
  const numericBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(numericBytes) || numericBytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numericBytes) / Math.log(k));
  
  return parseFloat((numericBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format phone number for Colombian format
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a Colombian number
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 13 && cleaned.startsWith('57')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format URL for display (remove protocol and www)
 */
export const formatUrlForDisplay = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '');
};

/**
 * Format price range
 */
export const formatPriceRange = (min: number | string | null | undefined, max: number | string | null | undefined): string => {
  const minValue = min === null || min === undefined ? 0 : (typeof min === 'string' ? parseFloat(min) : min);
  const maxValue = max === null || max === undefined ? Infinity : (typeof max === 'string' ? parseFloat(max) : max);
  
  if (isNaN(minValue)) return 'Rango inválido';
  if (isNaN(maxValue)) return `Desde ${formatCompactCurrency(minValue)}`;
  
  if (maxValue === Infinity) {
    return `Desde ${formatCompactCurrency(minValue)}`;
  }
  return `${formatCompactCurrency(minValue)} - ${formatCompactCurrency(maxValue)}`;
};

/**
 * Format mileage range
 */
export const formatMileageRange = (min: number | string | null | undefined, max: number | string | null | undefined): string => {
  const minValue = min === null || min === undefined ? 0 : (typeof min === 'string' ? parseFloat(min) : min);
  const maxValue = max === null || max === undefined ? Infinity : (typeof max === 'string' ? parseFloat(max) : max);
  
  if (isNaN(minValue)) return 'Rango inválido';
  if (isNaN(maxValue)) return `Más de ${formatNumber(minValue)} km`;
  
  if (maxValue === Infinity) {
    return `Más de ${formatNumber(minValue)} km`;
  }
  return `${formatNumber(minValue)} - ${formatNumber(maxValue)} km`;
};

/**
 * Format year range
 */
export const formatYearRange = (min: number | string | null | undefined, max: number | string | null | undefined): string => {
  const currentYear = new Date().getFullYear();
  const minValue = min === null || min === undefined ? 0 : (typeof min === 'string' ? parseInt(min) : min);
  const maxValue = max === null || max === undefined ? currentYear : (typeof max === 'string' ? parseInt(max) : max);
  
  if (isNaN(minValue) || isNaN(maxValue)) return 'Rango inválido';
  
  return `${minValue} - ${maxValue}`;
};

/**
 * Format search query for display
 */
export const formatSearchQuery = (query: string | null | undefined): string => {
  if (!query) return '';
  return query.trim().toLowerCase();
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Format status badge text
 */
export const formatStatusText = (status: string | null | undefined): string => {
  if (!status) return 'Desconocido';
  
  const statusMap: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    triggered: 'Activada',
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    nuevo: 'Nuevo',
    usado: 'Usado',
    sold: 'Vendido',
    paused: 'Pausado',
    removed: 'Eliminado',
    merged: 'Fusionado',
    running: 'En progreso',
    failed: 'Fallido',
  };
  
  return statusMap[status.toLowerCase()] || capitalizeWords(status);
};

/**
 * Format duration in human readable format
 */
export const formatDuration = (milliseconds: number | string | null | undefined): string => {
  if (milliseconds === null || milliseconds === undefined) return 'N/A';
  const numericValue = typeof milliseconds === 'string' ? parseFloat(milliseconds) : milliseconds;
  if (isNaN(numericValue)) return 'N/A';
  
  const seconds = Math.floor(numericValue / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} día${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
}; 