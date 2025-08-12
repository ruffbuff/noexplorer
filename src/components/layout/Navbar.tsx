import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings2 } from "lucide-react";
import SettingsSheet from "@/components/settings/SettingsSheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import PrivacyIndicator from "@/components/PrivacyIndicator";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-secondary text-secondary-foreground" : "text-foreground/80 hover:text-foreground hover:bg-secondary"
  }`;

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const onTrySearch = () => {
    if (location.pathname !== "/search") navigate("/search");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img 
              src="/images/logo.svg" 
              alt="Noexplorer" 
              className="h-40 w-auto" 
            />
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Search
            </NavLink>
            {/* <NavLink to="/privacy" className={navLinkClass}>
              Privacy
            </NavLink> */}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyIndicator compact showText={false} className="hidden sm:flex" />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <SettingsSheet>
            <Button variant="ghost" size="sm">
              <Settings2 className="mr-2" /> Settings
            </Button>
          </SettingsSheet>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="hero" size="sm" onClick={onTrySearch}>
            Try Search
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
