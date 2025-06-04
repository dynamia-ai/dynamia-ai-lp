import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  quality?: number;
}

// Optimized Image component with lazy loading and proper sizing
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  quality = 80
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      loading={priority ? "eager" : "lazy"}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        objectFit: 'contain',
        width: '100%',
        height: 'auto'
      }}
    />
  );
};

// Preload critical resources
export const ResourcePreloader: React.FC = () => {
  return (
    <>
      {/* Preload critical CSS */}
      <link
        rel="preload"
        href="/fonts/geist-sans.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* Preload hero image */}
      <link
        rel="preload"
        href="/images/withhami.gif"
        as="image"
      />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
      
      {/* Preconnect to critical third parties */}
      <link rel="preconnect" href="https://vercel.live" />
      <link rel="preconnect" href="https://vitals.vercel-analytics.com" />
    </>
  );
};

// Critical CSS inlining component
export const CriticalCSS: React.FC = () => {
  return (
    <style jsx>{`
      /* Critical above-the-fold styles */
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .hero-section {
        min-height: 50vh;
        display: flex;
        align-items: center;
      }
      
      /* Remove layout shift */
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* Loading state */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
};

export default OptimizedImage; 