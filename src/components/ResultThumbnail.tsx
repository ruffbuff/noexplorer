import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Image, ImageOff } from "lucide-react";

interface ResultThumbnailProps {
  src?: string;
  alt: string;
  domain: string;
  className?: string;
}

const ResultThumbnail = ({ src, alt, domain, className }: ResultThumbnailProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [shouldLoad, setShouldLoad] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setShouldLoad(true);
    }
  }, []);

  // Intersection observer ref
  const intersectionRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '50px', // Start loading 50px before it comes into view
    });
    
    observer.observe(node);
    
    // Cleanup function should be stored separately, not returned
    node.addEventListener('cleanup', () => observer.disconnect());
  }, [handleIntersection]);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setImageState('error');
  }, []);

  // Don't render if no src
  if (!src) {
    return null;
  }

  return (
    <div
      ref={intersectionRef}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted flex-shrink-0",
        "w-16 h-16 sm:w-20 sm:h-20",
        className
      )}
    >
      {shouldLoad ? (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
            crossOrigin="anonymous"
          />
          
          {/* Loading state */}
          {imageState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Error state */}
          {imageState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        // Placeholder before lazy loading
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
      )}
      
      {/* Domain indicator */}
      {domain && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 truncate">
          {domain}
        </div>
      )}
    </div>
  );
};

export default ResultThumbnail;