import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService, ConnectivityEndpoint } from '../../services/connectivity.service';

@Component({
  selector: 'app-endpoint-details',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './endpoint-details.component.html'
})
export class EndpointDetailsComponent {
  private connectivityService = inject(ConnectivityService);

  readonly endpoints = computed(() => this.connectivityService.getEndpoints());
  readonly currentEndpoint = this.connectivityService.currentEndpoint;
}
