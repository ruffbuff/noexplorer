import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Search from "@/pages/Search";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastManager from "@/components/ToastManager";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { useAppStore } from "@/store/appStore";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { initializing, setInitializing } = useAppStore();

  useEffect(() => {
    // App is initialized after all stores are ready
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [setInitializing]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Noexplorer...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="astra-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {/* <GlitchBackground /> */}
            <BrowserRouter>
              <div className="min-h-screen bg-background flex flex-col relative z-10">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/privacy" element={<Privacy />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>

            {/* Toast notifications */}
            <Toaster />
            <Sonner />
            <ToastManager />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
