// PerformanceMonitor.js - Monitoraggio performance per componenti immagini
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Inizia misurazione performance
  startMeasure(key, metadata = {}) {
    if (!this.isEnabled) return;

    const startTime = performance.now();
    this.metrics.set(key, {
      startTime,
      metadata,
      status: 'running'
    });
  }

  // Termina misurazione
  endMeasure(key, additionalData = {}) {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(key);
    if (!metric) return;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(key, {
      ...metric,
      endTime,
      duration,
      status: 'completed',
      ...additionalData
    });

    // Log se la durata supera soglie
    if (duration > 1000) { // > 1 secondo
      console.warn(`Slow operation detected: ${key} took ${duration.toFixed(2)}ms`, {
        ...metric.metadata,
        ...additionalData
      });
    }

    return duration;
  }

  // Misura caricamento immagini
  measureImageLoad(imageUrl, element) {
    if (!this.isEnabled) return;

    const key = `image-load-${imageUrl}`;
    this.startMeasure(key, { imageUrl, element: element.tagName });

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === imageUrl) {
          this.endMeasure(key, {
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            networkTime: entry.responseEnd - entry.requestStart
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set(key, observer);

    // Cleanup dopo 30 secondi
    setTimeout(() => {
      const obs = this.observers.get(key);
      if (obs) {
        obs.disconnect();
        this.observers.delete(key);
      }
    }, 30000);
  }

  // Misura rendering componenti
  measureComponentRender(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();

    const key = `component-render-${componentName}-${Date.now()}`;
    this.startMeasure(key, { componentName });

    const result = renderFunction();

    // Se è una Promise, aspetta il completamento
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        this.endMeasure(key);
      });
    } else {
      this.endMeasure(key);
      return result;
    }
  }

  // Misura operazioni API
  measureApiCall(endpoint, requestFunction) {
    if (!this.isEnabled) return requestFunction();

    const key = `api-call-${endpoint}-${Date.now()}`;
    this.startMeasure(key, { endpoint });

    const result = requestFunction();

    if (result && typeof result.then === 'function') {
      return result
        .then((response) => {
          this.endMeasure(key, { 
            success: true, 
            status: response.status || 'unknown' 
          });
          return response;
        })
        .catch((error) => {
          this.endMeasure(key, { 
            success: false, 
            error: error.message 
          });
          throw error;
        });
    } else {
      this.endMeasure(key, { success: true });
      return result;
    }
  }

  // Ottieni metriche per categoria
  getMetrics(category = null) {
    if (!this.isEnabled) return [];

    const allMetrics = Array.from(this.metrics.entries()).map(([key, data]) => ({
      key,
      ...data
    }));

    if (category) {
      return allMetrics.filter(metric => metric.key.includes(category));
    }

    return allMetrics;
  }

  // Ottieni statistiche aggregate
  getStats() {
    if (!this.isEnabled) return null;

    const metrics = this.getMetrics();
    const completed = metrics.filter(m => m.status === 'completed');

    if (completed.length === 0) return null;

    const durations = completed.map(m => m.duration);
    const imageLoads = completed.filter(m => m.key.includes('image-load'));
    const apiCalls = completed.filter(m => m.key.includes('api-call'));
    const componentRenders = completed.filter(m => m.key.includes('component-render'));

    return {
      total: {
        count: completed.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations)
      },
      imageLoads: {
        count: imageLoads.length,
        avgDuration: imageLoads.length > 0 
          ? imageLoads.reduce((sum, m) => sum + m.duration, 0) / imageLoads.length 
          : 0,
        avgTransferSize: imageLoads.length > 0
          ? imageLoads.reduce((sum, m) => sum + (m.transferSize || 0), 0) / imageLoads.length
          : 0
      },
      apiCalls: {
        count: apiCalls.length,
        avgDuration: apiCalls.length > 0
          ? apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length
          : 0,
        successRate: apiCalls.length > 0
          ? apiCalls.filter(m => m.success).length / apiCalls.length
          : 0
      },
      componentRenders: {
        count: componentRenders.length,
        avgDuration: componentRenders.length > 0
          ? componentRenders.reduce((sum, m) => sum + m.duration, 0) / componentRenders.length
          : 0
      }
    };
  }

  // Genera report performance
  generateReport() {
    if (!this.isEnabled) return 'Performance monitoring disabled';

    const stats = this.getStats();
    if (!stats) return 'No performance data available';

    return `
Performance Report:
==================

Total Operations: ${stats.total.count}
Average Duration: ${stats.total.avgDuration.toFixed(2)}ms
Min Duration: ${stats.total.minDuration.toFixed(2)}ms
Max Duration: ${stats.total.maxDuration.toFixed(2)}ms

Image Loading:
- Count: ${stats.imageLoads.count}
- Average Duration: ${stats.imageLoads.avgDuration.toFixed(2)}ms
- Average Transfer Size: ${(stats.imageLoads.avgTransferSize / 1024).toFixed(2)}KB

API Calls:
- Count: ${stats.apiCalls.count}
- Average Duration: ${stats.apiCalls.avgDuration.toFixed(2)}ms
- Success Rate: ${(stats.apiCalls.successRate * 100).toFixed(1)}%

Component Renders:
- Count: ${stats.componentRenders.count}
- Average Duration: ${stats.componentRenders.avgDuration.toFixed(2)}ms
    `.trim();
  }

  // Pulisce metriche vecchie
  cleanup(maxAge = 5 * 60 * 1000) { // 5 minuti default
    if (!this.isEnabled) return;

    const now = Date.now();
    
    for (const [key, metric] of this.metrics.entries()) {
      if (metric.startTime && (now - metric.startTime) > maxAge) {
        this.metrics.delete(key);
      }
    }

    // Disconnetti observers orfani
    for (const [key, observer] of this.observers.entries()) {
      if (!this.metrics.has(key)) {
        observer.disconnect();
        this.observers.delete(key);
      }
    }
  }

  // Abilita/disabilita monitoraggio
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.cleanup(0); // Pulisce tutto
    }
  }

  // Esporta metriche per analisi esterna
  exportMetrics() {
    if (!this.isEnabled) return null;

    return {
      timestamp: Date.now(),
      metrics: Array.from(this.metrics.entries()),
      stats: this.getStats()
    };
  }
}

// Istanza singleton
const performanceMonitor = new PerformanceMonitor();

// Hook React per monitoraggio performance
export const usePerformanceMonitor = () => {
  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
    measureImageLoad: performanceMonitor.measureImageLoad.bind(performanceMonitor),
    measureComponentRender: performanceMonitor.measureComponentRender.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    cleanup: performanceMonitor.cleanup.bind(performanceMonitor)
  };
};

// Componente React per visualizzare statistiche performance
export const PerformanceStats = ({ className = "" }) => {
  const { getStats, generateReport } = usePerformanceMonitor();
  const [stats, setStats] = React.useState(null);
  const [showReport, setShowReport] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [getStats]);

  if (!stats || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg text-xs font-mono ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">Performance Monitor</h4>
        <button
          onClick={() => setShowReport(!showReport)}
          className="text-blue-400 hover:text-blue-300"
        >
          {showReport ? 'Hide' : 'Show'} Report
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-green-400">Images: {stats.imageLoads.count}</div>
          <div className="text-blue-400">API: {stats.apiCalls.count}</div>
        </div>
        <div>
          <div className="text-yellow-400">Avg: {stats.total.avgDuration.toFixed(0)}ms</div>
          <div className="text-red-400">Max: {stats.total.maxDuration.toFixed(0)}ms</div>
        </div>
      </div>

      {showReport && (
        <pre className="mt-4 text-xs overflow-auto max-h-64 bg-gray-800 p-2 rounded">
          {generateReport()}
        </pre>
      )}
    </div>
  );
};

export default performanceMonitor;

