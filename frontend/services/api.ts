import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Vehicle, 
  VehicleSearchResponse, 
  VehicleUpdate, 
  PriceHistory, 
  CanonicalVehicle, 
  CanonicalVehicleCreate, 
  CanonicalVehicleUpdate,
  ScrapingJob,
  ScrapingJobStatus,
  ScrapingJobType,
  ScrapingStats,
  Alert
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Vehicles endpoints
  async searchVehicles(params?: {
    search_query?: string;
    min_price?: number;
    max_price?: number;
    min_year?: number;
    max_year?: number;
    brand?: string;
    model?: string;
    location?: string;
    fuel_type?: string;
    transmission?: string;
    page?: number;
    page_size?: number;
  }): Promise<VehicleSearchResponse> {
    const response = await this.api.get('/api/vehicles/search', { params });
    return response.data;
  }

  async getVehicle(vehicleId: string): Promise<Vehicle> {
    const response = await this.api.get(`/api/vehicles/${vehicleId}`);
    return response.data;
  }

  async updateVehicle(vehicleId: string, data: VehicleUpdate): Promise<Vehicle> {
    const response = await this.api.put(`/api/vehicles/${vehicleId}`, data);
    return response.data;
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    await this.api.delete(`/api/vehicles/${vehicleId}`);
  }

  async getVehicleByMercadolibreId(mercadolibreId: string): Promise<Vehicle> {
    const response = await this.api.get(`/api/vehicles/mercadolibre/${mercadolibreId}`);
    return response.data;
  }

  async getVehiclePriceHistory(vehicleId: string, limit: number = 100): Promise<PriceHistory[]> {
    const response = await this.api.get(`/api/vehicles/${vehicleId}/price-history`, { params: { limit } });
    return response.data;
  }

  async getVehiclePriceAnalytics(vehicleId: string, days: number = 30): Promise<any> {
    const response = await this.api.get(`/api/vehicles/${vehicleId}/price-analytics`, { params: { days } });
    return response.data;
  }

  async getRecentVehicles(limit: number = 10): Promise<Vehicle[]> {
    const response = await this.api.get('/api/vehicles/', { params: { limit } });
    return response.data;
  }

  async getPriceDrops(hours: number = 24, limit: number = 10): Promise<any[]> {
    const response = await this.api.get('/api/vehicles/analytics/price-drops', { params: { hours, limit } });
    return response.data;
  }

  async getVehicleStats(): Promise<any> {
    const response = await this.api.get('/api/vehicles/analytics/stats');
    return response.data;
  }

  async getTimeSeriesSummary(days: number = 7): Promise<any> {
    const response = await this.api.get('/api/vehicles/analytics/time-series-summary', { params: { days } });
    return response.data;
  }

  // Canonical Vehicles endpoints
  async getCanonicalVehicles(params?: {
    page?: number;
    page_size?: number;
    brand?: string;
    model?: string;
    year?: string;
  }): Promise<any> {
    const response = await this.api.get('/api/canonical-vehicles/', { params });
    return response.data;
  }

  async createCanonicalVehicle(data: CanonicalVehicleCreate): Promise<CanonicalVehicle> {
    const response = await this.api.post('/api/canonical-vehicles/', data);
    return response.data;
  }

  async getCanonicalVehicle(canonicalId: string): Promise<CanonicalVehicle> {
    const response = await this.api.get(`/api/canonical-vehicles/${canonicalId}`);
    return response.data;
  }

  async updateCanonicalVehicle(canonicalId: string, data: CanonicalVehicleUpdate): Promise<CanonicalVehicle> {
    const response = await this.api.put(`/api/canonical-vehicles/${canonicalId}`, data);
    return response.data;
  }

  async getCanonicalVehicleListings(canonicalId: string): Promise<Vehicle[]> {
    const response = await this.api.get(`/api/canonical-vehicles/${canonicalId}/listings`);
    return response.data;
  }

  async updateCanonicalVehicleStats(canonicalId: string): Promise<void> {
    await this.api.post(`/api/canonical-vehicles/${canonicalId}/update-stats`);
  }

  async mergeCanonicalVehicles(sourceId: string, targetId: string): Promise<void> {
    await this.api.post(`/api/canonical-vehicles/${sourceId}/merge/${targetId}`);
  }

  async getCanonicalVehicleMarketAnalysis(canonicalId: string): Promise<any> {
    const response = await this.api.get(`/api/canonical-vehicles/${canonicalId}/market-analysis`);
    return response.data;
  }

  // Scraping endpoints
  async startBulkScraping(maxPages?: number): Promise<any> {
    const response = await this.api.post('/api/scraping/start-bulk-scraping', null, { params: { max_pages: maxPages } });
    return response.data;
  }

  async scrapeSingleVehicle(url: string, saveToDB: boolean = true): Promise<any> {
    const response = await this.api.post('/api/scraping/scrape-single-vehicle', null, { params: { url, save_to_db: saveToDB } });
    return response.data;
  }

  async getScrapingJob(jobId: string): Promise<ScrapingJob> {
    const response = await this.api.get(`/api/scraping/job/${jobId}`);
    return response.data;
  }

  async cancelScrapingJob(jobId: string): Promise<void> {
    await this.api.delete(`/api/scraping/job/${jobId}`);
  }

  async getScrapingJobs(params?: {
    status?: ScrapingJobStatus;
    job_type?: ScrapingJobType;
    limit?: number;
  }): Promise<ScrapingJob[]> {
    const response = await this.api.get('/api/scraping/jobs', { params });
    return response.data;
  }

  async getScrapingStats(): Promise<ScrapingStats> {
    const response = await this.api.get('/api/scraping/stats');
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsOverview(): Promise<any> {
    const response = await this.api.get('/api/analytics/overview');
    return response.data;
  }

  async getPriceTrends(): Promise<any> {
    const response = await this.api.get('/api/analytics/price-trends');
    return response.data;
  }

  async getMarketInsights(): Promise<any> {
    const response = await this.api.get('/api/analytics/market-insights');
    return response.data;
  }

  async getGeographicAnalysis(): Promise<any> {
    const response = await this.api.get('/api/analytics/geographic-analysis');
    return response.data;
  }

  // Alerts endpoints
  async getAlerts(): Promise<any> {
    const response = await this.api.get('/api/alerts/');
    return response.data;
  }

  async createAlert(data: any): Promise<any> {
    const response = await this.api.post('/api/alerts/', data);
    return response.data;
  }

  async getAlert(alertId: string): Promise<any> {
    const response = await this.api.get(`/api/alerts/${alertId}`);
    return response.data;
  }

  async updateAlert(alertId: string, data: any): Promise<any> {
    const response = await this.api.put(`/api/alerts/${alertId}`, data);
    return response.data;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.api.delete(`/api/alerts/${alertId}`);
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 