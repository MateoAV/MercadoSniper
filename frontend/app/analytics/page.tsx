import type { Metadata } from 'next'
import AnalyticsPage from '@/components/analytics/AnalyticsPage'

export const metadata: Metadata = {
  title: 'Analytics - MercadoSniper',
  description: 'Market insights and price analytics for Colombian vehicle market',
}

export default function Page() {
  return <AnalyticsPage />
} 