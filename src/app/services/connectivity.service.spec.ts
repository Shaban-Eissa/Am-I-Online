import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConnectivityService]
    });
    service = TestBed.inject(ConnectivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have endpoints configured', () => {
    const endpoints = service.getEndpoints();
    expect(endpoints.length).toBeGreaterThan(0);
    expect(endpoints[0].name).toBeDefined();
    expect(endpoints[0].url).toBeDefined();
    expect(endpoints[0].expectedStatus).toBeDefined();
  });

  it('should expose readable signals', () => {
    expect(service.isOnline).toBeDefined();
    expect(service.lastChecked).toBeDefined();
    expect(service.responseTime).toBeDefined();
    expect(service.currentEndpoint).toBeDefined();
    expect(service.error).toBeDefined();
    expect(service.isChecking).toBeDefined();
    expect(service.status).toBeDefined();
  });

  it('should initialize with browser online status', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    const newService = TestBed.inject(ConnectivityService);
    expect(newService.isOnline()).toBe(true);
  });
});
