# MercadoSniper 🎯

> **Intelligent Price Tracking System for MercadoLibre Colombia**

MercadoSniper is a production-ready web application for tracking vehicle prices on MercadoLibre Colombia. Built with FastAPI backend and Next.js 13+ frontend, featuring real-time price monitoring, smart alerts, and comprehensive market analytics.

## 🏗️ Architecture Overview

MercadoSniper follows a modern **Service-Oriented Frontend Architecture (SOFEA)** with clear separation between the intelligent backend services and the responsive frontend application.

### Architecture Benefits:
- **High-Performance Backend**: Async FastAPI with Python for data processing and scraping
- **Modern Frontend**: Next.js 13+ with TypeScript for rich user interactions
- **Real-Time Communication**: WebSocket integration for live updates
- **Scalable Design**: Independent deployment of frontend and backend services
- **Production-Ready**: Comprehensive error handling, logging, and monitoring

## 🎯 Core Philosophy: The Sniper Approach

> *"Precision over complexity - because the best deals don't wait for complex systems."*

### What MercadoSniper IS:
- ✅ **Price Alert Sniper**: Set target prices, get instant notifications
- ✅ **Colombian Market Focus**: MercadoLibre Colombia vehicles exclusively
- ✅ **Real-Time Monitoring**: Live price updates and market insights
- ✅ **Data-Driven Decisions**: Analytics and trends for smart purchasing
- ✅ **Production-Ready**: Robust, scalable, and maintainable codebase

### What MercadoSniper is NOT:
- ❌ A comprehensive market analysis platform for all products
- ❌ A multi-store aggregator
- ❌ A complex business intelligence tool
- ❌ A feature-heavy dashboard with dozens of options

## 🚀 Features

### Real-Time Price Monitoring
- **Live Price Updates**: WebSocket-powered real-time price tracking
- **Historical Charts**: Interactive price trend visualization with Recharts
- **Time Series Analytics**: MongoDB time series collections for optimized performance
- **Mobile-Responsive**: Optimized for desktop, tablet, and mobile devices

### Intelligent Alert System
- **Custom Price Alerts**: Set target prices with flexible notification methods
- **Alert Performance Tracking**: Success rates and trigger analytics
- **Smart Recommendations**: ML-powered vehicle specification extraction
- **Real-Time Notifications**: Instant browser notifications with toast messages

### Advanced Search & Discovery
- **Smart Vehicle Search**: Advanced filtering by brand, year, price, location
- **Canonical Vehicle Grouping**: ML-based vehicle classification and grouping
- **Pagination**: Efficient browsing of large result sets
- **Vehicle Tracking**: Add vehicles to watchlist from search results

### Data Scraping & Management
- **Ethical Scraping**: Rate-limited, respectful data collection from MercadoLibre
- **Progress Tracking**: Real-time scraping progress with WebSocket updates
- **Stealth Capabilities**: CAPTCHA detection and anti-bot measures
- **Error Handling**: Robust scraping with retry mechanisms and logging

### Market Analytics Dashboard
- **Price Trends**: Interactive charts showing market movements
- **Geographic Analysis**: Price distribution across Colombian cities
- **Vehicle Distribution**: Insights by brand, year, and specifications
- **Time Series Analytics**: Advanced aggregation for market insights

## 🛠️ Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI 0.104+ with async/await support
- **Language**: Python 3.11+ with type hints
- **Database**: MongoDB with time series collections
- **Cache**: Redis for session and data caching
- **Real-Time**: Socket.IO for WebSocket connections
- **Scraping**: aiohttp + BeautifulSoup with stealth capabilities
- **ML**: scikit-learn + NLTK for data extraction
- **Validation**: Pydantic models with comprehensive validation
- **Server**: Uvicorn with Gunicorn for production

### Frontend (Next.js)
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for data visualization
- **State Management**: Zustand for client-side state
- **Real-Time**: Socket.io Client for live updates
- **HTTP Client**: Axios with interceptors and error handling
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **UI Components**: Headless UI for accessibility

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+ 
- Node.js 18.17.0+ 
- MongoDB (local or cloud)
- Redis (optional, for caching)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mercadosniper.git
   cd mercadosniper
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.template .env
   # Edit .env with your MongoDB settings
   
   # Start backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Configure environment
   cp .env.example .env.local
   # Edit .env.local with backend URL
   
   # Start frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Available Pages:
     - `/` - Dashboard with overview and recent activity
     - `/alerts` - Price alerts management (CRUD operations)
     - `/search` - Vehicle search with advanced filters
     - `/vehicles` - Vehicle listing and details
     - `/scraping` - Data collection interface
     - `/analytics` - Market insights and trends
     - `/canonical-vehicles` - Grouped vehicle analysis

## 🏗️ Project Structure

```
mercadosniper/
├── backend/                     # FastAPI backend application
│   ├── main.py                 # FastAPI application entry point
│   ├── core/                   # Core configuration and database
│   │   ├── config.py          # Environment configuration
│   │   └── database.py        # MongoDB and Redis setup
│   ├── models/                 # Pydantic data models
│   │   └── vehicle.py         # Vehicle, alert, and job models
│   ├── services/               # Business logic services
│   │   ├── scraping_service.py # MercadoLibre scraping logic
│   │   ├── vehicle_service.py  # Vehicle database operations
│   │   ├── ml_extraction_service.py # ML data extraction
│   │   ├── canonical_vehicle_service.py # Vehicle grouping
│   │   └── websocket_manager.py # Real-time WebSocket manager
│   ├── api/routes/             # RESTful API endpoints
│   │   ├── vehicles.py        # Vehicle CRUD operations
│   │   ├── alerts.py          # Price alerts management
│   │   ├── scraping.py        # Scraping job control
│   │   ├── analytics.py       # Market analytics
│   │   └── canonical_vehicles.py # Grouped vehicles
│   ├── tests/                  # Comprehensive test suite
│   └── requirements.txt        # Python dependencies
├── frontend/                   # Next.js frontend application
│   ├── app/                   # App Router pages
│   │   ├── alerts/           # Price alerts management
│   │   ├── analytics/        # Market analytics dashboard
│   │   ├── scraping/         # Data scraping interface
│   │   ├── search/           # Vehicle search
│   │   ├── vehicles/         # Vehicle listing and details
│   │   ├── canonical-vehicles/ # Grouped vehicle analysis
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Dashboard homepage
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable UI components
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── alerts/          # Alert management components
│   │   ├── search/          # Search and filter components
│   │   ├── scraping/        # Scraping interface components
│   │   ├── analytics/       # Analytics and chart components
│   │   └── ui/              # Basic UI components (Button, Card)
│   ├── services/            # API and WebSocket services
│   │   ├── api.ts           # REST API client
│   │   └── websocket.ts     # WebSocket client
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions and constants
│   │   ├── constants.ts     # Application constants
│   │   └── formatters.ts    # Data formatting utilities
│   └── public/              # Static assets
└── README.md                # Project documentation
```

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Custom Tailwind configuration with Colombian market colors
- **Typography**: Inter font family for modern, readable text
- **Components**: Consistent button, card, and input styles
- **Animations**: Smooth transitions and hover effects
- **Dark Mode Ready**: Prepared for dark theme implementation

### Responsive Design
- **Mobile-First**: Optimized for mobile devices with progressive enhancement
- **Breakpoints**: Tailored layouts for mobile, tablet, and desktop
- **Touch-Friendly**: Large tap targets and gesture support
- **Performance**: Optimized images and lazy loading

### Accessibility
- **WCAG Compliance**: Following web accessibility guidelines
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: High contrast ratios for readability

## 📊 Current Implementation Status

### ✅ Production-Ready Features
- **FastAPI Backend**: Complete async API with comprehensive endpoints
- **MongoDB Integration**: Time series collections for optimized analytics
- **Real-Time Updates**: WebSocket integration with Socket.IO
- **Intelligent Scraping**: Ethical MercadoLibre data collection with ML extraction
- **Vehicle Management**: Full CRUD operations with advanced search
- **Canonical Grouping**: ML-powered vehicle classification and grouping
- **Price Analytics**: Time series analytics with interactive charts
- **Alert System**: Comprehensive price alert management
- **Responsive Frontend**: Mobile-optimized React components
- **Type Safety**: Comprehensive TypeScript implementation across the stack
- **Error Handling**: Graceful error states and comprehensive logging
- **Testing Suite**: Extensive backend testing with pytest

### 🚧 Planned Enhancements
- **User Authentication**: JWT-based authentication system
- **Advanced Notifications**: Email and SMS alert delivery
- **Machine Learning**: Price prediction models
- **Mobile App**: React Native application
- **Browser Extension**: Chrome extension for price checking
- **API Rate Limiting**: Advanced throttling and quotas

## 🔧 Development

### Backend Development
```bash
cd backend

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/ -v

# Check code quality
black .
isort .
flake8 .
```

### Frontend Development
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### API Documentation
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🚀 Deployment

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=mercadosniper
REDIS_URL=redis://localhost:6379
DEBUG=false
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=MercadoSniper
```

## 📈 Performance Metrics

### Backend Performance
- **API Response Time**: <100ms average
- **Scraping Speed**: ~50 vehicles/minute
- **WebSocket Latency**: <50ms
- **Database Queries**: Optimized with indexes and time series

### Frontend Performance
- **First Contentful Paint**: <2 seconds
- **Largest Contentful Paint**: <4 seconds
- **Cumulative Layout Shift**: <0.1
- **Time to Interactive**: <5 seconds
- **Bundle Size**: <500KB gzipped

## 🔒 Security & Privacy

### Data Protection
- **Input Validation**: Comprehensive Pydantic model validation
- **Environment Variables**: Secure configuration management
- **HTTPS Only**: Secure communication in production
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Sanitization**: No sensitive data in error responses

### Ethical Scraping
- **Rate Limiting**: Respectful 1.5-4 second intervals between requests
- **User-Agent Rotation**: Multiple browser user agents
- **CAPTCHA Detection**: Automatic blocking detection and graceful handling
- **Data Minimization**: Only collecting necessary vehicle information
- **Robots.txt Compliance**: Following website guidelines

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test modules
pytest tests/test_scraping.py -v
pytest tests/test_vehicle_service.py -v
```

### Frontend Testing
```bash
# Run tests (when implemented)
npm test

# Run E2E tests (when implemented)
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices for frontend
- Use Python type hints and follow PEP 8 for backend
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure responsive design for UI components
- Follow the existing architectural patterns

## 📚 API Documentation

### Key Endpoints

**Vehicle Management:**
- `GET /api/vehicles/search` - Search vehicles with filters
- `GET /api/vehicles/{id}` - Get vehicle details
- `GET /api/vehicles/{id}/price-history` - Get price history
- `POST /api/vehicles/track` - Track a new vehicle

**Scraping Operations:**
- `POST /api/scraping/start-bulk-scraping` - Start bulk scraping
- `GET /api/scraping/job/{job_id}` - Get scraping job status
- `WebSocket /ws/{client_id}` - Real-time scraping updates

**Analytics:**
- `GET /api/analytics/price-trends` - Market price trends
- `GET /api/analytics/geographic-distribution` - Price by location
- `GET /api/vehicles/analytics/time-series-summary` - Time series analytics

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mercadosniper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mercadosniper/discussions)
- **Documentation**: See `/backend/README.md` and `/frontend/README.md`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MercadoLibre Colombia** for providing the marketplace data
- **FastAPI Team** for the excellent async framework
- **Next.js Team** for the outstanding React framework
- **MongoDB** for time series collections
- **Tailwind CSS** for the utility-first CSS framework
- **Colombian Developer Community** for inspiration and feedback

---

**Built with ❤️ for Colombian vehicle hunters**

*"Precision over complexity - because the best deals don't wait for complex systems."* 
