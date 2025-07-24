# MercadoSniper 🎯

> **Intelligent Price Tracking System for MercadoLibre Colombia**

MercadoSniper is a production-ready price tracking and alert system built using SOFEA (Service-Oriented Front-End Architecture). It monitors product prices on MercadoLibre Colombia, tracks historical data, and provides smart notifications when prices drop below user-defined thresholds.

## 🏗️ Architecture Overview

MercadoSniper follows the **SOFEA (Service-Oriented Front-End Architecture)** pattern, which moves business logic client-side while consuming pure backend services. This creates more responsive, scalable, and maintainable applications.

### Why SOFEA?

**Traditional Architecture Problems:**
- Server-side rendering creates unnecessary load
- Tight coupling between UI and business logic
- Poor user experience during data updates
- Difficult to scale the presentation layer independently

**SOFEA Advantages:**
- **Rich User Experience**: Real-time price updates without page refreshes
- **Component-as-Services Architecture**: UI components are treated as independent services
- **Scalability**: Frontend can scale independently from data services
- **Runtime Flexibility**: Dynamic interface assembly based on user roles
- **Performance**: Reduced server load and faster user interactions
- **Offline Capability**: Client-side caching for better user experience

## 🎯 Core Philosophy: The Sniper Approach

> *"Am I trying to build everything for everyone, or am I building a focused tool that does one thing exceptionally well? The name 'MercadoSniper' suggests precision, not a shotgun approach."*

### What MercadoSniper IS:
- ✅ A price alert sniper: Set target price, get notified when reached
- ✅ Colombian market focus: MercadoLibre Colombia only (initially)
- ✅ Single-purpose excellence: Price tracking and notifications
- ✅ Fast and lightweight: Quick setup, immediate value

### What MercadoSniper is NOT:
- ❌ A comprehensive market analysis platform
- ❌ A multi-store aggregator
- ❌ A complex business intelligence tool
- ❌ A feature-heavy dashboard with dozens of options

## 🚀 Features

### Real-Time Price Monitoring
- **Price Drop Notifications**: Receive alerts within 5 minutes of price drops
- **Historical Price Viewing**: 30-day price charts with trend analysis
- **Current vs Average Price**: Smart price comparison
- **Mobile-Optimized**: Responsive design for all devices

### Intelligent Alert System
- **Threshold-Based Alerts**: Set custom price targets
- **Instant Notifications**: Browser and push notifications
- **Savings Calculation**: Automatic savings amount display
- **Product Availability**: Track when products become unavailable

### Offline-First Experience
- **Client-Side Caching**: Works without internet connection
- **Service Worker**: Background sync capabilities
- **Local Storage**: Persistent user preferences
- **Graceful Degradation**: Fallback when services are unavailable

## 🏛️ Technical Architecture

### Service Layer (Backend)
```
services/
├── price-service/       # Price monitoring and scraping
├── alert-service/       # Real-time notifications
├── user-service/        # Authentication and user management
└── gateway/             # API gateway and routing
```

### Client Layer (Frontend)
```
client/
├── components/          # Reusable UI components
├── services/           # Client-side service connectors
├── state/              # Application state management
└── utils/              # Shared utilities
```

### Technology Stack

**Backend Services:**
- **Node.js** with Express
- **Socket.io** for real-time communication
- **MongoDB** for data persistence
- **Redis** for caching
- **Cheerio** for web scraping

**Frontend Client:**
- **React** for UI components
- **Zustand** for state management
- **Socket.io-client** for real-time updates
- **Recharts** for data visualization
- **Workbox** for service worker

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Redis
- Docker (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mercadosniper.git
   cd mercadosniper
   ```

2. **Install dependencies**
   ```bash
   # Install service dependencies
   cd services/price-service && npm install
   cd ../alert-service && npm install
   cd ../user-service && npm install
   cd ../gateway && npm install
   
   # Install client dependencies
   cd ../../client && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp .env.example .env
   
   # Configure your environment variables
   # See .env.example for required variables
   ```

4. **Start Development Environment**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose -f docker-compose.dev.yml up
   
   # Or start services individually
   npm run dev:services  # Start all services
   npm run dev:client   # Start client application
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:3001
   - Service Health: http://localhost:3001/health

## 🔧 Development

### Project Structure
```
mercadosniper/
├── services/                 # Backend services layer
│   ├── price-service/       # Price monitoring service
│   ├── alert-service/       # Notification service
│   ├── user-service/        # Authentication service
│   └── gateway/             # API gateway
├── client/                  # Frontend application
│   ├── components/          # Reusable UI components
│   ├── services/           # Client-side service connectors
│   └── state/              # Application state management
├── shared/                 # Shared utilities and types
├── tests/                  # Integration tests
└── docs/                   # Documentation
```

### Development Workflow

**Solo Development with Agile Methodologies:**
- **Sprint Structure**: 2-week cycles
- **Monday**: Sprint planning and backlog grooming
- **Tuesday-Thursday**: Development (services first, then client)
- **Friday**: Integration testing and deployment
- **Next Monday**: Sprint review and retrospective

### Testing Strategy

**Service Layer Testing:**
```bash
# Run service tests
cd services/price-service && npm test
cd ../alert-service && npm test
```

**Client Layer Testing:**
```bash
# Run client tests
cd client && npm test
```

**Integration Testing:**
```bash
# Run end-to-end tests
npm run test:integration
```

## 📊 Performance Targets

### Non-Functional Requirements

**Client-Side Performance:**
- Initial page load: <4 seconds
- Real-time price updates: <500ms latency
- Smooth interactions: 60 FPS animations
- Memory usage: <100MB for dashboard

**Service Layer Performance:**
- API response time: <500ms for 95% of requests
- Concurrent API calls: Support 1,000+ simultaneous requests
- Data processing: Handle 100,000+ price updates per day
- Service availability: 99% uptime SLA

## 🔒 Security & Ethics

### Web Scraping Ethics
- **Rate Limiting**: Maximum 1 request per 5 seconds per product
- **Respectful User-Agent**: Clear identification as educational tool
- **Error Handling**: Graceful degradation when scraping fails
- **Data Minimization**: Only collect necessary price information

### Security Measures
- **HTTPS-only** communication between client and services
- **Input validation** and sanitization on both client and server
- **Secure API token** management in browser storage
- **Rate limiting** per user and application

## 🚀 Deployment

### Production Deployment

1. **Build the Application**
   ```bash
   npm run build:all
   ```

2. **Docker Deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Environment Variables**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export MONGODB_URI=your_mongodb_uri
   export REDIS_URL=your_redis_url
   ```

### Monitoring & Health Checks
- **Service Health**: `/health` endpoint on each service
- **API Gateway**: Centralized monitoring and logging
- **Client Analytics**: Performance and error tracking
- **Database Monitoring**: Connection and query performance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- **[Architecture Guide](docs/architecture.md)**: Detailed SOFEA implementation
- **[API Documentation](docs/api.md)**: Service endpoints and contracts
- **[Deployment Guide](docs/deployment.md)**: Production setup instructions
- **[Testing Guide](docs/testing.md)**: Testing strategies and examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MercadoLibre Colombia** for providing the marketplace data
- **SOFEA Architecture** community for architectural guidance
- **React** and **Node.js** communities for excellent tooling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mercadosniper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mercadosniper/discussions)
- **Email**: support@mercadosniper.com

---

**Built with ❤️ for Colombian deal hunters**

*"Precision over complexity - because the best deals don't wait for complex systems."* 
