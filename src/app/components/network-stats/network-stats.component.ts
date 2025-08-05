import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService } from '../../services/connectivity.service';

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
  private connectivityService = inject(ConnectivityService);

  readonly uptimePercentage = this.connectivityService.uptimePercentage;
  readonly averageResponseTime = this.connectivityService.averageResponseTime;
  readonly totalChecks = this.connectivityService.totalChecks;
  readonly successfulChecks = this.connectivityService.successfulChecks;

  readonly currentStatus = computed(() => {
    return this.connectivityService.isOnline() ? 'Online' : 'Offline';
  });

  readonly successRate = this.connectivityService.successRate;

  readonly connectionHistorySignal = computed(() => {
    return this.connectivityService.connectionHistory().slice(-10).reverse().map(record => ({
      timestamp: record.timestamp,
      status: record.isOnline ? 'online' : 'offline',
      responseTime: record.responseTime
    }));
  });

  readonly performanceData = computed((): PerformanceBar[] => {
    const history = this.connectivityService.connectionHistory().slice(-6);
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
    return this.connectivityService.connectionHistory().slice(-10).reverse();
  });

  readonly responseTimeHistory = computed(() => {
    return this.connectivityService.connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .slice(-20)
      .map(r => r.responseTime || 0);
  });

  readonly peakResponseTime = computed(() => {
    const responseTimes = this.connectivityService.connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .map(r => r.responseTime || 0);
    return responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  });

  readonly minResponseTime = computed(() => {
    const responseTimes = this.connectivityService.connectionHistory()
      .filter(r => r.isOnline && r.responseTime)
      .map(r => r.responseTime || 0);
    return responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  });

  getBarHeight(responseTime: number): number {
    // Normalize response time to percentage (0-100ms = 100%, 1000ms+ = 10%)
    const maxTime = 1000;
    const percentage = Math.max(10, Math.min(100, ((maxTime - responseTime) / maxTime) * 100));
    return percentage;
  }
}
