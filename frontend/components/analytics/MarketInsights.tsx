import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react'

interface MarketInsightsProps {
  timeRange: string
  isLoading: boolean
}

export default function MarketInsights({ timeRange, isLoading }: MarketInsightsProps) {
  // Mock insights data
  const insights = [
    {
      type: 'trend',
      icon: TrendingUp,
      title: 'Price Trend',
      description: 'Used car prices decreased by 2.3% this month',
      impact: 'positive',
      detail: 'Good time for buyers, increased inventory availability'
    },
    {
      type: 'alert',
      icon: AlertTriangle,
      title: 'Market Alert',
      description: 'Toyota Corolla prices showing high volatility',
      impact: 'warning',
      detail: 'Price swings of up to 15% in the last 7 days'
    },
    {
      type: 'opportunity',
      icon: Target,
      title: 'Best Opportunity',
      description: 'Nissan Sentra models have the highest alert success rate',
      impact: 'positive',
      detail: '78% of price drop alerts triggered successfully'
    },
    {
      type: 'seasonal',
      icon: Calendar,
      title: 'Seasonal Pattern',
      description: 'January typically shows 12% more listings',
      impact: 'neutral',
      detail: 'Peak selling season with higher inventory turnover'
    }
  ]

  const quickStats = [
    {
      label: 'Best Day to Buy',
      value: 'Wednesday',
      subtext: '8% lower avg prices'
    },
    {
      label: 'Peak Listing Time',
      value: '6-8 PM',
      subtext: '34% of new listings'
    },
    {
      label: 'Price Drop Frequency',
      value: 'Every 5.2 days',
      subtext: 'On tracked vehicles'
    },
    {
      label: 'Negotiation Success',
      value: '23%',
      subtext: 'Avg price reduction'
    }
  ]

  const marketRecommendations = [
    {
      category: 'For Buyers',
      recommendations: [
        'Set alerts for Toyota Corolla 2020-2022 models',
        'Best prices found in Pereira and Manizales',
        'Wednesday and Thursday show lowest average prices',
        'Consider vehicles with 50k-80k km for best value'
      ]
    },
    {
      category: 'For Sellers',
      recommendations: [
        'List vehicles on Friday-Sunday for maximum visibility',
        'Bogotá and Medellín offer highest selling prices',
        'Price competitively within 5% of market average',
        'Include detailed photos to increase inquiries by 40%'
      ]
    }
  ]

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-orange-600 bg-orange-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return CheckCircle
      case 'warning': return AlertTriangle
      case 'negative': return TrendingDown
      default: return Info
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center mb-2">
              <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Market Insights</h4>
        {insights.map((insight, index) => {
          const IconComponent = insight.icon
          const ImpactIcon = getImpactIcon(insight.impact)
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start">
                <div className={`p-1.5 rounded-lg mr-3 ${getImpactColor(insight.impact)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h5 className="text-sm font-medium text-gray-900 mr-2">
                      {insight.title}
                    </h5>
                    <ImpactIcon className={`h-3 w-3 ${
                      insight.impact === 'positive' ? 'text-green-600' :
                      insight.impact === 'warning' ? 'text-orange-600' :
                      insight.impact === 'negative' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{insight.description}</p>
                  <p className="text-xs text-gray-500">{insight.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Market Facts</h4>
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
        <div className="space-y-4">
          {marketRecommendations.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Target className="h-4 w-4 text-blue-600 mr-2" />
                {section.category}
              </h5>
              <ul className="space-y-1">
                {section.recommendations.map((rec, recIndex) => (
                  <li key={recIndex} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Market Health Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-green-900">Market Health: Excellent</h4>
            <p className="text-xs text-green-800 mt-1">
              High inventory, stable prices, and strong alert performance indicate a healthy market environment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 