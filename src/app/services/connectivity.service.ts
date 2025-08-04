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
  #endpoints: ConnectivityEndpoint[] = [
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
  #fallbackEndpoints: ConnectivityEndpoint[] = [
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

  #isOnline = signal<boolean>(navigator.onLine);
  #lastChecked = signal<Date | null>(null);
  #responseTime = signal<number | null>(null);
  #currentEndpoint = signal<string | null>(null);
  #error = signal<string | null>(null);
  #isChecking = signal<boolean>(false);
  #totalChecks = signal<number>(0);
  #successfulChecks = signal<number>(0);
  #connectionHistory = signal<ConnectionRecord[]>([]);
  #minResponseTime = signal<number | null>(null);
  #maxResponseTime = signal<number | null>(null);

  // Public signals
  readonly isOnline = this.#isOnline.asReadonly();
  readonly lastChecked = this.#lastChecked.asReadonly();
  readonly responseTime = this.#responseTime.asReadonly();
  readonly currentEndpoint = this.#currentEndpoint.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly isChecking = this.#isChecking.asReadonly();
  readonly totalChecks = this.#totalChecks.asReadonly();
  readonly successfulChecks = this.#successfulChecks.asReadonly();
  readonly connectionHistory = this.#connectionHistory.asReadonly();
  readonly minResponseTime = this.#minResponseTime.asReadonly();
  readonly maxResponseTime = this.#maxResponseTime.asReadonly();

  readonly uptimePercentage = computed(() => {
    const total = this.#totalChecks();
    const successful = this.#successfulChecks();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  });

  readonly successRate = computed(() => {
    const total = this.#totalChecks();
    const successful = this.#successfulChecks();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  });

  readonly averageResponseTime = computed(() => {
    const onlineRecords = this.#connectionHistory().filter(r => r.isOnline && r.responseTime);
    if (onlineRecords.length === 0) return 0;
    const total = onlineRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    return Math.round(total / onlineRecords.length);
  });

  readonly status = computed(() => ({
    isOnline: this.#isOnline(),
    lastChecked: this.#lastChecked(),
    responseTime: this.#responseTime(),
    endpoint: this.#currentEndpoint(),
    error: this.#error()
  }));

  constructor() {
    // Listen to browser's online/offline events
    window.addEventListener('online', () => this.#isOnline.set(true));
    window.addEventListener('offline', () => this.#isOnline.set(false));

    // Set up periodic connectivity checks
    this.setupPeriodicChecks();
  }

  setupPeriodicChecks(): void {
    // Check every 30 seconds
    const checkInterval$ = timer(0, 30000);

    checkInterval$.subscribe(() => {
      this.checkConnectivity();
    });
  }

  async checkConnectivity(): Promise<ConnectivityStatus> {
    this.#isChecking.set(true);
    this.#error.set(null);
    this.#totalChecks.update(count => count + 1);

    const startTime = performance.now();

    // First try HTTPS endpoints
    const httpsResult = await this.tryEndpoints(this.#endpoints, startTime);
    if (httpsResult.isOnline) {
      return httpsResult;
    }

    // If HTTPS endpoints failed, try HTTP fallbacks (only in development or if explicitly allowed)
    if (this.shouldTryHttpFallback()) {
      console.log('HTTPS endpoints failed, trying HTTP fallbacks...');
      const httpResult = await this.tryEndpoints(this.#fallbackEndpoints, startTime);
      if (httpResult.isOnline) {
        return httpResult;
      }
    }

    // If all endpoints failed
    this.#isOnline.set(false);
    this.#lastChecked.set(new Date());
    this.#responseTime.set(null);
    this.#error.set('All connectivity endpoints failed');
    this.#isChecking.set(false);

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
        this.#currentEndpoint.set(endpoint.name);

        const response = await this.checkEndpoint(endpoint);
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        this.updateResponseTimeTracking(responseTime);

        this.#isOnline.set(true);
        this.#lastChecked.set(new Date());
        this.#responseTime.set(responseTime);
        this.#successfulChecks.update(count => count + 1);
        this.#isChecking.set(false);

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
        console.warn(`Failed to connect to ${endpoint.name}:`, error);
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
    this.#minResponseTime.update(current => {
      if (current === null || responseTime < current) {
        return responseTime;
      }
      return current;
    });

    // Update max response time
    this.#maxResponseTime.update(current => {
      if (current === null || responseTime > current) {
        return responseTime;
      }
      return current;
    });
  }

  addToHistory(record: ConnectionRecord): void {
    this.#connectionHistory.update(history => {
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
    return [...this.#endpoints];
  }

  // Get recent connection history (last 10 records)
  getRecentHistory(): ConnectionRecord[] {
    return this.#connectionHistory().slice(-10).reverse();
  }

  // Get current protocol and port info
  getCurrentEndpointInfo(): { protocol: string; port: string } {
    const current = this.#currentEndpoint();
    if (!current) return { protocol: 'N/A', port: 'N/A' };

    // Check if current endpoint is from HTTPS or HTTP list
    const isHttpsEndpoint = this.#endpoints.some(ep => ep.name === current);
    const isHttpEndpoint = this.#fallbackEndpoints.some(ep => ep.name === current);

    if (isHttpsEndpoint) {
      return { protocol: 'HTTPS', port: '443' };
    } else if (isHttpEndpoint) {
      return { protocol: 'HTTP', port: '80' };
    }

    // Default to HTTPS/443 for most endpoints
    return { protocol: 'HTTPS', port: '443' };
  }
}
