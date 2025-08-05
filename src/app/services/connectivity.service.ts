import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { timer } from 'rxjs';

export interface ConnectivityEndpoint {
  name: string;
  url: string;
  expectedStatus: number[];
  timeout?: number;
}

export interface ConnectivityStatus {
  isOnline: boolean;
  lastChecked: Date | null;
  responseTime: number | null;
  endpoint: string | null;
  error?: string;
}

export interface ConnectionRecord {
  timestamp: Date;
  isOnline: boolean;
  responseTime: number | null;
  endpoint: string | null;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {

  // Configuration for different connectivity endpoints
  private endpoints: ConnectivityEndpoint[] = [
    {
      name: 'Google',
      url: 'https://google.com/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Cloudflare',
      url: 'https://cp.cloudflare.com/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Microsoft',
      url: 'https://edge-http.microsoft.com/captiveportal/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Ubuntu',
      url: 'https://connectivity-check.ubuntu.com',
      expectedStatus: [200],
      timeout: 3000
    },
    {
      name: 'Apple',
      url: 'https://captive.apple.com/hotspot-detect.html',
      expectedStatus: [200],
      timeout: 3000
    },
    {
      name: 'Mozilla',
      url: 'https://detectportal.firefox.com/success.txt',
      expectedStatus: [200],
      timeout: 3000
    }
  ];

  // Fallback HTTP endpoints for environments that don't support HTTPS
  private fallbackEndpoints: ConnectivityEndpoint[] = [
    {
      name: 'Google (HTTP)',
      url: 'http://google.com/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Cloudflare (HTTP)',
      url: 'http://cp.cloudflare.com/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Microsoft (HTTP)',
      url: 'http://edge-http.microsoft.com/captiveportal/generate_204',
      expectedStatus: [200, 204],
      timeout: 3000
    },
    {
      name: 'Ubuntu (HTTP)',
      url: 'http://connectivity-check.ubuntu.com',
      expectedStatus: [200],
      timeout: 3000
    },
    {
      name: 'Apple (HTTP)',
      url: 'http://captive.apple.com/hotspot-detect.html',
      expectedStatus: [200],
      timeout: 3000
    },
    {
      name: 'Mozilla (HTTP)',
      url: 'http://detectportal.firefox.com/success.txt',
      expectedStatus: [200],
      timeout: 3000
    }
  ];

  private isOnlineSignal = signal<boolean>(navigator.onLine);
  private lastCheckedSignal = signal<Date | null>(null);
  private responseTimeSignal = signal<number | null>(null);
  private currentEndpointSignal = signal<string | null>(null);
  private errorSignal = signal<string | null>(null);
  private isCheckingSignal = signal<boolean>(false);
  private totalChecksSignal = signal<number>(0);
  private successfulChecksSignal = signal<number>(0);
  private connectionHistorySignal = signal<ConnectionRecord[]>([]);
  private minResponseTimeSignal = signal<number | null>(null);
  private maxResponseTimeSignal = signal<number | null>(null);

  // Public signals
  readonly isOnline = this.isOnlineSignal.asReadonly();
  readonly lastChecked = this.lastCheckedSignal.asReadonly();
  readonly responseTime = this.responseTimeSignal.asReadonly();
  readonly currentEndpoint = this.currentEndpointSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isChecking = this.isCheckingSignal.asReadonly();
  readonly totalChecks = this.totalChecksSignal.asReadonly();
  readonly successfulChecks = this.successfulChecksSignal.asReadonly();
  readonly connectionHistory = this.connectionHistorySignal.asReadonly();
  readonly minResponseTime = this.minResponseTimeSignal.asReadonly();
  readonly maxResponseTime = this.maxResponseTimeSignal.asReadonly();

  readonly uptimePercentage = computed(() => {
    const total = this.totalChecksSignal();
    const successful = this.successfulChecksSignal();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  });

  readonly successRate = computed(() => {
    const total = this.totalChecksSignal();
    const successful = this.successfulChecksSignal();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  });

  readonly averageResponseTime = computed(() => {
    const onlineRecords = this.connectionHistorySignal().filter(r => r.isOnline && r.responseTime);
    if (onlineRecords.length === 0) return 0;
    const total = onlineRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    return Math.round(total / onlineRecords.length);
  });

  readonly status = computed(() => ({
    isOnline: this.isOnlineSignal(),
    lastChecked: this.lastCheckedSignal(),
    responseTime: this.responseTimeSignal(),
    endpoint: this.currentEndpointSignal(),
    error: this.errorSignal()
  }));

  constructor() {
    // Listen to browser's online/offline events
    window.addEventListener('online', () => this.isOnlineSignal.set(true));
    window.addEventListener('offline', () => this.isOnlineSignal.set(false));

    // Set up periodic connectivity checks
    this.setupPeriodicChecks();
  }

  setupPeriodicChecks(): void {
    // Check every 30 seconds, but only if not already checking
    const checkInterval$ = timer(0, 30000);

    checkInterval$.subscribe(() => {
      // Only start a new check if we're not already checking
      if (!this.isCheckingSignal()) this.checkConnectivity();
    });
  }

  async checkConnectivity(): Promise<ConnectivityStatus> {
    // Prevent multiple simultaneous checks
    if (this.isCheckingSignal()) {
      return {
        isOnline: this.isOnlineSignal(),
        lastChecked: this.lastCheckedSignal(),
        responseTime: this.responseTimeSignal(),
        endpoint: this.currentEndpointSignal(),
        error: this.errorSignal() ?? undefined
      };
    }

    this.isCheckingSignal.set(true);
    this.errorSignal.set(null);

    const startTime = performance.now();

    // First try HTTPS endpoints
    const httpsResult = await this.tryEndpoints(this.endpoints, startTime);
    if (httpsResult.isOnline) {
      this.totalChecksSignal.update(count => {
        return count + 1;
      });
      this.isCheckingSignal.set(false);
      return httpsResult;
    }

    // If HTTPS endpoints failed, try HTTP fallbacks (only in development or if explicitly allowed)
    if (this.shouldTryHttpFallback()) {
      const httpResult = await this.tryEndpoints(this.fallbackEndpoints, startTime);
      if (httpResult.isOnline) {
        this.totalChecksSignal.update(count => {
          return count + 1;
        });
        this.isCheckingSignal.set(false);
        return httpResult;
      }
    }

    // If all endpoints failed
    this.isOnlineSignal.set(false);
    this.lastCheckedSignal.set(new Date());
    this.responseTimeSignal.set(null);
    this.errorSignal.set('All connectivity endpoints failed');
    this.totalChecksSignal.update(count => {
      return count + 1;
    });
    this.isCheckingSignal.set(false);

    // Add failed connection to history
    this.addToHistory({
      timestamp: new Date(),
      isOnline: false,
      responseTime: null,
      endpoint: null,
      error: 'All connectivity endpoints failed'
    });

    return {
      isOnline: false,
      lastChecked: new Date(),
      responseTime: null,
      endpoint: null,
      error: 'All connectivity endpoints failed'
    };
  }

  private async tryEndpoints(endpoints: ConnectivityEndpoint[], startTime: number): Promise<ConnectivityStatus> {
    for (const endpoint of endpoints) {
      try {
        this.currentEndpointSignal.set(endpoint.name);

        const response = await this.checkEndpoint(endpoint);
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        this.updateResponseTimeTracking(responseTime);

        this.isOnlineSignal.set(true);
        this.lastCheckedSignal.set(new Date());
        this.responseTimeSignal.set(responseTime);
        this.successfulChecksSignal.update(count => count + 1);

        // Add to connection history
        this.addToHistory({
          timestamp: new Date(),
          isOnline: true,
          responseTime,
          endpoint: endpoint.name
        });

        return {
          isOnline: true,
          lastChecked: new Date(),
          responseTime,
          endpoint: endpoint.name
        };

      } catch (error) {
        continue;
      }
    }

    return {
      isOnline: false,
      lastChecked: new Date(),
      responseTime: null,
      endpoint: null,
      error: 'All endpoints failed'
    };
  }

  private shouldTryHttpFallback(): boolean {
    // Only try HTTP fallbacks in development or if we're not on HTTPS
    return window.location.protocol === 'http:' ||
      window.location.hostname === 'localhost'
  }

  updateResponseTimeTracking(responseTime: number): void {
    // Update min response time
    this.minResponseTimeSignal.update(current => {
      if (current === null || responseTime < current) {
        return responseTime;
      }
      return current;
    });

    // Update max response time
    this.maxResponseTimeSignal.update(current => {
      if (current === null || responseTime > current) {
        return responseTime;
      }
      return current;
    });
  }

  addToHistory(record: ConnectionRecord): void {
    this.connectionHistorySignal.update(history => {
      const newHistory = [...history, record];
      // Keep only last 100 records to prevent memory issues
      return newHistory.slice(-100);
    });
  }

  checkEndpoint(endpoint: ConnectivityEndpoint): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout || 3000);

    return fetch(endpoint.url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    }).then(response => {
      clearTimeout(timeoutId);

      // For no-cors requests, we can't read the status, so we assume success if we get a response
      if (response.type === 'opaque') {
        return response;
      }

      if (endpoint.expectedStatus.includes(response.status)) {
        return response;
      }

      throw new Error(`Unexpected status: ${response.status}`);
    }).catch(error => {
      clearTimeout(timeoutId);
      throw error;
    });
  }

  // Manual check method for user-triggered checks
  async manualCheck(): Promise<ConnectivityStatus> {
    return this.checkConnectivity();
  }

  // Get available endpoints for UI display
  getEndpoints(): ConnectivityEndpoint[] {
    // Return HTTPS endpoints by default for production
    return [...this.endpoints];
  }

  // Get recent connection history (last 10 records)
  getRecentHistory(): ConnectionRecord[] {
    return this.connectionHistorySignal().slice(-10).reverse();
  }

  // Get current protocol and port info
  getCurrentEndpointInfo(): { protocol: string; port: string } {
    const current = this.currentEndpointSignal();
    if (!current) return { protocol: 'N/A', port: 'N/A' };

    // Check if current endpoint is from HTTPS or HTTP list
    const isHttpsEndpoint = this.endpoints.some(ep => ep.name === current);
    const isHttpEndpoint = this.fallbackEndpoints.some(ep => ep.name === current);

    if (isHttpsEndpoint) {
      return { protocol: 'HTTPS', port: '443' };
    } else if (isHttpEndpoint) {
      return { protocol: 'HTTP', port: '80' };
    }

    // Default to HTTPS/443 for most endpoints
    return { protocol: 'HTTPS', port: '443' };
  }
}
