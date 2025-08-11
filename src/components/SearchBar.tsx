import { FormEvent, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
}

const SearchBar = ({ initialQuery = "", autoFocus = false }: SearchBarProps) => {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { loading } = useSearch();
  const previousInitialQuery = useRef(initialQuery);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local state when initialQuery changes (from URL params)
  useEffect(() => {
    if (initialQuery !== previousInitialQuery.current) {
      setQ(initialQuery);
      previousInitialQuery.current = initialQuery;
    }
  }, [initialQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    
    // Navigate to search page with query
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    
    // Handle typing animation
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 w-full">
      <div className={cn(
        "relative flex-1",
        !loading && "search-border-animation"
      )}>
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground transition-colors z-20",
          (isFocused || q) && "text-primary"
        )} />
        <Input
          value={q}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search privately with Noexplorer..."
          className={cn(
            "h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg pl-9 sm:pl-10 search-input-enhanced touch-manipulation",
            loading && "cursor-wait"
          )}
          autoFocus={autoFocus}
          aria-label="Search"
          disabled={loading}
        />
      </div>
      <Button 
        type="submit" 
        variant="hero" 
        size="xl" 
        aria-label="Search"
        disabled={loading || !q.trim()}
        className={cn(
          "h-11 sm:h-12 md:h-14 min-h-[44px] px-6 sm:px-8 transition-all duration-300 touch-manipulation",
          loading && "animate-pulse"
        )}
      >
        <span className={cn(
          "text-sm sm:text-base transition-all duration-300",
          isFocused && "matrix-text"
        )}>
          <span className="hidden sm:inline">
            {loading ? "Searching..." : "Search"}
          </span>
          <span className="sm:hidden">
            {loading ? "..." : "Go"}
          </span>
        </span>
      </Button>
    </form>
  );
};

export default SearchBar;
