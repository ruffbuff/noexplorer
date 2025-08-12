import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SearchBar from "@/components/SearchBar";
import ResultThumbnail from "@/components/ResultThumbnail";
import { useSEO } from "@/hooks/use-seo";
import { useSearch } from "@/hooks/useSearch";
import { usePrivacySettings } from "@/store/settingsStore";
import { useAppStore } from "@/store/appStore";

const Search = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  
  // Use the search hook
  const {
    results,
    loading,
    error,
    hasMore,
    totalCount,
    searchTime,
    search,
    loadMore,
    clearSearch,
    hasResults,
    isEmpty,
    hasError
  } = useSearch();

  // Get settings
  const { privacy } = usePrivacySettings();
  const { networkStatus, incrementClickCount } = useAppStore();

  // SEO
  useSEO({
    title: q ? `Results for ${q} – Noexplorer` : "Search – Noexplorer",
    description: q
      ? `Private search results for ${q} using Noexplorer.`
      : "Private, autonomous AI-powered search with Noexplorer.",
  });

  // Perform search when query changes
  useEffect(() => {
    if (q && q.trim()) {
      search(q);
    } else {
      clearSearch();
    }
  }, [q, search, clearSearch]);

  const onClear = () => {
    setParams({});
    clearSearch();
  };

  const handleResultClick = (url: string) => {
    incrementClickCount();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderContent = useMemo(() => {
    // Loading state
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5 mt-1" />
            </Card>
          ))}
        </div>
      );
    }

    // Error state
    if (hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {error} {!networkStatus.online && "Please check your internet connection."}
          </AlertDescription>
        </Alert>
      );
    }

    // No query state
    if (!q) {
      return (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Search the web privately</h2>
          <p className="text-muted-foreground">
            Start a search above to see results from our privacy-first search engine.
          </p>
        </Card>
      );
    }

    // Empty results state
    if (isEmpty) {
      return (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            Try searching for something else or check your spelling.
          </p>
          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        </Card>
      );
    }

    // Results
    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Search stats */}
        {hasResults && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            <span>
              About {totalCount.toLocaleString()} results ({searchTime.toFixed(2)}s)
            </span>
            {hasMore && (
              <span>
                Showing {results.length} of {totalCount.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Results list */}
        {results.map((result, index) => (
          <Card key={result.id} className="hover:shadow-elevated transition-shadow cursor-pointer touch-manipulation">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div
                onClick={() => handleResultClick(result.url)}
                className="flex gap-3 w-full text-left group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResultClick(result.url);
                  }
                }}
              >
                {/* Thumbnail */}
                {result.thumbnail && (
                  <ResultThumbnail
                    src={result.thumbnail}
                    alt={result.title}
                    domain={result.domain}
                    className="mt-1"
                  />
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold group-hover:underline text-blue-600 dark:text-blue-400 mb-1 cursor-pointer line-clamp-2">
                    {result.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mb-2 break-all truncate">
                    {result.url}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {result.snippet}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {result.domain}
                    </Badge>
                    {result.metadata?.source && (
                      <Badge variant="secondary" className="text-xs">
                        {result.metadata.source}
                      </Badge>
                    )}
                    {result.metadata?.isMock && (
                      <Badge variant="destructive" className="text-xs">
                        Mock data
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load more button */}
        {hasMore && !loading && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {loading ? "Loading..." : "Load more results"}
            </Button>
          </div>
        )}
      </div>
    );
  }, [loading, hasError, error, networkStatus.online, q, isEmpty, hasResults, totalCount, searchTime, results, hasMore, loadMore, onClear, handleResultClick]);

  return (
    <main className="container py-4 sm:py-8 max-w-4xl px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
            {networkStatus.online ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {privacy.privacyLevel === 'paranoid' ? "Maximum Privacy" : "Enhanced Privacy"}
            </span>
            <span className="sm:hidden">
              {privacy.privacyLevel === 'paranoid' ? "Max" : "Enhanced"}
            </span>
          </Badge>
          {!networkStatus.online && (
            <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
              Offline
            </span>
          )}
        </div>
        
        {q && (
          <Button variant="outline" size="sm" onClick={onClear} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Clear search</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-6 sm:mb-8">
        <SearchBar initialQuery={q} />
      </div>

      {/* Content */}
      {renderContent}
    </main>
  );
};

export default Search;
