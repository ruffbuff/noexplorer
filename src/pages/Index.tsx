import React, { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import SignatureGlow from "@/components/SignatureGlow";
import TextType from "@/components/TextType";
import { useSEO } from "@/hooks/use-seo";
import { useNetworkStatus } from "@/store/appStore";

// Lazy load heavy components for better performance
const GlitchBackground = lazy(() => import("@/components/GlitchBackground"));

const Index = () => {
  const { networkStatus, connectionQuality } = useNetworkStatus();
  
  useSEO({
    title: "Noexplorer",
    description:
      "Noexplorer is a private, autonomous AI-powered search engine. Open-source, privacy-first, and blazing fast.",
    canonical: "/",
  });

  return (
    <main className="relative w-full px-4 sm:px-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Глитч-фон на всю главную страницу (кроме футера) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-transparent via-primary/5 to-transparent" />}>
          <GlitchBackground />
        </Suspense>
      </div>
      
      <section className="relative overflow-hidden z-10 h-full flex flex-col justify-center">
        <div className="container py-6 sm:py-10 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground mb-4">
              <span className="size-2 rounded-full bg-hero-gradient animate-pulse" /> 
              <span className="hidden sm:inline">Next‑gen private search</span>
              <span className="sm:hidden">Private search</span>
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight">
              <TextType 
                text="Search, privately. Powered by autonomous AI."
                as="span"
                typingSpeed={75}
                showCursor={true}
                cursorCharacter="|"
                cursorClassName="text-primary"
                loop={false}
                initialDelay={500}
              />
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Open-source, privacy-first search that learns from your intent—without learning about you.
            </p>
          </div>

          <div className="mx-auto max-w-3xl mt-6 sm:mt-8">
            <SignatureGlow>
              <Card className="p-3 sm:p-4 md:p-6 bg-background/80 glass shadow-elevated backdrop-blur-sm">
                <CardContent className="p-0">
                  <SearchBar autoFocus={window.innerWidth > 768} />
                </CardContent>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-1">No ads</span>
                  <span className="rounded-full bg-secondary px-2 py-1">No tracking</span>
                  <span className="rounded-full bg-secondary px-2 py-1">Open-source</span>
                  
                  {/* Network status indicator */}
                  {networkStatus.online ? (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        connectionQuality > 0.7 
                          ? 'text-green-600 border-green-300' 
                          : connectionQuality > 0.4 
                          ? 'text-yellow-600 border-yellow-300' 
                          : 'text-red-600 border-red-300'
                      }`}
                    >
                      Search ready
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Offline
                    </Badge>
                  )}
                </div>
              </Card>
            </SignatureGlow>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
