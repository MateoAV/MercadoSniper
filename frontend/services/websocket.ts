import io, { Socket } from 'socket.io-client';
import { WebSocketMessage, NotificationPayload, Vehicle, ScrapingJob } from '@/types';
import toast from 'react-hot-toast';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private listeners: Map<string, Function[]> = new Map();
  private subscriptions: Set<string> = new Set();
  private isClient: boolean = false;

  constructor() {
    // Only connect on the client side
    if (typeof window !== 'undefined') {
      this.isClient = true;
      this.connect();
    }
  }

  connect(): void {
    if (!this.isClient || this.socket?.connected) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000/ws';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Resubscribe to all subscriptions
      this.resubscribe();
      
      // Notify user of reconnection if it was a reconnect
      if (this.reconnectAttempts > 0) {
        toast.success('Conexión restablecida');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('notification', (data: NotificationPayload) => {
      this.handleNotification(data);
    });

    this.socket.on('vehicle_update', (data: { vehicle: Vehicle }) => {
      this.emit('vehicle_update', data);
    });

    this.socket.on('vehicle_price_update', (data: { vehicle: Vehicle }) => {
      this.emit('vehicle_price_update', data);
    });

    this.socket.on('alert_triggered', (data: any) => {
      this.emit('alert_triggered', data);
      this.handleAlertTriggered(data);
    });

    this.socket.on('scraping_job_update', (data: { job: ScrapingJob }) => {
      console.log('🔍 DEBUG: Received scraping_job_update:', data);
      console.log('🔍 DEBUG: Event type: scraping_job_update');
      console.log('🔍 DEBUG: Data type:', typeof data);
      console.log('🔍 DEBUG: Data keys:', Object.keys(data));
      this.emit('scraping_job_update', data);
    });

    // Temporary listener for old event name - DISABLED FOR DEBUGGING
    // this.socket.on('scraping_progress', (data: any) => {
    //   console.log('🔍 DEBUG: Received OLD scraping_progress event:', data);
    //   // Convert to new format
    //   const convertedData = {
    //     job: {
    //       _id: data.job_id,
    //       status: data.status,
    //       progress_percentage: data.progress_percentage,
    //       current_page: data.current_page,
    //       vehicles_found: data.vehicles_found,
    //       vehicles_saved: data.vehicles_saved,
    //       message: data.message,
    //       ...data
    //     }
    //   };
    //   this.emit('scraping_job_update', convertedData);
    // });
  }

  private handleReconnect(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Show toast only on first reconnect attempt
      if (this.reconnectAttempts === 1) {
        toast.error('Conexión perdida. Intentando reconectar...');
      }
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      toast.error('No se pudo establecer conexión. Por favor, recarga la página.');
    }
  }

  private resubscribe(): void {
    if (!this.isConnected || !this.socket) return;
    
    // Resubscribe to all previous subscriptions
    this.subscriptions.forEach(subscription => {
      this.socket?.emit('subscribe', { channel: subscription });
    });
  }

  private handleNotification(data: NotificationPayload): void {
    // Process notification
    if (data.type === 'price_drop') {
      toast.success(`¡Bajó el precio! ${data.title || 'Un vehículo'} ahora cuesta ${data.new_price}`);
    } else if (data.type === 'alert_triggered') {
      toast.success(`¡Alerta activada! ${data.title || 'Un vehículo'} ha alcanzado el precio objetivo.`);
    } else {
      toast(data.message || 'Nueva notificación');
    }
    
    // Emit the notification event for components to listen
    this.emit('notification', data);
  }

  private handleAlertTriggered(data: any): void {
    const { alert, vehicle } = data;
    if (alert && vehicle) {
      toast.success(
        `¡Alerta activada! ${vehicle.title} - Precio actual: ${vehicle.price}`,
        { duration: 6000 }
      );
    }
  }

  // Subscribe to specific channels
  subscribeToVehicle(vehicleId: string): void {
    if (!this.isConnected || !this.socket) return;
    
    const channel = `vehicle:${vehicleId}`;
    this.socket.emit('subscribe', { channel });
    this.subscriptions.add(channel);
  }

  unsubscribeFromVehicle(vehicleId: string): void {
    if (!this.socket) return;
    
    const channel = `vehicle:${vehicleId}`;
    this.socket.emit('unsubscribe', { channel });
    this.subscriptions.delete(channel);
  }

  subscribeToAlerts(): void {
    if (!this.isConnected || !this.socket) return;
    
    const channel = 'alerts';
    this.socket.emit('subscribe', { channel });
    this.subscriptions.add(channel);
  }

  unsubscribeFromAlerts(): void {
    if (!this.socket) return;
    
    const channel = 'alerts';
    this.socket.emit('unsubscribe', { channel });
    this.subscriptions.delete(channel);
  }

  subscribeToScrapingJob(jobId: string): void {
    if (!this.isConnected || !this.socket) {
      console.log('🔍 DEBUG: Cannot subscribe - WebSocket not connected')
      return
    }
    
    const channel = `scraping_job_${jobId}`
    console.log('🔍 DEBUG: Subscribing to scraping job:', channel)
    this.socket.emit('subscribe', { channel })
    this.subscriptions.add(channel)
    console.log('🔍 DEBUG: Current subscriptions:', Array.from(this.subscriptions))
  }

  unsubscribeFromScrapingJob(jobId: string): void {
    if (!this.socket) return;
    
    const channel = `scraping_job_${jobId}`;
    this.socket.emit('unsubscribe', { channel });
    this.subscriptions.delete(channel);
  }

  // Event emitter pattern
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.listeners.set(event, callbacks);
    }
  }

  emit(event: string, data: any): void {
    console.log(`🔍 DEBUG: Emitting event '${event}' with data:`, data)
    const callbacks = this.listeners.get(event) || []
    console.log(`🔍 DEBUG: Found ${callbacks.length} callbacks for event '${event}'`)
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error)
      }
    })
  }

  // Send a message to the server
  sendMessage(type: string, payload: any): void {
    if (!this.isConnected || !this.socket) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }
    
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    
    this.socket.emit('message', message);
  }

  // Close the connection
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();
export default websocketService; 