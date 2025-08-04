import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService } from '../../services/connectivity.service';

@Component({
  selector: 'app-connectivity-status',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connectivity-status.component.html'
})
export class ConnectivityStatusComponent {
  #connectivityService = inject(ConnectivityService);

  readonly isOnline = this.#connectivityService.isOnline;
  readonly lastChecked = this.#connectivityService.lastChecked;
  readonly responseTime = this.#connectivityService.responseTime;
  readonly currentEndpoint = this.#connectivityService.currentEndpoint;
  readonly error = this.#connectivityService.error;
  readonly isChecking = this.#connectivityService.isChecking;

  // Real data signals for statistics
  readonly totalChecks = this.#connectivityService.totalChecks;
  readonly successfulChecks = this.#connectivityService.successfulChecks;
  readonly uptimePercentage = this.#connectivityService.uptimePercentage;
  readonly successRate = this.#connectivityService.successRate;
  readonly averageResponseTime = this.#connectivityService.averageResponseTime;
  readonly minResponseTime = this.#connectivityService.minResponseTime;
  readonly maxResponseTime = this.#connectivityService.maxResponseTime;

  async manualCheck(): Promise<void> {
    await this.#connectivityService.manualCheck();
  }
}
