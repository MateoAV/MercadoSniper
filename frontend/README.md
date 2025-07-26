# MercadoSniper Frontend

> Modern Next.js frontend for the MercadoSniper price tracking system

![MercadoSniper](https://img.shields.io/badge/MercadoSniper-Frontend-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan)

## 🚀 Features

- **Real-time Price Monitoring**: Live updates via WebSocket connections
- **Responsive Design**: Mobile-first design optimized for all devices
- **Advanced Charts**: Interactive price history visualizations
- **Smart Alerts**: Customizable price drop notifications
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **Type Safety**: Full TypeScript support for enhanced development

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **State Management**: React Hooks + Context (Ready for Zustand)
- **Icons**: Lucide React
- **Date/Time**: date-fns
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend documentation)

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   └── layout/           # Layout components
├── services/             # API and external services
│   ├── api.ts           # HTTP API client
│   └── websocket.ts     # WebSocket service
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── constants.ts     # Application constants
│   └── formatters.ts    # Data formatting utilities
└── public/              # Static assets
```

## 🎨 Components Overview

### Dashboard Components
- **DashboardPage**: Main dashboard container
- **StatsCards**: Key metrics display
- **RecentPriceDrops**: Latest price reductions
- **AlertsOverview**: Active alerts summary
- **TrackedVehicles**: Monitored vehicles list
- **PriceChart**: Price trend visualization

### Layout Components
- **MainLayout**: Application shell
- **Header**: Top navigation with search
- **Sidebar**: Main navigation menu

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Components should be functional with hooks
- Use Tailwind CSS for styling

### API Integration

The frontend communicates with the backend through:

1. **REST API**: CRUD operations via Axios
2. **WebSocket**: Real-time updates via Socket.io
3. **Authentication**: JWT token-based auth

Example API usage:
```typescript
import { apiService } from '@/services/api';

// Get dashboard data
const dashboard = await apiService.getDashboard();

// Track a new product
const product = await apiService.trackProduct(url);
```

### Real-time Updates

WebSocket service provides real-time notifications:

```typescript
import { websocketService } from '@/services/websocket';

// Listen for price updates
websocketService.on('price_update', (data) => {
  console.log('Price updated:', data);
});

// Subscribe to product updates
websocketService.subscribeToProduct(productId);
```

## 🎯 Key Features Implementation

### Price Tracking
- Real-time price monitoring
- Historical price charts
- Price change notifications
- Automatic product updates

### Alert System
- Custom price thresholds
- Multiple notification methods
- Alert management interface
- Real-time alert triggers

### Search & Filters
- Advanced vehicle search
- Multiple filter criteria
- Search history
- Saved searches

### User Interface
- Mobile-responsive design
- Dark/light theme support
- Accessible components
- Loading states & error handling

## 🔒 Security

- XSS protection via React
- CSRF protection
- Secure API token handling
- Input sanitization
- HTTPS enforcement in production

## 📱 Mobile Support

The application is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1440px+)

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NEXT_PUBLIC_API_URL=https://api.mercadosniper.com
   NEXT_PUBLIC_SOCKET_URL=https://api.mercadosniper.com
   NODE_ENV=production
   ```

3. **Deploy to your platform**
   - Vercel (recommended)
   - Netlify
   - AWS Amplify
   - Docker container

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new components
- Update documentation for new features
- Follow the existing code style
- Ensure responsive design
- Test on multiple browsers

## 📊 Performance

- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 3s
- **Time to Interactive**: < 4s
- **Cumulative Layout Shift**: < 0.1

## 🐛 Troubleshooting

### Common Issues

**API Connection Issues**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Verify environment variables
echo $NEXT_PUBLIC_API_URL
```

**WebSocket Connection Issues**
- Ensure Socket.io server is running
- Check firewall settings
- Verify CORS configuration

**Build Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Recharts](https://recharts.org/) - Chart library for React
- [Lucide](https://lucide.dev/) - Beautiful icon library

---

**Built with ❤️ for Colombian car enthusiasts** 