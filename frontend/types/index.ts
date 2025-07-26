export interface Product {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  url: string;
  imageUrl: string;
  location: string;
  seller: string;
  description: string;
  features: string[];
  condition: 'nuevo' | 'usado';
  isTracking: boolean;
  lastUpdated: Date;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  price: number;
  timestamp: Date;
  priceChange?: number;
  percentageChange?: number;
}

export interface PriceAlert {
  id: string;
  productId: string;
  userId: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  alertType: 'below' | 'above' | 'change';
  notificationMethod: 'browser' | 'email' | 'both';
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin: Date;
}

export interface UserPreferences {
  notifications: {
    browser: boolean;
    email: boolean;
    sound: boolean;
  };
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Dashboard {
  totalTrackedProducts: number;
  activeAlerts: number;
  totalSavings: number;
  recentPriceDrops: Product[];
  topDeals: Product[];
  priceDropsToday: number;
}

export interface SearchFilters {
  brand?: string;
  model?: string;
  yearRange?: {
    min: number;
    max: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  mileageRange?: {
    min: number;
    max: number;
  };
  fuelType?: string;
  transmission?: string;
  location?: string;
  condition?: 'nuevo' | 'usado';
  sortBy?: 'price' | 'year' | 'mileage' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationPayload {
  type: 'price_drop' | 'alert_triggered' | 'product_unavailable' | 'system';
  title?: string;
  message?: string;
  new_price?: string;
  old_price?: string;
  vehicle_id?: string;
  alert_id?: string;
  url?: string;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

// New types based on OpenAPI schema

export interface Vehicle {
  _id?: string;
  title: string;
  price?: string | null;
  price_numeric?: number | null;
  mercadolibre_id: string;
  url: string;
  year?: string | null;
  kilometers?: string | null;
  location?: string | null;
  image_url?: string | null;
  brand?: string | null;
  model?: string | null;
  edition?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  color?: string | null;
  doors?: number | null;
  additional_info?: Record<string, any>;
  canonical_vehicle_id?: string | null;
  status?: VehicleStatus;
  views_count?: number;
  tracking_count?: number;
  created_at?: string;
  updated_at?: string;
  last_scraped_at?: string | null;
}

export enum VehicleStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  PAUSED = 'paused',
  REMOVED = 'removed'
}

export interface VehicleUpdate {
  title?: string | null;
  price?: string | null;
  price_numeric?: number | null;
  year?: string | null;
  kilometers?: string | null;
  location?: string | null;
  image_url?: string | null;
  brand?: string | null;
  model?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  color?: string | null;
  doors?: number | null;
  additional_info?: Record<string, any> | null;
  status?: VehicleStatus | null;
  updated_at?: string;
}

export interface VehicleSearchResponse {
  vehicles: Vehicle[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PriceHistory {
  timestamp: string;
  metadata: Record<string, any>;
  price: string;
  price_numeric: number;
  scraping_session_id?: string | null;
}

export interface CanonicalVehicle {
  _id?: string | null;
  brand: string;
  model: string;
  year?: string | null;
  edition?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  doors?: number | null;
  body_type?: string | null;
  canonical_title?: string | null;
  canonical_image_url?: string | null;
  specifications?: Record<string, any>;
  min_price?: number | null;
  max_price?: number | null;
  avg_price?: number | null;
  median_price?: number | null;
  price_trend?: string | null;
  total_listings?: number;
  active_listings?: number;
  total_views?: number;
  average_kilometers?: number | null;
  status?: CanonicalVehicleStatus;
  created_at?: string;
  updated_at?: string;
  last_market_update?: string | null;
}

export enum CanonicalVehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MERGED = 'merged'
}

export interface CanonicalVehicleCreate {
  brand: string;
  model: string;
  year?: string | null;
  edition?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  doors?: number | null;
  body_type?: string | null;
  canonical_title?: string | null;
  canonical_image_url?: string | null;
  specifications?: Record<string, any> | null;
}

export interface CanonicalVehicleUpdate {
  brand?: string | null;
  model?: string | null;
  year?: string | null;
  edition?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  doors?: number | null;
  body_type?: string | null;
  canonical_title?: string | null;
  canonical_image_url?: string | null;
  specifications?: Record<string, any> | null;
  status?: CanonicalVehicleStatus | null;
  updated_at?: string;
}

export interface ScrapingJob {
  _id?: string | null;
  job_type: ScrapingJobType;
  status?: ScrapingJobStatus;
  parameters?: Record<string, any>;
  total_items?: number | null;
  processed_items?: number;
  successful_items?: number;
  failed_items?: number;
  progress_percentage?: number;
  results?: Record<string, any>;
  error_message?: string | null;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  estimated_completion?: string | null;
}

export enum ScrapingJobType {
  BULK_LISTINGS = 'bulk_listings',
  SINGLE_VEHICLE = 'single_vehicle',
  PRICE_UPDATE = 'price_update'
}

export enum ScrapingJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ScrapingStats {
  total_jobs?: number;
  completed_jobs?: number;
  failed_jobs?: number;
  running_jobs?: number;
  total_vehicles_scraped?: number;
  last_scraping_time?: string | null;
  average_scraping_time?: number | null;
}

export interface Alert {
  id?: string;
  user_id?: string;
  vehicle_id?: string;
  canonical_vehicle_id?: string | null;
  alert_type: 'price_drop' | 'price_below' | 'availability';
  threshold?: number | null;
  status: 'active' | 'triggered' | 'paused' | 'deleted';
  notification_channels: ('email' | 'browser' | 'push')[];
  created_at?: string;
  updated_at?: string;
  last_triggered_at?: string | null;
  conditions?: Record<string, any>;
} 