'use client';

import { useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

const WebVitals: React.FC = () => {
  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    const loadWebVitals = async () => {
      try {
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');
        
        const sendToAnalytics = (metric: Metric) => {
          // Console log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Web Vitals] ${metric.name}:`, metric.value);
          }
          
          // Send to analytics if available (simplified to avoid type conflicts)
          if (typeof window !== 'undefined') {
            // You can implement custom analytics tracking here
            // without conflicting with existing type definitions
          }
        };

        // Register all web vitals (using current web-vitals API)
        onCLS(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics); // INP replaced FID in web-vitals v3+
      } catch (error) {
        console.warn('Web Vitals could not be loaded:', error);
      }
    };

    loadWebVitals();
  }, []);

  return null;
};

export default WebVitals; 