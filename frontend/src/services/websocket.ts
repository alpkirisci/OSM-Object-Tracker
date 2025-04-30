import { WebSocketMessage } from '@/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private clientId: string;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(endpoint: string, clientId: string) {
    this.url = `${WS_BASE_URL}${endpoint}/${clientId}`;
    this.clientId = clientId;
  }

  public connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnected = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnected);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnected);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log(`WebSocket connected to ${this.url}`);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket connection closed');
          this.socket = null;
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, socket is not open');
    }
  }

  public subscribe(messageType: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)?.push(handler);
  }

  public unsubscribe(messageType: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      this.messageHandlers.set(
        messageType,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const messageType = message.type;
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection attempt failed:', error);
        });
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }
}

// Create object tracking WebSocket service
export const createObjectsWebSocket = (clientId: string): WebSocketService => {
  return new WebSocketService('/api/ws/objects', clientId);
};

// Create data source WebSocket service
export const createDataSourceWebSocket = (sourceId: string, clientId: string): WebSocketService => {
  return new WebSocketService(`/api/ws/data-source/${sourceId}`, clientId);
}; 