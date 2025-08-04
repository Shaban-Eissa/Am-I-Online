# Am I Online? 🌐

A modern, real-time internet connectivity monitoring application built with Angular 19, Signals, and modern web technologies. This application demonstrates reliable internet connectivity detection using industry-standard endpoints and provides comprehensive network monitoring capabilities.

## Table of Contents 📋

- [Features](#features-)
- [Why We Built This Application](#why-we-built-this-application-)
- [The Problem: Traditional Methods Fail](#the-problem-traditional-methods-fail)
- [The Solution: HTTP-Based Connectivity Checks](#the-solution-http-based-connectivity-checks)
- [Real-World Use Cases](#real-world-use-cases-)
- [Getting Started](#getting-started-)
- [Technical Implementation](#technical-implementation)
- [Contributing](#contributing-)
- [Acknowledgments](#acknowledgments-)
- [Key Takeaways](#key-takeaways-)

## Features ✨

### 🔍 Real-time Connectivity Monitoring
- **Multiple Endpoint Testing**: Tests connectivity against Google, Cloudflare, Microsoft, and Ubuntu endpoints
- **Automatic Fallback**: If one endpoint fails, automatically tries the next one
- **Response Time Measurement**: Tracks and displays connection response times
- **Automatic Checks**: Performs connectivity checks every 30 seconds
- **Reliable Detection**: Uses HTTP-based connectivity checks instead of unreliable ping methods

### 📊 Network Statistics
- **Uptime Percentage**: Shows overall connection reliability
- **Average Response Time**: Displays mean response time across all successful connections
- **Connection History**: Tracks recent connection attempts with timestamps
- **Performance Charts**: Visual representation of response time trends

### 🚀 Technical Excellence
- **Angular 19**: Latest Angular version with standalone components
- **Signals**: Modern reactive state management
- **OnPush Change Detection**: Optimized performance
- **TypeScript**: Full type safety

## Why We Built This Application 🌐

### The Real Problem: Unreliable Connectivity Detection

**Traditional methods are fundamentally flawed:**
- **Ping (ICMP) only checks basic network connectivity** - it doesn't verify if you can actually access web services
- **A device could respond to ping but still fail to load web pages** - this is a common scenario in corporate networks, captive portals, or when DNS is broken
- **Many networks block ICMP packets** - making ping completely useless
- **Doesn't confirm actual internet access** - just that a device is reachable

### Why This Matters Now More Than Ever 📈

In today's interconnected world:
- **Remote work** depends on reliable internet connectivity
- **Cloud services** require constant internet access
- **IoT devices** need to know when they're online
- **Web applications** must gracefully handle connectivity changes
- **Network troubleshooting** requires accurate diagnostic tools

This application provides a **reliable, real-world solution** to a fundamental problem that affects everyone who uses the internet. It's not just a demo - it's a practical tool that demonstrates the right way to detect internet connectivity in modern applications.

## The Problem: Traditional Methods Fail

### Why Ping (ICMP) Doesn't Work

**Common Approach: Ping DNS Servers**
```bash
ping 8.8.8.8    # Google DNS
ping 1.1.1.1    # Cloudflare DNS
```

**Problems with Ping (ICMP Protocol):**
- ❌ Only checks basic network connectivity
- ❌ Doesn't verify full HTTP stack (DNS → TCP → HTTP)
- ❌ A device could respond to ping but still fail to load web pages
- ❌ Many networks block ICMP packets
- ❌ Doesn't confirm actual internet access

**Goal:** Check internet access at the application level like a real HTTP client.

## The Solution: HTTP-Based Connectivity Checks

### Industry-Standard Approach

This application implements the **industry-standard approach** used by major tech companies:

- **Google Chrome** uses `http://google.com/generate_204` for connectivity detection
- **Cloudflare** provides `http://cp.cloudflare.com/generate_204` 
- **Microsoft** uses `http://edge-http.microsoft.com/captiveportal/generate_204`
- **Ubuntu** has `http://connectivity-check.ubuntu.com`

### Why This Approach Works Better

✅ **Verifies the complete network path**: DNS → TCP → HTTP  
✅ **Confirms actual internet access** - not just network connectivity  
✅ **Works behind corporate firewalls** - uses standard HTTP ports  
✅ **Minimal resource usage** - 204 responses have no content  
✅ **Global infrastructure** - hosted on reliable, worldwide networks  

### How generate_204 Endpoints Work 🎯

**Google Chrome's Method:**
```bash
http://google.com/generate_204
https://google.com/generate_204
```

**What Happens:**
- Returns HTTP 204 (No Content) → means success with no response body
- Very fast and reliable because it runs on core Google infrastructure
- Confirms the full network path works:
  - DNS resolution
  - TCP connection
  - HTTP response

**Why HTTP 204?**
- No content → minimal data usage
- Ideal for quick connectivity checks
- Browsers show blank page (expected behavior)

### Industry-Standard Connectivity Endpoints 🌍

| Provider | URL | Expected Status | Notes |
|----------|-----|----------------|-------|
| **Google** | `http://google.com/generate_204` | 200, 204 | Most reliable, global infrastructure |
| **Cloudflare** | `http://cp.cloudflare.com/generate_204` | 200, 204 | Fast CDN, excellent worldwide coverage |
| **Microsoft** | `http://edge-http.microsoft.com/captiveportal/generate_204` | 200, 204 | Windows NCSI compatible |
| **Ubuntu** | `http://connectivity-check.ubuntu.com` | 200 | Linux system connectivity checks |

### Testing Endpoints Manually 🔍

```bash
# Test Google's endpoint
curl -I http://google.com/generate_204
# Expected: HTTP/1.1 204 No Content

# Test Cloudflare's endpoint
curl -I http://cp.cloudflare.com/generate_204
# Expected: HTTP/1.1 204 No Content

# Test with User-Agent (for picky endpoints)
curl -I http://edge-http.microsoft.com/captiveportal/generate_204 \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

## Real-World Use Cases 🌍

### **For Developers & IT Professionals:**
- **Debug network issues** - quickly identify if connectivity problems are local or global
- **Monitor service availability** - track uptime and response times
- **Test network configurations** - verify firewall and proxy settings

### **For Applications:**
- **Progressive Web Apps (PWAs)** - detect when to switch between online/offline modes
- **IoT Devices** - monitor internet connectivity for smart devices
- **Mobile Apps** - determine when to sync data or show offline indicators
- **Web Applications** - implement intelligent retry logic and offline functionality

### **For Network Monitoring:**
- **Home networks** - monitor ISP reliability and performance
- **Corporate networks** - track connectivity across different office locations
- **Server monitoring** - verify internet access from server environments

## Getting Started 🏁

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shaban-Eissa/Am-I-Online
   cd Am-I-Online
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## Technical Implementation

### Why These Endpoints Work Reliably 🎯

#### 1. Global Infrastructure
- **Google**: Uses Google's worldwide network infrastructure
- **Cloudflare**: Leverages Cloudflare's global CDN
- **Microsoft**: Microsoft's edge network for Windows compatibility
- **Ubuntu**: Canonical's connectivity check service

#### 2. Minimal Resource Usage
- **204 endpoints**: Return no content, minimal bandwidth
- **200 endpoints**: Return tiny files (few bytes)
- **Fast response times**: Optimized for quick checks

#### 3. High Availability
- **99.9%+ uptime**: These services are critical infrastructure
- **Multiple data centers**: Redundant across continents
- **DDoS protection**: Protected against network attacks

#### 4. Network Compatibility
- **No CORS issues**: Designed for cross-origin requests
- **Works behind proxies**: Compatible with corporate networks
- **Firewall friendly**: Standard HTTP/HTTPS ports

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments 🙏

- **Primary Inspiration**: This project was inspired by Anton Zhiyanov's excellent article ["Am I online?"](https://antonz.org/is-online/) which explores reliable internet connectivity detection techniques using HTTP-based endpoints
- Built with [Angular](https://angular.dev/)
- Connectivity checking techniques inspired by major tech companies (Google, Cloudflare, Microsoft)
- Speed testing inspired by [Speedtest.net](https://www.speedtest.net/)
- The UI inspired from [Evervault](https://evervault.com/)
- Icons and design inspiration from modern web applications

## Key Takeaways 📝

- **Ping isn't enough** for app-level connectivity checks
- **Use lightweight HTTP endpoints** (prefer 204 No Content for speed)
- **Multiple providers** offer endpoints: Google, Cloudflare, Apple, Microsoft, Mozilla, etc.
- **Good for apps, IoT devices, and network monitoring** to detect actual online status
