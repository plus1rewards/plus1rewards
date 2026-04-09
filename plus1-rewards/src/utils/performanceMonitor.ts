// Performance monitoring utility for Core Web Vitals
// This helps track real-world performance metrics

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  // Core Web Vitals thresholds
  private thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    INP: { good: 200, poor: 500 },
    TTFB: { good: 800, poor: 1800 },
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.observePerformance()
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name as keyof typeof this.thresholds]
    if (!threshold) return 'good'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private observePerformance() {
    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          
          if (lastEntry) {
            this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime)
          }
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        // Observe First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('FCP', entry.startTime)
            }
          })
        })
        fcpObserver.observe({ type: 'paint', buffered: true })

        // Observe Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          this.recordMetric('CLS', clsValue)
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ type: 'first-input', buffered: true })

        // Observe Interaction to Next Paint (INP)
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            const duration = entry.processingEnd - entry.startTime
            this.recordMetric('INP', duration)
          })
        })
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 })

      } catch (e) {
        console.warn('Performance monitoring not fully supported:', e)
      }
    }

    // Measure Time to First Byte (TTFB)
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing
        const ttfb = timing.responseStart - timing.requestStart
        this.recordMetric('TTFB', ttfb)
      })
    }
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      rating: this.getRating(name, value),
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
      console.log(`${emoji} ${name}: ${metric.value}ms (${metric.rating})`)
    }

    // Send to analytics in production (optional)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric)
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Implement your analytics integration here
    // Examples: Google Analytics, Vercel Analytics, custom endpoint
    
    // Example for Google Analytics 4:
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: metric.value,
        metric_rating: metric.rating,
        event_category: 'Web Vitals',
      })
    }

    // Example for custom endpoint:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // }).catch(() => {})
  }

  public getMetrics(): PerformanceMetric[] {
    return this.metrics
  }

  public getMetricByName(name: string): PerformanceMetric | undefined {
    return this.metrics.find(m => m.name === name)
  }

  public logSummary() {
    if (this.metrics.length === 0) {
      console.log('No performance metrics recorded yet')
      return
    }

    console.group('📊 Performance Summary')
    this.metrics.forEach(metric => {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
      console.log(`${emoji} ${metric.name}: ${metric.value}ms (${metric.rating})`)
    })
    console.groupEnd()
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Expose to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor
}

export default performanceMonitor
