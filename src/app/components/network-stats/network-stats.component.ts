import { Component, inject, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService } from '../../services/connectivity.service';

interface ConnectionRecord {
  timestamp: Date;
  isOnline: boolean;
  responseTime: number | null;
  endpoint: string | null;
}

interface PerformanceBar {
  height: number;
  color: string;
  label: string;
}

@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './network-stats.component.html'
})
export class NetworkStatsComponent {
  #connectivityService = inject(ConnectivityService);

  #connectionHistory = signal<ConnectionRecord[]>([]);
  #totalChecks = signal<number>(0);
  #successfulChecks = signal<number>(0);

  readonly uptimePercentage = computed(() => {
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

  readonly totalChecks = this.#totalChecks.asReadonly();

  readonly currentStatus = computed(() => {
    return this.#connectivityService.isOnline() ? 'Online' : 'Offline';
  });

  readonly successRate = computed(() => {
    const total = this.#totalChecks();
    const successful = this.#successfulChecks();
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  });

  readonly connectionHistory = computed(() => {
    return this.#connectionHistory().slice(-10).reverse().map(record => ({
      timestamp: record.timestamp,
      status: record.isOnline ? 'online' : 'offline',
      responseTime: record.responseTime
    }));
  });

  readonly performanceData = computed((): PerformanceBar[] => {
    const history = this.#connectionHistory().slice(-6);
    return history.map((record, index) => {
      const height = record.responseTime ? Math.min(100, Math.max(10, 100 - (record.responseTime / 10))) : 10;
      const color = record.responseTime
        ? record.responseTime < 50
          ? 'linear-gradient(to top, #34d399, #059669)'
          : record.responseTime < 100
            ? 'linear-gradient(to top, #fbbf24, #d97706)'
            : 'linear-gradient(to top, #ef4444, #dc2626)'
        : 'linear-gradient(to top, #6b7280, #4b5563)';

      return {
        height,
        color,
        label: `${index + 1}`
      };
    });
  });

  readonly recentConnections = computed(() => {
    return this.#connectionHistory().slice(-10).reverse();
  });

  readonly responseTimeHistory = computed(() => {
    return this.#connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .slice(-20)
      .map(r => r.responseTime || 0);
  });

  readonly peakResponseTime = computed(() => {
    const responseTimes = this.#connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .map(r => r.responseTime || 0);
    return responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  });

  readonly minResponseTime = computed(() => {
    const responseTimes = this.#connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .map(r => r.responseTime || 0);
    return responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  });

  constructor() {
    effect(() => {
      const status = this.#connectivityService.status();
      const record: ConnectionRecord = {
        timestamp: new Date(),
        isOnline: status.isOnline,
        responseTime: status.responseTime,
        endpoint: status.endpoint
      };

      this.#connectionHistory.update(history => [...history, record]);
      this.#totalChecks.update(count => count + 1);

      if (status.isOnline) {
        this.#successfulChecks.update(count => count + 1);
      }
    });
  }

  getBarHeight(responseTime: number): number {
    // Normalize response time to percentage (0-100ms = 100%, 1000ms+ = 10%)
    const maxTime = 1000;
    const percentage = Math.max(10, Math.min(100, ((maxTime - responseTime) / maxTime) * 100));
    return percentage;
  }
}
